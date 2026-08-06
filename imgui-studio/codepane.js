// The generated-C++ pane: applying an edit back into the document, the editing
// surface itself, and the lint, signature hint and completion picker that
// app/codeintel.js computes.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.

// ---------- editing the generated C++ ----------

let codeEditing = false;
// The C++ this editing session started from, either the last text generated
// from the canvas or whatever a Reload just pulled in. markCodeStale and the
// Escape guard below both compare against this rather than against the live
// document or the live textarea: generating is what changes the document's
// C++, typing is not, and the two must not be read as the same signal.
let codeEditSnapshot = '';
// The parser is assembled by the PROFILE, not here: which factory builds it
// and from which catalog is exactly the kind of knowledge W1 moved out of the
// shell. This file only asks PROFILE.parser, and a profile without one means
// the Edit flow is absent, not broken.
const codeEl = document.getElementById('code');
const codeEdit = document.getElementById('codeEdit');
const codeStatus = document.getElementById('codeStatus');
const editBtn = document.getElementById('editCodeBtn');
const applyBtn = document.getElementById('applyCodeBtn');
const cancelBtn = document.getElementById('cancelCodeBtn');
const reloadBtn = document.getElementById('reloadCodeBtn');

function setCodeEditing(on) {
  codeEditing = on;
  codeEl.hidden = on;
  document.getElementById('codeEditWrap').hidden = !on;
  codeStatus.hidden = !on;
  editBtn.hidden = on;
  applyBtn.hidden = !on;
  cancelBtn.hidden = !on;
  reloadBtn.hidden = true;   // only offered once the document actually moves on
  if (on) {
    codeEdit.value = PROFILE.generate();
    codeEditSnapshot = codeEdit.value;
    paintCodeEditor();
    const gone = generateCode.skipped || [];
    const warned = generateCode.warnings || [];
    const lost = gone.reduce((n, s) => n + 1 + s.lost, 0);
    // Only a real skip is an error. A dropped PROPERTY on a widget that emits
    // fine is worth saying and is not a widget about to be deleted, and it used
    // to be counted as one: a Button whose `toggles` named nothing made the pane
    // announce that a widget had no valid C++ form and would be removed.
    codeStatus.className = gone.length ? 'err' : '';
    codeStatus.textContent = 'Editing the C++. Apply parses it back into the document; '
      + 'anything not recognized as a widget is preserved verbatim and shown as a '
      + 'placeholder. Formatting inside generated blocks is normalized on the way back.'
      + (gone.length
        ? `\nHeads up: ${lost} widget${lost > 1 ? 's' : ''} ${lost > 1 ? 'have' : 'has'} `
          + `no valid C++ form (${gone.map(s => s.type + ' - ' + s.reason).join('; ')}). `
          + `${lost > 1 ? 'They are' : 'It is'} only ${lost > 1 ? 'comments' : 'a comment'} `
          + `here, so applying will remove ${lost > 1 ? 'them' : 'it'}.`
        : '')
      + (warned.length
        ? '\nAlso: ' + warned.map(s => s.type
          + (s.label ? ` "${s.label}"` : '') + ' - ' + s.reason).join('; ') + '.'
        : '');
    codeEdit.focus();
    runCodeIntel();
  } else {
    hideCompletions();
    lintEl.hidden = true;
    sigEl.hidden = true;
    renderCode();
  }
}

// Shown when the canvas moved on while the pane was open. Reloading is offered
// because the alternative, silently overwriting the text, loses C++ edits.
function markCodeStale() {
  // Compares the CURRENT document against the snapshot taken when editing
  // started, not against codeEdit.value. Comparing to codeEdit.value made the
  // user's own typing look like a canvas change: type anything, then merely
  // select a widget (which calls refresh() -> markCodeStale()), and the banner
  // claimed the document had moved on when only the text field had.
  if (!codeEditing || PROFILE.generate() === codeEditSnapshot) return;
  codeStatus.className = 'err';
  codeStatus.textContent = 'The document changed on the canvas after this C++ was '
    + 'generated. Applying replaces those changes with the text below. '
    + 'Press Reload to pull the newer document in instead.';
  reloadBtn.hidden = false;
}

editBtn.onclick = () => setCodeEditing(true);
reloadBtn.onclick = () => { setCodeEditing(false); setCodeEditing(true); };
cancelBtn.onclick = () => setCodeEditing(false);

