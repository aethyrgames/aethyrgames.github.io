// Widget catalog. One entry per ImGui construct, and it is the single source
// of truth for the palette, the property inspector, and the C++ generator. The
// engine's dispatch in engine/main.cpp is the one hand-written consumer, so a
// key added here needs a matching branch there.
//
// props: [key, type, default, opts?]  types: text int float bool enum items
// leaves    -> code(n, v, id) returns an array of lines
// containers-> code(n, v, id) returns { open: [...], pop?, close?, braced? }
//              braced containers wrap children in { } and emit `pop` inside.

// localStorage, for code that has no fallback of its own.
//
// Accessing it THROWS, not returns null, when the browser has blocked storage
// for the origin: an iframe with third-party cookies off, or private mode in
// some builds. A throw at the top level of a classic script kills the rest of
// that script, and four unguarded reads sat in boot.js and theme.js, the two
// files that finish starting the app, so the whole thing failed to load rather
// than losing a preference. Declared here because widgets.js is loaded first.
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? (fallback === undefined ? null : fallback) : v;
  } catch (e) {
    return fallback === undefined ? null : fallback;
  }
}

function lsJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch (e) { return fallback; }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
}

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
// "Audio Settings" -> "AudioSettings", for deriving a flag name from a title
const pascalId = t => String(t || '').replace(/[^A-Za-z0-9 ]/g, '')
  .split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('') || 'Window';
const sfx = n => (n > 1 ? String(n) : '');
const ref = (v, n) => (n > 1 ? `state.${v}` : `&state.${v}`);
const decl = (t, v, n, init) =>
  n > 1 ? `${t} ${v}[${n}] = { ${Array(n).fill(init).join(', ')} };` : `${t} ${v} = ${init};`;
// Metadata for numeric props: the inspector clamps to the range and prints the
// unit inside the field. 0 width means "size to content" in ImGui, so the floor
// is 0 rather than 1.
const PX = { min: 0, unit: 'px' };
// A POSITION may be negative: the sheet grows to cover wherever a window is put,
// rather than the window being pushed back onto it. Sizes keep the floor, since
// 0 means "size to content" to ImGui and below that means nothing.
const POS = { unit: 'px' };
// A user-facing unit for value widgets. ImGui takes it as the display format,
// so "cm" becomes "%.3f cm" and shows up on the slider itself. Always emitted,
// even when empty, so the parser's probe has a stable argument to attribute.
const UNIT = ['unit', 'unit', '', { placeholder: 'cm, ms, %…' }];
// The unit is concatenated into a printf format, so a % in it has to be doubled
// or it reads as a conversion spec. The placeholder above suggests "%" and the
// shipped Settings template uses it, which produced "%.3f %". A trailing lone %
// is not a valid conversion: musl, which the emscripten build uses, bails out of
// printf_core and returns -1, so the slider drew truncated text instead of
// "50.000 %". cpp.js undoubles it on the way back in.
const fmt = (n, base) => q(n.unit ? base + ' ' + String(n.unit).replace(/%/g, '%%') : base);
const SEC = { min: 0, unit: 's' };

// ImGui sizes most items for you, and SetNextItemWidth is how you override it.
// Widgets that take an explicit size argument use that instead. This covers the
// rest, so nearly everything can be resized on the canvas.
const ITEMW = ['itemw', 'float', 0, { min: 0, unit: 'px' }];

const vecN = [['n', 'enum', 1, [1, 2, 3, 4]]];
const DIRS = [['Left', 0], ['Right', 1], ['Up', 2], ['Down', 3]];

// The sample data a plot starts with.
//
// engine/main.cpp fills its preview array with sinf(i * 0.3f), and the emitted
// struct used to declare `float x[64] = {};`, all zeros. So the canvas drew a
// wave and the built app drew a flat line, which is exactly the promise this
// tool makes and breaks in one step. Emitting the same values makes the two
// agree, and the comment says plainly that it is placeholder data.
const PLOT_SAMPLES = () => {
  const vals = [];
  for (let i = 0; i < 64; i++) vals.push(Math.sin(i * 0.3).toFixed(3) + 'f');
  const rows = [];
  for (let i = 0; i < vals.length; i += 8) rows.push('    ' + vals.slice(i, i + 8).join(', '));
  return rows.join(',\n');
};

