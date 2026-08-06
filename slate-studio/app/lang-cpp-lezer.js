// The language seam's second implementation: the same C++ service, with a real
// grammar underneath the two parts that need one.
//
// app/lang-cpp-handrolled.js is the shipping one and stays the default. This
// file replaces exactly two of its answers and delegates the rest:
//
//   diagnostics  the Lezer C++ tree's ERROR nodes, with real spans, on top of
//                codeintel.js's ImGui-specific lints. Today a syntax error is
//                found only when one of maskCpp's four scans happens to notice
//                it. A grammar notices all of them.
//   format       printed from the tree rather than handed back untouched. The
//                hand-rolled service returns the text as written, which is
//                honest but means the pane can never grow a Format button.
//
// parse, highlight, signature and the two completion calls are the hand-rolled
// service's, reached through its own object. That is deliberate. This leaf is
// about syntax and layout, and the ImGui-call-to-document mapping in app/cpp.js
// is 1,472 lines of semantics that a grammar does not improve. Composing rather
// than copying also means flipping LANGUAGE_IMPL later is a strict addition:
// nothing that works today stops working.
//
// THE VENDOR BOUNDARY. window.StudioEditorVendor is read in this file and
// nowhere else, and only for `lezer.cppParser`. Swapping Lezer for tree-sitter
// is one new file implementing app/lang-api.js and one string there, which is
// the standing constraint on every dependency in this repo. No Lezer or
// CodeMirror type crosses out of this file: what leaves is diagnostics and
// strings.
//
// WHAT WAS MEASURED, because it decides whether the default should ever flip.
// Against the goldens in engine/, @lezer/cpp reports zero errors on every
// generated ImGui file. Against generated SLATE C++ it reports errors on code
// that compiles: eight of the nine builtin templates and the every-widget
// sweep. The smallest case found so far needs a whole Construct to reproduce
// and involves `.OnClicked(this, &SClass::Handler)` inside a nested SNew chain,
// which is the classic `T(x)` declaration-or-call ambiguity meeting Slate's
// declarative syntax. It does NOT reproduce on the same shape with short names,
// so it reads as an ambiguity budget rather than a missing rule. Until that is
// understood, this implementation on the Slate page would report errors in
// correct code, which is worse than reporting none.
//
// The other half of that measurement: format() is a fixed point on all three
// generated ImGui goldens, byte for byte, and restores each of them byte for
// byte from de-indented, K&R-braced and comma-tightened versions of itself. On
// the Slate side it declines every document the grammar cannot read, so on that
// page it is a no-op rather than a hazard.
//
// Cost, on a 14KB document in node: diagnostics 9ms against the hand-rolled
// service's 2ms, 14ms when the repair probe runs, format 12ms. All of it is
// parsing, and all of it sits behind the pane's existing lint debounce.

// Report at most this many syntax errors before the rest become a `.more`
// count. Recovery cascades: one missing brace can leave an ERROR node on every
// construct after it, and a hundred of them say nothing the first one didn't.
const LEZER_SYNTAX_MAX = 12;

// Single-character insertions the repair probe will try, in the order a missing
// one is likely. Each carries the sentence to print when the probe CONFIRMS it,
// which is the only circumstance any of them is printed.
const LEZER_REPAIRS = [
  { text: ';', label: 'Add ;', msg: 'This statement has no semicolon.' },
  { text: ')', label: 'Add )', msg: 'A closing ) is missing here.' },
  { text: '}', label: 'Add }', msg: 'A closing } is missing here.' },
  { text: ']', label: 'Add ]', msg: 'A closing ] is missing here.' },
];

// Above this the probe is skipped. Each candidate costs a full reparse, and a
// document this size is not one anyone is hand-editing a semicolon into.
const LEZER_PROBE_LIMIT = 200000;

// ---------- the vendored grammar ----------

// The vendored grammar, or null. Read at call time rather than at load time, so
// this file can be loaded in any order and so a missing bundle is a fact this
// file can answer rather than a "cannot read property lezer of undefined" three
// frames deep.
function lezerCppParserOrNull() {
  const vendor = typeof StudioEditorVendor !== 'undefined' ? StudioEditorVendor
    : (typeof window !== 'undefined' ? window.StudioEditorVendor : null);
  return (vendor && vendor.lezer && vendor.lezer.cppParser) || null;
}

