// Everything that paints the UI from the document: the palette, the hierarchy
// tree, the property inspector, the menu bar, the context menus, and the
// drag-to-reorder gestures in the tree and the templates list.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- ui rendering ----------


// Category collapse state persists. A filter force-opens sections that contain
// a match and restores the pre-filter state when cleared, so searching is a
// view and never a mutation.
const CAT_KEY = PROFILE.storagePrefix + '.cats';
let catOpen = {};
try { catOpen = JSON.parse(localStorage.getItem(CAT_KEY) || '{}'); } catch (e) {}
for (const c of PROFILE.categories) if (catOpen[c] === undefined) catOpen[c] = true;

function saveCats() {
  try { localStorage.setItem(CAT_KEY, JSON.stringify(catOpen)); } catch (e) {}
}

// A widget that can only live inside a particular container. Offering it when
// that container does not exist just produces a placeholder, so the button is
// disabled and says why instead.
const NEEDS_CONTAINER = {
  tabitem: ['tabbar', 'a Tab bar'],
  menuitem: ['menu', 'a Menu'],
  menu: ['menubar', 'a Menu bar'],
};

function blockedReason(type) {
  const wins = doc.children.filter(n => n.type === 'window');
  if (!wins.length && type !== 'window') {
    return 'Add a Window first: every widget lives inside one.';
  }
  const need = NEEDS_CONTAINER[type];
  if (!need) return null;
  let found = false;
  walk(doc, n => { if (n.type === need[0]) found = true; });
  return found ? null : `Needs ${need[1]}. Add one, then put this inside it.`;
}

function paletteButton(type, spec) {
  const b = document.createElement('button');
  const lbl = document.createElement('span');
  lbl.className = 'lbl';
  lbl.textContent = titleCase(spec.name);
  b.appendChild(lbl);
  b.dataset.type = type;
  // Both badges come from the live KEYMAP entry, not from the constant that
  // seeded it. Rebinding an arm key or a hotbar slot used to leave the palette
  // advertising the original letter forever.
  const fam = PROFILE.familyOf[type] ? keyFor('Arm ' + PROFILE.families[PROFILE.familyOf[type]]
    .map(t => PROFILE.catalog[t].name).join(', ')) : '';
  const slot = hotbar.indexOf(type);
  const slotKey = slot >= 0 ? keyFor('Arm the widget in hotbar slot ' + (slot + 1)) : '';
  const blocked = blockedReason(type);
  if (blocked) {
    // Not a native `disabled`: that drops the button from the tab order, so
    // the only explanation a Tab Item or Menu button is unavailable was a
    // hover tooltip a keyboard or screen reader user never reaches. Left
    // focusable and clickable; the click handler below reports the reason
    // instead of inserting.
    b.classList.add('blocked');
    b.setAttribute('aria-disabled', 'true');
    b.title = blocked;
  } else {
    b.title = (spec.container ? 'Container. ' : '') + 'Click to append, or drag onto the canvas'
      + (fam ? '. Key: ' + fam : '') + (slotKey ? '. Hotbar: ' + slotKey : '');
  }
  const badge = slotKey || fam;
  if (badge) {
    const k = document.createElement('span');
    k.className = 'kbd';
    if (slot >= 0) k.style.color = 'var(--mk-purple)';
    k.textContent = badge;
    b.appendChild(k);
  }
  b.addEventListener('mousedown', e => {
    if (e.button !== 0 || b.disabled || blocked) return;
    e.preventDefault();
    drag = { kind: 'palette', type, started: false, startX: e.clientX, startY: e.clientY, drop: null };
  });
  // A real mouse click never reaches here: it inserts through the mousedown
  // above plus the document-level mouseup that resolves an un-moved drag.
  // Keyboard activation (Enter/Space on a focused button) fires only a click,
  // with no mousedown/mouseup pair, so without this a focused palette button
  // did nothing at all. e.detail is 0 for that synthetic click and never 0 for
  // a pointer one, which is what keeps a real drag-click from inserting twice.
  b.addEventListener('click', e => {
    if (e.detail !== 0 || b.disabled) return;
    // A blocked button still reaches this handler now (see above): say why
    // instead of silently doing nothing, the way a real click already does.
    if (blocked) { flashStatus(blocked); return; }
    addNode(type);
  });
  b.addEventListener('contextmenu', e => {
    e.preventDefault();
    openContextMenu(e, paletteMenu(type, slot >= 0));
  });
  return b;
}

function renderPalette() {
  const host = document.getElementById('palette');
  const term = document.getElementById('filter').value.trim().toLowerCase();
  host.innerHTML = '';

  const matches = ([k, s]) => !s.hidden
    && (!term || s.name.toLowerCase().includes(term) || k.includes(term));

  // pinned first, so the things you use most never need scrolling to
  const pinned = hotbar.filter(t => t && PROFILE.catalog[t] && matches([t, PROFILE.catalog[t]]));
  if (pinned.length) {
    const open = term ? true : catOpen['★ Pinned'] !== false;
    const h = document.createElement('div');
    h.className = 'cat';
    h.innerHTML = '<span class="tw"></span><span></span>';
    h.querySelector('.tw').textContent = open ? '▾' : '▸';
    h.lastChild.textContent = '★ Pinned  (' + pinned.length + ')';
    h.style.color = 'var(--mk-purple)';
    h.onclick = () => {
      catOpen['★ Pinned'] = !open;
      saveCats();
      renderPalette();
    };
    host.appendChild(h);
    if (open) for (const t of pinned) host.appendChild(paletteButton(t, PROFILE.catalog[t]));
  }

  for (const cat of PROFILE.categories) {
    const entries = Object.entries(PROFILE.catalog).filter(([k, s]) => s.cat === cat && matches([k, s]));
    if (!entries.length) continue;
    // a filter that matched inside a collapsed section force-opens it
    const open = term ? true : catOpen[cat];
    const h = document.createElement('div');
    h.className = 'cat';
    h.innerHTML = '<span class="tw"></span><span></span>';
    h.querySelector('.tw').textContent = open ? '▾' : '▸';
    h.lastChild.textContent = cat + '  (' + entries.length + ')';
    h.onclick = () => { catOpen[cat] = !catOpen[cat]; saveCats(); renderPalette(); };
    host.appendChild(h);
    if (!open) continue;
    for (const [type, spec] of entries) host.appendChild(paletteButton(type, spec));
  }
  // both buttons stay put. Each is dead when it has nothing left to do
  const sections = PROFILE.categories.concat(['★ Pinned']);
  palCollapseAll.disabled = !sections.some(c => paletteSectionOpen(c));
  palExpandAll.disabled = sections.every(c => paletteSectionOpen(c));
  syncFilterClear('filter');
}

function paletteSectionOpen(cat) {
  return cat === '★ Pinned' ? catOpen[cat] !== false : !!catOpen[cat];
}

function setAllPaletteSections(open) {
  for (const c of PROFILE.categories) catOpen[c] = open;
  catOpen['★ Pinned'] = open;
  saveCats();
  renderPalette();
}

const palCollapseAll = document.getElementById('palCollapseAll');
const palExpandAll = document.getElementById('palExpandAll');
palCollapseAll.onclick = () => setAllPaletteSections(false);
palExpandAll.onclick = () => setAllPaletteSections(true);

// The × only exists while there is something to clear, and only on hover, so
// it never sits there as decoration.
function syncFilterClear(id) {
  const input = document.getElementById(id);
  if (input) input.closest('.filterwrap').classList.toggle('filled', !!input.value);
}

