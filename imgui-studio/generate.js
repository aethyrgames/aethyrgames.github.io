// The C++ generator. Walks the document and emits the text the code pane shows,
// which app/cpp.js parses back. The two have to agree, and they are checked
// against each other by the round-trip tests.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- code generation ----------

function pascal(s, fallback) {
  const words = (s || '').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length || /^[0-9]/.test(words[0])) return fallback;
  return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
}

function camel(s, fallback) {
  const p = pascal(s, fallback);
  return p[0].toLowerCase() + p.slice(1);
}

const CPP_KEYWORDS = new Set([
  'alignas', 'alignof', 'and', 'asm', 'auto', 'bool', 'break', 'case', 'catch', 'char',
  'class', 'const', 'constexpr', 'continue', 'decltype', 'default', 'delete', 'do',
  'double', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for',
  'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new',
  'noexcept', 'not', 'nullptr', 'operator', 'or', 'private', 'protected', 'public',
  'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch',
  'template', 'this', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename',
  'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'while', 'xor',
]);

const WINDOW_FLAGS = [
  ['noTitleBar', 'NoTitleBar'], ['noResize', 'NoResize'], ['noMove', 'NoMove'],
  ['noScrollbar', 'NoScrollbar'], ['noCollapse', 'NoCollapse'], ['autoResize', 'AlwaysAutoResize'],
];

