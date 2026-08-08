// One bridge for every drag that lives outside the canvas.
//
// THE BUG IT FIXES, once, in one place. A gesture here reads a start position
// at `mousedown` and then follows the pointer through document-level
// `mousemove`/`mouseup`. Under a pen or a finger the compatibility `mousedown`
// does not arrive until `touchend`, together with the `mouseup`, at the pixel
// the gesture ENDED on. So the drag either runs with a delta of exactly zero or
// never runs at all. Reported from a Surface Pro against the canvas resize
// grips, and true of eight more drags across four files.
//
// Replayed rather than migrated. Twenty-two `mousedown` handlers carry select,
// move, marquee, resize, dock sizing, panel moves and both list reorders, and
// every one of them stays byte-identical this way. This file is the one place
// to reason about it.
//
// ---- the part that is easy to get wrong ----
//
// Cancelling the touch is what suppresses the late compatibility pair, and WHEN
// you cancel decides what else you take away with it:
//
//   'press'  cancel from touchstart. The element's touches are never the
//            browser's business. Correct only where there is no tap form to
//            lose, which among these is the resize grips alone.
//
//   'move'   cancel at the first touchmove past the threshold, and replay
//            nothing before it. A tap never moves, so it keeps its
//            compatibility events and therefore its `click` and `dblclick`.
//            That is load-bearing: double-tap resets a dock and removes a
//            guide, tapping a panel header collapses it, and tapping a palette
//            chip, a hierarchy row or a template row is how each of those is
//            used most of the time. Cancelling at touchstart would have taken
//            all of it away and left a tablet with no way to reset a dock at
//            all.
//
// The threshold earns its place twice over. It keeps a jittery tap a tap, and
// on the rulers it stops a stray press creating a guide, because that handler
// pushes one into the array at `mousedown` and only removes it if the release
// lands back on the ruler.
//
// Moves and releases are watched on `window` rather than through
// `setPointerCapture`, except under 'press'. A hierarchy row, a template row
// and a palette chip are all rebuilt mid-drag by the same repaint that draws
// the drop indicator, and capture on an element that gets replaced stops
// delivering half way through the gesture it was meant to hold together.

const PD_ACTIVE = new Map();     // pointerId -> record
const PD_ENGAGED = new Set();    // elements with a live replayed drag

function pdMouseEvent(type, src, x, y, buttons) {
  return new MouseEvent(type, {
    bubbles: true, cancelable: true, view: window,
    clientX: x, clientY: y,
    button: 0, buttons,
    // Read from the CURRENT event, never captured at the press. Shift is held
    // part way through a resize to snap it, and a drag that remembered the
    // modifiers it started with could never see that.
    ctrlKey: src.ctrlKey, shiftKey: src.shiftKey,
    altKey: src.altKey, metaKey: src.metaKey,
  });
}

// The press is replayed at the position the gesture STARTED from, not wherever
// it had reached by the time the threshold was crossed. Every one of these
// handlers anchors to the coordinates it is handed, so starting six pixels late
// would put the same offset into a dock width, a guide position and a widget's
// size.
function pdEngage(rec, src) {
  rec.engaged = true;
  PD_ENGAGED.add(rec.el);
  if (rec.capture) {
    try { rec.el.setPointerCapture(rec.pointerId); } catch (err) { /* not fatal */ }
  }
  // The original target, so a handler that tests what was pressed still sees
  // it. The panel header reads e.target.tagName to leave its close button
  // alone.
  //
  // If a repaint replaced that node between the press and the first move, it is
  // DETACHED, and an event dispatched at a detached node reaches its own
  // listeners and then stops: it never reaches document, so every
  // document-level drag handler in this app would miss the press entirely.
  // Falling back to `rec.el` is no better, because the element the bridge was
  // installed on is usually the very node that was replaced. Whatever is at the
  // press point NOW is the honest answer, and it is what the browser would have
  // hit. Measured, not reasoned: a check that reset the document between two
  // drags left the row detached and the replayed mousedown vanished, which read
  // from the outside exactly like a drag that never started.
  const live = rec.target && rec.target.isConnected ? rec.target : null;
  const on = live || document.elementFromPoint(rec.x0, rec.y0) || rec.el;
  on.dispatchEvent(pdMouseEvent('mousedown', src, rec.x0, rec.y0, 1));
}

function bridgePointerDrag(el, opts) {
  const o = opts || {};
  const press = o.engage === 'press';
  const threshold = o.threshold === undefined ? 6 : o.threshold;

  el.addEventListener('pointerdown', e => {
    // A mouse already works, and replaying it would run every gesture twice.
    if (e.pointerType === 'mouse' || e.button !== 0) return;
    const rec = {
      el, target: e.target, pointerId: e.pointerId,
      x0: e.clientX, y0: e.clientY,
      engaged: false, threshold, capture: press,
    };
    PD_ACTIVE.set(e.pointerId, rec);
    if (press) pdEngage(rec, e);
  });

  if (press) {
    for (const t of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
      el.addEventListener(t, e => { e.preventDefault(); }, { passive: false });
    }
  } else {
    // Only once the drag is real. Cancelling touchmove is what suppresses the
    // compatibility events for the whole sequence, and cancelling touchend as
    // well costs nothing and covers a browser that decides differently.
    for (const t of ['touchmove', 'touchend']) {
      el.addEventListener(t, e => {
        if (PD_ENGAGED.has(el)) e.preventDefault();
      }, { passive: false });
    }
  }
}

window.addEventListener('pointermove', e => {
  const rec = PD_ACTIVE.get(e.pointerId);
  if (!rec) return;
  if (!rec.engaged) {
    if (Math.abs(e.clientX - rec.x0) + Math.abs(e.clientY - rec.y0) < rec.threshold) return;
    pdEngage(rec, e);
  }
  document.dispatchEvent(pdMouseEvent('mousemove', e, e.clientX, e.clientY, 1));
}, true);

// pointercancel as well as pointerup. A palm landing mid-drag cancels the pen
// with no pointerup and no compatibility mouseup at all, so without this the
// gesture would still be following a pointer that no longer exists.
for (const pdEnd of ['pointerup', 'pointercancel']) {
  window.addEventListener(pdEnd, e => {
    const rec = PD_ACTIVE.get(e.pointerId);
    if (!rec) return;
    PD_ACTIVE.delete(e.pointerId);
    PD_ENGAGED.delete(rec.el);
    // A press that never crossed the threshold is a tap, and a tap is already
    // served by the compatibility pair this deliberately did not suppress.
    // Replaying one here would make every tap land twice.
    if (!rec.engaged) return;
    document.dispatchEvent(pdMouseEvent('mouseup', e, e.clientX, e.clientY, 0));
  }, true);
}

// Alt-tab mid-drag leaves a record that will never see its release, and the
// next press would then read as a continuation of it.
window.addEventListener('blur', () => {
  PD_ACTIVE.clear();
  PD_ENGAGED.clear();
});
