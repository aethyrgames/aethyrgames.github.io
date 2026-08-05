// The Slate widget catalog. Prototype subset.
//
// Every class name, header path, argument name and default in this file was read
// out of Unreal Engine 5.4 source, not out of documentation prose. See
// docs/research/SLATE.md section 2. Where the engine spells something oddly, the
// odd spelling is the correct one and normalizing it produces code that does not
// compile: SOverlay's slot class is FOverlaySlot and not FSlot, SBorder's brush
// argument is BorderImage and not BorderBackgroundImage, and SBorder's Padding
// really does default to FMargin(2.0f) so omitting it draws a 2px inset nobody
// asked for.
//
// `emit` returns the chain elements that hang off SNew(Class), in order, and only
// for properties that differ from the engine default. A property at its default
// emits nothing, which is what keeps generated code readable.

const SLATE_WIDGETS = {

  // ---- Text and display -------------------------------------------------

  textblock: {
    cls: 'STextBlock', header: 'Widgets/Text/STextBlock.h', module: 'Slate',
    cat: 'Text', name: 'Text Block',
    props: [
      ['text', 'text', 'Hello, Slate'],
      ['colorAndOpacity', 'color', '#ffffffff'],
      ['fontSize', 'int', 10],
      ['justification', 'enum', 'Left', { values: ['Left', 'Center', 'Right'] }],
      ['minDesiredWidth', 'float', 0],
    ],
    emit(n, ctx) {
      const out = [`.Text(${ctx.text(n.props.text)})`];
      if (n.props.fontSize !== 10) {
        out.push(`.Font(FCoreStyle::GetDefaultFontStyle("Regular", ${n.props.fontSize}))`);
      }
      if (n.props.colorAndOpacity !== '#ffffffff') {
        out.push(`.ColorAndOpacity(${ctx.color(n.props.colorAndOpacity)})`);
      }
      if (n.props.justification !== 'Left') {
        out.push(`.Justification(ETextJustify::${n.props.justification})`);
      }
      if (n.props.minDesiredWidth > 0) out.push(`.MinDesiredWidth(${ctx.f(n.props.minDesiredWidth)})`);
      return out;
    },
  },

  separator: {
    cls: 'SSeparator', header: 'Widgets/Layout/SSeparator.h', module: 'Slate',
    cat: 'Display', name: 'Separator',
    props: [
      // Thickness really does default to 3.0f, not 1.0f.
      ['thickness', 'float', 3],
      ['orientation', 'enum', 'Horizontal', { values: ['Horizontal', 'Vertical'] }],
    ],
    emit(n, ctx) {
      const out = [];
      if (n.props.thickness !== 3) out.push(`.Thickness(${ctx.f(n.props.thickness)})`);
      if (n.props.orientation !== 'Horizontal') out.push(`.Orientation(Orient_Vertical)`);
      return out;
    },
  },

  progressbar: {
    cls: 'SProgressBar', header: 'Widgets/Notifications/SProgressBar.h', module: 'Slate',
    cat: 'Display', name: 'Progress Bar',
    props: [
      // Percent is TOptional<float>. Unset means an indeterminate marquee, so the
      // document carries -1 for "unset" rather than 0, which would mean empty.
      ['percent', 'float', 0.5],
      ['fillColorAndOpacity', 'color', '#ffffffff'],
    ],
    emit(n, ctx) {
      const out = [];
      if (n.props.percent >= 0) out.push(`.Percent(${ctx.f(n.props.percent)})`);
      if (n.props.fillColorAndOpacity !== '#ffffffff') {
        out.push(`.FillColorAndOpacity(${ctx.color(n.props.fillColorAndOpacity)})`);
      }
      return out;
    },
  },

  spacer: {
    cls: 'SSpacer', header: 'Widgets/Layout/SSpacer.h', module: 'Slate',
    cat: 'Layout', name: 'Spacer',
    props: [['sizeX', 'float', 8], ['sizeY', 'float', 8]],
    emit(n, ctx) {
      return [`.Size(FVector2D(${ctx.f(n.props.sizeX)}, ${ctx.f(n.props.sizeY)}))`];
    },
  },

  // ---- Input ------------------------------------------------------------

  button: {
    cls: 'SButton', header: 'Widgets/Input/SButton.h', module: 'Slate',
    cat: 'Input', name: 'Button',
    // SButton takes a default slot, so it can hold content. The prototype uses
    // its .Text() convenience instead, which is legal; if both are set, Content
    // wins.
    props: [
      ['text', 'text', 'Button'],
      ['handler', 'ident', ''],
      // ContentPadding defaults to FMargin(4.0, 2.0).
      ['padX', 'float', 4],
      ['padY', 'float', 2],
    ],
    emit(n, ctx) {
      const out = [`.Text(${ctx.text(n.props.text)})`];
      if (n.props.padX !== 4 || n.props.padY !== 2) {
        out.push(`.ContentPadding(FMargin(${ctx.f(n.props.padX)}, ${ctx.f(n.props.padY)}))`);
      }
      if (n.props.handler) {
        out.push(`.OnClicked(this, &${ctx.className}::${n.props.handler})`);
      }
      return out;
    },
    // A bound OnClicked needs a handler declared on the generated widget, and
    // FOnClicked returns FReply rather than void.
    members(n, ctx) {
      if (!n.props.handler) return [];
      return [{
        decl: `FReply ${n.props.handler}();`,
        def: `FReply ${ctx.className}::${n.props.handler}()\n{\n\t// TODO: handle the click.\n\treturn FReply::Handled();\n}`,
      }];
    },
  },

  checkbox: {
    cls: 'SCheckBox', header: 'Widgets/Input/SCheckBox.h', module: 'Slate',
    cat: 'Input', name: 'Check Box',
    props: [
      ['label', 'text', 'Enabled'],
      ['checked', 'bool', false],
      ['handler', 'ident', ''],
    ],
    // SCheckBox holds its label in its default slot rather than in an argument,
    // so the label is a real STextBlock child and pulls in its header.
    defaultSlot(n, ctx) {
      ctx.headers.add('Widgets/Text/STextBlock.h');
      return `SNew(STextBlock)\n.Text(${ctx.text(n.props.label)})`;
    },
    emit(n, ctx) {
      const out = [];
      if (n.props.checked) out.push(`.IsChecked(ECheckBoxState::Checked)`);
      if (n.props.handler) {
        out.push(`.OnCheckStateChanged(this, &${ctx.className}::${n.props.handler})`);
      }
      return out;
    },
    members(n, ctx) {
      if (!n.props.handler) return [];
      return [{
        decl: `void ${n.props.handler}(ECheckBoxState NewState);`,
        def: `void ${ctx.className}::${n.props.handler}(ECheckBoxState NewState)\n{\n\t// TODO: handle the toggle.\n}`,
      }];
    },
  },

  editabletextbox: {
    cls: 'SEditableTextBox', header: 'Widgets/Input/SEditableTextBox.h', module: 'Slate',
    cat: 'Input', name: 'Editable Text Box',
    props: [
      ['text', 'text', ''],
      ['hintText', 'text', 'Type here'],
      ['minDesiredWidth', 'float', 120],
    ],
    emit(n, ctx) {
      const out = [];
      if (n.props.text) out.push(`.Text(${ctx.text(n.props.text)})`);
      if (n.props.hintText) out.push(`.HintText(${ctx.text(n.props.hintText)})`);
      if (n.props.minDesiredWidth > 0) {
        out.push(`.MinDesiredWidth(${ctx.f(n.props.minDesiredWidth)})`);
      }
      return out;
    },
  },

  hyperlink: {
    cls: 'SHyperlink', header: 'Widgets/Input/SHyperlink.h', module: 'Slate',
    cat: 'Input', name: 'Hyperlink',
    props: [['text', 'text', 'Learn more'], ['handler', 'ident', '']],
    emit(n, ctx) {
      const out = [`.Text(${ctx.text(n.props.text)})`];
      // SHyperlink derives from SButton and still does NOT use OnClicked. Its
      // event is OnNavigate, and it is a FSimpleDelegate, so the handler returns
      // void rather than FReply.
      if (n.props.handler) out.push(`.OnNavigate(this, &${ctx.className}::${n.props.handler})`);
      return out;
    },
    members(n, ctx) {
      if (!n.props.handler) return [];
      return [{
        decl: `void ${n.props.handler}();`,
        def: `void ${ctx.className}::${n.props.handler}()\n{\n\t// TODO: follow the link.\n}`,
      }];
    },
  },

  searchbox: {
    cls: 'SSearchBox', header: 'Widgets/Input/SSearchBox.h', module: 'Slate',
    cat: 'Input', name: 'Search Box',
    props: [['text', 'text', ''], ['hintText', 'text', 'Search']],
    emit(n, ctx) {
      const out = [];
      // SSearchBox re-declares its own FArguments, and it seeds from InitialText
      // rather than Text. Emitting .Text() here does not compile.
      if (n.props.text) out.push(`.InitialText(${ctx.text(n.props.text)})`);
      if (n.props.hintText) out.push(`.HintText(${ctx.text(n.props.hintText)})`);
      return out;
    },
  },

  slider: {
    cls: 'SSlider', header: 'Widgets/Input/SSlider.h', module: 'Slate',
    cat: 'Input', name: 'Slider',
    // Two traps here. Value defaults to 1.f, not 0.f. And MinValue/MaxValue are
    // plain SLATE_ARGUMENTs while Value is an attribute, so only Value is
    // bindable.
    props: [
      ['value', 'float', 1], ['minValue', 'float', 0], ['maxValue', 'float', 1],
      ['stepSize', 'float', 0.01], ['handler', 'ident', ''],
    ],
    emit(n, ctx) {
      const out = [];
      if (n.props.value !== 1) out.push(`.Value(${ctx.f(n.props.value)})`);
      if (n.props.minValue !== 0) out.push(`.MinValue(${ctx.f(n.props.minValue)})`);
      if (n.props.maxValue !== 1) out.push(`.MaxValue(${ctx.f(n.props.maxValue)})`);
      if (n.props.stepSize !== 0.01) out.push(`.StepSize(${ctx.f(n.props.stepSize)})`);
      if (n.props.handler) out.push(`.OnValueChanged(this, &${ctx.className}::${n.props.handler})`);
      return out;
    },
    members(n, ctx) {
      if (!n.props.handler) return [];
      return [{
        decl: `void ${n.props.handler}(float NewValue);`,
        def: `void ${ctx.className}::${n.props.handler}(float NewValue)\n{\n\t// TODO: store the value.\n}`,
      }];
    },
  },

  spinbox: {
    cls: 'SSpinBox', header: 'Widgets/Input/SSpinBox.h', module: 'Slate',
    cat: 'Input', name: 'Spin Box',
    // A template. SNew has to be given the type argument.
    template: 'NumericType',
    props: [
      ['typeArg', 'enum', 'float', { values: ['float', 'int32', 'double'] }],
      ['value', 'float', 0], ['minValue', 'float', 0], ['maxValue', 'float', 100],
      // SSpinBox spells this EnableWheel. SNumericEntryBox spells the same idea
      // AllowWheel. Normalizing either one produces code that does not compile.
      ['enableWheel', 'bool', true],
    ],
    emit(n, ctx) {
      const out = [`.Value(${ctx.f(n.props.value)})`];
      out.push(`.MinValue(${ctx.f(n.props.minValue)})`);
      out.push(`.MaxValue(${ctx.f(n.props.maxValue)})`);
      if (!n.props.enableWheel) out.push('.EnableWheel(false)');
      return out;
    },
  },

  numericentrybox: {
    cls: 'SNumericEntryBox', header: 'Widgets/Input/SNumericEntryBox.h', module: 'Slate',
    cat: 'Input', name: 'Numeric Entry Box',
    template: 'NumericType',
    props: [
      ['typeArg', 'enum', 'float', { values: ['float', 'int32', 'double'] }],
      ['value', 'float', 0],
      ['allowWheel', 'bool', true],
      ['allowSpin', 'bool', false],
    ],
    emit(n, ctx) {
      // Value is TOptional<T> here, not T: unset renders UndeterminedString.
      const out = [`.Value(${ctx.f(n.props.value)})`];
      if (n.props.allowSpin) out.push('.AllowSpin(true)');
      if (!n.props.allowWheel) out.push('.AllowWheel(false)');
      return out;
    },
  },

  image: {
    cls: 'SImage', header: 'Widgets/Images/SImage.h', module: 'SlateCore',
    cat: 'Display', name: 'Image',
    props: [
      ['brush', 'text', 'Icons.Help'],
      ['colorAndOpacity', 'color', '#ffffffff'],
      ['sizeX', 'float', 16], ['sizeY', 'float', 16],
    ],
    emit(n, ctx) {
      const out = [`.Image(FAppStyle::Get().GetBrush("${n.props.brush}"))`];
      if (n.props.colorAndOpacity !== '#ffffffff') {
        out.push(`.ColorAndOpacity(${ctx.color(n.props.colorAndOpacity)})`);
      }
      out.push(`.DesiredSizeOverride(FVector2D(${ctx.f(n.props.sizeX)}, ${ctx.f(n.props.sizeY)}))`);
      return out;
    },
  },

  throbber: {
    cls: 'SThrobber', header: 'Widgets/Images/SThrobber.h', module: 'Slate',
    cat: 'Display', name: 'Throbber',
    // SThrobber and SCircularThrobber are NOT interchangeable. This one has
    // Animate and no ColorAndOpacity; the circular one is the other way round.
    props: [['pieces', 'int', 3], ['animate', 'enum', 'All',
      { values: ['All', 'Vertical', 'Horizontal', 'Opacity', 'VerticalAndOpacity', 'None'] }]],
    emit(n) {
      const out = [];
      if (n.props.pieces !== 3) out.push(`.NumPieces(${n.props.pieces})`);
      // EAnimation is a bit-flag enum nested in the class, so values must be
      // emitted qualified.
      if (n.props.animate !== 'All') out.push(`.Animate(SThrobber::${n.props.animate})`);
      return out;
    },
  },

  circularthrobber: {
    cls: 'SCircularThrobber', header: 'Widgets/Images/SThrobber.h', module: 'Slate',
    cat: 'Display', name: 'Circular Throbber',
    props: [
      ['pieces', 'int', 6], ['radius', 'float', 16],
      ['colorAndOpacity', 'color', '#ffffffff'],
    ],
    emit(n, ctx) {
      const out = [];
      if (n.props.pieces !== 6) out.push(`.NumPieces(${n.props.pieces})`);
      if (n.props.radius !== 16) out.push(`.Radius(${ctx.f(n.props.radius)})`);
      if (n.props.colorAndOpacity !== '#ffffffff') {
        out.push(`.ColorAndOpacity(${ctx.color(n.props.colorAndOpacity)})`);
      }
      return out;
    },
  },

  // ---- Panels -----------------------------------------------------------

  verticalbox: {
    cls: 'SVerticalBox', header: 'Widgets/SBoxPanel.h', module: 'SlateCore',
    cat: 'Panel', name: 'Vertical Box',
    container: true, slotted: true, axis: 'y', slotType: 'SVerticalBox::FSlot',
    props: [],
    emit() { return []; },
  },

  horizontalbox: {
    cls: 'SHorizontalBox', header: 'Widgets/SBoxPanel.h', module: 'SlateCore',
    cat: 'Panel', name: 'Horizontal Box',
    container: true, slotted: true, axis: 'x', slotType: 'SHorizontalBox::FSlot',
    props: [],
    emit() { return []; },
  },

  overlay: {
    cls: 'SOverlay', header: 'Widgets/SOverlay.h', module: 'SlateCore',
    cat: 'Panel', name: 'Overlay',
    // Not FSlot. SOverlay::FSlot does not compile.
    container: true, slotted: true, axis: 'z', slotType: 'SOverlay::FOverlaySlot',
    props: [],
    emit() { return []; },
  },

  border: {
    cls: 'SBorder', header: 'Widgets/Layout/SBorder.h', module: 'Slate',
    cat: 'Panel', name: 'Border',
    container: true, single: true,
    props: [
      ['borderBackgroundColor', 'color', '#3a3a3aff'],
      // The engine default is FMargin(2.0f). Emitting nothing still insets by 2.
      ['padL', 'float', 2], ['padT', 'float', 2], ['padR', 'float', 2], ['padB', 'float', 2],
    ],
    emit(n, ctx) {
      const out = [`.BorderImage(FAppStyle::Get().GetBrush("ToolPanel.GroupBorder"))`];
      if (n.props.borderBackgroundColor !== '#3a3a3aff') {
        out.push(`.BorderBackgroundColor(${ctx.color(n.props.borderBackgroundColor)})`);
      }
      const m = ctx.margin(n.props.padL, n.props.padT, n.props.padR, n.props.padB);
      if (m !== 'FMargin(2.f)') out.push(`.Padding(${m})`);
      return out;
    },
  },

  box: {
    cls: 'SBox', header: 'Widgets/Layout/SBox.h', module: 'Slate',
    cat: 'Panel', name: 'Box',
    container: true, single: true,
    props: [
      // All eight sizing arguments are TAttribute<FOptionalSize>. Unset means no
      // override, so -1 is the document's "unset" and 0 would force a zero-width
      // box rather than leaving it alone.
      ['widthOverride', 'float', -1],
      ['heightOverride', 'float', -1],
      ['minDesiredWidth', 'float', -1],
      ['minDesiredHeight', 'float', -1],
    ],
    emit(n, ctx) {
      const out = [];
      for (const [key, arg] of [
        ['widthOverride', 'WidthOverride'], ['heightOverride', 'HeightOverride'],
        ['minDesiredWidth', 'MinDesiredWidth'], ['minDesiredHeight', 'MinDesiredHeight'],
      ]) {
        if (n.props[key] >= 0) out.push(`.${arg}(${ctx.f(n.props[key])})`);
      }
      return out;
    },
  },
};

