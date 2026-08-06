// The large document view: the generated-C++ pane, expanded to fill the
// workspace, and put back again.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.
//
// THE DESIGN, in one sentence: the pane MOVES, it is not mirrored.
//
// The obvious build is a second editor in the overlay fed from the first. That
// is two editors, two pieces of text and a synchronisation problem, and the
// requirement that makes it fail is the interesting one: expanding mid-edit
// must not lose typed text or the caret. A mirror can only meet that by copying
// state across on every transition, which means it can only ever copy the state
// it happens to know about. Today that is the text and the caret. Tomorrow it is
// the undo stack, the scroll position, an IME composition in flight, whatever
// the editor behind app/editor-api.js turns out to hold. Moving the DOM node
// carries all of it, including the parts this file has never heard of, because
// there is only ever one of everything.
//
// So expanding reparents the code panel's own `.panel-body` into the overlay,
// and collapsing puts it back under the panel header where buildPanels left it.
// Everything inside keeps its identity: same #codeEdit, same EDITOR instance,
// same handlers, same ids, so every element reference held elsewhere in the app
// stays valid and nothing here has to tell codepane.js it happened.
//
// What this file may NOT assume: that the editing surface is a textarea. It
// goes through EDITOR for anything about the editor's state, the same as the
// pane does.

// ---------- the pieces ----------

const codeOv = document.getElementById('codeov');
const codeOvBody = document.getElementById('codeovBody');
const codeOvTitle = document.getElementById('codeovTitle');
const codeOvClose = document.getElementById('codeovClose');
const expandCodeBtn = document.getElementById('expandCodeBtn');
// The pane's own boxes, by id rather than through codepane.js: what this file
// couples to is the markup in index.html, not that file's variables.
//
// So yes, `codeEditHost` here and `codeEditorHost` in codepane.js resolve the
// same element, and `codeComplEl` here and `complEl` there resolve another.
// Reading codepane.js's names instead would work, since both are global consts
// and nothing here runs at load, and it was left alone on purpose: this file
// has to load BEFORE codepane.js for the Escape ordering below, so borrowing
// its variables would make the large view depend on a file that has not run
// yet at the moment this one is evaluated. Two getElementById calls is the
// cheaper half of that trade.
const codeEditHost = document.getElementById('codeEditWrap');
const codeComplEl = document.getElementById('codeCompl');

let codeViewOpen = false;
// The moved `.panel-body` while it is out of its dock, so collapsing knows what
// to put back without having to find it in the overlay.
let codeViewBody = null;

// Resolved on every use, never cached. buildPanels() has not run when this file
// loads, and it is what wraps a panel's children in `.panel-body`. applyLayout()
// then moves the panel between docks, so the element that owns the body can be
// in a different dock than it was last time.
function codePanelEl() {
  return document.querySelector('.panel[data-panel="code"]');
}

// ---------- carrying the edit across the move ----------

// Reparenting an element does not re-create it: the same node comes out the
// other side with its value and, in Chrome, its selection intact. Two things do
// not survive, and both are put back below.
//
// FOCUS is the first. The browser blurs an element the moment it leaves the
// document, so everything in the pane comes out of the move unfocused and the
// keyboard lands on <body>, which is the dead state keys.js's own closeOverlays
// goes out of its way to avoid. Note what is remembered: whatever had focus when
// the transition started, not "was it the editor". Clicking the button has
// ALREADY moved focus to the button by the time the click handler runs, so an
// "is the editor focused" test answers no on the one path people actually use,
// and the button is itself a perfectly good thing to hand the keyboard back
// (it travels with the pane and now reads Collapse).
function captureFocus() {
  return document.activeElement;
}

function restoreFocus(el) {
  // offsetParent, not just isConnected: the close control stays behind in the
  // overlay, which is display:none by the time this runs, and focusing a
  // display:none element silently does nothing at all. The caller's own
  // restorePreOverlayFocus baseline covers that path.
  if (el && el.isConnected && el.offsetParent && typeof el.focus === 'function') el.focus();
}

// The CARET is the second, and unlike focus it may well survive: Chrome keeps
// the whole selection across a move. It is read and written back anyway, because
// the editor seam does not promise it and an editor that dropped it would drop it
// silently -- the text still on screen, the caret at offset 0, which is exactly
// the shape of "looks fine" regression this repo keeps getting bitten by.
// null when the pane is not in edit mode, so the read-only view costs nothing.
function captureCaret() {
  return codeEditHost.hidden ? null : EDITOR.getCursorOffset();
}

