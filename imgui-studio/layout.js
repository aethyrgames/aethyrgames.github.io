// The workspace furniture: dockable panels and their splitters, the rulers and
// guides, canvas sizing and the world origin, and the hotbar.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- panels, docks, rulers ----------
// A fixed tiled layout with splitters, not a free-form docking system. For four
// panels the research is unanimous that drag-to-tab/floating is over-built, so
// panels move between the two docks and that is the whole story.

const LAYOUT_KEY = PROFILE.storagePrefix + '.layout.v1';
const PANEL_DEFAULTS = {
  palette:    { dock: 'left',  order: 0, collapsed: false, hidden: false, grow: 1 },
  hierarchy:  { dock: 'left',  order: 1, collapsed: false, hidden: false, grow: 1 },
  properties: { dock: 'left',  order: 2, collapsed: false, hidden: false, grow: 1 },
  templates:  { dock: 'left',  order: 3, collapsed: true,  hidden: false, grow: 1 },
  code:       { dock: 'right', order: 0, collapsed: false, hidden: false, grow: 1 },
};
const DOCK_SIDES = ['left', 'right', 'top', 'bottom'];
const SIZE_DEFAULTS = { left: 280, right: 470, top: 200, bottom: 200 };
let layout = {
  panels: JSON.parse(JSON.stringify(PANEL_DEFAULTS)),
  size: { ...SIZE_DEFAULTS },
};

function saveLayout() {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (e) {}
}

// Sizes are stored in absolute px, so a layout saved on a big monitor would
// otherwise squeeze the canvas to nothing on a smaller one.
const DOCK_MIN = 150;
function clampDockSizes() {
  const pairs = [
    ['left', 'right', Math.max(DOCK_MIN * 2, window.innerWidth - 320)],
    ['top', 'bottom', Math.max(DOCK_MIN * 2, window.innerHeight - 320)],
  ];
  for (const [a, bSide, budget] of pairs) {
    // cap each side first: scaling alone can't help when one dock is bigger
    // than the whole budget, because the other still holds its minimum
    for (const side of [a, bSide]) {
      const v = Math.round(Number(layout.size[side]) || SIZE_DEFAULTS[side]);
      layout.size[side] = Math.max(DOCK_MIN, Math.min(v, budget - DOCK_MIN));
    }
    const total = layout.size[a] + layout.size[bSide];
    if (total > budget) {
      const scale = budget / total;
      layout.size[a] = Math.max(DOCK_MIN, Math.round(layout.size[a] * scale));
      layout.size[bSide] = Math.max(DOCK_MIN, Math.round(layout.size[bSide] * scale));
    }
  }
}

function resetPanelLayout() {
  layout = {
    panels: JSON.parse(JSON.stringify(PANEL_DEFAULTS)),
    size: { ...SIZE_DEFAULTS },
  };
  saveLayout();
  applyLayout();
}

function loadLayout() {
  try {
    const s = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
    if (!s || !s.panels) return;
    for (const k of Object.keys(PANEL_DEFAULTS)) {
      if (s.panels[k]) layout.panels[k] = { ...PANEL_DEFAULTS[k], ...s.panels[k] };
      if (!DOCK_SIDES.includes(layout.panels[k].dock)) layout.panels[k].dock = 'left';
    }
    // `width` is the old two-dock shape, kept readable so saved layouts survive
    if (s.size) layout.size = { ...layout.size, ...s.size };
    else if (s.width) layout.size = { ...layout.size, ...s.width };
  } catch (e) {}
}

const panelEls = {};

function buildPanels() {
  for (const el of document.querySelectorAll('.panel')) {
    const key = el.dataset.panel;
    const body = document.createElement('div');
    body.className = 'panel-body';
    while (el.firstChild) body.appendChild(el.firstChild);

    const head = document.createElement('div');
    head.className = 'panel-head';
    head.innerHTML = '<span class="tw">▾</span><h3 class="ttl"></h3>';
    head.querySelector('.ttl').textContent = el.dataset.title;
    const close = document.createElement('button');
    close.textContent = '✕';
    close.title = 'Hide this panel';
    close.onclick = e => { e.stopPropagation(); layout.panels[key].hidden = true; applyLayout(); };
    head.appendChild(close);
    head.onclick = () => {
      layout.panels[key].collapsed = !layout.panels[key].collapsed;
      applyLayout();
    };
    head.addEventListener('mousedown', e => startPanelDrag(e, key));

    el.appendChild(head);
    el.appendChild(body);
    panelEls[key] = el;
  }
  applyLayout();
}

function dockEl(side) {
  return document.getElementById('dock' + side[0].toUpperCase() + side.slice(1));
}