// Mirrors unpascal in app/cpp.js: what the parser reads a function name back as
// when there is no label comment to prefer.
function unpascalLike(name) {
  const s = String(name || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').trim();
  return s || 'Section';
}

function generateCode() {
  const usedNames = new Set();
  const labelCount = new Map();
  // every id string already emitted in this window, so a minted suffix
  // cannot collide with one the user typed by hand
  const emittedIds = new Set();
  const fields = [];
  const fieldSeen = new Set();
  const owners = [];   // index into `out` -> node id that produced that line
  const skipped = [];   // widgets with no valid C++ form: Apply WILL remove them
  const warnings = [];  // properties that will be dropped, widget otherwise fine

  const groupNames = new Map();
  // A counter alone isn't enough: "Value" then "Value 1" then "Value" would
  // hand out `value`, `value1`, `value1`. Track what's actually taken.
  const claim = base => {
    if (CPP_KEYWORDS.has(base)) base += 'Value';
    let name = base;
    let i = 1;
    while (usedNames.has(name)) name = base + (i++);
    usedNames.add(name);
    return name;
  };

  const uniqName = (node, spec) => {
    // Radio buttons in one group deliberately share a backing variable. The
    // shared name still goes through the counter once, so an unrelated widget
    // labeled the same can't end up declaring a second field of that name.
    if (spec.fieldName) {
      const g = spec.fieldName(node);
      if (!groupNames.has(g)) groupNames.set(g, claim(camel(g, node.type)));
      return groupNames.get(g);
    }
    return claim(camel(node.label || node.type, node.type));
  };

  // Duplicate on-screen labels need distinct ImGui IDs, and the suffix has to
  // come from the occurrence rather than the field name, since radio buttons
  // in one group deliberately share a field.
  const imguiId = label => {
    const s = String(label ?? '');
    let c = (labelCount.get(s) || 0) + 1;
    // `##dup<n>`, not `##<n>`. ImGui hides everything after `##` either way, so
    // this looks identical, but the parser has to strip the generator's own
    // suffix and cannot strip a user's: `Item##2` is legitimate ImGui id syntax
    // and was silently truncated to `Item` on the first Apply.
    //
    // The result still has to be UNUSED. A user is told to write `##` to tell
    // same-labeled widgets apart, so someone typing "Item##dup2" collided head
    // on with the suffix this mints for the second "Item", and the two widgets
    // shared one ImGui id: same state, same activation.
    let out = c === 1 ? s : s + '##dup' + c;
    while (emittedIds.has(out)) { c += 1; out = s + '##dup' + c; }
    labelCount.set(s, c);
    emittedIds.add(out);
    return q(out);
  };

  const addField = d => {
    for (const line of Array.isArray(d) ? d : [d]) {
      if (line && !fieldSeen.has(line)) { fieldSeen.add(line); fields.push(line); }
    }
  };

  // Scopes that end a tab bar's reach, matching the engine's threading of the
  // same flag. A tab item outside one is an assert in ImGui, not a no-op.
  const ENDS_TABBAR = new Set(['child', 'popup', 'modal', 'tooltip', 'menu', 'menubar', 'table', 'tabitem']);

  const out = [];
  // Set per window, below. A Button's `toggles` resolves against the window
  // being emitted, so the resolver has to be swapped in rather than passed
  // down through every emit() frame.
  let curToggleRef = () => null;
  let curHelperParams = '';
  let curHelperArgs = '';
  const emit = (node, depth, index, parentType, inTabbar) => {
    const spec = WIDGETS[node.type];
    if (!spec) return;
    const ind = '    '.repeat(depth);
    // These arrangements assert inside ImGui, so there is no valid C++ to emit
    // and the subtree has nowhere to go. Record what was dropped: the code pane
    // warns before Apply reads the text back and makes the loss permanent.
    const skip = reason => {
      const lost = countNodes(node.children);
      skipped.push({ type: spec.name, label: node.label || '', reason, lost });
      out.push(ind + `// ${spec.name}${node.label ? ' "' + node.label + '"' : ''}: ${reason}`);
      if (lost) out.push(ind + `// ${lost} widget${lost > 1 ? 's' : ''} inside it cannot be emitted either.`);
    };
    if (node.type === 'tabitem' && !inTabbar) {
      skip('a Tab item needs a Tab bar around it, so it is skipped');
      return;
    }
    // BeginMenuBar only works on a window carrying ImGuiWindowFlags_MenuBar,
    // and asserts outright if one is already being appended.
    if (node.type === 'menubar' && parentType !== 'window') {
      skip('a Menu bar must sit directly on the window, so it is skipped');
      return;
    }
    const v = uniqName(node, spec);
    const hasLabel = (spec.props || []).some(p => p[0] === 'label');
    const idStr = hasLabel ? imguiId(node.label) : q(node.type);
    // Remember which output lines this node produced, so the code pane can
    // scroll to a widget. Claimed on the way out and only where still unclaimed,
    // which leaves each child owning its own lines and the parent owning the
    // Begin/End scaffolding around them.
    const ownFrom = out.length;
    const claimLines = () => {
      for (let k = ownFrom; k < out.length; k++) if (!owners[k]) owners[k] = node.id;
    };

    // Color pushes wrap the whole widget, and for a container they wrap its
    // Begin/End pair because values like ChildBg are read at Begin time.
    //
    // Computed HERE, above the section branch, rather than below it. It used to
    // sit after the branch's own return, so a Function container's colors were
    // silently dropped from the generated C++ while the engine pushed them for
    // the preview: the canvas drew red, the built app drew gray, and Apply then
    // dropped node.colors from the document for good.
    const cols = Object.entries(node.colors || {})
      .filter(([slot]) => colorSlots(node.type).includes(slot));
    const pushColors = () => {
      for (const [slot, c] of cols) {
        out.push(ind + `ImGui::PushStyleColor(ImGuiCol_${slot}, `
          + `ImVec4(${f(c[0])}, ${f(c[1])}, ${f(c[2])}, ${f(c[3] === undefined ? 1 : c[3])}));`);
      }
    };
    const popColors = () => {
      if (cols.length) out.push(ind + `ImGui::PopStyleColor(${cols.length});`);
    };

    // A Function container is transparent: its children are lifted into a
    // function of their own and the call takes their place here. They keep the
    // real parent's context, since the helper runs inside that same scope.
    if (node.type === 'section') {
      const fnName = 'Draw' + claimFn(node.label);
      // The label, verbatim, on the definition line. A Function container's
      // label only survived inside the uniquified function name, so two
      // containers both called "Side" came back as "Side" and "Side2", and any
      // label that pascal-izes lossily ("read/write" -> "ReadWrite") came back
      // changed. The comment is the only lossless carrier the C++ has.
      const fnLabel = String(node.label ?? '');
      const start = out.length;
      const kids = node.children || [];
      // A menu bar is only legal directly on the window (line 140, and the
      // window's own flags below only look at ITS DIRECT children). Passing
      // `parentType` straight through kept a section transparent to that
      // check too: a menu bar nested in a Function container that sits on the
      // window saw parentType === 'window' and skipped the "must be direct"
      // guard, so it generated a live BeginMenuBar() on a window that never
      // got ImGuiWindowFlags_MenuBar, which returns false at runtime and
      // drops the whole menu with no warning. `section` only makes a
      // difference to that one check (it is the only place that reads
      // `parentType === 'window'`). Table-cell advancement and everything
      // else still sees the real ambient parentType through unchanged.
      const kidParentType = parentType === 'window' ? 'section' : parentType;
      for (let i = 0; i < kids.length; i++) emit(kids[i], 1, i, kidParentType, inTabbar);
      const lines = out.splice(start);
      const lineOwners = owners.splice(start, lines.length);
      helpers.push({ id: node.id, fnName, fnLabel, lines, owners: lineOwners });
      // No TableNextColumn for the container itself: its children each advance a
      // cell from inside the helper, and advancing here too left an empty one.
      if (parentType !== 'table' && node.sameline && index > 0) {
        out.push(ind + 'ImGui::SameLine();');
      }
      // Around the CALL, since PushStyleColor is global state and the helper
      // runs inside it. That matches the engine, which builds a ColScope for the
      // node before drawing the subtree.
      pushColors();
      out.push(ind + `${fnName}(state${curHelperArgs});`);
      popColors();
      claimLines();
      return;
    }

    if (parentType === 'table') out.push(ind + 'ImGui::TableNextColumn();');
    else if (node.sameline && index > 0) out.push(ind + 'ImGui::SameLine();');

    if (spec.field) addField(spec.field(node, v));
    // ImGui's own way to size an item that has no explicit size argument
    if (Number(node.itemw) > 0) out.push(ind + `ImGui::SetNextItemWidth(${f(node.itemw)});`);

    pushColors();

    // A `toggles` only means something when the named window is closable, since
    // that is the window declaring the flag. Report a dangling one: the body
    // falls back to a plain TODO, so Apply would otherwise drop the property
    // with nothing said.
    //
    // A WARNING, not a skip. `skipped` means "this widget has no valid C++ form
    // and Apply will remove it", and the code pane says exactly that. The button
    // emits perfectly good C++ and survives Apply intact. Only the toggles name
    // is lost. Counting it as skipped told people a widget was about to be
    // deleted when nothing was.
    if (node.type === 'button' && node.toggles && !curToggleRef(node.toggles)) {
      warnings.push({ type: spec.name, label: node.label || '',
        reason: `toggles "${node.toggles}", which is not a closable window here, `
          + 'so that name will be dropped on Apply' });
    }
    const res = spec.code ? spec.code(node, v, idStr, { toggleRef: curToggleRef }) : null;
    if (!res) { popColors(); claimLines(); return; }
    if (Array.isArray(res)) {
      for (const l of res) out.push(ind + l);
      popColors();
      claimLines();
      return;
    }

    for (const l of res.open) out.push(ind + l);
    const braced = res.braced !== false;
    if (braced) out.push(ind + '{');
    const cd = braced ? depth + 1 : depth;
    const kids = node.children || [];
    const childTab = node.type === 'tabbar' ? true : (ENDS_TABBAR.has(node.type) ? false : inTabbar);
    for (let i = 0; i < kids.length; i++) emit(kids[i], cd, i, node.type, childTab);
    if (res.extra) for (const l of res.extra) out.push('    '.repeat(cd) + l);
    if (res.pop) out.push('    '.repeat(cd) + res.pop);
    if (braced) out.push(ind + '}');
    else if (res.close) out.push(ind + res.close);
    popColors();
    claimLines();
  };

  // Windows named by a Button's `toggles`, so their flags are declared.
  const togglesIn = win => {
    const out = new Set();
    const walkKids = list => {
      for (const n of list || []) {
        if (n.type === 'button' && n.toggles) out.add(pascalId(n.toggles));
        walkKids(n.children);
      }
    };
    walkKids(win.children);
    return [...out];
  };

  // One struct and one function per window. That is what a window is in ImGui
  // terms, and it means a document with three panels reads as three functions
  // rather than one long one.
  const windows = (doc.children || []).filter(n => n.type === 'window');
  const sections = [];
  const usedFnNames = new Set();
  // Lifted Function containers, in the order they were reached. Their names share
  // the window functions' namespace, since it is all one translation unit.
  const helpers = [];
  const claimFn = label => {
    const base = pascal(label, 'Section');
    let name = base;
    let i = 2;
    while (usedFnNames.has(name)) name = base + i++;
    usedFnNames.add(name);
    return name;
  };

  // A closable window owns exactly one visibility flag, declared in its own
  // struct. Nothing else may declare a second one under the same name.
  const flagOwners = new Set();
  for (const w of windows) {
    if (w.closable) flagOwners.add(pascalId(w.label || 'Window'));
  }

  for (const win of windows) {
    out.length = 0;
    owners.length = 0;
    fields.length = 0;
    fieldSeen.clear();
    usedNames.clear();
    groupNames.clear();
    labelCount.clear();
    emittedIds.clear();
    helpers.length = 0;

    // Where this window's buttons find the flags they flip. Its own flag is a
    // member of its own state. Another window's flag belongs to that window, so
    // it arrives by reference: one bool per window, shared, rather than a
    // private copy per toggler that the owner never reads.
    const selfId = pascalId(win.label || 'Window');
    // SORTED. togglesIn walks the document, so the parameter list came out in
    // the order the toggling buttons happened to appear: reordering two buttons
    // in the Hierarchy silently swapped which window each one opened, because
    // the caller's argument list and the helper's parameter list are matched by
    // POSITION. Sorting makes the order a property of the names instead of a
    // property of the layout.
    const borrowed = togglesIn(win)
      .filter(t => flagOwners.has(t) && !(t === selfId && win.closable))
      .sort();
    curToggleRef = title => {
      const t = pascalId(title);
      if (!flagOwners.has(t)) return null;
      return (t === selfId && win.closable) ? `state.show${t}` : `show${t}`;
    };
    curHelperParams = borrowed.map(t => `, bool& show${t}`).join('');
    curHelperArgs = borrowed.map(t => `, show${t}`).join('');

    const kids = win.children || [];
    for (let i = 0; i < kids.length; i++) emit(kids[i], 1, i, 'window', false);

    let base = pascal(win.label, 'MyPanel');
    let n = 2;
    while (usedFnNames.has(base)) base = pascal(win.label, 'MyPanel') + n++;
    usedFnNames.add(base);

    const flags = WINDOW_FLAGS.filter(([k]) => win[k]).map(([, f]) => 'ImGuiWindowFlags_' + f);
    if (kids.some(c => c.type === 'menubar')) flags.push('ImGuiWindowFlags_MenuBar');

    const head = [];
    head.push(`struct ${base}State`);
    head.push('{');
    if (win.closable) {
      head.push(`    bool show${pascalId(win.label || 'Window')} = `
        + `${win.openAtStart === false ? 'false' : 'true'};`);
    }
    // Nothing else goes here. Declaring a flag for every window this one's
    // buttons can toggle gave each toggler a private bool while the target
    // guarded on its own, so the click flipped something no one read.
    // Line by line, because a field declaration may be several. Two of the 27
    // emitters go through plotField, whose 64-value array spans nine lines, and
    // prefixing the whole block once indented only the first: the array's own
    // closing `};` came out at column 0, visually identical to the struct's.
    // It compiles either way, which is why the compile fixture never minded.
    for (const fld of fields) {
      for (const line of String(fld).split('\n')) head.push('    ' + line);
    }
    head.push('};');
    head.push('');
    // Lifted Function containers go between the struct and the window function:
    // they take the same state by reference, so the struct has to come first.
    const helperStart = head.length;
    const helperOwners = [];
    for (const h of helpers) {
      // The label rides along only when the name cannot carry it: a plain
      // "Side" needs nothing, "Side2" and "read/write" do.
      const carried = unpascalLike(h.fnName.replace(/^Draw/, ''));
      // Flattened, because this goes into a ONE-LINE comment. A label carrying
      // a newline split the comment and left the rest of the label as a bare
      // statement between the signature and its opening brace, which does not
      // compile. The inspector's label field is single-line, so this only
      // arrives through an imported project or a #d= share link, which are
      // exactly the untrusted inputs sanitize() exists for.
      const oneLine = String(h.fnLabel ?? '').replace(/\s+/g, ' ').trim();
      head.push(`static void ${h.fnName}(${base}State& state${curHelperParams})`
        + (oneLine && oneLine !== carried ? `  // label: ${oneLine}` : ''),
        '{');
      helperOwners.push(h.id, h.id);
      for (let k = 0; k < h.lines.length; k++) {
        head.push(h.lines[k]);
        helperOwners.push(h.owners[k] || h.id);
      }
      head.push('}', '');
      helperOwners.push(h.id, null);
    }
    head.push(`void Draw${base}(${base}State& state${curHelperParams})`);
    head.push('{');
    if (flags.length) head.push(`    ImGuiWindowFlags flags = ${flags.join(' | ')};`);
    head.push(`    ImGui::SetNextWindowPos(ImVec2(${f(win.x)}, ${f(win.y)}), ImGuiCond_FirstUseEver);`);
    if (win.w > 0 || win.h > 0) {
      head.push(`    ImGui::SetNextWindowSize(ImVec2(${f(win.w)}, ${f(win.h)}), ImGuiCond_FirstUseEver);`);
    }
    // Window colors have to be pushed before Begin: WindowBg and the title-bar
    // slots are read while the window is being opened, not while it is filled.
    const winCols = Object.entries(win.colors || {})
      .filter(([slot]) => colorSlots('window').includes(slot));
    for (const [slot, c] of winCols) {
      head.push(`    ImGui::PushStyleColor(ImGuiCol_${slot}, `
        + `ImVec4(${f(c[0])}, ${f(c[1])}, ${f(c[2])}, ${f(c[3] === undefined ? 1 : c[3])}));`);
    }
    // A closable window is guarded by a visibility flag your code owns, which
    // is also what a Button's `toggles` flips. ImGui takes it as Begin's p_open,
    // so it draws the X and clears the flag when that is clicked.
    // The flag is a member of this window's own state, so it is `state.showX`.
    // Emitting it bare did not compile: this is a free function taking `state`.
    // `closable` owns the flag when it is set, otherwise a p_open expression the
    // user wrote by hand is passed through verbatim. Only `closable` gets the
    // guard, since only a flag this code declares can be read back reliably.
    const userOpen = String(win.pOpen || '').trim();
    const openFlag = win.closable ? `state.show${selfId}` : null;
    const ind2 = openFlag ? '        ' : '    ';
    // Take the header lines that belong inside the guard BEFORE opening it.
    // Doing it afterwards could never match: the last line was the guard's own
    // `{`, so the loop stopped immediately and every SetNextWindowPos and
    // PushStyleColor stayed outside. A hidden window then pushed style colors
    // it never popped, because the matching PopStyleColor is inside, and its
    // SetNextWindowPos leaked onto whichever window opened next.
    const guarded = [];
    while (head.length && /^ {4}ImGui::(SetNextWindow|PushStyleColor)/.test(head[head.length - 1])) {
      guarded.unshift(head.pop());
    }
    if (openFlag) {
      head.push(`    if (${openFlag})`);
      head.push('    {');
    }
    for (const l of guarded) head.push(openFlag ? '    ' + l : l);
    // Whatever the user wrote by hand between the function's opening brace and
    // Begin. It goes inside the guard with the rest, since a hidden window
    // should not run its setup either.
    for (const l of String(win.preamble || '').split('\n')) {
      if (l.trim()) head.push(ind2 + l.replace(/^\s+/, ''));
    }
    head.push(`${ind2}ImGui::Begin(${q(win.label || 'My Panel')}`
      + `${openFlag ? ', &' + openFlag
        : (userOpen ? ', ' + userOpen : (flags.length ? ', nullptr' : ''))}`
      + `${flags.length ? ', flags' : ''});`);
    const tail = [`${ind2}ImGui::End();`];
    if (winCols.length) tail.push(`${ind2}ImGui::PopStyleColor(${winCols.length});`);
    if (openFlag) tail.push('    }');
    tail.push('}');
    const headOwners = head.map(() => null);
    for (let k = 0; k < helperOwners.length; k++) headOwners[helperStart + k] = helperOwners[k];
    sections.push({
      // The guard adds a level, and the body was emitted without knowing about
      // it, so it has to be shifted to match or the widgets sit a tab to the
      // left of the Begin they belong to.
      win, head,
      body: openFlag ? out.map(l => (l.trim() ? '    ' + l : l)) : out.slice(),
      owners: headOwners
        .concat(Array.from({ length: out.length }, (_, i) => owners[i] || win.id), tail.map(() => null)),
      tail,
    });
  }

  // The version rides in the banner so a pasted snippet says which build wrote
  // it. Both parser paths strip this line with a trailing-tolerant pattern, so
  // the round trip is unaffected by what follows the name.
  const lines = [`// Generated by ImGuiStudio${typeof STUDIO_VERSION === 'undefined' ? '' : ` v${STUDIO_VERSION}`}`, ''];
  let allOwners = [null, null];
  // code the user wrote around the whole file, kept verbatim
  if (doc.pre) {
    for (const l of String(doc.pre).split('\n')) { lines.push(l); allOwners.push(null); }
    lines.push('');
    allOwners.push(null);
  }
  sections.forEach((sec, i) => {
    if (i) { lines.push(''); allOwners.push(null); }
    lines.push(...sec.head, ...sec.body, ...sec.tail);
    allOwners = allOwners.concat(sec.owners);
  });
  if (doc.post) {
    lines.push('');
    allOwners.push(null);
    for (const l of String(doc.post).split('\n')) { lines.push(l); allOwners.push(null); }
  }

  generateCode.skipped = skipped;
  generateCode.warnings = warnings;
  // already shifted onto the final line numbering, section by section
  generateCode.owners = allOwners;
  return lines.join('\n');
}

// Monokai-family highlighter for the code pane: a single-pass tokenizer whose
// scopes mirror editor themes (chained replaces can't express the call-site vs
// definition distinctions). Lookbehinds resolve against the raw source, so
// already-emitted spans can't confuse later branches.
function highlightCpp(src) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const master = new RegExp([
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/,                                    // 1 comment
    /("(?:[^"\\]|\\.)*")/,                                              // 2 string
    /\b(if|else|return|for|while|switch|case|break|struct|const|static)\b/, // 3 keyword + storage
    /\b(void|bool|float|char|int|double|unsigned)\b/,                   // 4 storage.type
    /\b(true|false|nullptr|NULL)\b/,                                    // 5 constant.language
    /\b(\d+(?:\.\d+)?f?)\b/,                                            // 6 constant.numeric
    /\b(ImGui)\b/,                                                      // 7 support namespace
    /\b(ImVec[24])\b/,                                                  // 8 support struct
    /\b(IM_[A-Z_]+)\b/,                                                 // 9 macro
    /((?<=::)[A-Za-z_]\w*(?=\())/,                                      // 10 support.function (call)
    /\b([A-Za-z_]\w*)(?=\()/,                                           // 11 entity.name.function
    /((?<=\b(?:bool|float|char|int|double|unsigned)\s{1,4})[a-z]\w*)/,  // 12 field declaration
    /((?<=\.)[a-z]\w*)/,                                                // 13 field access
    /\b([a-z]\w*)(?=\.)/,                                               // 14 the variable it hangs off
    /\b([A-Z]\w*)\b/,                                                   // 15 entity.name.class
    /((?<=&\s)[a-z]\w*(?=\)))/,                                         // 16 variable.parameter
    /(::|&|=|-)/,                                                       // 17 keyword.operator
  ].map(r => r.source).join('|'), 'g');
  const classes = ['c-com', 'c-str', 'c-kw', 'c-type', 'c-const', 'c-num',
    'c-support', 'c-class', 'c-macro', 'c-supfn', 'c-fn', 'c-field', 'c-field',
    'c-param', 'c-class', 'c-param', 'c-op'];
  let out = '';
  let last = 0;
  let m;
  while ((m = master.exec(src)) !== null) {
    out += esc(src.slice(last, m.index));
    let cls = '';
    for (let g = 1; g < m.length; g++) {
      if (m[g] !== undefined) { cls = classes[g - 1]; break; }
    }
    out += cls ? '<span class="' + cls + '">' + esc(m[0]) + '</span>' : esc(m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}

