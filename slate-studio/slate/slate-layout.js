// A JavaScript model of Slate's layout.
//
// READ THIS BEFORE TRUSTING A NUMBER OUT OF IT. This is a model of Slate, not
// Slate. docs/research/SLATE.md section 7 explains why: Slate cannot be compiled
// to WebAssembly for a preview without roughly twelve person-months of work and a
// contested licensing question, so unlike ImGuiStudio's canvas, this one is a
// reimplementation and it will drift. The two places it drifts first are text
// metrics, because Slate measures through FreeType and HarfBuzz while a browser
// measures through its own rasterizer, and style-set constants, because Slate
// widgets have no intrinsic sizes and take their padding from FStarshipCoreStyle.
//
// The algorithms below follow Engine/Source/Runtime/SlateCore/Public/Layout/
// LayoutUtils.h and SBoxPanel.cpp as read for UE 5.4. Two passes, and only two:
// ComputeDesiredSize runs bottom-up and caches, then ArrangeChildren runs
// top-down. Arranging without having measured first is the bug that makes
// SUniformGridPanel divide by zero in the real engine, so the API here refuses to
// let you do it: arrange() calls desiredSize() itself.

const SLATE_MIN_ROW = 4;

function slateSlot(node) {
  const s = node.slot || {};
  return {
    size: s.size || 'auto',
    weight: s.weight == null ? 1 : s.weight,
    hAlign: s.hAlign || 'Fill',
    vAlign: s.vAlign || 'Fill',
    padding: s.padding || [0, 0, 0, 0],
  };
}

// LayoutUtils.h ArrangeChild. `align` is one of Fill | Left/Top | Center |
// Right/Bottom. On Fill the child is stretched to the allotted span minus
// padding; otherwise it keeps its desired size and the padding biases where it
// lands. The Center case is not a plain centring: Slate adds half the difference
// of the two paddings, so asymmetric padding shifts a centred child.
function slateAlignChild(allotted, childDesired, padLead, padTrail, align) {
  if (align === 'Fill') {
    return { off: padLead, size: Math.max(0, allotted - (padLead + padTrail)) };
  }
  const size = childDesired;
  if (align === 'Left' || align === 'Top') return { off: padLead, size };
  if (align === 'Right' || align === 'Bottom') return { off: allotted - size - padTrail, size };
  return { off: (allotted - size) / 2 + (padLead - padTrail) / 2, size };
}