function applyLayout() {
  const docks = {};
  for (const s of DOCK_SIDES) { docks[s] = dockEl(s); docks[s].innerHTML = ''; }
  // Hidden panels stay in the DOM as display:none rather than being detached.
  // Detaching them took their render targets out of getElementById, so the next
  // renderPalette/renderProps threw and every edit after that died with it.
  const entries = Object.entries(layout.panels)
    .sort((a, b) => a[1].order - b[1].order);
  for (const [key, p] of entries) {
    const el = panelEls[key];
    el.classList.toggle('collapsed', p.collapsed);
    el.classList.toggle('gone', !!p.hidden);
    el.querySelector('.tw').textContent = p.collapsed ? '▸' : '▾';
    el.style.flexGrow = p.collapsed ? '' : String(p.grow || 1);
    const dock = docks[p.dock] || docks.left;
    // a splitter between neighbors, so a dock's panels can be resized rather
    // than being stuck at their equal share
    // A collapsed panel is a title bar with nothing to resize, and
    // startPanelResize looks its neighbor up in a list that EXCLUDES collapsed
    // panels. Putting a splitter next to one made the two lists disagree, so a
    // seam next to a collapsed panel resized a different pair than the one it
    // sat between. Only expanded panels get a seam now, which is also what the
    // seam means.
    if (!p.hidden && !p.collapsed
        && dock.querySelector('.panel:not(.gone):not(.collapsed)')) {
      const sp = document.createElement('div');
      sp.className = 'panelsplit' + (p.dock === 'top' || p.dock === 'bottom' ? ' vert' : '');
      sp.addEventListener('mousedown', ev => startPanelResize(ev, dock, el));
      dock.appendChild(sp);
    }
    dock.appendChild(el);
  }
  clampDockSizes();
  docks.left.style.width = layout.size.left + 'px';
  docks.right.style.width = layout.size.right + 'px';
  // A vertical dock collapses cleanly because each panel's own height shrinks
  // to its header; a top/bottom dock's panels sit side by side instead, so
  // the DOCK's height (not any one panel's) is what has to give. Left at
  // layout.size unconditionally, a collapsed-only dock kept its full band
  // with nothing in it below the header, and the canvas never got the space
  // back. auto-sizes it to the header strip instead, once nothing in it is
  // left open.
  for (const side of ['top', 'bottom']) {
    const inDock = entries.filter(([, p]) => !p.hidden && p.dock === side);
    const allCollapsed = inDock.length > 0 && inDock.every(([, p]) => p.collapsed);
    docks[side].style.height = allCollapsed ? 'auto' : layout.size[side] + 'px';
  }
  renderPanelButtons();
  saveLayout();
  requestAnimationFrame(syncCanvasSize);
}

// The panel toggles used to be buttons in the header. They are the Windows
// menu now, so applyLayout only has to keep an open menu current.
function renderPanelButtons() {
  if (openMenu === 'windows') renderMenu('windows');
}

// Drag the seam between two stacked panels to trade space between them. The
// pair keeps its combined share, so resizing one never disturbs the rest.
function startPanelResize(e, dock, belowEl) {
  // left button only. Every one of these gesture starts took any button, so a
  // right-click meant to open a context menu re-proportioned the dock on the
  // way past and the menu opened over the result.
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  const panels = [...dock.querySelectorAll('.panel:not(.gone):not(.collapsed)')];
  const idx = panels.indexOf(belowEl);
  const above = panels[idx - 1];
  if (!above || idx < 0) return;
  const vert = dock.id === 'dockTop' || dock.id === 'dockBottom';
  const keyOf = el => el.dataset.panel;
  const aKey = keyOf(above), bKey = keyOf(belowEl);
  const aBox = above.getBoundingClientRect(), bBox = belowEl.getBoundingClientRect();
  const total = vert ? aBox.width + bBox.width : aBox.height + bBox.height;
  const totalGrow = (layout.panels[aKey].grow || 1) + (layout.panels[bKey].grow || 1);
  const start = vert ? e.clientX : e.clientY;
  const aStart = vert ? aBox.width : aBox.height;
  const move = ev => {
    const delta = (vert ? ev.clientX : ev.clientY) - start;
    const aNext = Math.max(48, Math.min(total - 48, aStart + delta));
    layout.panels[aKey].grow = totalGrow * (aNext / total);
    layout.panels[bKey].grow = totalGrow - layout.panels[aKey].grow;
    above.style.flexGrow = String(layout.panels[aKey].grow);
    belowEl.style.flexGrow = String(layout.panels[bKey].grow);
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    saveLayout();
    requestAnimationFrame(syncCanvasSize);
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

// Drag a panel header to any edge. The zone is picked by which edge the cursor
// is nearest, normalized so a short window's top and bottom compete fairly with
// a wide window's left and right.
let panelDrag = null;
const dropzone = document.getElementById('dropzone');

function edgeUnderCursor(x, y) {
  // If the pointer is inside a dock that already exists, that is the dock you
  // mean. Going by nearest workspace edge meant the top of the left dock read
  // as "top", so reordering within a dock kept throwing the panel somewhere
  // else and felt impossible to aim.
  for (const side of DOCK_SIDES) {
    const el = dockEl(side);
    if (!el.offsetParent) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return side;
  }
  const ws = document.getElementById('workspace').getBoundingClientRect();
  const d = {
    left: (x - ws.left) / ws.width,
    right: (ws.right - x) / ws.width,
    top: (y - ws.top) / ws.height,
    bottom: (ws.bottom - y) / ws.height,
  };
  return DOCK_SIDES.reduce((best, s) => (d[s] < d[best] ? s : best), 'left');
}

// Which slot in the target dock the cursor is over. Dropping used to append
// unconditionally, so a panel put back always went to the bottom and there was
// no way to reorder within a dock at all.
function dropIndexFor(side, key, x, y) {
  const stacks = side === 'left' || side === 'right';
  const others = Object.entries(layout.panels)
    .filter(([k, p]) => !p.hidden && p.dock === side && k !== key)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([k]) => k);
  let i = 0;
  for (const k of others) {
    const el = panelEls[k];
    if (!el || !el.offsetParent) { i++; continue; }
    const r = el.getBoundingClientRect();
    const mid = stacks ? r.top + r.height / 2 : r.left + r.width / 2;
    if ((stacks ? y : x) > mid) i++;
    else break;
  }
  return { index: i, order: others };
}

// Where a dock would land if it isn't on screen yet, so the preview is the real
// size the panel is about to get rather than a generic band.
function dockPreviewRect(side) {
  const ws = document.getElementById('workspace').getBoundingClientRect();
  const live = dockEl(side).getBoundingClientRect();
  if (live.width > 1 && live.height > 1) return live;
  const size = layout.size[side] || SIZE_DEFAULTS[side];
  if (side === 'left') return { left: ws.left, top: ws.top, width: size, height: ws.height };
  if (side === 'right') return { left: ws.right - size, top: ws.top, width: size, height: ws.height };
  if (side === 'top') return { left: ws.left, top: ws.top, width: ws.width, height: size };
  return { left: ws.left, top: ws.bottom - size, width: ws.width, height: size };
}

// Draw the dock at its real size and split it into slots, one per panel that
// will share it, with the dragged one marked. "Somewhere on the right" tells
// you much less than "this tall, second of three".
function showDropPreview(side, key, at) {
  const r = dockPreviewRect(side);
  const stacks = side === 'left' || side === 'right';
  const sharing = Object.entries(layout.panels)
    .filter(([k, p]) => !p.hidden && p.dock === side && k !== key)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([k]) => k);
  // insert at the cursor's slot rather than always at the end
  sharing.splice(at === undefined ? sharing.length : at, 0, key);
  dropzone.style.display = 'flex';
  dropzone.style.left = r.left + 'px';
  dropzone.style.top = r.top + 'px';
  dropzone.style.width = r.width + 'px';
  dropzone.style.height = r.height + 'px';
  dropzone.style.flexDirection = stacks ? 'column' : 'row';
  dropzone.innerHTML = '';
  for (const k of sharing) {
    const slot = document.createElement('div');
    slot.className = 'dzslot' + (k === key ? ' me' : '');
    const name = document.createElement('span');
    name.textContent = panelEls[k] ? panelEls[k].dataset.title : k;
    slot.appendChild(name);
    // spell out the share the dragged panel is about to get: "an edge" tells
    // you far less than "a third of this one"
    if (k === key) {
      const frac = document.createElement('span');
      frac.className = 'dzfrac';
      frac.textContent = '1/' + sharing.length;
      slot.appendChild(frac);
    }
    dropzone.appendChild(slot);
  }
}

