# Arcane Terminal — Visual Identity Reference

*Design document for aethyr.gg. Not published on site.*

---

## What This Design Is Trying to Do

Aethyr is a developer tool for game developers — an audience that is visually literate, allergic to corporate design, and deeply familiar with dark-mode environments. The "Arcane Terminal" aesthetic earns trust before a word is read: it signals craft, intentionality, and domain fluency. It does this by layering six distinct traditions, each assigned a specific role. None of them fight each other because they operate on different functional layers — palette, structure, backdrop, voice, animation, and personality. The risk is always legibility vs. atmosphere. When in doubt, legibility wins. The atmosphere exists to pull people in; the content has to hold them.

---

## The Six Traditions

---

### 1. Cyberpunk — Palette and Glitch DNA

**What it contributes:** The emotional register of the entire site. "High tech, low life" — powerful tool described with controlled menace, not corporate enthusiasm. Sets the color temperature and justifies every neon choice.

**Canonical references:**
- [Blade Runner 2049 — cinematography breakdown (StudioBinder)](https://www.studiobinder.com/blog/blade-runner-2049-cinematography-analysis/) — The definitive analysis of how Roger Deakins and Denis Villeneuve use color as psychological signal. Cyan in shadows = technological coldness. Magenta = artificiality. The palette aethyr.gg uses is this film's color theory compressed to two hex values.
- [Blade Runner 2049 color palette (PremiumBeat)](https://www.premiumbeat.com/blog/symmetry-color-cinematography-blade-runner/) — How the film uses chromatic contrast between warm amber and cold cyan/magenta to create unease.
- [Ghost in the Shell (1995) — Sci-Fi Interfaces](https://scifiinterfaces.com/category/ghost-in-the-shell-1995/) — Canonical cyberpunk UI: screen-green translucent HUDs, volumetric overlays, the concept that information is light projected into dark space. The visual grammar of "data visible against the void."
- [Ghost in the Shell FUI Design — HUDS+GUIS](https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui) — Specific breakdown of the holographic interface language: transparent layers, radial reticles, monochrome-on-void.

**Where it shows up in the codebase:**
- `css/styles.css` `:root`: `--void:#0b0c1a`, `--cyan:#2fb9ff`, `--magenta:#ff2bd6`
- Glitch text effect: `.glitch` pseudo-elements with `data-text` attribute, channel-shifting in `--cyan` and `--magenta` — literally simulating chromatic aberration on a corrupted CRT
- `--line:rgba(130,150,230,.16)` — the cool lavender tint of structural borders, referencing the faint phosphor glow of a monitor edge
- Scanlines overlay (`.scanlines` in `index.html`, `opacity:.30`, `mix-blend-mode:overlay`) — CRT phosphor scan reference

**Rules:**
1. Cyan is primary data presence. Magenta is disruption — the "corrupted signal" color. Never use them at equal visual weight; they should never feel balanced.
2. The glitch effect is reserved for the hero heading only. It signals power, not decoration. Don't apply it to body text, cards, or UI chrome.
3. Scanlines stay at or below `opacity:.30`. Above that they compete with content; below `.18` they disappear entirely. The sweet spot is atmospheric texture, not visible filter.

---

### 2. The Linear Look — Structural Layout Grammar

**What it contributes:** The bones. Every section, every spacing rhythm, every card border comes from this grammar. It's what makes the page readable and navigable despite the heavy atmosphere.

**Canonical references:**
- [The Rise of Linear Style Design (Medium/Bootcamp)](https://medium.com/design-bootcamp/the-rise-of-linear-style-design-origins-trends-and-techniques-4fd96aab7646) — Best overview of the trend's ingredients: dark backgrounds, colorful diffuse glows, thin SVG borders, circuitry-like connected graphics, micro-motion.
- [Linear Design: The SaaS Design Trend (LogRocket)](https://blog.logrocket.com/ux-design/linear-design/) — Analysis of why this aesthetic works for developer audiences and where it breaks down.
- [How We Redesigned the Linear UI (linear.app)](https://linear.app/now/how-we-redesigned-the-linear-ui) — The original source of the design system, in the founders' own words. "Professional to engineers" is the stated goal.
- [Warp Terminal — Design Overview (Siiimple)](https://siiimple.com/warp-terminal/) — The closest dev-tool analog: dark IDE-like interface, modern terminal at center, block-based UI. Shows how the Linear Look applies to a tool, not a SaaS dashboard.

**Where it shows up in the codebase:**
- `css/styles.css`: card grid (`--i` stagger), `border:1px solid var(--line)` on `.faq-item`, `.card` — structural presence through line weight, not fills
- `.grid-horizon` in `index.html` — the vanishing-perspective grid is an amplified version of the subtle background grids common in Linear Look sites
- `backdrop-filter:blur()` on nav and docs sidebar — the blur effect that makes surfaces feel like frosted glass layers above the void
- Section padding rhythm: `clamp(70px,11vw,150px)` top × `clamp(20px,7vw,120px)` sides — consistent spatial grammar across all sections

**Rules:**
1. Section structure always: kicker → heading → content. The kicker establishes context before the H2 asks anything of the reader.
2. Cards gain presence through `1px` borders and low-opacity panel backgrounds, never solid fills. A solid-fill card breaks the layered-transparency feel.
3. The grid horizon and constellation are atmospheric, not structural. Never use them as backgrounds for text-heavy sections — they're for breathing space and transitions.

---

### 3. Blueprint Self-Reference — The Constellation Backdrop

**What it contributes:** Product illustration without a screenshot. The entire constellation is an abstracted rendering of the thing being sold — a live Blueprint graph — visible in the background before any copy is read.

**Canonical references:**
- [Graph Editor for Blueprints — Unreal Engine Docs](https://docs.unrealengine.com/5.3/en-US/graph-editor-for-the-blueprints-visual-scripting-editor-in-unreal-engine/) — The actual Blueprint editor. Nodes are rectangular boxes connected by wires. In the default view, wires curve, but the "Electronic Nodes" and "Gridline Blueprints" plugins enforce right-angle orthogonal routing, which is the visual the constellation mimics.
- [Gridline Blueprints Plugin (Epic Forums)](https://forums.unrealengine.com/t/gridline-blueprints-orthogonal-wire-routing-named-reroutes-for-blueprint-animgraph-editors/2703482) — Shows what the right-angle-routed Blueprint graph looks like: a circuit board. The constellation is this, abstracted to particles and luminous wires.

**Where it shows up in the codebase:**
- `js/main.js`, `draw()` function: nodes rendered via `ctx.rect()` (squares, not circles — Blueprint node boxes), wires routed with explicit midpoint right-angle logic:
  ```js
  ctx.moveTo(a.x + px, a.y + py);
  ctx.lineTo(midx + px, a.y + py);
  ctx.lineTo(midx + px, b.y + py);
  ctx.lineTo(b.x + px, b.y + py);
  ```
- Node colors `palette: ['28,230,255', '255,43,214', '155,107,255']` — cyan, magenta, violet — matching Blueprint's execution pin (white/cyan), data pin (various), and event pin (red/violet) color conventions
- Parallax: `mx/my` from `pointermove` event, `(mx - 0.5) * 26 * DPR` offset — mimics the Blueprint editor canvas pan behavior on mouse move

**Rules:**
1. The constellation should read as a Blueprint graph to someone who has used the editor. Never route connections with curves — it breaks the reference. Always right-angle.
2. Node count must stay responsive: `Math.min(54, Math.floor((innerWidth * innerHeight) / 26000))`. Enough to feel like a populated graph, not a starfield.
3. This effect is homepage-only. Other pages (docs, changelog, security) use the simpler `bg` + `grain` approach from `docs.css`. The constellation would be visually competing on content-dense pages.

---

### 4. FromSoftware — Arcane Voice and Typography

**What it contributes:** Personality. The reason the site doesn't read like a SaaS landing page or a GitHub README. Every section label, every piece of copy that describes a developer tool feature as a magical ability, comes from this tradition.

**Canonical references:**
- [Beyond the Bonfire: FromSoftware UI/UX Brilliance (Medium)](https://medium.com/@andrejafajfar/beyond-the-bonfire-unveiling-the-ui-ux-brilliance-of-fromsoftware-games-de55432b230f) — Detailed analysis of how contextual UI, staged revelation, and consequence-driven design create ceremony. Key insight: "victories feel earned because the interface itself demands mastery and presence."
- [The UX of Elden Ring (Medium)](https://medium.com/@lizzie_41951/the-ux-of-elden-ring-cdbf75eb8d84) — How Elden Ring uses minimal HUD, sparse information, and discovery to create weight.
- [Elden Ring Minimal UI Discussion (Kotaku)](https://kotaku.com/elden-ring-ui-ux-user-experience-interface-fromsoftware-1848637410) — Industry reaction to FromSoftware treating UI sparseness as a statement.
- [IM Fell DW Pica on Google Fonts](https://fonts.google.com/specimen/IM+Fell+DW+Pica). A revival of 17th-century type from the Fell collection, with ink spread and uneven edges that read like a scribed scroll. One weight (regular) plus italic, so `--f-arcane` text is set at weight 400.
- [Chakra Petch on Google Fonts](https://fonts.google.com/specimen/Chakra%2BPetch) — Designed by Cadson Demak using "ninety straight line and forty five degree method to avoid the curves," giving "a touch of computeristic to the overall design." A Thai-script typeface whose strict geometric constraint creates the futuristic rigidity in display usage.

**The IM Fell DW Pica + Chakra Petch pairing:** IM Fell DW Pica is old printed type with ink spread and uneven edges, like a scribed scroll. Chakra Petch is built entirely from right angles. Placing them together on the same page (IM Fell DW Pica for "BLUEPRINT", Chakra Petch for "AI THAT SPEAKS") creates the "arcane terminal" tension in a single glance: the old-world and the machine, neither fully in control. Neither font works alone for this purpose.

**Where it shows up in the codebase:**
- `data/home.json`: `"kicker": "// THE RITUAL"`, `"// THE POWERS"`, `"// ACQUIRE"`, `"// COMPATIBILITY"`, `"// VS THE FIELD"` — the slashed-comment kicker format borrows the code-comment syntax (`//`) while using ceremony vocabulary
- Docs metaphor system: `"spells"`, `"incant"`, `"spell-grid"`, `"spell-tools"`, `"grimoire"` throughout `data/docs-*.json` and rendered in `js/docs.js`
- `css/styles.css`: `--f-arcane:'IM Fell DW Pica','IM Fell English',Georgia,serif` used for `.glitch.arcane` (the "BLUEPRINT" word), `--f-display:'Chakra Petch'` for everything else display-weight

**Rules:**
1. IM Fell DW Pica (`--f-arcane`) is used exactly once per page: the hero's most powerful word. It must never appear in body copy, navigation, or UI chrome. Scarcity is what gives it weight.
2. Kicker labels use the `// WORD` format. The slash-comment prefix is the only place code syntax and ceremony vocabulary mix directly. Don't use it in body copy or headings.
3. The grimoire/spell vocabulary is for the docs system only. The marketing site uses ritual vocabulary (`The Ritual`, `The Powers`, `Acquire`) but avoids game-world nouns. Docs can say "spellbook"; the homepage should not.

---

### 5. FUI / Holographic — The Logo Animation

**What it contributes:** The logo behaves like a holographic projection, not a static brand mark. At rest it breathes. Triggered, it flares. This is what makes the top-right corner feel alive rather than decorative.

**Canonical references:**
- [Jayse Hansen FUI Portfolio — Iron Man HUD](https://jayse.tv/v2/?portfolio=hud-2-2) — The designer who created the JARVIS interface for the MCU. His HUD Bible set the grammar that every major franchise FUI has referenced since: void background, electric cyan as primary data color, volumetric glow halos, particle systems that make static imagery feel active.
- [Jayse Hansen — About](https://jayse.io/about) — Overview of his work across Marvel, Star Wars, The Hunger Games. The principle stated: graphics must "enhance performance rather than distract." Applied to the logo: the animation must feel alive, not show-off.
- [HUDS+GUIS — Avengers Interface Designs](https://www.hudsandguis.com/home/2013/05/15/the-avengers) — A comprehensive look at the full Avengers FUI system. The holographic language: layered transparent surfaces, radial elements, animated data widgets that pulse to show processing state.
- [Territory Studio — Ghost in the Shell](https://territorystudio.com/project/ghost-in-the-shell/) — The 2017 film's FUI, designed to be "volumetric" rather than flat screens. The brief: "avoid flat screens, explore concepts that envisaged a technology experience in 3D." The Aethyr crystal logo is this concept applied to a brand mark.

**Where it shows up in the codebase:**
- `css/styles.css`, logo animation block:
  - `.brand-lockup`: `animation:aethyr-breathe 5s` — the whole lockup pulses `.78→1→.78` opacity (holographic "processing" state)
  - `.xtl-core`: `scale(.88)→scale(1.12)` + opacity, 5.5s — the core gem expands and contracts like a power cell
  - `.xtl-glint-violet/magenta/ember`: `opacity:.04→.94` with hold at peak — the refraction glints flash like lens flares off a crystal surface, staggered by `.8s` offsets so they never fire in sync
  - `.xtl-shard`: `opacity var(--o) → opacity*0.38` + `translateX(2.5px)` drift — particles orbit and dim, simulating a holographic field losing and regaining coherence

**Rules:**
1. All logo animations respect `@media (prefers-reduced-motion: no-preference)`. Never animate by default. The motion is opt-in at the OS level.
2. The glint cycle (`.04→.94`) should feel like a flare, not a pulse. The peak opacity must be near-full (`.88+`) and brief. A gentle glow is wrong; a flash is right.
3. The animation timing should never synchronize across elements. Stagger offsets (`.8s`, `1.6s`, `1.2s`, `.6s`) ensure the logo always feels like it's running an organic process, not looping an animation.

---

### 6. Hades Arcane-Neon Fusion — The Personality That Prevents Generic

**What it contributes:** The reason this design has a point of view rather than a mood board. Hades solved the same problem — pair ancient/mythic vocabulary with fluorescent neon without either canceling the other — and the solution is the same here: use the historical references for *gravity* and the neon for *energy*. Neither is ironic.

**Canonical references:**
- [The Aesthetics of Hades — CVGS](https://criticalvideogamestudies.com/the-aesthetics-of-hades/) — The definitive analysis. Key quote: "ancient Greek art, 20th century comic art, and a futuristic cyberpunk color palette." The combination makes it "gorgeous, badass, and sexy" — three adjectives that don't usually coexist. The trick is that none of the three traditions is used sarcastically.
- [Behind the Art of Hades — MCV/DEVELOP](https://mcvuk.com/business-news/behind-the-art-of-hades-we-value-artistic-integrity-and-excellence-in-artistic-craft-at-supergiant-however-were-first-and-foremost-a-game-design-lead-team/) — Supergiant's art process: "artistic integrity and excellence in artistic craft." The aesthetic serves the product experience, not the other way around.
- [HUD Redesign for Hades (Medium)](https://medium.com/@bramhadalvi/hud-redesign-fdc332d05291) — Breakdown of how the Hades UI maintains the aesthetic under functional constraints: the art direction survives the information architecture.

**Where it shows up in the codebase:**
- The entire copywriting voice: "an arsenal your AI can wield", "three steps to a talking grimoire", "Watch it weave" — Hades describes mythological violence in present-tense active verbs; the site describes developer tool operations the same way
- The `--ember:#ff8a4c` accent — the warm anomaly color, used sparingly (one trust badge, the ember glint on the logo). In Hades, warm tones punctuate the cooler palette as danger/power signals. Same function here.
- The `grad` class (cyan-to-violet gradient) on heading spans: used exactly twice on the homepage ("wield", "grimoire"). Hades applies its most saturated colors to the most important elements, then steps back.

**Rules:**
1. The historical vocabulary (arcane nouns) and the neon palette must coexist without either apologizing for the other. Don't "soften" the neon with pastels. Don't make the arcane language ironic. Both are sincere.
2. `--ember` is the rarest accent. It appears to mark warmth, humanity, or anomaly — never as a primary action color. If it starts appearing more than once per page section, it's been overused.
3. This tradition is the guard against generic. If a new design decision would look at home on any Linear Look SaaS site without modification, check it against this lens: does it have the arcane-neon fusion's specificity?

---

## Type System

| Face | Variable | Role | Never use for |
|------|----------|------|---------------|
| IM Fell DW Pica | `--f-arcane` | Hero's most powerful word. Old scribed-scroll texture. | Body text, nav, more than one element per page |
| Chakra Petch | `--f-display` | All display headings, kickers, card titles, stats | Body paragraphs, anything over 2 lines of running text |
| JetBrains Mono | `--f-mono` | Code, terminal output, technical tags, stats values, table values | Headings, body prose |
| Sora | `--f-body` | All body paragraphs, FAQ answers, descriptions | Headings, anything that needs visual weight |

**The pairing that makes it work:** IM Fell DW Pica on "BLUEPRINT" + Chakra Petch on "AI THAT SPEAKS" creates the specific tension that defines the brand. One is inky old print, like a scribed scroll. The other is built from right angles and circuit geometry (Chakra Petch is designed using only 90° and 45° angles, "to avoid the curves").

**Size and weight discipline:**
- Chakra Petch: `600–700` weight for display, `500` for kickers. Below `500` it reads as generic sans-serif.
- JetBrains Mono: `400–500` only. Above `500` it becomes too heavy for code context.
- Sora: `300` for fine print and captions, `400` for body, `500–600` for emphasis within prose.

---

## Color System

```
--void: #0b0c1a        The stage. Pure space, slightly blue-shifted.
--void-2: #12142a     For raised surfaces (cards, panels) on top of void.
--panel: rgba(28,31,58,.5)  Translucent panel surface. Blur behind it.

--cyan: #2fb9ff        Primary data presence. Action. Terminal output. Links.
--magenta: #ff2bd6     Disruption. The corrupted signal. Used for contrast, not comfort.
--violet: #9b6bff      Depth. Mysticism. Secondary glow. Gradient endpoint.
--ember: #ff8a4c       Warmth. The anomaly. One use per section maximum.

--ink: #e8ecff         Primary text. Slightly lavender-shifted white.
--ink-2: #c3c9ec       Secondary text. Feature descriptions, card bodies.
--ink-dim: #a3aad3     Tertiary text. Fine print, labels, metadata.

--line: rgba(130,150,230,.16)  Structural whisper. 1px borders. Almost invisible.
```

**Emotional logic:**
- Cyan is always on the user's side — it marks actions, outputs, and successes.
- Magenta is always at the edge of control — glitch, disruption, the AI doing something powerful.
- Violet is background energy — it appears in gradients, halos, and secondary elements.
- Ember appears once to break the cool palette's monotony and add human warmth.
- The three ink levels create reading hierarchy without relying on scale alone. `--ink` for what matters now; `--ink-dim` for context.

---

## Motion Principles

**What the animations communicate, and the rules that govern them:**

### Logo breathing + glint (`aethyr-breathe`, `xtl-core-breathe`, `xtl-glint`)
*Communicates: holographic processing state — the system is running.*
- Breathing cycle is 5s (slow enough to not demand attention). Core breathes at 5.5s (offset to prevent sync). Glints cycle at 4.5s with `.8s` stagger.
- Glints flash from near-invisible (`.04`) to near-opaque (`.94`). Not a gentle glow — a flare. The distinction matters.
- Never sync the three glint elements. The `0s / .8s / 1.6s` offsets are load-bearing.

### Constellation drift + parallax
*Communicates: the environment is alive; a Blueprint graph is running beneath the surface.*
- Nodes drift at `±0.12 * DPR` velocity — imperceptible unless stared at.
- Parallax offset: `(mx - 0.5) * 26 * DPR` — responsive to mouse but never exaggerated. The graph follows attention slightly, like a live editor canvas.
- Disabled entirely on mobile (`innerWidth < 760 || pointer:coarse`) and with `prefers-reduced-motion`. The effect is enhancement, not content.

### Glitch text (`.glitch` pseudo-elements)
*Communicates: power at the edge of corruption — the "high tech, low life" register.*
- Triggered by CSS animation on `.glitch` class. The pseudo-element shifts `2–4px` laterally in `--cyan` and `--magenta`, simulating chromatic aberration.
- Reserved for hero heading only. Applying it elsewhere degrades it to decoration.

### Terminal typewriter (`runTerminal()` in `js/main.js`)
*Communicates: this is a real thing that actually works, demonstrated in real time.*
- Script shows a credible developer conversation: ask about a Blueprint, get a structured answer, request an edit, watch it compile and save.
- Loops with a 4.2s pause between cycles. The pause is necessary — the end of the script must breathe before it resets.
- With `prefers-reduced-motion`, the script renders immediately without typing. The content is always accessible.

### Reveal-up on scroll (`.reveal-up`, IntersectionObserver)
*Communicates: content materializes from the void, not already present.*
- `threshold: 0.18` — elements begin revealing when 18% visible. Not too eager.
- CSS: `opacity:0; transform:translateY(24px)` → `opacity:1; transform:translateY(0)`. Short distance, no bounce.
- Fires once and `unobserve()`s. Never re-plays on scroll-up.

**What motion must never do:**
- Play before the element is in the viewport (glitch especially — if it runs off-screen it's wasted and disorienting when the user arrives).
- Loop at a frequency that competes with reading. Nothing faster than a 4s cycle on visible content.
- Override `prefers-reduced-motion`. Every animation block lives inside `@media (prefers-reduced-motion: no-preference)` or checks the `reduce` variable.
- Distract from conversion actions. The terminal animation stops when the user is interacting with the download CTA section.

---

## What We Can Do With This

### Consistent with the existing DNA — do these

**Product demo embed (highest priority missing element)**
The design language has the perfect container for a demo already — the `.terminal` component in the flow section. A 15–30 second looping `<video>` or animated GIF of a real Blueprint write operation belongs either in the hero (below the CTAs, above the marquee) or replacing the typewriter terminal entirely with a real recording. The `.terminal-bar` chrome already frames it correctly. The constellation backdrop behind it makes a video feel like a window into the system, not a marketing clip.

**Blueprint health audit page**
The spell/grimoire vocabulary in the docs maps perfectly to a "diagnostic" section: run the audit, see your Blueprint's health report formatted as a ritual result. The `.spell-grid` and `.tool-category` components in `js/docs.js` already support this layout. Thematically: "consult the grimoire about the state of your graph."

**Comparison / "vs the field" expansion**
The comparison table added in the last deploy (`// VS THE FIELD`) is correct but uses plain `✓` and `—`. This could become richer: specific numbers, tooltips with explanations, a "Why does this matter?" expand for each row. The data is in `data/home.json`, the renderer in `main.js` is extensible.

**Error states**
Currently undefined. In the arcane terminal system: errors are not red warning boxes. They're diagnostic readouts. An error state in the terminal tradition reads like a compile failure report — monospace, structured, cyan for the path to resolution. An error in the arcane tradition is a "ward failing" — something went wrong with the ritual. These two registers should merge: `✗ compile gate rejected · asset unchanged · backup at /path/` — functional and evocative simultaneously.

**Changelog visual treatment**
The changelog (`/changelog/`) currently uses the standard docs layout. A changelog in this system is a **release ritual record** — each entry is a completed spell. The date format could be more ceremonial (`JUNE · MMXXVI`), the version header could use a small crystal glyph, and the entries could be prefixed with the tool category glyphs already defined (`⌖` for read, `✶` for write, `⟁` for batch, `⛨` for safety).

**Docs "incantation" copy blocks**
The cookbook page has `incant` fields — these are the "say exactly this" prompts. They deserve a distinct visual treatment: a slightly elevated panel, the Chakra Petch font at small size, a `//` prefix, and the cyan text color. Right now they're plain `<p class="incant">`. Styling them like terminal command prompts would reinforce that these are literal invocations.

---

### Expanding the metaphor system

**What else the grimoire/spellbook metaphor could cover:**
- **Installation** → "The Binding" (the MCP config JSON is the binding contract)
- **Quickstart** → "First Invocation"
- **Tool reference** → "The Arsenal" or "The Compendium"
- **Troubleshooting** → "Dispelling" or "The Ward Log"
- **Release notes** → "The Chronicle"
- **API/config reference** → "The Runes"

**What a "ritual" onboarding flow looks like:**
Three-step flow, already named in `data/home.json` as "Bind → Speak → Watch it weave." A dedicated `/start/` page could dramatize these: step 1 shows the JSON config block with syntax highlight and copy button; step 2 shows example prompts formatted as incantations; step 3 shows the terminal output from a real write. Each step uses the `.step-no` numeral treatment already in the CSS.

**What error states look like:**
```
⛨ compile gate — save aborted
  Blueprint: BP_Enemy
  Error: pin type mismatch on node 'Set Timer by Event'
  Backup preserved at: Saved/AethyrBackups/Game_AI_BP_Enemy-20260620-143221.uasset
  → Fix the pin type and retry.
```
This sample is a batch rollback (`apply_ops`), the case where the compile gate refuses the save by default. Monospace. Cyan for the path, `--ink-dim` for the technical detail, `--ember` for the error indicator (warmth as danger signal). The shield glyph (`⛨`) already in use on the safety feature card.

---

### Aesthetic risks to avoid

**The legibility trap:** The dark atmospheric aesthetic starts working against reading at high text density. The docs pages in particular have long-form content. When a page is primarily text (not cards or visuals), reduce atmospheric elements: no constellation, lighter grain, more generous `--ink` (not `--ink-dim`) for body text.

**Misapplying IM Fell DW Pica:** IM Fell DW Pica at small sizes or in body weight loses all its authority and just looks like a generic serif. If it's not at display scale (`1.8rem+`) in a heading context, it shouldn't be IM Fell DW Pica.

**Neon fatigue:** Three simultaneous neon colors (cyan + magenta + violet) at full saturation creates visual noise. The rule is: one color dominates per section, the others are at most present as glows or secondary accents. The homepage does this correctly — cyan dominates the hero, violet is the gradient endpoint, magenta is the glitch flare only.

**Over-applying the glitch:** The `.glitch` class should stay on one word per page. If a second heading becomes glitched, the effect normalizes and loses its signal value.

**Adding illustration or photography:** "Original art only" is in the CSS comment at the top of `styles.css`. This means: no stock photos, no Figma illustrations, no third-party icons that weren't specifically designed for this aesthetic. The SVG glyphs (`⌖`, `✶`, `⛨`, `⟁`, `◎`, `◳`) are hand-chosen Unicode characters that read as arcane notation. Replacing them with a Lucide or Heroicons set would break the tone.

**Glassmorphism cards:** The `backdrop-filter:blur()` is on the nav and docs sidebar (structural chrome), not on feature cards. Feature cards use a near-transparent panel fill and `1px` borders. Frosted-glass cards would make the page look like a 2021 SaaS template.

---

### Gaps between inspiration and execution

**Gap 1 — FUI tradition underused in content sections.** The logo delivers the holographic feel; nothing else does. The feature cards, FAQ items, and comparison table are structurally sound but don't carry the holographic aesthetic. Opportunity: add a faint inner glow to the card border (`box-shadow:inset 0 0 0 1px rgba(28,230,255,.12)`) on hover, and make the `.faq-item[open]` border pulse subtly like a HUD element that's been selected.

**Gap 2 — Cyberpunk palette is richer in the logo than on the page.** The logo uses `--ember` in the glint. The page body uses it once (one trust badge). Ember as "the anomaly" could appear more intentionally — as the color of a warning, an unusual stat, or an optional/coming-soon element. Right now its scarcity is not controlled; it just happens not to appear.

**Gap 3 — The Blueprint self-reference stops at the backdrop.** The constellation is the only place the actual Blueprint node vocabulary appears visually. A real Blueprint pin color legend, or an actual screenshot of the graph editor as a reference image somewhere in the docs, would close the self-reference loop for users who haven't opened the Blueprint editor yet.

**Gap 4 — FromSoftware ceremony is strong in copy, absent in interaction.** Item descriptions in Dark Souls feel weighted. Clicking through the docs feels like clicking through any developer docs. The `<details>` / `<summary>` pattern for FAQ already has the right disclosure behavior, but the open/close animation could be more deliberate — a slow unfold, not an instant snap. The `transition` on `.faq-item` could extend to `max-height` for a ceremonial reveal.

---

## The Anti-Patterns

These are not preferences — they're load-bearing exclusions that define the aesthetic by negative space.

| Anti-pattern | Why excluded |
|---|---|
| White or light-mode backgrounds | The entire design assumes light is emitted, not reflected. Light backgrounds break the "data visible against void" premise. |
| Glassmorphism feature cards | Frosted-glass with white borders and drop shadows is 2021 SaaS. It undermines the "arcane terminal" specificity. |
| Soft gradient headings in pastels | Lavender-to-pink or similar "aurora" gradients are the most common Linear Look heading treatment. Using them makes the site look like a template. The `grad` class is cyan-to-violet, which has different emotional valence. |
| Bento box layouts | Mixed-size card grids read as "we have many small features." The uniform card grid communicates "these are all part of the same arsenal." |
| Photography | Stock photos break the "original art only" rule and introduce a realism that fights the arcane aesthetic. Every visual on the site should be something that couldn't exist outside this design system. |
| Corporate blue (`#0052CC`, `#1A73E8`) | The blue family signals productivity SaaS (Atlassian, Google Workspace). It directly undermines the arcane terminal positioning. `--cyan` is blue-adjacent but distinct — it reads as technical/electric, not corporate. |
| Inter / SF Pro as primary display face | These are the default faces for "professional developer tool." Using them signals "we used the default." Chakra Petch is chosen because it has the same geometric discipline but a distinctly non-default feel. |
| Bounce or spring animations | Playful physics-based motion breaks the tone. All animation timing uses `var(--ease): cubic-bezier(.2,.7,.2,1)` — an ease-out curve that decelerates smoothly and stops without overshoot. |
| Tooltips or modals with drop shadows on white panels | Any component that floats a white or light-gray panel over the dark background destroys the atmospheric layering. Overlays and modals must use `--panel` (dark translucent) with `backdrop-filter:blur()`. |

---

*Last updated: June 2026*
