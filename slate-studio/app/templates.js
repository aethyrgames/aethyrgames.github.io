// Templates, and everything that moves a document in or out of the app: the
// builtin starting points, JSON import and export, and share links.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- templates ----------
// Starting points, kept apart from projects: a template is a shape you stamp
// out repeatedly, a project is a thing you are working on.

const TEMPLATES_KEY = PROFILE.storagePrefix + '.templates.v1';
const tn = (type, extra) => Object.assign(makeNode(type), extra || {});

function builtinTemplates() {
  // A builder returns the window's children, or { windows: [...] } when the
  // example is about windows themselves. Every extra feature the tool has should
  // turn up in at least one of these, since a template is where people look to
  // find out what it can do.
  const win = (label, kids, extra) => Object.assign(
    makeNode('window'), { label, children: kids }, extra || {});
  const sec = (label, kids) => Object.assign(tn('section', { label }), { children: kids });
  const kids = (node, list) => Object.assign(node, { children: list });

  const defs = [
    ['Blank window', () => []],

    // Function containers, units, per-widget width, a color override, a modal
    ['Settings dialog', () => [
      sec('Display', [
        tn('checkbox', { label: 'Fullscreen' }),
        tn('checkbox', { label: 'V-Sync' }),
        tn('sliderfloat', { label: 'Brightness', min: 0, max: 100, unit: '%', itemw: 160 }),
        tn('combo', { label: 'Quality', items: 'Low, Medium, High, Ultra', itemw: 160 }),
      ]),
      sec('Audio', [
        tn('sliderfloat', { label: 'Master', min: 0, max: 100, unit: '%', itemw: 160 }),
        tn('sliderfloat', { label: 'Music', min: 0, max: 100, unit: '%', itemw: 160 }),
        tn('sliderint', { label: 'Latency', min: 0, max: 200, unit: 'ms', itemw: 160 }),
      ]),
      tn('separator'),
      tn('button', { label: 'Apply', colors: { Button: [0.15, 0.55, 0.55, 1] } }),
      kids(tn('modal', { label: 'Discard changes?', sameline: true }), [
        tn('textwrapped', { label: 'Your changes will be lost.' }),
        tn('button', { label: 'Discard' }),
        tn('button', { label: 'Keep editing', sameline: true }),
      ]),
    ]],

    // A SameLine run, a context popup, and Text with format arguments
    ['Toolbar and list', () => [
      tn('button', { label: 'New' }),
      tn('button', { label: 'Open', sameline: true }),
      tn('button', { label: 'Save', sameline: true }),
      kids(tn('popup', { label: 'More', sameline: true }), [
        tn('menuitem', { label: 'Duplicate', shortcut: 'Ctrl+D' }),
        tn('menuitem', { label: 'Rename', shortcut: 'F2' }),
        tn('separator'),
        tn('menuitem', { label: 'Delete', shortcut: 'Del' }),
      ]),
      tn('separator'),
      tn('inputtextwithhint', { label: 'Search' }),
      tn('listbox', { label: 'Items', items: 'First, Second, Third' }),
      tn('textfmt', { format: '%d of %d shown', args: 'state.shown, state.total' }),
      tn('inputint', { label: 'Shown' }),
      tn('inputint', { label: 'Total' }),
    ]],

    // A table keeps label and field columns aligned, which a flow layout cannot
    ['Property inspector', () => [
      kids(tn('table', { label: 'props', cols: 2 }), [
        tn('text', { label: 'Name' }), tn('inputtext', { label: '##name' }),
        tn('text', { label: 'Position' }), tn('dragfloat', { label: '##pos', n: 3, unit: 'm' }),
        tn('text', { label: 'Scale' }), tn('sliderfloat', { label: '##scale', min: 0.1, max: 4 }),
        tn('text', { label: 'Tint' }), tn('coloredit', { label: '##tint' }),
      ]),
      tn('separator'),
      kids(tn('collapsingheader', { label: 'Advanced' }), [
        tn('checkbox', { label: 'Cast shadows' }),
        tn('inputint', { label: 'LOD bias' }),
      ]),
    ]],

    // The overlay is a window of its own that the main one shows and hides
    ['Debug overlay', () => ({
      windows: [
        win('Game', [
          tn('textfmt', { format: 'Frame %.2f ms', args: 'state.frameMs' }),
          tn('inputfloat', { label: 'Frame Ms' }),
          tn('separator'),
          tn('button', { label: 'Debug overlay', toggles: 'Overlay' }),
        ]),
        win('Overlay', [
          tn('plotlines', { label: 'Frame time' }),
          tn('plothistogram', { label: 'Draw calls' }),
          tn('separator'),
          tn('checkbox', { label: 'Show colliders' }),
          tn('checkbox', { label: 'Show wireframe' }),
        ], {
          closable: true, openAtStart: false, x: 440, y: 30, w: 300, h: 260,
          colors: { WindowBg: [0.05, 0.06, 0.08, 0.92] },
        }),
      ],
    })],

    // Tabs, and a child region that scrolls on its own
    ['Tabbed panel', () => [
      kids(tn('tabbar', { label: 'Tabs' }), [
        kids(tn('tabitem', { label: 'General' }), [
          tn('checkbox', { label: 'Enabled' }),
          tn('inputtext', { label: 'Name' }),
        ]),
        kids(tn('tabitem', { label: 'Advanced' }), [
          tn('inputint', { label: 'Threads' }),
          kids(tn('child', { label: 'log', h: 90 }), [
            tn('textwrapped', { label: 'Output appears here.' }),
          ]),
        ]),
      ]),
    ]],

    // The show/hide mechanism on its own, which is the part worth seeing wired up
    ['Show and hide windows', () => ({
      windows: [
        win('Workspace', [
          tn('text', { label: 'Toggle the panels:' }),
          tn('separator'),
          tn('button', { label: 'Inspector', toggles: 'Inspector' }),
          tn('button', { label: 'Console', toggles: 'Console', sameline: true }),
          tn('separator'),
          tn('textwrapped', {
            label: 'Each button flips a bool the generated code owns. The panels '
              + 'carry a close button of their own, which clears the same bool.',
          }),
        ]),
        win('Inspector', [
          tn('inputtext', { label: 'Name' }),
          tn('dragfloat', { label: 'Weight', unit: 'kg' }),
        ], { closable: true, openAtStart: true, x: 440, y: 30, w: 260, h: 190 }),
        win('Console', [
          tn('inputtextwithhint', { label: 'Command' }),
          tn('textwrapped', { label: 'Ready.' }),
        ], { closable: true, openAtStart: false, x: 440, y: 250, w: 260, h: 190 }),
      ],
    })],

    // Menu bar, nested menus, and a tooltip hung off the item before it
    ['Menus and dialogs', () => [
      kids(tn('menubar'), [
        kids(tn('menu', { label: 'File' }), [
          tn('menuitem', { label: 'New', shortcut: 'Ctrl+N' }),
          tn('menuitem', { label: 'Open', shortcut: 'Ctrl+O' }),
          tn('separator'),
          tn('menuitem', { label: 'Quit', shortcut: 'Alt+F4' }),
        ]),
        kids(tn('menu', { label: 'View' }), [
          tn('menuitem', { label: 'Zoom in', shortcut: ']' }),
          tn('menuitem', { label: 'Zoom out', shortcut: '[' }),
        ]),
      ]),
      tn('text', { label: 'Hover the button for a tooltip.' }),
      tn('button', { label: 'What is this?' }),
      kids(tn('tooltip'), [
        tn('textwrapped', { label: 'A tooltip attaches to the item before it.' }),
      ]),
      tn('separator'),
      kids(tn('modal', { label: 'Delete file?' }), [
        tn('textwrapped', { label: 'This cannot be undone.' }),
        tn('button', { label: 'Delete', colors: { Button: [0.6, 0.15, 0.3, 1] } }),
        tn('button', { label: 'Cancel', sameline: true }),
      ]),
    ]],
  ];

  return defs.map(([name, build]) => {
    // built from a function so one bad widget type can't take the whole list
    // down at load time
    let built = [];
    try { built = build(); } catch (e) { built = []; }
    const windows = Array.isArray(built)
      ? [win(name, built.filter(n => n && PROFILE.catalog[n.type]))]
      : (built.windows || []).filter(w => w && w.type === 'window');
    let i = 0;
    for (const w of windows) w.id = 'tw' + (i++);
    return {
      id: 'builtin:' + name,
      name,
      builtin: true,
      doc: { type: 'root', children: windows.length ? windows : [win(name, [])] },
    };
  });
}