function startPanelDrag(e, key) {
  if (e.button !== 0 || e.target.tagName === 'BUTTON') return;
  panelDrag = { key, startX: e.clientX, startY: e.clientY, moved: false };
}

// Escape and losing focus both abandon the drag. Without this the dropzone
// overlay stayed up and a later click committed a dock move nobody asked for.
function cancelPanelDrag() {
  if (!panelDrag) return;
  panelEls[panelDrag.key].classList.remove('dragging');
  panelDrag = null;
  dropzone.style.display = 'none';
}

window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && panelDrag) { cancelPanelDrag(); e.preventDefault(); }
}, true);

document.addEventListener('mousemove', e => {
  if (!panelDrag) return;
  if (!panelDrag.moved) {
    if (Math.abs(e.clientX - panelDrag.startX) + Math.abs(e.clientY - panelDrag.startY) < 6) return;
    panelDrag.moved = true;
    panelEls[panelDrag.key].classList.add('dragging');
  }
  panelDrag.lastX = e.clientX;
  panelDrag.lastY = e.clientY;
  panelDrag.side = edgeUnderCursor(e.clientX, e.clientY);
  panelDrag.at = dropIndexFor(panelDrag.side, panelDrag.key, e.clientX, e.clientY).index;
  showDropPreview(panelDrag.side, panelDrag.key, panelDrag.at);
});

document.addEventListener('mouseup', () => {
  if (!panelDrag) return;
  const d = panelDrag;
  panelDrag = null;
  dropzone.style.display = 'none';
  panelEls[d.key].classList.remove('dragging');
  if (!d.moved || !d.side) return;
  const p = layout.panels[d.key];
  const target = dropIndexFor(d.side, d.key, d.lastX, d.lastY);
  p.dock = d.side;
  p.hidden = false;
  // rebuild the dock's order with the panel at the cursor's slot, so putting one
  // back lands where you dropped it instead of at the bottom
  const list = target.order.slice();
  list.splice(Math.min(d.at !== undefined ? d.at : target.index, list.length), 0, d.key);
  list.forEach((k, i) => { layout.panels[k].order = i; });
  applyLayout();
});

