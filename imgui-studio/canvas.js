// The canvas: the bridge to the wasm engine, pointer gestures (select, drag,
// resize, marquee, pan), inline label editing, the arming tool, and the
// Edit/Live mode switch.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- engine bridge ----------

let engineReady = false;
let editMode = true;
let latestRects = [];
let engineWantsText = false;

function pushDoc() {
  if (!engineReady) return;
  Module.ccall('engine_set_document', null, ['string'], [JSON.stringify(doc)]);
}

var Module = {
  canvas: document.getElementById('canvas'),
  print: t => console.log(t),
  printErr: t => console.warn(t),
  onRuntimeInitialized: () => {
    engineReady = true;
    updateArmedUI();
    syncCanvasSize();
    // the grid step, so a Shift-held title-bar drag snaps to the same grid the
    // canvas draws rather than to a number the engine invented
    Module.ccall('engine_set_snap', null, ['number'], [GRID_MINOR]);
    Module.ccall('engine_set_edit_mode', null, ['number'], [editMode ? 1 : 0]);
    pushDoc();
  },
};

// ---------- canvas editing ----------

const canvas = document.getElementById('canvas');
// declared up here because panning, focus and the hover readout all reach for
// it well before the rulers section that used to own it
const canvasHost = document.getElementById('canvashost');
const selbox = document.getElementById('selbox');
const dropline = document.getElementById('dropline');
const dropbox = document.getElementById('dropbox');
const ghost = document.getElementById('ghost');

// Panning is a transform on #viewport, and every coordinate below is read from
// the canvas's own client rect, so nothing else has to account for it.
const viewportEl = document.getElementById('viewport');
const coordTip = document.getElementById('coordtip');
let pan = { x: 0, y: 0 };
// The world coordinate of the render surface's top-left corner. Negative when
// content sits above or left of the origin, which is how a window at -200 gets
// drawn at all: the surface is a positive-only pixel buffer, so instead of
// refusing those coordinates the surface moves to cover them.
//
// world = surface + origin. Everything outside this file's plumbing works in
// world coordinates: rects are converted on the way in from the engine, the
// engine is told the offset to apply, and the canvas element is positioned so
// world 0,0 still lands wherever the pan says it should.
let origin = { x: 0, y: 0 };
// What the engine has actually been told. Kept apart from `origin` so a change
// made before the engine was ready is still delivered once it is.
let sentOrigin = { x: 0, y: 0 };
// Zoom is part of the same transform. Everything that positions in world
// coordinates lives inside #viewport and so scales with it for free; the pieces
// that don't (the rulers, the guides, the ground grid) apply the factor
// themselves, and canvasPoint divides by it so the rest of the app keeps
// working in world units either way.
let zoom = 1;
// assigned once the header control exists; applyView runs before that during init
let zoomLabel = null;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
const GRID_MINOR = 20;
const GRID_MAJOR = 100;

function applyView() {
  // The surface starts at `origin` in world terms, so shifting it by origin*zoom
  // keeps world 0,0 at the pan. That is what lets the rulers and the guides go on
  // treating screen = pan + world*zoom with no knowledge of any of this.
  applyViewTransform();
  // the ground scrolls and scales with the world, so the grid stays fixed to it
  // rather than sliding or drifting out of step under the panel
  const minor = GRID_MINOR * zoom;
  const major = GRID_MAJOR * zoom;
  canvasHost.style.backgroundSize =
    `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`;
  canvasHost.style.backgroundPosition =
    `${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`;
  // handles and the selection outline counter-scale, so they stay the same size
  // on screen at every zoom instead of turning into specks or slabs
  document.documentElement.style.setProperty('--zoom', String(zoom));
  document.documentElement.style.setProperty('--inv-zoom', String(1 / zoom));
  const pct = Math.round(zoom * 100) + '%';
  if (zoomLabel) zoomLabel.textContent = pct;
  drawRulers();
  renderGuides();
  syncCanvasSize();
}

// The transform on its own. syncCanvasSize needs it when the origin moves, and
// calling the whole of applyView from there would recurse.
// World -> the viewport's local pixel space, which is the surface. Overlays live
// inside #viewport, so a world coordinate has to lose the origin before it is
// used as a left/top: with a negative origin they were drawn a whole sheet-step
// away from the thing they were meant to be outlining.
const vpX = wx => wx - origin.x;
const vpY = wy => wy - origin.y;

function applyViewTransform() {
  const ox = pan.x + origin.x * zoom;
  const oy = pan.y + origin.y * zoom;
  viewportEl.style.transform = `translate(${ox}px, ${oy}px) scale(${zoom})`;
}

// kept as the old name so existing call sites read the same
const applyPan = applyView;

function panBy(dx, dy) {
  pan.x += dx;
  pan.y += dy;
  applyView();
}

// Zoom about a screen point, so whatever is under the cursor stays under it.
// Without the pan correction the view slides away from what you were looking at.
function zoomTo(next, screenX, screenY) {
  const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
  if (z === zoom) return;
  const host = canvasHost.getBoundingClientRect();
  const sx = screenX === undefined ? host.left + host.width / 2 : screenX;
  const sy = screenY === undefined ? host.top + host.height / 2 : screenY;
  // The world point under the cursor, read the same way every gesture reads it.
  // Deriving it from the host rect instead assumed the canvas origin sat exactly
  // at the host origin plus the pan, and the anchor drifted when it did not.
  const w = canvasPoint({ clientX: sx, clientY: sy });
  // The canvas element carries the origin, so screen collapses to
  // hostLeft + pan + world * zoom. Taking the base off the canvas rect instead
  // folded the origin in twice and the anchor drifted by a sheet step.
  zoom = z;
  pan.x = Math.round(sx - host.left - w.x * zoom);
  pan.y = Math.round(sy - host.top - w.y * zoom);
  applyView();
}

