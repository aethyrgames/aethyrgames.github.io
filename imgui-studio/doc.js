// The document tree and everything that edits it: the node model, the undo
// ring, the selection set and its verbs, the clipboard, and the project list.
// Nothing here touches the DOM or the engine.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- document model ----------

let nextId = 100;
let selectedId = null;

// Declared up here because the keymap binds these keys well before the hotbar's
// rendering code appears further down the file.
const HOTBAR_KEYS = '0123456789-='.split('');
const HOTBAR_KEY = 'imguistudio.hotbar';
const hotbar = new Array(HOTBAR_KEYS.length).fill(null);

// The document root holds windows. It is not itself a window: a panel design
// can have several, and deleting the last one has to be possible without
// leaving the document in an impossible state.
const doc = {
  type: 'root', id: 'root', children: [{
  type: 'window', id: 'w1', label: 'My Panel', w: 380, h: 460,
  children: [
    { type: 'text',        id: 'n1', label: 'Engine settings' },
    { type: 'separator',   id: 'n2', label: '' },
    { type: 'checkbox',    id: 'n3', label: 'Enable turbo' },
    { type: 'button',      id: 'n4', label: 'Reset', sameline: true },
    { type: 'sliderfloat', id: 'n5', label: 'Speed', n: 1, min: 0, max: 10 },
    { type: 'inputtext',   id: 'n6', label: 'Preset name' },
    { type: 'coloredit',   id: 'n7', label: 'Tint', n: 3 },
    { type: 'progressbar', id: 'n8', label: '', fraction: 0.4 },
  ],
  }],
};

const DEFAULT_DOC = JSON.parse(JSON.stringify(doc));
const SAVE_KEY = 'imguistudio.doc.v1';

const isContainer = node => !!(WIDGETS[node.type] && WIDGETS[node.type].container);

// depth-first walk yielding {node, parent, index}
function walk(node, fn, parent = null, index = 0, depth = 0) {
  if (fn(node, parent, index, depth) === false) return false;
  const kids = node.children || [];
  for (let i = 0; i < kids.length; i++) {
    if (walk(kids[i], fn, node, i, depth + 1) === false) return false;
  }
  return true;
}

function findNode(id) {
  let found = null;
  walk(doc, n => { if (n.id === id) { found = n; return false; } });
  return found;
}

function findParent(id) {
  let found = null;
  walk(doc, (n, p) => { if (n.id === id) { found = p; return false; } });
  return found;
}

function isAncestor(ancestorId, nodeId) {
  const a = findNode(ancestorId);
  if (!a) return false;
  let hit = false;
  walk(a, n => { if (n.id === nodeId && n.id !== ancestorId) { hit = true; return false; } });
  return hit;
}

// The body moved to widgets.js as makeNodeOfType, so the unit tests build nodes
// through the same code the app does. All that is left here is the id counter,
// which was the only part that was ever app state.
function makeNode(type) {
  return makeNodeOfType(type, 'n' + (nextId++));
}

function detach(id) {
  const parent = findParent(id);
  if (!parent) return null;
  const i = parent.children.indexOf(findNode(id));
  if (i < 0) return null;
  return parent.children.splice(i, 1)[0];
}

// drop = { parentId, index, sameline? }
function insertAt(node, drop) {
  let parent = findNode(drop.parentId) || doc;
  // only a window may sit at the root, so anything else lands in one
  if (parent === doc && node.type !== 'window') {
    const wins = doc.children.filter(n => n.type === 'window');
    if (!wins.length) return false;
    parent = wins[wins.length - 1];
    drop = { parentId: parent.id, index: (parent.children || []).length, sameline: drop.sameline };
  }
  if (parent !== doc && node.type === 'window') return false;
  if (!parent.children) parent.children = [];
  const i = Math.max(0, Math.min(drop.index, parent.children.length));
  if (drop.sameline) node.sameline = true; else delete node.sameline;
  parent.children.splice(i, 0, node);
  return true;
}

