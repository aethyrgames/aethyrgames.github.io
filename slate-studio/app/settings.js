// The Settings dialog: themes, keybindings, view switches and the data actions.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- settings ----------
// The ? overlay lists shortcuts in context and is the fast path. This is the
// deliberate one: every binding at once, plus the view and data switches, in a
// place you'd think to look for them.
const settingsOv = document.getElementById('settingsov');
const settingsBody = document.getElementById('settingsBody');
let settingsTab = 'theme';
let settingsCapture = null;
let captureWas = null;   // the combo in force before listening started

function openSettings(tab) {
  rememberFocusBeforeOverlay();
  settingsTab = tab || settingsTab;
  settingsOv.hidden = false;
  renderSettings();
}

function closeSettings() {
  const wasOpen = !settingsOv.hidden;
  // Clearing comes first and is unconditional: any path that hid the panel
  // without going through here used to leave a row armed, and reopening showed
  // it still waiting for a key.
  if (settingsCapture && captureWas) Object.assign(settingsCapture, captureWas);
  settingsCapture = null;
  captureWas = null;
  settingsOv.hidden = true;
  if (wasOpen) restorePreOverlayFocus();
}

function setRow(label, controlEl) {
  const row = document.createElement('div');
  row.className = 'set-row';
  const l = document.createElement('span');
  l.textContent = label;
  row.appendChild(l);
  const sp = document.createElement('span');
  sp.className = 'spacer';
  row.appendChild(sp);
  row.appendChild(controlEl);
  return row;
}

function settingsButton(text, onClick) {
  const b = document.createElement('button');
  b.className = 'k';
  b.textContent = text;
  b.onclick = onClick;
  return b;
}

function renderSettings() {
  for (const b of settingsOv.querySelectorAll('.settings-tabs button')) {
    b.classList.toggle('on', b.dataset.tab === settingsTab);
  }
  settingsBody.innerHTML = '';
  if (settingsTab === 'theme') return renderThemeSettings();
  if (settingsTab === 'keys') return renderKeySettings();
  if (settingsTab === 'view') return renderViewSettings();
  return renderDataSettings();
}

// A swatch strip per theme, because a name tells you nothing and these are
// chosen by eye. Clicking a row applies it immediately.
function themeSwatch(t) {
  const s = document.createElement('span');
  s.className = 'swatches';
  for (const slot of ['bg', 'surface', 'green', 'cyan', 'purple', 'pink', 'orange']) {
    const d = document.createElement('i');
    d.style.background = t[slot];
    s.appendChild(d);
  }
  return s;
}

function renderThemeSettings() {
  const hint = document.createElement('div');
  hint.className = 'ov-cat';
  hint.textContent = 'the editor';
  settingsBody.appendChild(hint);

  for (const [key, t] of Object.entries(UI_THEMES)) {
    const row = document.createElement('div');
    const active = key === currentUiTheme;
    row.className = 'set-row themerow' + (active ? ' on' : '');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-pressed', String(active));
    const l = document.createElement('span');
    l.textContent = t.name;
    row.appendChild(l);
    const sp = document.createElement('span');
    sp.className = 'spacer';
    row.appendChild(sp);
    row.appendChild(themeSwatch(t));
    row.onclick = () => { applyUiTheme(key); renderSettings(); };
    settingsBody.appendChild(row);
  }

  const hint2 = document.createElement('div');
  hint2.className = 'ov-cat';
  hint2.textContent = 'the generated C++';
  settingsBody.appendChild(hint2);
  const sel = document.createElement('select');
  sel.className = 'k';
  for (const [key, t] of Object.entries(THEMES)) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = t.name;
    sel.appendChild(o);
  }
  sel.value = currentTheme;
  sel.onchange = () => { themeSel.value = sel.value; themeSel.onchange(); };
  settingsBody.appendChild(setRow(titleCase('Syntax theme'), sel));
  const note = document.createElement('div');
  note.className = 'ov-cat';
  note.style.textTransform = 'none';
  note.style.letterSpacing = '0';
  note.textContent = 'The preview keeps ImGui’s own dark style on purpose: '
    + 'it shows what your panel will look like, not what this editor looks like.';
  settingsBody.appendChild(note);
}

// A revert control, shown only where the value has actually been changed.
function revertButton(title, run) {
  const b = document.createElement('button');
  b.className = 'revert';
  b.textContent = '⟲';
  b.title = title;
  b.onclick = e => { e.stopPropagation(); run(); renderSettings(); };
  return b;
}

