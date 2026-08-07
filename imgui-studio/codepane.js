// The generated-C++ pane: applying an edit back into the document, and the
// lint, signature hint and completion picker drawn around the editing surface.
//
// One of the classic scripts index.html loads in order. They share a single
// global scope, so a name declared in an earlier one is visible here, and the
// load order in index.html is the dependency order.
//
// Two seams and nothing under them. This file used to hold the textarea and
// call app/cpp.js and app/codeintel.js by name; now it asks LANG what the text
// means and EDITOR what the user is doing to it, and neither answer tells it
// what either is made of. See app/editor-api.js and app/lang-api.js.

// ---------- editing the generated C++ ----------

let codeEditing = false;
// The C++ this editing session started from, either the last text generated
// from the canvas or whatever a Reload just pulled in. markCodeStale and the
// Escape guard below both compare against this rather than against the live
// editor text: generating is what changes the document's C++, typing is not,
// and the two must not be read as the same signal.
let codeEditSnapshot = '';
// The parser is assembled by the PROFILE, not here: which factory builds it
// and from which catalog is exactly the kind of knowledge W1 moved out of the
// shell. This file only asks LANG, and a language that cannot parse means the
// Edit flow is absent, not broken.
const codeEl = document.getElementById('code');
const codeStatus = document.getElementById('codeStatus');
const editBtn = document.getElementById('editCodeBtn');
const applyBtn = document.getElementById('applyCodeBtn');
const cancelBtn = document.getElementById('cancelCodeBtn');
const reloadBtn = document.getElementById('reloadCodeBtn');

// The language service for this page, and the editing surface mounted in the
// pane's own box. Both are created here and never reached around: everything
// below talks offsets and text.
const LANG = createLanguage(PROFILE.id);
const codeEditorHost = document.getElementById('codeEditWrap');
const EDITOR = createEditor({
  host: codeEditorHost,
  initialValue: '',
  highlight: text => LANG.highlight(text),
  onChange: () => { scheduleCodeIntel(); scheduleLivePreview(); },
  onCursor: () => { renderSignature(); if (compl) updateCompletions(); },
  onScroll: () => { if (!complEl.hidden) placeCompletions(); },
  onBlur: () => hideCompletions(),
});