// One notch along the preset ladder, which gives round percentages rather than
// whatever a multiplier lands on.
function zoomStep(dir, screenX, screenY) {
  const i = ZOOM_STEPS.findIndex(v => Math.abs(v - zoom) < 0.001);
  let next;
  if (i >= 0) next = ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, i + dir))];
  else next = dir > 0 ? ZOOM_STEPS.find(v => v > zoom) : [...ZOOM_STEPS].reverse().find(v => v < zoom);
  zoomTo(next === undefined ? zoom : next, screenX, screenY);
}

// Fit the whole document in view, which is the useful counterpart to 100%.
function zoomToFit() {
  const ext = contentExtent();
  const host = canvasHost.getBoundingClientRect();
  if (!ext.w || !ext.h) return;
  const pad = 24;
  const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX,
    Math.min((host.width - pad * 2) / ext.w, (host.height - pad * 2) / ext.h)));
  zoom = z;
  // Centre the content's MIDDLE, not world 0,0. The extent is a size, and
  // using it as if it were a position dropped the -minX term, so a document
  // reaching into negative space was fitted off the top-left by exactly
  // minX*zoom, which is the one case the negative-space work exists for.
  const b = contentBounds();
  pan.x = Math.round(host.width / 2 - ((b.minX + b.maxX) / 2) * z);
  pan.y = Math.round(host.height / 2 - ((b.minY + b.maxY) / 2) * z);
  applyView();
}

// Centre the selection in the visible area. Only useful once the document is
// bigger than the canvas, which is exactly when you can't find things.
function focusSelection() {
  const r = selectedId && rectFor(selectedId);
  if (!r) return false;
  const host = canvasHost.getBoundingClientRect();
  pan.x = Math.round(host.width / 2 - (r.x + r.w / 2) * zoom);
  pan.y = Math.round(host.height / 2 - (r.y + r.h / 2) * zoom);
  applyView();
  return true;
}

function resetPan() {
  pan = { x: 0, y: 0 };
  zoom = 1;
  applyView();
}

// The footer used to repeat the engine state, which never changes after load.
// It now reads out whatever is under the cursor, which is the thing you
// actually want while you are pointing at something.
const hoverInfoEl = document.getElementById('hoverInfo');

function updateHoverStatus(e) {
  if (!e) {
    hoverInfoEl.innerHTML = '—';
    return;
  }
  const p = canvasPoint(e);
  const hit = hitTest(p);
  const node = hit && hit.id !== 'root' ? findNode(hit.id) : (hit ? doc : null);
  // rounded: canvasPoint divides by zoom, so at any zoom but 100% this printed
  // a full-precision float and pushed the widget name out of the ellipsis
  const pos = `<i>${Math.round(p.x)}, ${Math.round(p.y)}</i>`;
  if (!node) { hoverInfoEl.innerHTML = pos; return; }
  const spec = WIDGETS[node.type] || {};
  const label = node === doc ? 'Document' : (node.label || spec.name || node.type);
  hoverInfoEl.innerHTML = `<b>${esc(label)}</b> <i>${esc(spec.name || node.type)}</i> · `
    + `${Math.round(hit.w)}x${Math.round(hit.h)} at ${Math.round(hit.x)}, ${Math.round(hit.y)} · ${pos}`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function canvasPoint(e) {
  // The client rect is already the scaled box, so dividing by the zoom turns a
  // screen offset back into the world coordinate the engine's rects use. Every
  // caller downstream stays in world units and needs no changes.
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / zoom + origin.x,
    y: (e.clientY - r.top) / zoom + origin.y,
    inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom,
  };
}

function rectFor(id) {
  return latestRects.find(r => r.id === id);
}

// Smallest containing rect wins. Container rects are emitted at different
// points relative to their children, so area beats draw order here.
// Smallest containing rect wins, so a child beats its container. But that alone
// picked a widget in a window UNDERNEATH when two windows overlap, because a
// small widget below beats a large window on top. The engine publishes rects in
// draw order, which is ImGui's z-order, so the last window containing the point
// is the top one and only it and the rects drawn after it (its own contents) are
// candidates.
function hitTest(p) {
  const hits = [];
  latestRects.forEach((r, i) => {
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) hits.push({ r, i });
  });
  if (!hits.length) return null;
  let topWin = -1;
  for (const h of hits) if (h.r.window && h.i > topWin) topWin = h.i;
  const pool = topWin >= 0 ? hits.filter(h => h.i >= topWin) : hits;
  let best = null;
  for (const h of pool) if (!best || h.r.w * h.r.h < best.w * best.h) best = h.r;
  return best;
}

const selboxes = document.getElementById('selboxes');