// ---- The second wave, researched against what the wasm module already
// compiles: every class below has its .o in slate-wasm/build/link-objects.rsp,
// so the preview costs a BuildNode case and no new engine units. ------------

SLATE_WIDGETS.multilinetextbox = {
  cls: 'SMultiLineEditableTextBox', header: 'Widgets/Input/SMultiLineEditableTextBox.h', module: 'Slate',
  cat: 'Input', name: 'Multi-line Text Box',
  props: [
    ['text', 'text', ''],
    ['hintText', 'text', 'Type here'],
    ['autoWrap', 'bool', true],
  ],
  emit(n, ctx) {
    const out = [];
    if (n.props.text) out.push(`.Text(${ctx.text(n.props.text)})`);
    if (n.props.hintText) out.push(`.HintText(${ctx.text(n.props.hintText)})`);
    if (n.props.autoWrap) out.push('.AutoWrapText(true)');
    return out;
  },
};

SLATE_WIDGETS.textcombobox = {
  cls: 'STextComboBox', header: 'Widgets/Input/STextComboBox.h', module: 'Slate',
  cat: 'Input', name: 'Text Combo Box',
  props: [
    ['items', 'items', 'Option A, Option B, Option C'],
    ['selectedIndex', 'int', 0],
  ],
  // The options array is a static local ahead of ChildSlot, so the whole
  // widget stays inside the one function the pane shows and the parser can
  // read the items back out of it.
  preLines(n, ctx) {
    const items = String(n.props.items || '').split(',').map(s => s.trim()).filter(Boolean);
    const list = items.map(s => `MakeShared<FString>(TEXT("${slateEscape(s)}"))`).join(', ');
    return [`static TArray<TSharedPtr<FString>> Options${n.id} { ${list} };`];
  },
  emit(n) {
    const items = String(n.props.items || '').split(',').map(s => s.trim()).filter(Boolean);
    const sel = Math.max(0, Math.min(items.length - 1, Math.trunc(n.props.selectedIndex || 0)));
    const out = [`.OptionsSource(&Options${n.id})`];
    if (items.length) out.push(`.InitiallySelectedItem(Options${n.id}[${sel}])`);
    return out;
  },
};

