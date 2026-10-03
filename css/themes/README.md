# Aethyr themes

Every colour on the site comes from CSS custom properties. A theme is one file in this folder with a single `:root{...}` block that sets every token below. `css/theme.css` imports the active one, and every page links `theme.css` before `styles.css` / `docs.css`.

## Switch the site

Edit the one line in `css/theme.css`:

```css
@import url("themes/storm-glass.css");
```

Preview any theme without committing by adding `?theme=<id>` to a page URL, for example `/?theme=today`. Unknown ids are ignored, nothing is stored, and without JS the page uses `theme.css`.

## Token contract

```
/* surface */
--void, --void-2        page ground, raised ground
--panel                 translucent panel fill (full colour with alpha)
--panel-read            optional. Mostly opaque fill for panels that hold text. Default in css/shared.css: rgb(var(--void-2-rgb) / .88)
--panel-read-2          optional. Gradient version for cards. Default in css/shared.css
--line                  1px borders (rgb(var(--line-rgb) / alpha))
/* ink */
--ink, --ink-2, --ink-dim       primary, secondary, tertiary text
/* accents */
--c1                    lead accent (links, primary button, focus ring)
--c2                    second accent (gradient end, secondary highlights)
--warm                  warm accent (glitch flare, keywords, warnings)
--warm-2                second warm role. Today it is ember, on every other theme it equals --warm
--on-c1                 text colour on top of --c1 (and on --warm badges)
/* RGB triplets, space separated, for alpha: rgb(var(--c1-rgb) / .18) */
--void-rgb, --void-2-rgb, --ink-rgb, --line-rgb, --c1-rgb, --c2-rgb, --warm-rgb, --warm-2-rgb
/* code and terminal */
--ok, --str             success text, string literals in code blocks
/* page background and ambient layers */
--bg-image, --bg-size   body background: radial glows, grid, paper noise, or none
--wash-opacity          strength of the drifting colour washes (1 = full)
/* glow */
--glow-k                0 or 1. Scales every soft colour glow (buttons, chip, title)
--glow-c1, --glow-warm  full box-shadow values for the lead and warm glows
/* hero title */
--title-grad            gradient painted into the hero and docs titles
--title-w, --title-rule width and bottom border for an optional rule under the title
```

Light themes also set `color-scheme: light`.

Rules for the stylesheets: use `var(--token)` or `rgb(var(--x-rgb) / alpha)`. Never write a hex or `rgba()` theme colour in `styles.css`, `docs.css`, `js/` or page HTML. Canvas code reads the triplets with `getComputedStyle` (see `js/main.js`).

## Add a theme

1. Copy the closest file here to `css/themes/<id>.css` and edit the values. Keep the `-rgb` triplets and the matching comment hex in step.
2. Add the id to the list inside the inline `?theme=` script in each page head (search for `preview: ?theme=`).
3. Switch to it in `css/theme.css`.

Reference pages: `design/palettes.src.html` shows all 13 palettes side by side, and `design/fonts.src.html` compares fonts. They are not linked from the site and not in the sitemap.
