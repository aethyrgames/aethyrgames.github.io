// The keymap table, the context-stack dispatcher every keypress goes through,
// and the command palette and insert menu that read from the same table.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- keymap and dispatcher ----------

// One table drives dispatch, the ? overlay, and the command palette, the same
// single-source pattern widgets.js uses. `shift: undefined` means don't care.
const KEYMAP = [];
const BINDS_KEY = PROFILE.storagePrefix + '.binds';
let bindOverrides = {};
try { bindOverrides = JSON.parse(localStorage.getItem(BINDS_KEY) || '{}'); } catch (e) {}

function bind(ctx, show, spec, help, cat, run) {
  // id stays stable across rebinds so overrides survive a key change
  const id = cat + '|' + (help || show || '?') + '|' + spec.key;
  const entry = { id, ctx, show, help, cat, run, def: { ...spec } };
  Object.assign(entry, spec, bindOverrides[id] || {});
  KEYMAP.push(entry);
}

// DOM key names are not what anyone calls these keys.
const KEY_GLYPHS = {
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  ' ': 'Space', Escape: 'Esc', Delete: 'Del', Backspace: '⌫', Enter: '⏎',
};

function comboLabel(b) {
  return (b.ctrl ? 'Ctrl+' : '') + (b.alt ? 'Alt+' : '')
    + (b.shift ? 'Shift+' : '') + (KEY_GLYPHS[b.key] || b.key);
}

function sameCombo(a, b) {
  return a.key === b.key && !!a.ctrl === !!b.ctrl
    && !!a.alt === !!b.alt && !!a.shift === !!b.shift;
}

// The two quasimodes live in their own category, which is what protects them:
// bindingConflict refuses a combo already taken by a DIFFERENT category, so
// nothing else can claim the peek keys, and being real keymap entries means they
// can be rebound like everything else. They used to be handled ahead of the
// keymap and flatly refused as bind targets, which left them the only two
// shortcuts in the app you could not change.
const MODES_CAT = 'Modes';

// Only Edit and Live are mutually exclusive. 'global' is live in every context
// and 'drag' runs alongside whichever of Edit/Live is current, so a key bound
// in one of those really can shadow a key bound in the other.
function ctxOverlaps(a, b) {
  if (a === b) return true;
  return !((a === 'edit' && b === 'live') || (a === 'live' && b === 'edit'));
}

// Two bindings may share a key when their contexts overlap AND they sit in the
// same category. The key then cycles between them. Sharing across categories
// is refused: the same key meaning unrelated things is the confusing case.
function bindingConflict(entry, cand) {
  for (const b of KEYMAP) {
    if (b === entry || !ctxOverlaps(b.ctx, entry.ctx)) continue;
    if (sameCombo(b, cand) && b.cat !== entry.cat) return b;
  }
  return null;
}

// Combos the browser keeps for itself. The keydown never reaches the page, so a
// binding on one of these is dead on arrival and the shortcut lists advertise a
// key that does nothing. Ctrl+N shipped that way. This stops the next one being
// hand-picked from Settings.
const RESERVED = new Set(['N', 'T', 'W']);
function reservedByBrowser(cand) {
  return !!cand.ctrl && !cand.alt && RESERVED.has(cand.key);
}

function rebind(entry, cand) {
  if (reservedByBrowser(cand)) {
    // W gets its own shape: Ctrl+W closes the current TAB, not a window, and
    // "a new window close" read as garbled English when it shared the "a new
    // ___" template N and T use.
    const what = cand.key === 'N' ? 'for a new window'
      : cand.key === 'T' ? 'for a new tab' : 'for closing the tab';
    return { reason: comboLabel(cand) + ' is reserved by the browser ' + what
      + ', so the key never reaches the page. Pick another combination.' };
  }
  const clash = bindingConflict(entry, cand);
  if (clash) return clash;
  Object.assign(entry, { key: cand.key, ctrl: !!cand.ctrl, alt: !!cand.alt, shift: !!cand.shift });
  bindOverrides[entry.id] = { key: cand.key, ctrl: !!cand.ctrl, alt: !!cand.alt, shift: !!cand.shift };
  try { localStorage.setItem(BINDS_KEY, JSON.stringify(bindOverrides)); } catch (e) {}
  return null;
}

function resetBinds() {
  bindOverrides = {};
  try { localStorage.removeItem(BINDS_KEY); } catch (e) {}
  for (const b of KEYMAP) Object.assign(b, { key: undefined, ctrl: undefined, alt: undefined, shift: undefined }, b.def);
}