SLATE_WIDGETS.colorblock = {
  cls: 'SColorBlock', header: 'Widgets/Colors/SColorBlock.h', module: 'Slate',
  cat: 'Display', name: 'Color Block',
  props: [
    ['color', 'color', '#4488ffff'],
    ['sizeX', 'float', 40], ['sizeY', 'float', 16],
  ],
  emit(n, ctx) {
    // SColorBlock's Color is a bare FLinearColor attribute, not FSlateColor.
    return [
      `.Color(${ctx.linear(n.props.color)})`,
      `.Size(FVector2D(${ctx.f(n.props.sizeX)}, ${ctx.f(n.props.sizeY)}))`,
    ];
  },
};

SLATE_WIDGETS.spinningimage = {
  cls: 'SSpinningImage', header: 'Widgets/Images/SSpinningImage.h', module: 'Slate',
  cat: 'Display', name: 'Spinning Image',
  props: [['brush', 'text', 'Icons.Help'], ['period', 'float', 1]],
  emit(n, ctx) {
    const out = [`.Image(FAppStyle::Get().GetBrush("${n.props.brush}"))`];
    if (n.props.period !== 1) out.push(`.Period(${ctx.f(n.props.period)})`);
    return out;
  },
};

SLATE_WIDGETS.scrollbox = {
  cls: 'SScrollBox', header: 'Widgets/Layout/SScrollBox.h', module: 'Slate',
  cat: 'Panel', name: 'Scroll Box',
  // axis 'z': scroll box slots carry padding and alignment but no fill,
  // the same emission shape as SOverlay's.
  container: true, slotted: true, axis: 'z', slotType: 'SScrollBox::FSlot',
  props: [['orientation', 'enum', 'Vertical', { values: ['Vertical', 'Horizontal'] }]],
  emit(n) {
    return n.props.orientation === 'Horizontal' ? ['.Orientation(Orient_Horizontal)'] : [];
  },
};