let templates = [];

// The ORDER as well as the custom entries. Only the custom subset was saved and
// the list was always rebuilt builtins-first, so dragging a custom template
// above a builtin one looked like it worked and was gone after a reload.
function saveTemplates() {
  const mine = templates.filter(t => !t.builtin);
  const order = templates.map(t => t.name);
  lsSet(TEMPLATES_KEY, JSON.stringify({ v: 1, templates: mine, order }));
}

function loadTemplates() {
  const s = lsJson(TEMPLATES_KEY, null);
  const saved = (s && Array.isArray(s.templates)) ? s.templates.filter(t => t && t.doc) : [];
  // Through the PROFILE, not builtinTemplates() directly: the builder above
  // is the imgui page's provider, and calling it here put imgui's template
  // list on the slate page, where every unknown widget type silently emptied
  // out. The profile decides what "builtin" means for its page.
  templates = (PROFILE.templates || []).concat(saved);
  // Replay the saved order over the rebuilt list. Names not in it (a builtin
  // added since the order was saved) keep their natural position at the end,
  // so a new builtin still shows up rather than being ordered away.
  const order = (s && Array.isArray(s.order)) ? s.order : null;
  if (order) {
    const rank = new Map(order.map((n, i) => [n, i]));
    templates = templates
      .map((t, i) => ({ t, k: rank.has(t.name) ? rank.get(t.name) : order.length + i }))
      .sort((a, b) => a.k - b.k)
      .map(x => x.t);
  }
}