function lezerCppParser() {
  const parser = lezerCppParserOrNull();
  if (!parser) {
    throw new Error('the Lezer C++ language service needs app/vendor/editor.bundle.js, '
      + 'which defines window.StudioEditorVendor. Load its <script> before this one.');
  }
  return parser;
}

// ---------- reading the tree ----------

// Every ERROR node, deduplicated by span. Lezer nests them: a recovery inserts
// an error node and the node it recovered into carries another at the same
// offset, so the raw walk reports one fault two or three times over.
function lezerErrorSpans(tree) {
  const seen = new Set();
  const out = [];
  tree.iterate({
    enter(node) {
      if (!node.type.isError) return;
      const key = node.from + ':' + node.to;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ from: node.from, to: node.to });
    },
  });
  out.sort((a, b) => a.from - b.from || a.to - b.to);
  return out;
}

// A reportable span for an error node.
//
// Lezer marks a MISSING token with a zero-length node at the point the parser
// gave up, and a zero-length range draws nothing. Widening is the adapter's
// job, but it has to widen onto something the text actually contains rather
// than onto a guess: the next token, or, at end of file, the last character
// there is.
function lezerErrorSpan(text, span) {
  if (span.to > span.from) return [span.from, span.to];
  let i = span.from;
  while (i < text.length && /\s/.test(text[i])) i++;
  if (i < text.length) {
    let j = i;
    if (/[A-Za-z0-9_]/.test(text[j])) while (j < text.length && /[A-Za-z0-9_]/.test(text[j])) j++;
    else j = i + 1;
    return [i, j];
  }
  let k = text.length;
  while (k > 0 && /\s/.test(text[k - 1])) k--;
  return [Math.max(0, k - 1), k];
}

// What to say about an error nobody could repair. It names the text the parser
// stopped on, because "syntax error" with no noun in it sends people looking at
// the wrong line.
function lezerErrorMessage(text, from, to) {
  const at = text.slice(from, to).replace(/\s+/g, ' ').trim();
  if (from >= to || !at) {
    return 'The C++ ends here with something still open. Check the brackets above.';
  }
  const shown = at.length > 24 ? at.slice(0, 24) + '...' : at;
  return `The C++ parser could not continue at "${shown}".`;
}

// Does one inserted character make the WHOLE text parse?
//
// This is the difference between a guess and a measurement. The hand-rolled
// linter's missing-semicolon check is a line heuristic with a fix attached, and
// it has needed six separate guards to stop it writing semicolons into the
// middle of argument lists. Here the candidate edit is applied to a copy and
// the copy is reparsed: a clean tree back means the missing semicolon is not an
// opinion.
//
// Only a repair that clears EVERY error counts. One that merely reduces the
// count has explained one fault out of several and cannot claim the file.
function lezerProbeRepair(parser, text, firstFrom) {
  if (text.length > LEZER_PROBE_LIMIT) return null;
  // Insert where the previous statement ran out, not at the error. Lezer stops
  // on the token it could not accept, which is usually the start of the NEXT
  // line, and a semicolon belongs at the end of the one above.
  let at = firstFrom;
  while (at > 0 && /\s/.test(text[at - 1])) at--;
  if (!at) return null;
  for (const cand of LEZER_REPAIRS) {
    const patched = text.slice(0, at) + cand.text + text.slice(at);
    if (lezerErrorSpans(parser.parse(patched)).length) continue;
    return {
      from: at,
      to: at,
      severity: 'error',
      message: cand.msg,
      fix: { from: at, to: at, text: cand.text, label: cand.label },
    };
  }
  return null;
}

// ---------- the printer ----------

// Braces that open a block: children are statements, one per line, one level
// in. InitializerList and ArgumentList are deliberately absent. `{ 1.0f, 1.0f }`
// is a value, and exploding it over four lines is what makes generated code
// unreadable.
const LEZER_BLOCK_NODES = new Set([
  'CompoundStatement', 'FieldDeclarationList', 'DeclarationList', 'EnumeratorList',
]);