// Bottom-up. `m` supplies text metrics: m.measure(text, fontSize) -> {w, h}.
function slateDesiredSize(node, m) {
  const spec = SLATE_WIDGETS[node.type];
  if (!spec) return { w: 0, h: 0 };
  const p = node.props || {};
  let d;

  if (spec.container) {
    const kids = (node.children || []).map(c => ({ c, d: slateDesiredSize(c, m), s: slateSlot(c) }));

    if (spec.slotted && spec.axis === 'y') {
      // SBoxPanel sums EVERY child's desired size along the axis, fill children
      // included, and takes the max across the other axis. A fill child still
      // contributes its desired height to the panel's desired height.
      let h = 0, w = 0;
      for (const k of kids) {
        h += k.d.h + k.s.padding[1] + k.s.padding[3];
        w = Math.max(w, k.d.w + k.s.padding[0] + k.s.padding[2]);
      }
      d = { w, h };
    } else if (spec.slotted && spec.axis === 'x') {
      let h = 0, w = 0;
      for (const k of kids) {
        w += k.d.w + k.s.padding[0] + k.s.padding[2];
        h = Math.max(h, k.d.h + k.s.padding[1] + k.s.padding[3]);
      }
      d = { w, h };
    } else if (spec.slotted && spec.axis === 'z') {
      // SOverlay takes the componentwise max of each slot's desired size plus its
      // padding, and hands every slot the whole panel.
      let w = 0, h = 0;
      for (const k of kids) {
        w = Math.max(w, k.d.w + k.s.padding[0] + k.s.padding[2]);
        h = Math.max(h, k.d.h + k.s.padding[1] + k.s.padding[3]);
      }
      d = { w, h };
    } else if (node.type === 'border') {
      const k = kids[0];
      const pad = [p.padL, p.padT, p.padR, p.padB];
      d = k
        ? { w: k.d.w + pad[0] + pad[2], h: k.d.h + pad[1] + pad[3] }
        : { w: pad[0] + pad[2], h: pad[1] + pad[3] };
    } else if (node.type === 'box') {
      const k = kids[0];
      d = k ? { w: k.d.w, h: k.d.h } : { w: 0, h: 0 };
      // SBox::ComputeDesiredSize returns the override when set, and otherwise
      // clamps the child's size with Min/MaxDesired*. The override ignores the
      // box's own padding while the Min/Max clamps apply after it.
      if (p.minDesiredWidth >= 0) d.w = Math.max(d.w, p.minDesiredWidth);
      if (p.minDesiredHeight >= 0) d.h = Math.max(d.h, p.minDesiredHeight);
      if (p.widthOverride >= 0) d.w = p.widthOverride;
      if (p.heightOverride >= 0) d.h = p.heightOverride;
    } else {
      d = { w: 0, h: 0 };
    }
  } else if (node.type === 'textblock') {
    const t = m.measure(p.text || '', p.fontSize || 10);
    d = { w: Math.max(t.w, p.minDesiredWidth || 0), h: t.h };
  } else if (node.type === 'button') {
    const t = m.measure(p.text || '', 10);
    // ContentPadding on both sides, plus the border the style draws.
    d = { w: t.w + p.padX * 2 + 4, h: Math.max(t.h + p.padY * 2 + 4, 22) };
  } else if (node.type === 'checkbox') {
    const t = m.measure(p.label || '', 10);
    d = { w: t.w + 22, h: Math.max(t.h, 16) };
  } else if (node.type === 'editabletextbox') {
    const t = m.measure(p.text || p.hintText || '', 10);
    d = { w: Math.max(t.w + 12, p.minDesiredWidth || 0), h: Math.max(t.h + 10, 22) };
  } else if (node.type === 'separator') {
    d = p.orientation === 'Vertical'
      ? { w: p.thickness, h: 0 }
      : { w: 0, h: p.thickness };
  } else if (node.type === 'progressbar') {
    d = { w: 0, h: 16 };
  } else if (node.type === 'hyperlink') {
    const t = m.measure(p.text || '', 10);
    d = { w: t.w, h: t.h + 2 };
  } else if (node.type === 'searchbox') {
    const t = m.measure(p.text || p.hintText || '', 10);
    d = { w: Math.max(t.w + 26, 120), h: Math.max(t.h + 10, 22) };
  } else if (node.type === 'slider') {
    // SSlider has no intrinsic length: it fills whatever it is given along its
    // orientation and is a fixed thickness across it.
    d = { w: 0, h: 16 };
  } else if (node.type === 'spinbox' || node.type === 'numericentrybox') {
    const t = m.measure(String(p.value), 10);
    d = { w: Math.max(t.w + 24, 56), h: Math.max(t.h + 8, 22) };
  } else if (node.type === 'image') {
    // DesiredSizeOverride is what the generator emits, so the model reads the
    // same two numbers rather than inventing a brush size.
    d = { w: p.sizeX, h: p.sizeY };
  } else if (node.type === 'throbber') {
    d = { w: p.pieces * 16, h: 16 };
  } else if (node.type === 'circularthrobber') {
    d = { w: p.radius * 2, h: p.radius * 2 };
  } else if (node.type === 'spacer') {
    d = { w: p.sizeX, h: p.sizeY };
  } else {
    d = { w: 0, h: 0 };
  }

  node._desired = d;
  return d;
}