function applyTemplate(t, asNew) {
  const run = () => {
    if (asNew) { addProject(t.name, t.doc); saveProjects(); return; }
    applyDocData(JSON.parse(JSON.stringify(t.doc)), 100);
    refresh();
  };
  const n = countNodes(doc.children);
  if (!asNew && n > 0) {
    askConfirm(`Replace this document with the "${t.name}" template? `
      + `${n} widget${n > 1 ? 's' : ''} will be discarded. Ctrl+Z undoes it.`, run);
  } else run();
}

// A template is a bundle of widgets, so inserting one means inserting its
// contents at the drop point rather than replacing the document. Applying it as
// a whole document is still there, under the + button.
function templateWidgets(t) {
  const wins = (t.doc && t.doc.children) || [];
  const src = wins.length && wins[0].type === 'window' ? wins[0].children : wins;
  const ids = new Set();
  return sanitize(JSON.parse(JSON.stringify(src || [])), ids, false);
}

// Every window a template carries. An example about showing and hiding windows
// is only an example if all of them come along.
function templateWindows(t) {
  const wins = ((t.doc && t.doc.children) || []).filter(w => w && w.type === 'window');
  const ids = new Set();
  // atRoot, because sanitize drops a window node anywhere else and these are
  // going to the document root. Passing false returned an empty list, so the
  // multi-window branch never ran and only the first window's widgets landed.
  return sanitize(JSON.parse(JSON.stringify(wins)), ids, true);
}