// Where a newly added widget belongs. A window is a required root for
// everything else, so this walks up from the selection to the nearest
// container, and falls back to the last window rather than the document.
function insertHost(type) {
  if (WIDGETS[type] && WIDGETS[type].rootOnly) return doc;
  const sel = selectedId ? findNode(selectedId) : null;
  if (sel && sel !== doc) {
    if (isContainer(sel) && sel.type !== 'window') return sel;
    if (isContainer(sel)) return sel;
    const p = findParent(sel.id);
    if (p && p !== doc) return p;
    if (p === doc) return sel;          // a window was selected via its child
  }
  const wins = doc.children.filter(n => n.type === 'window');
  return wins.length ? wins[wins.length - 1] : null;
}

function addNode(type) {
  const node = makeNode(type);
  const host = insertHost(type);
  if (!host) return;
  if (!host.children) host.children = [];
  host.children.push(node);
  // the new node becomes the whole selection: leaving the previous one in the
  // set would point Delete and Duplicate at widgets the user is done with
  selection.clear();
  selection.add(node.id);
  selectedId = node.id;
  lastInsertType = type;
  refresh();
}

function insertNodeAt(type, drop) {
  const node = makeNode(type);
  if (!insertAt(node, drop)) return;
  selection.clear();
  selection.add(node.id);
  selectedId = node.id;
  lastInsertType = type;
  refresh();
}

function moveNodeTo(id, drop) {
  if (drop.parentId === id || isAncestor(id, drop.parentId)) return; // no cycles
  const parent = findParent(id);
  const oldIndex = parent ? parent.children.indexOf(findNode(id)) : -1;
  const node = detach(id);
  if (!node) return;
  // removing from earlier in the same list shifts the target index down
  const d = { ...drop };
  if (parent && parent.id === drop.parentId && oldIndex >= 0 && oldIndex < drop.index) d.index -= 1;
  // insertAt refuses some pairings outright, a window inside a widget being the
  // one you can reach by dragging a window row onto a child in the hierarchy.
  // The detach has already happened by then, so without putting it back the
  // window and everything in it is gone.
  if (!insertAt(node, d) && parent) {
    parent.children.splice(oldIndex < 0 ? parent.children.length : oldIndex, 0, node);
  }
  selectedId = id;
  refresh();
}

// Dragging any member of a multi-selection takes the whole selection with it.
// Moving only the grabbed node made a marquee select look like it had worked
// right up until you tried to use it.
function moveSelectionTo(id, drop) {
  const nodes = selectedNodes().filter(n => n !== doc);
  if (nodes.length < 2 || !selection.has(id)) { moveNodeTo(id, drop); return; }
  // dropping inside one of the nodes being moved would orphan the rest
  if (nodes.some(n => n.id === drop.parentId || isAncestor(n.id, drop.parentId))) return;
  const parent = findNode(drop.parentId) || doc;
  if (!parent.children) parent.children = [];
  // count how many of the moved nodes sit before the drop point in this list,
  // since detaching them shifts the target index down by that much
  const before = nodes.filter(n => {
    const i = parent.children.indexOf(n);
    return i >= 0 && i < drop.index;
  }).length;
  for (const n of nodes) detach(n.id);
  let at = Math.max(0, Math.min(drop.index - before, parent.children.length));
  for (const n of nodes) {
    if (drop.sameline && n === nodes[0]) n.sameline = true;
    parent.children.splice(at++, 0, n);
  }
  selectMany(nodes.map(n => n.id));
  refresh();
}

function removeNode(id) {
  detach(id);
  // the selection may have been a descendant of the removed subtree
  for (const s of [...selection]) if (!findNode(s)) selection.delete(s);
  if (selectedId && selectedId !== 'root' && !findNode(selectedId)) {
    selectedId = selection.size ? [...selection][selection.size - 1] : null;
  }
  refresh();
}

function moveNode(id, delta) {
  const parent = findParent(id);
  if (!parent) return;
  const i = parent.children.indexOf(findNode(id));
  const j = i + delta;
  if (i < 0 || j < 0 || j >= parent.children.length) return;
  [parent.children[i], parent.children[j]] = [parent.children[j], parent.children[i]];
  refresh();
}

// ---------- history (undo/redo) ----------

const history = []; // { docStr, sel }
let histIndex = -1;
let lastHistAt = 0;
let lastCoalescible = false;

