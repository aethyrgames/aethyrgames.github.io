# Ritual videos: pipeline notes

One video per Ritual (the 19 sections of `data/docs-tutorials.json`), recorded from a real run of the public Aethyr release in a
disposable UE 5.8 host, rendered to 2560x1440 mp4 plus a 1280x720 poster in `video/tutorials/`.

Everything that isn't shipped content lives under `.video/` (gitignored): the host project, raw frames, fonts, logs.

## Files

| File | What it does |
| --- | --- |
| `rituals.py` | Reads `data/docs-tutorials.json`: ids, glyphs, titles, the user's lines, tool names. Nothing is retyped. |
| `render.py` | Timeline to mp4. Colours from the live theme (`css/theme.css`), site fonts, logo cards, chat panel, terminal readout, eased camera, highlights, captions. Adapted from Tether's `ShotEdit.py`. |
| `new_host.ps1`, `host/` | Scaffolds `.video/host`, a small C++ project with `UShotLibrary` (Slate input, widget finder, window capture, Slate scale). Adapted from Tether's `NewScreenshotHost.ps1`. No Tether content. |
| `install_aethyr.ps1` | Downloads the public release zip, checks SHA256SUMS, runs `AethyrMcp.exe setup` with the user-scope parts off, builds the host editor. |
| `launch_editor.ps1` | Starts the host editor with `-RenderOffScreen`. It shows no window and takes no focus. |
| `editor.py` | Python remote-execution client for the editor. |
| `mcp_client.py` | A small MCP stdio client for `AethyrMcp.exe`. Every tool call in a video goes through it. |
| `record.py`, `scenes*.py`, `sceneslib.py` | The recorder and the 19 scenes. |
| `stills.py`, `montage.py` | Look at a recorded scene without rendering it. |
| `preview.py` | The Phase 1 look check with placeholder content. |

## Setting up the host (once)

```powershell
powershell -File scripts\video\new_host.ps1
powershell -File scripts\video\install_aethyr.ps1      # public release, then builds VideoHostEditor
powershell -File scripts\video\launch_editor.ps1       # off screen
```

Note: the Aethyr server may start its own hub under `%LOCALAPPDATA%\Aethyr\hub-bin`. That is the release's own behaviour.

## Capture spec

The editor panel in the video is 1723 x 969 output pixels. The renderer keeps the effective scale (panel pixels per source
pixel) between 0.80 and 1.25 at every camera keyframe and fails the render with a message when it can't. Recordings use:

- **Editor window: 1920 x 1080**, the asset's own window captured through `UShotLibrary::Capture`.
- **Slate application scale 1.25.** Full view lands at 0.90. The deepest allowed zoom is 1.25.

## Recording

```powershell
python scripts\video\record.py scene read            # one scene
python scripts\video\record.py scene read author     # several
python scripts\video\record.py all
```

Each scene resets `/Game/AethyrSamples` first (`install_samples` with `reset:true, confirm:true`, in this disposable host only), makes
real MCP calls while frames are captured, and writes `.video/raw/<id>/` with `timeline.json`, the frames, `calls.json` (every
call with its real result) and `notes.txt` (where the real run disagrees with the Ritual's text).

A scene is a small function in `scenes_a.py`, `scenes_b.py` or `scenes_c.py`. The user lines and the default AI text come from the
Ritual. Where a real result differs, the scene writes its own AI text and calls `r.note()`.

## Rendering one scene

```powershell
python scripts\video\record.py render read           # writes video\tutorials\01-read.mp4 and 01-read.jpg
python scripts\video\render.py .video\raw\read out.mp4 poster.jpg --theme today     # another theme
python scripts\video\stills.py read 10 20 30         # stills at 10, 20, 30 seconds
```

Encode: libx264 `-preset slow -tune animation -crf 18`, yuv420p, `+faststart`. Posters are 1280x720 (LANCZOS).

## Notes

- The editor's DataTable, material, widget and behavior tree editors keep showing what they loaded, so after Aethyr writes to one of
  those assets the scene closes and reopens the editor (off the record) before showing the result. Blueprint editors update live.
- Never run a commandlet that saves, cooks or resaves content against the engine.