// Nodes that hold a body: what follows the head goes on its own line, and takes
// its brace there too when it has one.
const LEZER_BODY_NODES = new Set([
  'IfStatement', 'ForStatement', 'WhileStatement', 'DoStatement', 'SwitchStatement',
  'ForRangeLoop', 'LabeledStatement', 'CaseStatement',
]);

// What counts as a body when one of the above goes looking for one.
const LEZER_STATEMENTISH = /Statement$|^Declaration$/;

// `*` and `&` written as part of a declarator bind to the type, so `char* p`
// and `State& s`. Written as an expression they bind to the operand, so `&x`.
// The tree is what tells the two apart, which is the whole reason this printer
// reads one.
const LEZER_DECL_PTR = new Set([
  'PointerDeclarator', 'ReferenceDeclarator',
  'AbstractPointerDeclarator', 'AbstractReferenceDeclarator',
]);

// `:` that ends a label rather than joining two things.
const LEZER_LABEL_OWNERS = new Set(['CaseStatement', 'AccessSpecifier', 'LabeledStatement']);

const LEZER_TEMPLATE_LISTS = new Set(['TemplateArgumentList', 'TemplateParameterList']);

// Kept verbatim. A preprocessor line has its own syntax including backslash
// continuations, and a comment's text belongs to whoever wrote it. Reprinting
// either from tokens would be this printer inventing content.
const LEZER_VERBATIM = new Set(['PreprocDirective', 'LineComment', 'BlockComment']);

// Keywords that take a space before their parenthesis, because the parenthesis
// is punctuation there rather than a call.
const LEZER_SPACED_CALLERS = new Set(['if', 'for', 'while', 'switch', 'catch',
  'return', 'sizeof', 'new', 'delete', 'alignof', 'decltype', 'static_assert']);

// `(` and `[` are not here: whether they hug what precedes them depends on
// what that is, which is the rule in lezerSpaceBetween.
const LEZER_NO_SPACE_BEFORE = new Set([',', ';', ')', ']', '::', '.', '->', '.*', '->*']);
const LEZER_NO_SPACE_AFTER = new Set(['(', '[', '::', '.', '->', '!', '~', '.*', '->*']);

// Multi-character C++ tokens, longest first, for the text the tree leaves out.
// @lezer/cpp names most punctuation but not all of it: `;`, `=`, the `&` of a
// reference declarator and the `?`/`:` of a conditional all sit inside a node's
// range with no leaf of their own, and come back as gaps between siblings.
const LEZER_GAP_OPS = ['<<=', '>>=', '->*', '...', '::', '->', '++', '--', '<<', '>>',
  '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
  '.*', '##'];

// Two tokens the source separated that this printer wants to join: would the
// join make a DIFFERENT token? Only asked when the source had whitespace there,
// since tokens already touching in the source are touching legally.
function lezerWouldFuse(a, b) {
  const x = a[a.length - 1];
  const y = b[0];
  if (/[A-Za-z0-9_$]/.test(x) && /[A-Za-z0-9_$]/.test(y)) return true;
  const pair = x + y;
  return LEZER_GAP_OPS.includes(pair) || pair === '//' || pair === '/*' || pair === '*/';
}

// The indent this text already uses, so formatting a file does not also convert
// it. The two generators disagree (four spaces on the ImGui side, tabs on the
// Slate side) and each is right about its own house.
//
// The GCD rather than the smallest or the commonest width, because the GCD is
// STABLE under this printer's own output: afterwards every indent is a multiple
// of the unit, so the next run measures the same unit and format twice still
// equals format once. The commonest width is not stable, and neither is the
// smallest once a file's shallowest level disappears.
function lezerIndentUnit(text) {
  let tabs = 0;
  let spaced = 0;
  let width = 0;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const lead = /^[ \t]+/.exec(line);
    if (!lead) continue;
    if (lead[0][0] === '\t') { tabs++; continue; }
    spaced++;
    width = gcd(lead[0].length, width);
  }
  if (tabs && tabs >= spaced) return '\t';
  if (!width) return '    ';
  return ' '.repeat(Math.min(8, Math.max(2, width)));
}