// Only document changes create entries. Selection is carried along for restore
// but never compared, or arrow-key browsing would flood the ring and push real
// edits out of reach.
function pushHistory(coalesce) {
  const docStr = JSON.stringify({ doc, nextId });
  if (histIndex >= 0 && history[histIndex].docStr === docStr) return;
  const now = Date.now();
  history.length = histIndex + 1;
  // A burst only merges into an entry that was itself a coalescible edit.
  // Without that check, typing right after an insert would overwrite the
  // insert's snapshot and undo would delete the widget instead of the label.
  if (coalesce && lastCoalescible && histIndex > 0 && now - lastHistAt < 1000) {
    history[histIndex] = { docStr, sel: selectedId };
  } else {
    history.push({ docStr, sel: selectedId });
    histIndex = history.length - 1;
    if (history.length > 100) { history.shift(); histIndex--; }
  }
  lastCoalescible = !!coalesce;
  lastHistAt = now;
}

// Each project carries its own undo stack, so switching starts a fresh one
// rather than letting Ctrl+Z reach back into a document you left.
function resetHistory() {
  history.length = 0;
  histIndex = -1;
  lastCoalescible = false;
}

// bypasses refresh() so restoring can't push a new history entry
function restoreSnapshot(entry) {
  const s = JSON.parse(entry.docStr);
  doc.children = s.doc.children;
  for (const [k] of WIDGETS.window.props) doc[k] = s.doc[k];
  nextId = s.nextId;
  selectedId = entry.sel;
  if (selectedId && selectedId !== 'root' && !findNode(selectedId)) selectedId = null;
  renderTree();
  renderProps();
  renderCode();
  pushDoc();
  saveLocal();
}

function undo() { if (histIndex > 0) { histIndex--; restoreSnapshot(history[histIndex]); } }
function redo() { if (histIndex < history.length - 1) { histIndex++; restoreSnapshot(history[histIndex]); } }

// ---------- selection navigation and structure verbs ----------

// ---------- selection set ----------
// Invariant: no node is in the set if an ancestor is also in it. Normalizing on
// every mutation is what makes delete/copy/codegen order-independent instead of
// needing defensive checks at each call site.
const selection = new Set();

function normalizeSelection() {
  for (const id of [...selection]) {
    for (const other of selection) {
      if (other !== id && isAncestor(other, id)) { selection.delete(id); break; }
    }
  }
  if (selectedId && !selection.has(selectedId)) {
    selectedId = selection.size ? [...selection][selection.size - 1] : null;
  }
}

function selectId(id) {
  selection.clear();
  if (id) selection.add(id);
  selectedId = id;
  refresh();
}

function selectMany(ids) {
  selection.clear();
  for (const id of ids) if (id) selection.add(id);
  normalizeSelection();
  selectedId = selection.size ? [...selection][selection.size - 1] : null;
  refresh();
}

function toggleSelected(id) {
  if (selection.has(id)) {
    selection.delete(id);
    if (selectedId === id) selectedId = selection.size ? [...selection][selection.size - 1] : null;
  } else {
    selection.add(id);
    selectedId = id;
  }
  normalizeSelection();
  refresh();
}

function clearSelection() {
  selection.clear();
  selectedId = null;
}

// selection in document order, ancestors already removed
function selectedNodes() {
  const out = [];
  walk(doc, n => { if (selection.has(n.id)) out.push(n); });
  return out;
}

// With a single window the widgets are what you are navigating; the window
// itself is scaffolding. Descend through it so the arrows land where expected.
function navRoot() {
  const wins = doc.children.filter(n => n.type === 'window');
  return wins.length === 1 ? wins[0] : doc;
}

function selectSibling(delta) {
  if (!selectedId || selectedId === 'root') {
    const r = navRoot();
    if (r.children.length) selectId(r.children[delta < 0 ? r.children.length - 1 : 0].id);
    return;
  }
  const parent = findParent(selectedId);
  if (!parent) return;
  const i = parent.children.findIndex(n => n.id === selectedId);
  const j = Math.max(0, Math.min(parent.children.length - 1, i + delta));
  if (j !== i) selectId(parent.children[j].id);
}