applyBtn.onclick = () => {
  let result;
  try {
    result = PROFILE.parser(codeEdit.value, nextId);
  } catch (err) {
    // never blank the canvas on a parse failure: keep the last good document
    codeStatus.className = 'err';
    codeStatus.textContent = 'Could not parse: ' + err.message
      + '\nThe document is unchanged.';
    return;
  }
  const before = countNodes(doc.children);
  const ids = new Set(['root']);
  nextId = Math.max(nextId, result.nextId);
  const cleaned = sanitize(result.windows, ids, true);
  const after = countNodes(cleaned);
  const raws = countType(cleaned, 'rawcode');

  doc.children = cleaned;
  // code the user wrote around the windows, kept so Apply never eats it
  if (result.pre) doc.pre = result.pre; else delete doc.pre;
  if (result.post) doc.post = result.post; else delete doc.post;
  clearSelection();
  refresh();

  const notes = result.errors.map(e => '· ' + e.msg);
  codeStatus.className = raws ? '' : 'ok';
  codeStatus.textContent = `Applied. ${before} widgets before, ${after} after`
    + (raws ? `, ${raws} block${raws > 1 ? 's' : ''} kept as raw C++ (preserved, not executed).` : '.')
    + (notes.length ? '\n' + notes.join('\n') : '');
  setCodeEditing(false);
  // setCodeEditing(false) just hid codeStatus along with the rest of the
  // editing chrome, in the same tick this wrote the Apply summary into it.
  // Show it again so the summary and any parser notes are actually readable
  // under the read-only pane. The next edit session overwrites this text.
  codeStatus.hidden = false;
};

function countNodes(list) {
  let n = 0;
  for (const c of list || []) n += 1 + countNodes(c.children);
  return n;
}

function countType(list, type) {
  let n = 0;
  for (const c of list || []) n += (c.type === type ? 1 : 0) + countType(c.children, type);
  return n;
}

// ---------- the C++ editor ----------
// Enough of an IDE to be usable: highlighting under the caret, Tab that
// indents instead of leaving the field, and indentation that follows braces.

const codeEditHl = document.getElementById('codeEditHl');
const codeEditWrap = document.getElementById('codeEditWrap');
const INDENT = '    ';

function paintCodeEditor() {
  // trailing newline keeps the last line's box alive so the two layers agree
  codeEditHl.innerHTML = highlightCpp(codeEdit.value) + '\n';
  codeEditHl.scrollTop = codeEdit.scrollTop;
  codeEditHl.scrollLeft = codeEdit.scrollLeft;
}

codeEdit.addEventListener('input', () => { paintCodeEditor(); scheduleCodeIntel(); });
codeEdit.addEventListener('scroll', () => {
  codeEditHl.scrollTop = codeEdit.scrollTop;
  codeEditHl.scrollLeft = codeEdit.scrollLeft;
  if (!complEl.hidden) placeCompletions();
});

// ---------- lint, signature hint and completion ----------
// The point of all three is that this pane is where you hand-write C++ that has
// to survive Apply. Everything unrecognized is preserved, so these read as
// advice rather than as gates: nothing here blocks applying.

const lintEl = document.getElementById('codeLint');
const sigEl = document.getElementById('codeSig');
const complEl = document.getElementById('codeCompl');
// The name list is PROFILE.docs.names now: deriving it from the doc map is
// profile knowledge (which map, which casing), and it was the second
// derivation W1 found living in the shell after the parser assembly.
let lintDiags = [];
let intelTimer = null;
let compl = null;          // { from, to, items, index }

// Every ImGui call the parser turns into a widget, so the lint can say which
// ones it will instead keep verbatim.
const modelledCalls = new Set(Object.keys((PROFILE.parser && PROFILE.parser.schema) || {}));
// A profile without a parser has no Edit flow, which the contract calls a
// missing feature rather than an error. The button follows the profile.
if (!PROFILE.parser && editBtn) editBtn.hidden = true;

function scheduleCodeIntel() {
  clearTimeout(intelTimer);
  intelTimer = setTimeout(runCodeIntel, 200);
  updateCompletions();
}

function runCodeIntel() {
  if (!codeEditing) return;
  lintDiags = lintCpp(codeEdit.value, {
    sigs: PROFILE.docs.sigs, names: PROFILE.docs.names, modelled: modelledCalls,
  });
  renderLint();
  renderSignature();
}

