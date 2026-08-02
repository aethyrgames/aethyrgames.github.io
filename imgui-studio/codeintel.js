// Code intelligence for the generated-C++ pane: a lint pass, a signature hint,
// and completion for ImGui:: calls and state members.
//
// This is deliberately not a C++ front end. It masks out comments in one scan,
// which makes the rest of the checks safe to write as line regexes, and then it
// looks for the mistakes that actually happen when you hand-edit this file:
// brackets that never close, a missing semicolon, a misspelled ImGui call, and a
// Text() whose format string is a variable. Anything it can't explain is left
// alone rather than guessed at, since Apply preserves unrecognized code anyway.

const LINT_MAX = 60;

// Comments blanked to spaces so offsets still line up, string literals kept so a
// check can tell a literal from a variable. Reports what never closed.
function maskCpp(src) {
  const chars = src.split('');
  // A second mask with the string CONTENTS blanked too, quotes kept so a check
  // can still tell a literal from a variable and every offset still lines up.
  //
  // `masked` deliberately keeps string bodies, and four separate checks then
  // read them as if they were code: an ImGui name inside a label was reported
  // as a nonexistent call with a one-click fix that edited the text, a stray
  // `)` in a label unbalanced the bracket count and SUPPRESSED a real missing
  // semicolon, and a comma in a label shifted the signature hint onto the wrong
  // argument. Anything scanning for syntax wants this one.
  const blank = src.split('');
  const diags = [];
  const stack = [];
  const lineAt = pos => {
    let n = 1;
    for (let i = 0; i < pos; i++) if (src[i] === '\n') n++;
    return n;
  };
  const OPEN = { '(': ')', '[': ']', '{': '}' };
  const CLOSE = { ')': '(', ']': '[', '}': '{' };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') { blank[i] = ' '; chars[i++] = ' '; }
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? src.length : end + 2;
      if (end < 0) {
        diags.push({ pos: i, level: 'error', msg: 'This block comment is never closed.' });
      }
      for (let k = i; k < stop; k++) if (src[k] !== '\n') { chars[k] = ' '; blank[k] = ' '; }
      i = stop;
      continue;
    }
    // A raw string literal spans lines by design. The newline rule below treated
    // that as unterminated, so valid C++11 reported "This string is never
    // closed" and then the ) of the closing delimiter popped the enclosing { off
    // the bracket stack, making every brace diagnostic after it wrong too. The
    // pane read "Apply (4 errors)" on clean code.
    if (c === 'R' && src[i + 1] === '"' && !/[\w$]/.test(src[i - 1] || '')) {
      const dm = /^R"([^()\\\s]{0,16})\(/.exec(src.slice(i, i + 20));
      if (dm) {
        const close = ')' + dm[1] + '"';
        const end = src.indexOf(close, i + dm[0].length);
        if (end < 0) {
          diags.push({ pos: i, level: 'error', msg: 'This raw string is never closed.' });
          i = src.length;
        } else {
          for (let k = i + dm[0].length; k < end; k++) {
            if (src[k] !== '\n') { chars[k] = ' '; blank[k] = ' '; }
          }
          i = end + close.length;
        }
        continue;
      }
    }
    if (c === '"' || c === "'") {
      const quote = c;
      let k = i + 1;
      let closed = false;
      while (k < src.length && src[k] !== '\n') {
        if (src[k] === '\\') { k += 2; continue; }
        if (src[k] === quote) { closed = true; break; }
        k++;
      }
      if (!closed) {
        diags.push({
          pos: i,
          level: 'error',
          msg: quote === '"' ? 'This string is never closed.' : 'This character literal is never closed.',
        });
        i = k;
        continue;
      }
      for (let x = i + 1; x < k; x++) if (src[x] !== '\n') blank[x] = ' ';
      i = k + 1;
      continue;
    }
    if (OPEN[c]) { stack.push({ ch: c, pos: i }); i++; continue; }
    if (CLOSE[c]) {
      const top = stack[stack.length - 1];
      if (!top) {
        diags.push({ pos: i, level: 'error', msg: `This '${c}' closes nothing.` });
      } else if (top.ch !== CLOSE[c]) {
        diags.push({
          pos: i,
          level: 'error',
          msg: `Expected '${OPEN[top.ch]}' here, to close the '${top.ch}' on line ${lineAt(top.pos)}.`,
        });
        stack.pop();
      } else {
        stack.pop();
      }
      i++;
      continue;
    }
    i++;
  }
  for (const open of stack) {
    diags.push({
      pos: open.pos,
      level: 'error',
      msg: `This '${open.ch}' is never closed.`,
    });
  }
  return { masked: chars.join(''), blanked: blank.join(''), diags };
}

