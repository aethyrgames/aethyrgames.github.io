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
  // The editor column of a details row. MEASURED: FDetailsViewArgs::ColumnWidth
  // is .6f (DetailsViewArgs.h:90,165) and the name column is the remainder,
  // 1 - (value + right), so 0.6/0.4. FDetailColumnSizeData's own 0.7f default
  // (DetailColumnSizeData.h:15) is overwritten at SDetailsView.cpp:104 and is
  // never the number a real panel uses.
  const val = node => fill(node, 0.6);
  // Name on the left, editor on the right. Every details panel in the editor
  // is this row repeated, which is most of why they all look alike.
  // nameWeight is adjustable because one row does not fit the default split:
  // three mobility buttons in 0.6 of a 430px panel clipped 'Stationary' to
  // 'Stationa'. The editor gives that row more room too.
  //
  // Font and colour MEASURED, not chosen: PropertyEditorConstants::
  // PropertyFontStyle is FStyleFonts::Small, Regular 8pt
  // (PropertyEditorConstants.cpp:11, StarshipCoreStyle.cpp:38), over
  // FStyleColors::Foreground #C0C0C0 (StyleColors.cpp:82-135).
  const row = (label, editor, nameWeight) => n('horizontalbox', { slotPadT: 2 }, [
    n('textblock', {
      text: label, colorAndOpacity: '#c0c0c0ff', fontSize: 8,
      slotSize: 'fill', slotWeight: nameWeight === undefined ? 0.4 : nameWeight,
      slotVAlign: 'Center',
    }),
    editor,
  ]);
  // A collapsible category over a stack of rows.
  //
  // MEASURED: a top-level category header is FLAT FStyleColors::Header #2F2F2F,
  // not a gradient -- "DetailsView.CategoryTop" is a plain FSlateColorBrush
  // (StarshipStyle.cpp:3723) and GetBackgroundImageForCategoryRow returns it
  // regardless of hover (DetailsViewStyle.cpp:269-281). The body sits on
  // FStyleColors::Panel #242424. The title is FStyleFonts::SmallBold, Bold 8pt
  // (StarshipStyle.cpp:3805), over #C8C8C8.
  const cat = (title, kids, collapsed) => n('expandablearea', {
    areaTitle: title, initiallyCollapsed: !!collapsed, slotPadT: 4,
    headerColor: '#2f2f2fff', bodyColor: '#242424ff',
    titleFontSize: 8, titleBold: true,
  }, [n('verticalbox', {}, kids)]);
  // Three numeric fields on one line: the editor's vector editor.
  //
  // The coloured strip down the left of each field is the single most
  // recognisable thing about a UE transform row, and it is not decoration: the
  // editor builds it with SNumericEntryBox::BuildNarrowColorLabel, an SBorder
  // tinted by the axis colour, dropped into the box's own Label slot with
  // LabelLocation(Inside) (SVectorInputBox.h:509-544, SNumericEntryBox.h:468-477).
  //
  // MEASURED colours, converted from the engine's linear FLinearColor to sRGB:
  //   X (0.594,  0.0197, 0.0 ) -> #CB2600
  //   Y (0.1349, 0.3959, 0.0 ) -> #67A900
  //   Z (0.0251, 0.207,  0.85) -> #2C7EED
  // They are declared TWICE in the engine, once in Core's AxisDisplayInfo.cpp:
  // 96-120 and again as statics on the Slate widget itself
  // (SNumericEntryBox.h:50-52, 878-887). The Slate copy is the one that matters
  // here: it means the axis colours need no editor module at all.
  //
  // A separate SColorBlock beside the field rather than inside its Label slot,
  // because the catalog has no named-slot prop yet. Visually it lands in the
  // same place; the narrowing is that the strip sits outside the box's border
  // instead of inside it.
  const AXIS = { X: '#cb2600ff', Y: '#67a900ff', Z: '#2c7eedff' };
  const axisField = (axis, value) => fill(n('horizontalbox',
    axis === 'X' ? {} : { slotPadL: 3 }, [
      n('colorblock', { color: AXIS[axis], sizeX: 3, sizeY: 18, slotVAlign: 'Fill' }),
      fill(n('numericentrybox', { typeArg: 'float', value, allowSpin: true })),
    ]));
  const vec = (x, y, z) => val(n('horizontalbox', {}, [
    axisField('X', x), axisField('Y', y), axisField('Z', z),
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
  // MEASURED against SGraphNode::UpdateGraphNode and StarshipStyle.cpp:
  //   title border padding  FMargin(10, 5, 30, 3)   SGraphNode.h:492
  //     -- the 30 on the right is deliberate in the engine too, so the colour
  //        spill runs well past the end of the title text
  //   title font            Bold 10, white          StarshipStyle.cpp:4390-4395
  //                                                 + SGraphNode.cpp:833
  //   icon                  16x16, 4px to the text  SGraphNode.cpp:896-902
  //   content area padding  FMargin(0, 3)           SGraphNode.cpp:1117
  //   pin column inset      10px from the node edge (PaddingTowardsNodeEdge)
  //                                                 GraphEditorSettings.cpp:21
  //   node body             sampled from RegularNode_body.png composited over
  //                         the graph background: #121412
  const bpNode = (title, titleColor, icon, kids) => n('border', {
    borderBackgroundColor: '#121412ff', padL: 0, padT: 0, padR: 0, padB: 0,
    slotVAlign: 'Top',
  }, [
    n('verticalbox', {}, [
      n('border', { borderBackgroundColor: titleColor, padL: 10, padT: 5, padR: 30, padB: 3 }, [
        n('horizontalbox', {}, [
          n('image', { brush: icon, sizeX: 16, sizeY: 16, slotVAlign: 'Center' }),
          n('textblock', { text: title, fontSize: 10, slotPadL: 4, slotVAlign: 'Center' }),
        ]),
      ]),
      n('verticalbox', { slotPadL: 10, slotPadT: 3, slotPadR: 10, slotPadB: 3 }, kids),
    ]),
  ]);
  // Data pins carry a name, execution pins do not, so they are two shapes and
  // not one with an empty label.
  //
  // MEASURED: a data pin is Pin_connected_VarA.png at 15x11 (BPST_VariantA is
  // the default DataPinStyle, GraphEditorSettings.cpp:37) and an exec pin is
  // ExecPin_Connected.png at 12x16 -- they are NOT the same size, which is most
  // of why a hand-drawn graph reads as wrong. Row gap is PaddingBelowPin 4 plus
  // PaddingAbovePin 4 = 8 (GraphEditorSettings.cpp:18-22); icon to label is
  // SideToSideMargin 5.0 (SGraphPin.h:119). Label is Regular 9 over #DADADA
  // (StarshipStyle.cpp:4472-4477).
  const pinIn = label => n('horizontalbox', { slotPadT: 4 }, [
    n('image', { brush: 'GraphEditor.PinIcon', sizeX: 15, sizeY: 11, slotVAlign: 'Center' }),
    n('textblock', {
      text: label, fontSize: 9, colorAndOpacity: '#dadadaff',
      slotPadL: 5, slotVAlign: 'Center',
    }),
  ]);
  const pinOut = label => n('horizontalbox', { slotHAlign: 'Right', slotPadT: 4 }, [
    n('textblock', {
      text: label, fontSize: 9, colorAndOpacity: '#dadadaff',
      slotPadR: 5, slotVAlign: 'Center',
    }),
    n('image', { brush: 'GraphEditor.PinIcon', sizeX: 15, sizeY: 11, slotVAlign: 'Center' }),
  ]);
  const pinExec = right => n('image', {
    brush: 'GraphEditor.ExecPin', sizeX: 12, sizeY: 16,
    slotHAlign: right ? 'Right' : 'Left', slotPadT: 4,
  });
  // The wire between two nodes, held at title-bar height so it meets the pins.
  // MEASURED: DefaultExecutionWireThickness is 2.5 and an exec wire takes
  // ExecutionPinTypeColor, pure white (GraphEditorSettings.cpp:41,66). And
  // Blueprint wires carry NO arrowhead: FKismetConnectionDrawingPolicy nulls
  // the base policy's ArrowImage outright, and the midpoint arrow is behind
  // bDrawMidpointArrowsInBlueprints, which defaults false
  // (BlueprintConnectionDrawingPolicy.cpp:50-58, BlueprintEditorSettings.cpp:33).
  // A straight run is a narrowing: the real thing is a cubic Hermite spline
  // with horizontal tangents, which needs a custom OnPaint this catalog has no
  // widget for.
  const wire = () => n('box', {
    widthOverride: 28, heightOverride: 3, slotVAlign: 'Top', slotPadT: 15,
  }, [n('separator', { thickness: 2.5 })]);

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
    ['Actor Details', () => win('Actor Details', 430, 700, [
      // SActorDetails.cpp:567-630 top to bottom: the name area, then a vertical
      // splitter holding the component tree at .2 over the details view. The
      // "+ Add Component" and "Edit Blueprint" controls live in the NAME row,
      // not above the tree (SActorDetails.cpp:564-565 injects them into
      // SDetailNameArea's CustomContentSlot) -- a detail worth copying, because
      // putting them over the tree is the obvious wrong guess.
      n('horizontalbox', {}, [
        n('image', { brush: 'ClassIcon.Character', sizeX: 16, sizeY: 16, slotVAlign: 'Center' }),
        // WidthOverride(200) on the name box, SDetailNameArea.cpp:88-208.
        n('box', { widthOverride: 200, slotPadL: 4, slotVAlign: 'Center' }, [
          n('editabletextbox', { text: 'BP_ThirdPersonCharacter', minDesiredWidth: 0 }),
        ]),
        n('spacer', { slotSize: 'fill' }),
        n('button', { text: '+ Add', padX: 6, slotVAlign: 'Center' }),
        n('button', { text: 'Edit Blueprint', padX: 6, slotPadL: 3, slotVAlign: 'Center' }),
        n('image', { brush: 'Icons.Lock', sizeX: 16, sizeY: 16, slotPadL: 4, slotVAlign: 'Center' }),
      ]),
      // The component tree. Names MEASURED: ACharacter's internal FNames are
      // CollisionCylinder/CharacterMesh0/CharMoveComp (Character.cpp:32-34) but
      // the tree shows the owning class's PROPERTY names, resolved by
      // FComponentEditorUtils::FindVariableNameGivenComponentInstance
      // (ComponentEditorUtils.cpp:983-1063), so it reads CapsuleComponent /
      // Mesh / CharacterMovement. ArrowComponent is WITH_EDITORONLY_DATA
      // (Character.cpp:97-109), which is why it shows here and never in a game.
      // CharacterMovement is a UActorComponent, not a scene component, so it is
      // a sibling of the root rather than nested under it.
      n('border', {
        borderBackgroundColor: '#1a1a1aff',
        padL: 1, padT: 1, padR: 1, padB: 1, slotPadT: 4,
      }, [
        n('border', {
          borderBackgroundColor: '#242424ff', padL: 4, padT: 4, padR: 4, padB: 4,
        }, [
          n('verticalbox', {}, [
            n('horizontalbox', {}, [
              n('image', { brush: 'ClassIcon.Character', sizeX: 14, sizeY: 14, slotVAlign: 'Center' }),
              n('textblock', { text: 'BP_ThirdPersonCharacter (Self)', fontSize: 8, colorAndOpacity: '#c0c0c0ff', slotPadL: 5, slotVAlign: 'Center' }),
            ]),
            n('horizontalbox', { slotPadL: 16, slotPadT: 3 }, [
              n('image', { brush: 'ClassIcon.StaticMesh', sizeX: 14, sizeY: 14, slotVAlign: 'Center' }),
              n('textblock', { text: 'CapsuleComponent (Root)', fontSize: 8, colorAndOpacity: '#c0c0c0ff', slotPadL: 5, slotVAlign: 'Center' }),
            ]),
            n('horizontalbox', { slotPadL: 32, slotPadT: 3 }, [
              n('image', { brush: 'Icons.ArrowRight', sizeX: 14, sizeY: 14, slotVAlign: 'Center' }),
              n('textblock', { text: 'ArrowComponent', fontSize: 8, colorAndOpacity: '#c0c0c0ff', slotPadL: 5, slotVAlign: 'Center' }),
            ]),
            n('horizontalbox', { slotPadL: 32, slotPadT: 3 }, [
              n('image', { brush: 'ClassIcon.StaticMesh', sizeX: 14, sizeY: 14, slotVAlign: 'Center' }),
              n('textblock', { text: 'Mesh', fontSize: 8, colorAndOpacity: '#c0c0c0ff', slotPadL: 5, slotVAlign: 'Center' }),
            ]),
            n('horizontalbox', { slotPadL: 16, slotPadT: 3 }, [
              n('image', { brush: 'Icons.World', sizeX: 14, sizeY: 14, slotVAlign: 'Center' }),
              n('textblock', { text: 'CharacterMovement', fontSize: 8, colorAndOpacity: '#c0c0c0ff', slotPadL: 5, slotVAlign: 'Center' }),
            ]),
          ]),
        ]),
      ]),
      // The filter row, SDetailsView.cpp:311-419: search box, then the property
      // matrix, favourites star and view-options gear.
      n('horizontalbox', { slotPadT: 6 }, [
        // "Search", not "Search Details": LOCTEXT("SearchDetailsHint", "Search")
        // at SDetailsView.cpp:319.
        fill(n('searchbox', { hintText: 'Search' })),
        n('image', { brush: 'Icons.Edit', sizeX: 16, sizeY: 16, slotPadL: 4, slotVAlign: 'Center' }),
        n('image', { brush: 'Icons.Visible', sizeX: 16, sizeY: 16, slotPadL: 4, slotVAlign: 'Center' }),
        n('image', { brush: 'Icons.Settings', sizeX: 16, sizeY: 16, slotPadL: 4, slotVAlign: 'Center' }),
      ]),
      // The section chips under the search row, SDetailsView.cpp:1357-1463.
      n('wrapbox', { innerSlotPadding: 3, slotPadT: 4 }, [
        n('button', { text: 'All', padX: 7, padY: 1 }),
        n('button', { text: 'General', padX: 7, padY: 1 }),
        n('button', { text: 'Actor', padX: 7, padY: 1 }),
        n('button', { text: 'LOD', padX: 7, padY: 1 }),
        n('button', { text: 'Physics', padX: 7, padY: 1 }),
        n('button', { text: 'Rendering', padX: 7, padY: 1 }),
        n('button', { text: 'Streaming', padX: 7, padY: 1 }),
      ]),
      // Categories and property names are the REAL ones a Character shows, read
      // out of the UPROPERTY(Category=...) declarations rather than invented:
      // Actor.h, Pawn.h:72-123, Character.h:645-758. The Transform category is
      // synthesised rather than declared -- ActorDetails.cpp:467-486 adds it
      // from FComponentTransformDetails at ECategoryPriority::Transform, which
      // is why it always sorts to the top however the others are named.
      fill(n('scrollbox', { slotPadT: 6 }, [
        cat('Transform', [
          row('Location', vec(1240, -880, 92)),
          row('Rotation', vec(0, 180, 0)),
          row('Scale', vec(1, 1, 1)),
          row('Mobility', fill(n('horizontalbox', {}, [
            fill(n('button', { text: 'Static', padX: 1 })),
            fill(n('button', { text: 'Stationary', padX: 1, slotPadL: 2 })),
            fill(n('button', { text: 'Movable', padX: 1, slotPadL: 2 })),
          ]), 0.74), 0.26),
        ]),
        cat('Actor', [
          n('checkbox', { label: 'Can Be Damaged', checked: true }),
          n('checkbox', { label: 'Find Camera Component when View Target', checked: true }),
          n('checkbox', { label: 'Auto Destroy When Finished' }),
          row('Initial Life Span', val(n('numericentrybox', { typeArg: 'float', value: 0 }))),
        ]),
        cat('Character', [
          // JumpMaxHoldTime and JumpMaxCount are the only EditAnywhere fields
          // in this category; the rest are VisibleInstanceOnly and read-only.
          row('Jump Max Hold Time', val(n('numericentrybox', { typeArg: 'float', value: 0 }))),
          row('Jump Max Count', val(n('spinbox', { typeArg: 'int32', value: 1, minValue: 0, maxValue: 10 }))),
          n('checkbox', { label: 'Is Crouched', slotPadT: 2 }),
          n('checkbox', { label: 'Pressed Jump' }),
        ]),
        cat('Pawn', [
          row('Auto Possess Player', val(n('textcombobox', { items: 'Disabled, Player 0, Player 1' }))),
          row('Auto Possess AI', val(n('textcombobox', { items: 'Disabled, Placed in World, Spawned, Placed in World or Spawned' }))),
          n('checkbox', { label: 'Use Controller Rotation Pitch', slotPadT: 2 }),
          n('checkbox', { label: 'Use Controller Rotation Yaw', checked: true }),
          n('checkbox', { label: 'Use Controller Rotation Roll' }),
          n('checkbox', { label: 'Can Affect Navigation Generation', checked: true }),
        ]),
        cat('Rendering', [
          n('checkbox', { label: 'Actor Hidden In Game' }),
          row('Editor Billboard Scale', val(n('numericentrybox', { typeArg: 'float', value: 1 }))),
        ], true),
        cat('Collision', [
          n('checkbox', { label: 'Generate Overlap Events During Level Streaming' }),
          row('Update Overlaps Method During Level Streaming',
            val(n('textcombobox', { items: 'Use Config Default, Always Update, Only Update Movable, Never Update' }))),
        ], true),
        cat('Physics', [
          n('checkbox', { label: 'Async Physics Tick Enabled' }),
        ], true),
        cat('Replication', [
          n('checkbox', { label: 'Replicates' }),
          n('checkbox', { label: 'Replicate Movement', checked: true }),
          row('Net Cull Distance Squared', val(n('numericentrybox', { typeArg: 'float', value: 225000000 }))),
          row('Net Update Frequency', val(n('numericentrybox', { typeArg: 'float', value: 100 }))),
          row('Min Net Update Frequency', val(n('numericentrybox', { typeArg: 'float', value: 2 }))),
        ], true),
      ])),
      n('horizontalbox', { slotPadT: 6 }, [
        n('textblock', { text: '8 categories', colorAndOpacity: '#8a8a8aff', fontSize: 9, slotVAlign: 'Center' }),
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
        // MEASURED: the graph's own background is a flat 16x16 tile,
        // Graph/GraphPanel_SolidBackground.PNG, sampled solid (38,38,38)
        // = #262626 (brush at StarshipStyle.cpp:4026).
        Object.assign(n('border', {
          borderBackgroundColor: '#262626ff', padL: 12, padT: 12, padR: 12, padB: 12,
        }, [
          n('verticalbox', {}, [
            n('horizontalbox', {}, [
              // MEASURED, not picked. The engine stores no title colour you can
              // copy: SGraphNode.cpp:872-889 overlays a grey gradient
              // (RegularNode_color_spill) tinted by the accent OVER a gloss
              // layer over the body, so the GraphEditorSettings accent is an
              // input, never what anyone sees. Compositing those three PNGs in
              // that order, at the point where the title text actually sits,
              // gives these. The spill's alpha runs 0.66 at the left to 0.01 at
              // the right, which is a gradient a flat SBorder cannot reproduce
              // -- these are the strong end, where the text is.
              bpNode('Event BeginPlay', '#4d2222ff', 'GraphEditor.Event_16x', [pinExec(true)]),
              wire(),
              bpNode('Print String', '#2e404dff', 'GraphEditor.Function_16x', [
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
              bpNode('Delay', '#2e404dff', 'GraphEditor.Timeline_16x', [
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