// dock splitters
for (const [id, side] of [['resizeLeft', 'left'], ['resizeRight', 'right'],
  ['resizeTop', 'top'], ['resizeBottom', 'bottom']]) {
  const el = document.getElementById(id);
  const vertical = side === 'top' || side === 'bottom';
  el.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    el.classList.add('dragging');
    const startX = vertical ? e.clientY : e.clientX;
    const startW = layout.size[side];
    const move = ev => {
      const at = vertical ? ev.clientY : ev.clientX;
      // top and left grow as the cursor moves away from the origin. The far
      // sides grow as it moves back toward it
      const delta = (side === 'left' || side === 'top') ? at - startX : startX - at;
      // A flat 760 cap in isolation. The opposite dock was never consulted, so
      // on a 1280-wide window one splitter could take 760 while the other still
      // held its 150 minimum and the canvas was squeezed to 370 and then to
      // nothing. clampDockSizes already knows the budget both docks share. This
      // asks it the same question, for this axis only.
      const other = side === 'left' ? 'right' : side === 'right' ? 'left'
        : side === 'top' ? 'bottom' : 'top';
      const budget = vertical
        ? Math.max(DOCK_MIN * 2, window.innerHeight - 320)
        : Math.max(DOCK_MIN * 2, window.innerWidth - 320);
      // Only reserve for a dock that is actually RENDERED. A hidden dock still
      // has a remembered width, so reserving it froze the splitter: with the
      // right dock hidden the left one could shrink but not grow, while 948px of
      // canvas sat free, and layout.size persists so the dead state survived a
      // reload. offsetParent is null for a display:none dock, which is the same
      // test edgeUnderCursor already uses.
      const otherTakes = dockEl(other).offsetParent ? layout.size[other] : 0;
      const room = Math.max(DOCK_MIN, budget - otherTakes);
      layout.size[side] = Math.max(DOCK_MIN, Math.min(Math.min(760, room), startW + delta));
      dockEl(side).style[vertical ? 'height' : 'width'] = layout.size[side] + 'px';
      syncCanvasSize();
    };
    const up = () => {
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      saveLayout();
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  // double-click a splitter to reset that dock
  el.addEventListener('dblclick', () => {
    layout.size[side] = SIZE_DEFAULTS[side];
    applyLayout();
  });
}

// ---------- canvas sizing, rulers, guides ----------

const rulerTop = document.getElementById('rulerTop');
const rulerLeft = document.getElementById('rulerLeft');
const rulerBottom = document.getElementById('rulerBottom');
const rulerRight = document.getElementById('rulerRight');
// side -> is it a horizontal rule, and which edge do its ticks grow from
const RULERS = [
  { cv: rulerTop, horiz: true, flip: false },
  { cv: rulerLeft, horiz: false, flip: false },
  { cv: rulerBottom, horiz: true, flip: true },
  { cv: rulerRight, horiz: false, flip: true },
];
const guidesEl = document.getElementById('guides');
let showRulers = true;
let showGrid = true;
let guides = [];        // { axis: 'x'|'y', pos }
// The pointer in WORLD coordinates. Named for the space it is in, because the
// previous name said "canvas" while the value was surface pixels times zoom,
// and three consumers read it as world.
let cursorWorld = { x: 0, y: 0 };
// The last screen position the pointer was seen at. cursorWorld was only
// recomputed on mousemove, so a keyboard zoom or a Focus Selection left the
// ruler marker and the coordinate readout pointing at a world position the
// pointer had not been at since before the view moved.
let lastPointer = null;

function refreshCursorWorld() {
  if (!lastPointer || !cursorInside) return;
  const p = canvasPoint(lastPointer);
  cursorWorld = { x: Math.round(p.x), y: Math.round(p.y) };
  coordTip.textContent = cursorWorld.x + ', ' + cursorWorld.y;
}
let cursorInside = false;

// Where the pointer really is, in client pixels, tracked on the document so it
// stays right while a drag is running and the pointer has left the canvas. This
// is the input to redeliverPointer below, which needs a position the browser
// will not give it again.
let lastClient = null;
document.addEventListener('mousemove',
  e => { lastClient = { x: e.clientX, y: e.clientY }; }, true);

// The engine's cursor position is a CACHE. The GLFW backend fills it from the
// last DOM mouse event, mapped through the canvas rect as it was at that moment,
// and re-asserts that same cached value into ImGui every single frame. So moving
// or resizing the canvas silently invalidates it: the pointer has not moved, but
// the surface pixel under it has, and nothing tells the engine.
//
// That is not a cosmetic drift. ImGui places a window it is dragging at
// `mouse - grabOffset` every frame, so a cursor that is stale by the origin delta
// MOVES the window by the origin delta. The window then sat further into negative
// space, which grew the sheet, which moved the origin again, which moved the
// window again: press a title bar, hold perfectly still, and the window
// accelerated off the sheet at a few thousand pixels a second and never stopped
// until the button came up.
//
// Re-delivering the pointer where it actually is refills the cache against the
// new rect. Only the canvas needs to hear it (that is where GLFW listens, and it
// ignores events aimed anywhere else), so this does not bubble into our own
// handlers. pageX/pageY are what the backend reads.
function redeliverPointer() {
  if (!lastClient) return;
  canvas.dispatchEvent(new MouseEvent('mousemove', {
    clientX: lastClient.x, clientY: lastClient.y, bubbles: false, cancelable: false,
  }));
}

// The wasm surface follows its container instead of being a fixed 1000x740 box,
// so the preview uses whatever width the docks leave.
// The drawing surface has to cover the content, not just the part of it you
// happen to be looking at. Sizing it to the viewport meant a window wider than
// the visible area was drawn only as far as the surface went and then stopped
// dead, and panning had the same effect. It grows to fit whatever the document
// occupies, with a margin so a resize drag has somewhere to go.
const CANVAS_MARGIN = 240;
const CANVAS_MAX = 4096;   // comfortably inside any WebGL texture limit

// World bounds of everything on the sheet. Both edges matter now: content may
// start left of or above the origin, and the surface has to reach it.
// `tight` drops the clamp to world 0,0.
//
// The drawing surface genuinely has to cover the origin, so the default keeps
// it. Zoom-to-fit does not: a document whose windows all sit at 1200,900 was
// fitted to a box starting at 0,0, which is four times the area it needed, so
// the content came out a quarter the size it should have been in a corner.
function contentBounds(tight) {
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  if (tight) {
    minX = minY = Infinity;
    maxX = maxY = -Infinity;
  }
  for (const r of latestRects) {
    if (r.w === 0 && r.h === 0) continue;      // a hidden closable window
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  }
  // the document may say a window is bigger, or further out, than the last frame
  // drew: a size typed into the inspector should grow the sheet immediately
  for (const win of doc.children) {
    if (win.type !== 'window') continue;
    const x = Number(win.x) || 0, y = Number(win.y) || 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + (Number(win.w) || 0));
    maxY = Math.max(maxY, y + (Number(win.h) || 0));
  }
  // an empty sheet in tight mode: say so rather than returning ±Infinity
  if (tight && !Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

// Kept for the callers that only care how far the content reaches.
function contentExtent(tight) {
  const b = contentBounds(tight);
  if (!b) return null;
  if (tight) return { w: b.maxX - b.minX, h: b.maxY - b.minY };
  return { w: b.maxX - Math.min(0, b.minX), h: b.maxY - Math.min(0, b.minY) };
}

// Quantized, because the size is derived from the live rects: dragging a window
// changes the extent every frame, and resizing the surface every frame makes the
// preview strobe. Rounding up to a step means the surface only changes when the
// content crosses a boundary, and it never shrinks while a gesture is running.
const CANVAS_STEP = 256;
const quantize = v => Math.ceil(v / CANVAS_STEP) * CANVAS_STEP;
// Standing room to the left of and above the content. See syncCanvasSize for
// why this is not just tidiness: it is what keeps the origin still while a
// press is being taken.
const EDGE_SLACK = CANVAS_STEP * 2;

function syncCanvasSize() {
  const b = contentBounds();
  // Zoomed out, the visible box covers more world than its pixel size, so the
  // surface has to be the box divided by the zoom or the ground runs out before
  // the edge of the view.
  // The visible box in WORLD coordinates, pan included. It used to be measured
  // at pan zero, so panning left (a negative pan) slid world the sheet does not
  // cover into view: a band at the right and bottom where the canvas element
  // simply is not, so canvasPoint().inside was false and a click there did
  // nothing. viewLeft/viewTop matter for the same reason on the other side.
  const viewLeft = -pan.x / zoom;
  const viewTop = -pan.y / zoom;
  const viewRight = (canvasHost.clientWidth - pan.x) / zoom;
  const viewBottom = (canvasHost.clientHeight - pan.y) / zoom;
  const visW = Math.floor(canvasHost.clientWidth / zoom);
  const visH = Math.floor(canvasHost.clientHeight / zoom);
  // The origin only leaves zero when content actually needs it, so a document
  // living in positive space renders exactly as it always did and the canvas
  // element is not offset for nothing. While a gesture is running it keeps a
  // whole margin of slack in hand instead, so a drag heading for negative space
  // always has sheet ahead of it and cannot outrun the next resize.
  // Only content that has actually reached negative space moves the origin. Giving
  // every gesture a margin of slack up front meant a drag in positive space still
  // shifted the sheet, and the surface was rebuilt every few frames. The cost is
  // that the frame on which content first crosses zero can clip by a pixel or two
  // before the next poll. Anything PLACED at a negative position is covered before
  // it is ever drawn, which is what matters.
  const gesture = !!(drag || resizing || wasMovingWindow || wasResizingWindow
    || armedWindowDrag);
  // Extra headroom once content is ALREADY in negative space and a gesture is
  // running, which is the only time the sheet has to stay ahead of a moving edge.
  // Applying it to every gesture instead churned the surface during ordinary
  // drags in positive space.
  // While ImGui is dragging one of its own windows it positions that window from
  // the MOUSE, not from the document, so it can outrun a sheet that only grows
  // after the fact. Reserving a slab of negative headroom for the duration of the
  // drag means the pointer cannot leave the sheet in a single frame. It costs one
  // resize when the drag starts and one when it ends, and nothing at rest.
  // The sheet already reserves CANVAS_MARGIN beyond the content on the right and
  // bottom. It reserves the same on the left and top, plus standing slack, and
  // that slack is load-bearing rather than tidy: THE ORIGIN MUST NOT MOVE ON THE
  // FRAME A PRESS IS TAKEN. ImGui matches a click against the previous frame's
  // window rectangles, so shifting the coordinate system between those two
  // frames puts the click over nothing, the title-bar grab never happens, and
  // the window simply does not drag. Arming the headroom on mousedown, which is
  // the obvious place, reliably ate the click that way.
  //
  // Standing slack means the ordinary case never moves the origin at all, and a
  // drag can cross the origin and run 512px past it before the surface has to
  // grow. By then the drag is established and a mid-drag move is safe, because
  // the pointer is re-delivered whenever the sheet shifts under it.
  const reserve = wasMovingWindow ? 1024 : 0;
  const needX = Math.max(EDGE_SLACK,
    Math.max(0, -b.minX, -viewLeft) + CANVAS_MARGIN + reserve);
  const needY = Math.max(EDGE_SLACK,
    Math.max(0, -b.minY, -viewTop) + CANVAS_MARGIN + reserve);
  let ox = -quantize(needX);
  let oy = -quantize(needY);
  // Never contract mid-gesture: the surface moving under a drag is a jump. This
  // has to include an ImGui-driven window drag, where our own `drag` is null.
  // Without it the slack came and went with the engine's moving flag, the origin
  // oscillated between 0 and -256, and the surface was rebuilt every few frames.
  if (gesture || marquee) {
    ox = Math.min(ox, origin.x);
    oy = Math.min(oy, origin.y);
  }
  // visW/visH are WORLD widths (the visible box divided by zoom), while
  // everything else here is a SURFACE width measured from ox. Comparing the two
  // directly left the sheet short by -ox on the right and bottom, which is a
  // dead strip 512px wide where the canvas element simply is not, so
  // canvasPoint().inside was false and clicks there did nothing at all.
  const wantW = Math.max(visW - ox, quantize(Math.max(b.maxX, viewRight) - ox + CANVAS_MARGIN));
  const wantH = Math.max(visH - oy, quantize(Math.max(b.maxY, viewBottom) - oy + CANVAS_MARGIN));
  let w = Math.min(CANVAS_MAX, Math.max(64, wantW));
  let h = Math.min(CANVAS_MAX, Math.max(64, wantH));
  // hold the larger size while dragging or resizing, so a shrinking extent
  // mid-gesture cannot cause a resize storm
  if (gesture || marquee) {
    w = Math.max(w, canvas.width);
    h = Math.max(h, canvas.height);
  }
  const originMoved = ox !== origin.x || oy !== origin.y;
  if (originMoved) {
    origin.x = ox;
    origin.y = oy;
  }
  // Tracked separately from `origin`, because "has it changed" and "has the
  // engine been told" are different questions. Gating the ccall on the change
  // alone meant a move that happened before the engine was ready was never sent
  // again, and the two sides then disagreed forever: the front end placed a
  // press in world coordinates the engine had never heard of, so a title-bar
  // drag landed hundreds of pixels from the title bar and did nothing.
  if (engineReady && (ox !== sentOrigin.x || oy !== sentOrigin.y)) {
    PROFILE.engine.call('engine_set_origin', null, ['number', 'number'], [ox, oy]);
    sentOrigin.x = ox;
    sentOrigin.y = oy;
  }
  const sizeMoved = canvas.width !== w || canvas.height !== h;
  if (sizeMoved) {
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    if (engineReady) PROFILE.engine.call('engine_resize', null, ['number', 'number'], [w, h]);
  }
  // the canvas element has to move with its origin, or world 0,0 slides
  if (originMoved) applyViewTransform();
  // Both of those change where a client pixel lands on the surface, so the
  // engine's cached cursor is now wrong. Told after the transform, never before,
  // or it maps against the rect we are in the middle of leaving.
  if (originMoved || sizeMoved) redeliverPointer();
  // #canvashost is pan/zoom driven, not scroll driven (overflow:hidden), so it
  // should never carry a scroll offset at all. A stray focus() on something
  // wide enough (an inline label editor, say) can make the browser auto-scroll
  // it anyway, and once wedged the whole view stays off by that amount even
  // after the thing that scrolled it is gone. Zeroed every sync so nothing can
  // make that stick.
  canvasHost.scrollLeft = 0;
  canvasHost.scrollTop = 0;
  drawRulers();
}

new ResizeObserver(() => syncCanvasSize()).observe(canvasHost);
// A window that shrinks past what the docks were sized for has to re-clamp
// them, or the canvas gets squeezed out from between them.
window.addEventListener('resize', () => {
  const before = JSON.stringify(layout.size);
  clampDockSizes();
  if (JSON.stringify(layout.size) !== before) applyLayout();
  syncCanvasSize();
  // a shorter window scrolls the hierarchy, and losing sight of what you had
  // selected is disorienting
  revealSelectedRow();
});

function revealSelectedRow() {
  const sel = document.querySelector('#tree .row.selected');
  if (sel && sel.offsetParent) sel.scrollIntoView({ block: 'nearest' });
}

// Where the cursor marker goes on a ruler: world * zoom + pan, the same formula
// the ticks use. Pulled out of drawRulers so a test can read the value the
// drawing actually uses rather than re-deriving it and agreeing with itself.
// cursorWorld is world now, so this is one multiply. It used to be handed a
// surface*zoom value and multiply by zoom a second time.
function rulerMarkerPos(horiz) {
  return (horiz ? cursorWorld.x : cursorWorld.y) * zoom + (horiz ? pan.x : pan.y);
}

// Per-ruler record of the ticks the last draw emitted, keyed by canvas id, so a
// test can assert the world values rather than counting colored pixels.
const lastRulerTicks = {};

function drawRulers() {
  if (!showRulers) return;
  const W = canvasHost.clientWidth, H = canvasHost.clientHeight;
  for (const { cv, horiz, flip } of RULERS) {
    const len = horiz ? W : H;
    cv.width = horiz ? len : 20;
    cv.height = horiz ? 20 : len;
    const g = cv.getContext('2d');
    // read from the theme rather than baking Monokai into the canvas
    const css = getComputedStyle(document.documentElement);
    const v = n => css.getPropertyValue('--mk-' + n).trim();
    g.fillStyle = v('canvas');
    g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = v('border');
    g.fillStyle = v('comment');
    g.font = '10px JetBrains Mono, monospace';
    g.beginPath();
    // Ticks count in world coordinates, not screen ones, so they keep meaning
    // the same thing once the view has been panned. Negatives are real now:
    // the grid carries on above and to the left of the origin.
    const off = horiz ? pan.x : pan.y;
    // World units, drawn at world * zoom. The step grows as you zoom out so the
    // ticks never collapse into a solid bar, and shrinks as you zoom in so there
    // is something to read between the hundreds.
    const step = zoom >= 2 ? 5 : (zoom >= 0.75 ? 10 : (zoom >= 0.4 ? 20 : 50));
    const first = Math.floor(-off / zoom / step) * step;
    // Majors are ticked every world-100 regardless of zoom, but a LABEL needs
    // more than a tick's worth of room: a 4-digit number in the 10px mono font
    // is about 26px wide, and at 25% zoom majors are only 25px apart on screen
    // (100 world units * 0.25), so consecutive labels ran together into one
    // unreadable strip. Thinning the label cadence out at low zoom, the same
    // way `step` already thins the ticks, keeps the majors themselves lined up
    // with the grid while giving the text room to breathe.
    const labelStep = zoom < 0.3 ? 400 : (zoom < 0.5 ? 200 : 100);
    // What this loop actually emitted, kept for the tests. Counting ink on the
    // ruler canvas cannot see the ticks at all: the strokes use --mk-border,
    // whose red channel sits below any sane threshold, so an ink count is really
    // counting the handful of drawn number strings.
    const drawn = [];
    for (let wv = first; wv * zoom + off < len; wv += step) {
      const p = wv * zoom + off;
      if (p < 0) continue;
      const major = wv % 100 === 0, mid = wv % 50 === 0;
      const label = major && wv % labelStep === 0;
      drawn.push({ w: wv, p: Math.round(p), major, label });
      const size = major ? 20 : (mid ? 8 : 4);
      // the bottom and right rules grow their ticks from the canvas edge, which
      // for them is the near side rather than the far one
      if (horiz) {
        const y0 = flip ? 0 : 20 - size, y1 = flip ? size : 20;
        g.moveTo(p + 0.5, y0); g.lineTo(p + 0.5, y1);
      } else {
        const x0 = flip ? 0 : 20 - size, x1 = flip ? size : 20;
        g.moveTo(x0, p + 0.5); g.lineTo(x1, p + 0.5);
      }
      // labels need room, so skip the one that would run off the near edge
      if (label && p > 12) {
        const txt = String(wv);
        if (horiz) g.fillText(txt, p + 2, flip ? 17 : 8);
        else {
          g.save();
          g.translate(flip ? 17 : 8, p + 2);
          g.rotate(-Math.PI / 2);
          g.fillText(txt, -txt.length * 5, 0);
          g.restore();
        }
      }
    }
    lastRulerTicks[cv.id] = drawn;
    g.stroke();
    // cursor position marker, the measurement half of a ruler. A world
    // coordinate can be negative now, so "is the pointer here" is its own flag
    // rather than a -1 sentinel.
    const c = rulerMarkerPos(horiz);
    if (cursorInside) {
      g.strokeStyle = v('cyan');
      g.beginPath();
      if (horiz) { g.moveTo(c + 0.5, 0); g.lineTo(c + 0.5, 20); }
      else { g.moveTo(0, c + 0.5); g.lineTo(20, c + 0.5); }
      g.stroke();
    }
  }
}

function renderGuides() {
  guidesEl.innerHTML = '';
  guides.forEach((gd, i) => {
    const el = document.createElement('div');
    el.className = 'guide ' + (gd.axis === 'x' ? 'gx' : 'gy');
    // the position is a world coordinate. The layer is the host, which does not
    // pan, so the offset is applied here and the line spans ruler to ruler
    if (gd.axis === 'x') el.style.left = (gd.pos * zoom + pan.x) + 'px';
    else el.style.top = (gd.pos * zoom + pan.y) + 'px';
    el.title = gd.axis + ' = ' + gd.pos + ' (drag to move, double-click to remove)';
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const move = ev => {
        const p = canvasPoint(ev);
        gd.pos = Math.round(gd.axis === 'x' ? p.x : p.y);
        renderGuides();
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        saveGuides();
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      guides.splice(i, 1);
      renderGuides();
      saveGuides();
    });
    guidesEl.appendChild(el);
  });
}

function saveGuides() {
  try { localStorage.setItem(PROFILE.storagePrefix + '.guides', JSON.stringify(guides)); } catch (e) {}
}

// drag out of a ruler to create a guide
for (const [cv, axis] of [[rulerTop, 'y'], [rulerLeft, 'x'],
  [rulerBottom, 'y'], [rulerRight, 'x']]) {
  cv.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    const gd = { axis, pos: 0 };
    guides.push(gd);
    const move = ev => {
      // canvasPoint, the same conversion the existing-guide drag uses. Taking
      // (clientX - canvasRect.left) stored surface*zoom in a field every other
      // consumer reads as world, so a guide dropped at world 100 landed at 612
      // and its tooltip said so.
      const p = canvasPoint(ev);
      gd.pos = Math.round(axis === 'x' ? p.x : p.y);
      renderGuides();
    };
    const up = ev => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      // Tested against the VISIBLE box, not the surface. The canvas element now
      // extends a slack margin past the viewport on every side, so the rulers
      // and the docks were inside it and dropping a guide straight back on the
      // ruler to cancel kept it instead.
      const r = canvasHost.getBoundingClientRect();
      const inside = ev.clientX >= r.left && ev.clientX <= r.right
        && ev.clientY >= r.top && ev.clientY <= r.bottom;
      if (!inside) guides.pop();   // dropped back on the ruler: discard
      renderGuides();
      saveGuides();
    };
    move(e);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
}