for (const btn of document.querySelectorAll('.clearfilter')) {
  btn.onclick = () => {
    const input = document.getElementById(btn.dataset.for);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  };
}

// ---------- menu bar ----------
// Items reuse the same shape as the context menus (group, order, key, run),
// and every action clicks the same hidden anchor button the command palette
// does, so a File entry and a palette entry can't drift apart.

const menuPop = document.getElementById('menupop');
let openMenu = null;

const click = id => document.getElementById(id).onclick();

function MENUS() {
  return {
    file: [
      { group: '1_doc', label: 'New project', key: keyFor('New project'), run: () => { addProject(); saveProjects(); } },
      { group: '1_doc', label: 'Reset to Sample', run: () => click('resetBtn') },
      { group: '2_io', label: 'Import JSON…', run: () => click('importBtn') },
      { group: '2_io', label: 'Export JSON', run: () => click('exportBtn') },
      { group: '2_io', label: 'Export everything', run: () => exportEverything() },
      { group: '3_tpl', label: 'Save as template', run: () => saveCurrentAsTemplate() },
      { group: '3_tpl', label: 'Import templates…', run: () => document.getElementById('tplImportBtn').onclick() },
      { group: '3_tpl', label: 'Export templates', run: () => exportTemplates() },
      { group: '4_share', label: 'Copy share link', run: () => click('shareBtn') },
      { group: '4_share', label: 'Copy C++', run: () => copyText(PROFILE.generate(), 'C++') },
      { group: '5_set', label: 'Settings…', run: () => click('settingsBtn') },
    ],
    view: [
      { group: '1_show', label: 'Background grid', checked: showGrid, run: () => click('gridBtn') },
      { group: '1_show', label: 'Rulers and guides', checked: showRulers, run: () => click('rulerBtn') },
      { group: '2_guides', label: 'Clear guides', disabled: !guides.length,
        run: () => { guides = []; renderGuides(); saveGuides(); } },
      { group: '3_view', label: 'Focus Selection', key: keyFor('Focus the selection'), disabled: !selectedId,
        run: () => focusSelection() },
      { group: '3_view', label: 'Reset View', key: keyFor('Reset the view to the origin'), run: () => resetPan() },
      { group: '4_theme', label: 'Themes…', run: () => openSettings('theme') },
    ],
    windows: [
      { group: '0_hdr', header: 'Panels' },
      ...Object.entries(layout.panels).map(([key, p], i) => ({
        group: '1_panels', order: i,
        label: panelEls[key].dataset.title,
        checked: !p.hidden,
        run: () => { p.hidden = !p.hidden; applyLayout(); },
      })),
      { group: '2_layout', label: 'Reset panel layout', run: () => resetPanelLayout() },
      { group: '3_over', label: 'Command palette', key: keyFor('Command palette'), run: () => openCmdk('all') },
      { group: '3_over', label: 'Keyboard shortcuts', key: keyFor('Keyboard shortcuts'), run: () => toggleHelp() },
    ],
    help: [
      // Ships next to index.html in the bundle, so a relative link works both on
      // the dev server and at whatever path the site is mounted under.
      { group: '0', label: 'Tutorial', run: () => openTutorial() },
      { group: '1', label: 'Keyboard shortcuts', key: keyFor('Keyboard shortcuts'), run: () => toggleHelp() },
      { group: '1', label: 'Command palette', key: keyFor('Command palette'), run: () => openCmdk('all') },
      { group: '2', label: 'Dear ImGui manual', run: () => window.open(IMGUI_MANUAL, '_blank', 'noopener') },
    ],
  };
}

// The keyboard's own idea of which row is current, independent of DOM focus
// (rows are plain divs, not tab stops). Reset on every render so switching
// menus or toggling a checkable row always starts from the top.
let menuSel = 0;

function highlightMenuRow(i) {
  const rows = [...menuPop.querySelectorAll('.mi:not(.disabled)')];
  rows.forEach(r => r.classList.remove('sel'));
  if (rows[i]) rows[i].classList.add('sel');
  return rows;
}

function renderMenu(name) {
  const items = (MENUS()[name] || []).filter(Boolean);
  items.sort((a, b) => (a.group || '5').localeCompare(b.group || '5') || (a.order || 0) - (b.order || 0));
  menuPop.innerHTML = '';
  let lastGroup = null;
  for (const it of items) {
    if (it.header) {
      const h = document.createElement('div');
      h.className = 'hdr';
      h.textContent = it.header;
      menuPop.appendChild(h);
      lastGroup = it.group;
      continue;
    }
    if (lastGroup !== null && it.group !== lastGroup) {
      const s = document.createElement('div');
      s.className = 'sep';
      s.setAttribute('role', 'separator');
      menuPop.appendChild(s);
    }
    lastGroup = it.group;
    const row = document.createElement('div');
    row.className = 'mi' + (it.disabled ? ' disabled' : '');
    row.setAttribute('role', it.checked === undefined ? 'menuitem' : 'menuitemcheckbox');
    if (it.checked !== undefined) row.setAttribute('aria-checked', String(!!it.checked));
    if (it.disabled) row.setAttribute('aria-disabled', 'true');
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = it.checked ? '✓' : '';
    row.appendChild(tick);
    const l = document.createElement('span');
    l.textContent = titleCase(it.label);
    row.appendChild(l);
    if (it.key) {
      const k = document.createElement('span');
      k.className = 'k';
      k.textContent = it.key;
      row.appendChild(k);
    }
    if (!it.disabled) {
      row.onclick = () => {
        // checkable rows stay open, so you can flip two without re-opening
        if (it.checked === undefined) closeMenu();
        it.run();
        if (it.checked !== undefined && openMenu) renderMenu(openMenu);
      };
    }
    menuPop.appendChild(row);
  }
  const top = document.querySelector(`.menutop[data-menu="${name}"]`);
  const r = top.getBoundingClientRect();
  menuPop.style.display = 'block';
  menuPop.style.left = Math.min(r.left, window.innerWidth - menuPop.offsetWidth - 6) + 'px';
  menuPop.style.top = r.bottom + 'px';
  for (const b of document.querySelectorAll('.menutop')) {
    b.classList.toggle('open', b.dataset.menu === name);
    if (b.hasAttribute('aria-haspopup')) b.setAttribute('aria-expanded', String(b.dataset.menu === name));
  }
  openMenu = name;
  menuSel = 0;
  highlightMenuRow(menuSel);
}

function closeMenu() {
  menuPop.style.display = 'none';
  openMenu = null;
  for (const b of document.querySelectorAll('.menutop')) {
    b.classList.remove('open');
    if (b.hasAttribute('aria-haspopup')) b.setAttribute('aria-expanded', 'false');
  }
}

// ArrowUp/Down move a highlighted row without needing real DOM focus (the
// rows are plain divs), and Enter activates it. Capture phase and ahead of
// the dispatcher: without stopping the event here, ArrowDown/Up also ran the
// edit-context "next/previous sibling" bindings underneath the open menu.
window.addEventListener('keydown', e => {
  if (!openMenu) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopImmediatePropagation();
    const rows = [...menuPop.querySelectorAll('.mi:not(.disabled)')];
    if (!rows.length) return;
    menuSel = e.key === 'ArrowDown' ? (menuSel + 1) % rows.length : (menuSel - 1 + rows.length) % rows.length;
    highlightMenuRow(menuSel);
    rows[menuSel].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    const rows = [...menuPop.querySelectorAll('.mi:not(.disabled)')];
    if (!rows[menuSel]) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    rows[menuSel].onclick();
  }
}, true);

