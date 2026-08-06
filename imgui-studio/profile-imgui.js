// The imgui profile: today's behaviour, described in one place.
//
// W0 of docs/plans/SLATE-PARITY.md. Nothing reads this yet, and that is the
// point: this wave makes the seam visible without moving anything through it,
// so the self-test can certify "nothing changed" before W1 starts rewiring
// consumers to reach through PROFILE instead of touching provider globals.
// The field meanings live in PROFILE-CONTRACT.md next to this file.
//
// Getters throughout, not snapshots. The classic scripts share one global
// scope and load in index.html order; a getter resolves the provider at call
// time, so this file cannot capture an undefined and cannot go stale against
// a provider that reassigns itself.

const PROFILE = {
  id: 'imgui',

  // Every localStorage key derives from this, so two profiles sharing one
  // origin can never read each other's documents, layouts or binds.
  storagePrefix: 'imguistudio',

  // The framework this page designs for, in prose. Read by anything that
  // names it outside a text node, where the page generator's branding pass
  // cannot reach: the canvas aria-label was hardcoded and told a screen
  // reader on the slate page it was looking at ImGui.
  frameworkName: 'Dear ImGui',

  get docTag() { return typeof IMGUI_DOC_TAG !== 'undefined' ? IMGUI_DOC_TAG : ''; },

  get catalog() { return WIDGETS; },

  // The arm-key letter families, provider data the shell was reading by
  // global name until the slate page loaded both catalogs at once and the
  // family lists pointed at types the active catalog did not have.
  // The palette's category order. A category not in this list simply does
  // not render, which is how the slate page silently lost its Display and
  // Panel sections while the four whose names collided with imgui's rendered.
  get categories() { return CATEGORIES; },

  get families() { return FAMILIES; },
  get familyOf() { return FAMILY_OF; },

  // The fresh-document literal, moved here from doc.js when the slate page
  // booted showing the imgui demo: the shell must not know what a new
  // document contains.
  demoDoc() {
    return {
      type: 'root', id: 'root', children: [{
        type: 'window', id: 'w1', label: 'My Panel', w: 380, h: 460,
        children: [
          { type: 'text',        id: 'n1', label: 'Engine settings' },
          { type: 'separator',   id: 'n2', label: '' },
          { type: 'checkbox',    id: 'n3', label: 'Enable turbo' },
          { type: 'button',      id: 'n4', label: 'Reset', sameline: true },
          { type: 'sliderfloat', id: 'n5', label: 'Speed', n: 1, min: 0, max: 10 },
          { type: 'inputtext',   id: 'n6', label: 'Preset name' },
          { type: 'coloredit',   id: 'n7', label: 'Tint', n: 3 },
          { type: 'progressbar', id: 'n8', label: '', fraction: 0.4 },
        ],
      }],
    };
  },

  generate() { return generateCode(); },

  // Assembled here from cpp.js's factory, lazily and once. This line lived in
  // codepane.js until W1, which meant the SHELL knew which factory and which
  // catalog build a parser; that is profile knowledge. makeNode is the one
  // shell service a profile consumes, recorded in PROFILE-CONTRACT.md. The
  // slate profile has no parser until W4, and the shell treats null as
  // "round-trip editing is absent", never as an error.
  _parser: null,
  get parser() {
    if (!this._parser && typeof createParser !== 'undefined') {
      this._parser = createParser(this.catalog, makeNode, colorSlots);
    }
    return this._parser;
  },

  // A call, not a reference: builtinTemplates is a builder function, and the
  // W0 health check caught the difference the first time it ran, 0 templates
  // through the getter against 3-plus from the call.
  get templates() { return typeof builtinTemplates !== 'undefined' ? builtinTemplates() : null; },

  docs: {
    get tag() { return typeof IMGUI_DOC_TAG !== 'undefined' ? IMGUI_DOC_TAG : ''; },
    get lines() { return typeof IMGUI_DOC_LINES !== 'undefined' ? IMGUI_DOC_LINES : null; },
    get sigs() { return typeof IMGUI_SIGS !== 'undefined' ? IMGUI_SIGS : null; },
    _names: null,
    get names() {
      if (!this._names && this.lines) this._names = Object.keys(this.lines);
      return this._names;
    },
  },

  // The engine adapter. For imgui the wasm module IS the page's Module and
  // the calls are the engine_* exports the shell already speaks; the table
  // and signatures are recorded in PROFILE-CONTRACT.md. The slate profile
  // supplies an object with the same call surface shimmed over its
  // Studio_* exports in W3.
  engine: {
    get module() { return typeof Module !== 'undefined' ? Module : null; },

    // ImGui drags its own windows (title-bar grab, ConfigWindowsMoveFromTitleBarOnly)
    // and the shell adopts the moved position from the rects. A profile without
    // this flag gets the shell's own title-bar drag over the document instead.
    nativeWindowDrag: true,

    // Assembles the global emscripten Module that app/engine.js (the wasm
    // loader script, loaded last) picks up. This object lived in canvas.js
    // as `var Module = {...}` until W3 needed a second boot shape.
    boot(opts) {
      window.Module = {
        canvas: opts.canvas,
        print: t => console.log(t),
        printErr: t => console.warn(t),
        onRuntimeInitialized: opts.onReady,
      };
    },

    // The one door every engine call goes through. For imgui this is a thin
    // pass to Module.ccall; the slate profile implements the same signature
    // over its Studio_* exports in W3, and the shell cannot tell the
    // difference, which is the entire point of the door.
    call(name, ret, argTypes, args) {
      return Module.ccall(name, ret, argTypes, args);
    },
    calls: [
      'engine_set_document', 'engine_get_rects', 'engine_set_edit_mode',
      'engine_set_snap', 'engine_set_origin', 'engine_resize',
      'engine_display_w', 'engine_display_h', 'engine_mouse_x', 'engine_mouse_y',
      'engine_reset_state',
      'engine_moving_window', 'engine_moving_window_id', 'engine_resizing_window',
      'engine_cancel_move', 'engine_reset_window_size',
      'engine_min_draw_x', 'engine_min_draw_y',
      'engine_get_bool', 'engine_get_float', 'engine_get_int', 'engine_popup_depth',
    ],
  },
};