SLATE_WIDGETS.wrapbox = {
  cls: 'SWrapBox', header: 'Widgets/Layout/SWrapBox.h', module: 'Slate',
  cat: 'Panel', name: 'Wrap Box',
  container: true, slotted: true, axis: 'z', slotType: 'SWrapBox::FSlot',
  props: [['innerSlotPadding', 'float', 0]],
  emit(n, ctx) {
    // UseAllottedSize is what makes a wrap box wrap at its arranged width
    // instead of never wrapping at all; emitted always because the studio's
    // layout model has no other honest reading.
    const out = ['.UseAllottedSize(true)'];
    if (n.props.innerSlotPadding > 0) {
      out.push(`.InnerSlotPadding(FVector2D(${ctx.f(n.props.innerSlotPadding)}, ${ctx.f(n.props.innerSlotPadding)}))`);
    }
    return out;
  },
};

SLATE_WIDGETS.widgetswitcher = {
  cls: 'SWidgetSwitcher', header: 'Widgets/Layout/SWidgetSwitcher.h', module: 'Slate',
  cat: 'Panel', name: 'Widget Switcher',
  container: true, slotted: true, axis: 'z', slotType: 'SWidgetSwitcher::FSlot',
  props: [['activeIndex', 'int', 0]],
  emit(n) { return [`.WidgetIndex(${Math.max(0, Math.trunc(n.props.activeIndex || 0))})`]; },
};