function renderKeySettings() {
  const hint = document.createElement('div');
  hint.className = 'ov-cat' + (settingsCapture ? ' listening' : '');
  hint.textContent = settingsCapture
    ? 'listening for a key: ' + settingsCapture.help + '  ·  Esc cancels'
    : 'click a shortcut to rebind it';
  settingsBody.appendChild(hint);

  let lastCat = '';
  for (const b of KEYMAP) {
    if (b.cat !== lastCat) {
      lastCat = b.cat;
      const c = document.createElement('div');
      c.className = 'ov-cat';
      c.textContent = b.cat;
      settingsBody.appendChild(c);
    }
    const capturing = settingsCapture === b;
    const k = settingsButton(capturing ? 'press a key' : comboLabel(b), () => {
      startCapture(b);
    });
    if (bindOverrides[b.id]) k.classList.add('custom');
    if (capturing) k.classList.add('capturing');
    const row = setRow(b.help, k);
    row.classList.add('rebindable');
    row.onclick = e => { if (!e.target.closest('.revert')) startCapture(b); };
    // The backdrop handler below runs on mousedown and re-renders the panel,
    // which detaches this row before its click ever lands. It needs to know
    // which binding a row is for so it can re-arm instead of just canceling.
    row.__bind = b;
    if (capturing) row.classList.add('listening');
    // only where it differs from the shipped default
    if (bindOverrides[b.id]) {
      row.insertBefore(revertButton('Restore ' + comboLabel({ ...b, ...b.def }), () => {
        delete bindOverrides[b.id];
        Object.assign(b, { key: undefined, ctrl: undefined, alt: undefined, shift: undefined }, b.def);
        lsSet(BINDS_KEY, JSON.stringify(bindOverrides));
      }), k);
    }
    settingsBody.appendChild(row);
  }
  settingsBody.appendChild(setRow('Restore every default',
    settingsButton('reset all', () => { resetBinds(); renderSettings(); })));
}

// Remember what the key was before listening started, so canceling puts it
// back rather than leaving whatever the row happened to show.
function startCapture(entry) {
  settingsCapture = entry;
  captureWas = { key: entry.key, ctrl: entry.ctrl, alt: entry.alt, shift: entry.shift };
  renderSettings();
}

function cancelCapture() {
  if (!settingsCapture) return;
  if (captureWas) Object.assign(settingsCapture, captureWas);
  settingsCapture = null;
  captureWas = null;
  renderSettings();
}

function renderViewSettings() {
  // each row carries a revert only when it is off its default
  const row = (label, control, changed, restore) => {
    const r = setRow(label, control);
    if (changed) r.insertBefore(revertButton('Restore the default', restore), control);
    settingsBody.appendChild(r);
  };
  row(titleCase('Background grid'),
    settingsButton(showGrid ? 'On' : 'Off', () => { setGrid(!showGrid); renderSettings(); }),
    !showGrid, () => setGrid(true));
  row(titleCase('Rulers and guides'),
    settingsButton(showRulers ? 'On' : 'Off', () => { setRulers(!showRulers); renderSettings(); }),
    !showRulers, () => setRulers(true));
  settingsBody.appendChild(setRow(titleCase('Panel layout'),
    settingsButton('Reset', () => { resetPanelLayout(); renderSettings(); })));
  settingsBody.appendChild(setRow(titleCase('View position'),
    settingsButton('Recenter', () => { resetPan(); })));
  const sel = document.createElement('select');
  sel.className = 'k';
  for (const [key, t] of Object.entries(THEMES)) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = t.name;
    sel.appendChild(o);
  }
  sel.value = currentTheme;
  sel.onchange = () => { themeSel.value = sel.value; themeSel.onchange(); };
  settingsBody.appendChild(setRow(titleCase('Code syntax theme'), sel));
  settingsBody.appendChild(setRow(titleCase('Editor theme'),
    settingsButton('see Themes', () => { settingsTab = 'theme'; renderSettings(); })));
}

function renderDataSettings() {
  settingsBody.appendChild(setRow(titleCase('This project as JSON'),
    settingsButton('export', () => exportProject())));
  settingsBody.appendChild(setRow(titleCase('Every project and template'),
    settingsButton('export all', () => exportEverything())));
  settingsBody.appendChild(setRow(titleCase('Import a project file'),
    settingsButton('import', () => document.getElementById('importFile').click())));
  settingsBody.appendChild(setRow(titleCase('Shareable link for this document'),
    settingsButton('copy link', () => copyShareLink())));
}

document.getElementById('settingsClose').onclick = closeSettings;
for (const b of settingsOv.querySelectorAll('.settings-tabs button')) {
  b.onclick = () => { settingsTab = b.dataset.tab; renderSettings(); };
}
settingsOv.addEventListener('mousedown', e => {
  if (e.target === settingsOv) {
    // an armed row is the thing you most likely meant to back out of
    if (settingsCapture) cancelCapture();
    else closeSettings();
    return;
  }
  // Clicking a DIFFERENT shortcut row re-arms it. cancelCapture re-renders the
  // panel from scratch, so the mousedown target was gone before the click could
  // fire and clicking a second row while one was listening armed nothing at all:
  // the panel just went quiet and you had to click twice more.
  const other = e.target.closest('.set-row.rebindable');
  if (settingsCapture && other && other.__bind && !e.target.closest('.revert')) {
    startCapture(other.__bind);
    return;
  }
  // clicking off a row while listening abandons the capture rather than
  // leaving it armed for the next keystroke
  if (settingsCapture && !e.target.closest('.set-row.listening')) cancelCapture();
});

