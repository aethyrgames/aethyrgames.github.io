// C++ -> document parser, the reverse of the generator in index.html.
//
// Two design choices carry the whole thing:
//
// 1. The argument schema is DERIVED FROM THE EMITTER by differential probing:
//    generate a widget's call, then regenerate it with one property changed and
//    see which argument moved. That attributes arguments to properties without
//    anyone writing the mapping twice, and unlike matching sentinel values it
//    survives clamping, conditional arguments and value formatting. Add a
//    property to a spec and the parser learns it for free.
//
// 2. Anything not recognised is preserved verbatim as a `rawcode` node rather
//    than dropped, so arbitrary C++ survives a round trip.
//
// The property that matters is stability: parse(generate(d)) must generate
// byte-identical code, for every widget type, repeatedly. The self-test asserts
// exactly that over several applies, because a single pass hides growth bugs.

// ---------- lexing helpers ----------

const litNum = v => {
  const x = parseFloat(String(v).replace(/[fFuUlL]+$/, ''));
  return Number.isFinite(x) ? x : 0;
};

const litStr = v => String(v).slice(1, -1).replace(/\\(.)/g, (_, c) =>
  ({ n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"' }[c] ?? c));

// takes "(a, b, c) ..." and returns "a, b, c"
function balancedArgs(s) {
  if (s[0] !== '(') return null;
  let d = 0, inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '(') d++;
    else if (c === ')') { d--; if (!d) return s.slice(1, i); }
  }
  return null;
}

function splitTopLevel(s) {
  const out = [];
  let d = 0, start = 0, inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) d--;
    else if (c === ',' && d === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  const last = s.slice(start).trim();
  if (last || out.length) out.push(last);
  return out;
}

function matchBrace(src, open, to) {
  let d = 0, inStr = false;
  for (let i = open; i < to; i++) {
    const c = src[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') d++;
    else if (c === '}') { d--; if (!d) return i; }
  }
  return -1;
}

function statementEnd(src, i, to) {
  let d = 0, inStr = false;
  for (let j = i; j < to; j++) {
    const c = src[j];
    if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') d++;
    else if (c === '}') { d--; if (d <= 0) return j + 1; }
    else if (c === ';' && d === 0) return j + 1;
  }
  return to;
}

// Non-braced containers are emitted as a bare Begin/End statement pair rather
// than an if-block, so their extent has to be found by counting nested pairs.
const PAIRED = { group: ['BeginGroup', 'EndGroup'], child: ['BeginChild', 'EndChild'] };

function findPairEnd(src, from, to, beginFn, endFn) {
  const re = new RegExp('ImGui::(' + beginFn + '|' + endFn + ')\\s*\\(', 'g');
  re.lastIndex = from;
  let depth = 0, m;
  while ((m = re.exec(src)) && m.index < to) {
    if (m[1] === beginFn) depth++;
    else if (--depth === 0) return { callStart: m.index, end: statementEnd(src, m.index, to) };
  }
  return null;
}

// ---------- schema, derived from the emitter ----------

const LBL = '@@label@@';

function emitLine(spec, node, idStr, preferBegin) {
  let res;
  try { res = spec.code(node, 'STATE', idStr); } catch (e) { return null; }
  const lines = Array.isArray(res) ? res : (res.open || []);
  // A popup emits its trigger Button before BeginPopup; keying the schema on
  // the first ImGui:: call would collide with the real Button widget and the
  // whole popup would degrade to raw code.
  if (preferBegin) {
    const b = lines.find(l => /ImGui::(Begin\w+|TreeNode|CollapsingHeader)\s*\(/.test(l));
    if (b) return b;
  }
  return lines.find(l => /ImGui::\w+\s*\(/.test(l)) || null;
}

function callOf(line) {
  const m = line && line.match(/ImGui::(\w+)\s*\(/);
  if (!m) return null;
  const args = balancedArgs(line.slice(line.indexOf(m[0]) + m[0].length - 1));
  return args === null ? null : { fn: m[1], args: splitTopLevel(args) };
}

// A value guaranteed to render differently from the current one.
function perturb(t, cur, opts) {
  if (t === 'expr') return 'probeExpr';
  if (t === 'text' || t === 'items' || t === 'longtext' || t === 'unit') return '@@probe@@';
  if (t === 'enum') {
    const vals = (opts || []).map(o => Number(Array.isArray(o) ? o[1] : o));
    return vals.find(v => v !== Number(cur)) ?? Number(cur) + 1;
  }
  if (t === 'bool') return !cur;
  return (Number(cur) || 0) + 37;
}

function buildSchema(WIDGETS, makeNode) {
  const byFn = {};
  for (const [type, spec] of Object.entries(WIDGETS)) {
    if (spec.hidden || !spec.code) continue;
    const hasN = (spec.props || []).some(p => p[0] === 'n');
    for (const nv of hasN ? [1, 2, 3, 4] : [null]) {
      const base = makeNode(type);
      if (nv !== null) base.n = nv;
      // Some arguments are only emitted when a property is non-default (a
      // Button's ImVec2 size, for one). Seed the baseline with distinct
      // in-range numbers so those arguments exist to be attributed, and so two
      // properties sharing one nested argument stay distinguishable.
      const SEEDS = [3, 5, 7, 11, 13, 17, 19, 23];
      let si = 0;
      for (const [k, t] of spec.props || []) {
        if (k !== 'n' && (t === 'int' || t === 'float')) base[k] = SEEDS[si++ % SEEDS.length];
      }
      const baseId = '"' + LBL + '"';
      const baseLine = emitLine(spec, base, baseId, !!spec.container);
      const baseCall = callOf(baseLine);
      if (!baseCall) continue;

      const args = baseCall.args.map(() => null);
      for (const [k, t, , opts] of spec.props || []) {
        if (k === 'n') continue;
        const alt = { ...base, [k]: perturb(t, base[k], opts) };
        // Most widgets receive their label through the pre-quoted id argument
        // rather than from the node, so probing the label has to move both or
        // the label argument never differs and stays unmapped.
        const altId = k === 'label' ? '"@@probe@@"' : baseId;
        const altCall = callOf(emitLine(spec, alt, altId, !!spec.container));
        if (!altCall || altCall.fn !== baseCall.fn) continue;
        for (let i = 0; i < args.length; i++) {
          if (i >= altCall.args.length || altCall.args[i] === baseCall.args[i]) continue;
          // the whole argument changed; if it's a nested call, find which part
          args[i] = refine(args[i], baseCall.args[i], altCall.args[i], k);
        }
      }
      // Some properties never reach the call at all and live only in the state
      // struct's initializer (a progress bar's fraction, for one). Find that
      // property the same differential way, ignoring any already mapped to an
      // argument so a slider's min stays attributed to the call.
      let fieldProp = null;
      if (spec.field) {
        const fieldOf = node => {
          const d = spec.field(node, 'STATE');
          return Array.isArray(d) ? d.join('|') : String(d);
        };
        const baseField = fieldOf(base);
        const mapped = new Set(args.flatMap(a =>
          !a ? [] : a.parts ? a.parts.filter(Boolean).map(p => p.key) : [a.key]));
        for (const [k, t, , opts] of spec.props || []) {
          if (k === 'n' || mapped.has(k)) continue;
          if (fieldOf({ ...base, [k]: perturb(t, base[k], opts) }) !== baseField) {
            fieldProp = k;
            break;
          }
        }
      }
      if (!byFn[baseCall.fn]) {
        // argc is how many arguments the generator itself writes. A call with a
        // different count is hand-written in some other shape, and the alias
        // table knows how to read those.
        byFn[baseCall.fn] = {
          type, n: nv, args, container: !!spec.container, fieldProp,
          argc: baseCall.args.length,
        };
      }
    }
  }
  return byFn;
}

// Attribute a property to a whole argument, or to one component of a nested
// call like ImVec2(w, h) that carries two properties at once.
function refine(existing, a, b, key) {
  const ca = a.match(/^\w+\s*\(/);
  if (ca) {
    const ia = balancedArgs(a.slice(ca[0].length - 1));
    const ib = b.startsWith(a.slice(0, ca[0].length))
      ? balancedArgs(b.slice(ca[0].length - 1)) : null;
    if (ia !== null && ib !== null) {
      const pa = splitTopLevel(ia), pb = splitTopLevel(ib);
      const parts = (existing && existing.parts) || pa.map(() => null);
      for (let j = 0; j < pa.length; j++) if (pa[j] !== pb[j]) parts[j] = { key };
      return { parts };
    }
  }
  return { key };
}

// ---------- parser ----------

function createParser(WIDGETS, makeNode, colorSlots) {
  const schema = buildSchema(WIDGETS, makeNode);
  parseCpp.schema = schema;
  return parseCpp;

  function parseCpp(src, nextId) {
    const errors = [];
    let idc = nextId;
    const newId = () => 'n' + (idc++);

    // The state struct carries values that never appear in a call, so read its
    // initializers first and key them by member name.
    const fields = {};
    const structStart = src.indexOf('struct ');
    const structEnd = structStart >= 0 ? src.indexOf('};', structStart) : -1;
    if (structEnd > 0) {
      const body = src.slice(structStart, structEnd);
      const re = /^\s*\w[\w:]*\s+(\w+)\s*(?:\[[^\]]*\])?\s*=\s*([^;]+);/gm;
      let m;
      while ((m = re.exec(body))) fields[m[1]] = m[2].trim();
    }

    let windowLabel = null;
    let windowColors = null;
    let pre = '';
    let post = '';
    const bodyStart = src.indexOf('ImGui::Begin(');
    const bodyEnd = src.lastIndexOf('ImGui::End()');
    if (bodyStart >= 0 && bodyEnd > bodyStart) {
      const call = balancedArgs(src.slice(bodyStart + 'ImGui::Begin'.length));
      const first = call === null ? null : splitTopLevel(call)[0];
      if (first && first.trim().startsWith('"')) windowLabel = litStr(first.trim());

      // Whatever the generator owns here is re-derived from the document on the
      // way back out. Anything else is the user's and has to survive, or every
      // Apply would quietly delete the code around the window.
      const head = splitHead(src.slice(0, bodyStart), colorSlots);
      windowColors = head.colors;
      pre = head.rest;
      const afterEnd = src.indexOf(';', bodyEnd) + 1;
      post = splitTail(src.slice(afterEnd));

      src = src.slice(src.indexOf(';', bodyStart) + 1, bodyEnd);
    } else {
      errors.push({ level: 'warn', msg: 'No ImGui::Begin/End pair found; parsing the whole text as a body.' });
    }

    const children = parse(src, 0, src.length, errors, newId, schema, colorSlots, WIDGETS, makeNode, fields);
    return { children, windowLabel, windowColors, pre, post, errors, nextId: idc };
  }
}

// Drop the shared leading whitespace so re-emitting at a new indent can't make
// the block creep further right on every Apply. Relative indent is preserved.
function dedent(text) {
  const lines = text.replace(/\s+$/, '').split('\n');
  // Removing the generator's own lines leaves blank ones behind. Dropping them
  // matters for stability, not tidiness: otherwise each Apply adds another.
  while (lines.length && !lines[0].trim()) lines.shift();
  let min = Infinity;
  for (const l of lines) {
    if (!l.trim()) continue;
    min = Math.min(min, l.match(/^[ \t]*/)[0].length);
  }
  if (!isFinite(min) || min === 0) return lines.join('\n');
  return lines.map(l => (l.trim() ? l.slice(min) : '')).join('\n');
}

// Everything the generator writes ahead of ImGui::Begin. Removing exactly these
// leaves the user's own prologue, and hands back the window's colour pushes.
function splitHead(text, colorSlots) {
  const colors = {};
  // Everything through the draw function's opening brace is the generator's own
  // header. Anchoring on the function skips the state struct wholesale, which a
  // regex can't do safely: a field initialised to `{ 1.0f, 1.0f }` ends in `};`
  // too, so a non-greedy match stops inside the struct and spills it into `pre`.
  let rest = text;
  const fn = /\bvoid\s+\w+\s*\([^)]*\)\s*\r?\n?\s*\{/g;
  let m, last = null;
  while ((m = fn.exec(text))) last = m;
  if (last) {
    rest = text.slice(last.index + last[0].length);
  } else {
    rest = text
      .replace(/^\s*\/\/ Generated by ImGuiStudio[^\n]*\n?/, '')
      .replace(/^struct\s+\w+\s*\r?\n\{[\s\S]*?\r?\n\};\s*/m, '');
  }
  rest = rest
    .replace(/^[ \t]*ImGuiWindowFlags\s+flags\s*=[^;]*;[ \t]*\r?\n?/m, '')
    .replace(/^[ \t]*ImGui::SetNextWindowSize\s*\([^;]*\)\s*;[ \t]*\r?\n?/m, '');
  rest = rest.replace(/^[ \t]*ImGui::PushStyleColor\s*\(\s*ImGuiCol_(\w+)\s*,\s*ImVec4\s*\(([^)]*)\)\s*\)\s*;[ \t]*\n?/gm,
    (whole, slot, nums) => {
      if (!colorSlots('window').includes(slot)) return whole;   // not ours; keep it
      const v = nums.split(',').map(s => Number(s.trim().replace(/f$/, '')));
      colors[slot] = [v[0] || 0, v[1] || 0, v[2] || 0, v[3] === undefined ? 1 : v[3]];
      return '';
    });
  return { colors: Object.keys(colors).length ? colors : null, rest: dedent(rest) };
}

// The mirror image after ImGui::End(): the window's colour pop and the draw
// function's closing brace belong to the generator.
function splitTail(text) {
  const rest = text
    .replace(/^[ \t]*ImGui::PopStyleColor\s*\([^;]*\)\s*;[ \t]*\n?/m, '')
    .replace(/\}\s*$/, '');
  return dedent(rest);
}

function parse(src, from, to, errors, newId, schema, colorSlots, WIDGETS, makeNode, fields) {
  const out = [];
  let i = from;
  let pendingSameLine = false;
  let pendingColors = null;
  let pendingItems = null;
  let pendingItemWidth = null;   // SetNextItemWidth applies to the next widget
  let popsDue = 0;        // colour pops the widget just attached will account for

  const colAt = pos => pos - (src.lastIndexOf('\n', pos - 1) + 1);

  // The generator re-indents every line of a raw block by the block's own depth,
  // so that much has to come back off here or the code creeps right on each
  // Apply. The first line already starts at the statement, hence the skip.
  const raw = (text, col) => {
    const lines = text.replace(/\s+$/, '').split('\n');
    const body = col > 0
      ? lines.map((l, n) => (n === 0 ? l : l.replace(new RegExp('^[ \\t]{0,' + col + '}'), '')))
      : lines;
    const t = body.join('\n');
    if (t.trim()) out.push({ type: 'rawcode', id: newId(), label: '', code: t });
  };

  // Colour pushes only belong to a widget when they look exactly like the ones
  // the generator writes: every slot valid for that widget, and a matching pop
  // straight after. Anything else is the user's and is kept verbatim.
  const flushColors = () => {
    if (!pendingColors) return;
    raw(pendingColors.src);
    pendingColors = null;
  };

  const attach = node => {
    if (pendingSameLine) { node.sameline = true; pendingSameLine = false; }
    // SetNextItemWidth is a statement of its own, so it can't be probed as an
    // argument; it attaches to whatever widget comes next, like SameLine does.
    if (pendingItemWidth !== null) {
      if ((WIDGETS[node.type].props || []).some(p => p[0] === 'itemw')) {
        node.itemw = pendingItemWidth;
      }
      pendingItemWidth = null;
    }
    if (pendingItems && (node.type === 'combo' || node.type === 'listbox')) {
      node.items = pendingItems;
    }
    pendingItems = null;
    if (pendingColors) {
      const slots = Object.keys(pendingColors.map);
      const mine = slots.every(k => colorSlots(node.type).includes(k));
      if (mine) {
        node.colors = pendingColors.map;
        popsDue = slots.length;
        pendingColors = null;
      } else {
        flushColors();
      }
    }
    out.push(node);
  };

  while (i < to) {
    while (i < to && /\s/.test(src[i])) i++;
    if (i >= to) break;
    const start = i;
    const rest = src.slice(i, to);
    // a widget's own pop is the very next statement, so the debt lasts exactly
    // one iteration
    const dueNow = popsDue;
    popsDue = 0;

    const com = rest.match(/^\/\/[^\n]*|^\/\*[\s\S]*?\*\//);
    if (com) {
      if (!/TODO:/.test(com[0])) { flushColors(); raw(com[0], colAt(i)); }
      i += com[0].length;
      continue;
    }

    const siw = rest.match(/^ImGui::SetNextItemWidth\s*\(/);
    if (siw) {
      const a = balancedArgs(rest.slice(siw[0].length - 1));
      const semiAt = src.indexOf(';', i) + 1 || to;
      if (a !== null) pendingItemWidth = litNum(a.trim());
      else { flushColors(); raw(src.slice(i, semiAt), colAt(i)); }
      i = semiAt;
      continue;
    }

    if (/^ImGui::SameLine\s*\(\s*\)\s*;/.test(rest)) {
      pendingSameLine = true;
      i = src.indexOf(';', i) + 1;
      continue;
    }

    // Structural calls the generator re-emits from the tree; keeping them would
    // duplicate on every apply.
    if (/^ImGui::(TableNextColumn|TableNextRow)\s*\(\s*\)\s*;/.test(rest)) {
      i = src.indexOf(';', i) + 1;
      continue;
    }

    // The item array a Combo/ListBox is generated with, carried to the next one.
    const itemsDecl = rest.match(/^static\s+const\s+char\*\s*\w+\s*\[\s*\]\s*=\s*\{/);
    if (itemsDecl) {
      const close = src.indexOf('}', i);
      const semi = src.indexOf(';', close < 0 ? i : close);
      if (close > 0) {
        pendingItems = splitTopLevel(src.slice(i + itemsDecl[0].length, close))
          .filter(s => s.startsWith('"')).map(litStr).join(', ');
      }
      i = semi >= 0 ? semi + 1 : to;
      continue;
    }

    const push = rest.match(/^ImGui::PushStyleColor\s*\(/);
    if (push) {
      const semiAt = src.indexOf(';', i) + 1 || to;
      const a = balancedArgs(rest.slice(push[0].length - 1));
      let read = false;
      if (a !== null) {
        const p = splitTopLevel(a);
        const slot = (p[0] || '').trim().replace(/^ImGuiCol_/, '');
        const vecIn = (p[1] || '');
        const vec = balancedArgs(vecIn.slice(vecIn.indexOf('(')));
        // only a literal ImVec4 is a value we can round-trip; a variable or a
        // helper call has to stay as written
        if (slot && vec !== null && /^\s*ImVec4\s*\(/.test(vecIn.trim())) {
          const nums = splitTopLevel(vec).map(litNum);
          if (nums.every(n => Number.isFinite(n))) {
            pendingColors = pendingColors || { map: {}, src: '', col: colAt(i) };
            pendingColors.map[slot] = [nums[0] || 0, nums[1] || 0, nums[2] || 0,
              nums[3] === undefined ? 1 : nums[3]];
            pendingColors.src += (pendingColors.src ? '\n' : '') + src.slice(i, semiAt).trim();
            read = true;
          }
        }
      }
      if (!read) { flushColors(); raw(src.slice(i, semiAt), colAt(i)); }
      i = semiAt;
      continue;
    }
    const pop = rest.match(/^ImGui::PopStyleColor\s*\(/);
    if (pop) {
      const semiAt = src.indexOf(';', i) + 1 || to;
      const a = balancedArgs(rest.slice(pop[0].length - 1));
      const n = a === null || !a.trim() ? 1 : Number(a.trim());
      // swallow only the pop that closes colours we just folded into a widget
      if (!(dueNow > 0 && n === dueNow)) { flushColors(); raw(src.slice(i, semiAt), colAt(i)); }
      i = semiAt;
      continue;
    }

    // A popup's trigger button; the popup container that follows owns it.
    const trigger = rest.match(/^if\s*\(\s*ImGui::Button\s*\(\s*"Open [^"]*"\s*\)\s*\)\s*\n?\s*ImGui::OpenPopup\s*\([^;]*\)\s*;/);
    if (trigger) { i += trigger[0].length; continue; }

    // Bare Begin/End pair: Group and Child region.
    const bare = rest.match(/^ImGui::(BeginGroup|BeginChild)\s*\(/);
    if (bare) {
      const type = bare[1] === 'BeginGroup' ? 'group' : 'child';
      const [bFn, eFn] = PAIRED[type];
      const pair = findPairEnd(src, i, to, bFn, eFn);
      const argsText = balancedArgs(rest.slice(bare[0].length - 1));
      if (pair && argsText !== null) {
        const entry = schema[bare[1]];
        const node = entry
          ? nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields)
          : Object.assign(makeNode(type), { id: newId() });
        const bodyFrom = src.indexOf(';', i + bare[0].length + argsText.length) + 1;
        node.children = parse(src, bodyFrom, pair.callStart, errors, newId, schema,
          colorSlots, WIDGETS, makeNode, fields);
        attach(node);
        i = pair.end;
        continue;
      }
    }

    // if (ImGui::Xxx(...)) { ... }
    const ifm = rest.match(/^if\s*\(\s*ImGui::(\w+)\s*\(/);
    if (ifm) {
      const fn = ifm[1];
      const callStart = i + rest.indexOf('ImGui::' + fn) + ('ImGui::' + fn).length;
      const argsText = balancedArgs(src.slice(callStart, to));
      const afterCall = argsText === null ? -1 : callStart + argsText.length + 2;
      // the brace must belong to THIS if: only whitespace may sit between them,
      // otherwise a braceless if would swallow the next block wholesale
      const gap = afterCall < 0 ? '' : src.slice(afterCall, src.indexOf('{', afterCall) + 1);
      const ownsBrace = afterCall >= 0 && /^\s*\)?\s*\{$/.test(gap);
      const braceOpen = ownsBrace ? src.indexOf('{', afterCall) : -1;
      const braceEnd = braceOpen >= 0 ? matchBrace(src, braceOpen, to) : -1;
      const entry = schema[fn];
      if (entry && braceEnd > 0) {
        const body = src.slice(braceOpen + 1, braceEnd);
        if (entry.container) {
          const node = nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields);
          const inner = stripTrailingPop(body, fn);
          node.children = parse(inner, 0, inner.length, errors, newId, schema,
            colorSlots, WIDGETS, makeNode, fields);
          attach(node);
          i = braceEnd + 1;
          continue;
        }
        if (/^\s*(\/\/[^\n]*|\/\*[\s\S]*?\*\/)?\s*$/.test(body)) {
          attach(nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields));
          i = braceEnd + 1;
          continue;
        }
      }
      if (braceEnd > 0) {
        flushColors();
        raw(src.slice(start, braceEnd + 1), colAt(start));
        i = braceEnd + 1;
        continue;
      }
    }

    const call = rest.match(/^ImGui::(\w+)\s*\(/);
    if (call) {
      const fn = call[1];
      const argsText = balancedArgs(rest.slice(call[0].length - 1));
      const entry = argsText !== null ? schema[fn] : null;
      // A call the generator knows, written the way the generator writes it.
      if (entry && !entry.container && splitTopLevel(argsText).length === entry.argc) {
        attach(nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields));
        const semi = src.indexOf(';', i + call[0].length + argsText.length);
        i = semi >= 0 ? semi + 1 : to;
        continue;
      }
      // Otherwise it's hand-written: a different arity, or a function the
      // generator never emits at all. ImGui::Text("hi") lands here.
      if (argsText !== null && (!entry || !entry.container)) {
        const aliased = nodeFromAlias(fn, argsText, newId, WIDGETS, makeNode);
        if (aliased) {
          attach(aliased);
          const semi = src.indexOf(';', i + call[0].length + argsText.length);
          i = semi >= 0 ? semi + 1 : to;
          continue;
        }
        // known function, unusual arity, no alias: still better as the widget
        if (entry && !entry.container) {
          attach(nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields));
          const semi = src.indexOf(';', i + call[0].length + argsText.length);
          i = semi >= 0 ? semi + 1 : to;
          continue;
        }
      }
    }

    const end = statementEnd(src, i, to);
    flushColors();
    raw(src.slice(i, end), colAt(i));
    i = end;
  }
  flushColors();   // pushes with nothing after them are still the user's code
  return out;
}

// Hand-written ImGui differs from what the generator emits. The generator picks
// one spelling per widget (TextUnformatted for text, and "%s" formatting for
// the rest), so a perfectly ordinary ImGui::Text("hi") matched nothing and fell
// through to a raw-code placeholder. These are the equivalents worth reading
// back: `label` is which argument carries the visible string.
const CALL_ALIASES = {
  Text:          { type: 'text',           label: 0 },
  TextV:         { type: 'text',           label: 0 },
  TextWrapped:   { type: 'textwrapped',    label: 0 },
  TextDisabled:  { type: 'textdisabled',   label: 0 },
  TextColored:   { type: 'textcolored',    label: 1 },
  BulletText:    { type: 'bullettext',     label: 0 },
  LabelText:     { type: 'labeltext',      label: 0, second: 1 },
  SeparatorText: { type: 'separatortext',  label: 0 },
  Button:        { type: 'button',         label: 0 },
  SmallButton:   { type: 'smallbutton',    label: 0 },
  Checkbox:      { type: 'checkbox',       label: 0 },
  RadioButton:   { type: 'radiobutton',    label: 0 },
  Selectable:    { type: 'selectable',     label: 0 },
  MenuItem:      { type: 'menuitem',       label: 0 },
  InputText:     { type: 'inputtext',      label: 0 },
  InputInt:      { type: 'inputint',       label: 0 },
  InputFloat:    { type: 'inputfloat',     label: 0 },
  InputDouble:   { type: 'inputdouble',    label: 0 },
  SliderFloat:   { type: 'sliderfloat',    label: 0 },
  SliderInt:     { type: 'sliderint',      label: 0 },
  SliderAngle:   { type: 'sliderangle',    label: 0 },
  DragFloat:     { type: 'dragfloat',      label: 0 },
  DragInt:       { type: 'dragint',        label: 0 },
  ColorEdit3:    { type: 'coloredit',      label: 0 },
  ColorEdit4:    { type: 'coloredit',      label: 0 },
  ColorPicker3:  { type: 'colorpicker',    label: 0 },
  ColorPicker4:  { type: 'colorpicker',    label: 0 },
  ProgressBar:   { type: 'progressbar',    label: null },
  Bullet:        { type: 'bullet',         label: null },
  Spacing:       { type: 'spacing',        label: null },
  NewLine:       { type: 'newline',        label: null },
  Separator:     { type: 'separator',      label: null },
  Indent:        { type: 'indent',         label: null },
  Unindent:      { type: 'unindent',       label: null },
  AlignTextToFramePadding: { type: 'aligntext', label: null },
};

// Build a node from a hand-written call. Only a plain string literal is taken
// as the label: a format string with real arguments in it isn't something the
// document can represent, so that stays raw code.
function nodeFromAlias(fn, argsText, newId, WIDGETS, makeNode) {
  const alias = CALL_ALIASES[fn];
  if (!alias || !WIDGETS[alias.type]) return null;
  const node = makeNode(alias.type);
  node.id = newId();
  if (alias.label === null) return node;
  const args = splitTopLevel(argsText);
  const raw = (args[alias.label] || '').trim();
  if (!raw.startsWith('"')) return null;
  const text = litStr(raw);
  // a format string with substitutions can't round-trip as a plain label
  if (/%[-+ #0-9.]*[a-zA-Z]/.test(text) && args.length > alias.label + 1) return null;
  const spec = WIDGETS[alias.type];
  if ((spec.props || []).some(p => p[0] === 'label')) node.label = text;
  if (alias.second !== undefined) {
    const v = (args[alias.second] || '').trim();
    const valueProp = (spec.props || []).find(p => p[0] === 'value' || p[0] === 'text');
    if (valueProp && v.startsWith('"')) node[valueProp[0]] = litStr(v);
  }
  return node;
}

// Remove only the container's OWN closing call, at the end of its body. A
// global strip would delete matching calls out of hand-written code too.
const POP_OF = {
  TreeNode: 'TreePop', BeginTabBar: 'EndTabBar', BeginTabItem: 'EndTabItem',
  BeginTable: 'EndTable', BeginMenu: 'EndMenu', BeginMenuBar: 'EndMenuBar',
  BeginPopup: 'EndPopup', BeginPopupModal: 'EndPopup', BeginItemTooltip: 'EndTooltip',
};

function stripTrailingPop(body, fn) {
  const pop = POP_OF[fn];
  let out = body;
  // The pop comes last, so it has to go first: removing the modal's Close
  // block while EndPopup still trails it would never match, and the block
  // would be re-parsed as a widget and duplicated on every apply.
  if (pop) out = out.replace(new RegExp('ImGui::' + pop + '\\s*\\(\\s*\\)\\s*;?\\s*$'), '');
  if (fn === 'BeginPopupModal') {
    out = out.replace(/if\s*\(\s*ImGui::Button\s*\(\s*"Close"\s*\)\s*\)\s*\n?\s*ImGui::CloseCurrentPopup\s*\(\s*\)\s*;?\s*$/, '');
  }
  return out;
}

// Undo only the suffixes the generator itself appends for uniqueness: "##<n>"
// from duplicate-label dedup, and "###popup.."/"###btn.." from popup ids. A
// user's own "##" stays, since it is legitimate ImGui label syntax.
function stripGeneratedSuffix(s) {
  return s.replace(/###(popup|btn)\w*$/, '').replace(/##\d+$/, '');
}

function nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields) {
  const node = makeNode(entry.type);
  node.id = newId();
  if (entry.n !== null && entry.n !== undefined) node.n = entry.n;
  const spec = WIDGETS[entry.type];
  const propDefs = Object.fromEntries((spec.props || []).map(p => [p[0], p]));
  const given = splitTopLevel(argsText);

  const apply = (slot, rawArg) => {
    if (!slot || rawArg === undefined) return;
    const v = String(rawArg).trim();
    if (slot.parts) {
      const c = v.match(/^\w+\s*\(/);
      if (!c) return;
      const inner = balancedArgs(v.slice(c[0].length - 1));
      if (inner === null) return;
      const sub = splitTopLevel(inner);
      slot.parts.forEach((s, j) => apply(s, sub[j]));
      return;
    }
    const def = slot.key === 'label' ? ['label', 'text'] : propDefs[slot.key];
    if (!def) return;
    const t = def[1];
    // a raw C++ expression: whatever was written, kept as written
    if (t === 'expr') { node[slot.key] = v; return; }
    if (t === 'unit') {
      // the argument is a printf format the unit was appended to, so the unit
      // is whatever follows the conversion spec
      if (!v.startsWith('"')) return;
      const m = /^%[-+ #0-9.]*[a-zA-Z]\s*(.*)$/.exec(litStr(v));
      node[slot.key] = m ? m[1].trim() : '';
      return;
    }
    if (t === 'text' || t === 'items' || t === 'longtext') {
      if (v.startsWith('"')) {
        node[slot.key] = slot.key === 'label' ? stripGeneratedSuffix(litStr(v)) : litStr(v);
      }
    } else if (t === 'enum' && !/^[-+0-9.]/.test(v)) {
      // e.g. ImGuiDir_Right -> the option whose name matches
      const name = v.replace(/^\w+_/, '');
      const hit = (def[3] || []).find(o => Array.isArray(o) && o[0] === name);
      if (hit) node[slot.key] = hit[1];
    } else if (/^[-+0-9.]/.test(v)) {
      node[slot.key] = litNum(v);
    }
  };

  entry.args.forEach((slot, idx) => apply(slot, given[idx]));

  // A property that only exists in the struct initializer, recovered via the
  // state member the call references.
  if (entry.fieldProp && fields) {
    const ref = given.find(a => /state\.\w+/.test(a));
    const m = ref && ref.match(/state\.(\w+)/);
    const init = m && fields[m[1]];
    if (init !== undefined && /^[-+0-9.]/.test(init)) node[entry.fieldProp] = litNum(init);
  }

  // Radio groups live only in the backing variable name, never in an argument.
  if (entry.type === 'radiobutton') {
    const ref = given.find(a => /&state\./.test(a));
    const m = ref && ref.match(/&state\.(\w+)/);
    if (m) node.group = m[1];
  }
  return node;
}