// Splits text the tree does not cover into tokens. Only operators and
// punctuation ever land here, since every identifier, literal and keyword is a
// node of its own, but the fallback takes a whole run so nothing can be dropped
// even if that stops being true.
function lezerGapTokens(text, from, to) {
  const out = [];
  let i = from;
  while (i < to) {
    if (/\s/.test(text[i])) { i++; continue; }
    const rest = text.slice(i, Math.min(to, i + 3));
    const op = LEZER_GAP_OPS.find(o => rest.startsWith(o));
    if (op) { out.push({ text: op, from: i, to: i + op.length }); i += op.length; continue; }
    if (/[^\w\s]/.test(text[i])) { out.push({ text: text[i], from: i, to: i + 1 }); i++; continue; }
    let j = i;
    while (j < to && !/\s/.test(text[j])) j++;
    out.push({ text: text.slice(i, j), from: i, to: j });
    i = j;
  }
  return out;
}

// The role of a token: everything the spacing rules need that its text alone
// cannot say. `&` is the example the whole scheme exists for.
function lezerRole(text, name, ownerName, isFirst) {
  if ((text === '*' || text === '&' || text === '&&') && LEZER_DECL_PTR.has(ownerName)) return 'declptr';
  if (isFirst && /^[-+*&!~]{1,2}$/.test(text)
    && (ownerName === 'PointerExpression' || ownerName === 'UnaryExpression')) return 'unary';
  if (ownerName === 'UpdateExpression' && name === 'UpdateOp') return isFirst ? 'unary' : 'post';
  if (text === ':' && LEZER_LABEL_OWNERS.has(ownerName)) return 'label';
  if ((text === '<' || text === '>') && LEZER_TEMPLATE_LISTS.has(ownerName)) return 'template';
  const braced = LEZER_BLOCK_NODES.has(ownerName) || ownerName === 'InitializerList';
  if (text === '{' && braced) return 'open';
  if (text === '}' && braced) return 'close';
  return '';
}

// One space or none, between two tokens that ended up on the same line.
function lezerSpaceBetween(prev, cur, prevEnd) {
  if (!prev) return false;
  const a = prev.text;
  const b = cur.text;
  let space;
  if (prev.role === 'unary') space = false;
  else if (prev.role === 'declptr') space = true;
  else if (prev.role === 'open' && cur.role === 'close') space = false;
  else if (prev.role === 'open') space = true;
  else if (cur.role === 'close') space = true;
  // cur first: `vector<vector<int>>` closes two lists with one token pair, and
  // asking about prev instead would put a space in the middle of it.
  else if (cur.role === 'template') space = false;
  // `>` hugs a following `(`, because the only thing that reaches it there is a
  // template call like MakeShared<FString>(...). It does not hug a name, which
  // is TArray<int> Name.
  else if (prev.role === 'template') space = a !== '<' && b !== '(';
  else if (LEZER_NO_SPACE_AFTER.has(a)) space = false;
  else if (cur.role === 'declptr') space = false;
  else if (cur.role === 'label') space = false;
  else if (cur.role === 'post') space = false;
  // An opening bracket after a name is a call, a declarator or a subscript and
  // hugs it. After an operator, a comma or a keyword it is a grouping and does
  // not. `!y && (z)` was the case that made this a rule rather than a set.
  else if (b === '(' || b === '[') {
    space = !/[\w)\]]$/.test(a) || (b === '(' && LEZER_SPACED_CALLERS.has(a));
  } else if (LEZER_NO_SPACE_BEFORE.has(b)) space = false;
  else space = true;
  // The source separated these two and this printer wants them touching. Only
  // then can joining them invent a token nobody wrote.
  if (!space && prevEnd < cur.from && lezerWouldFuse(a, b)) return true;
  return space;
}

