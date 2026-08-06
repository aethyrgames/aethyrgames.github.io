// The editor seam: the interface this repo owns for the C++ editing surface.
//
// app/codepane.js used to BE the editor. It held the textarea, the highlight
// layer under it, the Tab that indents, the brace-following Enter and the
// metrics probe that places the completion picker. All of that is one
// replaceable component wearing the pane's clothes, and swapping it (for
// CodeMirror, for a canvas editor, for anything) meant rewriting the pane.
//
// So the pane talks to THIS and to nothing else. The calls below are the whole
// contract, chosen because the pane actually makes every one of them:
//
//   getValue()                the text, as the user has it right now
//   setValue(v)              replace the text wholesale, no change event
//   focus()                  put the caret back in the editor
//   owns(node)               is that DOM node this editor's input surface
//   getCursorOffset()        caret as a character offset
//   setCursorOffset(f, t)    move the caret, or select f..t when t is given
//   replaceRange(f,t,text,selFrom,selTo)   one edit, undo stack intact
//   revealOffset(off)        scroll so that offset is on screen, centred
//   coordsAtOffset(off)      { x, top, bottom, lineHeight } in host pixels
//   viewport()               { width, height } of the host box, in pixels
//   handleKey(e)             plain-text editing keys, true when it took one
//   setDiagnostics(list)     the current problems, for whatever the editor
//                            can draw with them
//   getDiagnostics()         them back again
//   destroy()                unhook everything
//
// Offsets, not line and column. It is the one addressing scheme that survives
// a swap: a textarea and a document-model editor disagree about what a line is,
// and neither disagrees about a character index. The pane derives line and
// column itself, in the one place that has to agree with the text.
//
// A DIAGNOSTIC, the shape setDiagnostics takes and app/lang-api.js produces:
//
//   { from, to, severity, message, fix }
//
//   from, to    character offsets. to === from marks a position rather than
//               a span, which is all a line-oriented linter can honestly say
//   severity    'error' | 'warning' | 'info'
//   message     one sentence, shown to the user as written
//   fix         optional { from, to, text, label }: a one-click edit and the
//               words on its button
//
// The OPTIONS createEditor takes:
//
//   host          the element the editor mounts into and measures against
//   initialValue  the text to open with
//   highlight     text -> HTML, supplied by the language service. An editor
//                 that colours its own text may ignore it
//   onChange      the text changed because the user changed it
//   onCursor      the caret moved without the text changing
//   onScroll      the view scrolled
//   onBlur        the editor lost focus
//
// Two implementations ship and register themselves below: the textarea
// (app/editor-textarea.js) and CodeMirror 6 over the vendored bundle
// (app/editor-codemirror.js). Nothing else in app/ knows which one is mounted,
// or what either is made of.

// Implementations register here rather than being named from this file, so
// that the selection below stays one line and theme.js can reach the active
// implementation's stylesheet without naming it either.
const EDITOR_IMPLS = {};

// THE SWAP POINT. One line. A different editor means one new file that calls
// registerEditorImpl with its own name, a <script> tag for it in index.html,
// and its name put at the front of this order.
//
// An order rather than a single name because the preferred implementation can
// legitimately fail to arrive. app/editor-codemirror.js registers itself only
// when its vendored bundle loaded, so a name that never turns up in
// EDITOR_IMPLS is a file that did not load rather than one that broke, and the
// next name down answers instead. The fallback is the same mechanism as the
// choice, which is the only version of a fallback worth trusting.
//
// WHY THE TEXTAREA IS STILL IN FRONT. Both files load, both register, and the
// head of this list is what answers. CodeMirror is one word away and is not
// there yet for a measured reason rather than a nervous one: the imgui suite
// reaches #codeEdit and #codeEditHl directly in nineteen places, so putting
// 'codemirror' first turns those red without saying anything about CodeMirror.
// Moving those checks onto the seam is its own leaf, and until it lands the
// honest arrangement is the one where the swap really is one word and every
// gate still measures the editor people are typing into.
const EDITOR_IMPL_ORDER = ['textarea', 'codemirror'];

// Which one actually answered, as a plain string, for anything that wants to
// report on the page rather than drive it. It is resolved on every ask instead
// of written down here because implementations register from their own <script>
// tags, and those run after this file does: at this line nothing has registered
// yet and the honest value is "no one has asked".
let EDITOR_IMPL = '';