function insertTemplateAt(t, drop) {
  const kids = templateWidgets(t);
  // A template built around several windows brings all of them, as windows. Its
  // buttons refer to the others by title, so folding it into one container would
  // leave the example pointing at nothing.
  //
  // The same path covers a document with no window at all: a template carries its
  // own, so inserting one can just add it rather than refusing. Before this the
  // insert failed silently, since there was no container to put anything in.
  //
  // Tested BEFORE the empty check, not after. "Blank window" is a template whose
  // whole point is the window and which has no widgets at all, so an early return
  // on `!kids.length` meant clicking it only ever flashed "nothing to insert".
  // The one template a new user reaches for first was the one that did nothing,
  // and the tutorial's first step told them to click it.
  const wins = templateWindows(t);
  const noWindow = !doc.children.some(n => n.type === 'window');
  if (wins.length > 1 || noWindow || !kids.length) {
    // A template with no windows AND no widgets reaches here through the
    // `!kids.length` arm, and selectId(wins[0].id) threw on the empty array.
    // Nothing shipped is shaped like that, but a saved template can be.
    if (!wins.length) {
      flashStatus(`"${titleCase(t.name)}" is empty, so there was nothing to insert.`);
      return;
    }
    for (const w of wins) doc.children.push(w);
    selectId(wins[0].id);
    refresh();
    flashStatus(wins.length > 1
      ? `Added ${wins.length} windows from "${titleCase(t.name)}".`
      : `Added the window from "${titleCase(t.name)}".`);
    return;
  }
  // Past this point the template genuinely has nothing to add: no windows of its
  // own and no widgets either.
  if (!kids.length) {
    flashStatus(`"${titleCase(t.name)}" has nothing to insert. `
      + 'Right-click it to open it as its own project.');
    return;
  }
  // Otherwise it lands in a Function container, so the generated code calls it
  // rather than inlining a wall of widgets. It draws nothing of its own, so the
  // canvas looks the same either way, and it can be ungrouped like any other.
  const wrap = Object.assign(makeNode('section'), {
    label: titleCase(t.name), children: kids,
  });
  if (!insertAt(wrap, drop)) return;
  selectId(wrap.id);
  refresh();
}

function insertTemplate(t) {
  insertTemplateAt(t, dropSiblingAfterSelection());
}

// Into the nearest container that can hold it, walking up from the selection the
// same way the palette does, rather than as a sibling of whatever is selected.
function insertTemplateInHost(t) {
  const host = insertHost('section');
  // No host means no window yet, which insertTemplateAt handles by adding the
  // template's own. Returning here instead made the click do nothing at all.
  insertTemplateAt(t, host ? { parentId: host.id, index: (host.children || []).length } : null);
}

function renderTemplates() {
  const host = document.getElementById('tpllist');
  host.innerHTML = '';
  for (const t of templates) {
    const row = document.createElement('div');
    row.className = 'tplrow';
    const n = document.createElement('span');
    n.className = 'tplname';
    n.textContent = titleCase(t.name);
    n.title = (t.builtin ? 'Built in. ' : '')
      + 'Click to insert it into the nearest container of the selection. '
      + 'Drag it onto the canvas to place it, or up and down this list to reorder. '
      + 'Right-click to open it as its own project.';
    // Guarded the way the hierarchy rows are. This was a bare onclick, so an
    // aborted reorder drag (press, move a few pixels, release on the same row)
    // also inserted the template.
    n.onclick = () => { if (!listDragMoved) insertTemplateInHost(t); };
    row.appendChild(n);
    const count = document.createElement('span');
    count.className = 'tplcount';
    count.textContent = countNodes(t.doc.children);
    row.appendChild(count);
    const add = document.createElement('button');
    add.textContent = '＋';
    add.title = 'Insert into the nearest container of the selection';
    add.onclick = e => { e.stopPropagation(); insertTemplateInHost(t); };
    row.appendChild(add);
    if (!t.builtin) {
      const del = document.createElement('button');
      del.textContent = '✕';
      del.title = 'Delete this template';
      del.onclick = e => {
        e.stopPropagation();
        askConfirm(`Delete the template "${t.name}"?`, () => {
          templates = templates.filter(x => x !== t);
          saveTemplates();
          renderTemplates();
        });
      };
      row.appendChild(del);
    }
    row.dataset.index = String(templates.indexOf(t));
    row.addEventListener('mousedown', e => startTemplateDrag(e, templates.indexOf(t), t));
    row.oncontextmenu = e => {
      e.preventDefault();
      openContextMenu(e, [
        { group: '1', order: 0, label: 'Apply Here', run: () => applyTemplate(t, false) },
        { group: '1', order: 1, label: 'Open as Project', run: () => applyTemplate(t, true) },
        { group: '2', order: 0, label: 'Export Template', run: () => exportTemplates([t]) },
        t.builtin ? null : { group: '9z', order: 0, label: 'Delete', danger: true,
          run: () => { templates = templates.filter(x => x !== t); saveTemplates(); renderTemplates(); } },
      ]);
    };
    host.appendChild(row);
  }
}