function updateSelectionOverlay() {
  const primary = editMode && selectedId ? rectFor(selectedId) : null;
  if (!primary) {
    selbox.style.display = 'none';
  } else {
    selbox.style.display = 'block';
    selbox.style.left = (vpX(primary.x) - 2) + 'px';
    selbox.style.top = (vpY(primary.y) - 2) + 'px';
    selbox.style.width = (primary.w + 4) + 'px';
    selbox.style.height = (primary.h + 4) + 'px';
    // handles only on the axes this widget's spec actually declares, and only
    // for a single selection (a sizing drag has no meaning across a set)
    const node = findNode(selectedId);
    const props = (node && WIDGETS[node.type] && WIDGETS[node.type].props) || [];
    const hasW = props.some(p => p[0] === 'w' || p[0] === 'itemw');
    const hasH = props.some(p => p[0] === 'h');
    // stays resizable mid-drag: dropping the handle the moment it is grabbed
    // takes the grip out from under the cursor
    selbox.classList.toggle('resizable', (hasW || hasH) && selection.size <= 1);
    selbox.classList.toggle('win', !!node && node.type === 'window');
    selbox.classList.toggle('now', !hasW);
    selbox.classList.toggle('noh', !hasH);
  }
  // secondary members of the selection
  const others = [...selection].filter(id => id !== selectedId);
  if (!editMode || !others.length) { selboxes.innerHTML = ''; return; }
  selboxes.innerHTML = '';
  for (const id of others) {
    const r = rectFor(id);
    if (!r) continue;
    const d = document.createElement('div');
    d.className = 'sb';
    d.style.left = (vpX(r.x) - 2) + 'px';
    d.style.top = (vpY(r.y) - 2) + 'px';
    d.style.width = (r.w + 4) + 'px';
    d.style.height = (r.h + 4) + 'px';
    selboxes.appendChild(d);
  }
}

function pollEngine() {
  if (!engineReady) return;
  // emscripten runs main() after onRuntimeInitialized, so glfwCreateWindow
  // stomps whatever size we set during init. Re-assert it here so the canvas
  // converges on its container no matter how the ordering falls out.
  if (canvasHost.clientWidth > 0) syncCanvasSize();
  try {
    // the ccall itself throws after a wasm abort, so it must sit inside the
    // try or one abort would kill the rAF chain and spam the interval backstop
    const raw = Module.ccall('engine_get_rects', 'string', [], []);
    const payload = JSON.parse(raw);
    // Converted here, once, so every consumer downstream stays in world units.
    // The offset comes from the payload rather than from `origin`: the two drift
    // by a frame whenever the sheet has just moved, and converting with the newer
    // value made every rect jump by the difference.
    const ox = Number(payload.ox) || 0, oy = Number(payload.oy) || 0;
    latestRects = (payload.rects || []).map(r => (ox || oy)
      ? { ...r, x: r.x + ox, y: r.y + oy } : r);
    engineWantsText = !!payload.wantText;
  } catch (e) {
    if (!pollEngine.reported) { pollEngine.reported = true; console.warn('[tick] ' + (e && e.stack || e)); }
    latestRects = [];
  }
  adoptDraggedWindowPos();
  adoptResizedWindowSize();
  updateSelectionOverlay();
}

// Dragging a window's title bar in the preview is ImGui moving its own window,
// and the document has to follow it EVERY frame, not just at the end. The sheet's
// origin is derived from the document, and a window is re-placed from the document
// whenever that origin moves, so a stale document meant the re-place yanked the
// window back to where it used to be. That fought the drag and sent the origin
// running away as the two argued.
//
// Only the release is worth an undo entry, so the per-frame writes are silent.
let wasMovingWindow = false;
function adoptDraggedWindowPos() {
  let moving = false;
  try {
    moving = Module.ccall('engine_moving_window', 'number', [], []) === 1;
  } catch (e) { return; }
  if (!moving && !wasMovingWindow) return;
  let changed = false;
  for (const win of doc.children) {
    if (win.type !== 'window') continue;
    const r = latestRects.find(x => x.id === win.id && x.window);
    if (!r || (r.w === 0 && r.h === 0)) continue;      // a hidden closable window
    const x = Math.round(r.x), y = Math.round(r.y);
    if (x === Math.round(win.x) && y === Math.round(win.y)) continue;
    win.x = x;
    win.y = y;
    changed = true;
  }
  if (moving) {
    wasMovingWindow = true;
    // The engine needs the new position too. Moving the origin makes it re-place
    // every window from its own copy of the document, so leaving that copy stale
    // yanked the window back to where the drag started and undid it. Pushing here
    // cannot fight the drag: the position it sends is the one ImGui already has,
    // so nothing is re-asserted.
    if (changed) { pushDoc(); syncCanvasSize(); renderProps(); }
    return;
  }
  wasMovingWindow = false;
  if (changed) { pushHistory(); refresh(); }
  else refresh();
}

// The same problem as adoptDraggedWindowPos, for the other gesture. Dragging a
// window's own grip or border resizes it in the preview, and nothing told the
// document: the inspector kept reading the old size, the generated
// SetNextWindowSize kept emitting it, and the size vanished on the next reload
// or the moment any size field was touched.
//
// Only windows the document has already given an explicit size are adopted. A
// window sized 0 is auto-sized, so its published size is ImGui's choice rather
// than the user's, and writing that back would silently convert it into a fixed
// one on the first frame it was ever drawn.
let wasResizingWindow = false;
function adoptResizedWindowSize() {
  let resizingWin = false;
  try {
    resizingWin = Module.ccall('engine_resizing_window', 'number', [], []) === 1;
  } catch (e) { return; }
  if (!resizingWin && !wasResizingWindow) return;
  let changed = false;
  for (const win of doc.children) {
    if (win.type !== 'window') continue;
    if (!(Number(win.w) > 0) || !(Number(win.h) > 0)) continue;   // auto-sized
    const r = latestRects.find(x => x.id === win.id && x.window);
    if (!r || (r.w === 0 && r.h === 0)) continue;                 // hidden
    const w = Math.round(r.w), h = Math.round(r.h);
    if (w === Math.round(win.w) && h === Math.round(win.h)) continue;
    win.w = w;
    win.h = h;
    changed = true;
  }
  if (resizingWin) {
    wasResizingWindow = true;
    // Pushed every frame so the engine's copy keeps up, exactly as the move
    // path does. It cannot fight the drag: the size sent is the one ImGui just
    // produced, so the re-apply is a no-op.
    if (changed) { pushDoc(); syncCanvasSize(); renderProps(); }
    return;
  }
  wasResizingWindow = false;
  if (changed) { pushHistory(); refresh(); }
}

