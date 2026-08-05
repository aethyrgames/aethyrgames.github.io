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
// 2. Anything not recognized is preserved verbatim as a `rawcode` node rather
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

// One scanner for every bracket walker below.
//
// All four of them used to track double-quoted strings and nothing else, so a
// brace, paren or semicolon inside a // comment counted as real. That ended a
// container body at the comment: the comment split in half, the widgets after
// it were reparented out of the container, and a stray closing brace was left
// behind as its own node. Character literals bite identically, since '}' is one
// token rather than a brace.
//
// Given an index, returns the index of the LAST character of the comment,
// string or character literal starting there, so the caller's own i++ steps
// past it. Returns -1 when nothing special starts at i.
function skipToken(src, i, to) {
  const c = src[i], n = src[i + 1];
  if (c === '/' && n === '/') {
    let j = i + 2;
    while (j < to && src[j] !== '\n') j++;
    return j;                                    // stops on the newline
  }
  if (c === '/' && n === '*') {
    let j = i + 2;
    while (j < to && !(src[j] === '*' && src[j + 1] === '/')) j++;
    return Math.min(j + 1, to);                  // stops on the closing slash
  }
  if (c === '"' || c === "'") {
    let j = i + 1;
    while (j < to && src[j] !== c) { if (src[j] === '\\') j++; j++; }
    return j;                                    // stops on the closing quote
  }
  return -1;
}

// takes "(a, b, c) ..." and returns "a, b, c"
function balancedArgs(s) {
  if (s[0] !== '(') return null;
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    const j = skipToken(s, i, s.length);
    if (j >= 0) { i = j; continue; }
    const c = s[i];
    if (c === '(') d++;
    else if (c === ')') { d--; if (!d) return s.slice(1, i); }
  }
  return null;
}

function splitTopLevel(s) {
  const out = [];
  let d = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const j = skipToken(s, i, s.length);
    if (j >= 0) { i = j; continue; }
    const c = s[i];
    if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) d--;
    else if (c === ',' && d === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  const last = s.slice(start).trim();
  if (last || out.length) out.push(last);
  return out;
}

function matchBrace(src, open, to) {
  let d = 0;
  for (let i = open; i < to; i++) {
    const j = skipToken(src, i, to);
    if (j >= 0) { i = j; continue; }
    const c = src[i];
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) return i; }
  }
  return -1;
}

function statementEnd(src, i, to) {
  let d = 0;
  for (let j = i; j < to; j++) {
    const k = skipToken(src, j, to);
    if (k >= 0) { j = k; continue; }
    const c = src[j];
    if (c === '{') d++;
    else if (c === '}') { d--; if (d <= 0) return j + 1; }
    else if (c === ';' && d === 0) return j + 1;
  }
  return to;
}

// Where a widget call ends once its own semicolon is missing. `closeParen` is
// the index of the call's closing `)`. `src.indexOf(';', closeParen)` used to
// stand in for this everywhere a widget call attaches: with no `;` right after
// the call, that scan ran past the whole next statement and landed on ITS
// semicolon instead, and the caller then jumped straight there. Everything in
// between, the next statement included, was never visited by the main loop and
// so never even became a rawcode node: it was simply gone. Only treat the
// semicolon as this call's own when nothing but whitespace or a comment sits
// between the `)` and it. Otherwise stop right after the call and let the
// normal loop pick up whatever follows, which is what keeps it as raw code
// instead of silently deleting it.
function advancePastCall(src, closeParen, to) {
  let j = closeParen + 1;
  while (j < to) {
    const skip = skipToken(src, j, to);
    if (skip >= 0) { j = skip + 1; continue; }
    if (/\s/.test(src[j])) { j++; continue; }
    break;
  }
  return j < to && src[j] === ';' ? j + 1 : closeParen + 1;
}

// Non-braced containers are emitted as a bare Begin/End statement pair rather
// than an if-block, so their extent has to be found by counting nested pairs.
const PAIRED = { group: ['BeginGroup', 'EndGroup'], child: ['BeginChild', 'EndChild'] };

// Mirrors WINDOW_FLAGS in index.html's generator. Both directions have to agree
// or a flag round-trips to nothing. MenuBar is not here on purpose: the
// generator derives it from a menubar child, not from a property.
const WINDOW_FLAG_PROPS = [
  ['noTitleBar', 'NoTitleBar'], ['noResize', 'NoResize'], ['noMove', 'NoMove'],
  ['noScrollbar', 'NoScrollbar'], ['noCollapse', 'NoCollapse'],
  ['autoResize', 'AlwaysAutoResize'],
];

// Comment and string bodies blanked to spaces, lengths and offsets unchanged.
// The pair scanners below are regexes over raw text, so skipToken cannot be
// dropped into them the way it was into the character walkers: a mention of
// ImGui::EndGroup() in a comment ended the container early, reparented the
// widgets after it, and left the generator emitting an unbalanced pair.
// Memoized on the input STRING, which made Apply linear again.
//
// findPairEnd calls this once per BeginGroup/BeginChild, and it walks the whole
// parse scope every time, so a document with many Groups re-blanked the entire
// file once per Group: 400 Groups went from 4.6ms to 1366ms, 800 from 9.6ms to
// 7.3 seconds, with parseCpp called synchronously from the Apply click. One
// entry is enough because `parse` recurses with the same `src` reference all
// the way down and only narrows from/to, so every call in one Apply sees the
// identical string and `===` is a pointer compare.
let blankMemo = { src: null, out: null };

// Counts characters actually walked by the scan below, i.e. it only moves on a
// cache miss. It has no effect on behaviour and nothing in the app reads it;
// it exists so a unit test can compare the amount of scanning work directly,
// as an exact integer, instead of a wall-clock sample that a loaded CI box can
// jitter. If findPairEnd ever loses the memoization above and goes back to
// re-blanking the whole file once per Group/Child pair, this counter grows
// with the number of pairs instead of staying flat at one scan's worth.
let blankScanSteps = 0;

function blankForScan(src) {
  if (src === blankMemo.src) return blankMemo.out;
  const out = src.split('');
  for (let i = 0; i < src.length; i++) {
    blankScanSteps++;
    const j = skipToken(src, i, src.length);
    if (j < 0) continue;
    for (let k = i; k <= j && k < src.length; k++) if (src[k] !== '\n') out[k] = ' ';
    i = j;
  }
  blankMemo = { src, out: out.join('') };
  return blankMemo.out;
}