// The emitter. Lines are built as strings and the indent is chosen at the
// moment the first token of a line lands, because a continuation's indent
// depends on how many brackets are still open when it starts.
function lezerWriter(src) {
  return {
    src,
    unit: lezerIndentUnit(src),
    out: [],
    buf: '',
    fresh: true,
    indent: 0,
    pending: false,
    pendingIndent: 0,
    pendingBlank: false,
    // the indent of the statement being printed, which is what a continuation
    // line measures from
    stmt: 0,
    // ( [ { opened since that statement started
    open: 0,
    prev: null,
    lastEnd: 0,

    // A null indent means "a line has to break here, but what it lines up
    // with is whatever lands on it". That is the case after a line comment,
    // which forces a break for reasons of C++ rather than of layout.
    breakLine(indent, opts) {
      const o = opts || {};
      this.pending = true;
      this.pendingIndent = indent;
      if (o.blank) this.pendingBlank = true;
      // A new statement resets the continuation frame: its own brackets are
      // what its continuation lines hang off, not the enclosing block's.
      if (o.statement) { this.stmt = indent; this.open = 0; }
    },

    // Where a line that continues the statement above starts. One level per
    // bracket still open, with two adjustments that are what make the result
    // look like code rather than like arithmetic: a bracket that OPENS on its
    // own line sits at the level of what it opens for, and one that CLOSES
    // lines up with it. That pair is why `];` under a Slate chain and `};`
    // under a multi-line initializer both land back at the statement's indent.
    continuationIndent(text) {
      if (text === ')' || text === ']' || text === '}') return this.stmt + Math.max(0, this.open - 1);
      if (text === '(' || text === '[' || text === '{') return this.stmt + this.open;
      return this.stmt + Math.max(1, this.open);
    },

    // Places one token, keeping the source's newline when it had one.
    emit(from, to, text, name, role) {
      // A zero-length node, which is how Lezer marks a token it expected and
      // did not find. There is nothing to print, and printing it anyway starts
      // a line that never gets any content on it.
      if (!text) return;
      const newlines = lezerCountNewlines(this.src, this.lastEnd, from);
      if (!this.pending && newlines > 0) {
        this.breakLine(this.continuationIndent(text), { blank: newlines > 1 });
      } else if (this.pending) {
        if (newlines > 1) this.pendingBlank = true;
        if (this.pendingIndent === null) this.pendingIndent = this.continuationIndent(text);
      }

      if (this.pending) {
        if (!this.fresh) { this.out.push(this.buf); this.buf = ''; this.fresh = true; }
        if (this.pendingBlank && this.out.length && this.out[this.out.length - 1] !== '') {
          this.out.push('');
        }
        this.indent = Math.max(0, this.pendingIndent);
        this.pending = false;
        this.pendingBlank = false;
      }

      const atom = { text, name, role, from, to };
      if (this.fresh) {
        this.buf = this.unit.repeat(this.indent) + text;
        this.fresh = false;
      } else {
        let sep = lezerSpaceBetween(this.prev, atom, this.lastEnd) ? ' ' : '';
        // A trailing comment keeps the run of spaces it was written with.
        // Collapsing it to a single space was the last thing keeping this
        // printer from being a no-op on generated code, and a comment pushed
        // out to line up with the one above it is a decision rather than an
        // accident.
        if ((name === 'LineComment' || name === 'BlockComment') && this.lastEnd < from) {
          const raw = this.src.slice(this.lastEnd, from);
          if (/^[ \t]+$/.test(raw)) sep = raw;
        }
        this.buf += sep + text;
      }
      this.prev = atom;
      this.lastEnd = to;

      if (text === '(' || text === '[' || text === '{') this.open++;
      else if (text === ')' || text === ']' || text === '}') this.open = Math.max(0, this.open - 1);
    },

    finish() {
      if (!this.fresh) this.out.push(this.buf);
      while (this.out.length && this.out[this.out.length - 1] === '') this.out.pop();
      return this.out.length ? this.out.join('\n') + '\n' : '';
    },
  };
}

function lezerCountNewlines(text, from, to) {
  let n = 0;
  for (let i = from; i < to; i++) if (text[i] === '\n') n++;
  return n;
}