const plotField = v => `float ${v}[64] = {   // sample data, replace with your own\n`
  + `${PLOT_SAMPLES()},\n};`;

const WIDGETS = {
  // ---------------------------------------------------------------- Window
  // The document root. Holds windows and nothing else, and never appears in
  // the palette: you add windows, not roots.
  root: {
    name: 'Document', cat: 'Window', hidden: true, container: true, props: [],
  },
  window: {
    name: 'Window', cat: 'Window', container: true, rootOnly: true,
    props: [
      ['label', 'text', 'My Panel'],
      ['x', 'float', 30, POS], ['y', 'float', 30, POS],   // may be negative
      ['w', 'float', 380, PX], ['h', 'float', 460, PX],
      ['noTitleBar', 'bool', false], ['noResize', 'bool', false], ['noMove', 'bool', false],
      ['noScrollbar', 'bool', false], ['noCollapse', 'bool', false], ['autoResize', 'bool', false],
      // a closable window is one your code can hide, and ImGui gives it an X
      ['closable', 'bool', false], ['openAtStart', 'bool', true],
      // A visibility variable of your own, passed to Begin as p_open. Set it and
      // the window is closable through YOUR flag rather than a generated one.
      // The parser used to accept any `&expr` there as "closable" and silently
      // rebind it to a fresh state member, so the variable you were actually
      // controlling the window with stopped doing anything.
      ['pOpen', 'expr', '', { placeholder: '&g_ShowPanel' }],
      // Raw C++ emitted immediately before ImGui::Begin, which is the only
      // place some calls work at all: SetNextWindowBgAlpha, a PushStyleVar you
      // want to cover the window, your own SetNextWindowSizeConstraints. The
      // parser used to compute this region and then throw it away, so writing
      // any of them by hand and pressing Apply deleted them.
      ['preamble', 'longtext', '',
        { placeholder: 'C++ emitted just before ImGui::Begin' }],
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
  // ImGui::Text with real printf arguments. The content comes from variables at
  // runtime, so the document holds the format and the argument expressions
  // rather than a string, and the preview substitutes the expressions. Without
  // this, any Text() carrying a variable fell through to a raw-code placeholder.
  textfmt: {
    name: 'Text formatted', cat: 'Text',
    // the default has to be an expression that compiles on its own, since the
    // generated file is built as-is by the verify step
    // rest: the argument list is variadic, so the parser has to take every
    // remaining argument rather than the one position probing found
    props: [['format', 'text', '%s'],
      ['args', 'expr', '"text"', { placeholder: 'count, name', rest: true }]],
    // no arguments means it is just text, so emit it as such rather than
    // producing ImGui::Text("...", ) which would not compile
    code: n => (String(n.args || '').trim()
      ? [`ImGui::Text(${q(n.format)}, ${String(n.args).trim()});`]
      : [`ImGui::TextUnformatted(${q(n.format)});`]),
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
    // `toggles` names a closable window. The click flips that window's flag
    // instead of leaving a TODO, which is how one panel opens another.
    //
    // The generator resolves the name to an expression, because only it knows
    // which window owns the flag. Writing `show<Target>` here unqualified was
    // wrong twice over: it does not compile (the flag is a struct member, and
    // this code sits in a function taking `state`), and the flag it named was a
    // private copy in the CLICKING window's struct while the target guarded on
    // its own, so the button could never have worked.
    props: [['label', 'text', 'Click me'], ['w', 'float', 0, PX], ['h', 'float', 0, PX],
      ['toggles', 'text', '', { placeholder: 'window title' }]],
    code: (n, v, id, ctx) => {
      const ref = n.toggles && ctx && ctx.toggleRef ? ctx.toggleRef(n.toggles) : null;
      return [
        `if (ImGui::Button(${id}${n.w || n.h ? `, ImVec2(${f(n.w)}, ${f(n.h)})` : ''}))`,
        `{`,
        // A name that resolves to nothing falls back to the same TODO an
        // ordinary button emits, so the output stays stable across Apply
        // rather than alternating between two spellings. The generator
        // reports the dangling name separately.
        ref ? `    ${ref} = !${ref};` : `    // TODO: ${v}`,
        `}`,
      ];
    },
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
    // The group name rides along when the variable cannot carry it. It is the
    // only place the name exists in the C++, and the parser recovered it by
    // reading the camelCased variable, so "Audio Mode" came back as "audioMode"
    // the first time the generated code was applied.
    field: (n, v) => {
      const g = n.group || 'choice';
      return `int ${v} = 0;` + (g === v ? '' : `   // group: ${g}`);
    },
    code: (n, v, id) => [`ImGui::RadioButton(${id}, &state.${v}, ${iv(n.value)});`],
  },
  progressbar: {
    // An empty label keeps ImGui's default "40%" overlay. Setting one replaces it.
    name: 'Progress bar', cat: 'Buttons',
    props: [['label', 'text', ''], ['fraction', 'float', 0.4], ['w', 'float', 0, PX]],
    field: (n, v) => `float ${v} = ${f(n.fraction)};`,
    code: (n, v) => [
      `ImGui::ProgressBar(state.${v}, ImVec2(${n.w > 0 ? f(n.w) : '-1.0f'}, 0.0f)` +
      `${n.label ? ', ' + q(n.label) : ''});`,
    ],
  },

  // ----------------------------------------------------------------- Input
  inputtext: {
    name: 'Input text', cat: 'Input', props: [ITEMW, ['label', 'text', 'Name']],
    field: (n, v) => `char ${v}[256] = "";`,
    code: (n, v, id) => [`ImGui::InputText(${id}, state.${v}, IM_ARRAYSIZE(state.${v}));`],
  },
  inputtextmultiline: {
    name: 'Input multiline', cat: 'Input',
    props: [['label', 'text', 'Notes'], ['w', 'float', 0, PX], ['h', 'float', 80, PX]],
    field: (n, v) => `char ${v}[1024] = "";`,
    code: (n, v, id) => [
      `ImGui::InputTextMultiline(${id}, state.${v}, IM_ARRAYSIZE(state.${v}), ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },
  inputtextwithhint: {
    name: 'Input with hint', cat: 'Input',
    props: [ITEMW, ['label', 'text', 'Search'], ['hint', 'text', 'type here...']],
    field: (n, v) => `char ${v}[256] = "";`,
    code: (n, v, id) => [`ImGui::InputTextWithHint(${id}, ${q(n.hint)}, state.${v}, IM_ARRAYSIZE(state.${v}));`],
  },
  inputint: {
    name: 'Input int', cat: 'Input', props: [ITEMW, ['label', 'text', 'Count'], ...vecN],
    field: (n, v) => decl('int', v, comps(n.n), '0'),
    code: (n, v, id) => [`ImGui::InputInt${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))});`],
  },
  inputfloat: {
    name: 'Input float', cat: 'Input', props: [ITEMW, ['label', 'text', 'Amount'], ...vecN],
    field: (n, v) => decl('float', v, comps(n.n), '0.0f'),
    code: (n, v, id) => [`ImGui::InputFloat${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))});`],
  },
  inputdouble: {
    name: 'Input double', cat: 'Input', props: [ITEMW, ['label', 'text', 'Precise']],
    field: (n, v) => `double ${v} = 0.0;`,
    code: (n, v, id) => [`ImGui::InputDouble(${id}, &state.${v});`],
  },

  // --------------------------------------------------------------- Sliders
  sliderfloat: {
    name: 'Slider float', cat: 'Sliders',
    props: [ITEMW, ['label', 'text', 'Value'], ...vecN, ['min', 'float', 0], ['max', 'float', 1], UNIT],
    field: (n, v) => decl('float', v, comps(n.n), f(n.min)),
    code: (n, v, id) => [`ImGui::SliderFloat${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${f(n.min)}, ${f(n.max)}, ${fmt(n, '%.3f')});`],
  },
  sliderint: {
    name: 'Slider int', cat: 'Sliders',
    props: [ITEMW, ['label', 'text', 'Count'], ...vecN, ['min', 'int', 0], ['max', 'int', 100], UNIT],
    field: (n, v) => decl('int', v, comps(n.n), iv(n.min)),
    code: (n, v, id) => [`ImGui::SliderInt${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${iv(n.min)}, ${iv(n.max)}, ${fmt(n, '%d')});`],
  },
  sliderangle: {
    name: 'Slider angle', cat: 'Sliders',
    props: [ITEMW, ['label', 'text', 'Angle'], ['min', 'float', -360], ['max', 'float', 360]],
    field: (n, v) => `float ${v} = 0.0f;`,
    code: (n, v, id) => [`ImGui::SliderAngle(${id}, &state.${v}, ${f(n.min)}, ${f(n.max)});`],
  },
  vsliderfloat: {
    name: 'V-slider float', cat: 'Sliders',
    props: [['label', 'text', 'Vol'], ['w', 'float', 24, PX], ['h', 'float', 120, PX], ['min', 'float', 0], ['max', 'float', 1]],
    field: (n, v) => `float ${v} = ${f(n.min)};`,
    code: (n, v, id) => [`ImGui::VSliderFloat(${id}, ImVec2(${f(n.w)}, ${f(n.h)}), &state.${v}, ${f(n.min)}, ${f(n.max)});`],
  },
  vsliderint: {
    name: 'V-slider int', cat: 'Sliders',
    props: [['label', 'text', 'Level'], ['w', 'float', 24, PX], ['h', 'float', 120, PX], ['min', 'int', 0], ['max', 'int', 100]],
    field: (n, v) => `int ${v} = ${iv(n.min)};`,
    code: (n, v, id) => [`ImGui::VSliderInt(${id}, ImVec2(${f(n.w)}, ${f(n.h)}), &state.${v}, ${iv(n.min)}, ${iv(n.max)});`],
  },

  // ----------------------------------------------------------------- Drags
  dragfloat: {
    name: 'Drag float', cat: 'Drags',
    props: [ITEMW, ['label', 'text', 'Value'], ...vecN, ['speed', 'float', 0.01], ['min', 'float', 0], ['max', 'float', 1], UNIT],
    field: (n, v) => decl('float', v, comps(n.n), f(n.min)),
    code: (n, v, id) => [`ImGui::DragFloat${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${f(n.speed)}, ${f(n.min)}, ${f(n.max)}, ${fmt(n, '%.3f')});`],
  },
  dragint: {
    name: 'Drag int', cat: 'Drags',
    props: [ITEMW, ['label', 'text', 'Count'], ...vecN, ['speed', 'float', 1], ['min', 'int', 0], ['max', 'int', 100], UNIT],
    field: (n, v) => decl('int', v, comps(n.n), iv(n.min)),
    code: (n, v, id) => [`ImGui::DragInt${sfx(comps(n.n))}(${id}, ${ref(v, comps(n.n))}, ${f(n.speed)}, ${iv(n.min)}, ${iv(n.max)}, ${fmt(n, '%d')});`],
  },
  dragfloatrange2: {
    name: 'Drag float range', cat: 'Drags',
    props: [ITEMW, ['label', 'text', 'Range'], ['speed', 'float', 0.01], ['min', 'float', 0], ['max', 'float', 1]],
    field: (n, v) => [`float ${v}Min = ${f(n.min)};`, `float ${v}Max = ${f(n.max)};`],
    code: (n, v, id) => [`ImGui::DragFloatRange2(${id}, &state.${v}Min, &state.${v}Max, ${f(n.speed)}, ${f(n.min)}, ${f(n.max)});`],
  },
  dragintrange2: {
    name: 'Drag int range', cat: 'Drags',
    props: [ITEMW, ['label', 'text', 'Range'], ['speed', 'float', 1], ['min', 'int', 0], ['max', 'int', 100]],
    field: (n, v) => [`int ${v}Min = ${iv(n.min)};`, `int ${v}Max = ${iv(n.max)};`],
    code: (n, v, id) => [`ImGui::DragIntRange2(${id}, &state.${v}Min, &state.${v}Max, ${f(n.speed)}, ${iv(n.min)}, ${iv(n.max)});`],
  },

  // ----------------------------------------------------------------- Color
  coloredit: {
    name: 'Color edit', cat: 'Color',
    props: [ITEMW, ['label', 'text', 'Tint'], ['n', 'enum', 3, [3, 4]]],
    field: (n, v) => decl('float', v, Number(n.n) === 4 ? 4 : 3, '1.0f'),
    code: (n, v, id) => [`ImGui::ColorEdit${Number(n.n) === 4 ? 4 : 3}(${id}, state.${v});`],
  },
  colorpicker: {
    name: 'Color picker', cat: 'Color',
    props: [ITEMW, ['label', 'text', 'Pick'], ['n', 'enum', 3, [3, 4]]],
    field: (n, v) => decl('float', v, Number(n.n) === 4 ? 4 : 3, '1.0f'),
    code: (n, v, id) => [`ImGui::ColorPicker${Number(n.n) === 4 ? 4 : 3}(${id}, state.${v});`],
  },
  colorbutton: {
    name: 'Color button', cat: 'Color',
    props: [['label', 'text', 'swatch'], ['w', 'float', 0, PX], ['h', 'float', 0, PX]],
    field: (n, v) => `float ${v}[4] = { 1.0f, 1.0f, 1.0f, 1.0f };`,
    code: (n, v, id) => [
      `ImGui::ColorButton(${id}, ImVec4(state.${v}[0], state.${v}[1], state.${v}[2], state.${v}[3]), 0, ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },

  // ---------------------------------------------------------------- Choice
  combo: {
    name: 'Combo', cat: 'Choice',
    props: [ITEMW, ['label', 'text', 'Mode'], ['items', 'items', 'One, Two, Three']],
    field: (n, v) => `int ${v} = 0;`,
    code: (n, v, id) => [
      `static const char* ${v}Items[] = { ${itemList(n.items)} };`,
      `ImGui::Combo(${id}, &state.${v}, ${v}Items, IM_ARRAYSIZE(${v}Items));`,
    ],
  },
  listbox: {
    name: 'List box', cat: 'Choice',
    props: [ITEMW, ['label', 'text', 'Items'], ['items', 'items', 'One, Two, Three']],
    field: (n, v) => `int ${v} = 0;`,
    code: (n, v, id) => [
      `static const char* ${v}Items[] = { ${itemList(n.items)} };`,
      `ImGui::ListBox(${id}, &state.${v}, ${v}Items, IM_ARRAYSIZE(${v}Items));`,
    ],
  },
  selectable: {
    // ImGui::Selectable sizes itself from its label, its size argument and the
    // work rect, and never reads CalcItemWidth. So this carried ITEMW for a
    // long time, which put a width handle on the canvas and a Width field in
    // the inspector, emitted SetNextItemWidth on both sides, and did nothing at
    // all: the inspector read "Width 200" while the widget stayed exactly as
    // wide as it was. Its real size argument is the fourth one, so it takes w
    // and h like a Button does instead.
    name: 'Selectable', cat: 'Choice',
    props: [['label', 'text', 'Selectable'], ['w', 'float', 0, PX], ['h', 'float', 0, PX]],
    field: (n, v) => `bool ${v} = false;`,
    code: (n, v, id) => [`ImGui::Selectable(${id}, &state.${v}`
      + (n.w || n.h ? `, 0, ImVec2(${f(n.w)}, ${f(n.h)})` : '') + ');'],
  },

  // ----------------------------------------------------------------- Plots
  plotlines: {
    name: 'Plot lines', cat: 'Plots',
    props: [['label', 'text', 'Signal'], ['w', 'float', 0, PX], ['h', 'float', 60, PX]],
    field: (n, v) => plotField(v),
    code: (n, v, id) => [
      `ImGui::PlotLines(${id}, state.${v}, IM_ARRAYSIZE(state.${v}), 0, nullptr, -1.0f, 1.0f, ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },
  plothistogram: {
    name: 'Plot histogram', cat: 'Plots',
    props: [['label', 'text', 'Buckets'], ['w', 'float', 0, PX], ['h', 'float', 60, PX]],
    field: (n, v) => plotField(v),
    code: (n, v, id) => [
      `ImGui::PlotHistogram(${id}, state.${v}, IM_ARRAYSIZE(state.${v}), 0, nullptr, -1.0f, 1.0f, ImVec2(${f(n.w)}, ${f(n.h)}));`,
    ],
  },

  // ---------------------------------------------------------------- Layout
  separator: { name: 'Separator', cat: 'Layout', props: [], code: () => ['ImGui::Separator();'] },
  spacing: { name: 'Spacing', cat: 'Layout', props: [], code: () => ['ImGui::Spacing();'] },
  newline: { name: 'New line', cat: 'Layout', props: [], code: () => ['ImGui::NewLine();'] },
  dummy: {
    name: 'Dummy', cat: 'Layout', props: [['w', 'float', 40, PX], ['h', 'float', 20, PX]],
    code: n => [`ImGui::Dummy(ImVec2(${f(n.w)}, ${f(n.h)}));`],
  },
  indent: {
    name: 'Indent', cat: 'Layout', props: [['w', 'float', 0, PX]],
    code: n => [`ImGui::Indent(${f(n.w)});`],
  },
  unindent: {
    name: 'Unindent', cat: 'Layout', props: [['w', 'float', 0, PX]],
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
  // A pure code-organization wrapper: it draws nothing of its own, and the
  // generator lifts its children into a function of their own. Saved templates
  // land in one of these, so inserting a template reads as a call rather than a
  // wall of inlined widgets.
  section: {
    name: 'Function', cat: 'Containers', container: true, transparent: true,
    props: [['label', 'text', 'Section']],
    code: () => ({ open: [], close: '', braced: false }),
  },
  child: {
    name: 'Child region', cat: 'Containers', container: true,
    props: [['label', 'text', 'child'], ['w', 'float', 0, PX], ['h', 'float', 120, PX]],
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

  // Holds C++ the parser recognized as valid but doesn't model as a widget.
  // Kept byte-for-byte and re-emitted verbatim so a round trip never loses it.
  rawcode: {
    name: 'Raw C++', cat: 'Layout', hidden: true,
    props: [['code', 'longtext', '']],
    code: n => String(n.code || '').split('\n'),
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

// What each property is for, in a sentence, because a tooltip is prose rather
// than a label. Keyed by property name. Every widget that uses the name gets
// the same explanation, which is the point of naming them consistently.
const PROP_HELP = {
  label: 'The text ImGui shows, and the id it hashes. Two widgets with the same label in one window need "##" to tell them apart.',
  // ImGui::ArrowButton takes a str_id and draws only the triangle, so its
  // label is never shown. The generic help above promises the opposite.
  'arrowbutton.label': 'The id ImGui hashes. An arrow button draws only its arrow, so this text is never shown. Use it to tell two arrows apart.',
  x: 'Where the window sits, in pixels from the top-left of your viewport. Emitted as SetNextWindowPos.',
  y: 'Where the window sits, in pixels from the top-left of your viewport. Emitted as SetNextWindowPos.',
  w: 'Width in pixels. 0 lets ImGui size it to its content.',
  h: 'Height in pixels. 0 lets ImGui size it to its content.',
  itemw: 'Width override for a widget that has no size argument of its own. Emitted as SetNextItemWidth.',
  min: 'Lowest value the control will produce.',
  max: 'Highest value the control will produce.',
  speed: 'How far the value moves per pixel dragged.',
  unit: 'Appended to the displayed number, so a slider can read "12 cm". Becomes part of the ImGui format string.',
  n: 'How many components, for a vector. 3 gives you the Float3 form.',
  value: 'The value this entry stands for. Radio buttons in a group each claim one.',
  group: 'Radio buttons sharing a group name share one backing variable, so only one can be on.',
  fraction: 'How full the bar is, from 0 to 1.',
  items: 'The choices, separated by commas.',
  cols: 'How many columns the table has.',
  dir: 'Which way the arrow points.',
  format: 'A printf format string. The arguments below fill in its placeholders.',
  args: 'C++ expressions passed to the format string, separated by commas. Written through to the generated code as typed.',
  code: 'C++ kept exactly as written. The preview shows a placeholder for it, since it is not executed here.',
  noTitleBar: 'Hides the title bar, and with it the drag handle and close button.',
  noResize: 'Stops the user resizing the window at runtime.',
  noMove: 'Stops the user dragging the window at runtime.',
  noScrollbar: 'Hides the scrollbar even when the content overflows.',
  noCollapse: 'Removes the collapse arrow.',
  autoResize: 'Sizes the window to its content every frame, ignoring width and height.',
  'section.label': 'Names the function the generated code puts these widgets in. It draws nothing itself.',
  closable: 'Gives the window a close button, and a bool the generated code checks before drawing it.',
  openAtStart: 'Whether a closable window is showing the first time the panel runs.',
  toggles: 'Title of a closable window this button shows and hides. Leave it empty for a button that does something else.',
  r: 'Red, from 0 to 1.',
  g: 'Green, from 0 to 1.',
  b: 'Blue, from 0 to 1.',
};

const CATEGORIES = ['Window', 'Text', 'Buttons', 'Input', 'Sliders', 'Drags', 'Color',
  'Choice', 'Plots', 'Layout', 'Containers', 'Menus', 'Popups'];

// Color slots offered per category. Offering an ImGuiCol_ a widget never reads
// would let someone set a color and see nothing change, which costs more trust
// than the missing option would. Curated per category rather than exhaustive.
const COLOR_SLOTS_BY_CAT = {
  Window:     ['Text', 'WindowBg', 'TitleBg', 'TitleBgActive', 'Border'],
  Text:       ['Text'],
  Buttons:    ['Text', 'Button', 'ButtonHovered', 'ButtonActive', 'CheckMark', 'FrameBg'],
  Input:      ['Text', 'FrameBg', 'FrameBgHovered', 'FrameBgActive'],
  Sliders:    ['Text', 'FrameBg', 'SliderGrab', 'SliderGrabActive'],
  Drags:      ['Text', 'FrameBg', 'SliderGrab', 'SliderGrabActive'],
  Color:      ['Text', 'FrameBg', 'Border'],
  Choice:     ['Text', 'FrameBg', 'FrameBgHovered', 'Header', 'HeaderHovered'],
  Plots:      ['Text', 'FrameBg', 'PlotLines', 'PlotHistogram'],
  Layout:     ['Text', 'Border'],
  Containers: ['Text', 'ChildBg', 'Border', 'Header', 'HeaderHovered', 'HeaderActive',
               'Tab', 'TabHovered'],
  Menus:      ['Text', 'PopupBg', 'Header', 'HeaderHovered'],
  Popups:     ['Text', 'PopupBg', 'Border', 'Button', 'ButtonHovered'],
};

// Per-type corrections where the category answer would offer a color the
// widget never reads. A swatch that does nothing costs more trust than a
// missing one, because the preview-matches-code promise is the whole product.
const COLOR_SLOTS_BY_TYPE = {
  separator:     ['Separator'],
  separatortext: ['Separator', 'Text'],
  textdisabled:  ['TextDisabled'],
  textcolored:   [],            // its color is the r/g/b properties
  progressbar:   ['PlotHistogram', 'FrameBg', 'Text'],
  plotlines:     ['PlotLines', 'FrameBg', 'Text'],
  plothistogram: ['PlotHistogram', 'FrameBg', 'Text'],
  bullet:        ['Text'],
  spacing:       [], newline: [], dummy: [], indent: [], unindent: [], aligntext: [],
  rawcode:       [],
  // The document root draws nothing. It fell through to the Window category and
  // the inspector offered five swatches on it, none of which any consumer reads
  // and all of which the save path drops.
  root:          [],
  // No TableHeaderBg. Neither the engine nor the generator calls
  // TableSetupColumn/TableHeadersRow, so there is no header row for it to
  // color and the swatch could never change anything. The comment above this
  // table says exactly why that is worse than not offering it.
  table:         ['Text', 'TableBorderStrong', 'TableRowBg'],
  tabbar:        ['Tab', 'TabHovered', 'TabSelected', 'Text'],
  tabitem:       ['Tab', 'TabHovered', 'TabSelected', 'Text'],
  group:         [],            // a group draws nothing of its own
  child:         ['ChildBg', 'Border', 'Text'],
  // No MenuBarBg. ImGui draws the bar's background inside Begin, before either
  // consumer gets anywhere near BeginMenuBar, so pushing it around the bar
  // changes nothing in the preview OR in the generated code. Text is all that
  // is actually reachable here.
  menubar:       ['Text'],
};

// A fresh node of a type, with every property at the spec's default. It lives
// here rather than in index.html because it is derived entirely from the table
// above, and because the parser and the unit tests both need the REAL one: a
// faithful-looking copy in a test harness is a second source of truth, and the
// whole point of this file is that there is only one.
//
// The id is passed in rather than taken from a counter, which is the only part
// that was ever app state.
function makeNodeOfType(type, id) {
  // The PROFILE's catalog, not the WIDGETS table above: this factory is shell
  // code, and on the slate page the table above is not the loaded catalog. It
  // first shipped reading WIDGETS directly, and every palette drop of a type
  // both catalogs happened to share (progressbar) worked while slider threw.
  const spec = PROFILE.catalog[type];
  const node = { type, id };
  for (const [k, , d] of spec.props || []) node[k] = d;
  if (spec.container) node.children = [];
  return node;
}

function colorSlots(type) {
  if (COLOR_SLOTS_BY_TYPE[type]) return COLOR_SLOTS_BY_TYPE[type];
  const spec = WIDGETS[type];
  return (spec && COLOR_SLOTS_BY_CAT[spec.cat]) || ['Text'];
}

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