function saveCurrentAsTemplate() {
  const firstWin = doc.children.find(n => n.type === 'window');
  const base = ((firstWin && firstWin.label) || 'Template').trim();
  let name = base;
  let i = 2;
  while (templates.some(t => t.name === name)) name = base + ' ' + (i++);
  templates.push({ id: 't' + templates.length + '-' + name, name, doc: JSON.parse(JSON.stringify(doc)) });
  saveTemplates();
  renderTemplates();
}

// ---------- import and export ----------

function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportProject() {
  const p = projects.find(x => x.id === activeProject);
  downloadJson('imguistudio-panel.json', { v: 2, kind: 'project', name: (p && p.name) || '', doc });
}

// Templates get their own file kind so importing one can't be mistaken for
// opening a document, which is why these buttons are separate from Export JSON.
function exportTemplates(list) {
  const mine = (list || templates).filter(t => !t.builtin || list);
  downloadJson('imguistudio-templates.json',
    { v: 1, kind: 'templates', templates: mine.map(t => ({ name: t.name, doc: t.doc })) });
}

function exportEverything() {
  snapshotActive();
  downloadJson('imguistudio-everything.json', {
    v: 1,
    kind: 'everything',
    projects: projects.map(p => ({ name: p.name, doc: p.doc, nextId: p.nextId })),
    templates: templates.filter(t => !t.builtin).map(t => ({ name: t.name, doc: t.doc })),
    layout,
    binds: bindOverrides,
    theme: currentTheme,
    // the editor's own look, kept apart from `theme` above which is the
    // generated-code syntax theme
    uitheme: currentUiTheme,
    guides,
    hotbar,
  });
}