// While a shortcut row is armed the next key becomes the binding. This listener
// is capture-phase and ahead of the dispatcher so the key can't also fire.
window.addEventListener('keydown', e => {
  if (!settingsCapture) return;
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') { cancelCapture(); return; }
  const cand = {
    key: e.key.length === 1 ? e.key.toUpperCase() : e.key,
    ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, shift: e.shiftKey,
  };
  const clash = rebind(settingsCapture, cand);
  settingsCapture = null;
  captureWas = null;
  renderSettings();
  if (clash) {
    const hint = settingsBody.firstChild;
    hint.textContent = clash.reason || (comboLabel(cand) + ' is already "' + clash.help
      + '" under ' + clash.cat + '. Keys can only be shared inside one group.');
    hint.style.color = 'var(--mk-pink)';
  }
}, true);

// An in-app confirm rather than window.confirm: the native one blocks the whole
// page, which also means it can't be driven by the self-test.
const confirmOv = document.getElementById('confirmov');
const confirmMsg = document.getElementById('confirmMsg');
let confirmAction = null;

function askConfirm(message, onYes) {
  rememberFocusBeforeOverlay();
  confirmMsg.textContent = message;
  confirmAction = onYes;
  confirmOv.hidden = false;
  document.getElementById('confirmYes').focus();
}

function closeConfirm() {
  const wasOpen = !confirmOv.hidden;
  confirmOv.hidden = true;
  confirmAction = null;
  if (wasOpen) restorePreOverlayFocus();
}
document.getElementById('confirmNo').onclick = closeConfirm;
document.getElementById('confirmYes').onclick = () => {
  const run = confirmAction;
  closeConfirm();
  if (run) run();
};
confirmOv.addEventListener('mousedown', e => { if (e.target === confirmOv) closeConfirm(); });

function resetDocument() {
  applyDocData(JSON.parse(JSON.stringify(DEFAULT_DOC)), 100);
  // refresh() pushes a history entry, so the reset itself is one Ctrl+Z away
  refresh();
}

document.getElementById('resetBtn').onclick = () => {
  const n = countNodes(doc.children);
  if (!n) { resetDocument(); return; }
  askConfirm(`Replace this document with the sample layout? ${n} widget`
    + `${n > 1 ? 's' : ''} will be discarded. Ctrl+Z undoes it.`, resetDocument);
};

document.getElementById('shareTopBtn').onclick = () => copyShareLink();
document.getElementById('resetViewBtn').onclick = () => resetPan();
zoomLabel = document.getElementById('zoomPctBtn');
document.getElementById('zoomInBtn').onclick = () => zoomStep(1);
document.getElementById('zoomOutBtn').onclick = () => zoomStep(-1);
zoomLabel.onclick = () => zoomTo(1);
zoomLabel.textContent = Math.round(zoom * 100) + '%';

// Ctrl+wheel zooms at the cursor, which is what every canvas tool does. A bare
// wheel pans instead of scrolling the page, since there is nothing to scroll and
// a trapped wheel over the canvas is worse than a useful one.
// deltaMode 0 is pixels, 1 is lines, 2 is pages. Firefox reports lines for a
// notched wheel, so treating the raw delta as pixels panned three pixels per
// notch instead of about fifty.
const WHEEL_LINE = 16;
function wheelDelta(e) {
  const k = e.deltaMode === 1 ? WHEEL_LINE
    : e.deltaMode === 2 ? canvasHost.clientHeight : 1;
  return { x: e.deltaX * k, y: e.deltaY * k };
}

canvasHost.addEventListener('wheel', e => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    zoomStep(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY);
    return;
  }
  const d = wheelDelta(e);
  if (e.shiftKey) { e.preventDefault(); panBy(-d.y, 0); return; }
  if (Math.abs(d.y) > 0 || Math.abs(d.x) > 0) {
    e.preventDefault();
    panBy(-d.x, -d.y);
  }
}, { passive: false });
document.getElementById('exportBtn').onclick = () => exportProject();
document.getElementById('shareBtn').onclick = () => copyShareLink();
document.getElementById('settingsBtn').onclick = () => openSettings('keys');

const importFile = document.getElementById('importFile');
document.getElementById('importBtn').onclick = () => importFile.click();
importFile.onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    flashStatus(importPayload(JSON.parse(await file.text())));
  } catch (err) {
    flashStatus('Import failed: ' + err.message);
  }
  e.target.value = '';
};

// Templates get their own pair of buttons. Mixing them with Export JSON meant
// you could not tell from the file whether you were about to open a document
// or add starting points.
document.getElementById('tplSaveBtn').onclick = () => saveCurrentAsTemplate();
document.getElementById('tplExportBtn').onclick = () => exportTemplates();
const importTplFile = document.getElementById('importTplFile');
document.getElementById('tplImportBtn').onclick = () => importTplFile.click();
importTplFile.onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    flashStatus(importPayload(JSON.parse(await file.text())));
  } catch (err) {
    flashStatus('Import failed: ' + err.message);
  }
  e.target.value = '';
};

// hooks for the automated self-test (app/main.js --selftest)