function editDistance(a, b, cap) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, row[j]);
    }
    if (best > cap) return cap + 1;
    prev = row;
  }
  return prev[b.length];
}

// The closest known spelling, but only when it is close enough to be an obvious
// typo rather than a different function.
function nearestName(name, names) {
  const cap = name.length <= 5 ? 1 : 2;
  let bestD = cap + 1;
  let tied = [];
  for (const cand of names) {
    if (cand === name) return null;
    const d = editDistance(name.toLowerCase(), cand.toLowerCase(), cap);
    if (d < bestD) { bestD = d; tied = [cand]; }
    else if (d === bestD) tied.push(cand);
  }
  if (bestD > cap) return null;
  // A tie is not a typo anyone can correct on the user's behalf. ImGui::ColorEdit
  // is exactly as close to ColorEdit3 as to ColorEdit4, and picking the shorter
  // one silently dropped the alpha channel in code that then compiled. Name them
  // all and offer no one-click fix.
  return tied.length === 1 ? tied[0] : { ambiguous: tied.slice(0, 4) };
}

// Calls whose first argument is a printf format string. Passing a variable there
// is the bug that bites people: ImGui reads it as a format and any % in the data
// is a crash waiting to happen.
// TextV is deliberately NOT here. Its signature is
// `void TextV(const char* fmt, va_list args)`, so forwarding a runtime fmt is
// the only correct way to call it. Warning about that flagged correct code, and
// the offered fix rewrote it to `TextV("%s", fmt, a)`, a three-argument call to
// a two-argument function. The whole V family has the same shape.
const FMT_CALLS = new Set(['Text', 'TextColored', 'TextDisabled', 'TextWrapped',
  'BulletText', 'SetTooltip', 'SetItemTooltip', 'LabelText', 'DebugLog']);

// Which argument holds the format string, for the few that take something else
// first.
const FMT_ARG = { TextColored: 1, LabelText: 1 };

const CONTROL_HEAD = /^(if|else\s+if|for|while|switch|catch)\b/;