// One reader for every file kind, so dropping the wrong file tells you what it
// was instead of silently doing nothing.
function importPayload(s) {
  if (!s || typeof s !== 'object') throw new Error('not an ImGuiStudio file');
  if (s.kind === 'templates' || (Array.isArray(s.templates) && !s.projects && !s.doc)) {
    const add = (s.templates || []).filter(t => t && t.doc);
    if (!add.length) throw new Error('no templates in that file');
    for (const t of add) {
      let name = t.name || 'Imported';
      let i = 2;
      while (templates.some(x => x.name === name)) name = (t.name || 'Imported') + ' ' + (i++);
      templates.push({ id: 'ti' + templates.length, name, doc: t.doc });
    }
    saveTemplates();
    renderTemplates();
    return `imported ${add.length} template${add.length > 1 ? 's' : ''}`;
  }
  if (s.kind === 'everything') {
    // Validated FIRST, then applied. It used to apply projects, then templates,
    // then bindings, so a malformed entry half way down left the app holding
    // some of the file and none of the rest, with no way back.
    const projs = (s.projects || []).filter(p => p && p.doc
      && (p.doc.type === 'root' || p.doc.type === 'window'));
    const tpls = (s.templates || []).filter(t => t && t.doc);
    if (!projs.length && !tpls.length && !s.binds && !s.layout && !s.theme) {
      throw new Error('that file holds nothing this app can import');
    }
    for (const p of projs) addProject(p.name, p.doc);
    for (const t of tpls) {
      templates.push({ id: 'ti' + templates.length, name: t.name || 'Imported', doc: t.doc });
    }
    if (s.binds) {
      bindOverrides = s.binds;
      // Modifiers cleared before the default is applied, matching resetBinds and
      // the per-row Restore button. Without the clear, a live binding's Shift
      // survived a default that has no Shift, so an import left a combo neither
      // the file nor the defaults contain.
      for (const b of KEYMAP) {
        Object.assign(b, { key: undefined, ctrl: undefined, alt: undefined, shift: undefined },
          b.def, bindOverrides[b.id] || {});
      }
      lsSet(BINDS_KEY, JSON.stringify(bindOverrides));
    }
    // The export writes these two and the import never read them back, so a full
    // export-then-import round trip silently dropped both.
    if (s.layout && s.layout.panels) {
      layout = { panels: { ...layout.panels, ...s.layout.panels },
        size: { ...layout.size, ...(s.layout.size || {}) } };
      applyLayout();
    }
    if (s.theme && THEMES[s.theme]) {
      currentTheme = s.theme;
      themeSel.value = currentTheme;
      lsSet(THEME_KEY, currentTheme);
      applyTheme(currentTheme);
    }
    // Editor UI theme, guides and the hotbar: exportEverything writes these but
    // this branch never read them back, so a round trip restored a visibly
    // different editor than the one exported.
    if (s.uitheme && UI_THEMES[s.uitheme]) applyUiTheme(s.uitheme);
    if (Array.isArray(s.guides)) {
      guides = s.guides.filter(g => g
        && (g.axis === 'x' || g.axis === 'y') && typeof g.pos === 'number');
      renderGuides();
      saveGuides();
    }
    if (Array.isArray(s.hotbar)) {
      s.hotbar.forEach((t, i) => { if (i < hotbar.length) hotbar[i] = t; });
      saveHotbar();
      // the sibling restores repaint (applyUiTheme, renderGuides), and without
      // this one the Pinned row kept its old count until a reload
      renderPalette();
    }
    saveTemplates();
    saveProjects();
    renderTemplates();
    return 'imported everything';
  }
  const d = s.doc || s;
  if (!d || (d.type !== 'root' && d.type !== 'window')) throw new Error('not an ImGuiStudio document');
  // s.name is the tab name exportProject saves; d.label only exists when the
  // document is a lone window, which is why a project export used to come back
  // as 'Imported' every time
  addProject(s.name || d.label || 'Imported', d);
  saveProjects();
  return 'opened as a new project';
}

// ---------- share links ----------
// The document rides in the URL fragment, which never reaches a server. Deflate
// keeps a real panel inside what browsers and chat apps will carry.

function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function encodeShare(payload) {
  const json = JSON.stringify(payload);
  const raw = new TextEncoder().encode(json);
  if (typeof CompressionStream !== 'function') return 'u' + b64urlEncode(raw);
  const cs = new CompressionStream('deflate-raw');
  const buf = await new Response(new Blob([raw]).stream().pipeThrough(cs)).arrayBuffer();
  return 'z' + b64urlEncode(new Uint8Array(buf));
}

// Ceilings on a share link, because a link is untrusted input that runs at boot
// with no click from the user.
//
// SHARE_MAX_CODE is the fragment itself: a real panel encodes to a few KB, and
// copyShareLink already calls 1800 characters large.
// SHARE_MAX_BYTES is the INFLATED size, which is the one that matters. deflate
// reaches about 1000:1 on repetitive input, so an 87KB fragment that fits in any
// URL inflated to 64MB, and `new Response(...).arrayBuffer()` buffered all of it
// before a single line of validation ran. Reading the stream chunk by chunk with
// a running budget stops it at the ceiling instead.
const SHARE_MAX_CODE = 512 * 1024;
const SHARE_MAX_BYTES = 8 * 1024 * 1024;