function keyMatches(e, b) {
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (key !== b.key) return false;
  // backing out must work whatever is held: Escape mid Alt-duplicate-drag
  // would otherwise match nothing until Alt comes back up
  if (b.key === 'Escape') return true;
  if (!!b.ctrl !== (e.ctrlKey || e.metaKey)) return false;
  if (!!b.alt !== e.altKey) return false;
  if (b.shift !== undefined && !!b.shift !== e.shiftKey) return false;
  return true;
}

function isTextEntry(t) {
  if (!t || !t.tagName) return false;
  if (t.tagName === 'TEXTAREA' || t.isContentEditable) return true;
  return t.tagName === 'INPUT'
    && t.type !== 'checkbox' && t.type !== 'radio' && t.type !== 'file' && t.type !== 'button';
}

// A field somebody is writing prose or code into, as opposed to a filter box.
// The peek quasimode steals Space from whatever has focus as soon as the pointer
// is over the canvas, which is right for the palette filter and wrong for the
// C++ editor: it blurred the editor mid-word and swallowed the space.
function isRealEditor(t) {
  return !!t && (t === codeEdit || t.classList && t.classList.contains('longtext'));
}

// A real <button>/<select>/<a>: something the browser will Tab to on its own,
// and which owns Enter and Space for its own activation rather than handing
// them to the keymap.
function isFocusable(t) {
  return !!t && t.tagName && (t.tagName === 'BUTTON' || t.tagName === 'SELECT' || t.tagName === 'A');
}

// Any overlay that owns the whole screen. While one is open, Tab moves between
// its own controls, never the mode toggle underneath it.
function isModalOpen() {
  return !cmdkEl.hidden || !helpEl.hidden || !settingsOv.hidden || !confirmOv.hidden;
}

