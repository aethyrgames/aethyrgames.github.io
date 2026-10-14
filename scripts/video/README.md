# Ritual videos: pipeline notes

Phase 1 (renderer and look) is in place. Recording (Phase 2) is not started.

## Files

- `rituals.py` reads `data/docs-tutorials.json` (ids, glyphs, titles, user lines, tool names).
- `render.py` turns a scene folder (`timeline.json` plus numbered frames) into a 2560x1440 mp4 and a 1280x720 poster.
  Colours come from the live theme (`css/theme.css` then `css/themes/<id>.css`). Fonts download into `.video/fonts`.
  `--theme <id>` renders with another theme.
- `preview.py` builds placeholder scenes and a contact sheet under `.video/preview/` (not shipped).

## Capture size Phase 2 must record at

The editor panel in the video is 1723 x 969 output pixels (1292 x 727 on the 1080p layout, drawn at 4/3). The renderer keeps
the effective scale (panel pixels per source pixel) between 0.80 and 1.25 at every camera keyframe, and fails the render with a
message when it can't.

- **Editor window: 1920 x 1080 pixels.** Full view lands at 0.90. The deepest allowed zoom is 1.25 (the camera never shows
  less than 1378 source pixels across).
- **Slate application scale: 1.25** (UI text is then about 25 percent bigger than default at the same pixel size, which is what
  keeps it readable at 0.90). If the host can't set 1.25, 1.0 works but the text is smaller. Keep the window at 1920 x 1080 either way.
- Capture `UShotLibrary::Capture` at that size, one PNG per step, as Tether does.
- A capture of 1600 to 2154 pixels wide also passes the full-view check. Anything outside fails loudly.

## Encode

libx264, `-preset slow -tune animation -crf 18`, yuv420p, `+faststart`. Posters are 1280x720 (LANCZOS).