function selectEdge(last) {
  const parent = selectedId && selectedId !== 'root' ? findParent(selectedId) : navRoot();
  const kids = (parent || navRoot()).children;
  if (kids.length) selectId(kids[last ? kids.length - 1 : 0].id);
}

function descend() {
  const node = selectedId ? findNode(selectedId) : navRoot();
  const kids = (node && node.children) || [];
  if (kids.length) selectId(kids[0].id);
}

function ascend() {
  if (!selectedId) return;
  if (selectedId === 'root') { selectId(null); return; }
  const parent = findParent(selectedId);
  selectId(parent ? parent.id : null);
}

function cloneWithNewIds(node) {
  const copy = JSON.parse(JSON.stringify(node));
  walk(copy, n => { n.id = 'n' + (nextId++); });
  return copy;
}

// where an insert lands relative to the selection: inside a selected
// container, after a selected leaf, or at the end of the window
function dropAfterSelection() {
  const node = selectedId && selectedId !== 'root' ? findNode(selectedId) : null;
  if (node && isContainer(node)) return { parentId: node.id, index: (node.children || []).length };
  if (node) {
    const parent = findParent(node.id);
    return { parentId: parent.id, index: parent.children.indexOf(node) + 1 };
  }
  const r = navRoot();
  return { parentId: r.id, index: r.children.length };
}

// The structure verbs are bound and labelled as selection verbs, so they act on
// the whole selection. Grouping by parent first keeps each list's splices
// independent, which is what lets a selection spanning containers work at all.
function byParent(nodes) {
  const groups = new Map();
  for (const n of nodes) {
    const p = findParent(n.id);
    if (!p) continue;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(n);
  }
  return groups;
}

function reorderSelection(delta, extreme) {
  const nodes = selectedNodes().filter(n => n !== doc);
  if (!nodes.length) return;
  for (const [parent, group] of byParent(nodes)) {
    const list = parent.children;
    // pull the block out, then reinsert it as a unit, so a multi-selection
    // keeps its internal order instead of shuffling against itself
    const idx = group.map(n => list.indexOf(n)).sort((a, b) => a - b);
    const block = idx.map(i => list[i]);
    const anchor = delta < 0 ? idx[0] : idx[idx.length - 1];
    for (let k = idx.length - 1; k >= 0; k--) list.splice(idx[k], 1);
    const before = idx.filter(i => i < anchor).length;
    let target = extreme
      ? (delta < 0 ? 0 : list.length)
      : Math.max(0, Math.min(list.length, anchor - before + delta));
    list.splice(target, 0, ...block);
  }
  refresh();
}

function wrapSelection() {
  const nodes = selectedNodes().filter(n => n !== doc);
  if (!nodes.length) return;
  let last = null;
  for (const [parent, group] of byParent(nodes)) {
    const list = parent.children;
    const idx = group.map(n => list.indexOf(n)).sort((a, b) => a - b);
    const at = idx[0];
    const grp = makeNode('group');
    // the join belongs to whatever comes first, which is now the group
    if (group[0].sameline) { grp.sameline = true; delete group[0].sameline; }
    for (let k = idx.length - 1; k >= 0; k--) list.splice(idx[k], 1);
    grp.children.push(...group);
    list.splice(at, 0, grp);
    last = grp;
  }
  if (last) selectId(last.id);
}

function unwrapSelection() {
  const nodes = selectedNodes().filter(n => n !== doc && isContainer(n));
  if (!nodes.length) return;
  let first = null;
  for (const node of nodes) {
    const parent = findParent(node.id);
    if (!parent) continue;
    const idx = parent.children.indexOf(node);
    const kids = node.children || [];
    // the container may be carrying a join that wrapSelection moved onto it
    if (node.sameline && kids[0]) kids[0].sameline = true;
    parent.children.splice(idx, 1, ...kids);
    if (!first) first = kids[0] || parent;
  }
  selectId(first ? first.id : null);
}

function toggleJoin() {
  const node = selectedId && findNode(selectedId);
  if (!node || node === doc) return;
  if (node.sameline) delete node.sameline;
  else node.sameline = true;
  refresh();
}