function lintCpp(src, opts) {
  const o = opts || {};
  const sigs = o.sigs || {};
  const allNames = o.names || Object.keys(sigs);
  const modelled = o.modelled || null;
  const { masked, blanked, diags: scanDiags } = maskCpp(src);

  const lineStarts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStarts.push(i + 1);
  const posToLine = pos => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  };

  const out = scanDiags.map(d => ({
    line: posToLine(d.pos), col: d.pos - lineStarts[posToLine(d.pos) - 1] + 1,
    level: d.level, msg: d.msg,
  }));

  // Blanked, not masked. The missing-semicolon heuristic counts brackets on the
  // line, and `masked` keeps string bodies, so a label holding a stray `)` both
  // invented reports and, worse, SUPPRESSED real ones: a genuinely missing
  // semicolon after ImGui::TextUnformatted("smiley :)") went unreported.
  const lines = blanked.split('\n');
  const raw = src.split('\n');

  // ---- unknown or misspelled ImGui calls, and format-string misuse ----
  // Over `blanked`, not `masked`. A label mentioning an ImGui function was
  // reported as a nonexistent call, and its one-click fix rewrote the text
  // inside the string literal.
  const nameRe = /ImGui::(\w+)\s*\(?/g;
  let m;
  while ((m = nameRe.exec(blanked))) {
    const name = m[1];
    if (sigs[name] || allNames.includes(name)) {
      // known: check the format-string family
      const fmtIndex = FMT_ARG[name] !== undefined ? FMT_ARG[name] : 0;
      if (!FMT_CALLS.has(name)) continue;
      const openAt = blanked.indexOf('(', m.index);
      if (openAt < 0) continue;
      const args = splitArgsAt(blanked, openAt);
      if (!args) continue;
      const arg = (args.parts[fmtIndex] || '').trim();
      if (!arg || arg.startsWith('"')) continue;
      // a variable where a format string belongs
      const line = posToLine(openAt);
      out.push({
        line,
        col: 1,
        level: 'warn',
        msg: `ImGui::${name} takes a format string. Passing a variable there makes any `
          + `% in its text a formatting directive. Use "%s" and pass ${arg} as the argument.`,
        fix: {
          from: args.argStarts[fmtIndex],
          to: args.argStarts[fmtIndex] + (args.parts[fmtIndex] || '').length,
          // From the RAW slice, not the blanked one. Taking it from the mask
          // meant an inline comment inside the argument was blanked to spaces
          // and then deleted by the fix that rewrote the range.
          text: '"%s", ' + src.slice(args.argStarts[fmtIndex],
            args.argStarts[fmtIndex] + (args.parts[fmtIndex] || '').length).trim(),
          label: 'Wrap in "%s"',
        },
      });
      continue;
    }
    const near = nearestName(name, allNames);
    const line = posToLine(m.index);
    const at = m.index + 'ImGui::'.length;
    out.push({
      line,
      col: at - lineStarts[line - 1] + 1,
      level: 'error',
      msg: typeof near === 'string'
        ? `There is no ImGui::${name}. Did you mean ${near}?`
        : near
          ? `There is no ImGui::${name}. Did you mean ${near.ambiguous.join(' or ')}? `
            + 'They are equally close, so pick the one you meant.'
          : `There is no ImGui::${name} in this version of ImGui. It is kept as written, `
            + 'but it will not compile.',
      // Only offered when one candidate is strictly closest. On a tie there is
      // no right answer to click, and guessing dropped an alpha channel in code
      // that still compiled.
      fix: typeof near === 'string'
        ? { from: at, to: at + name.length, text: near, label: 'Use ' + near }
        : undefined,
    });
  }

  // ---- statements that look like they lost a semicolon ----

  // The innermost brace still open at line i, described by the text that
  // introduced it. An enum body and an aggregate initializer are LISTS: their
  // last entry carries no semicolon and never should. A function body is a
  // BLOCK, where a statement before the closing brace really is missing one.
  // Without this distinction the heuristic flagged the last enumerator and the
  // last array element, and its one-click fix wrote `ModeB;` inside the braces,
  // turning valid C++ into a syntax error.
  const enclosingBraceHead = i => {
    let d = 0;
    for (let k = i - 1; k >= 0; k--) {
      const t = lines[k];
      for (let x = t.length - 1; x >= 0; x--) {
        if (t[x] === '}') d++;
        else if (t[x] === '{') {
          if (d) { d--; continue; }
          const head = t.slice(0, x).trim();
          return head || (lines[k - 1] || '').trim();
        }
      }
    }
    return null;
  };

  // How many round or square brackets are still open when each line STARTS.
  // The old guard only balanced the current line, so a call wrapped across
  // several lines had its last argument reported as a statement missing its
  // semicolon, and the offered fix inserted one INSIDE the argument list. Only
  // ( and [ count: a { opens a block, and a statement before a closing brace
  // really can be missing its semicolon.
  const openAtLineStart = [];
  {
    let d = 0;
    for (const l of lines) {
      openAtLineStart.push(d);
      for (const c of l) {
        if (c === '(' || c === '[') d++;
        else if (c === ')' || c === ']') d--;
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].trim();
    if (!text || text.startsWith('#') || text.startsWith('//')) continue;
    if (openAtLineStart[i] > 0) continue;    // inside a wrapped argument list
    if (/[;{},:\\]$/.test(text) || text.endsWith('*/')) continue;
    if (CONTROL_HEAD.test(text) || /^(else|do|try|public|private|protected|case|default)\b/.test(text)) continue;
    // a wrapped argument list or expression continues on the next line
    if (/[-+*/%&|<>=!,(?]$/.test(text)) continue;
    // ...and a line STARTING with a continuation is the tail of the one above.
    // Constructor initializer lists and wrapped ternaries live here, and both
    // were being reported as missing a semicolon. The arithmetic, stream and
    // comparison operators are here because a wrapped expression continuing
    // with any of them had its HEAD line reported and a semicolon inserted in
    // the middle of the expression.
    if (/^([:,?.]|->|&&|\|\||<<|>>|[-+*/%&|^<>=!])/.test(text)) continue;
    const next = (lines[i + 1] || '').trim();
    if (next.startsWith('{')) continue;                 // a definition's brace
    // the next line continues this one, by any operator that can lead a
    // continuation rather than just the handful that used to be listed
    if (/^([:,?.]|->|&&|\|\||<<|>>|[-+*/%&|^<>=!)\]])/.test(next)) continue;
    if (!/[)\w"']$/.test(text)) continue;
    // only flag it when the brackets on this line are settled, so a call split
    // across lines is not mistaken for a statement
    let d = 0;
    for (const c of text) { if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; }
    if (d !== 0) continue;
    if (/^(struct|class|namespace|enum|template|using|typedef|return)\b/.test(text)) {
      if (!/^return\b/.test(text)) continue;
    }
    // the last entry of an enum body or an aggregate initializer, which is
    // complete as written. `struct` and `class` are NOT lists: their members do
    // end in semicolons, so a member without one is a real error.
    if (next.startsWith('}')) {
      const head = enclosingBraceHead(i);
      if (head !== null && (/=\s*$/.test(head) || /\benum\b/.test(head))) continue;
    }
    // The insertion point comes from the MASKED line, not the raw one. Taken
    // from the raw line, a trailing // comment put the semicolon after the
    // comment text where it does nothing, the lint re-fired, and clicking again
    // gave `// note;;` and then `;;;`.
    const stmtEnd = lineStarts[i] + lines[i].replace(/\s+$/, '').length;
    out.push({
      line: i + 1,
      col: raw[i].length + 1,
      level: 'error',
      msg: 'This statement has no semicolon.',
      fix: { from: stmtEnd, to: stmtEnd, text: ';', label: 'Add ;' },
    });
  }

  // ---- calls the tool keeps verbatim rather than showing as a widget ----
  if (modelled) {
    const seen = new Set();
    const re = /ImGui::(\w+)\s*\(/g;
    let k;
    while ((k = re.exec(blanked))) {
      const name = k[1];
      if (!sigs[name] || modelled.has(name)) continue;
      // the closing half of a pair is never a widget of its own, so naming it
      // would just repeat what the Begin already said
      if (/^(End|Pop|Tree)/.test(name) || STRUCTURAL.has(name)) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      out.push({
        line: posToLine(k.index),
        col: 1,
        level: 'info',
        msg: `ImGui::${name} is not one of the widgets this tool models. Apply keeps the `
          + 'line exactly as written and shows it as a raw C++ block.',
      });
    }
  }

  out.sort((a, b) => a.line - b.line || a.col - b.col
    || LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  const capped = out.slice(0, LINT_MAX);
  capped.more = out.length - capped.length;
  return capped;
}

const LEVEL_ORDER = { error: 0, warn: 1, info: 2 };

// Calls the generator writes as scaffolding rather than as a widget of its own,
// so pointing them out as "not modeled" would be noise.
const STRUCTURAL = new Set(['Begin', 'End', 'SetNextWindowPos', 'SetNextWindowSize',
  'PushStyleColor', 'PopStyleColor', 'SetNextItemWidth', 'SameLine',
  'TableNextColumn', 'TableNextRow', 'EndChild', 'EndGroup', 'EndTable',
  'EndTabBar', 'EndTabItem', 'EndMenu', 'EndMenuBar', 'EndCombo', 'EndListBox',
  'EndPopup', 'EndTooltip', 'TreePop', 'PopID', 'PushID',
  // The generator writes these itself for every Popup and Modal, and the parser
  // rebuilds the widget from them. Calling them "not modeled" told the user
  // their own popup would come back as a raw C++ block, which is the opposite
  // of what happens.
  'OpenPopup', 'CloseCurrentPopup', 'BeginPopup', 'BeginPopupModal',
  'BeginItemTooltip', 'IsItemHovered']);

// The argument list starting at an open paren: the text of each argument and
// where each one starts, so a fix can rewrite exactly one of them.
function splitArgsAt(src, openAt) {
  let d = 0;
  let start = openAt + 1;
  const parts = [];
  const argStarts = [start];
  for (let i = openAt; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') d++;
    else if (c === ')' || c === ']' || c === '}') {
      d--;
      if (!d) { parts.push(src.slice(start, i)); return { parts, argStarts, end: i }; }
    } else if (c === ',' && d === 1) {
      parts.push(src.slice(start, i));
      start = i + 1;
      argStarts.push(start);
    } else if (c === '"') {
      i++;
      while (i < src.length && src[i] !== '"') { if (src[i] === '\\') i++; i++; }
    }
  }
  return null;
}

// ---------- completion ----------

// Every struct in the file, by name, with its body found by brace matching.
//
// This used to be one non-greedy regex, `\{([\s\S]*?)\}\s*;`, which stops at the
// FIRST `}` followed by `;`. The generator writes fields that contain exactly
// that: widgets.js emits `float tint[4] = { 1.0f, 1.0f, 1.0f, 1.0f };` for a
// ColorEdit and `float plot[64] = {};` for a PlotLines. So the body ended at the
// first such field and every member after it vanished from completion.
function structBodies(src) {
  const out = [];
  const re = /\bstruct\s+(\w+)\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const open = m.index + m[0].length - 1;
    let d = 0, end = -1;
    for (let i = open; i < src.length; i++) {
      if (src[i] === '{') d++;
      else if (src[i] === '}') { d--; if (!d) { end = i; break; } }
    }
    if (end < 0) continue;
    out.push({ name: m[1], body: src.slice(open + 1, end) });
    re.lastIndex = end;
  }
  return out;
}

const fieldsOf = body => {
  const out = [];
  // The type may be several tokens (`unsigned int`), qualified (`const char*`),
  // or storage-class prefixed (`static bool`). Accepting a single token dropped
  // every one of those from `state.` completion, and the generator itself
  // writes `const char*` members.
  const f = /^\s*((?:(?:const|static|mutable|unsigned|signed|long|short|struct)\s+)*[\w:]+(?:\s*[*&])?)\s+(\w+)\s*(\[[^\]]*\])?\s*(?:=|;)/gm;
  let g;
  while ((g = f.exec(body))) out.push({ name: g[2], sig: g[1] + ' ' + g[2] + (g[3] || '') });
  return out;
};

// The members of the state struct the caret's function takes, so `state.` can be
// completed with the fields the generator actually wrote.
//
// With a caret, this narrows to the struct named by the enclosing function's
// parameter. It used to union every struct in the file, so the picker inside one
// window's Draw offered another window's members, and accepting one wrote
// `state.otherCount` into a function whose `state` is a different type. That
// does not compile. Without a caret it still unions, since there is nothing to
// narrow against.
function stateMembers(src, caret) {
  const structs = structBodies(src);
  if (typeof caret === 'number') {
    const head = src.slice(0, caret);
    const fnRe = /\b\w+\s*\(\s*(\w+)\s*&\s*state\b[^)]*\)/g;
    let last = null, m;
    while ((m = fnRe.exec(head))) last = m;
    const only = last && structs.find(s => s.name === last[1]);
    if (only) return fieldsOf(only.body);
  }
  return structs.flatMap(s => fieldsOf(s.body));
}