// `[data-menu]` and not every .menutop: the Tutorial button shares the class so
// it sits on the bar's baseline, but it opens a page rather than a menu, and
// without the filter a click called renderMenu(undefined).
for (const b of document.querySelectorAll('.menutop[data-menu]')) {
  b.onclick = e => {
    e.stopPropagation();
    if (openMenu === b.dataset.menu) closeMenu();
    else renderMenu(b.dataset.menu);
  };
  // once one is open, sliding across the bar moves between them
  b.onmouseenter = () => { if (openMenu && openMenu !== b.dataset.menu) renderMenu(b.dataset.menu); };
}

// One path for both entry points, so the Help menu row and the bar button
// cannot drift apart and a test that covers one covers the other.
// The profile's page, because each studio teaches its own layout model. The
// bare-name fallback is the imgui page's own tutorial beside index.html.
function openTutorial() { window.open(PROFILE.tutorialUrl || 'tutorial.html', '_blank', 'noopener'); }
const tutorialTopBtn = document.getElementById('tutorialTopBtn');
if (tutorialTopBtn) {
  tutorialTopBtn.onclick = e => { e.stopPropagation(); closeMenu(); openTutorial(); };
}
document.addEventListener('mousedown', e => {
  if (openMenu && !menuPop.contains(e.target) && !e.target.closest('.menutop')) closeMenu();
}, true);
window.addEventListener('blur', closeMenu);
window.addEventListener('keydown', e => {
  // stopImmediatePropagation, not just preventDefault. This runs in the capture
  // phase, so without it the same Escape went on to the dispatcher and ran the
  // Edit-context Escape as well: closing a menu also disarmed the tool or
  // ascended out of the selection the menu was about to act on.
  if (e.key === 'Escape' && openMenu) {
    closeMenu();
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

// ---------- context menus ----------
// Items carry a group id and an order. The renderer sorts by them and inserts a
// separator wherever the group changes. That gives deterministic ordering,
// automatic separators, and destructive-last for free.

const ctxEl = document.getElementById('ctxmenu');
const IMGUI_MANUAL = 'https://pthom.github.io/imgui_manual_online/manual/imgui_manual.html';

function openContextMenu(e, items) {
  ctxEl.innerHTML = '';
  const live = items.filter(Boolean);
  live.sort((a, b) => (a.group || '5').localeCompare(b.group || '5') || (a.order || 0) - (b.order || 0));
  let lastGroup = null;
  for (const it of live) {
    if (it.header) {
      const h = document.createElement('div');
      h.className = 'hdr';
      h.textContent = it.header;
      ctxEl.appendChild(h);
      lastGroup = it.group;
      continue;
    }
    if (lastGroup !== null && it.group !== lastGroup) {
      const s = document.createElement('div');
      s.className = 'sep';
      s.setAttribute('role', 'separator');
      ctxEl.appendChild(s);
    }
    lastGroup = it.group;
    const row = document.createElement('div');
    row.className = 'mi' + (it.danger ? ' danger' : '');
    row.setAttribute('role', 'menuitem');
    if (it.disabled) { row.style.opacity = '0.4'; row.setAttribute('aria-disabled', 'true'); }
    const l = document.createElement('span');
    l.textContent = titleCase(it.label);
    row.appendChild(l);
    if (it.key) {
      const k = document.createElement('span');
      k.className = 'k';
      k.textContent = it.key;
      row.appendChild(k);
    }
    if (!it.disabled) {
      row.onclick = () => { closeContextMenu(); it.run(); };
    }
    ctxEl.appendChild(row);
  }
  ctxEl.style.display = 'block';
  // keep it on screen
  const w = ctxEl.offsetWidth, h = ctxEl.offsetHeight;
  ctxEl.style.left = Math.min(e.clientX, window.innerWidth - w - 6) + 'px';
  ctxEl.style.top = Math.min(e.clientY, window.innerHeight - h - 6) + 'px';
}

function closeContextMenu() { ctxEl.style.display = 'none'; }
function ctxOpen() { return ctxEl.style.display === 'block'; }
document.addEventListener('mousedown', e => {
  if (ctxEl.style.display === 'block' && !ctxEl.contains(e.target)) closeContextMenu();
}, true);
window.addEventListener('blur', closeContextMenu);

// The label promises a page about THIS widget, so resolve the widget's own
// ImGui function and open its declaration (and doc comment) in the pinned
// header. Falls back to the manual only when the function can't be resolved.
function docsUrlFor(type) {
  const entry = Object.entries(PROFILE.parser.schema || {}).find(([, e]) => e.type === type);
  const line = entry && PROFILE.docs.lines[entry[0]];
  return line
    ? `https://github.com/ocornut/imgui/blob/${PROFILE.docs.tag}/imgui.h#L${line}`
    : IMGUI_MANUAL;
}

function docsItem(type) {
  return {
    group: '9_docs', order: 0,
    label: 'ImGui reference for ' + PROFILE.catalog[type].name,
    run: () => window.open(docsUrlFor(type), '_blank', 'noopener'),
  };
}

function cppSnippet(node) {
  // The reference, not a JSON copy: renderProps' live editors close over the
  // actual node objects (`inp.oninput = () => { node[key] = inp.value; ... }`),
  // so restoring through JSON.parse handed doc.children back a tree of FRESH
  // clones. The inspector kept editing the old, now-orphaned objects, and
  // every edit after a snippet copy was silently thrown away. Holding the
  // reference, like templateCode in testhooks.js does, keeps the nodes the
  // inspector is bound to the same ones that end up back in doc.children.
  const saved = doc.children;
  const savedSel = selectedId;
  // generateCode only walks WINDOWS, so handing it a bare widget as the root
  // produced no windows at all and every "Copy C++ snippet" returned the file
  // header comment instead of the call. Wrap a non-window in one.
  const clone = JSON.parse(JSON.stringify(node));
  doc.children = clone.type === 'window'
    ? [clone]
    : [Object.assign(makeNode('window'), { id: 'snip', label: 'Snippet', children: [clone] })];
  const code = PROFILE.generate();
  doc.children = saved;
  selectedId = savedSel;
  const body = code.split('\n');
  const a = body.findIndex(l => l.includes('ImGui::Begin('));
  const b = body.findIndex(l => l.includes('ImGui::End()'));
  return body.slice(a + 1, b).map(l => l.replace(/^ {4}/, '')).join('\n');
}

function paletteMenu(type, isPinned) {
  const spec = PROFILE.catalog[type];
  const sel = selectedId && selectedId !== 'root' ? findNode(selectedId) : null;
  return [
    { group: '1_insert', order: 0, label: 'Insert After', key: keyFor('Descend into container'),
      run: () => insertNodeAt(type, dropSiblingAfterSelection()) },
    { group: '1_insert', order: 1, label: 'Insert Inside',
      disabled: !(sel && isContainer(sel)),
      run: () => insertNodeAt(type, { parentId: sel.id, index: (sel.children || []).length }) },
    { group: '1_insert', order: 2, label: 'Insert at End',
      run: () => insertNodeAt(type, { parentId: 'root', index: doc.children.length }) },
    { group: '3_pin', order: 0,
      label: isPinned ? 'Unpin from hotbar'
        : (hotbar.includes(null) ? 'Pin to hotbar' : 'Pin to hotbar (bar is full)'),
      disabled: !isPinned && !hotbar.includes(null),
      run: () => (isPinned ? unpin(type) : pinToHotbar(type)) },
    { group: '4_copy', order: 0, label: 'Copy ImGui call',
      run: () => copyText(cppSnippet(makeNode(type)), 'Snippet') },
    docsItem(type),
  ];
}

// The canvas and hierarchy menus share a spine and differ only in the head,
// which is what every surveyed tool does.
function widgetMenu(node, inTree) {
  const spec = PROFILE.catalog[node.type] || {};
  const parent = findParent(node.id);
  const container = isContainer(node);
  const kids = (node.children || []).length;
  return [
    { group: '1_head', order: 0, label: 'Toggle SameLine', key: keyFor('Toggle the SameLine join'),
      disabled: !parent || parent.children.indexOf(node) === 0,
      run: () => { selectId(node.id); toggleJoin(); } },
    { group: '1_head', order: 1, label: 'Rename', key: keyFor('Rename inline on the canvas'),
      disabled: !(spec.props || []).some(p => p[0] === 'label'),
      run: () => { selectId(node.id); beginInlineEdit(node.id); } },
    { group: '2_structure', order: 0, label: 'Wrap in Group', key: keyFor('Wrap selection in a Group'),
      run: () => { selectId(node.id); wrapSelection(); } },
    { group: '2_structure', order: 1, label: 'Unwrap container', key: keyFor('Unwrap container'),
      disabled: !container,
      run: () => { selectId(node.id); unwrapSelection(); } },
    { group: '3_order', order: 0, label: 'Move up', key: keyFor('Move up among siblings'),
      run: () => { selectId(node.id); reorderSelection(-1, false); } },
    { group: '3_order', order: 1, label: 'Move down', key: keyFor('Move down among siblings'),
      run: () => { selectId(node.id); reorderSelection(1, false); } },
    { group: '5_clip', order: 0, label: 'Cut', key: keyFor('Cut subtree'),
      run: () => { selectId(node.id); cutSelection(); } },
    { group: '5_clip', order: 1, label: 'Copy', key: keyFor('Copy subtree'),
      run: () => { selectId(node.id); copySelection(); } },
    { group: '5_clip', order: 2, label: 'Duplicate', key: keyFor('Duplicate selection'),
      run: () => { selectId(node.id); duplicateSelection(); } },
    { group: '6_code', order: 0, label: 'Copy C++ snippet',
      run: () => copyText(cppSnippet(node), 'Snippet') },
    { group: '6_code', order: 1, label: 'Show in Code',
      run: () => { selectId(node.id); revealInCode(node.id); } },
    { group: '1_head', order: 2, label: 'Go to', key: keyFor('Focus the selection'),
      run: () => { selectId(node.id); focusSelection(); } },
    inTree && container && kids
      ? { group: '7_tree', order: 0, label: 'Select children',
          run: () => selectMany((node.children || []).map(c => c.id)) }
      : null,
    docsItem(node.type),
    { group: '9z_del', order: 0, label: container && kids ? 'Delete (keep children)' : 'Delete',
      key: keyFor('Delete selection'), danger: true,
      run: () => { selectId(node.id); container && kids ? unwrapThenDelete(node.id) : deleteSelection(); } },
    container && kids
      ? { group: '9z_del', order: 1, label: 'Delete subtree', danger: true,
          run: () => { selectId(node.id); deleteSelection(); } }
      : null,
  ];
}

function backgroundMenu() {
  return [
    { group: '1_paste', order: 0, label: 'Paste', key: keyFor('Paste after selection'),
      disabled: !clipboardNode, run: pasteClipboard },
    { group: '2_select', order: 0, label: 'Select all', key: keyFor('Select all siblings'),
      run: () => selectMany(doc.children.map(c => c.id)) },
    { group: '2_select', order: 1, label: 'Deselect', key: keyFor('Disarm, else ascend to parent'),
      run: () => { clearSelection(); refresh(); } },
    { group: '4_view', order: 0, label: (showGrid ? 'Hide' : 'Show') + ' grid',
      run: () => setGrid(!showGrid) },
    { group: '4_view', order: 1, label: (showRulers ? 'Hide' : 'Show') + ' rulers',
      run: () => setRulers(!showRulers) },
    { group: '4_view', order: 2, label: 'Clear guides',
      disabled: !guides.length, run: () => { guides = []; renderGuides(); saveGuides(); } },
    { group: '6_code', order: 0, label: 'Copy All C++',
      run: () => copyText(PROFILE.generate(), 'C++') },
    { group: '8_more', order: 0, label: 'All Commands…', key: keyFor('Command palette'),
      run: () => openCmdk('all') },
  ];
}

// remove a container but keep its children, the "Delete (keep children)" case
function unwrapThenDelete(id) {
  const node = findNode(id);
  if (!node) return;
  const parent = findParent(id);
  const idx = parent.children.indexOf(node);
  const kids = node.children || [];
  if (node.sameline && kids[0]) kids[0].sameline = true;
  // Only windows may sit at the document root, and sanitize() deletes anything
  // else there on the next load. Splicing a window's children up into the root
  // therefore looked like it worked and silently threw the whole window away on
  // reload. There is nowhere for them to go, so the entry does the plain delete
  // it can actually honor and says so.
  if (parent === doc) {
    parent.children.splice(idx, 1);
    selectId(parent.children[0] ? parent.children[0].id : null);
    flashStatus('A window has no parent to keep its widgets in, so it was deleted whole.');
    return;
  }
  parent.children.splice(idx, 1, ...kids);
  selectId(kids[0] ? kids[0].id : parent.id);
}

// Same highlighting, but each line is wrapped and tagged with the widget that
// produced it. Highlighting runs per line so a tag can never split a span.
function highlightOwned(src, owners) {
  return src.split('\n').map((line, i) => {
    const id = owners && owners[i];
    const html = highlightCpp(line);
    // esc() on the id as well as the code. sanitize() now refuses an id that is
    // not the shape this app mints, so nothing hostile should reach here, but
    // this is the sink and it goes to innerHTML: an untrusted document arrives
    // from an import file or a #d= share link, and one that carried
    // `b"><img src=x onerror=...>` ran. Two independent guards, because either
    // one alone is a single edit away from being removed.
    return id ? `<span class="cline" data-node="${esc(id)}">${html}</span>` : html;
  }).join('\n');
}

function revealInCode(id) {
  const pre = document.getElementById('code');
  for (const m of pre.querySelectorAll('.cline.hl')) m.classList.remove('hl');
  const mine = [...pre.querySelectorAll('[data-node]')].filter(m => m.dataset.node === id);
  if (!mine.length) { pre.scrollIntoView({ block: 'nearest' }); return; }
  for (const m of mine) m.classList.add('hl');
  mine[0].scrollIntoView({ block: 'center' });
}

// Containers the user has folded shut. Absent means open, so a new document
// starts fully expanded and nothing has to be seeded.
const treeCollapsed = new Set();
const treeFilterEl = document.getElementById('treeFilter');

function treeRowMatches(node, term) {
  return (node.type + ' ' + (node.label || '')).toLowerCase().includes(term);
}

// A row survives the filter if it matches or anything under it does, so the
// path down to a match stays visible instead of the match appearing orphaned.
function treeSubtreeMatches(node, term) {
  return treeRowMatches(node, term)
    || (node.children || []).some(c => treeSubtreeMatches(c, term));
}

// ---------- reordering by drag, in the hierarchy and the templates list ----------
// Both lists share the same shape: press a row, and once the pointer has moved
// far enough an insertion line follows it. The threshold is what lets a plain
// click still mean "select".
const LIST_DRAG_SLOP = 5;
let listDrag = null;
let listDragMoved = false;

function listIndicator() {
  let el = document.getElementById('listline');
  if (!el) {
    el = document.createElement('div');
    el.id = 'listline';
    document.body.appendChild(el);
  }
  return el;
}

function hideListIndicator() {
  const el = document.getElementById('listline');
  if (el) el.style.display = 'none';
}

// Which row the pointer is over, and whether it means before, after, or inside.
function listTargetAt(host, y, selector) {
  // The host's VISIBLE box, not the whole scrolled list. A row scrolled out of
  // view is still in the DOM with a real rect, so a pointer above or below the
  // panel matched one and the insertion line was drawn against a row nobody
  // could see.
  const box = host.getBoundingClientRect();
  if (y < box.top - 8 || y > box.bottom + 8) return null;
  const rows = [...host.querySelectorAll(selector)].filter(r => r.offsetParent);
  for (const row of rows) {
    const r = row.getBoundingClientRect();
    if (r.bottom < box.top || r.top > box.bottom) continue;   // scrolled out
    if (y < r.top || y > r.bottom) continue;
    const third = r.height / 3;
    const where = y < r.top + third ? 'before' : (y > r.bottom - third ? 'after' : 'into');
    return { row, rect: r, where };
  }
  // Inside the panel but between rows: fall back to the last VISIBLE row. This
  // used to fall back for any y at all, so releasing the pointer far outside
  // the panel still reparented the widget onto the bottom row.
  const vis = rows.filter(r => {
    const b = r.getBoundingClientRect();
    return b.bottom >= box.top && b.top <= box.bottom;
  });
  const last = vis[vis.length - 1];
  return last ? { row: last, rect: last.getBoundingClientRect(), where: 'after' } : null;
}

// Whether a hierarchy drag would carry its SameLine join onto the row it
// lands beside. Only true for a before/after drop: dropping INTO a container
// starts the widget on a fresh line regardless of what it carried, the same
// rule moveNodeTo itself applies. Pulled out on its own so it can be asserted
// without faking the drag geometry showListIndicator needs.
function dropJoins(draggedId, where) {
  if (where === 'into') return false;
  const n = findNode(draggedId);
  return !!(n && n.sameline);
}

function showListIndicator(t, indent, joins) {
  const el = listIndicator();
  el.style.display = 'block';
  el.style.left = (t.rect.left + (indent || 0)) + 'px';
  el.style.width = (t.rect.width - (indent || 0)) + 'px';
  if (t.where === 'into') {
    el.classList.add('into');
    el.style.top = t.rect.top + 'px';
    el.style.height = t.rect.height + 'px';
  } else {
    el.classList.remove('into');
    el.style.top = ((t.where === 'before' ? t.rect.top : t.rect.bottom) - 1) + 'px';
    el.style.height = '2px';
  }
  // A join travels silently otherwise: the tree drop passes no `sameline` key
  // (moveNodeTo keeps whatever the node already carried), so the row you're
  // about to land on ends up merged with the one above it and the only sign
  // was the SameLine toggle in the inspector, after the fact. Said on the
  // indicator itself so it's not a surprise once the drop lands.
  el.classList.toggle('joins', !!joins);
}

// How far a drag pointer near the list's own top/bottom edge should pull the
// list's scroll position, in px. Pulled out so the ramp can be asserted
// without a real scrollable element. Zero once the pointer is more than
// LIST_AUTOSCROLL_MARGIN from either edge.
const LIST_AUTOSCROLL_MARGIN = 28;
const LIST_AUTOSCROLL_MAX = 14;
function listAutoScrollDelta(rect, y) {
  if (y < rect.top + LIST_AUTOSCROLL_MARGIN) {
    return -Math.ceil((rect.top + LIST_AUTOSCROLL_MARGIN - y) / LIST_AUTOSCROLL_MARGIN * LIST_AUTOSCROLL_MAX);
  }
  if (y > rect.bottom - LIST_AUTOSCROLL_MARGIN) {
    return Math.ceil((y - (rect.bottom - LIST_AUTOSCROLL_MARGIN)) / LIST_AUTOSCROLL_MARGIN * LIST_AUTOSCROLL_MAX);
  }
  return 0;
}
function autoScrollListEdge(host, y) {
  const delta = listAutoScrollDelta(host.getBoundingClientRect(), y);
  if (delta) host.scrollTop += delta;
}

function startTreeDrag(e, id) {
  if (e.button !== 0 || e.target.tagName === 'BUTTON' || e.target.classList.contains('box')) return;
  listDrag = { kind: 'tree', id, startX: e.clientX, startY: e.clientY };
  listDragMoved = false;
}

function startTemplateDrag(e, index, tpl) {
  if (e.button !== 0 || e.target.tagName === 'BUTTON') return;
  // One gesture, one owner. Arming a canvas drag here as well meant a drag onto
  // the canvas ran both: the ghost and the insertion line showed together, and
  // on release the list reordered and nothing was inserted. This starts as a
  // reorder and is promoted to a canvas drop the moment the pointer leaves the
  // list, which is also the only way to tell the two apart.
  listDrag = { kind: 'template', index, tpl, startX: e.clientX, startY: e.clientY };
  listDragMoved = false;
}

document.addEventListener('mousemove', e => {
  if (!listDrag) return;
  if (!listDragMoved) {
    if (Math.abs(e.clientX - listDrag.startX) + Math.abs(e.clientY - listDrag.startY) < LIST_DRAG_SLOP) return;
    listDragMoved = true;
  }
  if (listDrag.kind === 'tree') {
    const t = listTargetAt(document.getElementById('tree'), e.clientY, '.row');
    listDrag.target = t;
    if (t) {
      showListIndicator(t, t.where === 'into' ? 0 : parseFloat(t.row.style.paddingLeft) || 0,
        dropJoins(listDrag.id, t.where));
    } else hideListIndicator();
  } else {
    const host = document.getElementById('tpllist');
    const r = host.getBoundingClientRect();
    const outside = e.clientX < r.left || e.clientX > r.right
      || e.clientY < r.top - 8 || e.clientY > r.bottom + 8;
    if (outside) {
      // hand the gesture to the canvas drop path and stop being a reorder
      const tpl = listDrag.tpl;
      hideListIndicator();
      listDrag = null;
      listDragMoved = false;
      if (tpl) {
        drag = { kind: 'template', tpl, started: false,
          startX: e.clientX, startY: e.clientY, drop: null };
      }
      return;
    }
    // A row scrolled out of the panel could never be a drop target: nothing
    // else moved the list to bring it into view. Pull the list toward the
    // pointer near its own top/bottom edge, the way most reorderable lists do.
    autoScrollListEdge(host, e.clientY);
    const t = listTargetAt(host, e.clientY, '.tplrow');
    // a template list is flat, so there is no "inside"
    if (t && t.where === 'into') t.where = e.clientY < t.rect.top + t.rect.height / 2 ? 'before' : 'after';
    listDrag.target = t;
    if (t) showListIndicator(t, 0);
    else hideListIndicator();
  }
});

document.addEventListener('mouseup', e => {
  if (!listDrag) return;
  // The drag was armed by a LEFT press, so only a left release ends it. This
  // took no event at all, which meant clicking any other button mid-drag
  // committed the reparent while the left button was still held down.
  if (e && e.button !== undefined && e.button !== 0) return;
  const d = listDrag;
  listDrag = null;
  hideListIndicator();
  if (!listDragMoved || !d.target) { setTimeout(() => { listDragMoved = false; }, 0); return; }
  if (d.kind === 'tree') {
    const overId = d.target.row.dataset.id;
    const over = overId && findNode(overId);
    if (over && over.id !== d.id && !isAncestor(d.id, over.id)) {
      if (d.target.where === 'into' && isContainer(over)) {
        moveSelectionTo(d.id, { parentId: over.id, index: (over.children || []).length });
      } else {
        const parent = findParent(over.id);
        if (parent) {
          const at = parent.children.indexOf(over) + (d.target.where === 'after' ? 1 : 0);
          moveSelectionTo(d.id, { parentId: parent.id, index: at });
        }
      }
    }
  } else {
    const rows = [...document.querySelectorAll('#tpllist .tplrow')];
    const to = rows.indexOf(d.target.row) + (d.target.where === 'after' ? 1 : 0);
    reorderTemplate(d.index, to);
  }
  // clears after the click event that follows this mouseup
  setTimeout(() => { listDragMoved = false; }, 0);
});

function reorderTemplate(from, to) {
  if (from === to || from + 1 === to) return;
  const [moved] = templates.splice(from, 1);
  templates.splice(to > from ? to - 1 : to, 0, moved);
  saveTemplates();
  renderTemplates();
}

// A deeply nested row's indent, capped so it cannot outgrow the panel itself.
// Uncapped, a depth-14 row at the 150px minimum dock width pushed its own
// move/delete buttons past the clipped edge where nothing scrolls, and even
// at the default width the label was squeezed to nothing. 90px is left for
// the row's own content (icons, label, buttons) at any depth.
function treeRowIndent(depth, treeWidth) {
  return Math.min(6 + depth * 12, Math.max(6, treeWidth - 90));
}

function renderTree() {
  const host = document.getElementById('tree');
  const term = treeFilterEl.value.trim().toLowerCase();
  // Width is read BEFORE the clear: clientWidth forces a synchronous layout,
  // and forcing one on an emptied #tree clamps its scrollTop to 0, which made
  // the hierarchy jump back to the top on every repaint.
  const treeWidth = host.clientWidth || 280;
  host.innerHTML = '';
  const emit = (node, parent, index, depth) => {
    if (term && !treeSubtreeMatches(node, term)) return;
    const spec = PROFILE.catalog[node.type] || {};
    const isContainerRow = !!spec.container || node === doc;
    // a filter force-opens containers, the same way it does in the palette
    const open = term ? true : !treeCollapsed.has(node.id);
    const row = document.createElement('div');
    const isSelected = selection.has(node.id) || node.id === selectedId;
    row.className = 'row' + (isSelected ? ' selected' : '');
    row.style.paddingLeft = treeRowIndent(depth, treeWidth) + 'px';
    row.dataset.id = node.id;
    row.setAttribute('role', 'treeitem');
    row.setAttribute('aria-level', String(depth + 1));
    row.setAttribute('aria-selected', String(isSelected));
    // aria-expanded only where there is something to expand: setting it on a
    // leaf row is invalid and reads as a broken toggle to a screen reader.
    if (isContainerRow) row.setAttribute('aria-expanded', String(open));
    row.onclick = e => {
      // a drag that moved is not a click
      if (listDragMoved) return;
      if (e.shiftKey || e.ctrlKey || e.metaKey) toggleSelected(node.id);
      else selectId(node.id);
    };
    if (parent) row.addEventListener('mousedown', e => startTreeDrag(e, node.id));
    row.oncontextmenu = e => {
      e.preventDefault();
      if (!selection.has(node.id)) selectId(node.id);
      openContextMenu(e, node === doc ? backgroundMenu() : widgetMenu(node, true));
    };

    if (isContainerRow) {
      const c = document.createElement('span');
      c.className = 'box';
      c.textContent = (node.children || []).length ? (open ? '▾' : '▸') : '·';
      c.title = 'Collapse or expand';
      c.onclick = e => {
        e.stopPropagation();
        if (treeCollapsed.has(node.id)) treeCollapsed.delete(node.id);
        else treeCollapsed.add(node.id);
        renderTree();
      };
      row.appendChild(c);
    }

    const t = document.createElement('span');
    t.className = 'wtype';
    // PascalCase, so the tree reads like the ImGui calls it stands for
    t.textContent = pascalType(node.type);
    t.title = node.type;
    row.appendChild(t);

    const l = document.createElement('span');
    l.className = 'wlabel';
    l.textContent = titleCase(node.label || '');
    row.appendChild(l);

    if (node.sameline && index > 0) {
      const j = document.createElement('span');
      j.className = 'join';
      j.textContent = '⤷';
      j.title = 'joined to previous line (SameLine)';
      row.appendChild(j);
    }

    if (parent) {
      for (const [txt, title, fn] of [
        ['↑', 'Move up', () => moveNode(node.id, -1)],
        ['↓', 'Move down', () => moveNode(node.id, 1)],
        ['✕', 'Delete', () => removeNode(node.id)],
      ]) {
        const b = document.createElement('button');
        b.textContent = txt;
        b.title = title;
        b.onclick = e => { e.stopPropagation(); fn(); };
        row.appendChild(b);
      }
    }
    host.appendChild(row);
    if (isContainerRow && open) {
      (node.children || []).forEach((c, i) => emit(c, node, i, depth + 1));
    }
  };
  emit(doc, null, 0, 0);
  const sel = host.querySelector('.row.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
  // a container with no children has nothing to fold, so it doesn't count
  let foldable = 0;
  walk(doc, n => { if ((n.children || []).length) foldable++; });
  treeCollapseAll.disabled = foldable === 0 || treeCollapsed.size >= foldable;
  treeExpandAll.disabled = treeCollapsed.size === 0;
  syncFilterClear('treeFilter');
}

const treeCollapseAll = document.getElementById('treeCollapseAll');
const treeExpandAll = document.getElementById('treeExpandAll');
treeCollapseAll.onclick = () => {
  walk(doc, n => { if ((n.children || []).length) treeCollapsed.add(n.id); });
  renderTree();
};
treeExpandAll.onclick = () => { treeCollapsed.clear(); renderTree(); };
treeFilterEl.addEventListener('input', renderTree);
treeFilterEl.addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.target.value = ''; renderTree(); e.target.blur(); }
  e.stopPropagation();
});

// "Text colored" -> "Text Colored". Small words stay lowercase the way a title
// normally would, except when they lead.
const TITLE_MINOR = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in',
  'of', 'on', 'or', 'the', 'to', 'with']);

