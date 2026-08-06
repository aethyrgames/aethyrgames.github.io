// The editor seam's one implementation: the <textarea> this studio has always
// shipped, with a highlighted <pre> painted underneath it.
//
// Both layers use identical metrics so the glyphs line up exactly, and the
// textarea on top keeps real caret, selection, browser undo and IME behaviour,
// which is the whole reason this beats drawing the editor from scratch.
//
// This file is the ONLY one in app/ that knows the editing surface is a
// textarea, or that #codeEdit and #codeEditHl exist. Everything else goes
// through app/editor-api.js. If you are reading this because you are replacing
// it, the shape to copy is at the bottom: create() and themeRules(), handed to
// registerEditorImpl under a new name.

const TEXTAREA_EDITOR_INDENT = '    ';

// The gutter both layers carry, from #codeEditHl / #codeEdit in index.html.
// The picker's placement is measured against it, so the two have to agree or
// the popup lands off the caret by a pad.
const TEXTAREA_EDITOR_PAD = 12;

// Character width and line height of the editing font, measured once from a
// throwaway span rather than assumed. Cached across instances: the font is a
// page constant and measuring it costs a forced layout.
let textareaEditorMetrics = null;
function measureTextareaEditor() {
  if (textareaEditorMetrics) return textareaEditorMetrics;
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(40);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:13px/1.5 var(--font)';
  document.body.appendChild(probe);
  const r = probe.getBoundingClientRect();
  textareaEditorMetrics = { charW: r.width / 40, lineH: r.height };
  probe.remove();
  return textareaEditorMetrics;
}

function createTextareaEditor(opts) {
  const o = opts || {};
  const host = o.host;
  // By id, deliberately. This is the file the ids belong to, and resolving them
  // here is what lets every other file ask for text and offsets instead.
  const ta = document.getElementById('codeEdit');
  const hl = document.getElementById('codeEditHl');
  const highlight = o.highlight || (text => text);
  // Kept, not drawn. A textarea has no decoration layer of its own: the
  // highlight <pre> under it is regenerated wholesale from the highlighter on
  // every keystroke, so there is nowhere to hang a squiggle without rewriting
  // the painter. The pane draws the problem list itself today. An editor with a
  // document model would push these straight into its own lint extension, which
  // is why the call is in the interface rather than in the pane.
  let diagnostics = [];

  function paint() {
    // trailing newline keeps the last line's box alive so the two layers agree
    hl.innerHTML = highlight(ta.value) + '\n';
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
  }

  const onInput = () => {
    paint();
    if (o.onChange) o.onChange();
  };
  const onScroll = () => {
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
    if (o.onScroll) o.onScroll();
  };
  const onCursor = () => { if (o.onCursor) o.onCursor(); };
  const onBlur = () => { if (o.onBlur) o.onBlur(); };

  ta.addEventListener('input', onInput);
  ta.addEventListener('scroll', onScroll);
  // the caret can also move without an input event
  for (const ev of ['keyup', 'click', 'focus']) ta.addEventListener(ev, onCursor);
  ta.addEventListener('blur', onBlur);

  if (o.initialValue !== undefined) {
    ta.value = o.initialValue;
    paint();
  }

  // insertText keeps the browser's own undo stack intact, which setRangeText
  // throws away. It quietly does nothing when the field isn't really focused,
  // so the result is checked rather than the return value trusted.
  function replaceRange(from, to, text, selStart, selEnd) {
    const was = ta.value;
    ta.setSelectionRange(from, to);
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
    if (!ok || ta.value === was) ta.setRangeText(text, from, to, 'end');
    if (selStart !== undefined) ta.setSelectionRange(selStart, selEnd === undefined ? selStart : selEnd);
    paint();
  }

  // Returns true when it took the key, which is the signal to stop it going any
  // further. Anything it doesn't claim types normally. Only plain-text editing
  // lives here: the completion picker and the editor's own Escape belong to the
  // pane, which gets first refusal before this is reached.
  //
  // The rules themselves are editorPlainTextKey in app/editor-api.js, shared
  // with the CodeMirror implementation. What is left here is the part that is
  // genuinely a textarea's: where the text and the selection come from.
  // claimBackspace is off, because a textarea's own Backspace already deletes
  // the right thing and keeps the browser's undo entry for it.
  function handleKey(e) {
    return editorPlainTextKey(e, {
      text: ta.value,
      from: ta.selectionStart,
      to: ta.selectionEnd,
      indent: TEXTAREA_EDITOR_INDENT,
      replaceRange,
      claimBackspace: false,
    });
  }

  const lineOf = offset => {
    let n = 1;
    for (let i = 0; i < offset && i < ta.value.length; i++) if (ta.value[i] === '\n') n++;
    return n;
  };

  return {
    getValue: () => ta.value,
    setValue(v) {
      // No change event. This is the pane replacing the document, not the user
      // typing, and firing onChange here would queue a live-preview parse of
      // text nobody edited.
      ta.value = v;
      paint();
    },
    focus: () => ta.focus(),
    owns: node => node === ta,
    getCursorOffset: () => ta.selectionStart,
    setCursorOffset(from, to) {
      ta.setSelectionRange(from, to === undefined ? from : to);
    },
    replaceRange,
    revealOffset(offset) {
      // centre it rather than leaving it against an edge
      const { lineH } = measureTextareaEditor();
      ta.scrollTop = Math.max(0, (lineOf(offset) - 1) * lineH - ta.clientHeight / 2);
      paint();
    },
    coordsAtOffset(offset) {
      const { charW, lineH } = measureTextareaEditor();
      const upto = ta.value.slice(0, offset);
      const line = upto.split('\n').length;
      const col = offset - (upto.lastIndexOf('\n') + 1);
      const top = TEXTAREA_EDITOR_PAD + (line - 1) * lineH - ta.scrollTop;
      return {
        x: TEXTAREA_EDITOR_PAD + col * charW - ta.scrollLeft,
        top,
        bottom: top + lineH,
        lineHeight: lineH,
      };
    },
    viewport: () => ({ width: host.clientWidth, height: host.clientHeight }),
    handleKey,
    setDiagnostics(list) { diagnostics = list || []; },
    getDiagnostics: () => diagnostics,
    destroy() {
      ta.removeEventListener('input', onInput);
      ta.removeEventListener('scroll', onScroll);
      for (const ev of ['keyup', 'click', 'focus']) ta.removeEventListener(ev, onCursor);
      ta.removeEventListener('blur', onBlur);
    },
  };
}

// This editor's own theme rules. The read-only pane's live in theme.js; the
// edit layer is the same highlighter, so it takes the same token colours, and
// the caret and the two backgrounds are this implementation's alone.
function textareaEditorThemeRules(theme, tokenSlots, italics) {
  const rules = [
    '#codeEditHl { background: ' + theme.bg + '; color: ' + theme.fg + '; }',
    '#codeEditWrap { background: ' + theme.bg + '; }',
    '#codeEdit { caret-color: ' + theme.fg + '; }',
  ];
  for (const [cls, col] of Object.entries(tokenSlots)) {
    rules.push('#codeEditHl .' + cls
      + ' { color: ' + col + '; font-style: ' + (italics.has(cls) ? 'italic' : 'normal') + '; }');
  }
  return rules;
}

registerEditorImpl('textarea', {
  create: createTextareaEditor,
  themeRules: textareaEditorThemeRules,
});