function tick() {
  pollEngine();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
// rAF stops entirely while the window is occluded (locked screen, minimized),
// so a timer backstop keeps selection and drop targeting alive regardless
setInterval(pollEngine, 100);

// drag = { kind: 'palette'|'move', type?, nodeId?, started, startX, startY, drop }
let drag = null;

// excludeId keeps a move-drag from targeting itself or its own subtree, and
// forceJoin (held Shift) turns any leaf hit into a SameLine drop.
function computeDropTarget(p, excludeId, forceJoin) {
  if (!p.inside) return null;
  const hit = hitTest(p);
  if (!hit) return null;
  const node = findNode(hit.id);
  if (!node) return null;
  // Hovering the dragged node or its own subtree has no valid answer, so the
  // drop is a no-op rather than a surprise move to the bottom of the panel.
  if (excludeId && (node.id === excludeId || isAncestor(excludeId, node.id))) {
    return null;
  }
  if (node.id === doc.id) {
    return { parentId: doc.id, index: (doc.children || []).length, anchorId: doc.id, pos: 'inside' };
  }
  const parent = findParent(node.id) || doc;
  const idx = parent.children.indexOf(node);
  if (isContainer(node) && !forceJoin) {
    // upper third inserts before the container, the rest drops inside it
    if (p.y < hit.y + hit.h / 3) {
      return { parentId: parent.id, index: idx, anchorId: node.id, pos: 'above' };
    }
    return { parentId: node.id, index: (node.children || []).length, anchorId: node.id, pos: 'inside' };
  }
  if (forceJoin || p.x >= hit.x + hit.w * 0.55) {
    return { parentId: parent.id, index: idx + 1, sameline: true, anchorId: node.id, pos: 'right' };
  }
  const above = p.y < hit.y + hit.h / 2;
  return { parentId: parent.id, index: above ? idx : idx + 1, anchorId: node.id, pos: above ? 'above' : 'below' };
}

function updateDropIndicator(drop) {
  dropline.style.display = 'none';
  dropbox.style.display = 'none';
  if (!drop) return;
  const r = rectFor(drop.anchorId);
  if (!r) return;
  if (drop.pos === 'inside') {
    dropbox.style.display = 'block';
    dropbox.style.left = (vpX(r.x) + 1) + 'px';
    dropbox.style.top = (vpY(r.y) + 1) + 'px';
    dropbox.style.width = Math.max(0, r.w - 2) + 'px';
    dropbox.style.height = Math.max(0, r.h - 2) + 'px';
    return;
  }
  dropline.style.display = 'block';
  if (drop.pos === 'right') {
    dropline.style.left = (vpX(r.x) + r.w + 2) + 'px';
    dropline.style.top = vpY(r.y) + 'px';
    dropline.style.width = '2px';
    dropline.style.height = r.h + 'px';
    return;
  }
  dropline.style.left = vpX(r.x) + 'px';
  dropline.style.top = (drop.pos === 'above' ? vpY(r.y) - 2 : vpY(r.y) + r.h) + 'px';
  dropline.style.width = r.w + 'px';
  dropline.style.height = '2px';
}

const marqueeEl = document.getElementById('marquee');
let marquee = null;
let resizing = null;
const MIN_DRAG_SIZE = 8;   // 0 means "auto" to ImGui, so a drag must not reach it

// A flow layout has almost no empty canvas to rubber-band from (widgets tile
// edge to edge), so Ctrl+drag starts a marquee from anywhere.
function startMarquee(e, p, additive) {
  marquee = {
    x0: p.x, y0: p.y, x1: p.x, y1: p.y,
    base: additive ? new Set(selection) : new Set(),
  };
  marqueeEl.style.display = 'block';
  updateMarquee();
}

function updateMarquee() {
  const m = marquee;
  const x = Math.min(m.x0, m.x1), y = Math.min(m.y0, m.y1);
  const w = Math.abs(m.x1 - m.x0), h = Math.abs(m.y1 - m.y0);
  marqueeEl.style.left = vpX(x) + 'px';
  marqueeEl.style.top = vpY(y) + 'px';
  marqueeEl.style.width = w + 'px';
  marqueeEl.style.height = h + 'px';

  const box = { x, y, w, h };
  const encloses = r => r.x >= box.x && r.y >= box.y
    && r.x + r.w <= box.x + box.w && r.y + r.h <= box.y + box.h;
  const overlaps = r => r.x < box.x + box.w && r.x + r.w > box.x
    && r.y < box.y + box.h && r.y + r.h > box.y;

  const hits = new Set(m.base);
  walk(doc, n => {
    if (n === doc || n.type === 'window') return;
    const r = rectFor(n.id);
    if (!r) return;
    // Containers only when fully enclosed; a marquee that merely clips one
    // descends into it and takes the children instead.
    if (isContainer(n)) { if (encloses(r)) hits.add(n.id); }
    else if (overlaps(r)) hits.add(n.id);
  });
  selection.clear();
  for (const id of hits) selection.add(id);
  normalizeSelection();
  selectedId = selection.size ? [...selection][selection.size - 1] : null;
  paintDuringGesture();
}

// A mousemove can fire many times per frame, and both marquee select and resize
// used to rebuild the hierarchy, the properties and the whole C++ on each one.
// Coalescing to a frame keeps the feedback without the churn.
let gestureFrame = 0;
function paintDuringGesture(withCode) {
  if (gestureFrame) return;
  gestureFrame = requestAnimationFrame(() => {
    gestureFrame = 0;
    renderTree();
    renderProps();
    if (withCode) renderCode();
  });
}

// Resize is anchored to the size captured at drag start: reading the live rect
// mid-drag reflows the row and the rect moves under the cursor a frame later.
for (const h of selbox.querySelectorAll('.rh')) {
  h.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    const node = selectedId && findNode(selectedId);
    if (!node) return;
    const r = rectFor(node.id);
    resizing = {
      id: node.id, axis: h.dataset.axis,
      startX: e.clientX, startY: e.clientY,
      wkey: (WIDGETS[node.type].props || []).some(p => p[0] === 'w') ? 'w' : 'itemw',
      w0: Number(node.w || node.itemw) || (r ? Math.round(r.w) : 0),
      x0: Number(node.x) || 0,
      y0: Number(node.y) || 0,
      h0: Number(node.h) || (r ? Math.round(r.h) : 0),
    };
  });
}