function renderLint() {
  lintEl.innerHTML = '';
  lintEl.hidden = !codeEditing;
  const errs = lintDiags.filter(d => d.level === 'error').length;
  const warns = lintDiags.filter(d => d.level === 'warn').length;
  applyBtn.textContent = errs ? `Apply (${errs} error${errs > 1 ? 's' : ''})` : 'Apply';
  applyBtn.title = errs
    ? 'Applies anyway. Anything that cannot be read as a widget is kept verbatim.'
    : 'Parse this C++ back into the document';
  if (!lintDiags.length) {
    const ok = document.createElement('div');
    ok.className = 'lclean';
    ok.textContent = 'No problems found.';
    lintEl.appendChild(ok);
    return;
  }
  const ICON = { error: '✕', warn: '!', info: 'i' };
  for (const d of lintDiags) {
    const row = document.createElement('div');
    row.className = 'ld ' + d.level;
    row.onclick = () => jumpToCodeLine(d.line);
    const ic = document.createElement('span');
    ic.className = 'lic';
    ic.textContent = ICON[d.level];
    const at = document.createElement('span');
    at.className = 'lat';
    at.textContent = d.line + ':' + d.col;
    const msg = document.createElement('span');
    msg.className = 'lmsg';
    msg.textContent = d.msg;
    row.append(ic, at, msg);
    if (d.fix) {
      const fix = document.createElement('button');
      fix.className = 'lfix';
      fix.textContent = d.fix.label;
      fix.onclick = e => { e.stopPropagation(); applyLintFix(d.fix); };
      row.appendChild(fix);
    }
    lintEl.appendChild(row);
  }
  if (lintDiags.more > 0) {
    const more = document.createElement('div');
    more.className = 'lclean';
    more.textContent = `…and ${lintDiags.more} more.`;
    lintEl.appendChild(more);
  }
}

function applyLintFix(fix) {
  codeEdit.focus();
  replaceRange(fix.from, fix.to, fix.text, fix.from + fix.text.length);
  runCodeIntel();
}

function jumpToCodeLine(line) {
  const v = codeEdit.value;
  let at = 0;
  for (let i = 1; i < line; i++) {
    const nl = v.indexOf('\n', at);
    if (nl < 0) break;
    at = nl + 1;
  }
  const end = v.indexOf('\n', at);
  codeEdit.focus();
  codeEdit.setSelectionRange(at, end < 0 ? v.length : end);
  // center the line rather than leaving it against an edge
  const lh = lineHeightOf();
  codeEdit.scrollTop = Math.max(0, (line - 1) * lh - codeEdit.clientHeight / 2);
  paintCodeEditor();
  renderSignature();
}

let metrics = null;
function editorMetrics() {
  if (metrics) return metrics;
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(40);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:13px/1.5 var(--font)';
  document.body.appendChild(probe);
  const r = probe.getBoundingClientRect();
  metrics = { charW: r.width / 40, lineH: r.height };
  probe.remove();
  return metrics;
}
const lineHeightOf = () => editorMetrics().lineH;

function renderSignature() {
  const hit = codeEditing
    ? signatureAt(codeEdit.value, codeEdit.selectionStart, PROFILE.docs.sigs) : null;
  sigEl.hidden = !hit;
  if (!hit) return;
  // underline the argument the caret is on, so a long list stays readable
  const open = hit.sig.indexOf('(');
  const head = hit.sig.slice(0, open + 1);
  const args = splitSigArgs(hit.sig.slice(open + 1, hit.sig.lastIndexOf(')')));
  sigEl.innerHTML = '';
  const b = document.createElement('b');
  b.textContent = head;
  sigEl.appendChild(b);
  args.forEach((a, i) => {
    const span = document.createElement('span');
    if (i === hit.arg) span.className = 'arg';
    span.textContent = a + (i < args.length - 1 ? ', ' : '');
    sigEl.appendChild(span);
  });
  sigEl.appendChild(document.createTextNode(')' + (hit.note ? '   // ' + hit.note : '')));
}

function splitSigArgs(text) {
  const out = [];
  let d = 0, start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if ('([{'.includes(c)) d++;
    else if (')]}'.includes(c)) d--;
    else if (c === ',' && !d) { out.push(text.slice(start, i).trim()); start = i + 1; }
  }
  const last = text.slice(start).trim();
  if (last) out.push(last);
  return out;
}