// What to offer at the caret, and the span the chosen item replaces. Returns
// null when there is nothing worth offering.
function completionAt(value, caret, opts) {
  const o = opts || {};
  const sigs = o.sigs || {};
  // Over the blanked text, so the picker does not open inside a comment or a
  // string literal. It owns Enter while it is up, so ending a commented-out
  // line used to insert a call instead of a newline.
  const code = maskCpp(value).blanked;
  const head = code.slice(0, caret);
  // How far the identifier under the caret runs PAST it. The replaced span used
  // to stop at the caret, so completing in the middle of a name left the tail of
  // the old one behind and appended a second, empty parameter list.
  const tail = (/^\w*/.exec(code.slice(caret)) || [''])[0].length;

  const member = /(\bstate)\s*\.\s*(\w*)$/.exec(head);
  if (member) {
    const word = member[2];
    const items = stateMembers(code, caret)
      .filter(x => x.name.toLowerCase().startsWith(word.toLowerCase()))
      .slice(0, 40);
    if (!items.length) return null;
    return { from: caret - word.length, to: caret + tail, items, kind: 'member' };
  }

  const qualified = /ImGui::(\w*)$/.exec(head);
  if (qualified) {
    const word = qualified[1];
    return listFns(word, sigs, caret - word.length, caret + tail, false);
  }

  // a bare word long enough to be worth guessing at, offered with the prefix
  const bare = /(^|[^\w:.])([A-Za-z]\w{2,})$/.exec(head);
  if (bare && o.bare !== false) {
    const word = bare[2];
    return listFns(word, sigs, caret - word.length, caret + tail, true);
  }
  return null;
}

