// The slate profile: the shared shell's second engine, static half.
//
// W2 of docs/plans/SLATE-PARITY.md. The shell is app/'s classic scripts,
// loaded unchanged by the generated studio.html; this file supplies what
// PROFILE-CONTRACT.md says a profile supplies, adapted from the slate-studio
// prototype's catalog and generator.
//
// Two adapters do the real work here, and both exist because the shell's
// document model is the imgui studio's: nodes carry props FLAT, and windows
// are first-class root children. The slate prototype nested a slot object on
// every node instead, and had no windows at all. The flat shape wins, because
// 12,000 lines of working shell edit it: slot rules become ordinary slot*
// props the inspector already knows how to render, and the generator adapter
// re-nests them on the way out.

// ---------------------------------------------------------------------------
// Catalog: SLATE_WIDGETS plus a window type, plus slot props on every entry.
// ---------------------------------------------------------------------------

const SLATE_SLOT_PROPS = [
  ['slotSize', 'enum', 'auto', { values: ['auto', 'fill'] }],
  ['slotWeight', 'float', 1],
  // 'align', not 'enum': the shell renders these as UMG's segmented buttons
  ['slotHAlign', 'align', 'Fill', { values: ['Fill', 'Left', 'Center', 'Right'] }],
  ['slotVAlign', 'align', 'Fill', { values: ['Fill', 'Top', 'Center', 'Bottom'] }],
  ['slotPadL', 'float', 0], ['slotPadT', 'float', 0],
  ['slotPadR', 'float', 0], ['slotPadB', 'float', 0],
];

function slateBuildCatalog() {
  const out = {};
  for (const [type, spec] of Object.entries(SLATE_WIDGETS)) {
    // The shell's enum rows carry their options as a bare array in the
    // fourth column; the slate catalog wrapped them as { values: [...] }.
    // Normalise here so the catalog file keeps its own shape and the shell
    // sees the one it renders: the un-normalised form killed the palette
    // walk at the first enum and exactly 14 of 21 chips survived.
    //
    // extraCode rides on every widget: the chain calls the parser meets and
    // does not model, kept verbatim and re-emitted after the modelled ones.
    // It is an ordinary longtext prop so the inspector can show and edit it,
    // the same ethos as the imgui page's Raw C++ nodes at chain-call grain.
    const props = (spec.props || []).concat(SLATE_SLOT_PROPS)
      .concat([['visible', 'bool', true], ['extraCode', 'longtext', '']])
      .map(row => {
        if ((row[1] === 'enum' || row[1] === 'align')
            && row[3] && !Array.isArray(row[3]) && Array.isArray(row[3].values)) {
          return [row[0], row[1], row[2], row[3].values];
        }
        return row;
      });
    out[type] = Object.assign({}, spec, { props });
  }
  // SWindow, mirroring the shell's expectations of a window node: label and
  // x/y/w/h live FLAT on the node because doc.js, canvas.js and the window
  // adoption paths read win.w and win.x directly.
  out.window = {
    cls: 'SWindow', header: 'Widgets/SWindow.h', module: 'SlateCore',
    name: 'Window', cat: 'Window', container: true, rootOnly: true,
    props: [
      ['label', 'text', 'My Panel'],
      ['x', 'float', 30], ['y', 'float', 30],
      ['w', 'float', 380], ['h', 'float', 300],
    ],
  };
  return out;
}

// ---------------------------------------------------------------------------
// The document adapter: shell shape -> generator shape.
// ---------------------------------------------------------------------------

// Catalog prop names to runtime prop names, the same translation the old
// preview seam carried and the runtime contract documents. Living here as
// well was the residue that made every checkbox render its fallback label.
const SLATE_RUNTIME_ALIASES = {
  progressbar: { percent: 'fraction' },
  checkbox: { label: 'text' },
  editabletextbox: { hintText: 'hint' },
  searchbox: { hintText: 'hint' },
  spinbox: { minValue: 'min', maxValue: 'max' },
  numericentrybox: { minValue: 'min', maxValue: 'max' },
  image: { sizeX: 'w', sizeY: 'h', colorAndOpacity: 'color' },
  box: { widthOverride: 'w', heightOverride: 'h' },
  border: { borderBackgroundColor: 'color', padL: 'padding' },
};

