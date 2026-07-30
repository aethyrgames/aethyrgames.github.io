// Code intelligence for the generated-C++ pane: a lint pass, a signature hint,
// and completion for ImGui:: calls and state members.
//
// This is deliberately not a C++ front end. It masks out comments in one scan,
// which makes the rest of the checks safe to write as line regexes, and then it
// looks for the mistakes that actually happen when you hand-edit this file:
// brackets that never close, a missing semicolon, a misspelled ImGui call, and a
// Text() whose format string is a variable. Anything it can't explain is left
// alone rather than guessed at, since Apply preserves unrecognised code anyway.

const LINT_MAX = 60;

// Comments blanked to spaces so offsets still line up, string literals kept so a
// check can tell a literal from a variable. Reports what never closed.
function maskCpp(src) {
  const chars = src.split('');
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
      while (i < src.length && src[i] !== '\n') chars[i++] = ' ';
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? src.length : end + 2;
      if (end < 0) {
        diags.push({ pos: i, level: 'error', msg: 'This block comment is never closed.' });
      }
      for (let k = i; k < stop; k++) if (src[k] !== '\n') chars[k] = ' ';
      i = stop;
      continue;
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
  return { masked: chars.join(''), diags };
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
  let best = null, bestD = cap + 1;
  for (const cand of names) {
    if (cand === name) return null;
    const d = editDistance(name.toLowerCase(), cand.toLowerCase(), cap);
    if (d < bestD || (d === bestD && best && cand.length < best.length)) { bestD = d; best = cand; }
  }
  return bestD <= cap ? best : null;
}

// Calls whose first argument is a printf format string. Passing a variable there
// is the bug that bites people: ImGui reads it as a format and any % in the data
// is a crash waiting to happen.
const FMT_CALLS = new Set(['Text', 'TextColored', 'TextDisabled', 'TextWrapped',
  'BulletText', 'SetTooltip', 'SetItemTooltip', 'LabelText', 'TextV', 'DebugLog']);

// Which argument holds the format string, for the few that take something else
// first.
const FMT_ARG = { TextColored: 1, LabelText: 1 };

const CONTROL_HEAD = /^(if|else\s+if|for|while|switch|catch)\b/;

function lintCpp(src, opts) {
  const o = opts || {};
  const sigs = o.sigs || {};
  const allNames = o.names || Object.keys(sigs);
  const modelled = o.modelled || null;
  const { masked, diags: scanDiags } = maskCpp(src);

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

  const lines = masked.split('\n');
  const raw = src.split('\n');

  // ---- unknown or misspelled ImGui calls, and format-string misuse ----
  const nameRe = /ImGui::(\w+)\s*\(?/g;
  let m;
  while ((m = nameRe.exec(masked))) {
    const name = m[1];
    if (sigs[name] || allNames.includes(name)) {
      // known: check the format-string family
      const fmtIndex = FMT_ARG[name] !== undefined ? FMT_ARG[name] : 0;
      if (!FMT_CALLS.has(name)) continue;
      const openAt = masked.indexOf('(', m.index);
      if (openAt < 0) continue;
      const args = splitArgsAt(masked, openAt);
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
          text: '"%s", ' + arg,
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
      msg: near
        ? `There is no ImGui::${name}. Did you mean ${near}?`
        : `There is no ImGui::${name} in this version of ImGui. It is kept as written, `
          + 'but it will not compile.',
      fix: near ? { from: at, to: at + name.length, text: near, label: 'Use ' + near } : undefined,
    });
  }

  // ---- statements that look like they lost a semicolon ----
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].trim();
    if (!text || text.startsWith('#') || text.startsWith('//')) continue;
    if (/[;{},:\\]$/.test(text) || text.endsWith('*/')) continue;
    if (CONTROL_HEAD.test(text) || /^(else|do|try|public|private|protected|case|default)\b/.test(text)) continue;
    // a wrapped argument list or expression continues on the next line
    if (/[-+*/%&|<>=!,(?]$/.test(text)) continue;
    const next = (lines[i + 1] || '').trim();
    if (next.startsWith('{')) continue;                 // a definition's brace
    if (!/[)\w"']$/.test(text)) continue;
    // only flag it when the brackets on this line are settled, so a call split
    // across lines is not mistaken for a statement
    let d = 0;
    for (const c of text) { if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) d--; }
    if (d !== 0) continue;
    if (/^(struct|class|namespace|enum|template|using|typedef|return)\b/.test(text)) {
      if (!/^return\b/.test(text)) continue;
    }
    out.push({
      line: i + 1,
      col: raw[i].length + 1,
      level: 'error',
      msg: 'This statement has no semicolon.',
      fix: { from: lineStarts[i] + raw[i].replace(/\s+$/, '').length, to: lineStarts[i] + raw[i].length, text: ';', label: 'Add ;' },
    });
  }

  // ---- calls the tool keeps verbatim rather than showing as a widget ----
  if (modelled) {
    const seen = new Set();
    const re = /ImGui::(\w+)\s*\(/g;
    let k;
    while ((k = re.exec(masked))) {
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
// so pointing them out as "not modelled" would be noise.
const STRUCTURAL = new Set(['Begin', 'End', 'SetNextWindowPos', 'SetNextWindowSize',
  'PushStyleColor', 'PopStyleColor', 'SetNextItemWidth', 'SameLine',
  'TableNextColumn', 'TableNextRow', 'EndChild', 'EndGroup', 'EndTable',
  'EndTabBar', 'EndTabItem', 'EndMenu', 'EndMenuBar', 'EndCombo', 'EndListBox',
  'EndPopup', 'EndTooltip', 'TreePop', 'PopID', 'PushID']);

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

// The members of the state struct the caret's function takes, so `state.` can be
// completed with the fields the generator actually wrote.
function stateMembers(src) {
  const out = [];
  const re = /struct\s+\w+\s*\{([\s\S]*?)\}\s*;/g;
  let m;
  while ((m = re.exec(src))) {
    const body = m[1];
    const f = /^\s*([\w:]+(?:\s*\*)?)\s+(\w+)\s*(\[[^\]]*\])?\s*(?:=|;)/gm;
    let g;
    while ((g = f.exec(body))) out.push({ name: g[2], sig: g[1] + ' ' + g[2] + (g[3] || '') });
  }
  return out;
}

// What to offer at the caret, and the span the chosen item replaces. Returns
// null when there is nothing worth offering.
function completionAt(value, caret, opts) {
  const o = opts || {};
  const sigs = o.sigs || {};
  const head = value.slice(0, caret);

  const member = /(\bstate)\s*\.\s*(\w*)$/.exec(head);
  if (member) {
    const word = member[2];
    const items = stateMembers(value)
      .filter(x => x.name.toLowerCase().startsWith(word.toLowerCase()))
      .slice(0, 40);
    if (!items.length) return null;
    return { from: caret - word.length, to: caret, items, kind: 'member' };
  }

  const qualified = /ImGui::(\w*)$/.exec(head);
  if (qualified) {
    const word = qualified[1];
    return listFns(word, sigs, caret - word.length, caret, false);
  }

  // a bare word long enough to be worth guessing at, offered with the prefix
  const bare = /(^|[^\w:.])([A-Za-z]\w{2,})$/.exec(head);
  if (bare && o.bare !== false) {
    const word = bare[2];
    return listFns(word, sigs, caret - word.length, caret, true);
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
function signatureAt(value, caret, sigs) {
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