SLATE_WIDGETS.splitter = {
  cls: 'SSplitter', header: 'Widgets/Layout/SSplitter.h', module: 'Slate',
  cat: 'Panel', name: 'Splitter',
  // Splitter slots take a proportional .Value and nothing else; slotValue
  // routes the child's slot weight there instead of the fill/align set.
  container: true, slotted: true, slotValue: true, slotType: 'SSplitter::FSlot',
  props: [['orientation', 'enum', 'Horizontal', { values: ['Horizontal', 'Vertical'] }]],
  emit(n) {
    return n.props.orientation === 'Vertical' ? ['.Orientation(Orient_Vertical)'] : [];
  },
};

SLATE_WIDGETS.scalebox = {
  cls: 'SScaleBox', header: 'Widgets/Layout/SScaleBox.h', module: 'Slate',
  cat: 'Panel', name: 'Scale Box',
  container: true, single: true,
  props: [
    ['stretch', 'enum', 'ScaleToFit',
      { values: ['None', 'Fill', 'ScaleToFit', 'ScaleToFill', 'UserSpecified'] }],
    ['userScale', 'float', 1],
  ],
  emit(n, ctx) {
    const out = [`.Stretch(EStretch::${n.props.stretch})`];
    if (n.props.stretch === 'UserSpecified') out.push(`.UserSpecifiedScale(${ctx.f(n.props.userScale)})`);
    return out;
  },
};