function findPairEnd(src, from, to, beginFn, endFn) {
  src = blankForScan(src);
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
  // A popup emits its trigger Button before BeginPopup. Keying the schema on
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
          // the whole argument changed. If it's a nested call, find which part
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

    // One window per Begin/End pair. A document can hold several, and the
    // generator writes each as its own struct and function, so the parser
    // walks the file rather than assuming there is exactly one.
    const windows = [];
    // Every window's collected helpers, so the ones no call site claimed can be
    // written back out rather than deleted. See the orphan pass below.
    const allHelpers = [];
    // File-scope code found between two windows, which belongs to the user and
    // has nowhere else to go. Folded into `pre` at the end.
    const between = [];
    let cursor = 0;
    let pre = '';
    let post = '';
    let first = true;
    let lastClosable = false;
    let lastHadColors = false;

    while (true) {
      const bodyStart = src.indexOf('ImGui::Begin(', cursor);
      if (bodyStart < 0) break;
      const bodyEnd = matchingEnd(src, bodyStart);
      if (bodyEnd < 0) break;

      // The state struct carries values that never appear in a call, so read
      // the one belonging to this window and key it by member name.
      const fields = {};
      // '::groups' rather than a plain key: `fields` is threaded down the whole
      // parse and indexed by C++ identifier, and '::' cannot appear in one.
      const fieldGroups = (fields['::groups'] = {});
      const region = src.slice(cursor, bodyStart);
      // The window's OWN state struct, found by brace matching from the last
      // `struct <Name>State {` rather than by slicing at the first literal `};`.
      // The generator writes `float plot1[64] = {};` for a PlotLines, which IS
      // a `};`, so the field scan stopped there and every member after a plot
      // was invisible: a Progress bar below one came back at the catalog default
      // instead of the fraction the user set.
      // The GENERATED struct, matched by shape, not the last `struct ` in the
      // region. A helper body lifted out of this window can declare a local
      // struct, and that won the lastIndexOf, so no fields were read at all and
      // every struct-backed property came back at its catalog default.
      let structStart = -1;
      const stRe = /(^|\s)struct\s+\w+State\s*\{/g;
      let stHit;
      while ((stHit = stRe.exec(region))) structStart = stHit.index + stHit[1].length;
      if (structStart < 0) structStart = region.lastIndexOf('struct ');
      if (structStart >= 0) {
        const open = region.indexOf('{', structStart);
        let d = 0, structEnd = -1;
        for (let k = open; k >= 0 && k < region.length; k++) {
          if (region[k] === '{') d++;
          else if (region[k] === '}') { d--; if (!d) { structEnd = k; break; } }
        }
        if (structEnd > 0) {
          const body = region.slice(structStart, structEnd);
          const re = /^\s*\w[\w:]*\s+(\w+)\s*(?:\[[^\]]*\])?\s*=\s*([^;]+);[ 	]*(?:\/\/[ 	]*group:[ 	]*(.*?))?[ 	]*$/gm;
          let m;
          while ((m = re.exec(body))) {
            fields[m[1]] = m[2].trim();
            // The generator hangs a radio group's real name off its declaration
            // when the camelCased variable cannot carry it, so "Audio Mode" is
            // not renamed to "audioMode" on the first Apply.
            if (m[3]) fieldGroups[m[1]] = m[3];
          }
        }
      }

      const call = balancedArgs(src.slice(bodyStart + 'ImGui::Begin'.length));
      const callArgs = call === null ? [] : splitTopLevel(call);
      const firstArg = callArgs[0];
      const label = firstArg && firstArg.trim().startsWith('"') ? litStr(firstArg.trim()) : 'My Panel';
      // Begin's second argument is p_open, so a & there means the window can be
      // closed and something owns its visibility
      const openArg = (callArgs[1] || '').trim();
      // `&state.showX`: the flag is a member of the window's own state struct.
      // Matching a bare `&showX` only would leave openFlag as "state.showX", and
      // the `bool <name> =` lookup below would then never match, so openAtStart
      // silently fell back to true on every read.
      // End-anchored, and only the shape the generator writes. A prefix test
      // accepted any &expression, so a window the user guards with their own
      // global had that variable silently swapped for a generated state member
      // and their flag stopped controlling the window.
      const closable = /^&\s*(?:state\s*\.\s*)?show\w+\s*$/.test(openArg);
      // Anything else in the p_open slot is the user's own visibility variable.
      // It is kept verbatim rather than being read as `closable`, which used to
      // rebind it to a generated state member and leave their flag controlling
      // nothing. `nullptr` is the generator's own filler when only flags follow.
      const userOpen = !closable && openArg && openArg !== 'nullptr' ? openArg : '';
      const openFlag = closable
        ? openArg.replace(/^&\s*/, '').replace(/^state\s*\.\s*/, '')
        : null;

      // Whatever the generator owns here is re-derived from the document on the
      // way back out. Anything else is the user's and has to survive, or every
      // Apply would quietly delete the code around the windows.
      const head = splitHead(region, colorSlots);
      if (first) {
        // Anything the user wrote at file scope sits before the first window's
        // struct. splitHead's leftovers are per-window, so pre is taken from
        // the text ahead of that section instead.
        const upto = src.slice(0, bodyStart);
        // Anchored on the GENERATED struct, not on the first struct or free
        // function anywhere in the file. Cutting at the first one meant a user
        // prologue holding a type or a helper of their own was truncated at it
        // and the rest silently vanished on the next Apply.
        //
        // The generator always writes `struct <Name>State` immediately before
        // `void Draw<Name>(`, so the last such pair in the prologue is where
        // the generated region starts. Anything that does not match that shape
        // is the user's and stays.
        const gen = /(^|\s)struct\s+(\w+)State\s*\r?\n?\s*\{[\s\S]*?\n\};\s*(?=[\s\S]*?\bvoid\s+Draw\2\s*\()/g;
        let m = null, hit;
        while ((hit = gen.exec(upto))) m = hit;
        if (!m) m = /(^|\s)(struct\s+\w+|void\s+\w+\s*\()/.exec(upto);
        // Generated code puts the user's own lines ahead of the first struct.
        // Hand-written code has no struct at all, and then whatever splitHead
        // did not claim as the generator's is theirs.
        pre = m
          ? dedent(upto.slice(0, m.index).replace(/^\s*\/\/ Generated by ImGuiStudio.*/, ''))
          : head.rest;
        // Claimed, so it cannot be emitted a SECOND time as the window's
        // preamble below. In this fallback the leftovers ARE the file-scope
        // prologue, and leaving them in place put them inside DrawPanel too:
        // an #include in a function body, a global turned into a duplicated
        // local static, a struct defined twice. The result did not compile, and
        // it was stable across further Applies so nothing self-corrected.
        if (!m) head.rest = '';
        first = false;
      } else {
        // The file-scope region BETWEEN two generated windows. pre was only ever
        // taken for the first window and post only after the last, so this slice
        // had no owner and a shared global or a helper written here was deleted
        // on the first Apply, with nothing reported.
        const gen2 = /(^|\s)struct\s+(\w+)State\s*\r?\n?\s*\{[\s\S]*?\n\};\s*(?=[\s\S]*?\bvoid\s+Draw\2\s*\()/g;
        let m2 = null, hit2;
        while ((hit2 = gen2.exec(region))) m2 = hit2;
        let own = m2 ? region.slice(0, m2.index) : '';
        // The region starts just after the PREVIOUS window's ImGui::End();, so
        // it opens with that function's own tail: its color pop, the closable
        // guard's brace, and the closing brace at column 0. All of it is
        // regenerated, so keeping any of it duplicates braces on every Apply.
        const closeAt = own.search(/\n\}[ \t]*(\r?\n|$)/);
        if (closeAt >= 0) own = own.slice(own.indexOf('\n', closeAt + 1) + 1);
        // Helper definitions in here belong to the window that follows and are
        // re-emitted from their own section nodes.
        for (const h of Object.values(collectHelpers(region))) {
          if (h.src) own = own.split(h.src).join('');
        }
        if (own.trim()) between.push(dedent(own));
      }

      // The body starts after the WHOLE Begin call, found by matching its
      // parentheses. Taking the first raw `;` after Begin put the start inside
      // the call whenever an argument contained one, so a window titled
      // "Panel; with semicolon" lost every widget in it.
      const beginArgs = balancedArgs(src.slice(bodyStart + 'ImGui::Begin'.length));
      const afterBegin = beginArgs === null
        ? src.indexOf(';', bodyStart)
        : src.indexOf(';', bodyStart + 'ImGui::Begin'.length + beginArgs.length + 2);
      const inner = src.slice(afterBegin + 1, bodyEnd);
      const winHelpers = collectHelpers(region);
      allHelpers.push(winHelpers);
      const children = parse(inner, 0, inner.length, errors, newId, schema,
        colorSlots, WIDGETS, makeNode, fields, winHelpers);
      const win = Object.assign(makeNode('window'), { id: newId(), label, children });
      // Whatever splitHead could not attribute to the generator, between the
      // draw function's opening brace and Begin. It was computed and discarded,
      // so a hand-written SetNextWindowBgAlpha was deleted on the first Apply
      // while a PushStyleVar paired with it kept its Pop, leaving the style
      // stack popping something never pushed.
      if (head.rest && head.rest.trim()) win.preamble = head.rest.trim();
      if (userOpen) win.pOpen = userOpen;
      if (head.colors) win.colors = head.colors;
      const size = /ImGui::SetNextWindowSize\s*\(\s*ImVec2\s*\(([^,]+),([^)]+)\)/.exec(region);
      // No SetNextWindowSize means 0x0, which is the generator's own contract:
      // it only writes the call when w or h is above zero, and 0 is the
      // documented "let ImGui size it to its content". Leaving the catalog
      // default in place reset an auto-sized window to 380x460 on one Apply.
      if (size) { win.w = litNum(size[1]); win.h = litNum(size[2]); }
      else { win.w = 0; win.h = 0; }
      if (closable) {
        win.closable = true;
        const decl = new RegExp('bool\\s+' + openFlag + '\\s*=\\s*(true|false)').exec(region);
        win.openAtStart = !decl || decl[1] === 'true';
      }
      const pos = /ImGui::SetNextWindowPos\s*\(\s*ImVec2\s*\(([^,]+),([^)]+)\)/.exec(region);
      if (pos) { win.x = litNum(pos[1]); win.y = litNum(pos[2]); }
      // The six window flags are emitted by the generator and, until now, read
      // back by nothing: none of these names appeared anywhere in this file, so
      // every Apply silently cleared whichever ones the user had set.
      //
      // MenuBar is deliberately absent from the map. The generator derives that
      // one from the presence of a menubar child rather than from a property,
      // so adopting it here would invent a property that does not exist.
      const flagLine = /ImGuiWindowFlags\s+flags\s*=([^;]*);/.exec(region);
      const beginFlags = (callArgs[2] || '');
      const flagsText = (flagLine ? flagLine[1] : '') + ' ' + beginFlags;
      for (const [key, name] of WINDOW_FLAG_PROPS) {
        if (new RegExp('ImGuiWindowFlags_' + name + '\\b').test(flagsText)) win[key] = true;
      }
      lastClosable = closable;
      lastHadColors = !!head.colors;
      windows.push(win);

      cursor = src.indexOf(';', bodyEnd) + 1 || src.length;
    }

    if (!windows.length) {
      // no window at all: treat the whole text as one window's body so nothing
      // is lost, which is what a paste of loose widget calls looks like
      const children = parse(src, 0, src.length, errors, newId, schema,
        colorSlots, WIDGETS, makeNode, {}, collectHelpers(src));
      if (children.length) {
        windows.push(Object.assign(makeNode('window'), { id: newId(), children }));
        errors.push({ level: 'warn', msg: 'No ImGui::Begin/End pair found; wrapped the body in a window.' });
      }
    } else {
      post = splitTail(src.slice(cursor), lastClosable, lastHadColors);
    }

    // A toggle is written as a flag name. The document stores the window title.
    // Both directions go through the same PascalCase rule, so this round-trips.
    const byFlag = {};
    for (const w of windows) byFlag[pascalId(w.label)] = w.label;
    const resolve = list => {
      for (let k = 0; k < (list || []).length; k++) {
        const n = list[k];
        if (n.togglesFlag !== undefined) {
          const hit = byFlag[n.togglesFlag];
          if (!hit && n.togglesSrc) {
            // The flag names something that is not one of our windows, so the
            // document has no way to express this button. Putting the original
            // statement back is the whole point: it used to resolve to '' and
            // the generator then wrote a `// TODO` where the user's code was.
            list[k] = { type: 'rawcode', id: n.id, label: '', code: n.togglesSrc };
            continue;
          }
          n.toggles = hit || '';
          delete n.togglesFlag;
          delete n.togglesSrc;
        }
        resolve(n.children);
      }
    };
    for (const w of windows) resolve(w.children);

    // A `static void X(State& state)` helper is only adopted as a Function
    // container when its call is a bare top-level statement. Wrap that call in
    // an if-block and the call survives as raw code while the DEFINITION was
    // dropped on the floor, so the regenerated file called a function it never
    // defined. Put the unclaimed ones back at file scope.
    //
    // The `includes` guard is what makes this idempotent: on the next Apply the
    // definition is in `pre`, collectHelpers finds it again, and appending a
    // second copy would grow the file on every pass.
    const orphans = [];
    for (const set of allHelpers) {
      for (const h of Object.values(set)) {
        if (h.adopted || !h.src.trim()) continue;
        if (pre.includes(h.src) || post.includes(h.src)) continue;
        if (orphans.includes(h.src)) continue;
        orphans.push(h.src);
      }
    }
    if (orphans.length) pre = (pre ? pre.replace(/\s+$/, '') + '\n\n' : '') + orphans.join('\n\n');

    // File-scope code found between windows. It moves to the top of the file
    // rather than staying where it was, which reorders declarations but keeps
    // them: everything in this slice is a file-scope declaration by definition,
    // so it still compiles, and losing it silently was the alternative.
    for (const b of between) {
      if (b.trim() && !pre.includes(b.trim())) {
        pre = (pre ? pre.replace(/\s+$/, '') + '\n\n' : '') + b.trim();
      }
    }

    return { windows, pre, post, errors, nextId: idc };
  }
}

// The End that closes a given Begin, counting nested Begin/End pairs in
// between so a child window does not steal the match.
// "AudioSettings" -> "Audio Settings". The generator only ever writes the
// PascalCase form, so a label that was already spaced comes back the same, and
// one that wasn't settles after a single apply.
function unpascal(name) {
  const s = String(name || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').trim();
  return s || 'Section';
}

// The `static void DrawX(SomeState& state)` blocks the generator lifts out of a
// window, keyed by function name and holding the body text. Collected from the
// region ahead of the window so a call inside it can be matched back.
function collectHelpers(region) {
  const found = {};
  // A lifted helper also takes any window flags its buttons borrow, so its
  // parameter list is no longer just `state`.
  // `(?:\/\/[^\n]*)?` because the generator hangs the container's real label off
  // the end of this line when the function name cannot carry it. Without it the
  // whole definition stopped being recognized as a helper, and the call site
  // fell through to raw code.
  const re = /(?:^|\n)\s*static\s+void\s+(\w+)\s*\(\s*\w+\s*&\s*state\s*(?:,[^)]*)?\)[ \t]*(?:\/\/[^\n]*)?\s*\n?\s*\{/g;
  let m;
  while ((m = re.exec(region))) {
    const open = region.indexOf('{', m.index + m[0].length - 1);
    const end = matchBrace(region, open, region.length);
    if (end < 0) continue;
    // `src` is the WHOLE definition, kept so a helper whose call site the parser
    // could not adopt is still written back out. Without it, a helper called
    // from inside an if-block was silently deleted while the call survived as
    // raw code, and the regenerated file called a function it never defined.
    found[m[1]] = {
      body: dedent(region.slice(open + 1, end)),
      src: region.slice(m.index, end + 1).replace(/^\n+/, ''),
      // The generator writes the container's real label here when the function
      // name cannot carry it losslessly, which is any label that pascal-izes to
      // something unpascal cannot undo, plus every duplicate after the first.
      // Without it, two Function containers both labeled "Side" came back as
      // "Side" and "Side2" the first time the code was applied.
      label: (m[0].match(/\/\/\s*label:[ \t]*(.*?)[ \t]*$/m) || [])[1] || null,
      adopted: false,
    };
    re.lastIndex = end;
  }
  return found;
}

function matchingEnd(src, beginAt) {
  const re = /ImGui::(Begin|End)\s*\(/g;
  re.lastIndex = beginAt;
  let depth = 0, m;
  while ((m = re.exec(src))) {
    if (m[1] === 'Begin') depth++;
    else if (--depth === 0) return m.index;
  }
  return -1;
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
// leaves the user's own prologue, and hands back the window's color pushes.
function splitHead(text, colorSlots) {
  const colors = {};
  // Everything through the draw function's opening brace is the generator's own
  // header. Anchoring on the function skips the state struct wholesale, which a
  // regex can't do safely: a field initialized to `{ 1.0f, 1.0f }` ends in `};`
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
    // A closable window is wrapped in `if (state.showX) {`, which the generator
    // writes and re-derives from the `closable` property. Leaving it in `rest`
    // meant it came back as the window's hand-written preamble and was emitted
    // a second time inside the guard it already was inside.
    .replace(/^[ \t]*if\s*\(\s*state\s*\.\s*show\w+\s*\)[ \t]*\r?\n[ \t]*\{[ \t]*\r?\n?/m, '')
    .replace(/^[ \t]*ImGui::SetNextWindowSize\s*\([^;]*\)\s*;[ \t]*\r?\n?/m, '')
    .replace(/^[ \t]*ImGui::SetNextWindowPos\s*\([^;]*\)\s*;[ \t]*\r?\n?/m, '');
  rest = rest.replace(/^[ \t]*ImGui::PushStyleColor\s*\(\s*ImGuiCol_(\w+)\s*,\s*ImVec4\s*\(([^)]*)\)\s*\)\s*;[ \t]*\n?/gm,
    (whole, slot, nums) => {
      if (!colorSlots('window').includes(slot)) return whole;   // not ours; keep it
      const parts = nums.split(',');
      // Number('kR') is NaN, and `v[0] || 0` mapped that NaN straight to 0: a
      // hand-written expression here was silently rewritten to black the same
      // way the widget-level push below was. Same fix: only claim (and drop)
      // the line when every argument is actually a numeric literal, otherwise
      // leave the statement in `rest` so it survives verbatim as hand-written
      // preamble.
      const allNumeric = parts.length > 0
        && parts.every(part => /^\s*[-+]?[0-9]*\.?[0-9]+[fF]?\s*$/.test(part));
      if (!allNumeric) return whole;
      const v = parts.map(s => Number(s.trim().replace(/f$/, '')));
      colors[slot] = [v[0] || 0, v[1] || 0, v[2] || 0, v[3] === undefined ? 1 : v[3]];
      return '';
    });
  return { colors: Object.keys(colors).length ? colors : null, rest: dedent(rest) };
}

// The mirror image after ImGui::End(): the window's color pop and the draw
// function's closing brace belong to the generator.
// The brace to drop is the first one alone on a line, not the last one in the
// text: the user's own code can follow the draw function.
function splitTail(text, guarded, hadColors) {
  // Anchored to the START of the tail, taken in the order the generator writes
  // them. These used to be /m without /g, which matches at the start of ANY
  // line rather than only the first: a window with no colors of its own had no
  // pop to remove, so the regex scanned forward and deleted the first
  // standalone PopStyleColor it found in the user's own trailing code. Their
  // style stack came back unbalanced and the color bled into everything drawn
  // after it.
  let rest = text;
  const eat = re => {
    const m = re.exec(rest);
    if (m && m.index === 0) rest = rest.slice(m[0].length);
  };
  const blank = () => eat(/^[ \t\r\n]*/);
  blank();
  // Only when the window actually contributed colors. Eating it regardless
  // deleted a hand-written pop balancing a hand-written push above Begin, and
  // the color then bled into everything drawn after the window.
  if (hadColors) eat(/^[ \t]*ImGui::PopStyleColor\s*\([^;]*\)\s*;[ \t]*\r?\n?/);
  blank();
  eat(/^[ \t]*\}[ \t]*\r?\n?/);
  // a closable window is wrapped in `if (showX) { ... }`, so there is a second
  // brace to account for before the user's own code starts
  if (guarded) { blank(); eat(/^[ \t]*\}[ \t]*\r?\n?/); }
  return dedent(rest);
}

function parse(src, from, to, errors, newId, schema, colorSlots, WIDGETS, makeNode, fields, helpers) {
  const out = [];
  let i = from;
  let pendingSameLine = false;
  let pendingColors = null;
  const itemArrays = {};    // name -> { items, node } for combo/listbox lists
  let pendingItemWidth = null;   // SetNextItemWidth applies to the next widget
  let popsDue = 0;        // color pops the widget just attached will account for

  const colAt = pos => pos - (src.lastIndexOf('\n', pos - 1) + 1);

  // The generator re-indents every line of a raw block by the block's own depth,
  // so that much has to come back off here or the code creeps right on each
  // Apply. The first line already starts at the statement, hence the skip.
  const rawText = (text, col) => {
    const lines = text.replace(/\s+$/, '').split('\n');
    const body = col > 0
      ? lines.map((l, n) => (n === 0 ? l : l.replace(new RegExp('^[ \\t]{0,' + col + '}'), '')))
      : lines;
    return body.join('\n');
  };
  // A SameLine or a SetNextItemWidth applies to whatever ImGui submits NEXT,
  // and a block of code the tool does not model still counts. Only attach()
  // consumed them, so a SameLine before unmodeled code jumped forward onto the
  // widget after it and that widget silently moved onto the previous row.
  const claimPending = node => {
    if (pendingSameLine) { node.sameline = true; pendingSameLine = false; }
    pendingItemWidth = null;
  };

  const raw = (text, col) => {
    const t = rawText(text, col);
    if (!t.trim()) return;
    const node = { type: 'rawcode', id: newId(), label: '', code: t };
    claimPending(node);
    out.push(node);
  };

  // Color pushes only belong to a widget when they look exactly like the ones
  // the generator writes: every slot valid for that widget, and a matching pop
  // straight after. Anything else is the user's and is kept verbatim.
  const flushColors = () => {
    if (!pendingColors) return;
    raw(pendingColors.src);
    pendingColors = null;
  };

  const attach = (node, argsText) => {
    if (pendingSameLine) { node.sameline = true; pendingSameLine = false; }
    // SetNextItemWidth is a statement of its own, so it can't be probed as an
    // argument. It attaches to whatever widget comes next, like SameLine does.
    if (pendingItemWidth !== null) {
      if ((WIDGETS[node.type].props || []).some(p => p[0] === 'itemw')) {
        node.itemw = pendingItemWidth;
      }
      pendingItemWidth = null;
    }
    // A Combo or ListBox names its array in its own arguments, so claim that
    // one. The declaration was already emitted as raw code, so claiming it means
    // taking that node back out.
    if ((node.type === 'combo' || node.type === 'listbox') && argsText) {
      for (const name of Object.keys(itemArrays)) {
        if (!new RegExp('\\b' + name + '\\b').test(argsText)) continue;
        const claimed = itemArrays[name];
        node.items = claimed.items;
        if (claimed.node) claimed.node.claimed = true;   // dropped on the way out
        delete itemArrays[name];
        break;
      }
    }
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

    // Every comment survives, including one saying TODO. The generator's own
    // TODO placeholders are only ever emitted INSIDE a button's braces
    // (widgets.js button, smallbutton and arrowbutton), and the button branch
    // above consumes those with the call they belong to. So a comment reaching
    // statement level is the user's, and dropping it because it happened to
    // contain "TODO:" deleted their note on every Apply.
    const com = rest.match(/^\/\/[^\n]*|^\/\*[\s\S]*?\*\//);
    if (com) {
      flushColors();
      raw(com[0], colAt(i));
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

    // A call to one of the lifted Function containers. Its body was collected
    // before the window was walked, so this rebuilds the container and parses
    // that body as its children. Parsing it here rather than up front means a
    // helper calling another helper nests the same way it generated.
    const helperCall = helpers && rest.match(/^(\w+)\s*\(\s*state\s*(?:,[^)]*)?\)\s*;/);
    if (helperCall && helpers[helperCall[1]] !== undefined) {
      helpers[helperCall[1]].adopted = true;
      const body = helpers[helperCall[1]].body;
      const node = Object.assign(makeNode('section'), {
        id: newId(),
        label: helpers[helperCall[1]].label
          || unpascal(helperCall[1].replace(/^Draw/, '')),
      });
      node.children = parse(body, 0, body.length, errors, newId, schema,
        colorSlots, WIDGETS, makeNode, fields, helpers);
      attach(node);
      i = src.indexOf(';', i) + 1;
      continue;
    }

    // Structural calls the generator re-emits from the tree. Keeping them would
    // duplicate on every apply.
    if (/^ImGui::(TableNextColumn|TableNextRow)\s*\(\s*\)\s*;/.test(rest)) {
      i = src.indexOf(';', i) + 1;
      continue;
    }

    // The item array a Combo/ListBox is generated with, carried to the next one.
    // The declaration text is carried with it: this branch used to consume the
    // statement and advance past the semicolon with no raw() fallback, so unless
    // the very next widget was a combo or a listbox the user's array was simply
    // deleted. attach() puts it back when nothing claims it.
    // Keyed by the array's NAME, not by "the declaration just before this call".
    // Position alone broke as soon as two combos declared their arrays together,
    // which is the natural way to write them: the second declaration overwrote
    // the first before anything claimed it, so combo A took B's list and B fell
    // back to the catalog placeholder. The call names the array it uses, so use
    // that. The declaration is emitted as raw code straight away and spliced
    // back out only once a widget claims it, which keeps an unclaimed one in the
    // position the user wrote it in.
    const itemsDecl = rest.match(/^static\s+const\s+char\*\s*(\w+)\s*\[\s*\]\s*=\s*\{/);
    if (itemsDecl) {
      const close = src.indexOf('}', i);
      const semi = src.indexOf(';', close < 0 ? i : close);
      const end = semi >= 0 ? semi + 1 : to;
      flushColors();
      // raw() drops any pending SameLine or SetNextItemWidth, because for
      // genuinely unmodeled code they belong to the raw block. This
      // declaration is not unmodeled: it is part of the Combo that follows, and
      // the generator writes it BETWEEN that combo's SetNextItemWidth and the
      // call itself. Clearing here cost the combo its width on every Apply.
      const heldSame = pendingSameLine, heldWidth = pendingItemWidth;
      raw(src.slice(i, end), colAt(i));
      pendingSameLine = heldSame;
      pendingItemWidth = heldWidth;
      if (close > 0) {
        itemArrays[itemsDecl[1]] = {
          items: splitTopLevel(src.slice(i + itemsDecl[0].length, close))
            .filter(s => s.startsWith('"')).map(litStr).join(', '),
          node: out[out.length - 1],
        };
      }
      i = end;
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
        // only a literal ImVec4 is a value we can round-trip. A variable or a
        // helper call has to stay as written. litNum returns 0 for anything it
        // can't parse rather than NaN, so Number.isFinite(litNum(x)) is true
        // for EVERY input and never actually gated this: ImVec4(kR, kG, kB,
        // 1.0f) parsed as [0, 0, 0, 1] and the user's expression was gone for
        // good the moment Apply regenerated the call. Test the argument TEXT
        // instead, before any coercion happens.
        const argParts = vec !== null ? splitTopLevel(vec) : [];
        const allNumeric = argParts.length > 0
          && argParts.every(part => /^\s*[-+]?[0-9]*\.?[0-9]+[fF]?\s*$/.test(part));
        if (slot && vec !== null && /^\s*ImVec4\s*\(/.test(vecIn.trim()) && allNumeric) {
          const nums = argParts.map(litNum);
          pendingColors = pendingColors || { map: {}, src: '', col: colAt(i) };
          pendingColors.map[slot] = [nums[0] || 0, nums[1] || 0, nums[2] || 0,
            nums[3] === undefined ? 1 : nums[3]];
          pendingColors.src += (pendingColors.src ? '\n' : '') + src.slice(i, semiAt).trim();
          read = true;
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
      // swallow only the pop that closes colors we just folded into a widget
      if (!(dueNow > 0 && n === dueNow)) { flushColors(); raw(src.slice(i, semiAt), colAt(i)); }
      i = semiAt;
      continue;
    }

    // A popup's trigger button. The popup container that follows owns it.
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
        // A container whose own arguments could not be read still keeps its
        // children, so fall back to a bare node rather than losing the subtree.
        const node = (entry && nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields))
          || Object.assign(makeNode(type), { id: newId() });
        const bodyFrom = src.indexOf(';', i + bare[0].length + argsText.length) + 1;
        node.children = parse(src, bodyFrom, pair.callStart, errors, newId, schema,
          colorSlots, WIDGETS, makeNode, fields, helpers);
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
          const node = nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields)
            || Object.assign(makeNode(entry.type), { id: newId() });
          const inner = stripTrailingPop(body, fn);
          node.children = parse(inner, 0, inner.length, errors, newId, schema,
            colorSlots, WIDGETS, makeNode, fields, helpers);
          attach(node);
          i = braceEnd + 1;
          continue;
        }
        // A button whose body is nothing but a window toggle is still a button:
        // the toggle is a property of it, not loose code inside it.
        // `state.showX = !state.showX;` for a window's own flag, and a bare
        // `showX = !showX;` for one borrowed from another window by reference.
        const tog = /^\s*(?:state\s*\.\s*)?(\w+)\s*=\s*!\s*(?:state\s*\.\s*)?\1\s*;\s*$/.exec(body);
        const togNode = tog && entry.type === 'button'
          ? nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields) : null;
        if (togNode) {
          const node = togNode;
          node.togglesFlag = tog[1].replace(/^show/, '');
          // Carried so the flag can be un-read later. This shape is only OURS
          // when the flag names one of the document's windows. `g_paused =
          // !g_paused` is the user's own bool and used to be replaced by a
          // `// TODO` comment, which is the one body shape that lost code.
          node.togglesSrc = rawText(src.slice(start, braceEnd + 1), colAt(start));
          attach(node);
          i = braceEnd + 1;
          continue;
        }
        // A body holding nothing but a comment used to be read as an empty
        // button, and the comment was then replaced by the generator's own
        // `// TODO: <name>` placeholder on the way back out. Only a genuinely
        // empty body takes this path now. A commented one falls through to raw
        // code, which keeps what the user wrote.
        // ...but the generator writes exactly `// TODO: <name>` as the body of a
        // button with nothing wired to it, so that one shape IS generated code
        // and has to keep round-tripping as an empty button. Anything else the
        // user wrote in there is theirs.
        // Both spellings: `// TODO: x` on its own line for a braced body, and
        // `/* TODO: x */` inline for a one-line one.
        const emptyNode = /^\s*(\/\/ TODO: \w+\s*|\/\* TODO: \w+ \*\/\s*)?$/.test(body)
          ? nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields) : null;
        if (emptyNode) {
          attach(emptyNode);
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
      // A null back from nodeFromCall means an argument was an expression the
      // document cannot hold, so the statement drops through to raw rather than
      // coming back with a default standing in for the user's code.
      const exact = entry && !entry.container
        && splitTopLevel(argsText).length === entry.argc
        ? nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields) : null;
      if (exact) {
        attach(exact, argsText);
        i = advancePastCall(src, i + call[0].length + argsText.length, to);
        continue;
      }
      // Otherwise it's hand-written: a different arity, or a function the
      // generator never emits at all. ImGui::Text("hi") lands here.
      if (argsText !== null && (!entry || !entry.container)) {
        // The alias table reads ONE argument, the label, so it must not claim a
        // call that carries more than that when the schema knows the function.
        // An ordinary hand-written 4-argument SliderFloat came back with its
        // label and every other property at the catalog default, silently
        // replacing the user's 5..100 range with 0..1.
        //
        // Narrow on purpose: preferring the schema for EVERY known function
        // also took ImGui::Text("hi"), which is exactly what the alias exists
        // for, and turned it into a textfmt node.
        const alias = CALL_ALIASES[fn];
        const readsPast = alias && alias.label !== null
          ? (alias.second !== undefined ? alias.second : alias.label) + 1 : 0;
        const carriesMore = splitTopLevel(argsText).length > readsPast;
        const schemaKnows = !!entry && !entry.container;
        const odd = schemaKnows && carriesMore
          ? nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields) : null;
        if (odd) {
          attach(odd, argsText);
          i = advancePastCall(src, i + call[0].length + argsText.length, to);
          continue;
        }
        // The schema looked at this call and REFUSED it, because an argument was
        // an expression the document cannot hold. The alias must not then paper
        // over that with a defaults-only node: an alias whose label is null
        // reads nothing at all, so ImGui::Indent(kIndent) came back as a plain
        // Indent and the constant was gone. Fall through to raw code.
        if (schemaKnows && carriesMore) {
          const rawEnd = statementEnd(src, i, to);
          flushColors();
          raw(src.slice(i, rawEnd), colAt(i));
          i = rawEnd;
          continue;
        }
        const aliased = nodeFromAlias(fn, argsText, newId, WIDGETS, makeNode);
        if (aliased) {
          attach(aliased, argsText);
          i = advancePastCall(src, i + call[0].length + argsText.length, to);
          continue;
        }
        if (odd) {
          attach(odd, argsText);
          i = advancePastCall(src, i + call[0].length + argsText.length, to);
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
  // an array declaration with no combo after it is the user's too
  // A declaration a Combo or ListBox claimed is re-emitted from that widget, so
  // leaving the raw copy in would duplicate it on every Apply. An unclaimed one
  // stays exactly where the user wrote it.
  return out.filter(n => !n.claimed);
}

// Hand-written ImGui differs from what the generator emits. The generator picks
// one spelling per widget (TextUnformatted for text, and "%s" formatting for
// the rest), so a perfectly ordinary ImGui::Text("hi") matched nothing and fell
// through to a raw-code placeholder. These are the equivalents worth reading
// back: `label` is which argument carries the visible string.
const CALL_ALIASES = {
  // `fmt` marks the ones ImGui runs through vsnprintf, so their literal is a
  // FORMAT string: "100%% done" draws as "100% done". They regenerate as
  // TextUnformatted, which does not unescape, so the label has to be undoubled
  // on the way in or what the user sees changes on the first Apply.
  Text:          { type: 'text',           label: 0, fmt: true },
  TextV:         { type: 'text',           label: 0, fmt: true },
  TextWrapped:   { type: 'textwrapped',    label: 0, fmt: true },
  TextDisabled:  { type: 'textdisabled',   label: 0, fmt: true },
  TextColored:   { type: 'textcolored',    label: 1, fmt: true },
  BulletText:    { type: 'bullettext',     label: 0, fmt: true },
  LabelText:     { type: 'labeltext',      label: 0, second: 1, fmt: true },
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
  // ProgressBar is deliberately NOT here. It used to be, with label: null, so a
  // three-argument call (the generator's own output for a labeled bar) missed
  // the arity test, fell to this table, and returned an all-defaults node
  // before reading anything. Label, width and fraction were all reset by one
  // Apply. Without an entry it falls through to nodeFromCall, which reads the
  // size from the probed slot, the fraction from the state field, and the
  // overlay label from the trailing literal.
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
  let text = litStr(raw);
  // a format string with substitutions can't round-trip as a plain label
  if (/%[-+ #0-9.]*[a-zA-Z]/.test(text) && args.length > alias.label + 1) return null;
  // ImGui runs these through vsnprintf, so "100%% done" DRAWS as "100% done".
  // They regenerate as TextUnformatted, which does not unescape, so keeping the
  // doubled percent changed what the user sees on the first Apply.
  if (alias.fmt) text = text.replace(/%%/g, '%');
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
// Would this widget's own emitter produce the literal `lit` if the property
// were sitting at its declared minimum? If so the literal is the emitter's
// sentinel rather than anything the user wrote, and reading it back verbatim
// puts an out-of-range number into the document.
function emitterInvents(spec, node, key, min, lit) {
  if (!spec || typeof spec.code !== 'function') return false;
  try {
    const probe = Object.assign({}, node, { [key]: min });
    const out = spec.code(probe, 'probe', '"probe"', { toggleRef: () => null });
    const parts = Array.isArray(out) ? out
      : out ? [].concat(out.open || [], out.pop || [], out.extra || []) : [];
    const text = parts.join(' ');
    return text.includes(lit);
  } catch (e) {
    return false;
  }
}

function stripGeneratedSuffix(s) {
  // Only the generator's own markers. `##<digits>` alone is legitimate
  // user-authored ImGui id syntax, so stripping it truncated "Item##2".
  //
  // KNOWN GAP, deliberately left: a label the user types as exactly `##dup<n>`
  // is still stripped, because that is the generator's own marker and nothing
  // in the text says who wrote it. "Already seen this base label" does not
  // discriminate. imguiId skips numbers that are taken, so the suffixes it
  // mints are not sequential and a user's `##dup2` can legitimately appear
  // before the generator's `##dup3`. The real fix is a marker a user would
  // never type, which changes every generated file, so it is not a quiet edit.
  return s.replace(/###(popup|btn)\w*$/, '').replace(/##dup\d+$/, '');
}

function nodeFromCall(entry, argsText, newId, WIDGETS, makeNode, fields) {
  const node = makeNode(entry.type);
  node.id = newId();
  if (entry.n !== null && entry.n !== undefined) node.n = entry.n;
  const spec = WIDGETS[entry.type];
  const propDefs = Object.fromEntries((spec.props || []).map(p => [p[0], p]));
  const given = splitTopLevel(argsText);
  // Set when an argument was written as an expression in a slot the document can
  // only hold a literal in. See the return at the bottom.
  let lossy = false;

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
      // %% is how a literal % survives printf, so undouble it here. Without
      // this the unit grows by one % on every Apply.
      node[slot.key] = m ? m[1].trim().replace(/%%/g, '%') : '';
      return;
    }
    if (t === 'text' || t === 'items' || t === 'longtext') {
      if (v.startsWith('"')) {
        node[slot.key] = slot.key === 'label' ? stripGeneratedSuffix(litStr(v)) : litStr(v);
      } else if (v) {
        // The document can only hold a literal here and the caller wrote an
        // expression. Keeping the default silently put a made-up string where
        // their variable was: ImGui::Text(fmtBuf) came back as
        // ImGui::Text("%s", "text") with fmtBuf gone and no warning. Refuse the
        // node instead, so the statement survives as raw code.
        lossy = true;
      }
    } else if (t === 'enum' && !/^[-+0-9.]/.test(v)) {
      // e.g. ImGuiDir_Right -> the option whose name matches
      const name = v.replace(/^\w+_/, '');
      const hit = (def[3] || []).find(o => Array.isArray(o) && o[0] === name);
      if (hit) node[slot.key] = hit[1];
      // an enum written as something this catalog does not know
      else if (v) lossy = true;
    } else if (/^[-+0-9.]/.test(v)) {
      // Clamped to the range the property declares. Several emitters write a
      // sentinel outside it: a Progress bar with w = 0 emits ImVec2(-1.0f, ...)
      // because -1 is ImGui's "fill the available width", and reading that back
      // literally set w = -1 in the document on the first Apply and left it
      // there. The declared min is what the inspector already enforces.
      const opts = def[3] || {};
      let x = litNum(v);
      if (typeof opts.max === 'number') x = Math.min(opts.max, x);
      // Clamped up to the declared minimum ONLY when this widget's own emitter
      // is the thing that wrote the out-of-range value. A Progress bar with
      // w = 0 emits ImVec2(-1.0f, ...) because -1 is ImGui's "fill the available
      // width", and reading that back literally set w = -1 in the document.
      // But a Button's width is written verbatim, so -1 there is what the USER
      // typed. Clamping it to 0 made the size argument vanish entirely,
      // silently shrinking a full-width button to its label on the first Apply.
      if (typeof opts.min === 'number' && x < opts.min
          && emitterInvents(spec, node, slot.key, opts.min, v)) {
        x = opts.min;
      }
      node[slot.key] = x;
    } else if (v) {
      // A number slot holding an expression: a named constant, an arithmetic
      // expression, anything that is not a literal. Keeping the catalog default
      // silently replaced it, so ImGui::Dummy(ImVec2(kWidth, 20)) regenerated as
      // ImGui::Dummy(ImVec2(40.0f, 20.0f)) and kWidth was gone. Refuse the node
      // instead and the statement survives as raw code.
      lossy = true;
    }
  };

  entry.args.forEach((slot, idx) => {
    // A variadic tail takes every remaining argument, not just its own slot.
    // ImGui::Text("%d of %d", a, b) maps `args` to one position by probing, so
    // without this everything after the first comma was dropped on every apply.
    const def = slot && propDefs[slot.key];
    if (def && def[3] && def[3].rest && idx === entry.args.length - 1
        && given.length > entry.args.length) {
      apply(slot, given.slice(idx).join(', '));
      return;
    }
    // An argument the call simply does not have. Keeping the catalog default
    // invented content the user never wrote: ImGui::MenuItem("Quit") came back
    // carrying the placeholder shortcut "Ctrl+O", which then appeared in their
    // menu. A missing text argument means empty, not "whatever the palette
    // stamps". Numbers keep their default, since an omitted optional numeric
    // argument really does mean the function's own default.
    if (given[idx] === undefined && slot && !slot.parts) {
      const d = slot.key === 'label' ? ['label', 'text'] : propDefs[slot.key];
      if (d && (d[1] === 'text' || d[1] === 'items' || d[1] === 'longtext' || d[1] === 'unit')) {
        node[slot.key] = '';
        return;
      }
    }
    apply(slot, given[idx]);
  });

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
    if (m) node.group = ((fields && fields['::groups']) || {})[m[1]] || m[1];
  }

  // The schema is probed from a DEFAULT node, so an argument the generator only
  // emits once a property is set does not exist in the baseline and the probe
  // never learns it. A Progress bar's overlay label is the case that surfaced
  // this: three arguments emitted, two probed, and the third dropped. Take a
  // trailing string literal past the probed arity as the label, when the widget
  // has one, no probed slot already claimed it, and no slot is variadic (a
  // variadic tail has already swallowed everything after its own position).
  if (given.length > entry.args.length && propDefs.label) {
    const claimed = entry.args.some(s => s && s.key === 'label');
    const variadic = entry.args.some(s => s && propDefs[s.key]
      && propDefs[s.key][3] && propDefs[s.key][3].rest);
    const tail = (given[given.length - 1] || '').trim();
    if (!claimed && !variadic && tail.startsWith('"')) {
      node.label = stripGeneratedSuffix(litStr(tail));
    }
  }

  return lossy ? null : node;
}
