// The editor seam's second implementation: CodeMirror 6, driven from the
// vendored bundle at app/vendor/editor.bundle.js.
//
// This file is the ONLY place in the repo where a CodeMirror or Lezer name may
// appear. Everything above it talks to app/editor-api.js in text, character
// offsets and diagnostics, none of which mention a document model, a state
// field or a transaction. Replacing CodeMirror again means one more file
// shaped like this one and one more name in the preference list at the top of
// editor-api.js.
//
// The whole thing sits inside an IIFE, which the textarea implementation does
// not need. Two reasons. Every classic script on this page shares one global
// scope, so a bare `const view` here is a page-wide name. And the constraint
// this file exists to satisfy is that nothing outside it can reach a
// CodeMirror value: a closure is the only way to say that in a language with
// no modules loaded.
//
// It registers itself ONLY when the vendor global is present. That is the
// entire fallback story: no bundle, no registration, and editor-api.js finds
// the textarea implementation instead. A studio whose editor bundle 404s still
// edits C++, just with less of a gutter.
(function () {
  const V = typeof window !== 'undefined' ? window.StudioEditorVendor : null;
  // Not an error. Absent means "the bundle did not load", which the seam
  // handles by preferring whatever else is registered.
  if (!V) return;

  const { EditorState } = V.state;
  const { EditorView, keymap } = V.view;
  const { LRLanguage, LanguageSupport, syntaxHighlighting, indentUnit } = V.language;
  const { lintGutter, setDiagnostics: cmSetDiagnostics } = V.lint;
  const { defaultKeymap, historyKeymap, history } = V.commands;
  const { tagHighlighter, tags } = V.lezer.highlight;

  // What Tab inserts and what a block indent adds, same four spaces the
  // textarea uses and the same four the generator emits.
  const INDENT = '    ';

  // The C++ language, assembled here rather than taken from @codemirror/lang-cpp
  // because the bundle carries the grammar and not the wrapper: one less
  // package to license, and the wrapper is two lines. The grammar already
  // carries its own styleTags, so the tree arrives tagged and the highlighter
  // below only has to say which slot each tag paints into.
  const cppLanguage = LRLanguage.define({ name: 'cpp', parser: V.lezer.cppParser });

  // Lezer tags to this repo's token slots, the same fourteen app/theme.js fills
  // and the same class names generate.js's read-only highlighter emits. Sharing
  // the class names is what lets one theme table paint both panes: theme.js
  // hands us `tokenSlots` keyed by these, and themeRules below turns them into
  // CSS without knowing anything about CodeMirror.
  //
  // Three places this classifies differently from the regex highlighter in
  // generate.js, because a real parse knows things a lookbehind cannot. All
  // three are colour differences between the two panes, not errors:
  //   - `ImGuiCond_FirstUseEver` and friends read as variables (c-param), not
  //     as classes. The regex claims every Capitalized word is a class.
  //   - `IM_ASSERT(x)` reads as a call (c-supfn), not a macro. MacroName only
  //     exists at the #define, which is where the grammar tags it.
  //   - `#include` gets c-macro, where the regex left it plain.
  // Tag inheritance does the rest of the work: `tags.keyword` also catches
  // controlKeyword, definitionKeyword, modifier and the others, so this list
  // stays at the size a replacement would have to match.
  const highlighter = tagHighlighter([
    { tag: tags.comment, class: 'c-com' },
    { tag: [tags.string, tags.character, tags.special(tags.string), tags.escape], class: 'c-str' },
    { tag: tags.number, class: 'c-num' },
    // true/false/nullptr/NULL, and user-defined literals
    { tag: [tags.bool, tags.null, tags.literal], class: 'c-const' },
    { tag: tags.keyword, class: 'c-kw' },
    // int/float/bool/void: the built-in types, which the grammar marks standard
    { tag: tags.standard(tags.typeName), class: 'c-type' },
    { tag: [tags.typeName, tags.className], class: 'c-class' },
    // the ImGui in ImGui::Begin, and any other namespace qualifier
    { tag: tags.namespace, class: 'c-support' },
    { tag: [tags.special(tags.name), tags.processingInstruction], class: 'c-macro' },
    { tag: tags.propertyName, class: 'c-field' },
    // a call through a member: .AutoHeight(), .Text(...)
    { tag: tags.function(tags.propertyName), class: 'c-fn' },
    // a call through a name: ImGui::Begin(), SNew(). Almost everything in this
    // pane is one of these, and c-supfn is the slot every theme colours for it.
    { tag: tags.function(tags.variableName), class: 'c-supfn' },
    // the name in `void DrawMyPanel(...)`: a definition, not a call
    { tag: tags.function(tags.definition(tags.variableName)), class: 'c-fn' },
    { tag: tags.variableName, class: 'c-param' },
    { tag: tags.operator, class: 'c-op' },
  ]);

  const clamp = (n, len) => Math.max(0, Math.min(len, Number.isFinite(n) ? Math.floor(n) : 0));

  // The seam's three severities are CodeMirror's own spelling already, but
  // going through a table means an unknown one lands somewhere valid instead of
  // making the lint field throw.
  const SEVERITY = { error: 'error', warning: 'warning', info: 'info' };

  function create(opts) {
    const o = opts || {};
    const host = o.host;

    // index.html still carries the textarea and the highlight <pre> under it:
    // one page serves both implementations and the markup describes the other
    // one. Take them out of the flow rather than leaving two editors stacked in
    // the same box. themeRules hides them in CSS as well, which covers the
    // window between page load and this factory running.
    const legacy = ['codeEdit', 'codeEditHl'].map(id => document.getElementById(id)).filter(Boolean);
    for (const el of legacy) el.style.display = 'none';

    // Kept as the pane handed them over, not read back out of CodeMirror.
    // getDiagnostics owes the caller the same objects it was given, `fix` and
    // all, and the lint field stores a translated shape with a closure on it.
    let diagnostics = [];

    // True while this file is driving a transaction that is NOT the user
    // typing. setValue and setCursorOffset both promise silence: the textarea
    // gets that for free because assigning .value and calling setSelectionRange
    // fire no events, and here it has to be said out loud. Without it, opening
    // the editor would queue a live-preview parse of text nobody edited.
    let silent = false;

    const cursorMoved = update => update.selectionSet || update.docChanged
      || (update.focusChanged && update.view.hasFocus);

    const listener = EditorView.updateListener.of(update => {
      if (silent) return;
      if (update.docChanged && o.onChange) o.onChange();
      // The textarea fires onCursor on keyup, click AND focus, so it fires
      // after typing as well as after a bare caret move. Mirrored here so the
      // signature hint and the completion picker keep the schedule they have
      // always run on.
      if (cursorMoved(update) && o.onCursor) o.onCursor();
      if (update.focusChanged && !update.view.hasFocus && o.onBlur) o.onBlur();
    });

    const extensions = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      new LanguageSupport(cppLanguage),
      syntaxHighlighting(highlighter),
      indentUnit.of(INDENT),
      EditorState.tabSize.of(INDENT.length),
      // The reason setDiagnostics is in the interface at all. The pane draws
      // its own problem list either way; this puts the same problems in the
      // margin, next to the line that caused them.
      lintGutter(),
      listener,
    ];

    const view = new EditorView({
      state: EditorState.create({ doc: o.initialValue === undefined ? '' : o.initialValue, extensions }),
      parent: host,
    });

    // Not a DOM event that bubbles, so it is taken from the scroller directly
    // rather than through CodeMirror's handler facet. The pane uses it to keep
    // the completion picker glued to the caret.
    const onScroll = () => { if (o.onScroll) o.onScroll(); };
    view.scrollDOM.addEventListener('scroll', onScroll);

    const docLen = () => view.state.doc.length;
    const getValue = () => view.state.doc.toString();

    // One edit, one history entry, and the caret where the caller asked for it.
    // Offsets in, offsets out: selStart and selEnd address the text AFTER the
    // edit, which is what every caller here computes, so they clamp against the
    // new length rather than the old one.
    function replaceRange(from, to, text, selStart, selEnd) {
      const len = docLen();
      const a = clamp(from, len);
      const b = Math.max(a, clamp(to, len));
      const ins = text === undefined ? '' : String(text);
      const after = len - (b - a) + ins.length;
      const spec = { changes: { from: a, to: b, insert: ins }, scrollIntoView: true, userEvent: 'input' };
      if (selStart !== undefined) {
        const s = clamp(selStart, after);
        spec.selection = { anchor: s, head: clamp(selEnd === undefined ? selStart : selEnd, after) };
      }
      view.dispatch(spec);
    }

    // Returns true when it took the key, which is the signal to stop it going
    // any further. Anything it doesn't claim types normally.
    //
    // The rules are editorPlainTextKey in app/editor-api.js, shared with the
    // textarea. Handling them here at all is deliberate rather than lazy:
    // app/keys.js takes the keydown on a WINDOW capture listener and calls
    // stopImmediatePropagation as soon as anything claims it, so a key this
    // declines never reaches CodeMirror's own keymap. It is stopped a phase
    // earlier, before the event has travelled down to the content. Tab is the
    // one that would be visible immediately (focus jumps to the next panel
    // instead of indenting), and Enter and Backspace would fall back to
    // whatever contenteditable does natively.
    function handleKey(e) {
      const sel = view.state.selection.main;
      return editorPlainTextKey(e, {
        text: getValue(),
        from: sel.from,
        to: sel.to,
        indent: INDENT,
        replaceRange,
        claimBackspace: true,
      });
    }

    return {
      getValue,
      setValue(v) {
        // No change event, and no undo path back into the previous editing
        // session either: a fresh state is what makes Ctrl+Z stop at the top of
        // the text the pane just generated. setState does not run update
        // listeners at all, so the silence here is structural rather than
        // guarded.
        view.setState(EditorState.create({ doc: v === undefined ? '' : String(v), extensions }));
        // The fresh state carries no lint field, so the margin is empty. Empty
        // the list that answers for it too, rather than reporting problems
        // against text that is no longer in the editor.
        diagnostics = [];
      },
      focus: () => view.focus(),
      // Anything inside the editor, not just the content element. keys.js asks
      // this about an event target, and a click can land on a gutter marker or
      // the scroller.
      owns: node => !!node && !!node.nodeType && view.dom.contains(node),
      // `from`, not `head`: a textarea's selectionStart is the low end whichever
      // way the selection was dragged, and the pane's signature and completion
      // lookups were written against that.
      getCursorOffset: () => view.state.selection.main.from,
      setCursorOffset(from, to) {
        const len = docLen();
        silent = true;
        try {
          view.dispatch({
            selection: { anchor: clamp(from, len), head: clamp(to === undefined ? from : to, len) },
          });
        } finally { silent = false; }
      },
      replaceRange,
      revealOffset(offset) {
        // centre it rather than leaving it against an edge
        view.dispatch({ effects: EditorView.scrollIntoView(clamp(offset, docLen()), { y: 'center' }) });
      },
      coordsAtOffset(offset) {
        const lineHeight = view.defaultLineHeight;
        const at = view.coordsAtPos(clamp(offset, docLen()));
        const box = host.getBoundingClientRect();
        // null means that position is not currently rendered, which the picker
        // can only hit by asking about a caret that scrolled away. Answer the
        // top-left of the box rather than throwing: a popup in the wrong corner
        // beats a dead keystroke.
        if (!at) return { x: 0, top: 0, bottom: lineHeight, lineHeight };
        return {
          x: at.left - box.left,
          top: at.top - box.top,
          bottom: at.bottom - box.top,
          lineHeight,
        };
      },
      viewport: () => ({ width: host.clientWidth, height: host.clientHeight }),
      handleKey,
      setDiagnostics(list) {
        diagnostics = list || [];
        const len = docLen();
        const translated = diagnostics.map(d => {
          const from = clamp(d.from, len);
          return {
            from,
            // to === from is a position rather than a span, which the lint
            // field draws as a marker instead of an underline. Kept as it
            // arrived: widening it would claim the language knows more about
            // where the problem ends than it said.
            to: Math.max(from, clamp(d.to === undefined ? d.from : d.to, len)),
            severity: SEVERITY[d.severity] || 'info',
            message: d.message,
            actions: d.fix
              ? [{
                name: d.fix.label,
                apply: () => replaceRange(d.fix.from, d.fix.to, d.fix.text,
                  d.fix.from + d.fix.text.length),
              }]
              : undefined,
          };
        });
        view.dispatch(cmSetDiagnostics(view.state, translated));
      },
      getDiagnostics: () => diagnostics,
      destroy() {
        view.scrollDOM.removeEventListener('scroll', onScroll);
        view.destroy();
        // Drop the inline hide this factory added. The CSS rule from themeRules
        // still names them, so they stay out of sight until theme.js asks
        // whichever implementation is active next for ITS rules, which is the
        // step that would be putting a textarea back anyway.
        for (const el of legacy) el.style.display = '';
      },
    };
  }

  // This editor's own surfaces. app/theme.js owns the read-only pane and the
  // token palette both panes share; what those colours get painted onto is this
  // file's business, which is why theme.js asks instead of writing them.
  //
  // The structural rules are here too, ahead of the colours. index.html's CSS
  // describes a textarea with a <pre> under it, which is the other
  // implementation's shape, and #themeStyle is replaced wholesale on every
  // theme change so carrying a few layout rules along costs nothing. Every
  // selector starts at #codeEditWrap: CodeMirror injects its own base theme at
  // the top of <head>, and an id beats a class without needing !important.
  function themeRules(theme, tokenSlots, italics) {
    const rules = [
      '#codeEditWrap .cm-editor { height: 100%; }',
      '#codeEditWrap .cm-editor.cm-focused { outline: none; }',
      // 13px/1.5 and the 12px gutter, matching what the textarea layer used, so
      // the pane looks the same whichever implementation is mounted
      '#codeEditWrap .cm-scroller { font: 13px/1.5 var(--font); overflow: auto; }',
      '#codeEditWrap .cm-content { padding: 12px 0; }',
      '#codeEditWrap .cm-line { padding: 0 12px; }',
      '#codeEditWrap .cm-editor { background: ' + theme.bg + '; color: ' + theme.fg + '; }',
      '#codeEditWrap .cm-content { caret-color: ' + theme.fg + '; }',
      // The lint gutter's own markers are fixed-colour SVGs from the vendor,
      // which read on any ground. Only the strip behind them needs a theme.
      '#codeEditWrap .cm-gutters { background: ' + theme.bg + '; color: ' + theme.com
        + '; border-right: 1px solid var(--mk-border); }',
      // Chrome colours, not code colours: a tooltip is part of the UI around
      // the text, so it takes the UI theme's variables like every other popup.
      '#codeEditWrap .cm-tooltip { background: var(--mk-surface); color: var(--mk-fg);'
        + ' border: 1px solid var(--mk-border); }',
      '#codeEditWrap .cm-diagnosticAction { background: var(--mk-gutter); color: var(--mk-fg); }',
      // native selection, the same wash #codeEdit::selection uses
      '#codeEditWrap .cm-line ::selection { background: color-mix(in srgb, var(--mk-cyan) 28%, transparent); }',
      '#codeEditWrap .cm-line::selection { background: color-mix(in srgb, var(--mk-cyan) 28%, transparent); }',
      // The textarea and its highlight layer are still in the markup. CSS gets
      // them out of sight before the factory runs and hides them for real.
      '#codeEdit, #codeEditHl { display: none; }',
    ];
    for (const [cls, col] of Object.entries(tokenSlots)) {
      rules.push('#codeEditWrap .cm-content .' + cls
        + ' { color: ' + col + '; font-style: ' + (italics.has(cls) ? 'italic' : 'normal') + '; }');
    }
    return rules;
  }

  registerEditorImpl('codemirror', { create, themeRules });
}());
