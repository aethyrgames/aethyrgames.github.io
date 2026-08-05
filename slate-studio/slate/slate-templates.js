// The built-in slate templates, mirroring app/templates.js for the imgui
// page: every feature the tool has should turn up in at least one of these,
// because a template is where people look to find out what the tool can do.
//
// Node literals rather than makeNode calls, so this file has no load-order
// debt to the shell: sparse props are fine, the shell's sanitize and the
// generator's default-merge both materialise the rest. Ids are local to the
// template ('t1'...) and re-minted wherever a template is applied.

function slateBuiltinTemplates() {
  let id = 0;
  const n = (type, extra, children) => {
    const node = Object.assign({ type, id: 't' + (++id) }, extra || {});
    if (children) node.children = children;
    return node;
  };
  const win = (label, w, h, kids) => ({
    type: 'window', label, x: 30, y: 30, w, h, children: kids,
  });

  const defs = [
    ['Blank Window', () => win('Blank Window', 380, 300, [])],

    // Text entry, the checkbox default slot, a fill spacer pushing a
    // right-aligned action row down: the anatomy of most dialogs.
    ['Login Form', () => win('Login Form', 360, 300, [
      n('textblock', { text: 'Sign In', fontSize: 16 }),
      n('separator', {}),
      n('editabletextbox', { hintText: 'Username' }),
      n('editabletextbox', { hintText: 'Password' }),
      n('checkbox', { label: 'Remember me', checked: true }),
      n('spacer', { slotSize: 'fill' }),
      n('horizontalbox', { slotHAlign: 'Right' }, [
        n('button', { text: 'Cancel' }),
        n('button', { text: 'Sign In', handler: 'OnSignIn' }),
      ]),
    ])],

    // Sliders, spin boxes, live values, section headers: the settings shape
    // people build first.
    ['Settings Panel', () => win('Settings Panel', 420, 460, [
      n('textblock', { text: 'Display', fontSize: 13 }),
      n('separator', {}),
      n('checkbox', { label: 'Fullscreen', checked: true }),
      n('checkbox', { label: 'V-Sync' }),
      n('slider', { value: 0.8, handler: 'OnBrightness' }),
      n('spinbox', { typeArg: 'int32', value: 2, minValue: 0, maxValue: 3 }),
      n('textblock', { text: 'Audio', fontSize: 13, slotPadT: 8 }),
      n('separator', {}),
      n('slider', { value: 0.5 }),
      n('progressbar', { percent: 0.35 }),
      n('spacer', { slotSize: 'fill' }),
      n('horizontalbox', { slotHAlign: 'Right' }, [
        n('button', { text: 'Reset' }),
        n('button', { text: 'Apply', handler: 'OnApply' }),
      ]),
    ])],

    // Centered alignment, images, hyperlinks, and a window that is mostly
    // slot rules rather than widgets.
    ['About Dialog', () => win('About Dialog', 320, 260, [
      n('image', { brush: 'Icons.Help', sizeX: 32, sizeY: 32, slotHAlign: 'Center', slotPadT: 12 }),
      n('textblock', { text: 'Slate Studio', fontSize: 18, justification: 'Center', slotHAlign: 'Center' }),
      n('textblock', { text: 'Version 1.0', colorAndOpacity: '#9a9a9aff', slotHAlign: 'Center' }),
      n('hyperlink', { text: 'Visit the website', handler: 'OnWebsite', slotHAlign: 'Center', slotPadT: 6 }),
      n('spacer', { slotSize: 'fill' }),
      n('button', { text: 'Close', slotHAlign: 'Center', slotPadB: 10 }),
    ])],

    // Panels inside panels: a border card, a box with a fixed size, an
    // overlay, a search row with a fill slot, a throbber for liveness.
    ['Status Card', () => win('Status Card', 400, 340, [
      n('horizontalbox', {}, [
        n('searchbox', { hintText: 'Filter jobs', slotSize: 'fill' }),
        n('throbber', { pieces: 3, slotPadL: 6 }),
      ]),
      n('border', { borderBackgroundColor: '#223344ff', padL: 8, padT: 8, padR: 8, padB: 8, slotPadT: 8 }, [
        n('verticalbox', {}, [
          n('textblock', { text: 'Build 12 of 40', fontSize: 12 }),
          n('progressbar', { percent: 0.3, slotPadT: 4 }),
          n('overlay', { slotPadT: 6 }, [
            n('box', { widthOverride: 220, heightOverride: 18 }, [
              n('textblock', { text: 'ETA 4 minutes', colorAndOpacity: '#88cc88ff' }),
            ]),
            n('textblock', { text: '30%', justification: 'Right', slotHAlign: 'Right' }),
          ]),
        ]),
      ]),
      n('spacer', { slotSize: 'fill' }),
      n('button', { text: 'Cancel Build', handler: 'OnCancelBuild', slotHAlign: 'Right' }),
    ])],
  ];

  return defs.map(([name, build]) => {
    // built through a function so one bad widget type cannot take the whole
    // list down at load time, same defence as the imgui builder
    let w = null;
    try { w = build(); } catch (e) { w = win(name, 380, 300, []); }
    w.id = 'tw0';
    return {
      id: 'builtin:' + name,
      name,
      builtin: true,
      doc: { type: 'root', children: [w] },
    };
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { slateBuiltinTemplates };
}