canvasHost.addEventListener('mousemove', e => {
  // WORLD, which is what the readout and the ruler marker both mean by it.
  // It used to hold (clientX - canvasRect.left), which is surface*zoom: neither
  // the origin subtracted nor the zoom divided out. With the origin at 0 that
  // was invisible at 100%. Once the sheet gained standing slack the readout was
  // 512 out at every zoom, and drawRulers multiplied it by zoom a second time.
  lastPointer = { clientX: e.clientX, clientY: e.clientY };
  const p = canvasPoint(e);
  cursorWorld = { x: Math.round(p.x), y: Math.round(p.y) };
  cursorInside = true;
  // Space went down while the pointer was elsewhere, so nothing happened then.
  // Now that it is here and the key is still held, the peek is plainly meant.
  if (spacePhysicallyDown && !spaceHeld && !isRealEditor(document.activeElement)) {
    if (isTextEntry(document.activeElement)) document.activeElement.blur();
    handleSpaceDown(null);
  }
  drawRulers();
  // Live mode (sustained, or peeked by the Space handler just above) is for
  // testing the UI, not measuring it, and the readout was sitting right on top
  // of whichever widget was beside the cursor at its fixed 14px offset.
  if (editMode) {
    const host = canvasHost.getBoundingClientRect();
    coordTip.style.display = 'block';
    coordTip.textContent = cursorWorld.x + ', ' + cursorWorld.y;
    // flip to the other side of the cursor near the edges so it stays readable
    const lx = e.clientX - host.left + 14;
    const ly = e.clientY - host.top + 16;
    coordTip.style.left = Math.min(lx, host.width - coordTip.offsetWidth - 4) + 'px';
    coordTip.style.top = Math.min(ly, host.height - coordTip.offsetHeight - 4) + 'px';
  } else {
    coordTip.style.display = 'none';
  }
  updateHoverStatus(e);
});
canvasHost.addEventListener('mouseleave', () => {
  cursorInside = false;
  coordTip.style.display = 'none';
  drawRulers();
  updateHoverStatus(null);
});

