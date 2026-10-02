> Historical research, June 2026. Tool counts, tiers and the Epic comparison are out of date. See the main repo's docs/TOOLS.md and LICENSE.md.

# Aethyr — Growth Strategy Notes
*Research synthesized June 2026. Not published on site.*

---

## Competitive Landscape

### Who's out there
- **CreateLex** ($20–30/mo) — closest direct comp, "500+ MCP tools", Blueprint + UMG + materials. Has paid users and a money-back guarantee. Ahead on distribution.
- **Flopperam MCP** ($15/mo, 46 tools free / 64 paid) — Python-only (no C++ plugin), freemium, already listed on pulsemcp.com and mcpservers.org. Most active commercial competitor in MCP-native space.
- **Ludus AI** ($10–25/mo) — Blueprint gen + C++ assistant, same ICP.
- **Epic's native UE 5.8 MCP** (free, shipped June 17, 2026) — experimental, no auth, no corruption protection, shallow Blueprint write coverage. Will be the first objection every prospect raises.
- **Free/open source**: Autonomix, ChongDashu UnrealMCP. These set a floor expectation.

### Aethyr's real moat
Nobody else combines: **47 write tools** (Flopperam has 11) + **corruption safety** (nobody mentions backups/compile gates) + **local-only/NDA-safe** (competitors use cloud APIs). This triple claim is the differentiation. Lean on all three together.

### Features that would deepen the moat
- **Blueprint health audit** — a read-scan for unreferenced nodes, broken pins, compile warnings. Nobody offers this. High perceived value, no new write risk.
- **Undo/transaction receipts** — show exactly what changed, one-click revert. Turns the safety feature into active productivity.
- **Cross-graph search** — find which Blueprints call a given function. No competitor does this.
- **Batch rename/refactor** — senior devs' biggest Blueprint complaint is naming chaos in large graphs.

---

## Distribution Channels

### MCP registries (do this immediately)
Flopperam owns the SEO for "Unreal Engine MCP server" on all of these. Get listed:
- **pulsemcp.com** — highest traffic MCP registry
- **mcpservers.org**
- **mcp.so**
- **Docker MCP Catalog** (if packaged as a container)

### Fab marketplace
Primary discovery channel for UE plugin buyers. 420,000+ listings, $24M paid to creators in 2025. Epic takes 12%. Worth investigating whether Aethyr can be packaged for Fab — it's where UE devs already shop. The server-side executable format is non-standard, but Fab has submission flexibility.

### Communities
- **r/unrealengine** (800K+ members) — Blueprint/workflow posts get traction. A technical post ("I built an MCP server with 47 write tools and made it corruption-safe") with a video would do very well.
- **Unreal Source Discord** — most dedicated UE professional Discord. Technical audience, best for word-of-mouth.
- **Epic Developer Community forums** — Google-indexed, posts persist, good for SEO.
- **r/gamedev** — secondary, reaches "interested but not deep in UE" audience.

### YouTube
Mandatory for conversion. The UE tutorial ecosystem is huge. Getting a mention from DevEnabled, Gorka Games, or Unreal Sensei would outperform any paid ad. Target for collabs or demos once the video exists.

---

## Pricing Model

Market band: $10–30/month. Subscriptions are standard (Flopperam, Ludus, CreateLex all went subscription).

**Recommended tiers:**

| Tier | Price | What's included |
|------|-------|-----------------|
| Free | $0 | All 32 read tools — unlimited, forever |
| Pro | $20/mo | All 82 tools (read + write + batch), corruption-safe writes |
| Studio | $60/mo | 3 seats, priority support, NDA assurance in writing |

**Why freemium:** Lets a dev validate Aethyr against their own project before paying. Read tools alone are useful (health audits, cross-graph search). The moment they want to write, they pay. Don't add credits or usage limits to the free tier — friction before value kills developer tools.

### Studio sales
Studios won't sign up through the website. They need a conversation. The studio contact link now on the site (`hello@aethyr.gg`) is the hook. Once they reach out:
- Send a one-pager covering: no telemetry, no cloud calls, NDA assurance in license agreement, air-gap/self-hosted compatibility.
- That doc closes more studio deals than any feature list.

---

## Marketing: What to Do First

### 1. Demo video (required before everything else)
60–90 seconds. No voiceover required if the sequence is clear:
1. Open a complex Blueprint graph
2. Ask Claude in plain English to add a mechanic
3. Show the backup being created automatically
4. Show the write completing, graph wired correctly
5. Show it compiling with no errors

If possible: show what happens on a failed write (the backup kicks in, nothing corrupts). That sequence addresses both main objections in one video. This is the highest-leverage asset available.

### 2. r/unrealengine launch post
Write after the video exists. Frame as: "I built this, here's how it works, here's what makes it different from Epic's built-in MCP." Be specific. Include the video. Don't post without the video — text doesn't convert skeptics here.

### 3. MCP registry listings
Get on pulsemcp.com, mcpservers.org, mcp.so. Low effort, high leverage. Do this before launch.

---

## What's on the Site (Already Implemented)

The following recommendations from the research were implemented directly:
- **Comparison table** vs. Epic Native MCP (5.8) and Generic Copilot — placed between Features and The Ritual sections
- **Studio contact link** in the summon section
- **Divider lines removed** — FAQ border-top removed; spacing does the work

---

## What's Still Missing on the Site

### Highest priority: product demo
The site has no screenshot, GIF, or video of the product running. This is the biggest gap vs. competitors. Cursor shows the product on load. Flopperam has GIFs on GitHub. Aethyr needs at minimum a 15–30 second looping GIF of a Blueprint being written via natural language, placed in or just below the hero section.

**Suggested placeholder location:** Below the hero CTA buttons, above the marquee. A `<div class="demo-embed">` with either a `<video>` autoplay loop or a `<img>` GIF.

### Social proof
One real developer quote placed below the hero would increase time-on-page significantly. Even a single sentence: *"I used Aethyr to refactor 40 Blueprints in an afternoon without a single corrupt file."* — Name, Studio. Prioritize getting this after first real users.

### Email / contact infrastructure
The studio contact link uses `hello@aethyr.gg`. Make sure this inbox exists and is monitored before any traffic comes in.
