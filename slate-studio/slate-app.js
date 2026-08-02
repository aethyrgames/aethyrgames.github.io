// The prototype shell: a canvas that draws the arranged tree, an inspector that
// edits the slot rules, and a code pane regenerated on every change.
//
// The point of the demo document is not that it is pretty. It is that it
// exercises the things a Slate generator has to get right and an ImGui one never
// meets: auto versus fill along an axis, alignment on the cross axis, per-slot
// padding, nested boxes, a bound delegate that has to produce a member function,
// and LOCTEXT key allocation.

let slateDoc, slateSelected = null, slateWin = { w: 380, h: 300 };
let slateCv, slateCtx, slatePane = 'cpp', slateRects = [];
let slateStatus = '';

// The document and its verbs live in slate-doc.js, which is DOM-free so the
// structural rules can be unit tested. This file is the shell around them.

// Text metrics come from the canvas. This is the single largest source of drift
// from real Slate, which measures through FreeType and HarfBuzz.
function slateMeasurer(ctx) {
  const cache = Object.create(null);
  return {
    measure(text, size) {
      const key = size + ' ' + text;
      let hit = cache[key];
      if (!hit) {
        ctx.font = size + 'px "Segoe UI", system-ui, sans-serif';
        hit = cache[key] = { w: Math.ceil(ctx.measureText(text).width), h: Math.ceil(size * 1.35) };
      }
      return hit;
    },
  };
}

const SLATE_FILL = {
  border: '#2f333a', button: '#3d4552', editabletextbox: '#1b1d20',
  separator: '#4a5058', progressbar: '#2f333a', searchbox: '#1b1d20',
  spinbox: '#1b1d20', numericentrybox: '#1b1d20', slider: '#454b54',
  image: '#39404a', throbber: '#39404a', circularthrobber: '#39404a',
};

function slateDraw() {
  const dpr = window.devicePixelRatio || 1;
  const host = document.getElementById('stage');
  const w = host.clientWidth, h = host.clientHeight;
  slateCv.width = Math.round(w * dpr); slateCv.height = Math.round(h * dpr);
  const g = slateCtx;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);

  const originX = Math.round((w - slateWin.w) / 2);
  const originY = Math.round((h - slateWin.h) / 2);
  const m = slateMeasurer(g);
  slateRects = slateLayout(slateDoc, { x: originX, y: originY, w: slateWin.w, h: slateWin.h }, m);

  // Window chrome, so the fill rules have something visibly bounded to fill.
  g.fillStyle = '#15171a';
  g.fillRect(originX, originY - 26, slateWin.w, slateWin.h + 26);
  g.fillStyle = '#0f1113';
  g.fillRect(originX, originY - 26, slateWin.w, 26);
  g.fillStyle = '#8b9199';
  g.font = '12px "Segoe UI", system-ui, sans-serif';
  g.textBaseline = 'middle';
  g.fillText('SWindow', originX + 10, originY - 13);

  for (const r of slateRects) {
    const spec = SLATE_WIDGETS[r.node.type];
    const fill = SLATE_FILL[r.node.type];
    if (fill) { g.fillStyle = fill; g.fillRect(r.x, r.y, r.w, r.h); }

    if (r.node.type === 'editabletextbox' || r.node.type === 'button') {
      g.strokeStyle = r.node.type === 'button' ? '#535d6d' : '#454b54';
      g.lineWidth = 1;
      g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    }
    if (spec.container && !fill) {
      // Containers draw as a faint dashed hint so the structure stays legible.
      g.save();
      g.strokeStyle = 'rgba(124,183,255,.16)';
      g.setLineDash([3, 3]); g.lineWidth = 1;
      g.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      g.restore();
    }

    const p = r.node.props;
    g.textBaseline = 'middle';
    if (r.node.type === 'textblock') {
      g.fillStyle = '#d6d9de';
      g.font = p.fontSize + 'px "Segoe UI", system-ui, sans-serif';
      const centred = p.justification === 'Center';
      const right = p.justification === 'Right';
      g.textAlign = centred ? 'center' : right ? 'right' : 'left';
      g.fillText(p.text, centred ? r.x + r.w / 2 : right ? r.x + r.w : r.x, r.y + r.h / 2);
      g.textAlign = 'left';
    } else if (r.node.type === 'button') {
      g.fillStyle = '#e3e6ea';
      g.font = '10px "Segoe UI", system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(p.text, r.x + r.w / 2, r.y + r.h / 2);
      g.textAlign = 'left';
    } else if (r.node.type === 'checkbox') {
      g.strokeStyle = '#767d88'; g.lineWidth = 1;
      g.strokeRect(r.x + 0.5, r.y + r.h / 2 - 6.5, 13, 13);
      if (p.checked) {
        g.strokeStyle = '#7cb7ff'; g.lineWidth = 2; g.beginPath();
        g.moveTo(r.x + 3, r.y + r.h / 2); g.lineTo(r.x + 6, r.y + r.h / 2 + 3.5);
        g.lineTo(r.x + 11, r.y + r.h / 2 - 4); g.stroke();
      }
      g.fillStyle = '#d6d9de'; g.font = '10px "Segoe UI", system-ui, sans-serif';
      g.fillText(p.label, r.x + 22, r.y + r.h / 2);
    } else if (r.node.type === 'editabletextbox') {
      g.fillStyle = p.text ? '#d6d9de' : '#6b7280';
      g.font = '10px "Segoe UI", system-ui, sans-serif';
      g.fillText(p.text || p.hintText, r.x + 6, r.y + r.h / 2);
    }
  }

  if (slateSelected) {
    const r = slateRects.find(x => x.node === slateSelected);
    if (r) {
      g.strokeStyle = '#ffb454'; g.lineWidth = 1.5;
      g.strokeRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1);

      // The badge used to be drawn unconditionally above the rect, where it sat
      // on top of whatever widget happened to be there. Give it an opaque chip so
      // it is legible over content, and flip it inside the selection when there
      // is no room above, which is the common case for a row near the top.
      const label = SLATE_WIDGETS[r.node.type].cls + '  '
        + Math.round(r.w) + 'x' + Math.round(r.h);
      g.font = '10px ui-monospace, monospace';
      const tw = Math.ceil(g.measureText(label).width);
      const above = r.y - originY >= 14;
      const bx = Math.min(r.x, originX + slateWin.w - tw - 6);
      const by = above ? r.y - 14 : r.y + 1;
      g.fillStyle = '#ffb454';
      g.fillRect(bx, by, tw + 6, 13);
      g.fillStyle = '#1e1f22';
      g.textBaseline = 'middle';
      g.fillText(label, bx + 3, by + 7);
    }
  }

  // The resize grip.
  g.fillStyle = '#7cb7ff';
  g.fillRect(originX + slateWin.w - 10, originY + slateWin.h - 10, 10, 10);

  document.getElementById('wsize').textContent = slateWin.w + 'x' + slateWin.h;
  document.getElementById('wcount').textContent = String(slateRects.length);
  slateCv._origin = { x: originX, y: originY };
}

