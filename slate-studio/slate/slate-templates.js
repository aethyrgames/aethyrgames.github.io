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

  // ---- Shapes the editor mocks share -------------------------------------
  // The last four templates reproduce surfaces from the Unreal editor. They
  // are assembled from the catalog and nothing else, which is what makes them
  // examples rather than pictures: npm run slate:verify walks every template
  // here and compiles the C++ it generates against real UE 5.8.

  // A child that takes what is left of its row or column.
  const fill = (node, weight) => Object.assign(node, {
    slotSize: 'fill', slotWeight: weight === undefined ? 1 : weight,
  });
  // The editor column of a details row. 0.58 against the name column's 0.42
  // is roughly where the editor splits its own panel.
  const val = node => fill(node, 0.58);
  // Name on the left, editor on the right. Every details panel in the editor
  // is this row repeated, which is most of why they all look alike.
  const row = (label, editor) => n('horizontalbox', { slotPadT: 2 }, [
    n('textblock', {
      text: label, colorAndOpacity: '#b4b4b4ff',
      slotSize: 'fill', slotWeight: 0.42, slotVAlign: 'Center',
    }),
    editor,
  ]);
  // A collapsible category over a stack of rows.
  const cat = (title, kids, collapsed) => n('expandablearea',
    { areaTitle: title, initiallyCollapsed: !!collapsed, slotPadT: 4 },
    [n('verticalbox', {}, kids)]);
  // Three numeric fields on one line: the editor's vector editor.
  const vec = (x, y, z) => val(n('horizontalbox', {}, [
    fill(n('numericentrybox', { typeArg: 'float', value: x, allowSpin: true })),
    fill(n('numericentrybox', { typeArg: 'float', value: y, allowSpin: true, slotPadL: 3 })),
    fill(n('numericentrybox', { typeArg: 'float', value: z, allowSpin: true, slotPadL: 3 })),
  ]));
  // A gameplay tag pill, carrying its own remove button.
  const chip = text => n('border', {
    borderBackgroundColor: '#2e4a66ff',
    padL: 6, padT: 1, padR: 2, padB: 1, slotPadR: 4, slotPadB: 4,
  }, [
    n('horizontalbox', {}, [
      n('textblock', { text, fontSize: 9, slotVAlign: 'Center' }),
      n('button', { text: 'x', padX: 3, padY: 0, slotPadL: 4, slotVAlign: 'Center' }),
    ]),
  ]);
  // One blueprint node: a coloured title bar over its pins, which is all a
  // node is once the wires are somebody else's problem.
  const bpNode = (title, titleColor, icon, kids) => n('border', {
    borderBackgroundColor: '#20262eff', padL: 0, padT: 0, padR: 0, padB: 0,
    slotVAlign: 'Top',
  }, [
    n('verticalbox', {}, [
      n('border', { borderBackgroundColor: titleColor, padL: 6, padT: 3, padR: 8, padB: 3 }, [
        n('horizontalbox', {}, [
          n('image', { brush: icon, sizeX: 14, sizeY: 14, slotVAlign: 'Center' }),
          n('textblock', { text: title, fontSize: 11, slotPadL: 5, slotVAlign: 'Center' }),
        ]),
      ]),
      n('verticalbox', { slotPadL: 6, slotPadT: 5, slotPadR: 6, slotPadB: 6 }, kids),
    ]),
  ]);
  // Data pins carry a name, execution pins do not, so they are two shapes and
  // not one with an empty label.
  const pinIn = label => n('horizontalbox', { slotPadT: 1 }, [
    n('image', { brush: 'GraphEditor.PinIcon', sizeX: 11, sizeY: 11, slotVAlign: 'Center' }),
    n('textblock', { text: label, fontSize: 9, slotPadL: 4, slotVAlign: 'Center' }),
  ]);
  const pinOut = label => n('horizontalbox', { slotHAlign: 'Right', slotPadT: 1 }, [
    n('textblock', { text: label, fontSize: 9, slotPadR: 4, slotVAlign: 'Center' }),
    n('image', { brush: 'GraphEditor.PinIcon', sizeX: 11, sizeY: 11, slotVAlign: 'Center' }),
  ]);
  const pinExec = right => n('image', {
    brush: 'GraphEditor.PinIcon', sizeX: 12, sizeY: 12,
    slotHAlign: right ? 'Right' : 'Left', slotPadT: 1,
  });
  // The wire between two nodes, held at title-bar height so it meets the pins.
  const wire = () => n('box', {
    widthOverride: 28, heightOverride: 2, slotVAlign: 'Top', slotPadT: 14,
  }, [n('separator', { thickness: 2 })]);

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

    // ---- Editor mocks ---------------------------------------------------

    // The Details panel with a Character actor selected: a filter row, the
    // actor's own header, then category after category of name-and-editor
    // rows. Two categories start collapsed, which is what SExpandableArea's
    // InitiallyCollapsed is for.
    ['Actor Details', () => win('Actor Details', 430, 660, [
      n('horizontalbox', {}, [
        n('button', { text: 'Filters', padX: 6, slotVAlign: 'Center' }),
        fill(n('searchbox', { hintText: 'Search Details', slotPadL: 4 })),
        n('image', { brush: 'Icons.Settings', sizeX: 16, sizeY: 16, slotPadL: 4, slotVAlign: 'Center' }),
      ]),
      n('border', {
        borderBackgroundColor: '#2a3038ff',
        padL: 6, padT: 6, padR: 6, padB: 6, slotPadT: 6,
      }, [
        n('horizontalbox', {}, [
          n('image', { brush: 'ClassIcon.Character', sizeX: 24, sizeY: 24, slotVAlign: 'Center' }),
          fill(n('verticalbox', { slotPadL: 6, slotVAlign: 'Center' }, [
            n('textblock', { text: 'BP_ThirdPersonCharacter', fontSize: 12 }),
            n('hyperlink', { text: 'Edit Blueprint', handler: 'OnEditBlueprint' }),
          ])),
          n('button', { text: 'Add', padX: 6, slotVAlign: 'Center' }),
        ]),
      ]),
      fill(n('scrollbox', { slotPadT: 6 }, [
        cat('Transform', [
          row('Location', vec(1240, -880, 92)),
          row('Rotation', vec(0, 180, 0)),
          row('Scale', vec(1, 1, 1)),
          row('Mobility', val(n('horizontalbox', {}, [
            fill(n('button', { text: 'Static', padX: 2 })),
            fill(n('button', { text: 'Stationary', padX: 2, slotPadL: 2 })),
            fill(n('button', { text: 'Movable', padX: 2, slotPadL: 2 })),
          ]))),
        ]),
        cat('Character', [
          row('Auto Possess Player', val(n('textcombobox', { items: 'Disabled, Player 0, Player 1' }))),
          row('Auto Possess AI', val(n('textcombobox', { items: 'Disabled, Placed in World, Spawned' }))),
          n('checkbox', { label: 'Use Controller Rotation Yaw', checked: true, slotPadT: 2 }),
          n('checkbox', { label: 'Can Be Damaged', checked: true }),
        ]),
        cat('Character Movement: Walking', [
          row('Max Walk Speed', val(n('spinbox', { typeArg: 'float', value: 500, minValue: 0, maxValue: 2000 }))),
          row('Jump Z Velocity', val(n('spinbox', { typeArg: 'float', value: 700, minValue: 0, maxValue: 2000 }))),
          row('Gravity Scale', val(n('slider', { value: 0.5, handler: 'OnGravityScale' }))),
          row('Ground Friction', val(n('numericentrybox', { typeArg: 'float', value: 8, allowSpin: true }))),
        ]),
        cat('Rendering', [
          n('checkbox', { label: 'Visible', checked: true }),
          n('checkbox', { label: 'Hidden in Game' }),
          n('checkbox', { label: 'Cast Shadow', checked: true }),
          row('Custom Depth Stencil', val(n('spinbox', { typeArg: 'int32', value: 0, minValue: 0, maxValue: 255 }))),
        ], true),
        cat('Collision', [
          row('Collision Preset', val(n('textcombobox', { items: 'Pawn, BlockAll, OverlapAll, NoCollision' }))),
          n('checkbox', { label: 'Generate Overlap Events', checked: true }),
        ], true),
      ])),
      n('horizontalbox', { slotPadT: 6 }, [
        n('textblock', { text: '5 categories', colorAndOpacity: '#8a8a8aff', fontSize: 9, slotVAlign: 'Center' }),
        n('spacer', { slotSize: 'fill' }),
        n('button', { text: 'Reset to Defaults', handler: 'OnResetDetails' }),
      ]),
    ])],

    // A property type customization, the shape an IPropertyTypeCustomization
    // draws: a gameplay tag container over its picker, and a data table row
    // handle resolving to a live preview of the row it names.
    ['Property Customization', () => win('Property Customization', 470, 620, [
      n('textblock', { text: 'FAbilityDefinition', fontSize: 13 }),
      n('textblock', { text: 'IPropertyTypeCustomization', colorAndOpacity: '#8a8a8aff', fontSize: 9 }),
      n('separator', { slotPadT: 4 }),
      cat('Gameplay Tags', [
        row('Ability Tags', val(n('border', {
          borderBackgroundColor: '#20242aff', padL: 4, padT: 4, padR: 4, padB: 0,
        }, [
          n('wrapbox', {}, [
            chip('Ability.Damage.Fire'),
            chip('Ability.Type.Projectile'),
            chip('Cooldown.Short'),
          ]),
        ]))),
        n('horizontalbox', { slotPadT: 4 }, [
          n('button', { text: 'Edit...', padX: 8, handler: 'OnEditTags' }),
          n('button', { text: 'Clear All', padX: 8, slotPadL: 4 }),
          n('spacer', { slotSize: 'fill' }),
          n('textblock', { text: '3 tags', colorAndOpacity: '#8a8a8aff', fontSize: 9, slotVAlign: 'Center' }),
        ]),
        n('searchbox', { hintText: 'Search Gameplay Tags', slotPadT: 6 }),
        // The picker tree, indented by slot padding: a tag hierarchy is a
        // tree only in the naming, and this is how the editor draws it.
        n('border', {
          borderBackgroundColor: '#1c2026ff',
          padL: 4, padT: 4, padR: 4, padB: 4, slotPadT: 4,
        }, [
          n('verticalbox', {}, [
            n('checkbox', { label: 'Ability' }),
            n('checkbox', { label: 'Ability.Damage', slotPadL: 14 }),
            n('checkbox', { label: 'Ability.Damage.Fire', checked: true, slotPadL: 28 }),
            n('checkbox', { label: 'Ability.Damage.Ice', slotPadL: 28 }),
            n('checkbox', { label: 'Ability.Type', slotPadL: 14 }),
            n('checkbox', { label: 'Ability.Type.Projectile', checked: true, slotPadL: 28 }),
          ]),
        ]),
      ]),
      cat('Data Table Row Handle', [
        row('Data Table', val(n('horizontalbox', {}, [
          fill(n('textcombobox', { items: 'DT_Weapons, DT_Armor, DT_Consumables' })),
          n('button', { text: 'Browse', padX: 4, slotPadL: 3 }),
          n('button', { text: 'Use', padX: 4, slotPadL: 2 }),
        ]))),
        row('Row Name', val(n('textcombobox', { items: 'Rifle_Standard, Rifle_Heavy, Pistol_Light' }))),
        n('border', {
          borderBackgroundColor: '#20242aff',
          padL: 6, padT: 6, padR: 6, padB: 6, slotPadT: 6,
        }, [
          n('verticalbox', {}, [
            n('textblock', { text: 'Rifle_Standard', fontSize: 11 }),
            n('horizontalbox', { slotPadT: 2 }, [
              n('textblock', { text: 'Damage 34', colorAndOpacity: '#9fbf9fff', fontSize: 9 }),
              n('textblock', { text: 'Fire Rate 0.12s', colorAndOpacity: '#9fbf9fff', fontSize: 9, slotPadL: 12 }),
            ]),
          ]),
        ]),
      ]),
      n('spacer', { slotSize: 'fill' }),
      n('horizontalbox', {}, [
        n('hyperlink', { text: 'Reset to Default', handler: 'OnResetProperty', slotVAlign: 'Center' }),
        n('spacer', { slotSize: 'fill' }),
        n('button', { text: 'Apply', handler: 'OnApplyProperty' }),
      ]),
    ])],

    // A blueprint graph: the My Blueprint panel and the graph itself, split
    // by an SSplitter whose slots carry a proportional Value rather than the
    // usual fill-and-align set. Three nodes, wired left to right.
    ['Blueprint Node Graph', () => win('Blueprint Node Graph', 780, 500, [
      n('horizontalbox', {}, [
        n('button', { text: 'Compile', padX: 8, handler: 'OnCompile', slotVAlign: 'Center' }),
        n('button', { text: 'Save', padX: 8, slotPadL: 3, slotVAlign: 'Center' }),
        n('separator', { orientation: 'Vertical', thickness: 1, slotPadL: 8, slotPadR: 8 }),
        fill(n('searchbox', { hintText: 'Search nodes' })),
        n('textblock', { text: 'Zoom -2', colorAndOpacity: '#9a9a9aff', fontSize: 9, slotPadL: 10, slotVAlign: 'Center' }),
      ]),
      fill(n('splitter', { slotPadT: 6 }, [
        Object.assign(n('border', {
          borderBackgroundColor: '#242830ff', padL: 8, padT: 8, padR: 8, padB: 8,
        }, [
          n('verticalbox', {}, [
            n('textblock', { text: 'MY BLUEPRINT', fontSize: 9, colorAndOpacity: '#8a8a8aff' }),
            n('searchbox', { hintText: 'Search', slotPadT: 4 }),
            n('textblock', { text: 'GRAPHS', fontSize: 9, colorAndOpacity: '#8a8a8aff', slotPadT: 10 }),
            n('textblock', { text: 'EventGraph', slotPadL: 10, slotPadT: 2 }),
            n('textblock', { text: 'FUNCTIONS', fontSize: 9, colorAndOpacity: '#8a8a8aff', slotPadT: 10 }),
            n('textblock', { text: 'TakeDamage', slotPadL: 10, slotPadT: 2 }),
            n('textblock', { text: 'VARIABLES', fontSize: 9, colorAndOpacity: '#8a8a8aff', slotPadT: 10 }),
            n('horizontalbox', { slotPadL: 10, slotPadT: 2 }, [
              n('colorblock', { color: '#3aa0ffff', sizeX: 10, sizeY: 10, slotVAlign: 'Center' }),
              n('textblock', { text: 'Health', slotPadL: 6, slotVAlign: 'Center' }),
            ]),
            n('horizontalbox', { slotPadL: 10, slotPadT: 2 }, [
              n('colorblock', { color: '#e04a4aff', sizeX: 10, sizeY: 10, slotVAlign: 'Center' }),
              n('textblock', { text: 'IsDead', slotPadL: 6, slotVAlign: 'Center' }),
            ]),
            n('spacer', { slotSize: 'fill' }),
            n('button', { text: 'Add New', padX: 6 }),
          ]),
        ]), { slotWeight: 0.26 }),
        Object.assign(n('border', {
          borderBackgroundColor: '#12151aff', padL: 12, padT: 12, padR: 12, padB: 12,
        }, [
          n('verticalbox', {}, [
            n('horizontalbox', {}, [
              bpNode('Event BeginPlay', '#a33232ff', 'GraphEditor.Event_16x', [pinExec(true)]),
              wire(),
              bpNode('Print String', '#2f6cadff', 'GraphEditor.Function_16x', [
                n('horizontalbox', {}, [
                  fill(n('verticalbox', {}, [
                    pinExec(false),
                    pinIn('In String'),
                    pinIn('Duration'),
                  ])),
                  n('verticalbox', { slotPadL: 24 }, [pinExec(true)]),
                ]),
              ]),
              wire(),
              bpNode('Delay', '#2f6cadff', 'GraphEditor.Timeline_16x', [
                n('horizontalbox', {}, [
                  fill(n('verticalbox', {}, [pinExec(false), pinIn('Duration')])),
                  n('verticalbox', { slotPadL: 24 }, [pinOut('Completed')]),
                ]),
              ]),
            ]),
            n('spacer', { slotSize: 'fill' }),
            n('textblock', {
              text: 'BP_ThirdPersonCharacter : EventGraph',
              colorAndOpacity: '#6f7580ff', fontSize: 9, slotHAlign: 'Right',
            }),
          ]),
        ]), { slotWeight: 0.74 }),
      ])),
      n('border', {
        borderBackgroundColor: '#1e2a1eff',
        padL: 8, padT: 4, padR: 8, padB: 4, slotPadT: 6,
      }, [
        n('horizontalbox', {}, [
          n('image', { brush: 'Icons.SuccessWithColor', sizeX: 14, sizeY: 14, slotVAlign: 'Center' }),
          n('textblock', {
            text: 'Compile succeeded. 0 errors, 0 warnings.',
            colorAndOpacity: '#9fd39fff', fontSize: 10, slotPadL: 6, slotVAlign: 'Center',
          }),
        ]),
      ]),
    ])],

    // A data asset editor: the asset header with its thumbnail, then the
    // UPROPERTY categories the details view would build for it. The
    // thumbnail is an SScaleBox inside a fixed SBox, which is how a
    // thumbnail of any source size lands in a slot of one size.
    ['Data Asset', () => win('Data Asset', 500, 660, [
      n('horizontalbox', {}, [
        n('button', { text: 'Save', padX: 8, handler: 'OnSaveAsset', slotVAlign: 'Center' }),
        n('button', { text: 'Browse', padX: 8, slotPadL: 3, slotVAlign: 'Center' }),
        n('button', { text: 'Reimport', padX: 8, slotPadL: 3, slotVAlign: 'Center' }),
        n('spacer', { slotSize: 'fill' }),
        n('textblock', { text: 'UWeaponDataAsset', colorAndOpacity: '#8a8a8aff', fontSize: 9, slotVAlign: 'Center' }),
      ]),
      n('separator', { slotPadT: 4 }),
      n('horizontalbox', { slotPadT: 6 }, [
        n('border', { borderBackgroundColor: '#20242aff', padL: 4, padT: 4, padR: 4, padB: 4 }, [
          n('box', { widthOverride: 64, heightOverride: 64 }, [
            n('scalebox', { stretch: 'ScaleToFit' }, [
              n('image', { brush: 'ClassThumbnail.DataAsset', sizeX: 48, sizeY: 48 }),
            ]),
          ]),
        ]),
        fill(n('verticalbox', { slotPadL: 8, slotVAlign: 'Center' }, [
          n('textblock', { text: 'DA_Weapon_Rifle', fontSize: 14 }),
          n('textblock', { text: '/Game/Weapons/Data', colorAndOpacity: '#8a8a8aff', fontSize: 9 }),
          n('horizontalbox', { slotPadT: 4 }, [
            n('colorblock', { color: '#c8a03cff', sizeX: 12, sizeY: 12, slotVAlign: 'Center' }),
            n('textblock', { text: 'Modified', colorAndOpacity: '#c8a03cff', fontSize: 9, slotPadL: 5, slotVAlign: 'Center' }),
          ]),
        ])),
      ]),
      fill(n('scrollbox', { slotPadT: 6 }, [
        cat('Identity', [
          row('Display Name', val(n('editabletextbox', { text: 'Standard Rifle', minDesiredWidth: 0 }))),
          row('Weapon Class', val(n('textcombobox', { items: 'Rifle, Pistol, Shotgun, Launcher' }))),
          row('Tint', val(n('colorblock', { color: '#5c7fb0ff', sizeX: 60, sizeY: 14 }))),
        ]),
        cat('Ballistics', [
          row('Base Damage', val(n('spinbox', { typeArg: 'int32', value: 34, minValue: 0, maxValue: 500 }))),
          row('Fire Rate', val(n('numericentrybox', { typeArg: 'float', value: 0.12, allowSpin: true }))),
          row('Magazine Size', val(n('spinbox', { typeArg: 'int32', value: 30, minValue: 1, maxValue: 200 }))),
          row('Spread', val(n('slider', { value: 0.18, handler: 'OnSpreadChanged' }))),
          row('Damage Falloff', val(n('progressbar', { percent: 0.62 }))),
        ]),
        cat('Behaviour', [
          n('checkbox', { label: 'Is Automatic', checked: true }),
          n('checkbox', { label: 'Uses Ammo', checked: true }),
          n('checkbox', { label: 'Is Prototype' }),
        ]),
        cat('Gameplay Tags', [
          n('wrapbox', {}, [chip('Weapon.Rifle'), chip('Weapon.Automatic'), chip('Rarity.Common')]),
        ]),
        cat('Description', [
          n('multilinetextbox', {
            text: 'Standard issue rifle. Reliable, unexciting, and the reason the prototype shipped on time.',
            hintText: 'Describe the asset',
          }),
        ]),
      ])),
      n('horizontalbox', { slotPadT: 6 }, [
        n('textblock', { text: 'Saved 2 minutes ago', colorAndOpacity: '#8a8a8aff', fontSize: 9, slotVAlign: 'Center' }),
        n('spacer', { slotSize: 'fill' }),
        n('button', { text: 'Save Asset', handler: 'OnSaveAssetAs' }),
      ]),
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