function restoreCaret(caret) {
  if (caret === null || codeEditHost.hidden) return;
  // Only when the move actually disturbed it. Re-setting a caret that is already
  // right would collapse a surviving SELECTION down to a single point, which is
  // a loss this function exists to prevent rather than cause.
  if (EDITOR.getCursorOffset() !== caret) EDITOR.setCursorOffset(caret);
}

// ---------- expand and collapse ----------
//
// Nothing is put in the dock's place while the pane is away. That was tried: a
// "this pane is in the large view" stand-in with a button back. Measured at a
// 2400px viewport, 48px of it cleared the overlay box, behind the backdrop, with
// no word of it legible and the button unclickable because the backdrop takes
// the press. A control nobody can see or reach is not a state marker, it is
// weight, so the panel is left as its own header until its body comes home.

function syncExpandButton() {
  expandCodeBtn.textContent = codeViewOpen ? 'Collapse' : 'Expand';
  expandCodeBtn.title = codeViewOpen
    ? 'Back to the docked panel (Esc)'
    : 'Show this pane in a large view filling the workspace';
  expandCodeBtn.setAttribute('aria-expanded', String(codeViewOpen));
}

function expandCodeView() {
  if (codeViewOpen) return;
  const panel = codePanelEl();
  const body = panel && panel.querySelector('.panel-body');
  // Before buildPanels() there is no body to move. Declining is right: the only
  // way to get here that early is a script, and half-moving the pane would leave
  // the app with a code panel that has no contents in either place.
  if (!body) return;
  rememberFocusBeforeOverlay();
  const focused = captureFocus();
  const caret = captureCaret();
  codeViewBody = body;
  codeOvBody.appendChild(body);
  // From the panel's own title, so a profile that renames the panel renames this
  // too rather than leaving the markup's copy behind.
  codeOvTitle.textContent = panel.dataset.title || codeOvTitle.textContent;
  codeOv.hidden = false;
  codeViewOpen = true;
  syncExpandButton();
  restoreFocus(focused);
  restoreCaret(caret);
}

function collapseCodeView() {
  if (!codeViewOpen) return;
  const panel = codePanelEl();
  const focused = captureFocus();
  const caret = captureCaret();
  // Appended, which is where buildPanels() put it: the panel holds its header
  // first and its body last.
  if (panel && codeViewBody) panel.appendChild(codeViewBody);
  codeViewBody = null;
  codeOv.hidden = true;
  codeViewOpen = false;
  syncExpandButton();
  // The baseline first: keys.js's own rule for an overlay closing, which also
  // clears the remembered target so it cannot leak into the next open. Then let
  // whatever had the keyboard inside the view override it, if that came back
  // with the pane. Reversing the two moves the keyboard out of the editor and
  // onto whatever opened the view, mid-word.
  restorePreOverlayFocus();
  restoreFocus(focused);
  restoreCaret(caret);
}

expandCodeBtn.onclick = () => (codeViewOpen ? collapseCodeView() : expandCodeView());
codeOvClose.onclick = () => collapseCodeView();
// The backdrop closes, the same as #settingsov and #confirmov. mousedown rather
// than click, and only when the backdrop itself is the target, so a text
// selection dragged out of the editor and released on the backdrop does not
// count as a click on it.
codeOv.addEventListener('mousedown', e => { if (e.target === codeOv) collapseCodeView(); });

// ---------- Escape ----------

// Capture phase on window, and index.html loads this file AHEAD of keys.js on
// purpose: capture listeners on one target run in registration order, and
// keys.js's own capture listener hands Escape to the code editor, where it
// cancels the edit session and may ask before discarding. In the large view
// Escape should mean "back to the panel", and it can claim the key without
// costing anything, because collapsing loses nothing: the editor, its text and
// its caret all come back with it, still editing. The editor's own Escape is
// then one press away in the inline pane, where it has always been.
//
// Two things still outrank it, which is the layering the rest of the app
// already uses for this key:
//   1. an open completion picker. Escape closes the picker first, then the view.
//   2. any modal opened OVER the large view. Settings, the confirm dialog, the
//      command palette and the shortcut sheet all own Escape while they are up.
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !codeViewOpen) return;
  if (codeComplEl && !codeComplEl.hidden) return;
  if (typeof isModalOpen === 'function' && isModalOpen()) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  collapseCodeView();
}, true);
