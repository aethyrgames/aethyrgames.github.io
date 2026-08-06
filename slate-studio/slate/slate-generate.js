// The Slate C++ generator.
//
// The structural difference from app/generate.js, and the reason a second code()
// per widget in the shared catalog could never have worked: ImGui's emitter walks
// the tree pushing STATEMENTS into a flat out[] array, with children written in
// between an open and a close at depth + 1. Slate composes as ONE EXPRESSION.
// Children are arguments inside their parent's [ ], each wrapped in its own slot.
// There is no string a code() can return that turns a flat push-lines recursion
// into that shape, so here the recursion builds a value and returns it.
//
// Three different operator[] exist in Slate and a generator must not conflate
// them: FArguments::operator[] from SLATE_DEFAULT_SLOT (what SBorder and SButton
// take), NamedSlotProperty::operator[] from SLATE_NAMED_SLOT, and the live
// ChildSlot object inside Construct. This file emits the first and the third.

// 4.f rather than 4.0f for whole numbers, which is the spelling engine code uses.
function slateF(v) {
  if (Number.isInteger(v)) return `${v}.f`;
  return `${String(Number(v.toFixed(4)))}f`;
}

function slateMargin(l, t, r, b) {
  if (l === t && t === r && r === b) return `FMargin(${slateF(l)})`;
  if (l === r && t === b) return `FMargin(${slateF(l)}, ${slateF(t)})`;
  return `FMargin(${slateF(l)}, ${slateF(t)}, ${slateF(r)}, ${slateF(b)})`;
}

function slateLinearColor(hex) {
  const s = String(hex).replace('#', '');
  const n = p => Number((parseInt(s.substr(p, 2), 16) / 255).toFixed(3));
  const a = s.length >= 8 ? n(6) : 1;
  return `FLinearColor(${slateF(n(0))}, ${slateF(n(2))}, ${slateF(n(4))}, ${slateF(a)})`;
}

function slateColor(hex) {
  const s = String(hex).replace('#', '');
  const n = p => Number((parseInt(s.substr(p, 2), 16) / 255).toFixed(3));
  // Through slateF, not bare `${v}f`: a whole channel came out as `1f`,
  // which is not a C++ literal. The preview rendered these colors for weeks
  // while the emitted code had never compiled once. slate:verify found it
  // the first time it ran.
  const a = s.length >= 8 ? n(6) : 1;
  return `FSlateColor(FLinearColor(${slateF(n(0))}, ${slateF(n(2))}, ${slateF(n(4))}, ${slateF(a)}))`;
}