function duplicateSelection() {
  const nodes = selectedNodes().filter(n => n !== doc);
  if (!nodes.length) return;
  const added = [];
  for (const node of nodes) {
    const parent = findParent(node.id);
    const copy = cloneWithNewIds(node);
    insertAt(copy, {
      parentId: parent.id,
      index: parent.children.indexOf(node) + 1,
      sameline: !!node.sameline,
    });
    added.push(copy.id);
  }
  selectMany(added);
}

function duplicateTo(id, drop) {
  const node = findNode(id);
  if (!node) return;
  const copy = cloneWithNewIds(node);
  insertAt(copy, drop);
  selectId(copy.id);
}

function deleteSelection() {
  const nodes = selectedNodes().filter(n => n !== doc);
  if (!nodes.length) return;
  const first = nodes[0];
  const parent = findParent(first.id);
  const i = parent ? parent.children.indexOf(first) : 0;
  for (const n of nodes) detach(n.id);
  clearSelection();
  const next = parent && (parent.children[i] || parent.children[i - 1]);
  selectId(next ? next.id : (parent && parent !== doc ? parent.id : null));
}

// ---------- clipboard and repeat ----------

let clipboardNode = null;
let lastInsertType = null;

function copySelection() {
  const nodes = selectedNodes().filter(n => n !== doc);
  if (!nodes.length) return false;
  clipboardNode = JSON.stringify(nodes);
  return true;
}

function cutSelection() {
  if (copySelection()) deleteSelection();
}

function pasteClipboard() {
  if (!clipboardNode) return;
  let payload = JSON.parse(clipboardNode);
  if (!Array.isArray(payload)) payload = [payload];   // pre-multiselect clipboards
  const drop = dropAfterSelection();
  const added = [];
  payload.forEach((raw, i) => {
    const node = cloneWithNewIds(raw);
    const d = { ...drop, index: drop.index + i };
    // a joined widget stays joined through cut/copy+paste, matching Ctrl+D
    if (node.sameline) d.sameline = true;
    insertAt(node, d);
    added.push(node.id);
  });
  selectMany(added);
}

// Stamping repeats want siblings: with dropAfterSelection, inserting a
// container then stamping again would nest each insert inside the previous.
function dropSiblingAfterSelection() {
  const node = selectedId && selectedId !== 'root' ? findNode(selectedId) : null;
  if (!node) { const r = navRoot(); return { parentId: r.id, index: r.children.length }; }
  const parent = findParent(node.id);
  return { parentId: parent.id, index: parent.children.indexOf(node) + 1 };
}

function repeatInsert() {
  if (lastInsertType) insertNodeAt(lastInsertType, dropSiblingAfterSelection());
}

function saveLocal() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, nextId, doc })); } catch (e) {}
  // the active project holds the same document, so it has to move in step
  if (typeof saveProjects === 'function' && activeProject) saveProjects();
}

function computeNextId() {
  let m = 100;
  walk(doc, n => {
    const num = parseInt(String(n.id).replace(/^n/, ''), 10);
    if (!isNaN(num) && num >= m) m = num + 1;
  });
  return m;
}

// Imported documents are untrusted. Beyond type-checking, an enum has to be
// checked against its option list: a stray `dir` reaches IM_ASSERT(0) inside
// ImGui and an out-of-range `n` would emit something like InputInt5.
function coerce(t, raw, def, opts) {
  // preserved source, never truncated
  if (t === 'longtext') return typeof raw === 'string' ? raw.slice(0, 20000) : def;
  if (t === 'text' || t === 'items') return typeof raw === 'string' ? raw.slice(0, 200) : def;
  // a C++ expression, kept as typed
  if (t === 'expr') return typeof raw === 'string' ? raw.slice(0, 200) : def;
  // a unit is a short label like cm or ms, not free text
  if (t === 'unit') return typeof raw === 'string' ? raw.slice(0, 12) : def;
  if (t === 'bool') return raw === true;
  const num = Number(raw);
  if (t === 'enum') {
    const allowed = (opts || []).map(o => Number(Array.isArray(o) ? o[1] : o));
    return allowed.includes(num) ? num : def;
  }
  if (!Number.isFinite(num)) return def;
  return t === 'int' ? Math.trunc(num) : num;
}