function listFns(word, sigs, from, to, withPrefix) {
  const w = word.toLowerCase();
  const starts = [];
  const contains = [];
  for (const [name, info] of Object.entries(sigs)) {
    const l = name.toLowerCase();
    if (l.startsWith(w)) starts.push({ name, sig: info[0], note: info[1] || '' });
    else if (w.length >= 3 && l.includes(w)) contains.push({ name, sig: info[0], note: info[1] || '' });
  }
  const items = starts.concat(contains).slice(0, 40);
  if (!items.length) return null;
  return { from, to, items, kind: 'fn', withPrefix };
}

// The call the caret sits inside, and which argument it is on, for a hint line
// under the editor.
function signatureAt(rawValue, caret, sigs) {
  // Blanked, so punctuation inside a label cannot be read as an argument
  // separator. A comma in a slider's label pushed the highlighted parameter one
  // to the right, and a stray paren removed the hint entirely.
  const value = maskCpp(rawValue).blanked;
  let d = 0;
  let arg = 0;
  for (let i = caret - 1; i >= 0; i--) {
    const c = value[i];
    if (c === ')' || c === ']') d++;
    else if (c === '(' || c === '[') {
      if (d) { d--; continue; }
      if (c === '[') return null;
      const before = value.slice(Math.max(0, i - 64), i);
      const m = /(?:ImGui::)?(\w+)\s*$/.exec(before);
      if (!m || !sigs[m[1]]) return null;
      return { name: m[1], sig: sigs[m[1]][0], note: sigs[m[1]][1] || '', arg };
    } else if (c === ',' && !d) arg++;
    else if (c === ';' || c === '{' || c === '}') return null;
  }
  return null;
}