// One pass with a single alternation, so a keyword inside a string or a comment
// is never re-marked. Doing this as successive replace() calls is how a
// highlighter ends up emitting tags inside its own tags.
const SLATE_HL = new RegExp([
  /(\/\/[^\n]*)/,                                        // 1 comment
  /("(?:[^"\\]|\\.)*")/,                                 // 2 string
  /\b(SNew|SLATE_BEGIN_ARGS|SLATE_END_ARGS|LOCTEXT_NAMESPACE|LOCTEXT|FMargin|FReply|FText|FSlateColor|FLinearColor|FVector2D|ChildSlot|Construct|FArguments|FAppStyle|FCoreStyle|ECheckBoxState|ETextJustify|HAlign_\w+|VAlign_\w+|Orient_\w+|S[A-Z]\w+)\b/,
  /\b(class|public|private|void|const|return|new|string|include|pragma|define|undef)\b/,
  /\b(\d+\.?\d*f?)\b/,                                   // 5 number
].map(r => r.source).join('|'), 'g');

function slateEsc(s) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function slateHighlight(src) {
  let out = '', last = 0, m;
  SLATE_HL.lastIndex = 0;
  while ((m = SLATE_HL.exec(src)) !== null) {
    out += slateEsc(src.slice(last, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 't' : m[4] ? 'k' : 'n';
    out += '<span class="' + cls + '">' + slateEsc(m[0]) + '</span>';
    last = m.index + m[0].length;
  }
  return out + slateEsc(src.slice(last));
}

function slateRefreshCode() {
  const gen = slateGenerate(slateDoc, 'SGeneratedPanel');
  const src = slatePane === 'cpp' ? gen.cpp : slatePane === 'header' ? gen.header : slateBuildCs();
  document.getElementById('code').innerHTML = slateHighlight(src);
  return gen;
}

function slateHit(px, py) {
  // Deepest rect containing the point wins, which matches how a designer expects
  // clicking to work: the leaf, not the panel that happens to enclose it.
  let best = null;
  for (const r of slateRects) {
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
      if (!best || r.depth >= best.depth) best = r;
    }
  }
  return best ? best.node : null;
}

function slateRow(label, control) {
  return '<div class="row"><label>' + label + '</label>' + control + '</div>';
}

function slateSeg(name, values, current) {
  return '<div class="seg">' + values.map(v =>
    '<button data-act="' + name + '" data-v="' + v + '" aria-pressed="'
    + (v === current) + '">' + v + '</button>').join('') + '</div>';
}

function slateRenderInspector() {
  const el = document.getElementById('inspector');
  if (!slateSelected) {
    el.innerHTML = '<h2>Inspector</h2><div style="color:#6b7280;font-size:12px">'
      + 'Click a widget on the canvas.</div>';
    return;
  }
  const n = slateSelected, spec = SLATE_WIDGETS[n.type], s = n.slot;
  let h = '<h2>Inspector &mdash; <b>' + spec.cls + '</b></h2>';

  const textProp = (spec.props || []).find(p => p[1] === 'text');
  if (textProp) {
    h += slateRow(textProp[0], '<input type="text" data-act="prop" data-k="' + textProp[0]
      + '" value="' + String(n.props[textProp[0]]).replace(/"/g, '&quot;') + '">');
  }
  if (n.type === 'checkbox') {
    h += slateRow('checked', slateSeg('checked', ['false', 'true'], String(n.props.checked)));
  }

  if (n !== slateDoc) {
    h += slateRow('size rule', slateSeg('size', ['auto', 'fill'], s.size));
    if (s.size === 'fill') {
      h += slateRow('weight', '<input type="number" step="0.5" min="0" data-act="weight" value="'
        + s.weight + '">');
    }
    h += slateRow('HAlign', slateSeg('hAlign', ['Fill', 'Left', 'Center', 'Right'], s.hAlign));
    h += slateRow('VAlign', slateSeg('vAlign', ['Fill', 'Top', 'Center', 'Bottom'], s.vAlign));
    h += slateRow('padding', '<div class="pad">'
      + s.padding.map((v, i) => '<input type="number" data-act="pad" data-i="' + i
        + '" value="' + v + '">').join('') + '</div>');
  }
  el.innerHTML = h;
}

// ---- palette and hierarchy -------------------------------------------------

function slateRenderPalette() {
  const cats = {};
  for (const [type, spec] of Object.entries(SLATE_WIDGETS)) {
    (cats[spec.cat] = cats[spec.cat] || []).push([type, spec]);
  }
  let h = '';
  for (const cat of Object.keys(cats).sort()) {
    h += `<div class="cat">${cat}</div><div class="chips">`;
    for (const [type, spec] of cats[cat]) {
      h += `<button class="chip" data-add="${type}" title="${spec.cls} &mdash; ${spec.header}">`
        + `${spec.cls.replace(/^S/, '')}</button>`;
    }
    h += '</div>';
  }
  document.getElementById('palette').innerHTML = h;
}

function slateRenderTree() {
  let h = '';
  slateWalk(slateDoc, (n, depth) => {
    const spec = SLATE_WIDGETS[n.type];
    const label = n.props.text || n.props.label || '';
    h += `<div class="node${n === slateSelected ? ' sel' : ''}" data-id="${n.id}"`
      + ` style="padding-left:${4 + depth * 12}px">`
      + `<span class="cls">${spec.cls}</span>`
      + (label ? `<span class="lbl">${slateEsc(String(label)).slice(0, 22)}</span>` : '')
      + `</div>`;
  });
  document.getElementById('tree').innerHTML = h;
}

function slateSay(msg) {
  slateStatus = msg || '';
  const el = document.getElementById('status');
  if (el) el.textContent = slateStatus;
}

function slateDoAdd(type) {
  const node = slateAdd(slateDoc, slateSelected, type);
  if (!node) {
    slateSay(`nowhere to put a ${SLATE_WIDGETS[type].cls} here; select a container`);
    return null;
  }
  slateSelected = node;
  slateSay(`added ${SLATE_WIDGETS[type].cls}`);
  slateApply();
  return node;
}

function slateDoDelete() {
  if (!slateSelected || slateSelected === slateDoc) {
    slateSay('the root cannot be deleted');
    return false;
  }
  const cls = SLATE_WIDGETS[slateSelected.type].cls;
  const next = slateRemove(slateDoc, slateSelected);
  slateSelected = next;
  slateSay(`deleted ${cls}`);
  slateApply();
  return true;
}

function slateDoMove(delta) {
  if (!slateSelected) return false;
  const moved = slateMove(slateDoc, slateSelected, delta);
  slateSay(moved ? `moved ${delta < 0 ? 'up' : 'down'}` : 'already at the end');
  if (moved) slateApply();
  return moved;
}

function slateDoWrap(type) {
  if (!slateSelected || slateSelected === slateDoc) return null;
  const box = slateWrap(slateDoc, slateSelected, type);
  if (box) { slateSelected = box; slateSay(`wrapped in ${SLATE_WIDGETS[type].cls}`); slateApply(); }
  return box;
}

function slateApply() {
  slateDraw();
  slateRefreshCode();
  slateRenderInspector();
  slateRenderTree();
}

function slateBoot() {
  slateCv = document.getElementById('cv');
  slateCtx = slateCv.getContext('2d');
  slateDoc = slateDemoDoc();

  document.querySelectorAll('.tabs button').forEach(b => {
    b.addEventListener('click', () => {
      slatePane = b.dataset.pane;
      document.querySelectorAll('.tabs button').forEach(o =>
        o.setAttribute('aria-selected', String(o === b)));
      slateRefreshCode();
    });
  });

  let dragging = null;
  slateCv.addEventListener('pointerdown', e => {
    const r = slateCv.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const o = slateCv._origin;
    if (px >= o.x + slateWin.w - 12 && py >= o.y + slateWin.h - 12) {
      dragging = { px, py, w: slateWin.w, h: slateWin.h };
      slateCv.setPointerCapture(e.pointerId);
      return;
    }
    slateSelected = slateHit(px, py);
    slateApply();
  });
  slateCv.addEventListener('pointermove', e => {
    if (!dragging) return;
    const r = slateCv.getBoundingClientRect();
    slateWin.w = Math.max(160, Math.round(dragging.w + (e.clientX - r.left - dragging.px) * 2));
    slateWin.h = Math.max(120, Math.round(dragging.h + (e.clientY - r.top - dragging.py) * 2));
    slateApply();
  });
  slateCv.addEventListener('pointerup', () => { dragging = null; });

  const insp = document.getElementById('inspector');
  insp.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b || !slateSelected) return;
    const act = b.dataset.act, v = b.dataset.v;
    if (act === 'checked') slateSelected.props.checked = v === 'true';
    else if (act === 'size') slateSelected.slot.size = v;
    else slateSelected.slot[act] = v;
    slateApply();
  });
  insp.addEventListener('input', e => {
    const t = e.target;
    if (!t.dataset.act || !slateSelected) return;
    if (t.dataset.act === 'pad') slateSelected.slot.padding[+t.dataset.i] = +t.value || 0;
    else if (t.dataset.act === 'weight') slateSelected.slot.weight = +t.value || 0;
    else if (t.dataset.act === 'prop') slateSelected.props[t.dataset.k] = t.value;
    slateDraw(); slateRefreshCode();
  });

  slateRenderPalette();
  document.getElementById('palette').addEventListener('click', e => {
    const b = e.target.closest('button[data-add]');
    if (b) slateDoAdd(b.dataset.add);
  });
  document.getElementById('tree').addEventListener('click', e => {
    const row = e.target.closest('.node');
    if (!row) return;
    slateSelected = slateFindById(slateDoc, Number(row.dataset.id));
    slateApply();
  });
  document.getElementById('verbs').addEventListener('click', e => {
    const b = e.target.closest('button[data-verb]');
    if (!b) return;
    const v = b.dataset.verb;
    if (v === 'delete') slateDoDelete();
    else if (v === 'up') slateDoMove(-1);
    else if (v === 'down') slateDoMove(1);
    else if (v === 'wrapv') slateDoWrap('verticalbox');
    else if (v === 'wraph') slateDoWrap('horizontalbox');
  });

  // Keys stay off the canvas element so they work wherever focus is, but never
  // while a text field has it, or typing a label would delete the widget.
  window.addEventListener('keydown', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); slateDoDelete(); }
    else if (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); slateDoMove(-1); }
    else if (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); slateDoMove(1); }
  });

  window.addEventListener('resize', slateDraw);
  slateApply();

  // The surface the smoke test drives, same idea as app/testhooks.js.
  window.__slate = {
    doc: () => slateDoc,
    rects: () => slateRects.map(r => ({
      type: r.node.type, cls: SLATE_WIDGETS[r.node.type].cls,
      x: r.x, y: r.y, w: r.w, h: r.h, depth: r.depth,
    })),
    generate: () => slateGenerate(slateDoc, 'SGeneratedPanel'),
    // The colour a widget type is supposed to be painted, so a check can assert
    // the fill that landed rather than merely that something is non-transparent.
    fillOf: t => SLATE_FILL[t] || null,
    setWindow: (w, h) => { slateWin.w = w; slateWin.h = h; slateApply(); },
    select: type => {
      const r = slateRects.find(x => x.node.type === type);
      slateSelected = r ? r.node : null; slateApply(); return !!r;
    },
    selected: () => (slateSelected ? SLATE_WIDGETS[slateSelected.type].cls : null),
    count: () => slateCount(slateDoc),
    add: type => !!slateDoAdd(type),
    remove: () => slateDoDelete(),
    move: d => slateDoMove(d),
    wrap: type => !!slateDoWrap(type),
    status: () => slateStatus,
    reset: () => { slateDoc = slateDemoDoc(); slateSelected = null; slateApply(); },
    ready: true,
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', slateBoot);
else slateBoot();