// emscripten's GLFW binds every mouse listener to the canvas element itself,
// mousemove and mouseup included. So dragging an ImGui widget and leaving the
// canvas stopped delivering moves, and releasing outside never arrived at all.
// Capturing the pointer retargets both to the canvas, which is what makes a
// drag survive leaving the box the way it does in any native app.
canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not fatal */ }
});
canvas.addEventListener('pointerup', e => {
  try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* already gone */ }
});

// The other half of the same problem. GLFW's mouseup listener is on the canvas,
// so a release that lands anywhere else — another element, outside the window,
// or an alt-tab mid-drag — never reaches ImGui. It then believes the button is
// still held, and every later click is ignored, because ImGui only activates a
// widget when the press began on it. The preview goes quietly dead.
// Mirroring the release onto the canvas costs nothing when it is already up.
function releaseCanvasButton(e) {
  canvas.dispatchEvent(new MouseEvent('mouseup', {
    button: e && e.button !== undefined ? e.button : 0,
    clientX: e ? e.clientX : 0,
    clientY: e ? e.clientY : 0,
  }));
}

document.addEventListener('mouseup', e => {
  if (e.target !== canvas) releaseCanvasButton(e);
}, true);
window.addEventListener('blur', () => releaseCanvasButton(null));

// Middle-drag pans, and so does Ctrl+Alt+left, for a trackpad or any mouse
// without a comfortable wheel button.
//
// Two modifiers because every single one is already spoken for on this canvas:
// plain drag selects and moves, Shift extends a selection, Ctrl rubber-bands
// (a flow layout has almost no empty space to start a marquee from), and Alt
// duplicates what you drag. Ctrl alone was tried for panning and it cost the
// marquee its gesture, which is a worse trade than an extra key.
//
// Capture phase, because the canvas is a child of this element and its own
// mousedown listener would otherwise run first and begin a marquee. Stopping the
// event here also keeps the press away from the engine, so a pan in Live mode
// cannot press an ImGui widget on the way past.
const isPanGesture = e => e.button === 1
  || (e.button === 0 && (e.ctrlKey || e.metaKey) && e.altKey);

canvasHost.addEventListener('mousedown', e => {
  if (!isPanGesture(e)) return;
  e.preventDefault();
  e.stopPropagation();
  canvasHost.classList.add('panning');
  const from = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  const move = ev => {
    pan.x = from.px + (ev.clientX - from.x);
    pan.y = from.py + (ev.clientY - from.y);
    applyPan();
  };
  const up = () => {
    canvasHost.classList.remove('panning');
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}, true);
canvasHost.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });

// Held modifiers are the only hint that the canvas will pan rather than select or
// rubber-band, so the cursor says so before the press. Cleared on blur, since a
// window switch while they are held never delivers the keyup.
const setPanReady = on => canvasHost.classList.toggle('panready', !!on);
const panModsHeld = e => (e.ctrlKey || e.metaKey) && e.altKey;
window.addEventListener('keydown', e => setPanReady(panModsHeld(e)));
window.addEventListener('keyup', e => setPanReady(panModsHeld(e)));
window.addEventListener('blur', () => { setPanReady(false); spacePhysicallyDown = false; });