// emscripten's GLFW handler preventDefaults Backspace and Tab page-wide, which
// would make every text field uneditable. This capture listener registers
// before engine.js loads, so it runs first and shields text-entry targets.
// Default actions (the actual typing) still happen. Only later listeners stop.
// Registered ahead of everything else: while a shortcut row is listening,
// Escape cancels that and nothing else. It used to race the overlay handlers
// and sometimes closed the whole panel instead.
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && settingsCapture) {
    cancelCapture();
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

window.addEventListener('keydown', e => {
  // The C++ editor wants Tab for indenting, so it gets first refusal here.
  // Its handler can't sit on the textarea: this listener would have already
  // stopped the event before it got that far down.
  if (e.target === codeEdit && handleCodeEditorKey(e)) {
    e.stopImmediatePropagation();
    return;
  }
  if ((e.key === 'Backspace' || e.key === 'Tab') && isTextEntry(e.target)) {
    e.stopImmediatePropagation();
  }
  // Everywhere else a real button/select/link, or an open overlay, owns Tab:
  // without this the engine's GLFW handler preventDefaults it page-wide, and
  // focus could never leave the body once it landed on a control. Skipped
  // while a rebind row is armed (`capturing`/`settingsCapture`): Tab is then a
  // candidate KEY, not navigation, and has to reach the capture listener below.
  if (e.key === 'Tab' && (isModalOpen() || isFocusable(e.target)) && !capturing && !settingsCapture) {
    e.stopImmediatePropagation();
  }
}, true);

bind('drag', 'Esc', { key: 'Escape' }, 'Cancel the drag', 'Drag', () => cancelDrag());

bind('edit', 'Up / Down', { key: 'ArrowUp', shift: false }, 'Previous sibling', 'Navigate', () => selectSibling(-1));
bind('edit', '', { key: 'ArrowDown', shift: false }, 'Next sibling', 'Navigate', () => selectSibling(1));
bind('edit', 'Home / End', { key: 'Home' }, 'First sibling', 'Navigate', () => selectEdge(false));
bind('edit', '', { key: 'End' }, 'Last sibling', 'Navigate', () => selectEdge(true));
bind('edit', 'Enter', { key: 'Enter' }, 'Descend into container (or insert the armed widget)', 'Navigate', () => {
  if (armed) { stampArmed(dropSiblingAfterSelection()); return; }
  descend();
});
bind('edit', 'Esc', { key: 'Escape' }, 'Disarm, else ascend to parent, else deselect', 'Navigate', () => {
  if (armed) { disarm(); return; }
  ascend();
});
bind('edit', 'F', { key: 'F', shift: false }, 'Focus the selection (center it on screen)', 'Navigate',
  () => focusSelection());
bind('edit', 'Shift+F', { key: 'F', shift: true }, 'Reset the view to the origin and 100%', 'Navigate',
  () => resetPan());
// The Windows convention for "open the context menu without a mouse". Screen
// coordinates from the world rect, the same conversion the canvas's own
// overlays use, so the menu lands where the widget actually is.
bind('edit', 'Shift+F10', { key: 'F10', shift: true }, 'Open the context menu for the selection', 'Navigate',
  () => {
    const node = selectedId && selectedId !== 'root' ? findNode(selectedId) : null;
    const r = node && rectFor(node.id);
    const cr = canvas.getBoundingClientRect();
    const cx = r ? cr.left + (r.x + r.w / 2 - origin.x) * zoom : cr.left + cr.width / 2;
    const cy = r ? cr.top + (r.y + r.h / 2 - origin.y) * zoom : cr.top + cr.height / 2;
    openContextMenu({ clientX: cx, clientY: cy }, node ? widgetMenu(node, false) : backgroundMenu());
  });
// Held, not tapped, so the release has to find whichever key currently carries
// it: peekBinding/modeBinding below look the entry up rather than comparing to a
// literal. `run` returning nothing means it consumed the key, as usual.
bind('global', 'Space (hold)', { key: ' ' },
  'Hold to test interaction: peek Live while held, release to snap back', MODES_CAT,
  e => { handleSpaceDown(e); });
bind('global', 'Tab', { key: 'Tab' },
  'Toggle Edit and Live. Hold past ~200ms to peek Live instead', MODES_CAT,
  e => {
    // Anywhere but body or the canvas, Tab means "move to the next control":
    // those two are the only places the quasimode still owns the key.
    const a = document.activeElement;
    if (a && a !== document.body && a !== canvas) return false;
    handleTabDown(e);
  });

bind('edit', '] / [', { key: ']' }, 'Zoom in', 'Navigate', () => zoomStep(1));
bind('edit', '', { key: '[' }, 'Zoom out', 'Navigate', () => zoomStep(-1));
bind('edit', 'Ctrl+Shift+F', { key: 'F', ctrl: true, shift: true }, 'Fit the document in the view',
  'Navigate', () => zoomToFit());
bind('edit', 'F2', { key: 'F2' }, 'Rename inline on the canvas', 'Navigate', () => {
  if (selectedId) beginInlineEdit(selectedId);
});
bind('edit', 'Ctrl+A', { key: 'A', ctrl: true }, 'Select all siblings of the selection', 'Navigate', () => {
  const node = selectedId && selectedId !== 'root' ? findNode(selectedId) : null;
  const parent = node ? findParent(node.id) : doc;
  selectMany((parent || doc).children.map(c => c.id));
});

bind('edit', 'Ctrl+Up / Ctrl+Down', { key: 'ArrowUp', ctrl: true, shift: false }, 'Move up among siblings', 'Structure', () => reorderSelection(-1, false));
bind('edit', '', { key: 'ArrowDown', ctrl: true, shift: false }, 'Move down among siblings', 'Structure', () => reorderSelection(1, false));
bind('edit', 'Ctrl+Shift+Up / Down', { key: 'ArrowUp', ctrl: true, shift: true }, 'Move to first sibling', 'Structure', () => reorderSelection(-1, true));
bind('edit', '', { key: 'ArrowDown', ctrl: true, shift: true }, 'Move to last sibling', 'Structure', () => reorderSelection(1, true));
bind('edit', 'Ctrl+G', { key: 'G', ctrl: true, shift: false }, 'Wrap selection in a Group', 'Structure', () => wrapSelection());
bind('edit', 'Ctrl+Shift+G', { key: 'G', ctrl: true, shift: true }, 'Unwrap container', 'Structure', () => unwrapSelection());
bind('edit', 'J', { key: 'J', shift: false }, 'Toggle the SameLine join', 'Structure', () => toggleJoin());
bind('edit', 'Ctrl+D', { key: 'D', ctrl: true }, 'Duplicate selection', 'Structure', () => duplicateSelection());
bind('edit', 'Del', { key: 'Delete' }, 'Delete selection', 'Structure', () => deleteSelection());
bind('edit', '', { key: 'Backspace' }, 'Delete selection', 'Structure', () => deleteSelection());
bind('edit', 'Ctrl+C', { key: 'C', ctrl: true, shift: false }, 'Copy subtree', 'Structure', () => {
  // never steal a real text copy from the code pane
  if (String(window.getSelection())) return false;
  return copySelection() ? undefined : false;
});
bind('edit', 'Ctrl+X', { key: 'X', ctrl: true }, 'Cut subtree', 'Structure', () => cutSelection());
bind('edit', 'Ctrl+V', { key: 'V', ctrl: true }, 'Paste after selection', 'Structure', () => pasteClipboard());
bind('edit', 'R', { key: 'R', shift: false }, 'Repeat the last insert', 'Structure', () => repeatInsert());
bind('edit', 'Ctrl+Z', { key: 'Z', ctrl: true, shift: false }, 'Undo', 'Structure', () => undo());
bind('edit', 'Ctrl+Shift+Z', { key: 'Z', ctrl: true, shift: true }, 'Redo', 'Structure', () => redo());
bind('edit', '', { key: 'Y', ctrl: true }, 'Redo', 'Structure', () => redo());

bind('edit', 'V', { key: 'V', shift: false }, 'Back to select (disarm)', 'Insert', () => disarm());
for (const letter of Object.keys(PROFILE.families)) {
  const names = PROFILE.families[letter].map(t => PROFILE.catalog[t].name).join(', ');
  bind('edit', letter + ' / Shift+' + letter, { key: letter, shift: false },
    'Arm ' + names + ' (press again to cycle)', 'Insert', () => arm(letter, false));
  bind('edit', '', { key: letter, shift: true },
    'Cycle ' + letter + ' family backward', 'Insert', () => arm(letter, true));
}
bind('edit', '/', { key: '/' }, 'Insert menu (filter all widgets)', 'Insert', () => openCmdk('insert'));
// Hotbar: bare key arms the pinned widget, Ctrl+key pins the current selection
// (or the armed widget) into that slot. Reordering is how you rebind.
HOTBAR_KEYS.forEach((k, i) => {
  bind('edit', i === 0 ? '0…9 - =' : '', { key: k, ctrl: false },
    'Arm the widget in hotbar slot ' + (i + 1), 'Insert', () => {
    const type = hotbar[i];
    if (!type) return false;         // empty slot declines, key falls through
    return rearm(type);              // so does a type with no arming family
  });
  bind('edit', i === 0 ? 'Ctrl+0…9' : '', { key: k, ctrl: true },
    'Pin the selected or armed widget to hotbar slot ' + (i + 1), 'Insert', () => {
    const node = selectedId && selectedId !== 'root' ? findNode(selectedId) : null;
    const type = armed ? armedType() : (node && node.type);
    if (!type) return false;
    pinToHotbar(type, i);
  });
});

// Alt+N, not Ctrl+N. Chrome, Edge and Firefox all reserve Ctrl+N for a new
// browser window and never deliver the keydown to the page, so the binding was
// unreachable while the ? overlay, Settings and the File menu all advertised it.
bind('global', 'Alt+N', { key: 'N', alt: true }, 'New project', 'Global',
  () => { addProject(); saveProjects(); });
bind('global', 'Ctrl+K', { key: 'K', ctrl: true }, 'Command palette', 'Global', () => openCmdk('all'));
bind('global', '?', { key: '?' }, 'Keyboard shortcuts', 'Global', () => toggleHelp());
// The autosave to localStorage has no keystroke of its own, and Ctrl+S is
// muscle memory for exactly this tool's audience. Left unbound, the keydown
// reached the page unclaimed and Chrome's own Save-page dialog opened over the
// editor. Claiming the combo for the File menu's actual save action, the same
// way the command palette's own "Export JSON" entry already runs it, means the
// keystroke now does something instead of merely not breaking.
bind('global', 'Ctrl+S', { key: 'S', ctrl: true }, 'Export JSON', 'Global',
  () => document.getElementById('exportBtn').onclick());

window.addEventListener('keydown', e => {
  const t = e.target;
  // Space is the hold-to-test quasimode, and it was being eaten by whatever
  // text field was last clicked: filter some widgets, hold Space over the
  // canvas, and you typed a space instead of poking the preview. If the
  // pointer is over the canvas the user plainly means the preview, so take
  // the key and step out of the field.
  if (isPeekKey(e) && cursorInside && isTextEntry(t) && !isRealEditor(t)) {
    t.blur();
    handleSpaceDown(e);
    return;
  }
  // Same key, pointer still over a panel: the field keeps it, because a space is
  // what you meant while typing. But remember it is down, so arriving over the
  // canvas with it still held enters the quasimode rather than doing nothing at
  // all until you let go and press again.
  if (isPeekKey(e) && !e.repeat) spacePhysicallyDown = true;
  if (isTextEntry(t) || (t && t.tagName === 'SELECT')) {
    if (e.key === 'Escape') {
      // Escape from a field is a full back-out, including a drag that was
      // started while the palette filter still held focus
      t.blur();
      closeOverlays();
      cancelDrag();
      disarm();
      e.preventDefault();
    }
    return;
  }
  // a focused checkbox keeps Space for its own toggle. Everything else dispatches
  if (t && t.tagName === 'INPUT' && e.key === ' ') return;
  // A focused button keeps Enter and Space for its own click activation, the
  // same shape as the checkbox exemption above. Without this, Enter on the
  // File menu button ran the edit-context Navigate binding instead of opening
  // the menu, and Space armed the hold-to-test peek instead of clicking.
  if (t && t.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return;
  // Space and Tab are ordinary keymap entries now, so they fall through to the
  // dispatcher below with everything else.
  // Every modal, not just the two overlays. Settings and the confirm dialog were
  // not consulted here and neither focuses a text entry, so with one open every
  // Edit shortcut still fired underneath: Delete removed the selected widget
  // behind the dialog, and Escape could not close either of them.
  // settingsOv and confirmOv are declared in settings.js, which loads after this
  // file but long before any key can be pressed.
  // A right-click menu owns Escape too. It had no dismissal at all, so pressing
  // Escape left it open on screen and ran the Edit-context Escape underneath,
  // which disarmed or ascended the selection the menu was about to act on.
  if (e.key === 'Escape' && ctxOpen()) {
    closeContextMenu();
    e.preventDefault();
    return;
  }
  const modalOpen = !cmdkEl.hidden || !helpEl.hidden
    || !settingsOv.hidden || !confirmOv.hidden;
  if (e.key === 'Escape' && modalOpen) {
    closeOverlays();
    if (!settingsOv.hidden) closeSettings();
    if (!confirmOv.hidden) confirmOv.hidden = true;
    e.preventDefault();
    return;
  }
  // and nothing else reaches the document while a modal owns the screen
  if (modalOpen) return;
  // The mode keys go first, ahead of the guard below: an ImGui text field asking
  // for input would otherwise swallow them, and Tab is how you get back out of
  // Live mode. They used to be handled ahead of the whole keymap for the same
  // reason, and this keeps that precedence now that they are ordinary entries.
  for (const b of KEYMAP) {
    if (b.cat !== MODES_CAT || !keyMatches(e, b)) continue;
    if (b.run(e) === false) continue;
    e.preventDefault();
    return;
  }
  // never steal keys from an active ImGui text field in live mode
  if (!editMode && engineWantsText) return;
  const contexts = [];
  if (drag) contexts.push('drag');
  contexts.push(editMode ? 'edit' : 'live');
  contexts.push('global');
  for (const ctx of contexts) {
    const matches = KEYMAP.filter(b => b.ctx === ctx && keyMatches(e, b));
    if (!matches.length) continue;
    // Several bindings may legitimately share a key within one category, so
    // repeated presses cycle through them. A lone binding behaves as before.
    if (matches.length > 1) {
      const sig = ctx + '|' + comboLabel(matches[0]);
      const now = Date.now();
      cycleState.idx = (cycleState.sig === sig && now - cycleState.at < 900) ? cycleState.idx + 1 : 0;
      cycleState.sig = sig;
      cycleState.at = now;
    } else {
      cycleState.sig = '';
    }
    const start = matches.length > 1 ? cycleState.idx : 0;
    for (let i = 0; i < matches.length; i++) {
      const b = matches[(start + i) % matches.length];
      if (b.run(e) === false) continue; // declined, keep looking / keep default
      e.preventDefault();
      return;
    }
  }
});

const cycleState = { sig: '', idx: 0, at: 0 };

// A hold gesture has to release on whatever key currently carries it, and a keyup
// may arrive with the modifiers already lifted, so only the key itself is
// compared. Rebinding the peek to Alt+Q still releases on Q.
function bindingFor(help) {
  return KEYMAP.find(b => b.cat === MODES_CAT && b.help.startsWith(help));
}
function peekEntry() { return bindingFor('Hold to test interaction'); }
function modeEntry() { return bindingFor('Toggle Edit and Live'); }

// The live combo for a command, found by the start of its help text.
//
// The command palette, the menu bar, both context menus and the palette badges
// all printed hardcoded strings ('Ctrl+Z', 'Tab', 'F2'), so a rebind left every
// one of them advertising a key that no longer did anything, and Ctrl+N was
// advertised in three places while being unreachable in all of them. This is the
// one resolver they all go through. '' when nothing matches, so a renamed
// binding shows no badge rather than a wrong one.
function keyFor(helpPrefix) {
  const b = KEYMAP.find(x => x.help && x.help.startsWith(helpPrefix));
  return b ? comboLabel(b) : '';
}

// rebind() stores a letter uppercased, which is what keyMatches compares
// against. The three raw `e.key === b.key` compares here did not, so rebinding
// either hold gesture to a letter produced a key that engaged and never
// released. Same normalization, one place.
function eventKey(e) { return e.key && e.key.length === 1 ? e.key.toUpperCase() : e.key; }

function isPeekKey(e) {
  const b = peekEntry();
  if (!b) return false;
  return eventKey(e) === b.key && !!b.ctrl === (e.ctrlKey || e.metaKey)
    && !!b.alt === e.altKey && (b.shift === undefined || !!b.shift === e.shiftKey);
}

window.addEventListener('keyup', e => {
  const k = eventKey(e);
  const mode = modeEntry();
  const peek = peekEntry();
  // Two separate ifs, not if/else. When both gestures are bound to the same base
  // key with different modifiers, the else-if released whichever entry came
  // first in KEYMAP rather than the gesture actually in flight. Both guards
  // already no-op when their gesture is not held, so running both is safe and
  // releases the right one.
  if (mode && k === mode.key) handleTabUp();
  if (peek && k === peek.key) releaseSpace();
});

// ---------- command palette and insert menu ----------

const cmdkEl = document.getElementById('cmdk');
const cmdkInput = document.getElementById('cmdkInput');
const cmdkList = document.getElementById('cmdkList');
const helpEl = document.getElementById('helpov');
const helpInput = document.getElementById('helpInput');
const helpList = document.getElementById('helpList');

let cmdkItems = [];
let cmdkSel = 0;

function commandEntries() {
  return [
    { label: 'Undo', k: keyFor('Undo'), run: undo },
    { label: 'Redo', k: keyFor('Redo'), run: redo },
    { label: 'Toggle Edit / Live mode', k: keyFor('Toggle Edit and Live'), run: () => setLiveMode(editMode) },
    { label: 'Duplicate selection', k: keyFor('Duplicate selection'), run: duplicateSelection },
    { label: 'Delete selection', k: keyFor('Delete selection'), run: deleteSelection },
    { label: 'Wrap in Group', k: keyFor('Wrap selection in a Group'), run: wrapSelection },
    { label: 'Unwrap container', k: keyFor('Unwrap container'), run: unwrapSelection },
    { label: 'Toggle SameLine', k: keyFor('Toggle the SameLine join'), run: toggleJoin },
    { label: 'Repeat Insert', k: keyFor('Repeat the last insert'), run: repeatInsert },
    { label: 'Keyboard shortcuts', k: keyFor('Keyboard shortcuts'), run: toggleHelp },
    { label: 'Reset to Sample', run: () => document.getElementById('resetBtn').onclick() },
    { label: 'Reset panel layout', run: () => resetPanelLayout() },
    { label: 'Export JSON', run: () => document.getElementById('exportBtn').onclick() },
    { label: 'Import JSON', run: () => document.getElementById('importBtn').onclick() },
    { label: 'Save as template', run: () => saveCurrentAsTemplate() },
    { label: 'Import templates', run: () => document.getElementById('tplImportBtn').onclick() },
    { label: 'Export templates', run: () => exportTemplates() },
    { label: 'Copy C++', run: () => copyText(PROFILE.generate(), 'C++') },
    { label: 'Edit C++', run: () => document.getElementById('editCodeBtn').onclick() },
    { label: 'Apply C++', run: () => document.getElementById('applyCodeBtn').onclick() },
    { label: 'Copy share link', run: () => document.getElementById('shareBtn').onclick() },
    { label: 'Settings', run: () => document.getElementById('settingsBtn').onclick() },
    { label: 'Open tutorial', run: () => openTutorial() },
    { label: 'New project', k: keyFor('New project'), run: () => { addProject(); saveProjects(); } },
    { label: 'Next project', run: () => {
      const i = projects.findIndex(p => p.id === activeProject);
      if (i >= 0 && projects.length > 1) switchProject(projects[(i + 1) % projects.length].id);
    } },
    { label: 'Close project', run: () => closeProject(activeProject) },
    { label: 'Focus properties', run: () => {
      const first = document.querySelector('#propbody input, #propbody select, #propbody textarea, #propbody button');
      (first || document.getElementById('propbody')).focus();
    } },
    // One entry per panel, its own label naming what it currently offers, so
    // searching "panel" finds a way to any of them instead of only the reset.
    ...Object.entries(layout.panels).map(([key, p]) => ({
      label: (p.hidden ? 'Show ' : 'Hide ') + (panelEls[key] ? panelEls[key].dataset.title : key) + ' panel',
      run: () => { p.hidden = !p.hidden; applyLayout(); },
    })),
  ];
}

function openCmdk(mode) {
  rememberFocusBeforeOverlay();
  const inserts = Object.entries(PROFILE.catalog)
    .filter(([, s]) => !s.hidden)
    .map(([type, s]) => ({
      label: 'Insert ' + s.name,
      k: PROFILE.familyOf[type] ? keyFor('Arm ' + PROFILE.families[PROFILE.familyOf[type]]
        .map(t => PROFILE.catalog[t].name).join(', ')) : '',
      run: () => insertNodeAt(type, dropAfterSelection()),
    }));
  cmdkItems = mode === 'insert' ? inserts : commandEntries().concat(inserts);
  cmdkEl.hidden = false;
  cmdkInput.value = '';
  cmdkInput.placeholder = mode === 'insert' ? 'insert widget...' : 'search commands and widgets...';
  cmdkSel = 0;
  renderCmdk();
  cmdkInput.focus();
}

function renderCmdk() {
  const term = cmdkInput.value.trim().toLowerCase();
  const vis = cmdkItems.filter(i => !term || i.label.toLowerCase().includes(term));
  // rank prefix matches first so short queries land where expected
  vis.sort((a, b) => {
    const ap = a.label.toLowerCase().replace('insert ', '').startsWith(term) ? 0 : 1;
    const bp = b.label.toLowerCase().replace('insert ', '').startsWith(term) ? 0 : 1;
    return ap - bp;
  });
  const shown = vis.slice(0, 40);
  cmdkSel = Math.max(0, Math.min(cmdkSel, shown.length - 1));
  cmdkList.innerHTML = '';
  shown.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'ov-item' + (i === cmdkSel ? ' sel' : '');
    const l = document.createElement('span');
    l.textContent = titleCase(item.label);
    row.appendChild(l);
    if (item.k) {
      const k = document.createElement('span');
      k.className = 'k';
      k.textContent = item.k;
      row.appendChild(k);
    }
    row.onclick = () => { closeOverlays(); item.run(); };
    cmdkList.appendChild(row);
  });
  cmdkList.__visible = shown;
}