function setRulers(on) {
  showRulers = on;
  document.getElementById('canvasarea').classList.toggle('norulers', !on);
  guidesEl.style.display = on ? '' : 'none';
  document.getElementById('rulerBtn').classList.toggle('on', on);
  requestAnimationFrame(syncCanvasSize);
  try { localStorage.setItem(PROFILE.storagePrefix + '.rulers', on ? '1' : '0'); } catch (e) {}
}

function setGrid(on) {
  showGrid = on;
  document.getElementById('gridBtn').classList.toggle('on', on);
  canvasHost.classList.toggle('nogrid', !on);
  try { localStorage.setItem(PROFILE.storagePrefix + '.grid', on ? '1' : '0'); } catch (e) {}
}

document.getElementById('gridBtn').onclick = () => setGrid(!showGrid);
document.getElementById('rulerBtn').onclick = () => setRulers(!showRulers);

// ---------- hotbar ----------
// Positional slots, auto-assigned. Rebinding is reordering, which is what every
// surveyed tool does instead of a per-slot key-remap UI.

function saveHotbar() {
  try { localStorage.setItem(HOTBAR_KEY, JSON.stringify(hotbar)); } catch (e) {}
}

// Returns false when a full bar has nowhere to put the tool, so the caller can
// say so instead of the click looking like it did nothing.
function pinToHotbar(type, slot) {
  if (slot === undefined) {
    if (hotbar.includes(type)) return true;
    slot = hotbar.indexOf(null);
    if (slot < 0) return false;
  }
  // one slot per tool: a second copy just costs a key for no extra reach
  const dupe = hotbar.indexOf(type);
  if (dupe >= 0 && dupe !== slot) hotbar[dupe] = null;
  hotbar[slot] = type;
  saveHotbar();
  renderPalette();
  return true;
}

function unpin(type) {
  const i = hotbar.indexOf(type);
  if (i >= 0) { hotbar[i] = null; saveHotbar(); renderPalette(); }
}