function registerEditorImpl(name, impl) {
  EDITOR_IMPLS[name] = impl;
}

function activeEditorImpl() {
  EDITOR_IMPL = EDITOR_IMPL_ORDER.find(name => EDITOR_IMPLS[name]) || '';
  const impl = EDITOR_IMPLS[EDITOR_IMPL];
  // Loud rather than undefined-shaped. No implementation at all is a load-order
  // mistake in index.html, and the alternative is a TypeError three calls later
  // with nothing in it that names the cause.
  if (!impl) {
    throw new Error(`no editor implementation registered as any of ${EDITOR_IMPL_ORDER.join(', ')}`);
  }
  return impl;
}

function createEditor(opts) {
  return activeEditorImpl().create(opts);
}

// The plain-text editing keys, once, for implementations to call from their own
// handleKey.
//
// NOT part of the contract at the top of this file. The pane never sees it: it
// is a helper offered TO implementations, and it lives here rather than in
// either of them because both need it and neither owns it. Both had their own
// copy when the CodeMirror implementation arrived, ninety near-identical lines
// apart, which is the shape a behaviour drifts through: fix the Enter rule in
// one editor and the other keeps the old one, with no gate able to tell.
//
// Everything it touches is this seam's own vocabulary, the text, two offsets
// and replaceRange, so it knows nothing about a textarea or a document model.
// `ed` is:
//
//   text        the whole document, as the editor has it right now
//   from, to    the selection, low end first
//   indent      what one level is, as a string
//   replaceRange   the implementation's own, same signature as the contract
//   claimBackspace true to take EVERY Backspace rather than only the one that
//                  eats an indent level. A textarea can leave the ordinary
//                  case to the browser; a contenteditable cannot, because
//                  app/keys.js stops the keydown at the window and the only
//                  Backspace CodeMirror would otherwise see is a DOM mutation
//                  arriving after the fact.
//
// Returns true when it took the key, which is the signal to stop it going any
// further. Anything it doesn't claim types normally.
function editorPlainTextKey(e, ed) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  const v = ed.text;
  const s = ed.from;
  const t = ed.to;
  const INDENT = ed.indent;
  const replaceRange = ed.replaceRange;
  const lineStartAt = (text, i) => text.lastIndexOf('\n', i - 1) + 1;
  const indentOf = line => (line.match(/^[ \t]*/) || [''])[0];

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
    const ind = indentOf(line);
    // opening a block indents the next line, and a closing brace already
    // waiting on the right gets pushed onto its own line below
    const opens = /[{(]\s*$/.test(line.trimEnd());
    const closesNext = /^\s*[}\)]/.test(v.slice(t));
    if (opens) {
      const inner = ind + INDENT;
      if (closesNext) {
        replaceRange(s, t, '\n' + inner + '\n' + ind, s + 1 + inner.length);
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

  if (e.key === 'Backspace') {
    // Backspace at the head of a line eats a whole indent level, in both
    // implementations, because that is the one case the browser gets wrong.
    if (s === t) {
      const ls = lineStartAt(v, s);
      const before = v.slice(ls, s);
      if (before.length && /^[ \t]+$/.test(before) && before.length % INDENT.length === 0) {
        e.preventDefault();
        replaceRange(s - INDENT.length, s, '', s - INDENT.length);
        return true;
      }
    }
    if (!ed.claimBackspace) return false;
    // nothing behind the caret, so let it fall through and do nothing
    if (s === t && !s) return false;
    e.preventDefault();
    let back = s;
    if (s === t) {
      // one code point, not one code unit, so an emoji inside a string literal
      // dies in one press instead of leaving half a pair behind
      back = s - (s >= 2 && v.codePointAt(s - 2) > 0xffff ? 2 : 1);
    }
    replaceRange(back, t, '', back);
    return true;
  }
  return false;
}

// The theme rules for whatever the editor's own surfaces are. app/theme.js owns
// the read-only pane and the token palette it shares; the editing surface's
// backgrounds, caret and token colours belong to the implementation, which is
// why they are asked for rather than written there. Called at page load, before
// any editor instance exists, so this is a plain function on the implementation
// rather than a method on an editor.
function editorThemeRules(theme, tokenSlots, italics) {
  return activeEditorImpl().themeRules(theme, tokenSlots, italics);
}
