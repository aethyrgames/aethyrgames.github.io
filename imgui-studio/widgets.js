// Widget catalog. One entry per ImGui construct, and it is the single source
// of truth for the palette, the property inspector, and the C++ generator. The
// engine's dispatch in engine/main.cpp is the one hand-written consumer, so a
// key added here needs a matching branch there.
//
// props: [key, type, default, opts?]  types: text int float bool enum items
// leaves    -> code(n, v, id) returns an array of lines
// containers-> code(n, v, id) returns { open: [...], pop?, close?, braced? }
//              braced containers wrap children in { } and emit `pop` inside.

// A C++ string literal can't span lines, so control characters have to be
// escaped rather than passed through from a label.
const ESCAPES = { '\\': '\\\\', '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
const q = s => '"' + String(s ?? '').replace(/[\\"\n\r\t]/g, c => ESCAPES[c])
  .replace(/[\x00-\x1F\x7F]/g, '') + '"';

// Appending ".0f" to an exponent form like "1e+21" is not a valid literal.
const f = x => {
  const v = Number(x);
  if (!Number.isFinite(v)) return '0.0f';
  const s = String(v);
  if (/[eE]/.test(s)) return s + 'f';
  return Number.isInteger(v) ? s + '.0f' : s + 'f';
};
// Truncation, to match the engine's (int) cast rather than rounding away from it.
const iv = x => {
  const v = Number(x);
  return String(Number.isFinite(v) ? Math.trunc(v) : 0);
};
const clamp = (x, lo, hi) => {
  const v = Number(x);
  return !Number.isFinite(v) ? lo : Math.min(hi, Math.max(lo, Math.trunc(v)));
};
const comps = n => clamp(n, 1, 4);
const sfx = n => (n > 1 ? String(n) : '');
const ref = (v, n) => (n > 1 ? `state.${v}` : `&state.${v}`);
const decl = (t, v, n, init) =>
  n > 1 ? `${t} ${v}[${n}] = { ${Array(n).fill(init).join(', ')} };` : `${t} ${v} = ${init};`;
const vecN = [['n', 'enum', 1, [1, 2, 3, 4]]];
const DIRS = [['Left', 0], ['Right', 1], ['Up', 2], ['Down', 3]];

const WIDGETS = {
  // ---------------------------------------------------------------- Window
  window: {
    name: 'Window', cat: 'Window', hidden: true, container: true,
    props: [
      ['label', 'text', 'My Panel'], ['w', 'float', 380], ['h', 'float', 460],
      ['noTitleBar', 'bool', false], ['noResize', 'bool', false], ['noMove', 'bool', false],
      ['noScrollbar', 'bool', false], ['noCollapse', 'bool', false], ['autoResize', 'bool', false],
    ],
  },

  // ------------------------------------------------------------------ Text
  text: {
    name: 'Text', cat: 'Text', props: [['label', 'text', 'Some text']],
    code: n => [`ImGui::TextUnformatted(${q(n.label)});`],
  },
  textcolored: {
    name: 'Text colored', cat: 'Text',
    props: [['label', 'text', 'Colored text'], ['r', 'float', 1], ['g', 'float', 0.8], ['b', 'float', 0.2]],
    code: n => [`ImGui::TextColored(ImVec4(${f(n.r)}, ${f(n.g)}, ${f(n.b)}, 1.0f), "%s", ${q(n.label)});`],
  },
  textdisabled: {
    name: 'Text disabled', cat: 'Text', props: [['label', 'text', 'Disabled text']],
    code: n => [`ImGui::TextDisabled("%s", ${q(n.label)});`],
  },
  textwrapped: {
    name: 'Text wrapped', cat: 'Text', props: [['label', 'text', 'A longer line of text that wraps.']],
    code: n => [`ImGui::TextWrapped("%s", ${q(n.label)});`],
  },
  labeltext: {
    name: 'Label text', cat: 'Text', props: [['label', 'text', 'Label'], ['value', 'text', 'value']],
    code: (n, v, id) => [`ImGui::LabelText(${id}, "%s", ${q(n.value)});`],
  },
  bullettext: {
    name: 'Bullet text', cat: 'Text', props: [['label', 'text', 'Bullet item']],
    code: n => [`ImGui::BulletText("%s", ${q(n.label)});`],
  },
  separatortext: {
    name: 'Separator text', cat: 'Text', props: [['label', 'text', 'Section']],
    code: n => [`ImGui::SeparatorText(${q(n.label)});`],
  },
  bullet: { name: 'Bullet', cat: 'Text', props: [], code: () => ['ImGui::Bullet();'] },

  // --------------------------------------------------------------- Buttons
  button: {
    name: 'Button', cat: 'Buttons',
    props: [['label', 'text', 'Click me'], ['w', 'float', 0], ['h', 'float', 0]],
    code: (n, v, id) => [
      `if (ImGui::Button(${id}${n.w || n.h ? `, ImVec2(${f(n.w)}, ${f(n.h)})` : ''}))`,
      `{`, `    // TODO: ${v}`, `}`,
    ],
  },
  smallbutton: {
    name: 'Small button', cat: 'Buttons', props: [['label', 'text', 'Small']],
    code: (n, v, id) => [`if (ImGui::SmallButton(${id})) { /* TODO: ${v} */ }`],
  },
  arrowbutton: {
    name: 'Arrow button', cat: 'Buttons',
    props: [['label', 'text', 'arrow'], ['dir', 'enum', 1, DIRS]],
    code: (n, v, id) => [
      `if (ImGui::ArrowButton(${id}, ImGuiDir_${(DIRS.find(d => d[1] === Number(n.dir)) || DIRS[1])[0]})) { /* TODO: ${v} */ }`,
    ],
  },
  checkbox: {
    name: 'Checkbox', cat: 'Buttons', props: [['label', 'text', 'Enable thing']],
    field: (n, v) => `bool ${v} = false;`,
    code: (n, v, id) => [`ImGui::Checkbox(${id}, &state.${v});`],
  },
  radiobutton: {
    name: 'Radio button', cat: 'Buttons',
    props: [['label', 'text', 'Option'], ['group', 'text', 'choice'], ['value', 'int', 0]],
    // every radio in a group shares one backing int
    fieldName: n => n.group || 'choice',
    field: (n, v) => `int ${v} = 0;`,
    code: (n, v, id) => [`ImGui::RadioButton(${id}, &state.${v}, ${iv(n.value)});`],
  },
  progressbar: {
    // An empty label keeps ImGui's default "40%" overlay; setting one replaces it.
    name: 'Progress bar', cat: 'Buttons',
    props: [['label', 'text', ''], ['fraction', 'float', 0.4], ['w', 'float', 0]],
    field: (n, v) => `float ${v} = ${f(n.fraction)};`,
    code: (n, v) => [
      `ImGui::ProgressBar(state.${v}, ImVec2(${n.w > 0 ? f(n.w) : '-1.0f'}, 0.0f)` +
      `${n.label ? ', ' + q(n.label) : ''});`,
    ],
  },

  // ----------------------------------------------------------------- Input
  inputtext: {
    name: 'Input text', cat: 'Input', props: [['label', 'text', 'Name']],
    field: (n, v) => `char ${v}[256] = "";`,
    code: (n, v, id) => [`ImGui::InputText(${id}, state.${v}, IM_ARRAYSIZE(state.${v}));`],
  },
  inputtextmultiline: {
    name: 'Input multiline', cat: 'Input',
    props: [['label', 'text', 'Notes'], ['w', 'float', 0], ['h', 'float', 80]],
    field: (n, v) => `char ${v}[1024] = "";`,
    code: (n, v, id) => [
      `ImGui::InputTextMultiline(${id}, state.${v}, IM_ARRAYSIZE(state.${v}), ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },
  inputtextwithhint: {
    name: 'Input with hint', cat: 'Input',
    props: [['label', 'text', 'Search'], ['hint', 'text', 'type here...']],
    field: (n, v) => `char ${v}[256] = "";`,
    code: (n, v, id) => [`ImGui::InputTextWithHint(${id}, ${q(n.hint)}, state.${v}, IM_ARRAYSIZE(state.${v}));`],
  },
  inputint: {
    name: 'Input int', cat: 'Input', props: [['label', 'text', 'Count'], ...vecN],
    field: (n, v) => decl('int', v, comps(n.n), '0'),
    code: (n, v, id) => [`ImGui::InputInt${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))});`],
  },
  inputfloat: {
    name: 'Input float', cat: 'Input', props: [['label', 'text', 'Amount'], ...vecN],
    field: (n, v) => decl('float', v, comps(n.n), '0.0f'),
    code: (n, v, id) => [`ImGui::InputFloat${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))});`],
  },
  inputdouble: {
    name: 'Input double', cat: 'Input', props: [['label', 'text', 'Precise']],
    field: (n, v) => `double ${v} = 0.0;`,
    code: (n, v, id) => [`ImGui::InputDouble(${id}, &state.${v});`],
  },

  // --------------------------------------------------------------- Sliders
  sliderfloat: {
    name: 'Slider float', cat: 'Sliders',
    props: [['label', 'text', 'Value'], ...vecN, ['min', 'float', 0], ['max', 'float', 1]],
    field: (n, v) => decl('float', v, comps(n.n), f(n.min)),
    code: (n, v, id) => [`ImGui::SliderFloat${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${f(n.min)}, ${f(n.max)});`],
  },
  sliderint: {
    name: 'Slider int', cat: 'Sliders',
    props: [['label', 'text', 'Count'], ...vecN, ['min', 'int', 0], ['max', 'int', 100]],
    field: (n, v) => decl('int', v, comps(n.n), iv(n.min)),
    code: (n, v, id) => [`ImGui::SliderInt${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${iv(n.min)}, ${iv(n.max)});`],
  },
  sliderangle: {
    name: 'Slider angle', cat: 'Sliders',
    props: [['label', 'text', 'Angle'], ['min', 'float', -360], ['max', 'float', 360]],
    field: (n, v) => `float ${v} = 0.0f;`,
    code: (n, v, id) => [`ImGui::SliderAngle(${id}, &state.${v}, ${f(n.min)}, ${f(n.max)});`],
  },
  vsliderfloat: {
    name: 'V-slider float', cat: 'Sliders',
    props: [['label', 'text', 'Vol'], ['w', 'float', 24], ['h', 'float', 120], ['min', 'float', 0], ['max', 'float', 1]],
    field: (n, v) => `float ${v} = ${f(n.min)};`,
    code: (n, v, id) => [`ImGui::VSliderFloat(${id}, ImVec2(${f(n.w)}, ${f(n.h)}), &state.${v}, ${f(n.min)}, ${f(n.max)});`],
  },
  vsliderint: {
    name: 'V-slider int', cat: 'Sliders',
    props: [['label', 'text', 'Level'], ['w', 'float', 24], ['h', 'float', 120], ['min', 'int', 0], ['max', 'int', 100]],
    field: (n, v) => `int ${v} = ${iv(n.min)};`,
    code: (n, v, id) => [`ImGui::VSliderInt(${id}, ImVec2(${f(n.w)}, ${f(n.h)}), &state.${v}, ${iv(n.min)}, ${iv(n.max)});`],
  },

  // ----------------------------------------------------------------- Drags
  dragfloat: {
    name: 'Drag float', cat: 'Drags',
    props: [['label', 'text', 'Value'], ...vecN, ['speed', 'float', 0.01], ['min', 'float', 0], ['max', 'float', 1]],
    field: (n, v) => decl('float', v, comps(n.n), f(n.min)),
    code: (n, v, id) => [`ImGui::DragFloat${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${f(n.speed)}, ${f(n.min)}, ${f(n.max)});`],
  },
  dragint: {
    name: 'Drag int', cat: 'Drags',
    props: [['label', 'text', 'Count'], ...vecN, ['speed', 'float', 1], ['min', 'int', 0], ['max', 'int', 100]],
    field: (n, v) => decl('int', v, comps(n.n), iv(n.min)),
    code: (n, v, id) => [`ImGui::DragInt${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${f(n.speed)}, ${iv(n.min)}, ${iv(n.max)});`],
  },
  dragfloatrange2: {
    name: 'Drag float range', cat: 'Drags',
    props: [['label', 'text', 'Range'], ['speed', 'float', 0.01], ['min', 'float', 0], ['max', 'float', 1]],
    field: (n, v) => [`float ${v}Min = ${f(n.min)};`, `float ${v}Max = ${f(n.max)};`],
    code: (n, v, id) => [`ImGui::DragFloatRange2(${id}, &state.${v}Min, &state.${v}Max, ${f(n.speed)}, ${f(n.min)}, ${f(n.max)});`],
  },
  dragintrange2: {
    name: 'Drag int range', cat: 'Drags',
    props: [['label', 'text', 'Range'], ['speed', 'float', 1], ['min', 'int', 0], ['max', 'int', 100]],
    field: (n, v) => [`int ${v}Min = ${iv(n.min)};`, `int ${v}Max = ${iv(n.max)};`],
    code: (n, v, id) => [`ImGui::DragIntRange2(${id}, &state.${v}Min, &state.${v}Max, ${f(n.speed)}, ${iv(n.min)}, ${iv(n.max)});`],
  },

  // ----------------------------------------------------------------- Color
  coloredit: {
    name: 'Color edit', cat: 'Color',
    props: [['label', 'text', 'Tint'], ['n', 'enum', 3, [3, 4]]],
    field: (n, v) => decl('float', v, Number(n.n) === 4 ? 4 : 3, '1.0f'),
    code: (n, v, id) => [`ImGui::ColorEdit${Number(n.n) === 4 ? 4 : 3}(${id}, state.${v});`],
  },
  colorpicker: {
    name: 'Color picker', cat: 'Color',
    props: [['label', 'text', 'Pick'], ['n', 'enum', 3, [3, 4]]],
    field: (n, v) => decl('float', v, Number(n.n) === 4 ? 4 : 3, '1.0f'),
    code: (n, v, id) => [`ImGui::ColorPicker${Number(n.n) === 4 ? 4 : 3}(${id}, state.${v});`],
  },
  colorbutton: {
    name: 'Color button', cat: 'Color',
    props: [['label', 'text', 'swatch'], ['w', 'float', 0], ['h', 'float', 0]],
    field: (n, v) => `float ${v}[4] = { 1.0f, 1.0f, 1.0f, 1.0f };`,
    code: (n, v, id) => [
      `ImGui::ColorButton(${id}, ImVec4(state.${v}[0], state.${v}[1], state.${v}[2], state.${v}[3]), 0, ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },

  // ---------------------------------------------------------------- Choice
  combo: {
    name: 'Combo', cat: 'Choice',
    props: [['label', 'text', 'Mode'], ['items', 'items', 'One, Two, Three']],
    field: (n, v) => `int ${v} = 0;`,
    code: (n, v, id) => [
      `static const char* ${v}Items[] = { ${itemList(n.items)} };`,
      `ImGui::Combo(${id}, &state.${v}, ${v}Items, IM_ARRAYSIZE(${v}Items));`,
    ],
  },
  listbox: {
    name: 'List box', cat: 'Choice',
    props: [['label', 'text', 'Items'], ['items', 'items', 'One, Two, Three']],
    field: (n, v) => `int ${v} = 0;`,
    code: (n, v, id) => [
      `static const char* ${v}Items[] = { ${itemList(n.items)} };`,
      `ImGui::ListBox(${id}, &state.${v}, ${v}Items, IM_ARRAYSIZE(${v}Items));`,
    ],
  },
  selectable: {
    name: 'Selectable', cat: 'Choice', props: [['label', 'text', 'Selectable']],
    field: (n, v) => `bool ${v} = false;`,
    code: (n, v, id) => [`ImGui::Selectable(${id}, &state.${v});`],
  },

  // ----------------------------------------------------------------- Plots
  plotlines: {
    name: 'Plot lines', cat: 'Plots',
    props: [['label', 'text', 'Signal'], ['w', 'float', 0], ['h', 'float', 60]],
    field: (n, v) => `float ${v}[64] = {};   // fill with your samples`,
    code: (n, v, id) => [
      `ImGui::PlotLines(${id}, state.${v}, IM_ARRAYSIZE(state.${v}), 0, nullptr, -1.0f, 1.0f, ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },
  plothistogram: {
    name: 'Plot histogram', cat: 'Plots',
    props: [['label', 'text', 'Buckets'], ['w', 'float', 0], ['h', 'float', 60]],
    field: (n, v) => `float ${v}[64] = {};   // fill with your samples`,
    code: (n, v, id) => [
      `ImGui::PlotHistogram(${id}, state.${v}, IM_ARRAYSIZE(state.${v}), 0, nullptr, -1.0f, 1.0f, ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },

  // ---------------------------------------------------------------- Layout
  separator: { name: 'Separator', cat: 'Layout', props: [], code: () => ['ImGui::Separator();'] },
  spacing: { name: 'Spacing', cat: 'Layout', props: [], code: () => ['ImGui::Spacing();'] },
  newline: { name: 'New line', cat: 'Layout', props: [], code: () => ['ImGui::NewLine();'] },
  dummy: {
    name: 'Dummy', cat: 'Layout', props: [['w', 'float', 40], ['h', 'float', 20]],
    code: n => [`ImGui::Dummy(ImVec2(${f(n.w)}, ${f(n.h)}));`],
  },
  indent: {
    name: 'Indent', cat: 'Layout', props: [['w', 'float', 0]],
    code: n => [`ImGui::Indent(${f(n.w)});`],
  },
  unindent: {
    name: 'Unindent', cat: 'Layout', props: [['w', 'float', 0]],
    code: n => [`ImGui::Unindent(${f(n.w)});`],
  },
  aligntext: {
    name: 'Align text', cat: 'Layout', props: [],
    code: () => ['ImGui::AlignTextToFramePadding();'],
  },

  // ------------------------------------------------------------ Containers
  group: {
    name: 'Group', cat: 'Containers', container: true, props: [],
    code: () => ({ open: ['ImGui::BeginGroup();'], close: 'ImGui::EndGroup();', braced: false }),
  },
  child: {
    name: 'Child region', cat: 'Containers', container: true,
    props: [['label', 'text', 'child'], ['w', 'float', 0], ['h', 'float', 120]],
    code: (n, v, id) => ({
      // BeginChild must always be paired with EndChild, whatever it returns
      open: [`ImGui::BeginChild(${id}, ImVec2(${f(n.w)}, ${f(n.h)}), ImGuiChildFlags_Borders);`],
      close: 'ImGui::EndChild();', braced: false,
    }),
  },
  treenode: {
    name: 'Tree node', cat: 'Containers', container: true, props: [['label', 'text', 'Tree node']],
    code: (n, v, id) => ({ open: [`if (ImGui::TreeNode(${id}))`], pop: 'ImGui::TreePop();', braced: true }),
  },
  collapsingheader: {
    name: 'Collapsing header', cat: 'Containers', container: true, props: [['label', 'text', 'Header']],
    // CollapsingHeader has no matching pop call
    code: (n, v, id) => ({ open: [`if (ImGui::CollapsingHeader(${id}))`], braced: true }),
  },
  tabbar: {
    name: 'Tab bar', cat: 'Containers', container: true, props: [['label', 'text', 'tabs']],
    code: (n, v, id) => ({ open: [`if (ImGui::BeginTabBar(${id}))`], pop: 'ImGui::EndTabBar();', braced: true }),
  },
  tabitem: {
    name: 'Tab item', cat: 'Containers', container: true, props: [['label', 'text', 'Tab']],
    code: (n, v, id) => ({ open: [`if (ImGui::BeginTabItem(${id}))`], pop: 'ImGui::EndTabItem();', braced: true }),
  },
  table: {
    name: 'Table', cat: 'Containers', container: true, cells: true,
    props: [['label', 'text', 'table'], ['cols', 'int', 2]],
    code: (n, v, id) => ({
      open: [`if (ImGui::BeginTable(${id}, ${clamp(n.cols, 1, 64)}, ImGuiTableFlags_Borders | ImGuiTableFlags_RowBg))`],
      pop: 'ImGui::EndTable();', braced: true,
    }),
  },

  // ----------------------------------------------------------------- Menus
  menubar: {
    name: 'Menu bar', cat: 'Menus', container: true, props: [],
    code: () => ({ open: ['if (ImGui::BeginMenuBar())'], pop: 'ImGui::EndMenuBar();', braced: true }),
  },
  menu: {
    name: 'Menu', cat: 'Menus', container: true, props: [['label', 'text', 'File']],
    code: (n, v, id) => ({ open: [`if (ImGui::BeginMenu(${id}))`], pop: 'ImGui::EndMenu();', braced: true }),
  },
  menuitem: {
    name: 'Menu item', cat: 'Menus',
    props: [['label', 'text', 'Open'], ['shortcut', 'text', 'Ctrl+O']],
    field: (n, v) => `bool ${v} = false;`,
    code: (n, v, id) => [`ImGui::MenuItem(${id}, ${q(n.shortcut)}, &state.${v});`],
  },

  // ---------------------------------------------------------------- Popups
  // The "###" suffixes keep two popups with the same label from sharing an
  // ImGui id, while the visible text stays exactly what the user typed.
  popup: {
    name: 'Popup', cat: 'Popups', container: true, props: [['label', 'text', 'Options']],
    code: (n, v) => ({
      open: [
        `if (ImGui::Button(${q('Open ' + n.label + '###btn' + v)}))`,
        `    ImGui::OpenPopup(${q(n.label + '###popup' + v)});`,
        `if (ImGui::BeginPopup(${q(n.label + '###popup' + v)}))`,
      ],
      pop: 'ImGui::EndPopup();', braced: true,
    }),
  },
  modal: {
    name: 'Modal', cat: 'Popups', container: true, props: [['label', 'text', 'Confirm']],
    code: (n, v) => ({
      open: [
        `if (ImGui::Button(${q('Open ' + n.label + '###btn' + v)}))`,
        `    ImGui::OpenPopup(${q(n.label + '###popup' + v)});`,
        `if (ImGui::BeginPopupModal(${q(n.label + '###popup' + v)}, nullptr, 0))`,
      ],
      pop: 'ImGui::EndPopup();', braced: true,
      extra: ['if (ImGui::Button("Close"))', '    ImGui::CloseCurrentPopup();'],
    }),
  },
  tooltip: {
    name: 'Tooltip', cat: 'Popups', container: true, props: [],
    // attaches to whatever item precedes it
    code: () => ({ open: ['if (ImGui::BeginItemTooltip())'], pop: 'ImGui::EndTooltip();', braced: true }),
  },
};

function itemList(s) {
  return String(s ?? '')
    .split(',')
    .map(x => q(x.trim()))
    .join(', ');
}

const CATEGORIES = ['Text', 'Buttons', 'Input', 'Sliders', 'Drags', 'Color',
  'Choice', 'Plots', 'Layout', 'Containers', 'Menus', 'Popups'];

// Arming families (docs/CONTROLS.md). A bare letter arms the family's first
// widget, pressing it again cycles forward, Shift+letter cycles backward.
// Letters must never collide with the single-key verbs (V J R) or chords.
const FAMILIES = {
  B: ['button', 'smallbutton', 'arrowbutton'],
  T: ['text', 'textcolored', 'textdisabled', 'textwrapped', 'bullettext', 'separatortext'],
  C: ['checkbox', 'radiobutton', 'selectable'],
  S: ['sliderfloat', 'sliderint', 'sliderangle', 'vsliderfloat', 'vsliderint'],
  D: ['dragfloat', 'dragint', 'dragfloatrange2', 'dragintrange2'],
  I: ['inputtext', 'inputtextmultiline', 'inputtextwithhint', 'inputint', 'inputfloat', 'inputdouble'],
  P: ['coloredit', 'colorpicker', 'colorbutton'],
  L: ['combo', 'listbox', 'progressbar', 'plotlines', 'plothistogram'],
  G: ['group', 'child', 'collapsingheader', 'treenode', 'tabbar', 'table'],
  M: ['menubar', 'menu', 'menuitem', 'popup', 'modal', 'tooltip'],
};
