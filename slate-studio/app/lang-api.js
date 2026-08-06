// The language seam: the interface this repo owns for "understanding the code
// in the pane".
//
// app/cpp.js parses generated C++ back into documents and app/codeintel.js
// lints, completes and describes it. Both are hand-rolled and both are
// replaceable: a tree-sitter grammar, an LSP client over a real compiler, a
// second language entirely. The pane must not care, so it asks THIS for
// everything it needs to know about the text.
//
// The contract:
//
//   canParse                 false when this language cannot read code back
//                            into a document. Round-trip editing is then a
//                            missing feature, not an error
//   parse(text, nextId)      -> { windows, errors, nextId, pre, post }
//   diagnostics(text)        -> [ diagnostic ], newest state of the problems
//   format(text)             -> string, the text laid out canonically
//   highlight(text)          -> HTML for one read-only rendering of the text
//   signature(text, offset)  -> { name, sig, note, arg } for the call the
//                            caret sits inside, or null
//   completions(text, offset, { bare })
//                            -> { from, to, items, kind, withPrefix } or null.
//                            Each item is { name, sig, note }
//   completionInsert(hit, item)
//                            -> { text, caret }: what accepting that item
//                            writes over hit.from..hit.to, and where the caret
//                            lands inside it
//   id                       which implementation this is, as a plain string,
//                            for anything reporting on the page
//
// Two implementations ship and register themselves: the hand-rolled C++ service
// (app/lang-cpp-handrolled.js), which is what runs, and the same service with
// the vendored Lezer grammar under its diagnostics and a real formatter
// (app/lang-cpp-lezer.js), which is registered and not selected. The order
// below says why.
//
// parse takes the id seed the shell's node counter is currently at, and hands
// the next free one back in the result. The sketch this file was written from
// had parse(text) alone, and it cannot be: fresh nodes need ids, the shell owns
// the counter, so the seed travels in and the high-water mark travels back out.
//
// A DIAGNOSTIC is the shape app/editor-api.js documents and takes:
// { from, to, severity, message, fix }, with severity one of 'error',
// 'warning' or 'info'. The array may also carry a `.more` count when the
// language capped how many it was willing to report.
//
// Offsets, not line and column, for the same reason the editor speaks offsets:
// it is the addressing both ends can agree on without sharing a text model.

// Implementations register here rather than being named from this file, so the
// selection below stays one line.
const LANGUAGE_IMPLS = {};

// THE SWAP POINT. One line, and the same shape as EDITOR_IMPL_ORDER in
// app/editor-api.js. A different language service means one new file that calls
// registerLanguageImpl with its own name, a <script> tag for it in index.html,
// and its name put at the front of this order.
//
// An order rather than a single name for the reason the editor seam has one: an
// implementation can legitimately fail to arrive. app/lang-cpp-lezer.js
// registers itself only when the vendored grammar loaded, so a name that never
// turns up in LANGUAGE_IMPLS is a file that did not load rather than one that
// broke, and the next name down answers instead. Without that, naming a service
// whose dependency 404d would throw on every keystroke instead of falling back.
//
// WHY 'cpp-lezer' IS NOT IN FRONT, measured rather than assumed. @lezer/cpp
// reports zero errors on every generated ImGui golden and errors on generated
// SLATE C++ THAT COMPILES: eight of the nine builtin templates and the
// every-widget sweep. On the slate page it would report problems in correct
// code, which is worse than reporting none, and its formatter declines those
// same documents so that page would gain a Format that does nothing. One seam,
// two pages, one answer, so the answer is the one that is right on both. The
// day the grammar reads Slate's declarative chains, this line is the flip.
const LANGUAGE_IMPL_ORDER = ['cpp-handrolled'];

// Which one actually answered, as a plain string, for anything that wants to
// report on the page rather than drive it. Resolved on every ask rather than
// written down here, because implementations register from their own <script>
// tags and those run after this file does.
let LANGUAGE_IMPL = '';

function registerLanguageImpl(name, factory) {
  LANGUAGE_IMPLS[name] = factory;
}

function activeLanguageImpl() {
  LANGUAGE_IMPL = LANGUAGE_IMPL_ORDER.find(name => LANGUAGE_IMPLS[name]) || '';
  const factory = LANGUAGE_IMPLS[LANGUAGE_IMPL];
  // Loud rather than undefined-shaped: no implementation at all is a load-order
  // mistake in index.html, and the alternative is a TypeError with nothing in
  // it that names the cause.
  if (!factory) {
    throw new Error(`no language implementation registered as any of ${LANGUAGE_IMPL_ORDER.join(', ')}`);
  }
  return factory;
}

// profileId names which page is asking. Today both pages get the same service:
// both generate C++ and both lint it through codeintel.js, with the active
// PROFILE supplying the parser and the documentation tables. It is passed
// anyway because it is the thing a second implementation would select on, and
// because a language service that cannot tell the two pages apart is a fact
// worth stating rather than an assumption worth hiding.
//
// `impl` names one BY NAME instead of taking the active one. Nothing in the app
// passes it and nothing should: it is there so a gate can measure a registered
// implementation that is not the default, which is the only way an alternative
// stays honest between the day it lands and the day it ships. Asking for one
// that is not registered throws rather than quietly handing back the default,
// because a check that silently measured the wrong service would pass forever.
function createLanguage(profileId, impl) {
  if (impl) {
    const named = LANGUAGE_IMPLS[impl];
    if (!named) throw new Error(`no language implementation registered as "${impl}"`);
    return named(profileId);
  }
  return activeLanguageImpl()(profileId);
}