// A window drag is the one gesture that can outrun the sheet. ImGui places the
// window from the pointer, so it is DRAWN at the new position before the front
// end has seen the rect and grown the surface to cover it. Waiting for the
// engine to report a moving window is a frame too late: several pointer moves
// can land inside one engine frame, and a fast drag crossed the origin and was
// drawn clipped inside that window. The press is the last moment the headroom is
// still ahead of the motion, so arm it there.
//
// Only a press on a title bar, because that is the only thing that moves a
// window (ConfigWindowsMoveFromTitleBarOnly is on), and arming on every click
// would resize the surface twice for an ordinary selection.
let armedWindowDrag = false;
const TITLE_GRAB = 30;
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  const p = canvasPoint(e);
  armedWindowDrag = latestRects.some(r => r.window && (r.w > 0 || r.h > 0)
    && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + TITLE_GRAB);
  // Deliberately NOT syncing here. Resizing the canvas inside the mousedown
  // costs the press: glfwSetWindowSize lands between our handler and the
  // engine's, and ImGui never sees the click that starts the drag. The next
  // poll is one frame away and picks the reserve up, which is still well ahead
  // of the old trigger.
}, true);
document.addEventListener('mouseup', () => {
  if (!armedWindowDrag) return;
  armedWindowDrag = false;
  syncCanvasSize();
});

canvas.addEventListener('mousedown', e => {
  if (!editMode || e.button !== 0) return;
  canvas.focus({ preventScroll: true });
  const p = canvasPoint(e);
  if (armed) {
    const drop = computeDropTarget(p, null, e.shiftKey);
    if (drop) stampArmed(drop);
    return;
  }
  if (e.ctrlKey || e.metaKey) { startMarquee(e, p, e.shiftKey); return; }

  const hit = hitTest(p);
  if (hit && hit.id !== doc.id) {
    if (e.shiftKey) { toggleSelected(hit.id); return; }
    if (!selection.has(hit.id)) selectId(hit.id);
    else { selectedId = hit.id; refresh(); }
    drag = {
      kind: 'move', nodeId: hit.id, dup: e.altKey, started: false,
      startX: e.clientX, startY: e.clientY, drop: null,
    };
  } else if (hit) {
    selectId(hit.id);
  } else {
    // empty space: a plain drag here is also a marquee
    clearSelection();
    refresh();
    startMarquee(e, p, false);
  }
});

canvas.addEventListener('dblclick', e => {
  if (!editMode) return;
  const hit = hitTest(canvasPoint(e));
  if (!hit || hit.id === doc.id) return;
  const node = findNode(hit.id);
  if (!node) return;
  if ((WIDGETS[node.type].props || []).some(p => p[0] === 'label')) {
    selectId(node.id);
    beginInlineEdit(node.id);
  } else if (isContainer(node)) {
    selectId(node.id);
    descend();
  }
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (!editMode) return;
  const hit = hitTest(canvasPoint(e));
  const node = hit && hit.id !== doc.id ? findNode(hit.id) : null;
  if (node) {
    // right-clicking outside the selection selects first, or the menu would
    // act on something other than what the user pointed at
    if (!selection.has(node.id)) selectId(node.id);
    openContextMenu(e, widgetMenu(node, false));
  } else {
    openContextMenu(e, backgroundMenu());
  }
});

function cancelDrag() {
  drag = null;
  ghost.style.display = 'none';
  dropline.style.display = 'none';
  dropbox.style.display = 'none';
  if (marquee) { marquee = null; marqueeEl.style.display = 'none'; }
  resizing = null;
}

// ---------- inline label editing ----------
// Double-click, Enter or F2 to enter; Enter or click-away commits; Esc reverts.
// Labels are single-line, so Enter can commit without ambiguity.
const inlineEl = document.getElementById('inlineEdit');
let inlineId = null;
let inlineOriginal = '';

function beginInlineEdit(id) {
  const node = findNode(id);
  const r = rectFor(id);
  if (!node || !r || !(WIDGETS[node.type].props || []).some(p => p[0] === 'label')) return;
  inlineId = id;
  inlineOriginal = node.label || '';
  inlineEl.value = inlineOriginal;
  inlineEl.style.display = 'block';
  inlineEl.style.left = vpX(r.x) + 'px';
  inlineEl.style.top = vpY(r.y) + 'px';
  inlineEl.style.width = Math.max(80, r.w) + 'px';
  inlineEl.style.height = Math.max(18, r.h) + 'px';
  inlineEl.focus();
  inlineEl.select();
}

function endInlineEdit(commit, fromBlur) {
  if (inlineId === null) return;
  const node = findNode(inlineId);
  if (node) node.label = commit ? inlineEl.value : inlineOriginal;
  inlineId = null;
  inlineEl.style.display = 'none';
  if (fromBlur) {
    // Blur fires on mousedown. Rebuilding the panels here would replace the
    // element the click started on, so the click would never complete, and
    // stealing focus back to the canvas would undo whatever it landed on.
    requestAnimationFrame(() => refresh());
    return;
  }
  inlineEl.blur();
  canvas.focus({ preventScroll: true });
  refresh();
}

inlineEl.addEventListener('input', () => {
  const node = findNode(inlineId);
  if (node) { node.label = inlineEl.value; refresh(false); }
});
inlineEl.addEventListener('keydown', e => {
  if (e.key === 'Enter') { endInlineEdit(true); e.preventDefault(); }
  else if (e.key === 'Escape') { endInlineEdit(false); e.preventDefault(); }
  e.stopPropagation();
});
inlineEl.addEventListener('blur', () => endInlineEdit(true, true));