// Keep only the slots this widget type actually reads, as four finite 0..1
// floats. Anything else would push a colour the engine can't map.
function sanitizeColors(type, raw) {
  if (!raw || typeof raw !== 'object') return null;
  const allowed = colorSlots(type);
  const out = {};
  for (const [slot, v] of Object.entries(raw)) {
    if (!allowed.includes(slot) || !Array.isArray(v)) continue;
    out[slot] = [0, 1, 2, 3].map(i => {
      const x = Number(v[i]);
      return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : (i === 3 ? 1 : 0);
    });
  }
  return Object.keys(out).length ? out : null;
}

function sanitize(list, ids, atRoot) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const n of list) {
    if (!n || typeof n !== 'object' || typeof n.type !== 'string') continue;
    const spec = WIDGETS[n.type];
    // a window is only meaningful at the root; anywhere else it is dropped
    if (!spec || n.type === 'root') continue;
    if (n.type === 'window' && !atRoot) continue;
    if (n.type !== 'window' && atRoot) continue;
    const c = { type: n.type };
    // keep looking until the id really is free, or a document full of
    // duplicates would just get more duplicates
    let cid = typeof n.id === 'string' && n.id ? n.id : '';
    if (!cid || ids.has(cid)) { do { cid = 'n' + (nextId++); } while (ids.has(cid)); }
    c.id = cid;
    ids.add(cid);
    for (const [k, t, d, opts] of spec.props || []) c[k] = coerce(t, n[k], d, opts);
    if (n.sameline === true) c.sameline = true;
    const cols = sanitizeColors(n.type, n.colors);
    if (cols) c.colors = cols;
    if (spec.container) c.children = sanitize(n.children, ids, false);
    out.push(c);
  }
  return out;
}

// Highest id in the raw payload, so freshly minted ids can't collide with one
// that appears later in the same document.
function maxRawId(list, cur) {
  if (!Array.isArray(list)) return cur;
  for (const n of list) {
    if (!n || typeof n !== 'object') continue;
    const num = parseInt(String(n.id ?? '').replace(/^n/, ''), 10);
    if (!isNaN(num) && num >= cur) cur = num + 1;
    cur = maxRawId(n.children, cur);
  }
  return cur;
}

// Replaces the working document in place so existing references stay valid.
// Accepts either shape: a bare window (everything saved before multiple
// windows existed) or a root holding windows.
function asRootData(d) {
  if (!d || typeof d !== 'object') return { type: 'root', children: [] };
  if (d.type === 'root') return d;
  return { type: 'root', children: [d], pre: d.pre, post: d.post };
}

function applyDocData(raw, savedNextId) {
  const d = asRootData(raw);
  nextId = Math.max(savedNextId || 0, 100, maxRawId(d.children, 100));
  const ids = new Set(['root']);
  doc.children = sanitize(d.children, ids, true);
  // code the user wrote around the windows lives on the root
  delete doc.colors;
  // hand-written C++ around the window survives save/load like any other content
  delete doc.pre; delete doc.post;
  if (typeof d.pre === 'string' && d.pre.trim()) doc.pre = d.pre;
  if (typeof d.post === 'string' && d.post.trim()) doc.post = d.post;
  // a whole new document re-asserts its window size, even onto a window the
  // user had dragged to some other size
  if (engineReady) Module.ccall('engine_reset_window_size', null, [], []);
  clearSelection();
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s || !s.doc || (s.doc.type !== 'root' && s.doc.type !== 'window')) return false;
    applyDocData(s.doc, s.nextId);
    return true;
  } catch (e) { return false; }
}

// ---------- projects ----------
// Several documents, each with its own undo stack, switched by the tab strip.
// The active one is still mirrored to SAVE_KEY so an older build (and the
// self-test's reload check) keeps finding what it expects.

const PROJECTS_KEY = 'imguistudio.projects.v1';
let projects = [];       // { id, name, doc, nextId }
let activeProject = null;
let projectSeq = 1;

function newProjectId() { return 'p' + (projectSeq++) + '-' + projects.length; }

function snapshotActive() {
  const p = projects.find(x => x.id === activeProject);
  if (!p) return;
  p.doc = JSON.parse(JSON.stringify(doc));
  p.nextId = nextId;
}

