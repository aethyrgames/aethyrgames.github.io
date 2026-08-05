// window.__test, the surface scripts/selftest.mjs drives the app through.
//
// It lives in its own file because it is not part of the app: it reaches into
// every other module, so keeping it beside the code it reaches into made those
// files look more tangled than they are.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

window.__test = {
  rects: () => latestRects,
  doc: () => doc,
  // the widgets of the first window: what "the document" used to mean
  widgets: () => (doc.children.find(n => n.type === 'window') || { children: [] }).children,
  windows: () => doc.children.filter(n => n.type === 'window'),
  // every node in the document, windows included, so a test can ask whether an
  // insert added anything at all rather than guessing where it landed
  count: () => countNodes(doc.children),
  addWindow: label => {
    const w = Object.assign(makeNode('window'), { label: label || 'Window' });
    doc.children.push(w);
    refresh();
    return w.id;
  },
  setWidgetsIn: (i, kids) => {
    const wins = doc.children.filter(n => n.type === 'window');
    if (wins[i]) { wins[i].children = kids; refresh(); }
  },
  paletteBlocked: type => blockedReason(type),
  resetPanelLayout: () => resetPanelLayout(),
  setWidgets: kids => {
    let win = doc.children.find(n => n.type === 'window');
    if (!win) { win = makeNode('window'); doc.children.push(win); }
    win.children = kids;
    refresh();
  },
  selected: () => selectedId,
  select: id => selectId(id),
  selection: () => [...selection],
  hotbar: () => hotbar.slice(),
  layout: () => JSON.parse(JSON.stringify(layout)),
  guides: () => guides.slice(),
  canvasSize: () => ({ w: canvas.width, h: canvas.height }),
  inlineEditing: () => inlineId !== null,
  ctxOpen: () => document.getElementById('ctxmenu').style.display === 'block',
  handlePos: axis => {
    const h = document.querySelector('#selbox .rh-' + axis)
      || document.querySelector('#selbox .rh[data-axis="' + axis + '"]');
    if (!h || !h.offsetParent) return null;
    const r = h.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  },
  hidePanel: k => { layout.panels[k].hidden = true; applyLayout(); },
  // A dock width without dragging its splitter, so a layout check can measure at
  // the minimum rather than depending on a synthetic drag landing exactly there.
  setDockSize: (side, px) => { layout.size[side] = px; applyLayout(); },
  showPanel: k => { layout.panels[k].hidden = false; applyLayout(); },
  // hidden panels are detached from the dock, not just display:none
  panelVisible: k => {
    const el = document.querySelector('.panel[data-panel="' + k + '"]');
    return !!(el && el.offsetParent);
  },
  ctxItems: () => [...document.querySelectorAll('#ctxmenu .mi')].map(x => x.firstChild.textContent),
  // what "Copy C++ snippet" would put on the clipboard, without needing the
  // clipboard permission the context menu path would
  snippetFor: id => cppSnippet(findNode(id)),
  docsUrl: type => docsUrlFor(type),
  key: (k, mods = {}) => window.dispatchEvent(new KeyboardEvent('keydown', {
    key: k, ctrlKey: !!mods.ctrl, shiftKey: !!mods.shift, altKey: !!mods.alt, cancelable: true,
  })),
  keyUp: k => window.dispatchEvent(new KeyboardEvent('keyup', { key: k })),
  armed: () => armedType(),
  isLive: () => !editMode,
  histLen: () => history.length,
  overlayOpen: () => !cmdkEl.hidden || !helpEl.hidden,
  menuSelRow: () => {
    const rows = [...menuPop.querySelectorAll('.mi:not(.disabled)')];
    return rows[menuSel] ? rows[menuSel].textContent : null;
  },
  canvasKbdFocus: () => canvasHost.classList.contains('kbd-focus'),
  preOverlayFocus: () => (preOverlayFocus ? (preOverlayFocus.id || preOverlayFocus.tagName) : null),
  codeStatusHidden: () => document.getElementById('codeStatus').hidden,
  // capture what the export would download, without a real file dialog
  exportProjectPayload: () => {
    let captured = null;
    const orig = downloadJson;
    downloadJson = (name, data) => { captured = data; };
    try { exportProject(); } finally { downloadJson = orig; }
    return captured;
  },
  exportEverythingPayload: () => {
    let captured = null;
    const orig = downloadJson;
    downloadJson = (name, data) => { captured = data; };
    try { exportEverything(); } finally { downloadJson = orig; }
    return captured;
  },
  importPayload: s => importPayload(s),
  widgetTypes: () => Object.keys(PROFILE.catalog).filter(k => !PROFILE.catalog[k].hidden),
  generate: () => PROFILE.generate(),
  refresh: () => refresh(),
  selectMany: ids => selectMany(ids),
  // Reset asks first now, so the test drives the dialog the way a user does
  resetDoc: () => {
    document.getElementById('resetBtn').onclick();
    if (!confirmOv.hidden) document.getElementById('confirmYes').click();
  },
  confirmOpen: () => !confirmOv.hidden,
  projects: () => projects.map(p => ({ id: p.id, name: p.name, active: p.id === activeProject })),
  addProject: (name, d) => addProject(name, d).id,
  switchProject: id => switchProject(id),
  // n counts every node including the window. insertable is what a click would
  // actually add, which is the window's children and can be zero
  templates: () => templates.map(t => ({
    name: t.name, builtin: !!t.builtin, n: countNodes(t.doc.children),
    insertable: templateWidgets(t).length,
    // what the template itself holds, so a test can assert an apply kept ALL of
    // them rather than settling for "more than one"
    windows: (t.doc.children || []).filter(c => c.type === 'window').length,
  })),
  applyTemplate: name => applyTemplate(templates.find(t => t.name === name), false),
  // The C++ a template would produce, without disturbing the open document.
  // The builtin templates are the worked examples of every feature, so this is
  // what lets the compile gate reach window PROPERTIES (closable, toggles).
  // test_all_widgets.cpp holds one of every widget TYPE and never sets either,
  // which is the hole a non-compiling show/hide feature shipped through.
  templateCode: name => {
    const t = templates.find(x => x.name.toLowerCase() === String(name).toLowerCase());
    if (!t) return null;
    const keep = { children: doc.children, pre: doc.pre, post: doc.post };
    try {
      const d = JSON.parse(JSON.stringify(t.doc || {}));
      doc.children = d.children || [];
      doc.pre = d.pre || '';
      doc.post = d.post || '';
      return PROFILE.generate();
    } finally {
      doc.children = keep.children; doc.pre = keep.pre; doc.post = keep.post;
      // generateCode leaves owners/skipped behind for the code pane, so put
      // them back in step with the document that is actually open
      PROFILE.generate();
    }
  },
  saveTemplate: () => saveCurrentAsTemplate(),
  // the path the UI uses: into the nearest container of the selection
  insertTemplate: name => insertTemplateInHost(
    templates.find(t => t.name.toLowerCase() === String(name).toLowerCase())),
  shareLink: () => buildShareLink(),
  loadShare: async url => {
    const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(url);
    return m ? (await decodeShare(m[1])) : null;
  },
  // reads the live value out of the engine, so live-mode interaction can be
  // asserted rather than eyeballed
  // ImGui works in surface pixels. Reported in world units so it can be compared
  // with a document coordinate
  imguiMouse: () => (engineReady ? {
    x: PROFILE.engine.call('engine_mouse_x', 'number', [], []) + origin.x,
    y: PROFILE.engine.call('engine_mouse_y', 'number', [], []) + origin.y,
    w: PROFILE.engine.call('engine_display_w', 'number', [], []),
    h: PROFILE.engine.call('engine_display_h', 'number', [], []),
  } : null),
  popupDepth: () => (engineReady ? PROFILE.engine.call('engine_popup_depth', 'number', [], []) : -1),
  // the top-left-most vertex the engine drew last frame: negative means part of
  // a window was drawn off the surface, which is what clipping looks like
  minDraw: () => (engineReady ? {
    x: PROFILE.engine.call('engine_min_draw_x', 'number', [], []),
    y: PROFILE.engine.call('engine_min_draw_y', 'number', [], []),
  } : null),
  widgetFloat: id => (engineReady
    ? PROFILE.engine.call('engine_get_float', 'number', ['string'], [id]) : null),
  widgetBool: id => (engineReady
    ? PROFILE.engine.call('engine_get_bool', 'number', ['string'], [id]) === 1 : null),
  // Takes a raw state key, not a node id, because the keys that matter here are
  // composed: "radio:<window id>:<group>". -1 means the key does not exist.
  widgetInt: key => (engineReady
    ? PROFILE.engine.call('engine_get_int', 'number', ['string'], [key]) : null),
  // The document-replace path New, Open, templates and projects all go through.
  loadDocData: raw => { applyDocData(JSON.parse(JSON.stringify(raw)), 100); refresh(); },
  // Share links, so the size ceilings can be driven directly rather than by
  // putting a hostile fragment in the address bar and reloading.
  decodeShare: code => decodeShare(code),
  buildShareLink: () => buildShareLink(),
  addGuideAt: (axis, pos) => { guides.push({ axis, pos }); renderGuides(); },
  clearGuides: () => { guides.length = 0; renderGuides(); saveGuides(); },
  // the whole keymap, and a rebind through the same path the settings rows use
  // `label` is the app's OWN comboLabel, not a reconstruction. The tutorial
  // check used to rebuild the chord string from the raw fields with its own
  // glyph table, which said 'Up' where KEY_GLYPHS says '↑'. So a page quoting
  // exactly what the user sees on screen was reported as teaching a key that
  // does not exist. A mirror that drifts is the defect this suite exists for.
  keymap: () => KEYMAP.map(b => ({ id: b.id, ctx: b.ctx, cat: b.cat, help: b.help,
    key: b.key, ctrl: !!b.ctrl, alt: !!b.alt, shift: !!b.shift,
    label: comboLabel(b) })),
  // Press every binding in the table through the real dispatcher, with each
  // run() swapped for a recorder so nothing actually happens. What this proves
  // is ROUTING: a binding that sits in the table and can never fire, because
  // its key was stored uppercased and is compared raw, or because another
  // category shadows the combo, shows up here and in no other check. Asserting
  // that a binding EXISTS says nothing about whether pressing it arrives.
  probeDispatch: () => {
    const saved = KEYMAP.map(b => b.run);
    const fired = [];
    KEYMAP.forEach(b => { b.run = () => { fired.push(b.id); }; });
    try {
      return KEYMAP.map(b => {
        const row = { id: b.id, ctx: b.ctx, cat: b.cat, help: b.help,
          combo: comboLabel(b), fired: false };
        if (!b.key) { row.noKey = true; return row; }
        // several bindings may share a combo inside one context and cycle on
        // repeated presses, so press once per claimant before giving up
        const claimants = KEYMAP.filter(x => x.ctx === b.ctx && sameCombo(x, b)).length;
        // Lower-cased, because that is what an unshifted letter key actually
        // delivers. rebind() stores letters uppercased, so dispatching b.key
        // verbatim compares 'J' against 'J' and sails past keyMatches' case
        // normalization without ever exercising it. The whole defect class this
        // probe exists for is a key that normalizes on the way in and not on the
        // way out, and sending the canonical form cannot see it.
        const asTyped = b.key.length === 1 ? b.key.toLowerCase() : b.key;
        for (let i = 0; i < Math.max(1, claimants) && !row.fired; i++) {
          fired.length = 0;
          window.dispatchEvent(new KeyboardEvent('keydown', {
            key: asTyped, ctrlKey: !!b.ctrl, altKey: !!b.alt, shiftKey: !!b.shift,
            bubbles: true, cancelable: true,
          }));
          row.fired = fired.includes(b.id);
          if (!row.fired && fired.length) row.stolenBy = fired[0];
        }
        return row;
      });
    } finally {
      KEYMAP.forEach((b, i) => { b.run = saved[i]; });
    }
  },
  rebindById: (id, cand) => {
    const entry = KEYMAP.find(b => b.id === id);
    if (!entry) return 'no such binding';
    const clash = rebind(entry, cand);
    return clash ? (clash.help || 'refused') : null;
  },
  resetBinds: () => { resetBinds(); },
  origin: () => ({ ...origin }),
  bounds: () => contentBounds(),
  snapStep: () => GRID_MINOR,
  // what a click at a world point would select, so z-order can be asserted
  hitAt: (x, y) => { const h = hitTest({ x, y }); return h ? h.id : null; },
  // whether ImGui itself has a window under the cursor, which is the only way to
  // tell a title-bar drag that engaged from one that silently did not
  moving: () => {
    try { return PROFILE.engine.call('engine_moving_window', 'number', [], []) === 1; }
    catch (e) { return false; }
  },
  armedDrag: () => armedWindowDrag,
  cursorWorld: () => ({ ...cursorWorld }),
  rulerMarker: horiz => rulerMarkerPos(horiz),
  // the ticks the last drawRulers actually emitted, as {w, p, major}
  rulerTicks: id => (lastRulerTicks[id] || []).slice(),
  canvasCoversHost: () => {
    const c = canvas.getBoundingClientRect();
    const h = canvasHost.getBoundingClientRect();
    return c.left <= h.left + 1 && c.top <= h.top + 1
      && c.right >= h.right - 1 && c.bottom >= h.bottom - 1;
  },
  dragState: () => (drag ? { kind: drag.kind, type: drag.type || null,
    started: !!drag.started, drop: drag.drop || null } : null),
  zoom: () => zoom,
  setZoom: z => zoomTo(z),
  zoomAt: (z, x, y) => zoomTo(z, x, y),
  zoomStep: d => zoomStep(d),
  zoomFit: () => zoomToFit(),
  pan: () => ({ ...pan }),
  // a screen point in world coordinates, the conversion every gesture uses
  pointAt: (x, y) => canvasPoint({ clientX: x, clientY: y }),
  gridOn: () => showGrid,
  rulersOn: () => showRulers,
  menu: name => renderMenu(name),
  closeMenu: () => closeMenu(),
  uiThemes: () => Object.keys(UI_THEMES),
  uiTheme: k => UI_THEMES[k],
  setUiTheme: k => applyUiTheme(k),
  currentUiTheme: () => currentUiTheme,
  settingsOpen: () => !settingsOv.hidden,
  openSettings: tab => openSettings(tab),
  treeRows: () => document.querySelectorAll('#tree .row').length,
  setTreeFilter: v => { treeFilterEl.value = v; renderTree(); },
  setFilter: v => { const f = document.getElementById('filter'); f.value = v; renderPalette(); },
  focusSel: () => focusSelection(),
  hoverText: () => hoverInfoEl.textContent,
  resizing: () => !!resizing,
  dragActive: () => !!drag,
  marqueeActive: () => !!marquee,
  panelDragging: () => !!panelDrag,
  pin: (type, slot) => pinToHotbar(type, slot),
  reorder: d => reorderSelection(d, false),
  wrap: () => wrapSelection(),
  insert: type => insertNodeAt(type, { parentId: 'root', index: doc.children.length }),
  remove: id => removeNode(id),
  helpRowCount: () => {
    const wasOpen = !helpEl.hidden;
    if (!wasOpen) toggleHelp();
    const n = helpList.querySelectorAll('.ov-item').length;
    if (!wasOpen) toggleHelp();
    return n;
  },
  bindableCount: () => KEYMAP.filter(b => b.ctx === 'global' || b.ctx === 'edit').length,
  codeEditorWarning: () => {
    setCodeEditing(true);
    const t = codeStatus.textContent;
    setCodeEditing(false);
    return t;
  },
  rebindTest: (help, cand) => {
    const b = KEYMAP.find(x => x.help === help);
    if (!b) return 'missing';
    const clash = rebind(b, cand);
    // a browser-reserved combo comes back with a reason and no category
    if (clash) return clash.reason ? 'refused:reserved' : 'conflict:' + clash.cat;
    return comboLabel(b);
  },
  // What the command palette actually renders, key badge and all. The badges
  // used to be hardcoded strings, so this is the surface that has to agree with
  // the dispatcher after a rebind.
  commandRows: () => {
    openCmdk('all');
    const out = [...cmdkList.querySelectorAll('.ov-item')].map(el => el.textContent);
    closeOverlays();
    return out;
  },
  applyCpp: text => {
    setCodeEditing(true);
    codeEdit.value = text;
    paintCodeEditor();
    applyBtn.onclick();
    return document.getElementById('codeStatus').textContent;
  },
  // `applied` matters as much as `same`.
  //
  // Apply catches a parser throw and returns WITHOUT touching the document
  // (app/codepane.js:83, which is right, since blanking the canvas on a bad
  // parse would be worse). So a caller that only compares generated code to
  // what it fed in is comparing a document against itself. `same` is true because
  // nothing happened. Proved with a mutation that made PROFILE.parser throw on every
  // call. Twelve other checks went red and this one stayed green.
  roundTrip: () => {
    const before = PROFILE.generate();
    setCodeEditing(true);
    codeEdit.value = before;
    paintCodeEditor();
    applyBtn.onclick();
    const status = codeStatus.textContent;
    return {
      same: PROFILE.generate() === before,
      // the document really was replaced, rather than kept by the error path
      applied: !codeStatus.classList.contains('err') && /^Applied\./.test(status),
      status,
      before,
      after: PROFILE.generate(),
    };
  },
  addAll: () => {
    // one of every widget type, containers nested so the tree is exercised
    const win = doc.children.find(n => n.type === 'window')
      || doc.children[doc.children.push(makeNode('window')) - 1];
    for (const [type, spec] of Object.entries(PROFILE.catalog)) {
      if (spec.hidden || spec.rootOnly) continue;
      const node = makeNode(type);
      win.children.push(node);
      if (spec.container) node.children.push(makeNode('text'));
    }
    refresh();
    return win.children.length;
  },
  // Arrangements ImGui asserts on. The engine must survive all of these,
  // because an assert aborts the wasm module and kills the preview outright.
  stress: () => {
    const nested = makeNode('menubar');
    nested.children.push(makeNode('menubar'));      // BeginMenuBar inside BeginMenuBar
    const grp = makeNode('group');
    grp.children.push(makeNode('menubar'));         // menu bar off the window root
    const ab = makeNode('arrowbutton'); ab.dir = 99;   // past ImGuiDir_COUNT
    const ab2 = makeNode('arrowbutton'); ab2.dir = -5; // below ImGuiDir_None
    const tbl = makeNode('table'); tbl.cols = 0;    // BeginTable asserts on < 1
    const tbl2 = makeNode('table'); tbl2.cols = 9999;
    const ti = makeNode('tabitem');                 // tab item with no tab bar
    const win = doc.children.find(n => n.type === 'window')
      || doc.children[doc.children.push(makeNode('window')) - 1];
    win.children.push(nested, grp, ab, ab2, tbl, tbl2, ti);
    refresh();
    return win.children.length;
  },
  canvasOrigin: () => {
    const r = canvas.getBoundingClientRect();
    return { x: r.left, y: r.top };
  },
  // World coordinates to screen, live. The surface starts at `origin` in world
  // terms and the canvas element moves with it, so a caller that adds the canvas
  // rect to a world coordinate is wrong by exactly that offset.
  screenAt: (wx, wy) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (wx - origin.x) * zoom, y: r.top + (wy - origin.y) * zoom };
  },
  screenRect: id => {
    const w = latestRects.find(r => r.id === id);
    if (!w) return null;
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (w.x - origin.x) * zoom, y: r.top + (w.y - origin.y) * zoom,
      w: w.w * zoom, h: w.h * zoom };
  },
  paletteButtonPos: text => {
    for (const b of document.querySelectorAll('#palette button')) {
      // the badge span is part of textContent, so match on the widget name
      if (b.dataset.type && PROFILE.catalog[b.dataset.type].name === text) {
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
    return null;
  },
};

