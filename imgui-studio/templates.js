// Templates, and everything that moves a document in or out of the app: the
// builtin starting points, JSON import and export, and share links.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- templates ----------
// Starting points, kept apart from projects: a template is a shape you stamp
// out repeatedly, a project is a thing you are working on.

const TEMPLATES_KEY = 'imguistudio.templates.v1';
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

    // Function containers, units, per-widget width, a colour override, a modal
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
      ? [win(name, built.filter(n => n && WIDGETS[n.type]))]
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

function saveTemplates() {
  try {
    const mine = templates.filter(t => !t.builtin);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify({ v: 1, templates: mine }));
  } catch (e) {}
}

function loadTemplates() {
  let saved = [];
  try {
    const s = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || 'null');
    if (s && Array.isArray(s.templates)) saved = s.templates.filter(t => t && t.doc);
  } catch (e) {}
  templates = builtinTemplates().concat(saved);
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
    n.onclick = () => insertTemplateInHost(t);
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
  downloadJson('imguistudio-panel.json', { v: 2, kind: 'project', doc });
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
    for (const p of (s.projects || [])) {
      if (p && p.doc) addProject(p.name, p.doc);
    }
    for (const t of (s.templates || [])) {
      if (t && t.doc) templates.push({ id: 'ti' + templates.length, name: t.name || 'Imported', doc: t.doc });
    }
    if (s.binds) { bindOverrides = s.binds; for (const b of KEYMAP) Object.assign(b, b.def, bindOverrides[b.id] || {}); }
    saveTemplates();
    saveProjects();
    renderTemplates();
    return 'imported everything';
  }
  const d = s.doc || s;
  if (!d || (d.type !== 'root' && d.type !== 'window')) throw new Error('not an ImGuiStudio document');
  addProject(d.label || 'Imported', d);
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

async function decodeShare(code) {
  const bytes = b64urlDecode(code.slice(1));
  if (code[0] === 'u') return JSON.parse(new TextDecoder().decode(bytes));
  const ds = new DecompressionStream('deflate-raw');
  const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(buf));
}

async function buildShareLink() {
  const code = await encodeShare({ v: 1, doc });
  return location.origin + location.pathname + '#d=' + code;
}

async function copyShareLink() {
  try {
    const url = await buildShareLink();
    await navigator.clipboard.writeText(url);
    flashStatus(url.length > 1800
      ? `Link copied (${url.length} characters, which some chat apps will truncate).`
      : 'Share link copied to the clipboard.');
  } catch (e) {
    flashStatus('Could not build a share link: ' + e.message);
  }
}

// Reads a shared document out of the fragment and opens it as its own project,
// so following a link never overwrites what you were working on.
async function loadSharedFromUrl() {
  const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(location.hash || '');
  if (!m) return false;
  try {
    const payload = await decodeShare(m[1]);
    if (!payload || !payload.doc || (payload.doc.type !== 'root' && payload.doc.type !== 'window')) return false;
    addProject(payload.doc.label || 'Shared', payload.doc);
    saveProjects();
    history.replaceState(null, '', location.pathname + location.search);
    flashStatus('Opened a shared document as a new project.');
    return true;
  } catch (e) {
    flashStatus('That share link could not be read.');
    return false;
  }
}

let flashTimer = null;
function flashStatus(msg) {
  hoverInfoEl.innerHTML = esc(msg);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => updateHoverStatus(null), 6000);
}