function saveProjects() {
  snapshotActive();
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify({ v: 1, projects, activeProject, projectSeq }));
  } catch (e) {}
}

function loadProjects() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(PROJECTS_KEY) || 'null'); } catch (e) {}
  if (s && Array.isArray(s.projects) && s.projects.length) {
    projects = s.projects.filter(p => p && p.doc && (p.doc.type === 'root' || p.doc.type === 'window'));
    projectSeq = s.projectSeq || projects.length + 1;
    activeProject = projects.some(p => p.id === s.activeProject) ? s.activeProject : projects[0].id;
  }
  if (!projects.length) {
    // first run, or an upgrade from the single-document build: adopt whatever
    // was saved rather than throwing the user's work away
    const had = loadLocal();
    projects = [{
      id: newProjectId(),
      name: 'Untitled',
      doc: JSON.parse(JSON.stringify(doc)),
      nextId,
    }];
    activeProject = projects[0].id;
  }
  const active = projects.find(p => p.id === activeProject);
  applyDocData(active.doc, active.nextId);
}

function switchProject(id) {
  if (id === activeProject) return;
  snapshotActive();
  const p = projects.find(x => x.id === id);
  if (!p) return;
  activeProject = id;
  applyDocData(p.doc, p.nextId);
  resetHistory();
  resetPan();
  refresh();
  renderProjectTabs();
}

function addProject(name, docData) {
  snapshotActive();
  const p = {
    id: newProjectId(),
    name: name || 'Untitled ' + (projects.length + 1),
    doc: docData ? JSON.parse(JSON.stringify(docData)) : JSON.parse(JSON.stringify(DEFAULT_DOC)),
    nextId: 100,
  };
  projects.push(p);
  activeProject = p.id;
  applyDocData(p.doc, p.nextId);
  resetHistory();
  refresh();
  renderProjectTabs();
  return p;
}

function closeProject(id) {
  const i = projects.findIndex(p => p.id === id);
  if (i < 0) return;
  const go = () => {
    projects.splice(i, 1);
    if (!projects.length) {
      projects.push({ id: newProjectId(), name: 'Untitled', doc: JSON.parse(JSON.stringify(DEFAULT_DOC)), nextId: 100 });
    }
    if (activeProject === id) {
      activeProject = projects[Math.min(i, projects.length - 1)].id;
      const p = projects.find(x => x.id === activeProject);
      applyDocData(p.doc, p.nextId);
      resetHistory();
      refresh();
    }
    saveProjects();
    renderProjectTabs();
  };
  const p = projects[i];
  const n = countNodes(p.doc.children);
  if (n > 0) askConfirm(`Close "${p.name}"? Its ${n} widget${n > 1 ? 's' : ''} will be gone.`, go);
  else go();
}

const projTabsEl = document.getElementById('projtabs');

function renderProjectTabs() {
  projTabsEl.innerHTML = '';
  for (const p of projects) {
    const t = document.createElement('div');
    t.className = 'ptab' + (p.id === activeProject ? ' on' : '');
    const n = document.createElement('span');
    n.className = 'pname';
    n.textContent = p.name;
    n.title = 'Click to open, double-click to rename';
    t.appendChild(n);
    const x = document.createElement('button');
    x.textContent = '✕';
    x.title = 'Close this project';
    x.onclick = e => { e.stopPropagation(); closeProject(p.id); };
    t.appendChild(x);
    t.onclick = () => switchProject(p.id);
    n.ondblclick = e => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.className = 'prename';
      input.value = p.name;
      const commit = () => {
        p.name = input.value.trim() || p.name;
        saveProjects();
        renderProjectTabs();
      };
      input.onblur = commit;
      input.onkeydown = ev => {
        ev.stopPropagation();
        if (ev.key === 'Enter') commit();
        if (ev.key === 'Escape') renderProjectTabs();
      };
      t.replaceChild(input, n);
      input.focus();
      input.select();
    };
    projTabsEl.appendChild(t);
  }
  const add = document.createElement('button');
  add.className = 'padd';
  add.textContent = '+';
  add.title = 'New project';
  add.onclick = () => { addProject(); saveProjects(); };
  projTabsEl.appendChild(add);
}