function titleCase(s) {
  return String(s).split(/\s+/).map((w, i) => {
    if (!w) return w;
    const low = w.toLowerCase();
    if (i > 0 && TITLE_MINOR.has(low)) return low;
    // leave things that are already shouting alone: V-Slider, C++, RGB
    if (w.length > 1 && w === w.toUpperCase()) return w;
    return w[0].toUpperCase() + w.slice(1);
  }).join(' ');
}

// A few keys are abbreviations that don't expand into anything readable.
const LABEL_NAMES = {
  itemw: 'Width', n: 'Components', w: 'W', h: 'H',
  args: 'Arguments', fmt: 'Format', r: 'R', g: 'G', b: 'B',
  // a Function container's label names the generated function, not a caption
  'section.label': 'Name',
};

// "sliderfloat" -> "SliderFloat", from the spec's own name so it matches the
// ImGui function rather than guessing at word boundaries.
function pascalType(type) {
  const spec = PROFILE.catalog[type];
  if (!spec) return type;
  return titleCase(spec.name).replace(/[\s-]+/g, '');
}

// Property keys are camelCase identifiers. The panel shows them as words.
// A property can mean something different on one widget than everywhere else,
// so a type-scoped entry wins over the shared one.
function helpFor(type, key) {
  return PROP_HELP[type + '.' + key] || PROP_HELP[key];
}