async function readCapped(stream, cap) {
  const reader = stream.getReader();
  const parts = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) {
      reader.cancel();
      throw new Error(`shared document is larger than ${Math.round(cap / 1048576)}MB`);
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

async function decodeShare(code) {
  if (code.length > SHARE_MAX_CODE) throw new Error('share link is too long');
  const bytes = b64urlDecode(code.slice(1));
  if (code[0] === 'u') {
    if (bytes.length > SHARE_MAX_BYTES) throw new Error('shared document is too large');
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  const ds = new DecompressionStream('deflate-raw');
  const out = await readCapped(new Blob([bytes]).stream().pipeThrough(ds), SHARE_MAX_BYTES);
  return JSON.parse(new TextDecoder().decode(out));
}

async function buildShareLink() {
  const code = await encodeShare({ v: 1, doc });
  return location.origin + location.pathname + '#d=' + code;
}

async function copyShareLink() {
  try {
    const url = await buildShareLink();
    // copyText says whether it worked. Only add what is specific to a link, and
    // only when it DID work. This ran unconditionally, so a failed clipboard
    // write flashed "could not reach the clipboard" and was immediately painted
    // over with "Link copied", the one message that is definitely false.
    const ok = await copyText(url, 'Share link');
    if (ok && url.length > 1800) {
      flashStatus(`Link copied (${url.length} characters, `
        + 'which some chat apps will truncate).');
    }
  } catch (e) {
    flashStatus('Could not build a share link: ' + e.message);
  }
}

// Reads a shared document out of the fragment and opens it as its own project,
// so following a link never overwrites what you were working on.
async function loadSharedFromUrl() {
  // bounded, so a multi-megabyte fragment is refused by the match rather than
  // captured and handed on
  const m = new RegExp('[#&]d=([A-Za-z0-9_-]{1,' + SHARE_MAX_CODE + '})').exec(location.hash || '');
  if (!m) return false;
  try {
    const payload = await decodeShare(m[1]);
    if (!payload || !payload.doc || (payload.doc.type !== 'root' && payload.doc.type !== 'window')) return false;
    // A root doc carries no label of its own; its first window usually does,
    // so two different links don't both land as an unlabeled "Shared".
    const firstWin = payload.doc.children && payload.doc.children[0];
    addProject(payload.doc.label || (firstWin && firstWin.label) || 'Shared', payload.doc);
    saveProjects();
    // window.history, not the bare name: doc.js's undo ring is also called
    // `history` and, sharing this file's global scope, shadows the browser's.
    window.history.replaceState(null, '', location.pathname + location.search);
    flashStatus('Opened a shared document as a new project.');
    return true;
  } catch (e) {
    flashStatus('That share link could not be read.');
    return false;
  }
}

let flashTimer = null;
// While a flash is showing, updateHoverStatus (canvas.js) declines to overwrite
// it. Without this the very next mousemove over the canvas replaced the message
// with plain hover coordinates, so anything said while the pointer was on or
// heading across the canvas (a template inserted, a paste refusal, a share link
// opened) lasted a few milliseconds instead of its advertised 6 seconds.
let flashActive = false;
function flashStatus(msg) {
  hoverInfoEl.innerHTML = esc(msg);
  flashActive = true;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashActive = false; updateHoverStatus(null); }, 6000);
}

// One copy path, with a fallback and something said either way.
//
// navigator.clipboard is undefined on a non-secure origin and its write rejects
// when the document is not focused, and every caller invoked it bare: the copy
// failed silently and the user was left believing they had the code. The
// execCommand fallback is deprecated but it is the only thing that works on
// plain http, which is how this gets served from a file share or a LAN box.
function copyText(text, what) {
  const said = ok => flashStatus(ok
    ? (what ? what + ' copied to the clipboard.' : 'Copied to the clipboard.')
    : 'Could not reach the clipboard. Select the text and press Ctrl+C instead.');
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      said(ok);
      return ok;
    } catch (e) { said(false); return false; }
  };
  if (!navigator.clipboard || !navigator.clipboard.writeText) return fallback();
  return navigator.clipboard.writeText(text).then(() => { said(true); return true; }, fallback);
}