function updateCompletions() {
  if (!codeEditing) return hideCompletions();
  // Only after `ImGui::` or `state.` while typing. Offering something for every
  // three-letter word would put a popup over the code constantly. Ctrl+Space is
  // there for when you do want it on a bare word.
  const hit = completionAt(codeEdit.value, codeEdit.selectionStart,
    { sigs: PROFILE.docs.sigs, bare: false });
  if (!hit) return hideCompletions();
  // A caret event re-runs this, so the highlighted row has to survive it.
  // Narrowing the word changes the span or the list, and then the top item wins.
  const same = compl && compl.from === hit.from && compl.to === hit.to
    && compl.items.length === hit.items.length;
  compl = { ...hit, index: same ? compl.index : 0 };
  renderCompletions();
}

function renderCompletions() {
  complEl.innerHTML = '';
  complEl.hidden = false;
  compl.items.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'ci' + (i === compl.index ? ' on' : '');
    const n = document.createElement('span');
    n.className = 'cname';
    n.textContent = it.name;
    row.appendChild(n);
    const sig = document.createElement('span');
    sig.className = 'csig';
    sig.textContent = it.note || it.sig;
    row.appendChild(sig);
    // mousedown, not click: the editor must not lose the caret first
    row.addEventListener('mousedown', e => {
      if (e.button !== 0) return;      // a right-click must not rewrite the code
      e.preventDefault();
      compl.index = i;
      acceptCompletion();
    });
    complEl.appendChild(row);
  });
  placeCompletions();
}

function placeCompletions() {
  const { charW, lineH } = editorMetrics();
  const v = codeEdit.value;
  const upto = v.slice(0, compl.from);
  const line = upto.split('\n').length;
  const col = compl.from - (upto.lastIndexOf('\n') + 1);
  const pad = 12;
  let x = pad + col * charW - codeEdit.scrollLeft;
  let y = pad + line * lineH - codeEdit.scrollTop;
  const wrapH = codeEditWrap.clientHeight;
  complEl.style.left = Math.max(0, Math.min(x, codeEditWrap.clientWidth - 240)) + 'px';
  // flip above the caret when there is no room below
  if (y + complEl.offsetHeight > wrapH && y - lineH - complEl.offsetHeight > 0) {
    complEl.style.top = (y - lineH - complEl.offsetHeight) + 'px';
  } else {
    complEl.style.top = Math.max(0, Math.min(y, wrapH - 40)) + 'px';
  }
}

function hideCompletions() {
  compl = null;
  complEl.hidden = true;
}

function moveCompletion(delta) {
  compl.index = (compl.index + delta + compl.items.length) % compl.items.length;
  renderCompletions();
  const on = complEl.querySelector('.ci.on');
  if (on) on.scrollIntoView({ block: 'nearest' });
}

function acceptCompletion() {
  const it = compl.items[compl.index];
  const { from, to, kind, withPrefix } = compl;
  hideCompletions();
  // a function gets its parentheses too, with the caret between them
  const text = kind === 'fn'
    ? (withPrefix ? 'ImGui::' : '') + it.name + '()'
    : it.name;
  const caret = kind === 'fn' ? from + text.length - 1 : from + text.length;
  replaceRange(from, to, text, caret);
  renderSignature();
}

// the caret can also move without an input event
for (const ev of ['keyup', 'click', 'focus']) {
  codeEdit.addEventListener(ev, () => {
    renderSignature();
    if (compl) updateCompletions();
  });
}
codeEdit.addEventListener('blur', hideCompletions);

// insertText keeps the browser's own undo stack intact, which setRangeText
// throws away. It quietly does nothing when the field isn't really focused,
// so the result is checked rather than the return value trusted.
function replaceRange(from, to, text, selStart, selEnd) {
  const was = codeEdit.value;
  codeEdit.setSelectionRange(from, to);
  let ok = false;
  try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
  if (!ok || codeEdit.value === was) codeEdit.setRangeText(text, from, to, 'end');
  if (selStart !== undefined) codeEdit.setSelectionRange(selStart, selEnd === undefined ? selStart : selEnd);
  paintCodeEditor();
}

const lineStartAt = (v, i) => v.lastIndexOf('\n', i - 1) + 1;
const indentOf = line => (line.match(/^[ \t]*/) || [''])[0];