function labelFor(key, type) {
  if (type && LABEL_NAMES[type + '.' + key]) return LABEL_NAMES[type + '.' + key];
  if (LABEL_NAMES[key]) return LABEL_NAMES[key];
  if (key.length <= 2) return key.toUpperCase();       // w, h, n
  return titleCase(String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2'));
}

function renderProps() {
  const host = document.getElementById('propbody');
  host.innerHTML = '';
  const node = selectedId ? findNode(selectedId) : null;
  if (!node) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.textContent = 'Select a widget in the hierarchy or canvas.';
    host.appendChild(d);
    return;
  }
  const spec = PROFILE.catalog[node.type] || { props: [] };
  const propDefsAll = spec.props || [];

  // Unreal puts a small revert arrow beside anything that differs from its
  // default. It reads as "this one was touched" without needing a second
  // color, and it undoes exactly that property rather than the last action.
  // Reset every render: the ids only have to be unique within one paint of
  // this panel, and a fresh count keeps them short.
  let fieldIdSeq = 0;
  const addField = (labelText, input, isSet, restore, help) => {
    const l = document.createElement('label');
    l.textContent = labelText;
    // the name itself when there is nothing better, so an ellipsized label is
    // still readable on hover
    l.title = help || labelText;
    if (help && (input.title === undefined || !input.title)) input.title = help;
    if (isSet) l.className = 'set';
    // `input` is sometimes the real control and sometimes a wrapper around one
    // (numwrap, colorrow, the paired w/h row): htmlFor has to name the control
    // itself, a <span>/<div> is not labelable. Falls back to the long help
    // text on the label's own title when there is nothing to associate with
    // (the SameLine toggle is a bare div, not a form control at all).
    const control = ['INPUT', 'SELECT', 'TEXTAREA'].includes(input.tagName)
      ? input : (input.querySelector && input.querySelector('input, select, textarea'));
    if (control && !control.id) {
      control.id = 'prop-field-' + (fieldIdSeq++);
      l.htmlFor = control.id;
    }
    host.appendChild(l);
    if (restore) {
      const wrap = document.createElement('span');
      wrap.className = 'fieldwrap';
      wrap.appendChild(input);
      const rv = document.createElement('button');
      rv.className = 'revert';
      rv.textContent = '⟲';
      rv.title = 'Reset to the default';
      rv.onclick = () => { restore(); refresh(); };
      wrap.appendChild(rv);
      host.appendChild(wrap);
      return;
    }
    host.appendChild(input);
  };

  // A property counts as changed when it differs from the spec's default.
  const defaultOf = key => (propDefsAll.find(p => p[0] === key) || [])[2];
  const changed = key => {
    const d = defaultOf(key);
    return d !== undefined && String(node[key]) !== String(d);
  };
  const restoreFn = key => () => { node[key] = defaultOf(key); };

  const addHead = text => {
    const h = document.createElement('div');
    h.className = 'prophead';
    h.textContent = text;
    host.appendChild(h);
  };

  // what is selected, said plainly, so the panel is self-explanatory
  const ident = document.createElement('div');
  ident.className = 'propident';
  const nb = document.createElement('b');
  nb.textContent = node === doc ? 'Document' : (node.label || spec.name || node.type);
  ident.appendChild(nb);
  const ns = document.createElement('span');
  ns.textContent = spec.name || node.type;
  ident.appendChild(ns);
  host.appendChild(ident);

  const propDefs = spec.props || [];
  // A widget with no properties of its own (Separator, Spacing, Bullet) had a
  // PROPERTIES heading over nothing at all. Say so instead of ruling off an
  // empty space, and keep the heading only when there is something under it.
  if (propDefs.length) {
    addHead(node === doc ? titleCase('document') : titleCase('properties'));
  } else {
    const none = document.createElement('div');
    none.className = 'empty';
    none.textContent = 'No properties. ' + (spec.name || node.type)
      + ' takes no arguments, so there is nothing to set.';
    host.appendChild(none);
  }
  const byKey = Object.fromEntries(propDefs.map(p => [p[0], p]));

  // One editor for one property. Numeric ones honor the range and unit their
  // spec declares, so a width can't go negative and a duration says "s".
  // marked with its prop key, so beginInlineEdit can fall back to the Label
  // field when the preview published no rect for the widget
  const mark = (el, key) => { if (el && el.dataset) el.dataset.prop = key; return el; };
  const editorFor = ([key, type, , opts]) => {
    if (type === 'bool') {
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.checked = !!node[key];
      inp.onchange = () => { node[key] = inp.checked; refresh(false, key); };
      return inp;
    }
    if (type === 'enum') {
      const inp = document.createElement('select');
      for (const o of opts || []) {
        const [text, val] = Array.isArray(o) ? o : [String(o), o];
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = titleCase(text);
        inp.appendChild(opt);
      }
      inp.value = node[key];
      inp.onchange = () => { node[key] = Number(inp.value); refresh(false, key); };
      return inp;
    }
    if (type === 'int' || type === 'float') {
      const meta = (opts && typeof opts === 'object' && !Array.isArray(opts)) ? opts : {};
      const wrap = document.createElement('span');
      wrap.className = 'numwrap';
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.step = meta.step !== undefined ? meta.step : (type === 'int' ? '1' : 'any');
      if (meta.min !== undefined) inp.min = meta.min;
      if (meta.max !== undefined) inp.max = meta.max;
      inp.value = node[key];
      inp.oninput = () => {
        // An emptied or unparsed field reports '' here (a type=number input
        // sanitizes anything it can't parse down to the empty string, so
        // Number(inp.value) would otherwise read as 0 and overwrite the last
        // committed value while the user is mid-edit). Leave the model alone
        // and let onblur below restore the display, so an aborted edit can't
        // destroy the number.
        if (inp.value === '') return;
        // int props truncate here too, so the preview and the emitted literal
        // can't disagree about a fractional entry
        let v = Number(inp.value);
        if (!Number.isFinite(v)) return;
        if (type === 'int') v = Math.trunc(v);
        // clamp on the way into the model, not on the way out, so what the
        // preview draws and what the C++ says are the same number
        if (meta.min !== undefined) v = Math.max(meta.min, v);
        if (meta.max !== undefined) v = Math.min(meta.max, v);
        node[key] = v;
        refresh(false, key);
      };
      inp.onblur = () => { if (String(node[key]) !== inp.value) inp.value = node[key]; };
      wrap.appendChild(inp);
      if (meta.unit) {
        const u = document.createElement('span');
        u.className = 'unit';
        u.textContent = meta.unit;
        wrap.appendChild(u);
      }
      return wrap;
    }
    // `longtext` means several lines of C++: a Raw block's code, and a window's
    // preamble. There was no editor for it, so both fell through to the
    // single-line <input> below and were edited in a control that cannot hold a
    // newline and caps at 200 characters. Opening the inspector on a Raw block
    // and touching the field flattened it.
    if (type === 'longtext') {
      const ta = document.createElement('textarea');
      ta.className = 'longtext';
      ta.rows = 4;
      ta.spellcheck = false;
      ta.value = node[key] ?? '';
      ta.placeholder = (opts && opts.placeholder) || '';
      ta.oninput = () => { node[key] = ta.value; refresh(false, key); };
      return ta;
    }
    const inp = document.createElement('input');
    inp.type = 'text';
    // From the same table coerce enforces on load, so the field cannot accept
    // more than survives a reload. It was a flat 200 here against a cap of 12
    // for a unit, and the extra characters silently vanished on the next load.
    inp.maxLength = TEXT_CAP[type] || 200;
    inp.value = node[key] ?? '';
    inp.placeholder = (opts && opts.placeholder) || '';
    inp.oninput = () => { node[key] = inp.value; refresh(false, key); };
    return inp;
  };

  // Properties that describe one thing sit on one row, the way a vector reads.
  const PAIRS = [['w', 'h'], ['min', 'max']];
  const paired = new Set();
  for (const [a, b] of PAIRS) {
    if (byKey[a] && byKey[b]) { paired.add(a); paired.add(b); }
  }

  for (const def of propDefs) {
    const key = def[0];
    if (paired.has(key)) continue;
    addField(labelFor(key, node.type), mark(editorFor(def), key), changed(key),
      changed(key) ? restoreFn(key) : null, helpFor(node.type, key));
  }
  for (const [a, b] of PAIRS) {
    if (!byKey[a] || !byKey[b]) continue;
    const row = document.createElement('div');
    row.className = 'vecrow';
    for (const k of [a, b]) {
      const cell = document.createElement('span');
      cell.className = 'veccell';
      const tag = document.createElement('span');
      tag.className = 'vectag';
      tag.textContent = labelFor(k);
      cell.appendChild(tag);
      cell.appendChild(editorFor(byKey[k]));
      row.appendChild(cell);
    }
    const pairChanged = changed(a) || changed(b);
    addField(a === 'w' ? 'Size' : 'Range', row, pairChanged,
      pairChanged ? () => { node[a] = defaultOf(a); node[b] = defaultOf(b); } : null,
      a === 'w' ? PROP_HELP.w : 'The range the control is allowed to produce.');
  }

  if (node !== doc) {
    addHead('layout');
    const parent = findParent(node.id);
    const first = parent && parent.children.indexOf(node) === 0;
    const t = document.createElement('div');
    t.className = 'toggle' + (node.sameline && !first ? ' on' : '');
    t.innerHTML = '<span class="track"></span><span class="lb"></span>';
    t.querySelector('.lb').textContent = first
      ? 'nothing to join to'
      : (node.sameline ? 'joined to the line above' : 'starts a new line');
    t.title = first
      ? 'The first widget in a container has no previous line to join'
      : 'ImGui::SameLine() puts this widget on the same row as the one before it (J)';
    if (first) t.style.opacity = '0.5';
    // full refresh: normalizeDoc may drop the flag on a first child, and the
    // control has to stop showing it as set
    else t.onclick = () => { node.sameline = !node.sameline; refresh(); };
    addField('SameLine', t, !!node.sameline && !first,
      node.sameline && !first ? () => { delete node.sameline; } : null,
      'Puts this widget on the same row as the one before it, via ImGui::SameLine().');
  }

  // ---- color overrides ----
  const slots = colorSlots(node.type);
  if (!slots.length) return;
  const overridden = slots.filter(s => node.colors && node.colors[s]).length;
  addHead('colors' + (overridden ? ' (' + overridden + ' overridden)' : ''));

  for (const slot of slots) {
    const cur = node.colors && node.colors[slot];
    const row = document.createElement('div');
    row.className = 'colorrow';

    const inp = document.createElement('input');
    inp.type = 'color';
    inp.value = cur ? rgbToHex(cur) : defaultHexFor(slot);
    inp.title = 'ImGuiCol_' + slot;
    inp.oninput = () => {
      if (!node.colors) node.colors = {};
      node.colors[slot] = hexToRgb(inp.value);
      // keyed per slot, so dragging one color swatch does not coalesce with
      // a drag on the next one
      refresh(false, 'color:' + slot);
    };
    row.appendChild(inp);

    // the value in the same notation the generated C++ uses
    const hex = document.createElement('span');
    hex.className = 'hex';
    hex.textContent = cur ? rgbToHex(cur).toUpperCase() : 'default';
    row.appendChild(hex);

    if (cur) {
      const clr = document.createElement('button');
      clr.className = 'unset';
      clr.textContent = 'unset';
      clr.title = 'Stop overriding this color';
      clr.onclick = () => {
        delete node.colors[slot];
        if (!Object.keys(node.colors).length) delete node.colors;
        refresh();
      };
      row.appendChild(clr);
    }

    // an overridden value is marked, so "changed here" is visible at a glance
    addField(slot, row, !!cur, cur ? () => { delete node.colors[slot]; } : null,
      'Overrides ImGuiCol_' + slot + ' for this widget only, as a PushStyleColor/PopStyleColor pair.');
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

function rgbToHex(c) {
  const h = x => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, '0');
  return '#' + h(c[0]) + h(c[1]) + h(c[2]);
}

// rough stand-ins for the dark theme so an untouched swatch isn't misleading
const SLOT_DEFAULTS = {
  Text: '#f2f2f2', TextDisabled: '#808080', WindowBg: '#0f0f0f', ChildBg: '#000000',
  PopupBg: '#141414', Border: '#6e6e80', FrameBg: '#294a7a', FrameBgHovered: '#4296fa',
  FrameBgActive: '#4296f0', TitleBg: '#0a0a0a', TitleBgActive: '#294a7a',
  Button: '#4296f0', ButtonHovered: '#4296fa', ButtonActive: '#0f87fa',
  Header: '#4296f0', HeaderHovered: '#4296fa', HeaderActive: '#4296f0',
  CheckMark: '#4296fa', SliderGrab: '#3d85e0', SliderGrabActive: '#4296f0',
  Tab: '#26599e', TabHovered: '#4296fa', PlotLines: '#9c9c9c', PlotHistogram: '#e6b200',
  TableHeaderBg: '#303033',
};
const defaultHexFor = slot => SLOT_DEFAULTS[slot] || '#cccccc';

function renderCode() {
  // while the code pane is being edited it owns the document. Regenerating
  // under the user's cursor is the two-writer race the research warns about
  if (codeEditing) return;
  document.getElementById('code').innerHTML = highlightOwned(PROFILE.generate(), generateCode.owners);
  // the selection is the same thing in three panes, so the code pane marks it too
  for (const m of document.querySelectorAll('#code .cline')) {
    if (selection.has(m.dataset.node)) m.classList.add('sel');
  }
}

// Selecting a widget already highlights and scrolls to its lines here
// (revealInCode). This is the reverse gesture. Delegated once on the pane
// itself, wired at load rather than inside renderCode, since renderCode
// replaces every line's markup (and any listener on it) on each repaint.
document.getElementById('code').addEventListener('click', e => {
  const line = e.target.closest('.cline');
  if (line) selectId(line.dataset.node);
});

