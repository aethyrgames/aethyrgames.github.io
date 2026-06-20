# Aethyr MCP — aethyrgames.github.io

Product and documentation site for **Aethyr**, an MCP server that lets AI coding assistants (Claude and others) read and author Unreal Engine 5 Blueprints in plain language.

Live at https://aethyr.gg

## What's in this repo

| Path | URL | What it is |
|---|---|---|
| `index.html` | `/` | Main product landing page |
| `docs/index.html` | `/docs/` | Get Started (quickstart, concepts) |
| `docs/tutorials/index.html` | `/docs/tutorials/` | User-story tutorials |
| `docs/reference/index.html` | `/docs/reference/` | Tool and config reference |
| `docs/cookbook/index.html` | `/docs/cookbook/` | Spellbook: quick recipes |
| `data/home.json` | — | Content for the landing page |
| `data/docs-index.json` | — | Content for the Get Started page |
| `data/docs-tutorials.json` | — | Content for the tutorials page |
| `data/docs-reference.json` | — | Content for the reference page |
| `data/docs-cookbook.json` | — | Content for the cookbook page |
| `js/docs.js` | — | Shared renderer for all docs pages |
| `js/main.js` | — | Site interactions (scroll reveals, typewriter, count-up) |
| `css/styles.css` | — | Shared site styles (Arcane Terminal design system) |
| `img/brand/` | — | Aethyr lockup, crystal mark, and favicons |

Docs pages are minimal JS-rendered templates. All page content lives in the corresponding `data/*.json` file and is hydrated at load time by `js/docs.js`. To change copy, edit the JSON — no HTML required.

## Running locally

No build step. Serve from the repo root (required — relative asset paths depend on it):

```
npx serve .
```

Then visit `http://localhost:3000/docs/tutorials/` etc. Opening HTML files directly won't work for the folder-based pages because the JSON fetch uses a relative path.

## Deploying

Push to `master`. GitHub Pages serves the repo root automatically. Deployment typically takes under a minute.

## Contributing

See the project wiki for contributor references:

- **[Style Guide](https://github.com/aethyr-mcp/aethyr-mcp.github.io/wiki/Style-Guide)** — writing rules, voice, brand identity, code and commit conventions
- **[Brand Integration](https://github.com/aethyr-mcp/aethyr-mcp.github.io/wiki/Brand-Integration)** — how to use the Aethyr lockup, crystal mark, and color tokens correctly

The `img/brand/` assets are the source of truth for the logo system. Do not recolor or re-set the wordmark.