function slateEscape(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// Every user-facing string becomes LOCTEXT, which is why the .cpp needs a
// matching #define/#undef LOCTEXT_NAMESPACE pair. Emitting LOCTEXT without the
// pair is a hard compile error, so the two are generated together or not at all.
function slateMakeCtx(className) {
  const used = Object.create(null);
  return {
    className,
    f: slateF,
    margin: slateMargin,
    color: slateColor,
    linear: slateLinearColor,
    headers: new Set(),
    aliases: [],
    // statements a widget needs ahead of ChildSlot (a combo box's options
    // array); collected per window and emitted inside Construct
    preLines: [],
    text(value) {
      if (value === '' || value == null) return 'FText::GetEmpty()';
      let key = String(value).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
      if (!key) key = 'Text';
      let k = key, i = 2;
      while (used[k]) k = `${key}_${i++}`;
      used[k] = true;
      return `LOCTEXT("${k}", "${slateEscape(value)}")`;
    },
  };
}

const SLATE_INDENT = '\t';

function slateIndent(lines, by) {
  const pad = SLATE_INDENT.repeat(by);
  return lines.map(l => (l === '' ? l : pad + l));
}

// Returns an array of lines with no leading indentation. The caller decides where
// it sits, which is what makes this composable at any depth.
function slateEmitWidget(node, ctx) {
  // Raw Slate: the code IS the emission, verbatim. Before the header add,
  // because a raw block has no header of its own and any class it uses is
  // the author's include to supply.
  if (node.type === 'rawwidget') {
    const code = String(node.props.code || '').split('\n').filter(l => l.trim());
    return code.length ? code : ['SNullWidget::NullWidget'];
  }
  const spec = SLATE_WIDGETS[node.type];
  if (!spec) return [`// unknown widget type: ${node.type}`];
  ctx.headers.add(spec.header);
  if (spec.preLines) ctx.preLines.push(...spec.preLines(node, ctx));

  // A template widget needs its type argument inside SNew. SNew is a VARIADIC
  // macro, so a type argument containing a top-level comma splits the macro's
  // own argument list: SNew(SComboBox<TPair<int,int>>) expands with WidgetType =
  // "SComboBox<TPair<int" and produces a baffling error rather than a clear one.
  // The fix is a `using` alias ahead of the chain, so the macro sees one token.
  const typeArg = spec.template ? String(node.props.typeArg || 'float') : null;
  let cls = spec.cls;
  if (typeArg) {
    if (typeArg.includes(',')) {
      const alias = `F${spec.cls.replace(/^S/, '')}Arg${node.id}`;
      ctx.aliases.push(`using ${alias} = ${spec.cls}<${typeArg}>;`);
      cls = alias;
    } else {
      cls = `${spec.cls}<${typeArg}>`;
    }
  }

  const lines = [`SNew(${cls})`];
  for (const el of spec.emit(node, ctx) || []) lines.push(el);

  // Visibility is modelled centrally: every widget carries `visible`, and
  // false is the only value that emits, as UMG's Collapsed.
  if (node.props.visible === false) lines.push('.Visibility(EVisibility::Collapsed)');

  // Chain calls the tool does not model, carried verbatim on the node (the
  // parser collects them, the inspector edits them). Emitted after the
  // modelled calls, so a generated-parsed-generated cycle is stable.
  if (node.props.extraCode) {
    for (const line of String(node.props.extraCode).split('\n')) {
      if (line.trim()) lines.push(line);
    }
  }

  // A widget with a default slot it fills itself, e.g. SCheckBox's label.
  if (spec.defaultSlot) {
    const inner = spec.defaultSlot(node, ctx);
    if (inner) {
      lines.push('[');
      lines.push(...slateIndent(inner.split('\n'), 1));
      lines.push(']');
    }
  }

  const kids = node.children || [];
  if (!spec.container || !kids.length) return lines;

  if (spec.slotted) {
    for (const c of kids) {
      const s = slateSlot(c);
      // The slot factory is always ::Slot(), even for SOverlay whose slot TYPE is
      // FOverlaySlot. `+` here is binary operator+ on the parent's FArguments,
      // generated by SLATE_SLOT_ARGUMENT.
      lines.push(`+ ${spec.cls}::Slot()`);
      const mods = [];
      if (spec.slotValue) {
        // SSplitter's slots take a proportional Value and no alignment or
        // padding; the child's slot weight is the honest carrier.
        mods.push(`.Value(${slateF(s.weight)})`);
        lines.push(...slateIndent(mods, 1));
        lines.push(...slateIndent(['['], 1));
        lines.push(...slateIndent(slateEmitWidget(c, ctx), 2));
        lines.push(...slateIndent([']'], 1));
        continue;
      }
      if (spec.axis === 'y') {
        mods.push(s.size === 'fill' ? `.FillHeight(${slateF(s.weight)})` : '.AutoHeight()');
      } else if (spec.axis === 'x') {
        mods.push(s.size === 'fill' ? `.FillWidth(${slateF(s.weight)})` : '.AutoWidth()');
      }
      const [pl, pt, pr, pb] = s.padding;
      if (pl || pt || pr || pb) mods.push(`.Padding(${slateMargin(pl, pt, pr, pb)})`);
      if (s.hAlign !== 'Fill') mods.push(`.HAlign(HAlign_${s.hAlign})`);
      if (s.vAlign !== 'Fill') mods.push(`.VAlign(VAlign_${s.vAlign})`);
      lines.push(...slateIndent(mods, 1));
      lines.push(...slateIndent(['['], 1));
      lines.push(...slateIndent(slateEmitWidget(c, ctx), 2));
      lines.push(...slateIndent([']'], 1));
    }
    return lines;
  }

  // Single-child panel: the child goes into the default slot, or into the
  // named slot the spec spells out (SExpandableArea's BodyContent).
  if (spec.childSlotMethod) lines.push(`.${spec.childSlotMethod}()`);
  lines.push('[');
  lines.push(...slateIndent(slateEmitWidget(kids[0], ctx), 1));
  lines.push(']');
  return lines;
}

function slateCollectMembers(node, ctx, acc) {
  const spec = SLATE_WIDGETS[node.type];
  if (spec && spec.members) acc.push(...spec.members(node, ctx));
  for (const c of node.children || []) slateCollectMembers(c, ctx, acc);
  return acc;
}

// The full .h/.cpp pair. Section 6 of the research argues this is the right
// output shape: an SCompoundWidget is the unit Slate composes, it needs no editor
// context, and it drops into a tab spawner, an SWindow or another widget equally.
function slateGenerate(root, className) {
  className = className || 'SGeneratedPanel';
  const ctx = slateMakeCtx(className);
  const body = slateEmitWidget(root, ctx);
  const members = slateCollectMembers(root, ctx, []);

  const header = [
    '// Generated by slate-studio. Edits inside Construct are round-tripped;',
    '// hand-written members are preserved.',
    '#pragma once',
    '',
    '#include "CoreMinimal.h"',
    '#include "Widgets/SCompoundWidget.h"',
    '#include "Widgets/DeclarativeSyntaxSupport.h"',
    '',
    `class ${className} : public SCompoundWidget`,
    '{',
    'public:',
    `${SLATE_INDENT}SLATE_BEGIN_ARGS(${className}) {}`,
    `${SLATE_INDENT}SLATE_END_ARGS()`,
    '',
    `${SLATE_INDENT}void Construct(const FArguments& InArgs);`,
  ];
  if (members.length) {
    header.push('', 'private:');
    for (const m of members) header.push(`${SLATE_INDENT}${m.decl}`);
  }
  header.push('};', '');

  const includes = [...ctx.headers].sort().map(h => `#include "${h}"`);
  const cpp = [
    `#include "${className}.h"`,
    '',
    ...includes,
    '#include "Styling/AppStyle.h"',
    '#include "Styling/CoreStyle.h"',
    '',
    `#define LOCTEXT_NAMESPACE "${className}"`,
    '',
    ...(ctx.aliases.length ? [...ctx.aliases, ''] : []),
    `void ${className}::Construct(const FArguments& InArgs)`,
    '{',
    `${SLATE_INDENT}ChildSlot`,
    `${SLATE_INDENT}[`,
    ...slateIndent(body, 2),
    `${SLATE_INDENT}];`,
    '}',
  ];
  for (const m of members) cpp.push('', m.def);
  cpp.push('', '#undef LOCTEXT_NAMESPACE', '');

  return { header: header.join('\n'), cpp: cpp.join('\n'), className };
}

// A class name from a window label: 'Account Settings' -> SAccountSettings.
// Deterministic, because the round trip depends on generate(parse(generate()))
// spelling every name identically.
function slateClassName(label, taken) {
  const words = String(label || '').split(/[^A-Za-z0-9]+/).filter(Boolean);
  let base = 'S' + (words.map(w => w[0].toUpperCase() + w.slice(1)).join('') || 'GeneratedPanel');
  if (/^\d/.test(base.slice(1))) base = 'SPanel' + base.slice(1);
  let name = base, i = 2;
  while (taken.has(name)) name = base + (i++);
  taken.add(name);
  return name;
}

// The whole document: one SCompoundWidget per window, which is how UE code
// actually ships (something else owns the SWindow). Each window's frame has
// no C++ home, so it rides in a `// Window:` comment the parser reads back.
// One LOCTEXT namespace and one shared key set span the file; the ctx's
// className is re-pointed per window because handler bindings and member
// definitions spell the owning class out.
function slateGenerateDoc(wins, opts) {
  const ctx = slateMakeCtx('SlateStudio');
  const taken = new Set();
  const blocks = [];
  for (const win of wins) {
    const cls = slateClassName(win.label, taken);
    ctx.className = cls;
    const aliasStart = ctx.aliases.length;
    ctx.preLines = [];
    const body = slateEmitWidget(win.root, ctx);
    const members = slateCollectMembers(win.root, ctx, []);
    const b = [
      ...ctx.aliases.slice(aliasStart),
      `void ${cls}::Construct(const FArguments& InArgs)`,
      '{',
      ...slateIndent(ctx.preLines, 1),
      ...(ctx.preLines.length ? [''] : []),
      `${SLATE_INDENT}ChildSlot`,
      `${SLATE_INDENT}[`,
      ...slateIndent(body, 2),
      `${SLATE_INDENT}];`,
      '}',
    ];
    for (const m of members) b.push('', m.def);
    blocks.push({ cls, lines: b, members, win });
  }

  // The document root, as code rather than comments. Each window's title,
  // size and position used to ride in a // Window: comment, which was the
  // one part of the document the pane only DESCRIBED. This function is the
  // part that creates the windows, and the parser reads the frames back out
  // of it, so the whole tree from leaf to root is real C++.
  ctx.headers.add('Widgets/SWindow.h');
  ctx.headers.add('Framework/Application/SlateApplication.h');
  const opener = [
    '// The document root: one SWindow per window, hosting the classes above.',
    '// Call once after Slate is initialized.',
    'void OpenStudioWindows()',
    '{',
  ];
  blocks.forEach((b, i) => {
    const varName = `${b.cls.replace(/^S/, '')}Window`;
    if (i) opener.push('');
    opener.push(
      `${SLATE_INDENT}TSharedRef<SWindow> ${varName} = SNew(SWindow)`,
      `${SLATE_INDENT}${SLATE_INDENT}.Title(${ctx.text(b.win.label || 'My Panel')})`,
      `${SLATE_INDENT}${SLATE_INDENT}.ClientSize(FVector2D(${slateF(Math.round(b.win.w))}, ${slateF(Math.round(b.win.h))}))`,
      `${SLATE_INDENT}${SLATE_INDENT}.ScreenPosition(FVector2D(${slateF(Math.round(b.win.x))}, ${slateF(Math.round(b.win.y))}))`,
      `${SLATE_INDENT}${SLATE_INDENT}.AutoCenter(EAutoCenter::None)`,
      `${SLATE_INDENT}${SLATE_INDENT}[`,
      `${SLATE_INDENT}${SLATE_INDENT}${SLATE_INDENT}SNew(${b.cls})`,
      `${SLATE_INDENT}${SLATE_INDENT}];`,
      `${SLATE_INDENT}FSlateApplication::Get().AddWindow(${varName});`,
    );
  });
  opener.push('}');

  const out = [
    `// Generated by Slate Studio${typeof STUDIO_VERSION === 'undefined' ? '' : ` v${STUDIO_VERSION}`}. One SCompoundWidget per window, and`,
    '// OpenStudioWindows() at the end is the document root: it creates each',
    '// SWindow and hosts its class. Edits are round-tripped; handler names',
    '// survive, handler bodies are regenerated.',
    ...blocks.map(b => `#include "${b.cls}.h"`),
    '',
    ...[...ctx.headers].sort().map(h => `#include "${h}"`),
    '#include "Styling/AppStyle.h"',
    '#include "Styling/CoreStyle.h"',
    '',
    '#define LOCTEXT_NAMESPACE "SlateStudio"',
  ];
  for (const b of blocks) out.push('', ...b.lines);
  out.push('', ...opener);
  out.push('', '#undef LOCTEXT_NAMESPACE', '');
  const cpp = out.join('\n');
  if (!opts || !opts.withHeaders) return cpp;

  // The .h per class, for callers that compile the output (slate:verify).
  // SlateTypes.h rides along because member declarations can name
  // ECheckBoxState, and the generated cpp includes this header before any
  // widget header has had a chance to introduce it.
  const headers = blocks.map(b => ({
    cls: b.cls,
    text: [
      '// Generated by Slate Studio.',
      '#pragma once',
      '',
      '#include "CoreMinimal.h"',
      '#include "Widgets/SCompoundWidget.h"',
      '#include "Widgets/DeclarativeSyntaxSupport.h"',
      '#include "Styling/SlateTypes.h"',
      '',
      `class ${b.cls} : public SCompoundWidget`,
      '{',
      'public:',
      `${SLATE_INDENT}SLATE_BEGIN_ARGS(${b.cls}) {}`,
      `${SLATE_INDENT}SLATE_END_ARGS()`,
      '',
      `${SLATE_INDENT}void Construct(const FArguments& InArgs);`,
      ...(b.members.length
        ? ['', 'private:', ...b.members.map(m => `${SLATE_INDENT}${m.decl}`)]
        : []),
      '};',
      '',
    ].join('\n'),
  }));
  return { cpp, headers };
}

// The module wiring, which is the part people forget and which makes the
// difference between code that compiles and code that does not link. Slate,
// SlateCore and InputCore are the runtime floor.
function slateBuildCs(moduleName) {
  return [
    `PublicDependencyModuleNames.AddRange(new string[]`,
    `{`,
    `${SLATE_INDENT}"Core",`,
    `${SLATE_INDENT}"CoreUObject",`,
    `${SLATE_INDENT}"Slate",`,
    `${SLATE_INDENT}"SlateCore",`,
    `${SLATE_INDENT}"InputCore",`,
    `});`,
  ].join('\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    slateGenerate, slateGenerateDoc, slateLinearColor, slateEmitWidget, slateMakeCtx, slateBuildCs,
    slateF, slateMargin, slateColor, slateEscape, slateClassName,
  };
}
