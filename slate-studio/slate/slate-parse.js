// The Slate C++ parser: the Edit flow's other half (W4 of SLATE-PARITY.md).
//
// Reads the code pane's own output back into a document, plus the hand edits
// a user makes between Apply presses. The contract is the same one cpp.js
// honors for imgui: parser(src, nextId) returns { windows, nextId, errors },
// the shell sanitizes and swaps the document, and a throw keeps the last
// good document rather than blanking the canvas.
//
// The shape being parsed is slate-generate.js's: one Construct block per
// window, a `// Window: "Label" WxH at X,Y` comment carrying the frame the
// C++ itself has no place for, and ONE expression per body. That last part
// is why this file shares nothing with cpp.js: ImGui code is a statement
// list a line-walker can chew, Slate code is a single nested expression, so
// this is a small recursive-descent parser over a cursor, not a line loop.
//
// What round-trips: every property the emitters in slate-widgets.js write,
// slot rules included. What does not: handler BODIES. The handler NAME is a
// document property and survives; the member definition is regenerated from
// it, so a body edited by hand comes back as the TODO stub. The imgui page
// has the same boundary drawn in the same place (rawcode aside), and the
// header comment the generator emits says so.

function createSlateParser(catalog) {
  // Class name -> catalog type. The window entry has a cls too (SWindow),
  // but windows are parsed from their comment + Construct pair, never from
  // an SNew chain.
  const byCls = {};
  for (const [type, spec] of Object.entries(catalog)) {
    if (type !== 'window' && spec.cls) byCls[spec.cls] = type;
  }

  // ---- value decoders -----------------------------------------------------

  const num = s => {
    const m = /-?\d+(?:\.\d+)?/.exec(String(s));
    return m ? Number(m[0]) : 0;
  };
  const unescapeStr = s => s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  const loctext = s => {
    const m = /LOCTEXT\s*\(\s*"[^"]*"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/.exec(s);
    if (m) return unescapeStr(m[1]);
    if (/FText\s*::\s*GetEmpty/.test(s)) return '';
    // a bare FText::FromString("...") is a reasonable hand edit to accept
    const f = /FromString\s*\(\s*(?:TEXT\s*\(\s*)?"((?:[^"\\]|\\.)*)"/.exec(s);
    if (f) return unescapeStr(f[1]);
    return null;
  };
  const colorHex = s => {
    const m = /FLinearColor\(\s*([\d.]+)f?\s*,\s*([\d.]+)f?\s*,\s*([\d.]+)f?\s*(?:,\s*([\d.]+)f?)?\s*\)/.exec(s);
    if (!m) return null;
    const h = v => Math.round(Math.min(1, Math.max(0, Number(v))) * 255)
      .toString(16).padStart(2, '0');
    return '#' + h(m[1]) + h(m[2]) + h(m[3]) + h(m[4] == null ? 1 : m[4]);
  };
  const marginBox = s => {
    const m = /FMargin\(([^)]*)\)/.exec(s);
    if (!m) return null;
    const p = m[1].split(',').map(num);
    if (p.length === 1) return [p[0], p[0], p[0], p[0]];
    if (p.length === 2) return [p[0], p[1], p[0], p[1]];
    return [p[0], p[1], p[2] || 0, p[3] || 0];
  };
  const vec2 = s => {
    const m = /FVector2D\(([^,]+),([^)]+)\)/.exec(s);
    return m ? [num(m[1]), num(m[2])] : null;
  };
  const handlerName = s => {
    const m = /&\s*\w+\s*::\s*(\w+)/.exec(s);
    return m ? m[1] : '';
  };
  const brushName = s => {
    const m = /GetBrush\s*\(\s*"([^"]*)"\s*\)/.exec(s);
    return m ? m[1] : null;
  };

  // ---- method table -------------------------------------------------------
  // One entry per emitted method, per type. Each is (node, argsText, note).

  const F = key => (n, a) => { n[key] = num(a); };
  const I = key => (n, a) => { n[key] = Math.round(num(a)); };
  const T = key => (n, a, note) => {
    const v = loctext(a);
    if (v === null) note(`unreadable text argument: ${a.slice(0, 40)}`);
    else n[key] = v;
  };
  const C = key => (n, a, note) => {
    const v = colorHex(a);
    if (v === null) note(`unreadable color argument: ${a.slice(0, 40)}`);
    else n[key] = v;
  };
  const H = (n, a) => { n.handler = handlerName(a); };
  const B = key => (n, a) => { n[key] = /true/.test(a); };
  const qualEnum = key => (n, a) => {
    const m = /::\s*(\w+)\s*$/.exec(a.trim());
    if (m) n[key] = m[1];
  };

  const METHODS = {
    textblock: {
      Text: T('text'),
      Font: (n, a, note) => {
        const m = /GetDefaultFontStyle\(\s*"[^"]*"\s*,\s*(\d+)/.exec(a);
        if (m) n.fontSize = Number(m[1]);
        else note('only FCoreStyle::GetDefaultFontStyle fonts are modelled');
      },
      ColorAndOpacity: C('colorAndOpacity'),
      Justification: qualEnum('justification'),
      MinDesiredWidth: F('minDesiredWidth'),
    },
    separator: {
      Thickness: F('thickness'),
      Orientation: (n, a) => { if (/Vertical/.test(a)) n.orientation = 'Vertical'; },
    },
    progressbar: {
      Percent: F('percent'),
      FillColorAndOpacity: C('fillColorAndOpacity'),
    },
    spacer: {
      Size: (n, a, note) => {
        const v = vec2(a);
        if (v) { n.sizeX = v[0]; n.sizeY = v[1]; } else note('unreadable .Size');
      },
    },
    button: {
      Text: T('text'),
      ContentPadding: (n, a) => {
        const m = marginBox(a);
        if (m) { n.padX = m[0]; n.padY = m[1]; }
      },
      OnClicked: H,
    },
    checkbox: {
      IsChecked: (n, a) => { n.checked = /::\s*Checked\b/.test(a); },
      OnCheckStateChanged: H,
    },
    editabletextbox: {
      Text: T('text'), HintText: T('hintText'), MinDesiredWidth: F('minDesiredWidth'),
    },
    hyperlink: { Text: T('text'), OnNavigate: H },
    searchbox: { InitialText: T('text'), HintText: T('hintText') },
    slider: {
      Value: F('value'), MinValue: F('minValue'), MaxValue: F('maxValue'),
      StepSize: F('stepSize'), OnValueChanged: H,
    },
    spinbox: {
      Value: F('value'), MinValue: F('minValue'), MaxValue: F('maxValue'),
      EnableWheel: B('enableWheel'),
    },
    numericentrybox: {
      Value: F('value'), AllowSpin: B('allowSpin'), AllowWheel: B('allowWheel'),
    },
    image: {
      Image: (n, a, note) => {
        const b = brushName(a);
        if (b !== null) n.brush = b;
        else note('only FAppStyle brushes are modelled');
      },
      ColorAndOpacity: C('colorAndOpacity'),
      DesiredSizeOverride: (n, a) => {
        const v = vec2(a);
        if (v) { n.sizeX = v[0]; n.sizeY = v[1]; }
      },
    },
    throbber: { NumPieces: I('pieces'), Animate: qualEnum('animate') },
    circularthrobber: {
      NumPieces: I('pieces'), Radius: F('radius'), ColorAndOpacity: C('colorAndOpacity'),
    },
    border: {
      BorderImage: () => {},   // fixed brush, carried by the emitter
      BorderBackgroundColor: C('borderBackgroundColor'),
      Padding: (n, a) => {
        const m = marginBox(a);
        if (m) { n.padL = m[0]; n.padT = m[1]; n.padR = m[2]; n.padB = m[3]; }
      },
    },
    box: {
      WidthOverride: F('widthOverride'), HeightOverride: F('heightOverride'),
      MinDesiredWidth: F('minDesiredWidth'), MinDesiredHeight: F('minDesiredHeight'),
    },
    verticalbox: {}, horizontalbox: {}, overlay: {},
    multilinetextbox: {
      Text: T('text'), HintText: T('hintText'), AutoWrapText: B('autoWrap'),
    },
    textcombobox: {
      // items are recovered from the static options array the generator
      // writes ahead of ChildSlot; the chain only names it
      OptionsSource: (n, a, note, ctx) => {
        const m = /&\s*(\w+)/.exec(a);
        if (m && ctx && ctx.statics && ctx.statics[m[1]] !== undefined) n.items = ctx.statics[m[1]];
        else note('OptionsSource does not name a static options array the parser can see');
      },
      InitiallySelectedItem: (n, a) => {
        const m = /\[\s*(\d+)\s*\]/.exec(a);
        if (m) n.selectedIndex = Number(m[1]);
      },
    },
    colorblock: {
      Color: C('color'),
      Size: (n, a) => { const v = vec2(a); if (v) { n.sizeX = v[0]; n.sizeY = v[1]; } },
    },
    spinningimage: {
      Image: (n, a, note) => {
        const b = brushName(a);
        if (b !== null) n.brush = b; else note('only FAppStyle brushes are modelled');
      },
      Period: F('period'),
    },
    scrollbox: {
      Orientation: (n, a) => { if (/Horizontal/.test(a)) n.orientation = 'Horizontal'; },
    },
    wrapbox: {
      UseAllottedSize: () => {},
      InnerSlotPadding: (n, a) => { const v = vec2(a); if (v) n.innerSlotPadding = v[0]; },
    },
    widgetswitcher: { WidgetIndex: I('activeIndex') },
    splitter: {
      Orientation: (n, a) => { if (/Vertical/.test(a)) n.orientation = 'Vertical'; },
    },
    scalebox: { Stretch: qualEnum('stretch'), UserSpecifiedScale: F('userScale') },
    expandablearea: {
      AreaTitle: T('areaTitle'),
      InitiallyCollapsed: B('initiallyCollapsed'),
      // the named slot: the method itself is a no-op, the bracket after it
      // is the single child the container branch already handles
      BodyContent: () => {},
    },
  };

  // Methods whose ABSENCE from the chain is itself a value: the emitters
  // skip these at values the catalog default would repopulate, so the parser
  // must write the absent-value explicitly or Apply would silently reset
  // them. Percent is the loud one: absent means marquee (-1), while the
  // catalog default is 0.5. Keyed by METHOD name against the touched set.
  const ABSENT = {
    progressbar: { Percent: ['percent', -1] },
    editabletextbox: { MinDesiredWidth: ['minDesiredWidth', 0], HintText: ['hintText', ''] },
    searchbox: { HintText: ['hintText', ''] },
    multilinetextbox: { HintText: ['hintText', ''], AutoWrapText: ['autoWrap', false] },
  };

  // ---- scanner ------------------------------------------------------------

  function makeState(src, errors) {
    return {
      src, pos: 0, len: src.length, errors,
      note(msg) { this.errors.push({ msg }); },
      line() { return this.src.slice(0, this.pos).split('\n').length; },
    };
  }

  function skipWs(S) {
    for (;;) {
      while (S.pos < S.len && /\s/.test(S.src[S.pos])) S.pos++;
      if (S.src.startsWith('//', S.pos)) {
        const e = S.src.indexOf('\n', S.pos);
        S.pos = e < 0 ? S.len : e + 1;
        continue;
      }
      if (S.src.startsWith('/*', S.pos)) {
        const e = S.src.indexOf('*/', S.pos + 2);
        S.pos = e < 0 ? S.len : e + 2;
        continue;
      }
      return;
    }
  }

  // At an opener, returns the inner text and leaves the cursor past the
  // closer. Quotes and escapes respected, so a ")" inside a string is text.
  function readBalanced(S, open, close) {
    if (S.src[S.pos] !== open) return null;
    let depth = 0;
    const start = S.pos + 1;
    for (; S.pos < S.len; S.pos++) {
      const c = S.src[S.pos];
      if (c === '"') {
        S.pos++;
        while (S.pos < S.len && S.src[S.pos] !== '"') {
          if (S.src[S.pos] === '\\') S.pos++;
          S.pos++;
        }
        continue;
      }
      if (c === open) depth++;
      else if (c === close && --depth === 0) {
        S.pos++;
        return S.src.slice(start, S.pos - 1);
      }
    }
    return null;
  }

  function readIdent(S) {
    const m = /^[A-Za-z_]\w*/.exec(S.src.slice(S.pos));
    if (!m) return null;
    S.pos += m[0].length;
    return m[0];
  }

  // Consume one full widget expression without modelling it, so an unknown
  // class costs one error note instead of derailing the whole parse.
  function skipWidgetExpr(S) {
    for (;;) {
      skipWs(S);
      const c = S.src[S.pos];
      if (c === '.') { S.pos++; readIdent(S); skipWs(S); readBalanced(S, '(', ')'); continue; }
      if (c === '+') { S.pos++; skipWs(S); readIdent(S); skipWs(S); if (S.src[S.pos] === ':') { S.pos += 2; readIdent(S); } skipWs(S); readBalanced(S, '(', ')'); continue; }
      if (c === '[') { readBalanced(S, '[', ']'); continue; }
      return;
    }
  }

  const SLOT_MODS = {
    // SSplitter's proportional slot: the weight carries it, and the
    // generator's slotValue path reads the weight back out
    Value: (n, a) => { n.slotWeight = num(a); },
    AutoHeight: n => { n.slotSize = 'auto'; },
    AutoWidth: n => { n.slotSize = 'auto'; },
    FillHeight: (n, a) => { n.slotSize = 'fill'; n.slotWeight = num(a); },
    FillWidth: (n, a) => { n.slotSize = 'fill'; n.slotWeight = num(a); },
    Padding: (n, a) => {
      const m = marginBox(a);
      if (m) { n.slotPadL = m[0]; n.slotPadT = m[1]; n.slotPadR = m[2]; n.slotPadB = m[3]; }
    },
    HAlign: (n, a) => {
      const m = /HAlign_(\w+)/.exec(a);
      if (m) n.slotHAlign = m[1];
    },
    VAlign: (n, a) => {
      const m = /VAlign_(\w+)/.exec(a);
      if (m) n.slotVAlign = m[1];
    },
  };

  function parseWidgetExpr(S, aliases, statics) {
    skipWs(S);
    const at = S.pos;
    if (readIdent(S) !== 'SNew') {
      S.pos = at;
      S.note(`expected SNew at line ${S.line()}`);
      return null;
    }
    skipWs(S);
    const clsRaw = readBalanced(S, '(', ')');
    if (clsRaw === null) { S.note('unclosed SNew('); return null; }

    // Resolve template arguments and the using-aliases the generator mints
    // for comma-carrying ones, then the class itself.
    let clsText = clsRaw.trim();
    if (aliases[clsText]) clsText = aliases[clsText];
    const cm = /^(\w+)\s*(?:<\s*(.+?)\s*>)?$/.exec(clsText);
    const base = cm ? cm[1] : clsText;
    const type = byCls[base];
    if (!type) {
      // A class the tool does not model: keep the WHOLE expression verbatim
      // as a Raw Slate node, chain and children included. Dedented by the
      // shallowest continuation line so that emit-at-depth then parse again
      // captures the identical text, or the block would gain a level of
      // indentation per round trip.
      skipWidgetExpr(S);
      const lines = S.src.slice(at, S.pos).split('\n');
      const indents = lines.slice(1).filter(l => l.trim())
        .map(l => /^[ \t]*/.exec(l)[0].length);
      const cut = indents.length ? Math.min(...indents) : 0;
      const code = [lines[0].trim(), ...lines.slice(1).map(l => l.slice(cut))]
        .join('\n').trimEnd();
      S.note(`SNew(${base}) is not modelled; kept as a Raw Slate block`);
      return { type: 'rawwidget', code };
    }
    const spec = catalog[type];
    const node = { type };
    if (spec.template && cm && cm[2]) node.typeArg = cm[2];
    const methods = METHODS[type] || {};
    const touched = new Set();
    node.children = [];

    for (;;) {
      skipWs(S);
      const c = S.src[S.pos];

      if (c === '.') {
        S.pos++;
        const name = readIdent(S);
        skipWs(S);
        const args = readBalanced(S, '(', ')');
        if (name === null || args === null) { S.note('malformed method call'); break; }
        const fn = methods[name];
        // Visibility is modelled centrally, matching the central emit: any
        // collapsed/hidden spelling reads back as visible false.
        if (name === 'Visibility') {
          node.visible = !/Collapsed|Hidden/.test(args);
          touched.add(name);
          continue;
        }
        if (fn) { fn(node, args, msg => S.note(msg), { statics }); touched.add(name); }
        else {
          // Not modelled, so keep it VERBATIM instead of eating it. It lands
          // on the node as extraCode, the generator re-emits it after the
          // modelled calls, and the inspector shows it under Extra Code.
          node.extraCode = (node.extraCode ? node.extraCode + '\n' : '') + `.${name}(${args})`;
          S.note(`.${name}() on ${base} is not modelled; kept verbatim as Extra Code`);
        }
        continue;
      }

      if (c === '+') {
        // + Panel::Slot() mods [ child ]
        S.pos++;
        skipWs(S);
        readIdent(S);
        if (S.src.startsWith('::', S.pos)) { S.pos += 2; readIdent(S); }
        skipWs(S);
        readBalanced(S, '(', ')');
        const slotProps = {};
        for (;;) {
          skipWs(S);
          if (S.src[S.pos] !== '.') break;
          S.pos++;
          const name = readIdent(S);
          skipWs(S);
          const args = readBalanced(S, '(', ')');
          const mod = name && SLOT_MODS[name];
          if (mod) mod(slotProps, args || '');
          else S.note(`slot method .${name}() is not modelled and was dropped`);
        }
        skipWs(S);
        if (S.src[S.pos] !== '[') { S.note('a slot with no [ content ]'); continue; }
        const inner = readBalanced(S, '[', ']');
        const child = parseWindowBody(inner, S.errors, aliases, false, statics);
        if (child) { Object.assign(child, slotProps); node.children.push(child); }
        continue;
      }

      if (c === '[') {
        const inner = readBalanced(S, '[', ']');
        const child = parseWindowBody(inner, S.errors, aliases, false, statics);
        if (!child) continue;
        if (type === 'checkbox' && child.type === 'textblock') {
          // The default slot holding the label, folded back to the label prop
          // the same way the emitter unfolded it.
          node.label = child.text !== undefined ? child.text : '';
        } else if (spec.container) {
          node.children.push(child);
        } else {
          S.note(`content inside SNew(${base})'s default slot is not modelled and was dropped`);
        }
        continue;
      }

      break;
    }

    // Absence-with-meaning, applied only where the method never ran.
    for (const [method, [prop, val]] of Object.entries(ABSENT[type] || {})) {
      if (!touched.has(method)) node[prop] = val;
    }

    if (!spec.container) delete node.children;
    return node;
  }

  // Parses one expression out of a source fragment (a Construct body or a
  // bracket's content) and returns the node.
  function parseWindowBody(src, errors, aliases, isRoot, statics) {
    const S = makeState(src, errors);
    const node = parseWidgetExpr(S, aliases, statics);
    skipWs(S);
    if (node && S.pos < S.len && isRoot) {
      errors.push({ msg: 'extra code after the root expression was dropped' });
    }
    return node;
  }

  // ---- the parser the shell calls ----------------------------------------

  function parse(src, nextId) {
    const errors = [];
    const text = String(src || '');

    // The generator's using-aliases, so SNew(FSpinBoxArgN) resolves.
    const aliases = {};
    for (const m of text.matchAll(/using\s+(\w+)\s*=\s*([^;]+);/g)) {
      aliases[m[1]] = m[2].trim();
    }

    // Window frames from their comments, matched to Construct blocks by
    // position: each comment governs the next Construct after it.
    const metas = [];
    for (const m of text.matchAll(/\/\/\s*Window:\s*"((?:[^"\\]|\\.)*)"\s*(\d+)x(\d+)(?:\s+at\s+(-?\d+)\s*,\s*(-?\d+))?/g)) {
      metas.push({
        at: m.index, label: unescapeStr(m[1]),
        w: Number(m[2]), h: Number(m[3]),
        x: m[4] !== undefined ? Number(m[4]) : 30,
        y: m[5] !== undefined ? Number(m[5]) : 30,
      });
    }

    // Every Construct block: a class name and the children parsed out of its
    // ChildSlot expression. Which WINDOW each class belongs to is decided
    // below, by the opener when there is one.
    const constructs = [];
    for (const cm of text.matchAll(/void\s+(\w+)\s*::\s*Construct\s*\([^)]*\)/g)) {
      const cls = cm[1];
      const S = makeState(text, errors);
      S.pos = cm.index + cm[0].length;
      skipWs(S);
      if (S.src[S.pos] !== '{') { errors.push({ msg: `${cls}::Construct has no body` }); continue; }
      // Inside the body: ChildSlot [ ... ];
      const body = readBalanced(S, '{', '}');
      if (body === null) { errors.push({ msg: `${cls}::Construct has an unclosed body` }); continue; }
      const cs = body.indexOf('ChildSlot');
      if (cs < 0) { errors.push({ msg: `${cls}::Construct has no ChildSlot; the window was dropped` }); continue; }
      // The statements ahead of ChildSlot: a combo box's static options
      // array lives there, and its OptionsSource resolves against this map.
      const statics = {};
      for (const sm of body.matchAll(/static\s+TArray<TSharedPtr<FString>>\s+(\w+)\s*\{([^;]*)\};/g)) {
        const items = [...sm[2].matchAll(/TEXT\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)].map(x => unescapeStr(x[1]));
        statics[sm[1]] = items.join(', ');
      }
      const B = makeState(body, errors);
      B.pos = cs + 'ChildSlot'.length;
      skipWs(B);
      if (B.src[B.pos] !== '[') { errors.push({ msg: `${cls}: nothing inside ChildSlot` }); continue; }
      const expr = readBalanced(B, '[', ']');
      const root = parseWindowBody(expr, errors, aliases, true, statics);

      // The generator wraps every window's children in one synthetic
      // SVerticalBox; unwrap exactly that so Apply does not nest a new box
      // per round trip. A hand-written non-verticalbox root stays as the
      // window's single child.
      let children = [];
      if (root && root.type === 'verticalbox') children = root.children || [];
      else if (root) children = [root];
      constructs.push({ cls, children, at: cm.index, claimed: false });
    }

    // The document root: SNew(SWindow) chains carrying each frame in real
    // code (Title, ClientSize, ScreenPosition, and the hosted class in the
    // content bracket). The frames used to ride in // Window: comments, kept
    // below as the fallback for files from before the root was code.
    const openerWins = [];
    for (const m of text.matchAll(/SNew\s*\(\s*SWindow\s*\)/g)) {
      const S = makeState(text, errors);
      S.pos = m.index + m[0].length;
      const frame = { label: null, w: 380, h: 300, x: 30, y: 30, cls: null };
      for (;;) {
        skipWs(S);
        if (S.src[S.pos] === '.') {
          S.pos++;
          const name = readIdent(S);
          skipWs(S);
          const args = readBalanced(S, '(', ')') || '';
          if (name === 'Title') { const v = loctext(args); if (v !== null) frame.label = v; }
          else if (name === 'ClientSize') { const v = vec2(args); if (v) { frame.w = Math.round(v[0]); frame.h = Math.round(v[1]); } }
          else if (name === 'ScreenPosition') { const v = vec2(args); if (v) { frame.x = Math.round(v[0]); frame.y = Math.round(v[1]); } }
          continue;
        }
        if (S.src[S.pos] === '[') {
          const inner = readBalanced(S, '[', ']') || '';
          const hosted = /SNew\s*\(\s*(\w+)/.exec(inner);
          if (hosted) frame.cls = hosted[1];
          continue;
        }
        break;
      }
      openerWins.push(frame);
    }

    const windows = [];
    let wi = 0;
    const pushWindow = (frame, children) => windows.push({
      type: 'window', id: 'w' + (++wi),
      label: frame.label, x: frame.x, y: frame.y, w: frame.w, h: frame.h,
      children,
    });

    for (const f of openerWins) {
      const c = f.cls && constructs.find(x => x.cls === f.cls && !x.claimed);
      if (c) c.claimed = true;
      else if (f.cls) errors.push({ msg: `the opener hosts SNew(${f.cls}) but no ${f.cls}::Construct exists; the window opens empty` });
      pushWindow({ ...f, label: f.label !== null ? f.label : (f.cls || 'Window').replace(/^S/, '') },
        c ? c.children : []);
    }

    // Constructs no opener claimed: the legacy comment path, so a file from
    // before the root was code (or a hand-added class) still lands.
    for (const c of constructs) {
      if (c.claimed) continue;
      const meta = metas.filter(x => x.at < c.at).pop()
        || { label: c.cls.replace(/^S/, ''), w: 380, h: 300, x: 30, y: 30 };
      const mi = metas.indexOf(meta);
      if (mi >= 0) metas.splice(mi, 1);
      pushWindow(meta, c.children);
    }

    if (!windows.length) {
      throw new Error('no SWidget::Construct block found. The pane expects the '
        + 'generated shape: Construct with a ChildSlot, and OpenStudioWindows '
        + 'creating the SWindows.');
    }

    return { windows, nextId, errors };
  }

  // The lint's map of modelled calls, and docsUrlFor's class lookup.
  parse.schema = {};
  for (const [cls, type] of Object.entries(byCls)) parse.schema[cls] = { type };

  return parse;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createSlateParser };
}