SLATE_WIDGETS.expandablearea = {
  cls: 'SExpandableArea', header: 'Widgets/Layout/SExpandableArea.h', module: 'Slate',
  cat: 'Panel', name: 'Expandable Area',
  // Body content is a NAMED slot, which childSlotMethod spells out; a bare
  // [ ] does not compile against SExpandableArea.
  container: true, single: true, childSlotMethod: 'BodyContent',
  props: [
    ['areaTitle', 'text', 'Details'],
    ['initiallyCollapsed', 'bool', false],
  ],
  emit(n, ctx) {
    const out = [`.AreaTitle(${ctx.text(n.props.areaTitle)})`];
    if (n.props.initiallyCollapsed) out.push('.InitiallyCollapsed(true)');
    return out;
  },
};

// A block of Slate the tool carries verbatim: the parser wraps any SNew of a
// class it does not model in one of these, the generator re-emits the code
// untouched, and the preview draws a neutral placeholder. Hidden from the
// palette, the same convention as the imgui page's Raw C++ node; the code
// pane and the inspector are how one is made and edited.
SLATE_WIDGETS.rawwidget = {
  cls: null, header: null, module: null,
  cat: 'Layout', name: 'Raw Slate', hidden: true,
  props: [['code', 'longtext', '']],
  emit() { return []; },
};

// The document's slot vocabulary. A slot is a property of the CHILD as the
// designer sees it, but it belongs to the parent panel in the emitted code, which
// is the single biggest structural difference from the ImGui generator.
const SLATE_SLOT_DEFAULTS = {
  size: 'auto',        // 'auto' -> AutoHeight()/AutoWidth(), 'fill' -> FillHeight(w)
  weight: 1,
  hAlign: 'Fill',      // HAlign_Fill | Left | Center | Right
  vAlign: 'Fill',      // VAlign_Fill | Top | Center | Bottom
  padding: [0, 0, 0, 0],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SLATE_WIDGETS, SLATE_SLOT_DEFAULTS };
}
