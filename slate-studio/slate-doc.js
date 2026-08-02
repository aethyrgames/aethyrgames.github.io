// The document: the node tree and the verbs that change it.
//
// Deliberately DOM-free. Everything here is a pure function over a plain tree,
// so the structural rules are unit-testable without a browser and the canvas
// shell is left with nothing but wiring. This is the seam app/doc.js has in the
// ImGui tool, and the recon in docs/research/SLATE.md found that layer to be the
// most reusable thing in the whole codebase, so it is worth keeping separate
// here from the start rather than discovering it later.

let slateIdSeq = 1;
function slateResetIds(n) { slateIdSeq = n || 1; }

function slateMake(type, props, slot, children) {
  const spec = SLATE_WIDGETS[type];
  if (!spec) throw new Error(`unknown widget type: ${type}`);
  const p = {};
  for (const entry of spec.props || []) p[entry[0]] = entry[2];
  Object.assign(p, props || {});
  return {
    id: slateIdSeq++,
    type,
    props: p,
    slot: Object.assign({}, SLATE_SLOT_DEFAULTS, { padding: [0, 0, 0, 0] }, slot || {}),
    children: children || [],
  };
}

function slateIsContainer(node) {
  const spec = SLATE_WIDGETS[node.type];
  return !!(spec && spec.container);
}

// Single-child panels hold exactly one child. SBorder and SBox say so with
// `single`, and a designer dropping a second child into one would silently lose
// it at emit time, since the generator only reads kids[0].
function slateCanAccept(node) {
  const spec = SLATE_WIDGETS[node.type];
  if (!spec || !spec.container) return false;
  if (spec.single) return (node.children || []).length < 1;
  return true;
}

function slateFindParent(root, node, parent) {
  if (root === node) return parent || null;
  for (const c of root.children || []) {
    const hit = slateFindParent(c, node, root);
    if (hit !== undefined && hit !== null) return hit;
    if (c === node) return root;
  }
  return null;
}

function slateWalk(root, fn, depth, parent) {
  fn(root, depth || 0, parent || null);
  for (const c of root.children || []) slateWalk(c, fn, (depth || 0) + 1, root);
}

function slateFindById(root, id) {
  let hit = null;
  slateWalk(root, n => { if (n.id === id) hit = n; });
  return hit;
}

// Where a newly added widget should land, given what is selected. Into the
// selection when it can hold children, otherwise beside it, and into the root
// when nothing is selected. Returns null when there is nowhere legal, which the
// caller reports rather than silently dropping the widget.
function slateInsertionPoint(root, selected) {
  if (selected && slateCanAccept(selected)) return { parent: selected, index: (selected.children || []).length };
  if (selected) {
    const parent = slateFindParent(root, selected);
    if (parent && slateCanAccept(parent)) {
      return { parent, index: (parent.children || []).indexOf(selected) + 1 };
    }
    // A full single-child panel is a dead end, but its own parent may not be.
    if (parent) {
      const grand = slateFindParent(root, parent);
      if (grand && slateCanAccept(grand)) {
        return { parent: grand, index: (grand.children || []).indexOf(parent) + 1 };
      }
    }
    return null;
  }
  if (slateCanAccept(root)) return { parent: root, index: (root.children || []).length };
  const first = (root.children || []).find(slateCanAccept);
  return first ? { parent: first, index: (first.children || []).length } : null;
}

function slateAdd(root, selected, type) {
  const at = slateInsertionPoint(root, selected);
  if (!at) return null;
  const node = slateMake(type);
  // A widget dropped into a stack is far more often meant to hug its content
  // than to fight its siblings for the leftover space, and an auto slot is the
  // one whose result a designer can predict.
  at.parent.children.splice(at.index, 0, node);
  return node;
}

// Returns what should be selected afterwards: the next sibling, else the
// previous, else the parent. Deleting and being left with nothing selected is
// the kind of small rudeness that makes a tool tiring.
function slateRemove(root, node) {
  if (node === root) return null;
  const parent = slateFindParent(root, node);
  if (!parent) return null;
  const kids = parent.children;
  const i = kids.indexOf(node);
  if (i < 0) return null;
  kids.splice(i, 1);
  return kids[i] || kids[i - 1] || parent;
}

// Reorder within the parent. Returns true when something moved, so the caller
// can skip a redraw it does not need.
function slateMove(root, node, delta) {
  const parent = slateFindParent(root, node);
  if (!parent) return false;
  const kids = parent.children;
  const i = kids.indexOf(node);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= kids.length) return false;
  kids.splice(i, 1);
  kids.splice(j, 0, node);
  return true;
}

// Wrap a node in a new container, which is how a designer turns one widget into
// a row without rebuilding the tree by hand.
function slateWrap(root, node, type) {
  const spec = SLATE_WIDGETS[type];
  if (!spec || !spec.container) return null;
  const parent = slateFindParent(root, node);
  if (!parent) return null;
  const kids = parent.children;
  const i = kids.indexOf(node);
  if (i < 0) return null;
  const box = slateMake(type);
  // The wrapper inherits the slot the child occupied, and the child resets to a
  // plain one. Otherwise wrapping silently changes the layout.
  box.slot = node.slot;
  node.slot = Object.assign({}, SLATE_SLOT_DEFAULTS, { padding: [0, 0, 0, 0] });
  box.children.push(node);
  kids.splice(i, 1, box);
  return box;
}

function slateCount(root) {
  let n = 0;
  slateWalk(root, () => n++);
  return n;
}

// A small starting document that exercises the rules a generator has to get
// right: auto against fill on one axis, alignment on the other, per-slot
// padding, nesting, and a bound delegate that has to produce a member function.
function slateDemoDoc() {
  slateResetIds(1);
  const field = (label, hint) => slateMake('horizontalbox', {}, { size: 'auto', padding: [0, 0, 0, 6] }, [
    slateMake('textblock', { text: label }, { size: 'auto', vAlign: 'Center', padding: [0, 0, 8, 0] }),
    slateMake('editabletextbox', { hintText: hint }, { size: 'fill', weight: 1 }),
  ]);
  return slateMake('border', {}, {}, [
    slateMake('verticalbox', {}, { padding: [8, 8, 8, 8] }, [
      slateMake('textblock', { text: 'Account Settings', fontSize: 14 }, { size: 'auto', padding: [0, 0, 0, 6] }),
      slateMake('separator', {}, { size: 'auto', padding: [0, 0, 0, 8] }),
      field('Name', 'Your name'),
      field('Email', 'you@example.com'),
      slateMake('checkbox', { label: 'Remember me on this device', checked: true },
        { size: 'auto', padding: [0, 2, 0, 2] }),
      // A fill slot with nothing in it is how the buttons get pushed to the
      // bottom, and it is the clearest proof the fill rule works: resize the
      // window and this is the only thing that changes height.
      slateMake('spacer', { sizeX: 0, sizeY: 0 }, { size: 'fill', weight: 1 }),
      slateMake('horizontalbox', {}, { size: 'auto', hAlign: 'Right' }, [
        slateMake('button', { text: 'Cancel' }, { size: 'auto', padding: [0, 0, 8, 0] }),
        slateMake('button', { text: 'Save', handler: 'HandleSaveClicked' }, { size: 'auto' }),
      ]),
    ]),
  ]);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    slateMake, slateResetIds, slateIsContainer, slateCanAccept, slateFindParent,
    slateFindById, slateWalk, slateInsertionPoint, slateAdd, slateRemove,
    slateMove, slateWrap, slateCount, slateDemoDoc,
  };
}
