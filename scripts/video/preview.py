"""Phase 1 look check, no Unreal. Builds placeholder timelines (a sharp Tether editor frame stands in for
the editor, and the tool results are placeholder text) and renders a contact sheet plus a short preview mp4 under .video/preview/.

    python scripts/video/preview.py [--theme <id>] [--no-video]

Nothing here is shipped. The Ritual titles, glyphs and chat lines come from data/docs-tutorials.json through rituals.py.
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402
import rituals  # noqa: E402

OUT = render.REPO / ".video" / "preview"
STAND_IN = "D:/Projects/StableActorIDPlugin/Saved/video/04-use-it-in-blueprint/00100.png"
FPS = 30


CAPTURE = (1920, 1080)  # the editor capture size Phase 2 must record at (see scripts/video/README.md)


def stand_in_frame(path):
    """A sharp, undarkened 1:1 crop of a Tether editor frame at the documented capture size."""
    if Path(STAND_IN).exists():
        image = Image.open(STAND_IN).convert("RGB").crop((0, 0) + CAPTURE)
    else:
        image = Image.new("RGB", CAPTURE, render.Theme().void)
    image.save(path)
    return image.size


def intro_for(r):
    return {"id": r.id, "number": r.number, "circled": r.circled, "glyph": r.glyph, "title": r.title, "subtitle": r.desc,
            "via": r.via, "kind": r.kind}


def chat_events(r, tools, results, start=0.4):
    """you types, the tools run one after another, then the AI answer streams. Placeholder results."""
    turn_you = next(t for t in r.turns if t.role == "you")
    turn_ai = next(t for t in r.turns if t.role == "ai")
    events, t = [], start
    dur = max(1.0, len(turn_you.text) / 26)
    events.append({"type": "chat", "frame": int(t * FPS), "role": "you", "who": turn_you.who, "text": turn_you.text, "dur": dur})
    t += dur + 0.7
    for i, name in enumerate(tools):
        events.append({"type": "chat", "frame": int(t * FPS), "role": "tool", "name": name, "result": results[i][0], "ms": results[i][1],
                       "status": results[i][2] if len(results[i]) > 2 else "ok", "output": results[i][3] if len(results[i]) > 3 else None, "run": 0.5})
        t += 1.0
    events.append({"type": "chat", "frame": int(t * FPS), "role": "ai", "who": turn_ai.who, "text": turn_ai.text})
    end = t + len(turn_ai.text.split()) / 7
    return events, end


def scene(name, r, layout, tools, results, extra=None, tail=2.0):
    folder = OUT / name
    folder.mkdir(parents=True, exist_ok=True)
    size = stand_in_frame(folder / "still.png")
    events, end = chat_events(r, tools, results)
    events += extra or []
    data = {"fps": FPS, "size": list(size), "frames": int((end + tail) * FPS), "still": "still.png", "layout": layout,
            "intro": intro_for(r), "outro": {"id": r.id}, "events": events}
    (folder / "timeline.json").write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    return folder


def main():
    args = sys.argv[1:]
    theme_id = args[args.index("--theme") + 1] if "--theme" in args else None
    tag = ("-" + theme_id) if theme_id else ""
    by_id = {r.id: r for r in rituals.load()}
    OUT.mkdir(parents=True, exist_ok=True)

    read = by_id["read"]
    editor_extra = [
        {"type": "caption", "frame": int(7.2 * FPS), "text": "BP_Enemy: five variables, two functions, read in one go.", "step": 1},
        {"type": "focus", "frame": int(7.0 * FPS), "rect": [0, 100, 560, 800]},
        {"type": "highlight", "frame": int(7.4 * FPS), "items": [
            {"rect": [20, 560, 520, 90], "label": "Variables", "color": "c1"},
            {"rect": [20, 700, 520, 80], "label": "Functions", "color": "c2"}]},
        {"type": "pointer", "frame": int(7.0 * FPS), "x": 300, "y": 640, "click": True},
    ]
    a = scene("a-tutorial", read, "split", ["list_blueprints", "summarize_blueprint", "get_graph"], [
        ("3 Blueprints under /Game/AethyrSamples/AI (placeholder)", 38),
        ("BP_Enemy: parent Character, 5 variables, 2 functions (placeholder)", 52),
        ("EventGraph: 4 nodes, 3 links (placeholder)", 44)], editor_extra, tail=2.5)

    health = by_id["health-update"]
    b = scene("b-terminal", health, "terminal", ["health_check"], [
        ("editor reachable, 187 tools (placeholder)", 21, "ok", ["status: ok", "editor: connected", "tools: 187", "version: v0.6.13"])],
        [{"type": "caption", "frame": int(7.0 * FPS), "text": "Nothing to see in the editor, so the readout is the story.", "step": 1}], tail=2.0)

    debug = by_id["debug"]
    c = scene("c-troubleshoot", debug, "split", ["get_graph"], [
        ("AssetNotFound: /Game/AethyrSamples/AI/BP_Enemy.BP_Enemy (placeholder)", 9, "error")],
        [{"type": "caption", "frame": int(5.0 * FPS), "text": "Object path in, package path out.", "step": 2},
         {"type": "highlight", "frame": int(5.2 * FPS), "items": [{"rect": [20, 560, 520, 90], "label": "Warm accent", "color": "warm"}]}], tail=2.0)

    renderers = {k: render.make(str(f), theme_id, name=n) for k, f, n in (("a", a, "a-tutorial"), ("b", b, "b-terminal"), ("c", c, "c-troubleshoot"))}
    shots = [("1-title", "a", 1.5), ("2-body-chat-highlight", "a", None), ("3-terminal", "b", None),
             ("4-troubleshoot", "c", None), ("5-end", "a", None)]
    frames = []
    for name, key, when in shots:
        rd = renderers[key]
        if name == "2-body-chat-highlight":
            when = render.INTRO_LEN + 9.2 * render.SLOW + sum(l for at, l in rd.pauses if at < 9.2) * render.SLOW
        elif name == "3-terminal":
            when = render.INTRO_LEN + 7.6 * render.SLOW + sum(l for at, l in rd.pauses if at < 7.6) * render.SLOW
        elif name == "4-troubleshoot":
            when = render.INTRO_LEN + 7.4 * render.SLOW + sum(l for at, l in rd.pauses if at < 7.4) * render.SLOW
        elif name == "5-end":
            when = rd.total_length() - 1.6
        frame = rd.play_frame(when)
        frame.save(OUT / (name + tag + ".png"))
        frames.append(frame)
    cell_w, cell_h, gap = 1280, 720, 20
    sheet = Image.new("RGB", (cell_w * 2 + gap * 3, (cell_h + gap) * 3 + gap), (8, 10, 14))
    for i, frame in enumerate(frames):
        x = gap + (i % 2) * (cell_w + gap)
        y = gap + (i // 2) * (cell_h + gap)
        sheet.paste(frame.resize((cell_w, cell_h), Image.LANCZOS), (x, y))
    sheet.save(OUT / ("contact-sheet" + tag + ".png"))
    renderers["a"].save_poster(str(OUT / ("poster" + tag + ".jpg")))
    print("contact sheet:", OUT / ("contact-sheet" + tag + ".png"))
    if "--no-video" not in args:
        out = OUT / ("preview" + tag + ".mp4")
        renderers["a"].render(str(out))
        print("video:", out)


if __name__ == "__main__":
    main()