// Two or more newlines between two things means the author wanted them apart.
// One blank line is kept however many were written, so the result is stable.
function lezerBlankBetween(text, from, to) {
  return lezerCountNewlines(text, from, to) > 1;
}

// A comment the source left on the previous token's line is a trailing note
// about that token, not a statement of its own.
function lezerIsTrailingComment(text, lastEnd, child) {
  if (child.name !== 'LineComment' && child.name !== 'BlockComment') return false;
  return !lezerCountNewlines(text, lastEnd, child.from);
}

// The text between two siblings, tokenized and emitted. This is where `;`, `=`,
// `?`, `:` and the declarator `&` come from, since @lezer/cpp gives none of
// them a leaf.
function lezerEmitGap(text, from, to, owner, w) {
  if (to <= from) return;
  for (const tok of lezerGapTokens(text, from, to)) {
    const isFirst = !text.slice(owner.from, tok.from).trim();
    w.emit(tok.from, tok.to, tok.text, tok.text, lezerRole(tok.text, tok.text, owner.name, isFirst));
  }
}

// Prints one node and everything under it.
//
// The line-break policy is ADD ONLY: a newline the source has is always kept,
// and the tree may add more. Deciding every break from the tree alone would
// join Slate's declarative chains into one enormous line, and the round trip
// back into a document reads those chains line by line. So the tree contributes
// statement boundaries, brace placement and indent, the source contributes the
// rest, and the result is a fixed point on the shape both generators emit.
//
// `oneLine` is true inside a block the source wrote on a single line, and
// suppresses every break this function would otherwise add. That is what keeps
// `if (ImGui::Button("Reset")) { /* TODO */ }` intact, which is a shape the
// generator emits for every button and the parser reads back by line.
function lezerPrintNode(node, text, w, depth, oneLine) {
  const name = node.name;

  if (LEZER_VERBATIM.has(name)) {
    // Trailing whitespace trimmed off the RANGE as well as the text: a
    // PreprocDirective's node covers its own newline, and leaving lastEnd past
    // it hides the blank line that follows from the next sibling.
    const raw = text.slice(node.from, node.to);
    const body = raw.replace(/\s+$/, '');
    w.emit(node.from, node.from + body.length, body, name, '');
    // A line comment swallows whatever follows it, and a preprocessor line ends
    // at its newline by definition. Neither is a formatting preference, so the
    // break is forced with no opinion about where the next line starts.
    if (name !== 'BlockComment') w.breakLine(null);
    return;
  }

  const first = node.firstChild;
  if (!first) {
    const parent = node.parent;
    const isFirst = !!parent && !!parent.firstChild && parent.firstChild.from === node.from;
    const body = text.slice(node.from, node.to);
    w.emit(node.from, node.to, body, name, lezerRole(body, name, parent ? parent.name : '', isFirst));
    return;
  }

  const isBlock = LEZER_BLOCK_NODES.has(name);
  const isProgram = name === 'Program';
  const holdsBody = LEZER_BODY_NODES.has(name);
  const multiline = text.slice(node.from, node.to).includes('\n');
  // A namespace body is a CompoundStatement and its contents are conventionally
  // NOT indented, which is also what this repo's own golden C++ does.
  const inner = isBlock && !(node.parent && node.parent.name === 'NamespaceDefinition')
    ? depth + 1 : depth;

  // A body only starts once the head is behind us. `for (int i = 0; ...)` holds
  // a Declaration inside its parentheses, and reading that as the loop's body
  // put a line break in the middle of the header. do-while and the label forms
  // have no head to pass.
  let headDone = name === 'DoStatement' || name === 'CaseStatement'
    || name === 'LabeledStatement';

  let pos = node.from;
  let index = 0;
  let prevName = '';
  for (let child = first; child; child = child.nextSibling) {
    lezerEmitGap(text, pos, child.from, node, w);
    const cname = child.name;
    const childMultiline = text.slice(child.from, child.to).includes('\n');
    let childDepth = depth;

    if (oneLine) {
      // Inside a single-line block nothing breaks, so only the depth a nested
      // block would use still has to be right.
      if (isBlock && cname !== '{' && cname !== '}' && cname !== ',') childDepth = inner;
    } else if (isBlock) {
      if (cname === '}') {
        if (multiline) w.breakLine(depth, { statement: true });
      } else if (cname !== '{' && cname !== ',') {
        // An access specifier belongs at the class's own level, not its
        // members'.
        childDepth = cname === 'AccessSpecifier' ? Math.max(0, inner - 1) : inner;
        if (multiline && !lezerIsTrailingComment(text, w.lastEnd, child)) {
          w.breakLine(childDepth,
            { statement: true, blank: lezerBlankBetween(text, w.lastEnd, child.from) });
        }
      }
    } else if (isProgram) {
      if (index > 0 && !lezerIsTrailingComment(text, w.lastEnd, child)) {
        w.breakLine(0, { statement: true, blank: lezerBlankBetween(text, w.lastEnd, child.from) });
      }
    } else if (holdsBody && cname === 'else') {
      w.breakLine(depth, { statement: true });
    } else if (holdsBody && headDone && LEZER_STATEMENTISH.test(cname)
      && !(prevName === 'else' && cname === 'IfStatement')) {
      if (LEZER_BLOCK_NODES.has(cname)) {
        if (childMultiline) w.breakLine(depth, { statement: true });
      } else {
        childDepth = depth + 1;
        w.breakLine(childDepth, { statement: true });
      }
    } else if (LEZER_BLOCK_NODES.has(cname) && childMultiline) {
      // A function body, a struct body, a bare block: brace on its own line,
      // which is what both generators write.
      w.breakLine(depth, { statement: true });
    }

    lezerPrintNode(child, text, w, childDepth,
      LEZER_BLOCK_NODES.has(cname) ? !childMultiline : oneLine);
    if (cname === 'ConditionClause' || cname === ')') headDone = true;
    prevName = cname;
    pos = child.to;
    index++;
  }
  lezerEmitGap(text, pos, node.to, node, w);
}