document.addEventListener('mousemove', e => {
  if (resizing) {
    const node = findNode(resizing.id);
    if (!node) { resizing = null; return; }
    // Stop short of 0: that is ImGui's auto-size sentinel, so dragging onto it
    // makes the widget jump back to its natural size instead of getting small.
    // Zero stays reachable from the inspector, where it is labelled.
    // Divided by zoom, because these are world-space fields. A client-pixel
    // delta added straight to node.w/h/x/y made the grip run at 1/zoom: zoomed
    // out the edge crawled behind the cursor, zoomed in it raced ahead.
    const dx = (e.clientX - resizing.startX) / zoom;
    const dy = (e.clientY - resizing.startY) / zoom;
    if (resizing.axis.includes('w')) {
      // whichever key this widget spells its width with
      node[resizing.wkey] = Math.max(MIN_DRAG_SIZE, Math.round(resizing.w0 + dx));
    }
    if (resizing.axis.includes('h')) {
      node.h = Math.max(MIN_DRAG_SIZE, Math.round(resizing.h0 + dy));
    }
    // a left or top edge grows the other way, so the node moves as it sizes
    // A left or top edge grows the other way, so the node moves as it sizes.
    // The origin is a hard floor: there is no surface at negative coordinates,
    // so the edge stops rather than dragging the window off the sheet.
    // Shift snaps to the grid, the same as dragging the window by its title bar.
    // The far edge stays put, so the size takes up whatever the snap moved.
    const snap = v => Math.round(v / GRID_MINOR) * GRID_MINOR;
    if (resizing.axis.includes('W')) {
      let w = Math.max(MIN_DRAG_SIZE, Math.round(resizing.w0 - dx));
      let x = Math.round(resizing.x0 + (resizing.w0 - w));
      if (e.shiftKey) { const sx = snap(x); w += x - sx; x = sx; }
      node.x = x;
      node[resizing.wkey] = Math.max(MIN_DRAG_SIZE, w);
    }
    if (resizing.axis.includes('H')) {
      let h = Math.max(MIN_DRAG_SIZE, Math.round(resizing.h0 - dy));
      let y = Math.round(resizing.y0 + (resizing.h0 - h));
      if (e.shiftKey) { const sy = snap(y); h += y - sy; y = sy; }
      node.y = y;
      node.h = Math.max(MIN_DRAG_SIZE, h);
    }
    // The engine has to see every step so the preview tracks the cursor; the
    // panels and the generated C++ can wait for the next frame, and the undo
    // entry and the save wait for mouseup.
    pushDoc();
    paintDuringGesture(true);
    return;
  }
  if (marquee) {
    const p = canvasPoint(e);
    marquee.x1 = p.x;
    marquee.y1 = p.y;
    updateMarquee();
    return;
  }
  if (drag) {
    // A mouseup lost to focus stealing would leave a started drag armed forever.
    // Synthetic click sequences (test drivers, extensions) can emit buttons=0
    // moves between down and up, so only started drags cancel here; blur and
    // Escape cover the un-started case.
    if (drag.started && e.buttons === 0) { cancelDrag(); return; }
    if (!drag.started) {
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) < 5) return;
      drag.started = true;
      const label = drag.kind === 'palette' ? titleCase(WIDGETS[drag.type].name)
        : drag.kind === 'template' ? titleCase(drag.tpl.name)
          : (findNode(drag.nodeId)?.label || drag.nodeId);
      ghost.textContent = (drag.dup ? '+ ' : '') + label;
      ghost.style.display = 'block';
    }
    ghost.style.left = (e.clientX + 14) + 'px';
    ghost.style.top = (e.clientY + 14) + 'px';
    // duplicating may drop next to the original, so no self-exclusion then
    drag.drop = computeDropTarget(
      canvasPoint(e),
      drag.kind === 'move' && !drag.dup ? drag.nodeId : null,
      e.shiftKey);
    updateDropIndicator(drag.drop);
    return;
  }
  if (armed && editMode) {
    const p = canvasPoint(e);
    if (p.inside) {
      ghost.textContent = WIDGETS[armedType()].name;
      ghost.style.display = 'block';
      ghost.style.left = (e.clientX + 14) + 'px';
      ghost.style.top = (e.clientY + 14) + 'px';
      updateDropIndicator(computeDropTarget(p, null, e.shiftKey));
    } else {
      ghost.style.display = 'none';
      dropline.style.display = 'none';
      dropbox.style.display = 'none';
    }
  }
});

document.addEventListener('mouseup', e => {
  if (resizing) { resizing = null; refresh(); return; }
  if (marquee) {
    marquee = null;
    marqueeEl.style.display = 'none';
    refresh();
    return;
  }
  if (!drag) return;
  if (e.button !== 0) { cancelDrag(); return; }
  const d = drag;
  cancelDrag();
  if (!d.started) {
    if (d.kind === 'template') insertTemplate(d.tpl);
    else if (d.kind === 'palette') addNode(d.type);
    return;
  }
  if (d.kind === 'palette' && WIDGETS[d.type] && WIDGETS[d.type].rootOnly && !d.drop) {
    addNode(d.type);
    return;
  }
  // A window can only live at the root, so a drop computed inside another window
  // was rejected and the drag did nothing at all. Place it at the root instead,
  // at the point it was dropped, which is what dropping it somewhere means.
  if (d.kind === 'palette' && WIDGETS[d.type] && WIDGETS[d.type].rootOnly) {
    const at = canvasPoint(e);
    const node = makeNode(d.type);
    node.x = Math.round(at.x);
    node.y = Math.round(at.y);
    doc.children.push(node);
    selectId(node.id);
    refresh();
    return;
  }
  if (!d.drop) return;
  if (d.kind === 'template') insertTemplateAt(d.tpl, d.drop);
  else if (d.kind === 'palette') insertNodeAt(d.type, d.drop);
  else if (d.dup) duplicateTo(d.nodeId, d.drop);
  else moveSelectionTo(d.nodeId, d.drop);
});

