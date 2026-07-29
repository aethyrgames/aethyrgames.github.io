// C++ -> document parser, the reverse of the generator in index.html.
//
// Two design choices carry the whole thing:
//
// 1. The argument schema is DERIVED FROM THE EMITTER, not written by hand. For
//    each widget type we generate a call with sentinel property values, then
//    look at which argument each sentinel landed in. Add a property to a spec
//    and the parser learns about it for free, which is the drift the research
//    on round-trip tools warns about (57 widgets x 2 hand-written functions is
//    114 places to forget).
//
// 2. Anything not recognised is preserved verbatim as a `rawcode` node rather
//    than dropped. Arbitrary C++ therefore survives a round trip; the parts we
//    understand drive the preview, and the rest is kept byte-for-byte and shown
//    as a placeholder. Nothing the user typed is ever silently lost.

// Must be printable: the generator's string-escaper strips control characters,
// which would silently erase a control-character sentinel and leave the
// argument unmapped for every property emitted through it.
const SENTINEL_TEXT = k => '@@' + k + '@@';
const SENTINEL_NUM_BASE = -970000;

// ---------- lexer ----------

function lex(src) {
  const t = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      const j = src.indexOf('\n', i);
      t.push({ k: 'com', v: src.slice(i, j < 0 ? n : j), i });
      i = j < 0 ? n : j;
    } else if (c === '/' && src[i + 1] === '*') {
      const j = src.indexOf('*/', i + 2);
      t.push({ k: 'com', v: src.slice(i, j < 0 ? n : j + 2), i });
      i = j < 0 ? n : j + 2;
    } else if (c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
      t.push({ k: 'str', v: src.slice(i, j + 1), i });
      i = j + 1;
    } else if (c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== "'") j += src[j] === '\\' ? 2 : 1;
      t.push({ k: 'chr', v: src.slice(i, j + 1), i });
      i = j + 1;
    } else if (/\s/.test(c)) {
      i++;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      t.push({ k: 'id', v: src.slice(i, j), i });
      i = j;
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i;
      while (j < n && /[0-9.eExXa-fA-F+\-]/.test(src[j])) {
        // stop at an exponent-less sign, which belongs to the next token
        if ((src[j] === '+' || src[j] === '-') && !/[eE]/.test(src[j - 1])) break;
        j++;
      }
      while (j < n && /[fFuUlL]/.test(src[j])) j++;
      t.push({ k: 'num', v: src.slice(i, j), i });
      i = j;
    } else {
      t.push({ k: 'p', v: c, i });
      i++;
    }
  }
  t.push({ k: 'eof', v: '', i: n });
  return t;
}

const litNum = v => {
  const x = parseFloat(String(v).replace(/[fFuUlL]+$/, ''));
  return Number.isFinite(x) ? x : 0;
};