function slateNodeFromShell(n, seq, runtimeAliases) {
  // Defaults first, overrides second. The shell's makeNode materialises
  // catalog defaults for palette-added nodes, but a demo literal or an
  // imported document may carry only the values it cares about, and the
  // emitters read every prop they know: the separator's thickness emit did
  // undefined.toFixed the first time this adapter ran without the merge.
  const props = {};
  const spec = SLATE_WIDGETS[n.type];
  for (const row of (spec && spec.props) || []) props[row[0]] = row[2];
  // The aliases are for the RUNTIME path only: StudioProbe spells some props
  // differently from the catalog, the C++ emitters do not. Applying them on
  // the generator path renamed the props out from under every emitter, so a
  // checkbox's edited label and a progress bar's percent generated as their
  // defaults forever while the preview showed the real values. The round-trip
  // gate is what finally made that visible.
  const alias = (runtimeAliases && SLATE_RUNTIME_ALIASES[n.type]) || {};
  for (const [k, v] of Object.entries(n)) {
    if (k === 'id' || k === 'type' || k === 'children' || k.startsWith('slot')) continue;
    props[alias[k] || k] = v;
  }
  return {
    id: seq.n++,
    type: n.type,
    props,
    slot: {
      size: n.slotSize || 'auto',
      weight: Number(n.slotWeight) || 1,
      hAlign: n.slotHAlign || 'Fill',
      vAlign: n.slotVAlign || 'Fill',
      padding: [Number(n.slotPadL) || 0, Number(n.slotPadT) || 0,
                Number(n.slotPadR) || 0, Number(n.slotPadB) || 0],
    },
    children: (n.children || []).map(c => slateNodeFromShell(c, seq, runtimeAliases)),
  };
}

// ---------------------------------------------------------------------------
// The profile
// ---------------------------------------------------------------------------

