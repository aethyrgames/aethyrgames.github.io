// The language seam's one implementation: the C++ service this repo hand-rolled.
//
// Nothing is reimplemented here. app/cpp.js still parses, app/codeintel.js
// still lints, completes and reads signatures, and app/generate.js still
// highlights. This file is the adapter that turns their three different shapes
// into the one shape app/lang-api.js promises, and it is the only file in app/
// that names any of them.
//
// The one real translation is the diagnostic. codeintel.js reports 1-based line
// and column with a `level`; the seam speaks character offsets and a severity.
// Line and column are exact for every diagnostic codeintel produces, so the
// conversion is lossless in both directions, which is what lets the pane derive
// the "12:5" it prints from the offset alone.

const CPP_SEVERITY = { error: 'error', warn: 'warning', info: 'info' };

function createHandrolledCppLanguage(profileId) {
  // Every ImGui call the parser turns into a widget, so the lint can say which
  // ones it will instead keep verbatim. Built once and cached: the parser
  // itself is lazy behind PROFILE, and asking for its schema is what forces it.
  let modelled = null;
  const modelledCalls = () => {
    if (!modelled) {
      modelled = new Set(Object.keys((PROFILE.parser && PROFILE.parser.schema) || {}));
    }
    return modelled;
  };

  // Where every line begins, so a (line, col) pair becomes an offset.
  const lineStarts = text => {
    const out = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') out.push(i + 1);
    return out;
  };

  return {
    id: 'cpp-handrolled',
    profileId,

    // A profile with no parser has no round-trip editing at all, which
    // PROFILE-CONTRACT.md calls a missing feature rather than an error.
    get canParse() { return !!PROFILE.parser; },

    parse(text, nextId) {
      return PROFILE.parser(text, nextId);
    },

    diagnostics(text) {
      const raw = lintCpp(text, {
        sigs: PROFILE.docs.sigs, names: PROFILE.docs.names, modelled: modelledCalls(),
      });
      const starts = lineStarts(text);
      const out = raw.map(d => {
        const at = (starts[d.line - 1] || 0) + d.col - 1;
        // to === from throughout. This linter reports positions, not spans:
        // it knows the character a problem starts at and, for most of its
        // checks, nothing about where the problem ends. Inventing a span here
        // would be the adapter making something up on the parser's behalf.
        const diag = { from: at, to: at, severity: CPP_SEVERITY[d.level] || 'info', message: d.msg };
        if (d.fix) diag.fix = d.fix;
        return diag;
      });
      // map() drops the count lintCpp hangs off its array, so carry it over
      out.more = raw.more;
      return out;
    },

    // Unchanged, on purpose. The generator already writes normalised C++ and
    // nothing in the app has ever reformatted hand-typed code, so a formatter
    // here would be new behaviour rather than a moved seam. The call exists so
    // that the pane can grow a Format button, or a real implementation can grow
    // a formatter, without the interface changing shape.
    format(text) { return text; },

    highlight(text) { return highlightCpp(text); },

    signature(text, offset) {
      return signatureAt(text, offset, PROFILE.docs.sigs);
    },

    completions(text, offset, opts) {
      const o = opts || {};
      return completionAt(text, offset, { sigs: PROFILE.docs.sigs, bare: !!o.bare });
    },

    // What accepting a completion writes, and where the caret lands inside it.
    // This is language knowledge, not pane knowledge: the qualifier and the
    // fact that a function wants its parentheses are facts about C++ and about
    // how these completions were built.
    completionInsert(hit, item) {
      if (hit.kind !== 'fn') return { text: item.name, caret: item.name.length };
      const text = (hit.withPrefix ? 'ImGui::' : '') + item.name + '()';
      // between the parentheses, ready for the first argument
      return { text, caret: text.length - 1 };
    },
  };
}

registerLanguageImpl('cpp-handrolled', createHandrolledCppLanguage);