const litStr = v => {
  const body = String(v).slice(1, -1);
  return body.replace(/\\(.)/g, (_, c) =>
    ({ n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"' }[c] ?? c));
};

// ---------- schema derived from the emitter ----------

// fn name (e.g. "SliderFloat2") -> { type, n, args: [{key}|null] }
function buildSchema(WIDGETS, makeNode) {
  const byFn = {};
  for (const [type, spec] of Object.entries(WIDGETS)) {
    if (spec.hidden || !spec.code) continue;
    const variants = (spec.props || []).some(p => p[0] === 'n') ? [1, 2, 3, 4] : [null];
    for (const nv of variants) {
      const node = makeNode(type);
      const marks = {};
      let mi = 0;
      for (const [k, t] of spec.props || []) {
        if (k === 'n') { if (nv !== null) node[k] = nv; continue; }
        if (t === 'text' || t === 'items') { node[k] = SENTINEL_TEXT(k); marks[SENTINEL_TEXT(k)] = k; }
        else if (t === 'int' || t === 'float' || t === 'enum') {
          const magic = SENTINEL_NUM_BASE - (mi++);
          node[k] = magic;
          marks[String(magic)] = k;
        }
      }
      let res;
      try { res = spec.code(node, 'STATE', '"' + SENTINEL_TEXT('label') + '"'); }
      catch (e) { continue; }
      marks['"' + SENTINEL_TEXT('label') + '"'] = 'label';
      marks[SENTINEL_TEXT('label')] = 'label';

      const lines = Array.isArray(res) ? res : (res.open || []);
      const line = lines.find(l => /ImGui::\w+\s*\(/.test(l));
      if (!line) continue;
      const m = line.match(/ImGui::(\w+)\s*\(/);
      const fn = m[1];
      const argsText = balancedArgs(line.slice(line.indexOf(m[0]) + m[0].length - 1));
      if (argsText === null) continue;
      // An argument may be a nested call carrying several properties at once
      // (ImVec2(w, h), ImVec4(r, g, b, a)), so descend into it rather than
      // mapping the whole thing to whichever sentinel appears first.
      const mapArg = a => {
        a = a.trim();
        const call = a.match(/^\w+\s*\(/);
        if (call) {
          const inner = balancedArgs(a.slice(call[0].length - 1));
          if (inner !== null) {
            const parts = splitTopLevel(inner).map(mapArg);
            if (parts.some(Boolean)) return { parts };
          }
        }
        for (const [sent, key] of Object.entries(marks)) if (a.includes(sent)) return { key };
        return null;
      };
      const args = splitTopLevel(argsText).map(mapArg);
      // first variant registered wins; later ones only add new fn names
      if (!byFn[fn]) byFn[fn] = { type, n: nv, args, container: !!spec.container };
    }
  }
  return byFn;
}

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

// ---------- parser ----------

function createParser(WIDGETS, makeNode, colorSlots) {
  const schema = buildSchema(WIDGETS, makeNode);

  parseCpp.schema = schema;   // exposed for diagnostics
  return parseCpp;

  function parseCpp(src, nextId) {
    const errors = [];
    let idc = nextId;
    const newId = () => 'n' + (idc++);

    const toks = lex(src);
    // Work on the body of the Draw function when there is one, so the struct
    // and the function signature aren't treated as widgets.
    let start = 0;
    const beginIdx = toks.findIndex((t, i) =>
      t.v === 'ImGui' && toks[i + 1] && toks[i + 1].v === '::' || false);
    let bodyStart = src.indexOf('ImGui::Begin(');
    let bodyEnd = src.lastIndexOf('ImGui::End()');
    let windowLabel = null;
    if (bodyStart >= 0 && bodyEnd > bodyStart) {
      const call = balancedArgs(src.slice(bodyStart + 'ImGui::Begin'.length));
      if (call !== null) {
        const first = splitTopLevel(call)[0];
        if (first && first.trim().startsWith('"')) windowLabel = litStr(first.trim());
      }
      const afterBegin = src.indexOf(';', bodyStart) + 1;
      src = src.slice(afterBegin, bodyEnd);
    } else {
      errors.push({ level: 'warn', msg: 'No ImGui::Begin(...) / ImGui::End() pair found; parsing the whole text as a body.' });
    }
    void start; void beginIdx;

    const children = parseBlock(src, 0, src.length, errors, newId, schema, colorSlots, WIDGETS, makeNode);
    return { children, windowLabel, errors, nextId: idc };
  };
}

// Splits a body into statements and blocks. Anything the schema doesn't
// recognise becomes a rawcode node holding its exact source text.
function parseBlock(src, from, to, errors, newId, schema, colorSlots, WIDGETS, makeNode) {
  const out = [];
  let i = from;
  let pendingSameLine = false;
  let pendingColors = null;

  const flushRaw = text => {
    const trimmed = text.trim();
    if (!trimmed) return;
    out.push({ type: 'rawcode', id: newId(), label: '', code: trimmed });
  };

  while (i < to) {
    // skip whitespace
    while (i < to && /\s/.test(src[i])) i++;
    if (i >= to) break;

    const stmtStart = i;
    const rest = src.slice(i, to);

    // comment: keep it as raw so it survives, unless it's our TODO stub
    const comMatch = rest.match(/^\/\/[^\n]*|^\/\*[\s\S]*?\*\//);
    if (comMatch) {
      const text = comMatch[0];
      if (!/TODO:/.test(text)) flushRaw(text);
      i += text.length;
      continue;
    }

    // ImGui::SameLine();
    const slMatch = rest.match(/^ImGui::SameLine\s*\(\s*\)\s*;/);
    if (slMatch) { pendingSameLine = true; i += slMatch[0].length; continue; }

    // ImGui::PushStyleColor(ImGuiCol_X, ImVec4(r,g,b,a));
    const pushMatch = rest.match(/^ImGui::PushStyleColor\s*\(/);
    if (pushMatch) {
      const argsText = balancedArgs(rest.slice(pushMatch[0].length - 1));
      const end = i + pushMatch[0].length - 1 + (argsText === null ? 0 : argsText.length + 2);
      if (argsText !== null) {
        const parts = splitTopLevel(argsText);
        const slot = (parts[0] || '').trim().replace(/^ImGuiCol_/, '');
        const vec = balancedArgs((parts[1] || '').slice((parts[1] || '').indexOf('(')));
        if (slot && vec !== null) {
          const nums = splitTopLevel(vec).map(litNum);
          pendingColors = pendingColors || {};
          pendingColors[slot] = [nums[0] || 0, nums[1] || 0, nums[2] || 0,
            nums[3] === undefined ? 1 : nums[3]];
        }
        i = src.indexOf(';', end) + 1 || end;
        continue;
      }
    }
    if (/^ImGui::PopStyleColor\s*\(/.test(rest)) {
      i = src.indexOf(';', i) + 1 || to;
      continue;
    }

    // if (ImGui::Xxx(...)) { ... }
    const ifMatch = rest.match(/^if\s*\(\s*ImGui::(\w+)\s*\(/);
    if (ifMatch) {
      const fn = ifMatch[1];
      const callStart = i + rest.indexOf('ImGui::' + fn) + ('ImGui::' + fn).length;
      const argsText = balancedArgs(src.slice(callStart, to));
      const braceOpen = src.indexOf('{', callStart + (argsText || '').length + 2);
      const braceEnd = braceOpen >= 0 ? matchBrace(src, braceOpen, to) : -1;
      const entry = schema[fn];
      if (entry && argsText !== null && braceOpen >= 0 && braceEnd > 0) {
        const body = src.slice(braceOpen + 1, braceEnd);
        if (entry.container) {
          const node = nodeFromCall(entry, argsText, newId, WIDGETS, makeNode);
          node.children = parseBlock(stripPops(body), 0, stripPops(body).length,
            errors, newId, schema, colorSlots, WIDGETS, makeNode);
          attach(node);
          i = braceEnd + 1;
          continue;
        }
        // a button-ish `if`: only fold it into a widget when the body is just
        // the generated stub, otherwise the user's code has to survive
        if (/^[\s]*(\/\/[^\n]*|\/\*[\s\S]*?\*\/)?[\s]*$/.test(body)) {
          const node = nodeFromCall(entry, argsText, newId, WIDGETS, makeNode);
          attach(node);
          i = braceEnd + 1;
          continue;
        }
      }
      if (braceEnd > 0) { flushRaw(src.slice(stmtStart, braceEnd + 1)); i = braceEnd + 1; continue; }
    }

    // ImGui::Xxx(...);
    const callMatch = rest.match(/^ImGui::(\w+)\s*\(/);
    if (callMatch) {
      const fn = callMatch[1];
      const argsText = balancedArgs(rest.slice(callMatch[0].length - 1));
      if (argsText !== null && schema[fn]) {
        const semi = src.indexOf(';', i + callMatch[0].length + argsText.length);
        const node = nodeFromCall(schema[fn], argsText, newId, WIDGETS, makeNode);
        attach(node);
        i = semi >= 0 ? semi + 1 : to;
        continue;
      }
    }

    // anything else: take one statement or one brace-balanced block, verbatim
    const end = statementEnd(src, i, to);
    flushRaw(src.slice(i, end));
    i = end;
  }

  return out;

  function attach(node) {
    if (pendingSameLine) { node.sameline = true; pendingSameLine = false; }
    if (pendingColors) {
      const keep = {};
      for (const [k, v] of Object.entries(pendingColors)) {
        if (colorSlots(node.type).includes(k)) keep[k] = v;
      }
      if (Object.keys(keep).length) node.colors = keep;
      pendingColors = null;
    }
    out.push(node);
  }
}

// drop a trailing TreePop/EndTabBar/etc from a container body: it belongs to
// the container, not to its children
function stripPops(body) {
  return body.replace(/ImGui::(TreePop|EndTabBar|EndTabItem|EndTable|EndMenu|EndMenuBar|EndPopup|EndTooltip|EndChild|EndGroup)\s*\(\s*\)\s*;?/g, '')
    .replace(/if\s*\(\s*ImGui::Button\s*\(\s*"Close"\s*\)\s*\)\s*\n?\s*ImGui::CloseCurrentPopup\s*\(\s*\)\s*;?/g, '');
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

function nodeFromCall(entry, argsText, newId, WIDGETS, makeNode) {
  const node = makeNode(entry.type);
  node.id = newId();
  if (entry.n !== null && entry.n !== undefined) node.n = entry.n;
  const spec = WIDGETS[entry.type];
  const props = Object.fromEntries((spec.props || []).map(p => [p[0], p[1]]));
  const given = splitTopLevel(argsText);

  const applySlot = (slot, raw) => {
    if (!slot || raw === undefined) return;
    raw = String(raw).trim();
    if (slot.parts) {
      const call = raw.match(/^\w+\s*\(/);
      if (!call) return;
      const inner = balancedArgs(raw.slice(call[0].length - 1));
      if (inner === null) return;
      const sub = splitTopLevel(inner);
      slot.parts.forEach((s, j) => applySlot(s, sub[j]));
      return;
    }
    const t = slot.key === 'label' ? 'text' : props[slot.key];
    if (!t) return;
    if (t === 'text' || t === 'items' || t === 'longtext') {
      // strip the ## / ### id suffix the generator adds for uniqueness
      if (raw.startsWith('"')) node[slot.key] = litStr(raw).replace(/#{2,}.*$/, '');
    } else if (/^[-+0-9.]/.test(raw)) {
      node[slot.key] = litNum(raw);
    }
  };

  entry.args.forEach((slot, idx) => applySlot(slot, given[idx]));
  return node;
}