const PROFILE = {
  id: 'slate',

  storagePrefix: 'slatestudio',

  // UMG-designer surface hooks the shell reads when present: slot props
  // group under a parent-named Slot section, the hierarchy grows a
  // visibility eye per row, and Wrap With offers these containers.
  slotPropPrefix: 'slot',
  visibilityProp: 'visible',
  wrapDefault: 'verticalbox',
  wrapContainers: ['verticalbox', 'horizontalbox', 'border', 'box', 'scrollbox', 'overlay', 'scalebox', 'expandablearea'],

  // Arm-key families over the slate catalog. Small on purpose: a family is
  // a mnemonic, not a taxonomy, and every type here exists in the catalog,
  // which is the invariant the shell crashes without.
  categories: ['Window', 'Text', 'Display', 'Input', 'Layout', 'Panel'],

  families: {
    B: ['button', 'checkbox', 'hyperlink'],
    T: ['textblock', 'editabletextbox', 'searchbox'],
    S: ['slider', 'spinbox', 'numericentrybox', 'progressbar'],
    L: ['verticalbox', 'horizontalbox', 'overlay', 'border', 'box'],
    I: ['image', 'throbber', 'circularthrobber', 'separator', 'spacer'],
  },
  _familyOf: null,
  get familyOf() {
    if (!this._familyOf) {
      this._familyOf = {};
      for (const [letter, types] of Object.entries(this.families)) {
        for (const t of types) this._familyOf[t] = letter;
      }
    }
    return this._familyOf;
  },

  _catalog: null,
  get catalog() {
    if (!this._catalog) this._catalog = slateBuildCatalog();
    return this._catalog;
  },

  demoDoc() {
    let id = 0;
    const n = (type, extra) => Object.assign({ type, id: 'n' + (++id), children: [] }, extra || {});
    return {
      type: 'root', id: 'root', children: [{
        type: 'window', id: 'w1', label: 'Account Settings', x: 30, y: 30, w: 380, h: 300,
        children: [
          n('textblock', { text: 'Account Settings', fontSize: 14 }),
          n('separator', {}),
          n('editabletextbox', { hintText: 'Your name' }),
          n('editabletextbox', { hintText: 'you@example.com' }),
          n('checkbox', { label: 'Remember me on this device', checked: true }),
          n('spacer', { slotSize: 'fill' }),
          n('horizontalbox', { slotHAlign: 'Right', children: [
            n('button', { text: 'Cancel' }),
            n('button', { text: 'Save' }),
          ] }),
        ],
      }],
    };
  },

  // Every window in the document, one SCompoundWidget class each, which is
  // how UE code actually ships: you write an SCompoundWidget, something else
  // owns the window. It first shipped emitting only the FIRST window, which
  // read fine until W4's Apply flow made the pane a round-trip surface:
  // replacing the document with a parse of a one-window rendering would have
  // silently deleted every other window.
  generate() {
    const wins = (doc.children || []).filter(n => n.type === 'window');
    if (!wins.length) return '// The document has no window. Add one from the palette.\n';
    return slateGenerateDoc(wins.map(win => {
      const seq = { n: 1 };
      return {
        label: win.label,
        x: Number(win.x) || 0, y: Number(win.y) || 0,
        w: Number(win.w) || 380, h: Number(win.h) || 300,
        root: {
          id: 0, type: 'verticalbox', props: {},
          slot: { size: 'auto', weight: 1, hAlign: 'Fill', vAlign: 'Fill', padding: [0, 0, 0, 0] },
          children: (win.children || []).map(c => slateNodeFromShell(c, seq, false)),
        },
      };
    }));
  },

  // The W4 parser, assembled lazily from the catalog the same way the imgui
  // profile assembles cpp.js's. Its presence is what un-hides the Edit flow.
  _parser: null,
  get parser() {
    if (!this._parser) this._parser = createSlateParser(this.catalog);
    return this._parser;
  },

  // One value that resolves everywhere the page mounts: in a checkout the
  // page's <base> is ../app/, so this lands on slate-studio/tutorial.html;
  // deployed there is no base, the page sits at slate-studio/, and the same
  // ../slate-studio/ hop lands on the copy the bundle ships at its root.
  tutorialUrl: '../slate-studio/tutorial.html',

  // Help > the framework's own reference. Without this the shell falls back to
  // the imgui manual, which is the right link on exactly one of the two pages.
  manual: {
    label: 'Slate UI framework guide',
    url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/slate-ui-framework-in-unreal-engine',
  },

  // A call, not a reference, matching the imgui profile: the builder returns
  // fresh objects so an applied template cannot mutate the master copies.
  get templates() {
    return typeof slateBuiltinTemplates !== 'undefined' ? slateBuiltinTemplates() : [];
  },

  docs: {
    get tag() { return 'UE 5.8'; },
    get lines() { return null; },
    get sigs() { return null; },
    get names() { return null; },
  },

  // Each widget's page in Epic's API reference, derived from the module and
  // header the catalog already records: API/Runtime/<module>/<header sans
  // .h>. Verified against the live site for Slate and SlateCore classes. A
  // type with no class (Raw Slate) gets the framework overview.
  docsUrl(type) {
    const spec = this.catalog[type];
    if (spec && spec.cls && spec.header && spec.module) {
      return 'https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/'
        + spec.module + '/' + spec.header.replace(/\.h$/, '');
    }
    return 'https://dev.epicgames.com/documentation/en-us/unreal-engine/slate-user-interface-programming-framework-for-unreal-engine';
  },

  // The engine adapter over the slate wasm module (W3). The shell speaks the
  // imgui-shaped contract in PROFILE-CONTRACT.md; this maps it onto the
  // Studio_* exports of slate-wasm's studio-probe module. The id translation
  // lives here in full: the shell's string ids to the runtime's integers on
  // the way in, back again on the way out, with the window as runtime id 0.
  engine: {
    module: null,

    // Slate's windows are constraint-canvas slots the runtime pins where the
    // document says. Nothing engine-side moves them, so the shell's own
    // title-bar drag owns the gesture and the runtime follows the document.
    nativeWindowDrag: false,

    _toShell: new Map(),
    _depth: new Map(),
    _isWindow: new Set(),
    _origin: { x: 0, y: 0 },

    boot(opts) {
      // A checkout serves the module from slate-wasm/web; the deployed bundle
      // ships it under engine/ and says so with one global the build injects.
      const base = window.SLATE_ENGINE_BASE || '../slate-wasm/web/';
      const script = document.createElement('script');
      script.src = base + 'studio-probe.js';
      script.onload = () => {
        SlateCoreModule({ canvas: opts.canvas, locateFile: p => base + p }).then(m => {
          if (Number(m._RunStudioProbe()) !== 0) {
            console.error('slate engine failed to boot');
            return;
          }
          this.module = m;
          // The sheet window must match the canvas from the first frame.
          // The shell only sends engine_resize on CHANGES, and the canvas
          // was sized before this engine existed, so without this the sheet
          // stayed at its 640x520 boot size and silently CULLED every window
          // placed past those bounds: rects reported perfect geometry for
          // pixels that were never drawn, which took three isolation runs to
          // corner.
          m._Studio_Resize(opts.canvas.width || 640, opts.canvas.height || 520);
          // Emscripten's SDL renames the browser tab to the SDL window's
          // title the moment the engine boots. The page's name is the
          // page's, take it back.
          document.title = 'Slate Studio';
          // engineDidBoot re-pushes the document, so nothing queued before
          // ready is ever lost.
          opts.onReady();
        }).catch(err => console.error('slate engine module failed: ' + err));
      };
      script.onerror = () => console.error(
        'studio-probe.js not found; run: node slate-wasm/link.mjs --out studio-probe.js --allow');
      document.head.appendChild(script);
    },

    _pushDocument(json) {
      const shellDoc = JSON.parse(json);
      this._toShell.clear();
      this._depth.clear();
      this._isWindow.clear();
      const seq = { n: 0 };
      const toShell = this._toShell;
      const depths = this._depth;

      const convert = shellNode => {
        const g = slateNodeFromShell(shellNode, { n: 0 }, true);
        const renumber = (node, src, depth) => {
          node.id = ++seq.n;
          toShell.set(node.id, src.id);
          depths.set(node.id, depth);
          const kids = src.children || [];
          for (let i = 0; i < kids.length; i++) renumber(node.children[i], kids[i], depth + 1);
        };
        renumber(g, shellNode, 1);
        return g;
      };

      // Version 2: every window in the document, placed on the sheet at its
      // world position; the runtime subtracts the origin. This is the same
      // world model the imgui engine draws, and it is what fixed the studio
      // page rendering its one window at surface (0,0) while the shell was
      // looking at a panned sheet: the picture was off-canvas, the rects
      // said otherwise, and only pixels could tell.
      // The window's id is assigned BEFORE its children convert, so runtime
      // ids follow paint order: window, then its contents, then the next
      // window. The shell's hit test filters to everything at or after the
      // topmost window entry, so rect ORDER is semantics, and _readRects
      // sorts by these ids to reproduce it. The first version numbered
      // children first and clicks selected the window every time.
      const windows = (shellDoc.children || []).filter(n => n.type === 'window').map(win => {
        const id = ++seq.n;
        this._toShell.set(id, win.id);
        this._depth.set(id, 0);
        this._isWindow.add(id);
        return {
          id,
          x: Number(win.x) || 0, y: Number(win.y) || 0,
          w: Number(win.w) || 380, h: Number(win.h) || 300,
          title: win.label || 'My Panel',
          root: {
            id: -1, type: 'verticalbox', props: {},
            slot: { size: 'auto', weight: 1, hAlign: 'Fill', vAlign: 'Fill', padding: [0, 0, 0, 0] },
            children: (win.children || []).map(convert),
          },
        };
      });

      const envelope = { version: 2, origin: { x: this._origin.x, y: this._origin.y }, windows };
      const m = this.module;
      const bytes = new TextEncoder().encode(JSON.stringify(envelope));
      const ptr = Number(m._Studio_AllocDoc(bytes.length));
      m.HEAPU8.set(bytes, ptr);
      const errs = Number(m._Studio_LoadDocFromBuffer(bytes.length));
      if (errs !== 0) {
        const len = Number(m._Studio_LastErrorLen());
        const p = Number(m._Studio_LastErrorPtr());
        console.warn('slate preview: ' + new TextDecoder().decode(m.HEAPU8.subarray(p, p + len)));
      }
    },

    _readRects() {
      const m = this.module;
      const raw = m.UTF8ToString(Number(m._Studio_GetRects()));
      const out = [];
      const parsed = JSON.parse(raw).sort((a, b) => a.id - b.id);
      for (const r of parsed) {
        const shellId = this._toShell.get(r.id);
        if (shellId == null) continue;
        const entry = { id: shellId, x: r.x, y: r.y, w: r.w, h: r.h, depth: this._depth.get(r.id) || 1 };
        if (this._isWindow.has(r.id)) entry.window = true;
        out.push(entry);
      }
      // The envelope pollEngine parses. ox/oy is the sheet origin: the
      // runtime laid the windows out at world minus origin, so adding the
      // origin back is what returns these rects to world coordinates.
      return JSON.stringify({ ox: this._origin.x, oy: this._origin.y, wantText: false, rects: out });
    },

    call(name, ret, argTypes, args) {
      const m = this.module;
      if (!m) {
        if (ret === 'string') return '[]';
        if (ret === 'number') return 0;
        return undefined;
      }
      switch (name) {
        case 'engine_set_document': this._pushDocument(args[0]); return;
        case 'engine_set_origin':
          // Re-push with the new origin only if it actually moved: the shell
          // calls this in the same breath as set_document, and a double
          // rebuild per edit would be pure waste.
          if (this._origin.x !== args[0] || this._origin.y !== args[1]) {
            this._origin = { x: args[0], y: args[1] };
            if (typeof doc !== 'undefined') this._pushDocument(JSON.stringify(doc));
          }
          return;
        case 'engine_get_rects': return this._readRects();
        case 'engine_set_edit_mode': m._Studio_SetEditMode(args[0] | 0); return;
        case 'engine_resize': m._Studio_Resize(args[0] | 0, args[1] | 0); return;
        case 'engine_display_w': return m.canvas ? m.canvas.width : 0;
        case 'engine_display_h': return m.canvas ? m.canvas.height : 0;
        // The world origin, window gestures and live-state readback have no
        // slate implementation yet: the window is engine-pinned at the
        // origin, so gesture polls truthfully answer "nothing is moving" and
        // live values read as defaults. Recorded as W3 residue in the plan.
        default:
          if (ret === 'string') return '';
          if (ret === 'number') return 0;
          return undefined;
      }
    },

    calls: ['engine_set_document', 'engine_get_rects', 'engine_set_edit_mode', 'engine_resize'],
  },
};