// Top-down. Pushes { node, x, y, w, h, depth } into `out` in paint order.
function slateArrange(node, rect, m, out, depth) {
  depth = depth || 0;
  if (!node._desired) slateDesiredSize(node, m);
  out.push({ node, x: rect.x, y: rect.y, w: rect.w, h: rect.h, depth });

  const spec = SLATE_WIDGETS[node.type];
  if (!spec || !spec.container) return out;
  const kids = node.children || [];
  if (!kids.length) return out;

  if (spec.slotted && (spec.axis === 'y' || spec.axis === 'x')) {
    const vertical = spec.axis === 'y';
    const allotted = vertical ? rect.h : rect.w;

    // Pass one: how much space is already spoken for, and how many fill units
    // are competing for what is left. Padding is consumed by every child
    // regardless of its size rule.
    let fixed = 0, stretchTotal = 0;
    for (const c of kids) {
      const s = slateSlot(c);
      const padAlong = vertical ? s.padding[1] + s.padding[3] : s.padding[0] + s.padding[2];
      fixed += padAlong;
      if (s.size === 'fill') stretchTotal += s.weight;
      else fixed += vertical ? c._desired.h : c._desired.w;
    }
    const remaining = Math.max(0, allotted - fixed);

    // Pass two: walk in order, giving each fill child its share.
    let cursor = 0;
    for (const c of kids) {
      const s = slateSlot(c);
      const padLeadAlong = vertical ? s.padding[1] : s.padding[0];
      const padTrailAlong = vertical ? s.padding[3] : s.padding[2];
      const along = s.size === 'fill'
        ? (stretchTotal > 0 ? remaining * (s.weight / stretchTotal) : 0)
        : (vertical ? c._desired.h : c._desired.w);

      // The cross axis is a plain AlignChild against the panel's full extent.
      const cross = vertical
        ? slateAlignChild(rect.w, c._desired.w, s.padding[0], s.padding[2], s.hAlign)
        : slateAlignChild(rect.h, c._desired.h, s.padding[1], s.padding[3], s.vAlign);

      const childRect = vertical
        ? { x: rect.x + cross.off, y: rect.y + cursor + padLeadAlong, w: cross.size, h: along }
        : { x: rect.x + cursor + padLeadAlong, y: rect.y + cross.off, w: along, h: cross.size };

      slateArrange(c, childRect, m, out, depth + 1);
      cursor += along + padLeadAlong + padTrailAlong;
    }
    return out;
  }

  if (spec.slotted && spec.axis === 'z') {
    // Every overlay slot gets the whole panel on both axes. ZOrder is
    // materialized by keeping the children array sorted, so paint order is just
    // array order and a stable sort is enough.
    for (const c of kids) {
      const s = slateSlot(c);
      const h = slateAlignChild(rect.w, c._desired.w, s.padding[0], s.padding[2], s.hAlign);
      const v = slateAlignChild(rect.h, c._desired.h, s.padding[1], s.padding[3], s.vAlign);
      slateArrange(c, { x: rect.x + h.off, y: rect.y + v.off, w: h.size, h: v.size }, m, out, depth + 1);
    }
    return out;
  }

  // Single-child panels. SBorder deflates by its own Padding first; SBox does
  // not have a padding property in this subset, so it passes the rect straight
  // through. Both then align the child inside what is left.
  const c = kids[0];
  const s = slateSlot(c);
  let inner = rect;
  if (node.type === 'border') {
    const p = node.props;
    inner = {
      x: rect.x + p.padL, y: rect.y + p.padT,
      w: Math.max(0, rect.w - p.padL - p.padR),
      h: Math.max(0, rect.h - p.padT - p.padB),
    };
  }
  const h = slateAlignChild(inner.w, c._desired.w, s.padding[0], s.padding[2], s.hAlign);
  const v = slateAlignChild(inner.h, c._desired.h, s.padding[1], s.padding[3], s.vAlign);
  slateArrange(c, { x: inner.x + h.off, y: inner.y + v.off, w: h.size, h: v.size }, m, out, depth + 1);
  return out;
}

// Convenience: measure then arrange against a window rect.
function slateLayout(root, rect, m) {
  slateDesiredSize(root, m);
  return slateArrange(root, rect, m, [], 0);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { slateAlignChild, slateDesiredSize, slateArrange, slateLayout, slateSlot, SLATE_MIN_ROW };
}
