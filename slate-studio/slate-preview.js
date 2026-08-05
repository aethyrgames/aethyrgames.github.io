// The real-Slate preview: the studio's document rendered by the engine itself.
//
// The 2D stage stays, because it is instant and the wasm module is 38MB. This
// file owns everything on the other side of that trade: loading the module,
// serialising the document across (RUNTIME-CONTRACT.md is the shape), keeping
// the preview in step with edits, and translating clicks and selection between
// the studio's node ids and Slate's own geometry.
//
// One deliberate seam: the catalog's prop names are the studio's vocabulary,
// and the runtime's are the contract's. The ALIASES table below is the whole
// translation, in one place, so a rename on either side is a one-line fix
// here instead of a silent prop that stops being live.

const SlatePreview = (() => {
  // studio prop name -> runtime prop name, per widget type.
  const ALIASES = {
    progressbar: { percent: 'fraction' },
    checkbox: { label: 'text' },
    editabletextbox: { hintText: 'hint' },
    searchbox: { hintText: 'hint' },
    spinbox: { minValue: 'min', maxValue: 'max' },
    image: { sizeX: 'w', sizeY: 'h', colorAndOpacity: 'color' },
    box: { widthOverride: 'w', heightOverride: 'h' },
    border: { borderBackgroundColor: 'color', padL: 'padding' },
  };

  let Module = null;
  let loading = false;
  let canvas = null, overlay = null, statusEl = null;
  let onSelect = null;
  let pendingDoc = null, debounceTimer = 0;
  let selectedId = -1;
  let overlayTimer = 0;

  function say(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function toRuntimeNode(node) {
    const alias = ALIASES[node.type] || {};
    const props = {};
    for (const [k, v] of Object.entries(node.props || {})) {
      props[alias[k] || k] = v;
    }
    return {
      id: node.id,
      type: node.type,
      props,
      slot: node.slot,
      children: (node.children || []).map(toRuntimeNode),
    };
  }

  function pushNow(doc, win) {
    if (!Module) { pendingDoc = { doc, win }; return; }
    const envelope = { version: 1, window: { w: win.w, h: win.h }, root: toRuntimeNode(doc) };
    const bytes = new TextEncoder().encode(JSON.stringify(envelope));
    const ptr = Number(Module._Studio_AllocDoc(bytes.length));
    Module.HEAPU8.set(bytes, ptr);
    const errs = Number(Module._Studio_LoadDocFromBuffer(bytes.length));
    if (errs !== 0) {
      const len = Number(Module._Studio_LastErrorLen());
      const p = Number(Module._Studio_LastErrorPtr());
      say('preview: ' + new TextDecoder().decode(Module.HEAPU8.subarray(p, p + len)));
    } else {
      say('');
    }
  }

  function geom(id) {
    if (!Module || id < 0) return null;
    const w = Number(Module._Studio_GeomW(id));
    if (w < 0) return null;
    return {
      x: Number(Module._Studio_GeomX(id)), y: Number(Module._Studio_GeomY(id)),
      w, h: Number(Module._Studio_GeomH(id)),
    };
  }

  // The overlay follows Slate's geometry on a slow poll rather than an event,
  // because a rebuilt tree reports zero geometry until it has painted once.
  // Chasing that with exactly-timed callbacks is how the studio gate got its
  // one red row; a 150ms follow costs nothing and is always right by the next
  // glance.
  function syncOverlay() {
    if (!overlay) return;
    const g = geom(selectedId);
    if (!g || g.w <= 0) { overlay.hidden = true; return; }
    overlay.hidden = false;
    overlay.style.left = g.x + 'px';
    overlay.style.top = g.y + 'px';
    overlay.style.width = g.w + 'px';
    overlay.style.height = g.h + 'px';
  }

  // Where the engine module lives, tried in order: the deployed layout ships
  // it beside the page in engine/, a dev checkout serves it from the slate-wasm
  // build output. A script tag's onerror fires reliably on a 404, so the probe
  // is the injection itself rather than a HEAD request the static server may
  // not answer.
  const ENGINE_PATHS = ['engine/', '../slate-wasm/web/'];

  function bootFrom(prefix) {
    // locateFile because emscripten resolves the .wasm against the script's
    // directory but the --preload-file .data against the PAGE, and this page
    // is not where the module lives. Without it: a 404 on studio-probe.data
    // and a preview that says "loading" forever.
    SlateCoreModule({ canvas, locateFile: p => prefix + p }).then(m => {
      const boot = Number(m._RunStudioProbe());
      if (boot !== 0) { say('preview: Slate failed to boot'); return; }
      Module = m;
      say('');
      if (pendingDoc) { pushNow(pendingDoc.doc, pendingDoc.win); pendingDoc = null; }
      overlayTimer = setInterval(syncOverlay, 150);
    }).catch(err => say('preview: module failed: ' + err));
  }

  function tryEngine(pathIndex) {
    if (pathIndex >= ENGINE_PATHS.length) {
      say('the engine preview is not part of this build; the Model view is still live');
      return;
    }
    const prefix = ENGINE_PATHS[pathIndex];
    const script = document.createElement('script');
    script.src = prefix + 'studio-probe.js';
    script.onload = () => bootFrom(prefix);
    script.onerror = () => { script.remove(); tryEngine(pathIndex + 1); };
    document.head.appendChild(script);
  }

  function ensureLoaded() {
    if (Module || loading) return;
    loading = true;
    say('loading the engine (38MB)…');
    tryEngine(0);
  }

  return {
    init(opts) {
      canvas = opts.canvas;
      overlay = opts.overlay;
      statusEl = opts.status;
      onSelect = opts.onSelect;

      canvas.addEventListener('pointerdown', e => {
        if (!Module) return;
        const r = canvas.getBoundingClientRect();
        // Backing-store coordinates: the canvas renders 1:1 today, but the
        // scale is computed rather than assumed so a styled canvas keeps
        // hitting what the pointer is over.
        const x = Math.round((e.clientX - r.left) * (canvas.width / r.width));
        const y = Math.round((e.clientY - r.top) * (canvas.height / r.height));
        const id = Number(Module._Studio_HitTest(x, y));
        if (id >= 0 && onSelect) onSelect(id);
      });
    },

    // Called from slateDraw(), which every edit path already goes through.
    // Debounced because a drag emits dozens of frames and the preview is a
    // full rebuild per push.
    sync(doc, win, selId) {
      selectedId = selId;
      ensureLoaded();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => pushNow(doc, win), 120);
      syncOverlay();
    },

    ready: () => !!Module,
    geom,
    hitTest: (x, y) => Module ? Number(Module._Studio_HitTest(x, y)) : -1,
    frames: () => Module ? Number(Module._GetStudioFrameCount()) : -1,
  };
})();