let livePreviewTimer = 0;
function setCodeEditing(on) {
  codeEditing = on;
  // A pending live-preview parse belongs to the editing session that queued
  // it. Left running, it fires a quarter of a second after Cancel and applies
  // the text the user just discarded, or overwrites a canvas edit made in the
  // meantime. It cost an imgui check a dragged window position before anyone
  // noticed the timer outliving its editor.
  if (!on && livePreviewTimer) { clearTimeout(livePreviewTimer); livePreviewTimer = 0; }
  codeEl.hidden = on;
  codeEditorHost.hidden = !on;
  codeStatus.hidden = !on;
  editBtn.hidden = on;
  applyBtn.hidden = !on;
  cancelBtn.hidden = !on;
  reloadBtn.hidden = true;   // only offered once the document actually moves on
  if (on) {
    EDITOR.setValue(PROFILE.generate());
    codeEditSnapshot = EDITOR.getValue();
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
    EDITOR.focus();
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
  // started, not against the editor's text. Comparing to the editor made the
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
    result = LANG.parse(EDITOR.getValue(), nextId);
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

// ---------- the live preview ----------

// Live preview while typing. Only a CLEAN parse touches the document, so a
// half-typed line leaves the last good preview standing instead of blanking
// the canvas, which is the same promise Apply makes on a parse failure.
//
// Deliberately NOT refresh(): that regenerates the pane, marks the editor
// stale against its own snapshot, saves, and pushes an undo entry, none of
// which belong to a keystroke. This updates the tree and the engine and
// nothing else, so Apply remains the commit and undo still steps by edit
// rather than by character.
function scheduleLivePreview() {
  if (!LANG.canParse) return;
  if (livePreviewTimer) clearTimeout(livePreviewTimer);
  livePreviewTimer = setTimeout(() => {
    livePreviewTimer = 0;
    if (!codeEditing) return;
    let result;
    try { result = LANG.parse(EDITOR.getValue(), nextId); } catch (err) { return; }
    if (!result || !Array.isArray(result.windows) || !result.windows.length) return;
    const ids = new Set(['root']);
    const cleaned = sanitize(result.windows, ids, true);
    if (!cleaned.length) return;
    nextId = Math.max(nextId, result.nextId);
    doc.children = cleaned;
    if (result.pre) doc.pre = result.pre; else delete doc.pre;
    if (result.post) doc.post = result.post; else delete doc.post;
    renderTree();
    pushDoc();
  }, 250);
}

// ---------- lint, signature hint and completion ----------
// The point of all three is that this pane is where you hand-write C++ that has
// to survive Apply. Everything unrecognized is preserved, so these read as
// advice rather than as gates: nothing here blocks applying.

const lintEl = document.getElementById('codeLint');
const sigEl = document.getElementById('codeSig');
const complEl = document.getElementById('codeCompl');
let lintDiags = [];
let intelTimer = null;
let compl = null;          // { from, to, items, index }

// A language that cannot parse has no Edit flow, which the contract calls a
// missing feature rather than an error. The button follows the language.
if (!LANG.canParse && editBtn) editBtn.hidden = true;

function scheduleCodeIntel() {
  clearTimeout(intelTimer);
  intelTimer = setTimeout(runCodeIntel, 200);
  updateCompletions();
}

function runCodeIntel() {
  if (!codeEditing) return;
  lintDiags = LANG.diagnostics(EDITOR.getValue());
  EDITOR.setDiagnostics(lintDiags);
  renderLint();
  renderSignature();
}

// The seam speaks offsets, and the problem list shows "12:5". This is the one
// place that has to agree with the text about where a line begins, which is
// exactly why it is not spread across the pane, the editor and the language.
function lineColAt(text, offset) {
  const head = text.slice(0, Math.max(0, offset));
  return { line: head.split('\n').length, col: offset - (head.lastIndexOf('\n') + 1) + 1 };
}

const DIAG_CLASS = { error: 'error', warning: 'warn', info: 'info' };
const DIAG_ICON = { error: '✕', warning: '!', info: 'i' };

function renderLint() {
  lintEl.innerHTML = '';
  lintEl.hidden = !codeEditing;
  const text = EDITOR.getValue();
  const errs = lintDiags.filter(d => d.severity === 'error').length;
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
  for (const d of lintDiags) {
    const where = lineColAt(text, d.from);
    const row = document.createElement('div');
    row.className = 'ld ' + (DIAG_CLASS[d.severity] || 'info');
    row.onclick = () => jumpToCodeOffset(d.from);
    const ic = document.createElement('span');
    ic.className = 'lic';
    ic.textContent = DIAG_ICON[d.severity] || 'i';
    const at = document.createElement('span');
    at.className = 'lat';
    at.textContent = where.line + ':' + where.col;
    const msg = document.createElement('span');
    msg.className = 'lmsg';
    msg.textContent = d.message;
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
  EDITOR.focus();
  EDITOR.replaceRange(fix.from, fix.to, fix.text, fix.from + fix.text.length);
  runCodeIntel();
}

// Select the whole line the offset falls on and centre it, so clicking a
// problem in the list puts you on the code that caused it.
function jumpToCodeOffset(offset) {
  const v = EDITOR.getValue();
  const at = v.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
  const end = v.indexOf('\n', at);
  EDITOR.focus();
  EDITOR.setCursorOffset(at, end < 0 ? v.length : end);
  EDITOR.revealOffset(at);
  renderSignature();
}

function renderSignature() {
  const hit = codeEditing
    ? LANG.signature(EDITOR.getValue(), EDITOR.getCursorOffset()) : null;
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
  const hit = LANG.completions(EDITOR.getValue(), EDITOR.getCursorOffset(), { bare: false });
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
  const at = EDITOR.coordsAtOffset(compl.from);
  const view = EDITOR.viewport();
  complEl.style.left = Math.max(0, Math.min(at.x, view.width - 240)) + 'px';
  // flip above the caret when there is no room below
  if (at.bottom + complEl.offsetHeight > view.height && at.top - complEl.offsetHeight > 0) {
    complEl.style.top = (at.top - complEl.offsetHeight) + 'px';
  } else {
    complEl.style.top = Math.max(0, Math.min(at.bottom, view.height - 40)) + 'px';
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
  const hit = compl;
  const it = hit.items[hit.index];
  hideCompletions();
  // what the text becomes is the language's call, not the pane's: the
  // qualifier and the empty parentheses are facts about the language
  const ins = LANG.completionInsert(hit, it);
  EDITOR.replaceRange(hit.from, hit.to, ins.text, hit.from + ins.caret);
  renderSignature();
}

// Returns true when it took the key, which is the signal to stop it going any
// further. Anything it doesn't claim types normally.
function handleCodeEditorKey(e) {
  // Ctrl+Space asks for the picker where typing alone would not have offered it
  if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
    e.preventDefault();
    const hit = LANG.completions(EDITOR.getValue(), EDITOR.getCursorOffset(), { bare: true });
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
    if (EDITOR.getValue() !== codeEditSnapshot) {
      askConfirm('Discard the C++ you typed and close the editor?', () => setCodeEditing(false));
    } else {
      setCodeEditing(false);
    }
    return true;
  }

  // Everything left is plain text editing: the Tab that indents, the Enter that
  // follows braces, the outdenting `}` and the Backspace that eats a level.
  // That is the editing surface's own behaviour, so it decides.
  return EDITOR.handleKey(e);
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
  // Before anything renders. A column selection belongs to one table, so a
  // refresh that follows the selection moving elsewhere has to drop it, or the
  // inspector would draw a column panel for a widget that has no columns.
  syncSelectedColumn();
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