// Returns true when it took the key, which is the signal to stop it going any
// further. Anything it doesn't claim types normally.
function handleCodeEditorKey(e) {
  // Ctrl+Space asks for the picker where typing alone would not have offered it
  if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
    e.preventDefault();
    const hit = completionAt(codeEdit.value, codeEdit.selectionStart,
      { sigs: PROFILE.docs.sigs, bare: true });
    if (hit) { compl = { ...hit, index: 0 }; renderCompletions(); }
    return true;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return false;

  // While the picker is open it owns the arrows, Enter, Tab and Escape. Escape
  // closes the picker only: the editor stays open, which is what you want when
  // the picker appeared while you were mid-word.
  if (compl) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveCompletion(1); return true; }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveCompletion(-1); return true; }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); acceptCompletion(); return true; }
    if (e.key === 'Escape') { e.preventDefault(); hideCompletions(); return true; }
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    // A reflex Escape used to discard typed C++ with no way back. Only ask
    // when there is actually something to lose, so closing an untouched
    // editor still takes one keystroke.
    if (codeEdit.value !== codeEditSnapshot) {
      askConfirm('Discard the C++ you typed and close the editor?', () => setCodeEditing(false));
    } else {
      setCodeEditing(false);
    }
    return true;
  }
  const v = codeEdit.value;
  const s = codeEdit.selectionStart, t = codeEdit.selectionEnd;

  if (e.key === 'Tab') {
    e.preventDefault();
    const multi = v.slice(s, t).includes('\n');
    if (!multi && !e.shiftKey) { replaceRange(s, t, INDENT, s + INDENT.length); return true; }
    // block indent or outdent, keeping the whole span selected afterwards
    const from = lineStartAt(v, s);
    const to = v.indexOf('\n', t) === -1 ? v.length : v.indexOf('\n', t);
    const lines = v.slice(from, to).split('\n');
    const out = lines.map(l => {
      if (!e.shiftKey) return INDENT + l;
      if (l.startsWith(INDENT)) return l.slice(INDENT.length);
      return l.replace(/^[ \t]{1,4}/, '');
    });
    const text = out.join('\n');
    replaceRange(from, to, text, from, from + text.length);
    return true;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const ls = lineStartAt(v, s);
    const line = v.slice(ls, s);
    let ind = indentOf(line);
    // opening a block indents the next line, and a closing brace already
    // waiting on the right gets pushed onto its own line below
    const opens = /[{(]\s*$/.test(line.trimEnd());
    const closesNext = /^\s*[}\)]/.test(v.slice(t));
    if (opens) {
      const inner = ind + INDENT;
      if (closesNext) {
        const text = '\n' + inner + '\n' + ind;
        replaceRange(s, t, text, s + 1 + inner.length);
      } else {
        replaceRange(s, t, '\n' + inner, s + 1 + inner.length);
      }
      return true;
    }
    replaceRange(s, t, '\n' + ind, s + 1 + ind.length);
    return true;
  }

  // typing a closing brace pulls its line back out one level
  if (e.key === '}' && s === t) {
    const ls = lineStartAt(v, s);
    const before = v.slice(ls, s);
    if (/^[ \t]+$/.test(before) && before.length >= INDENT.length) {
      e.preventDefault();
      const ind = before.slice(0, before.length - INDENT.length);
      replaceRange(ls, s, ind + '}', ls + ind.length + 1);
      return true;
    }
    return false;
  }

  // Backspace at the head of a line eats a whole indent level
  if (e.key === 'Backspace' && s === t) {
    const ls = lineStartAt(v, s);
    const before = v.slice(ls, s);
    if (before.length && /^[ \t]+$/.test(before) && before.length % INDENT.length === 0) {
      e.preventDefault();
      replaceRange(s - INDENT.length, s, '', s - INDENT.length);
      return true;
    }
  }
  return false;
}

// A sameline flag on a first child is suppressed at render and emit time
// rather than deleted from the model: deleting it meant a transient reorder
// through index 0 silently destroyed the join.

// rebuildProps=false keeps focus in the inspector while typing, and doubles
// as the history coalescing signal: bursty property edits merge into one
// undo step, discrete operations each get their own. `prop` names which field
// is bursting, so a coalescing caller only merges into an entry left by the
// SAME field: without it, typing Max then Width on one widget inside a
// second merged into a single undo step.
function refresh(rebuildProps = true, prop) {
  renderTree();
  if (rebuildProps) renderProps();
  renderCode();
  pushDoc();
  saveLocal();
  pushHistory(!rebuildProps, prop);
  // The pane holds a snapshot taken when editing started. If the document moves
  // on underneath it, say so: Apply reads the text, so it would otherwise throw
  // away the newer canvas edits without a word.
  if (codeEditing) markCodeStale();
}

document.getElementById('filter').oninput = renderPalette;


document.getElementById('copyBtn').onclick = () => copyText(PROFILE.generate(), 'C++');