// The shape of a tree, ignoring where anything sits. Two texts with the same
// shape parse to the same program, which is the strongest thing a formatter can
// say about itself without a compiler.
function lezerTreeShape(tree) {
  const names = [];
  tree.iterate({ enter(n) { names.push(n.name); } });
  // Joined on a character no node name can contain, so that two different
  // sequences cannot spell the same string.
  return names.join('\n');
}

function lezerPrint(parser, text) {
  const tree = parser.parse(text);
  const w = lezerWriter(text);
  lezerPrintNode(tree.topNode, text, w, 0, false);
  return { out: w.finish(), tree };
}

// ---------- the implementation ----------

function createLezerCppLanguage(profileId) {
  // The hand-rolled service, composed rather than copied. It owns parse, the
  // highlighter, the signature hint, completion and every ImGui-specific lint,
  // and none of those get better for having a grammar behind them.
  if (typeof createHandrolledCppLanguage !== 'function') {
    throw new Error('the Lezer C++ language service composes over the hand-rolled one. '
      + 'Load app/lang-cpp-handrolled.js before this file.');
  }
  const base = createHandrolledCppLanguage(profileId);

  return {
    id: 'cpp-lezer',
    profileId,

    get canParse() { return base.canParse; },

    parse(text, nextId) { return base.parse(text, nextId); },

    // The grammar's errors, then everything codeintel.js knows that a grammar
    // does not: which ImGui calls exist, which take a format string, which come
    // back as raw C++ blocks.
    diagnostics(text) {
      const parser = lezerCppParser();
      const spans = lezerErrorSpans(parser.parse(text));

      let syntax = [];
      let dropped = 0;
      if (spans.length) {
        // One confirmed repair explains the whole file, so say it once with the
        // edit attached rather than reporting every place recovery stumbled.
        const repaired = lezerProbeRepair(parser, text, spans[0].from);
        if (repaired) {
          syntax = [repaired];
        } else {
          const all = spans.map(span => {
            const [from, to] = lezerErrorSpan(text, span);
            return { from, to, severity: 'error', message: lezerErrorMessage(text, from, to) };
          });
          syntax = all.slice(0, LEZER_SYNTAX_MAX);
          dropped = all.length - syntax.length;
        }
      }

      // Where both have something to say about the same LINE, they are
      // describing one fault twice. One of them has to go, and which one is
      // decided by what each is holding rather than by which file it came
      // from: a repair the parser CONFIRMED beats a heuristic, and with no
      // confirmed repair the hand-rolled message wins because it names the
      // construct and the line it opened on, which an ERROR node cannot.
      //
      // By POSITION, not by message text. Every semantic check survives
      // untouched, because those fire on lines that parse.
      const lines = lezerLineIndex(text);
      const semantic = base.diagnostics(text);
      const claimed = new Set(semantic.map(d => lezerLineAt(lines, d.from)));
      const keptSyntax = syntax.filter(d => d.fix || !claimed.has(lezerLineAt(lines, d.from)));
      const spoken = new Set(keptSyntax.map(d => lezerLineAt(lines, d.from)));
      const keptSemantic = semantic.filter(d => !spoken.has(lezerLineAt(lines, d.from)));

      const out = keptSyntax.concat(keptSemantic).sort((a, b) => a.from - b.from);
      out.more = dropped + (semantic.more || 0);
      return out;
    },

    // Printed from the tree, and only handed back when four things hold: the
    // text parsed, nothing was lost, the result parses to the same program,
    // and formatting it again changes nothing. All four are measured on every
    // call rather than argued for once here, because the worst outcome is not
    // an ugly file, it is a mangled one.
    format(text) {
      if (!text || !text.trim()) return text;
      const parser = lezerCppParser();
      let first;
      let second;
      try {
        first = lezerPrint(parser, text);
        // No tree, no formatting. Recovery invents a structure for code the
        // grammar could not read, and printing from an invented structure is
        // how a correct
        //   static TArray<TSharedPtr<FString>> Options { ... };
        // came back as `TSharedPtr<FString> >` with its semicolon on the next
        // line: the outer `>` was recovered as a comparison, so the statement
        // "ended" before the `;`. All three checks below passed on that, and
        // slate-parse.js then read the combo box back without its items.
        // Measured: four of the ten Slate documents in the gate lose their
        // round trip if this line is removed.
        if (lezerErrorSpans(first.tree).length) return text;
        if (first.out === text) return text;
        second = lezerPrint(parser, first.out);
      } catch (err) {
        return text;
      }
      const out = first.out;

      // Nothing added, nothing dropped, nothing reordered. Token text is copied
      // from the source verbatim and only the whitespace BETWEEN tokens is this
      // printer's to move, so stripping whitespace from both sides has to give
      // back the same string.
      if (out.replace(/\s+/g, '') !== text.replace(/\s+/g, '')) return text;
      // Same program. This is what catches a spacing rule that changed meaning
      // rather than appearance, which is the failure the other two cannot see.
      if (lezerTreeShape(second.tree) !== lezerTreeShape(first.tree)) return text;
      // Idempotent, asserted rather than assumed: format(format(x)) is computed
      // here, not hoped for.
      if (second.out !== out) return text;
      return out;
    },

    highlight(text) { return base.highlight(text); },

    signature(text, offset) { return base.signature(text, offset); },

    completions(text, offset, opts) { return base.completions(text, offset, opts); },

    completionInsert(hit, item) { return base.completionInsert(hit, item); },
  };
}

// Where every line starts, built once per diagnostics call rather than scanned
// per diagnostic.
function lezerLineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function lezerLineAt(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}

// ONLY when the vendored grammar is present, which is the same fallback story
// app/editor-codemirror.js tells: no bundle, no registration, and the order in
// app/lang-api.js finds the next name down. Declining is not an error. A studio
// whose editor bundle 404s still lints C++, just with the hand-rolled scanner
// rather than a parse tree. Without this the seam would hand back a service
// that throws on its first diagnostics call, which is a worse answer than the
// one the fallback gives.
if (lezerCppParserOrNull()) registerLanguageImpl('cpp-lezer', createLezerCppLanguage);