cmdkInput.addEventListener('input', () => { cmdkSel = 0; renderCmdk(); });
cmdkInput.addEventListener('keydown', e => {
  const vis = cmdkList.__visible || [];
  if (e.key === 'ArrowDown') { cmdkSel++; renderCmdk(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { cmdkSel--; renderCmdk(); e.preventDefault(); }
  else if (e.key === 'Enter') {
    const item = vis[cmdkSel];
    closeOverlays();
    if (item) item.run();
    e.preventDefault();
  } else if (e.key === 'Escape') {
    // must live here: the stopPropagation below keeps real keypresses from
    // ever reaching the window listener's overlay handling
    closeOverlays();
    e.preventDefault();
  }
  e.stopPropagation();
});

function renderHelp() {
  const term = helpInput.value.trim().toLowerCase();
  const activeCtx = new Set(['global', editMode ? 'edit' : 'live', drag ? 'drag' : null]);
  // No hand-written rows. Space and Tab used to be listed here as literals, so
  // they read as fixed keys, could not be clicked to rebind, and went stale the
  // moment either was rebound. They are ordinary Modes entries in KEYMAP now and
  // the loop below covers them like everything else.
  const rows = [];
  // Every binding gets its own row, labeled from its live combo. Hiding the
  // second half of a pair behind a hand-written "Up / Down" left it unlistable
  // and unrebindable, and the static label went stale the moment either half
  // was rebound.
  for (const b of KEYMAP) {
    if (!activeCtx.has(b.ctx)) continue;
    rows.push(b);
  }
  helpList.innerHTML = '';

  const hint = document.createElement('div');
  hint.className = 'ov-cat';
  hint.textContent = capturing
    ? 'press a key for: ' + capturing.help + '   (Esc cancels)'
    : 'click any shortcut to rebind it';
  hint.style.color = capturing ? 'var(--mk-green)' : 'var(--mk-comment)';
  helpList.appendChild(hint);

  let lastCat = '';
  for (const r of rows) {
    const label = r.id ? comboLabel(r) : r.show;
    if (term && !(label + ' ' + r.help).toLowerCase().includes(term)) continue;
    if (r.cat !== lastCat) {
      lastCat = r.cat;
      const c = document.createElement('div');
      c.className = 'ov-cat';
      c.textContent = r.cat;
      helpList.appendChild(c);
    }
    const fixed = !r.id;   // Space/Tab are hardwired quasimodes
    const row = document.createElement('div');
    row.className = 'ov-item';
    const l = document.createElement('span');
    l.textContent = r.help;
    row.appendChild(l);
    const k = document.createElement('span');
    k.className = 'k';
    k.textContent = capturing === r ? '…press a key' : (fixed ? r.show : comboLabel(r));
    if (!fixed && bindOverrides[r.id]) k.style.color = 'var(--mk-green)';
    row.appendChild(k);
    if (!fixed) {
      row.style.cursor = 'pointer';
      row.onclick = () => { capturing = r; renderHelp(); };
    }
    helpList.appendChild(row);
  }

  const reset = document.createElement('div');
  reset.className = 'ov-item';
  reset.style.cursor = 'pointer';
  reset.style.color = 'var(--mk-comment)';
  reset.textContent = 'Reset all shortcuts to defaults';
  reset.onclick = () => { resetBinds(); renderHelp(); };
  helpList.appendChild(reset);
}

let capturing = null;   // binding awaiting a keypress

// While capturing, the next keypress becomes the binding instead of firing.
function captureKey(e) {
  if (!capturing) return false;
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return true;
  e.preventDefault();
  if (e.key === 'Escape') { capturing = null; renderHelp(); return true; }
  const cand = {
    key: e.key.length === 1 ? e.key.toUpperCase() : e.key,
    ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, shift: e.shiftKey,
  };
  const clash = rebind(capturing, cand);
  capturing = null;
  renderHelp();
  if (clash) {
    const hint = helpList.firstChild;
    hint.textContent = clash.reason || (comboLabel(cand) + ' is already "' + clash.help
      + '" under ' + clash.cat + '. Keys can only be shared inside one group.');
    hint.style.color = 'var(--mk-pink)';
  }
  return true;
}

helpInput.addEventListener('input', renderHelp);
helpInput.addEventListener('keydown', e => {
  if (captureKey(e)) { e.stopPropagation(); return; }
  if (e.key === 'Escape') { closeOverlays(); e.preventDefault(); }
  e.stopPropagation();
});

// Mirrors settings.js's own capture listener for settingsCapture. Clicking a
// row to arm it is a real mouse click, and clicking a non-focusable div moves
// focus to <body>, so `capturing`'s only
// reliable route to the next keypress is the window, not helpInput's own
// keydown handler above. Capture phase and ahead of the dispatcher, so the
// key can't also fire as a shortcut or leak into the filter box.
window.addEventListener('keydown', e => {
  if (captureKey(e)) e.stopImmediatePropagation();
}, true);

// The element focus should return to once the current overlay closes.
// Captured on open so Escape, or any other close path, puts the keyboard back
// where the user left it instead of stranding it on body.
let preOverlayFocus = null;

function rememberFocusBeforeOverlay() {
  const a = document.activeElement;
  preOverlayFocus = (a && a !== document.body) ? a : null;
}

function restorePreOverlayFocus() {
  const el = preOverlayFocus;
  preOverlayFocus = null;
  if (el && document.contains(el) && typeof el.focus === 'function') el.focus();
}

function toggleHelp() {
  if (helpEl.hidden) {
    rememberFocusBeforeOverlay();
    helpEl.hidden = false;
    helpInput.value = '';
    renderHelp();
    helpInput.focus();
  } else {
    helpEl.hidden = true;
    capturing = null;
    restorePreOverlayFocus();
  }
}

function closeOverlays() {
  const cmdkWasOpen = !cmdkEl.hidden;
  const helpWasOpen = !helpEl.hidden;
  cmdkEl.hidden = true;
  helpEl.hidden = true;
  capturing = null;
  if (typeof closeConfirm === 'function') closeConfirm();
  if (typeof closeSettings === 'function') closeSettings();
  // Focus would otherwise stay parked in the now-hidden input, and the
  // dispatcher's text-entry guard would treat every later key as typing,
  // leaving the whole keyboard dead until the user clicked something.
  if (document.activeElement === cmdkInput || document.activeElement === helpInput) {
    document.activeElement.blur();
  }
  if (cmdkWasOpen || helpWasOpen) restorePreOverlayFocus();
}

cmdkEl.addEventListener('mousedown', e => { if (e.target === cmdkEl) closeOverlays(); });
helpEl.addEventListener('mousedown', e => { if (e.target === helpEl) closeOverlays(); });