window.addEventListener('blur', () => {
  if (drag) cancelDrag();
  // A gesture interrupted by alt-tab never sees its mouseup, so it would come
  // back still following the cursor with no button held.
  if (resizing) { resizing = null; refresh(); }
  if (marquee) { marquee = null; marqueeEl.style.display = 'none'; refresh(); }
  if (panelDrag) cancelPanelDrag();
  resetTabSpring();
});

// ---------- arming (widget stamp tool) ----------

const FAMILY_OF = {};
for (const [letter, types] of Object.entries(FAMILIES)) {
  for (const t of types) FAMILY_OF[t] = letter;
}

let armed = null; // { letter, index }

// Armed either by family letter (which cycles) or by a bare type, which is how
// a hotbar slot arms a widget that belongs to no family.
function armedType() {
  if (!armed) return null;
  return armed.type || FAMILIES[armed.letter][armed.index];
}

function arm(letter, backward) {
  const fam = FAMILIES[letter];
  if (armed && armed.letter === letter) {
    armed.index = (armed.index + (backward ? fam.length - 1 : 1)) % fam.length;
  } else {
    armed = { letter, index: 0 };
  }
  updateArmedUI();
}

// Arm a specific widget type rather than a family letter.
function rearm(type) {
  if (!WIDGETS[type]) return false;
  const fam = FAMILY_OF[type];
  armed = fam ? { letter: fam, index: FAMILIES[fam].indexOf(type) } : { type };
  updateArmedUI();
  return true;
}

function disarm() {
  if (!armed) return;
  armed = null;
  ghost.style.display = 'none';
  dropline.style.display = 'none';
  dropbox.style.display = 'none';
  updateArmedUI();
}

function updateArmedUI() {
  document.getElementById('armInfo').textContent = armed
    ? 'armed: ' + WIDGETS[armedType()].name
      + (armed.letter ? ' (' + armed.letter + ' cycles, Enter inserts, Esc exits)'
        : ' (Enter inserts, Esc exits)')
    : '';
  for (const b of document.querySelectorAll('#palette button')) {
    b.classList.toggle('armedbtn', !!armed && b.dataset.type === armedType());
  }
  // cycling the family while hovering must retag the ghost in place
  if (armed && !drag && ghost.style.display === 'block') {
    ghost.textContent = WIDGETS[armedType()].name;
  }
}

function stampArmed(drop) {
  insertNodeAt(armedType(), drop); // stays armed for repeated stamps
}

// ---------- mode switching (with spring-loaded Tab) ----------

function setLiveMode(live) {
  editMode = !live;
  const hint = document.getElementById('modeHint');
  hint.classList.toggle('livehint', live);
  hint.innerHTML = live
    ? '<b>LIVE</b> — widgets respond'
    : 'hold <b>' + comboLabel(peekEntry() || { key: ' ' }) + '</b> to test interaction';
  if (live) disarm();
  if (engineReady) Module.ccall('engine_set_edit_mode', null, ['number'], [editMode ? 1 : 0]);
  updateSelectionOverlay();
}

let tabTimer = null;
let tabHeld = false;
let tabPeek = false;
const TAB_HOLD_MS = 220;

function handleTabDown(e) {
  e.preventDefault();
  if (e.repeat || tabHeld) return;
  tabHeld = true;
  tabTimer = setTimeout(() => {
    tabTimer = null;
    // held past the threshold: peek Live, revert on release
    tabPeek = true;
    setLiveMode(true);
  }, TAB_HOLD_MS);
}

function handleTabUp() {
  if (!tabHeld) return;
  tabHeld = false;
  if (tabTimer) {
    // released before the threshold: a tap, toggle the mode
    clearTimeout(tabTimer);
    tabTimer = null;
    setLiveMode(editMode);
  } else if (tabPeek) {
    tabPeek = false;
    setLiveMode(false);
  }
}

function resetTabSpring() {
  if (tabTimer) { clearTimeout(tabTimer); tabTimer = null; }
  tabHeld = false;
  if (tabPeek) { tabPeek = false; setLiveMode(false); }
  releaseSpace();
}

// Hold Space to poke the real widgets. A pure quasimode: no threshold and no
// tap meaning, so it can't get stuck in the wrong mode (releasing always
// exits). It restores whatever mode you were in, so holding Space while
// already in sustained Live mode doesn't kick you back to Edit.
let spaceHeld = false;
let spaceWasLive = false;
let spaceWasArmed = null;
// Down as far as the keyboard is concerned, even when a focused field claimed it.
let spacePhysicallyDown = false;

function handleSpaceDown(e) {
  if (e && e.preventDefault) e.preventDefault();
  spacePhysicallyDown = true;
  if ((e && e.repeat) || spaceHeld) return;
  spaceHeld = true;
  spaceWasLive = !editMode;
  // Live mode disarms, but a peek is meant to be free: poking a widget and
  // letting go should hand back the tool you were holding.
  spaceWasArmed = armedType();
  // guides are editing chrome, and you're holding Space to see the real thing
  guidesEl.style.display = 'none';
  if (editMode) setLiveMode(true);
}

function releaseSpace() {
  spacePhysicallyDown = false;
  if (!spaceHeld) return;
  spaceHeld = false;
  guidesEl.style.display = '';
  setLiveMode(spaceWasLive);
  if (!spaceWasLive && spaceWasArmed) rearm(spaceWasArmed);
  spaceWasArmed = null;
}

