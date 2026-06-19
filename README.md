# Aethyr MCP — aethyr-mcp.github.io

Product and documentation site for **Aethyr**, an MCP server that lets AI coding assistants (Claude, Copilot, Cursor, and others) read and author Unreal Engine 5 Blueprints in plain language.

Live at **[aethyr-mcp.github.io](https://aethyr.gg**.

## What's in this repo

| Path | What it is |
|---|---|
| `index.html` | Main product landing page |
| `docs/index.html` | Get Started (quickstart, concepts) |
| `docs/tutorials.html` | User-story tutorials |
| `docs/reference.html` | Tool and config reference |
| `css/styles.css` | Shared site styles (Arcane Terminal design system) |
| `js/main.js` | Site interactions (scroll reveals, typewriter, count-up) |
| `img/brand/` | Aethyr lockup, crystal mark, and favicons |

## Running locally

No build step. Open any HTML file directly in a browser, or serve from the repo root:

```
npx serve .
```

Docs pages are in `docs/` and reference assets with relative paths (`../img/`, `../css/`), so they need to be served from the repo root rather than opened as standalone files.

## Deploying

Push to `master`. GitHub Pages serves the repo root automatically. Deployment typically takes under a minute.

## Contributing

See the project wiki for contributor references:

- **[Style Guide](https://github.com/aethyr-mcp/aethyr-mcp.github.io/wiki/Style-Guide)** — writing rules, voice, brand identity, code and commit conventions
- **[Brand Integration](https://github.com/aethyr-mcp/aethyr-mcp.github.io/wiki/Brand-Integration)** — how to use the Aethyr lockup, crystal mark, and color tokens correctly

The `img/brand/` assets are the source of truth for the logo system. Do not recolor or re-set the wordmark.
