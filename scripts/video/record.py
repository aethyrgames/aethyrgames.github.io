"""Records one Ritual: real MCP tool calls against the video host's editor, with a frame captured while it happens.

    python scripts/video/record.py scene <id> [<id>...]    record scenes from scenes.py into .video/raw/<id>/
    python scripts/video/record.py all
    python scripts/video/record.py render <id> [<id>...]   render recorded scenes to video/tutorials/NN-<id>.mp4 plus .jpg

Adapted from Tether's Tools\\ShotVideo.py (Scene, Rect, the widget finder, the timeline). What differs for Aethyr:
frames are only captured when something changes (a hold repeats the last file, listed in timeline.json as "files"),
the editor is captured through its asset window at 1920x1080 and Slate scale 1.25 (README.md), and the chat events
(you / tool / ai) come from real MCP calls made through mcp_client.py while the frames are captured.
"""
import contextlib
import json
import os
import shutil
import sys
import threading
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mcp_client  # noqa: E402
import rituals  # noqa: E402
from editor import Editor  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / ".video" / "raw"
OUT = REPO / "video" / "tutorials"
FPS = 6
CAPTURE = (1920, 1080)
SCALE = 1.25
OPENED = []  # asset paths whose editors this run opened


def close_all(editor):
    paths = list(OPENED)
    del OPENED[:]
    if paths:
        editor.py("sub = unreal.get_editor_subsystem(unreal.AssetEditorSubsystem)\n"
                  "for p in %r:\n"
                  "    a = unreal.load_asset(p)\n"
                  "    if a:\n"
                  "        sub.close_all_editors_for_asset(a)" % paths)


class Rect:
    def __init__(self, x, y, w, h, kind="", text="", window=""):
        self.x, self.y, self.w, self.h = x, y, w, h
        self.kind, self.text, self.window = kind, text, window

    @property
    def center(self):
        return (self.x + self.w / 2, self.y + self.h / 2)

    def grow(self, left, top=None, right=None, bottom=None):
        top = left if top is None else top
        right = left if right is None else right
        bottom = top if bottom is None else bottom
        return Rect(self.x - left, self.y - top, self.w + left + right, self.h + top + bottom, self.kind, self.text, self.window)

    def union(self, other):
        x0, y0 = min(self.x, other.x), min(self.y, other.y)
        x1, y1 = max(self.x + self.w, other.x + other.w), max(self.y + self.h, other.y + other.h)
        return Rect(x0, y0, x1 - x0, y1 - y0)

    def contains(self, other):
        cx, cy = other.center
        return self.x <= cx <= self.x + self.w and self.y <= cy <= self.y + self.h

    def list(self):
        return [round(self.x), round(self.y), round(self.w), round(self.h)]

    def __repr__(self):
        return "Rect(%d,%d,%d,%d %s %r)" % (self.x, self.y, self.w, self.h, self.kind, self.text)


def as_rect(target):
    return target if isinstance(target, Rect) else Rect(target[0], target[1], 0, 0)


def flatten(value, prefix="", out=None, depth=0):
    """A real tool result as short 'key: value' lines for the terminal readout."""
    out = [] if out is None else out
    if isinstance(value, dict):
        for key, item in value.items():
            if isinstance(item, (dict, list)) and item:
                if depth >= 2:
                    out.append("%s%s: %s" % (prefix, key, json.dumps(item, ensure_ascii=False)[:90]))
                else:
                    out.append("%s%s:" % (prefix, key))
                    flatten(item, prefix + "  ", out, depth + 1)
            else:
                out.append("%s%s: %s" % (prefix, key, json.dumps(item, ensure_ascii=False) if not isinstance(item, str) else item))
    elif isinstance(value, list):
        for index, item in enumerate(value[:8]):
            if isinstance(item, dict):
                brief = ", ".join("%s=%s" % (k, v) for k, v in list(item.items())[:3] if not isinstance(v, (dict, list)))
                out.append("%s- %s" % (prefix, brief))
            else:
                out.append("%s- %s" % (prefix, item))
        if len(value) > 8:
            out.append("%s... %d more" % (prefix, len(value) - 8))
    else:
        out.append("%s%s" % (prefix, value))
    return out


class Rec:
    def __init__(self, editor, mcp, ritual):
        self.editor, self.mcp, self.ritual = editor, mcp, ritual
        self.name = ritual.id
        self.dir = RAW / ritual.id
        if self.dir.exists():
            for entry in self.dir.iterdir():
                if entry.suffix == ".png" or entry.name in ("timeline.json", "calls.json", "notes.txt"):
                    entry.unlink()
        self.dir.mkdir(parents=True, exist_ok=True)
        self.files = []  # one entry per timeline frame
        self.events = []
        self.calls = []
        self.notes = []
        self.shots = 0
        self.window = ""
        self.cutting = False
        self.lit = []
        self.caption_at = None
        self.caption_words = 0
        self.focus_at = None
        self.visual = False  # whether any editor frame was captured
        self.listed = {t["name"] for t in mcp.tools()}
        editor.py("unreal.ShotLibrary.set_cursor_ring(False)")

    @property
    def index(self):
        return len(self.files)

    # Capture -----------------------------------------------------------------------------------------------------------------

    def fit_window(self):
        self.editor.py("unreal.ShotLibrary.move_window(%r, 0, 0, %d, %d)" % (self.window, CAPTURE[0], CAPTURE[1]))

    def shot(self):
        """Captures the window into a new file and returns its name. If the window was recreated at another size (a rolled-back
        write reloads the Blueprint and its editor), it is put back to the capture size and the frame is taken again."""
        if not self.visual:
            return None
        import struct
        name = "%05d.png" % self.shots
        path = (self.dir / name).as_posix()
        for attempt in range(6):
            try:
                self.editor.py("unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).editor_invalidate_viewports()\n"
                               "assert unreal.ShotLibrary.capture(%r, %r, 0, 0, 0, 0), 'capture failed'" % (self.window, path))
                with open(path, "rb") as handle:
                    head = handle.read(24)
                width, height = struct.unpack(">II", head[16:24])
                if self.window == "" or (width, height) == CAPTURE:
                    break
            except RuntimeError:
                pass
            if self.window:
                try:
                    self.fit_window()
                except RuntimeError:
                    pass
            time.sleep(0.4)
        self.shots += 1
        return name

    def frame(self, count=1):
        for _ in range(count):
            if self.cutting:
                time.sleep(1.0 / FPS)
                continue
            self.files.append(self.shot())

    @contextlib.contextmanager
    def cut(self):
        self.cutting = True
        try:
            yield
        finally:
            self.cutting = False

    def hold(self, seconds):
        """Holds still for a time. One fresh capture, then the same file repeated, so a hold costs one PNG."""
        count = max(1, int(round(seconds * FPS)))
        if self.cutting:
            time.sleep(seconds)
            return
        self.frame(1)
        self.files.extend([self.files[-1]] * (count - 1))

    def event(self, kind, **data):
        if self.cutting and kind in ("pointer", "keys", "chat"):
            return
        data.update(type=kind, frame=self.index)
        self.events.append(data)

    # Editor windows ----------------------------------------------------------------------------------------------------------

    def close_editors(self):
        close_all(self.editor)

    def open_asset(self, path, title=None, wait=20):
        """Opens the asset's editor window, sizes it to the capture size, and points the capture at it."""
        title = title or path.rsplit("/", 1)[-1]
        self.editor.py("a = unreal.load_asset(%r)\nassert a, 'no asset'\nunreal.get_editor_subsystem(unreal.AssetEditorSubsystem).open_editor_for_assets([a])" % path)
        deadline = time.time() + wait
        while True:
            listing = self.editor.out("print(unreal.ShotLibrary.windows())")
            if any(line.split("|")[0] == title for line in listing.splitlines()):
                break
            if time.time() > deadline:
                raise RuntimeError("asset window %r never appeared: %s" % (title, listing))
            time.sleep(0.3)
        self.editor.py("unreal.ShotLibrary.move_window(%r, 0, 0, %d, %d)" % (title, CAPTURE[0], CAPTURE[1]))
        time.sleep(7.0)  # lets the editor's own load toasts clear before the first capture
        self.window = title
        self.visual = True
        OPENED.append(path)
        return title

    def refresh(self):
        self.editor.py("unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).editor_invalidate_viewports()")

    # Finding widgets ---------------------------------------------------------------------------------------------------------

    def find_all(self, text="", kind="", exact=False, within=None):
        raw = self.editor.out("print(unreal.ShotLibrary.widgets(%r, %r))" % (kind, text))
        found = []
        for line in raw.splitlines():
            parts = line.split("|")
            if len(parts) < 4:
                continue
            x, y, w, h = (int(v) for v in parts[2].split(","))
            rect = Rect(x, y, w, h, parts[1], "|".join(parts[3:]), parts[0])
            if self.window and rect.window not in (self.window, "") and not rect.window.startswith(self.window):
                continue
            if exact and rect.text.strip() != text:
                continue
            if within is not None and not within.contains(rect):
                continue
            found.append(rect)
        return found

    def find(self, text="", kind="", exact=False, within=None, index=0, wait=4.0, below=None):
        deadline = time.time() + wait
        while True:
            found = self.find_all(text, kind, exact, within)
            if below is not None:
                found = [r for r in found if r.y > below.y + below.h / 2]
            found.sort(key=lambda r: (r.y, r.x))
            if len(found) > index:
                return found[index]
            if time.time() > deadline:
                raise RuntimeError("no widget %r %r (index %d) in scene %s" % (text, kind, index, self.name))
            time.sleep(0.3)

    def panel(self, kind):
        """The rectangle of a whole panel widget by type, e.g. SMyBlueprint or SKismetInspector."""
        return self.find("", kind)

    def row(self, label, panel=None):
        """The full row (SBlueprintPaletteItem) of a My Blueprint entry, found from its label."""
        text = self.find(label, "STextBlock", exact=True, within=panel)
        rows = [r for r in self.find_all("", "SBlueprintPaletteItem") if r.contains(text)]
        return rows[0] if rows else text

    # Pointer and keyboard ----------------------------------------------------------------------------------------------------

    def move(self, target, travel=0.5):
        x, y = as_rect(target).center
        self.editor.py("unreal.ShotLibrary.hover('', %f, %f)" % (x, y))
        self.event("pointer", x=x, y=y, travel=travel)
        self.hold(travel + 0.15)

    def click(self, target, right=False, settle=0.6, travel=0.5):
        x, y = as_rect(target).center
        self.editor.py("unreal.ShotLibrary.hover('', %f, %f)" % (x, y))
        self.event("pointer", x=x, y=y, click=True, travel=travel)
        self.hold(travel)
        self.editor.py("unreal.ShotLibrary.click('', %f, %f, %s)" % (x, y, right))
        self.hold(settle)

    def double_click(self, target, settle=0.9, travel=0.5):
        x, y = as_rect(target).center
        self.editor.py("unreal.ShotLibrary.hover('', %f, %f)" % (x, y))
        self.event("pointer", x=x, y=y, click=True, travel=travel)
        self.hold(travel)
        self.editor.py("unreal.ShotLibrary.double_click('', %f, %f)" % (x, y))
        self.hold(settle)

    # Annotations -------------------------------------------------------------------------------------------------------------

    def caption(self, text, step=None, pos=None):
        self.read_time()
        self.event("caption", text=text, step=step, pos=pos)
        self.caption_at, self.caption_words = self.index, len(text.split())

    def no_caption(self):
        self.read_time()
        self.event("caption", text="")
        self.caption_at, self.caption_words = None, 0

    def read_time(self):
        if self.caption_at is None or self.cutting:
            return
        need = int(round(max(2.2, 0.28 * self.caption_words) * FPS))
        if self.index - self.caption_at < need:
            self.files.extend([self.files[-1] if self.files else None] * (need - (self.index - self.caption_at)))

    def highlight(self, *items):
        """Each item is a Rect, or a (Rect, label[, color[, side]]) tuple. Colours: c1, c2, warm."""
        out = []
        for item in items:
            if isinstance(item, Rect):
                item = (item,)
            entry = {"rect": item[0].list()}
            for key, pos in (("label", 1), ("color", 2), ("side", 3)):
                if len(item) > pos and item[pos]:
                    entry[key] = item[pos]
            out.append(entry)
        self.event("highlight", items=out)
        self.lit = [item[0] if isinstance(item, tuple) else item for item in items]

    def clear(self):
        if self.lit:
            self.event("highlight", items=[])
        self.lit = []

    def focus(self, rect=None, pad=60):
        self.event("focus", rect=None if rect is None else rect.grow(pad).list())
        self.focus_at = self.index

    def note(self, text):
        self.notes.append(text)

    # Chat --------------------------------------------------------------------------------------------------------------------

    def you(self, k_or_text, who="you"):
        """The user's line. An int picks the k-th user line of the Ritual's first conversation."""
        text = self.ritual.user_lines[k_or_text] if isinstance(k_or_text, int) else k_or_text
        if self.caption_at is not None:
            self.no_caption()
        from render import typing_plan  # the renderer types a question at a human pace, and this hold has to cover the same time
        dur = typing_plan(text)[1]
        self.event("chat", role="you", who=who, text=text, dur=dur)
        self.hold(dur + 0.3)
        return text

    def ai(self, k_or_text, who=None, extra=0.0):
        """The AI's answer. An int picks the k-th AI turn's text from the Ritual."""
        if isinstance(k_or_text, int):
            turn = [t for t in self.ritual.turns if t.role == "ai"][k_or_text]
            text, who = turn.text, who or turn.who
        else:
            text = k_or_text
        words = max(1, len(text.split()))
        dur = max(1.0, words / 7)
        self.event("chat", role="ai", who=who or "Aethyr · your AI", text=text, dur=dur)
        self.hold(dur + min(2.0, 0.5 + 0.045 * words) + extra)
        return text

    def tool(self, name, args=None, result=None, output=None, expect_error=False, shown_args=None, timeout=600):
        """Makes a real MCP call while frames are captured. result(parsed, text) gives the chip's result line and output(parsed, text)
        the terminal lines. Returns (parsed, text, is_error)."""
        args = args or {}
        holder = {}

        def run():
            try:
                if name in self.listed:
                    holder["r"] = self.mcp.call(name, args, timeout=timeout)
                else:
                    holder["r"] = self.mcp.call("call_tool", {"name": name, "arguments": args}, timeout=timeout)
            except Exception as error:  # noqa: BLE001
                holder["e"] = error

        start = self.index
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        began = time.time()
        while thread.is_alive():
            self.frame(1)
            if not self.visual:
                time.sleep(1.0 / FPS)
            if time.time() - began > timeout:
                break
        while self.index - start < 3:
            self.frame(1)
        if "e" in holder:
            raise holder["e"]
        parsed, text, is_error, ms = holder["r"]
        if is_error and not expect_error:
            raise RuntimeError("tool %s failed: %s" % (name, text[:500]))
        if parsed is not None and name not in self.listed and isinstance(parsed, dict) and set(parsed) <= {"result", "name", "toolset"} and "result" in parsed:
            parsed = parsed["result"]
        line = result(parsed, text) if result else self.brief(parsed, text, is_error)
        lines = output(parsed, text) if output else (flatten(parsed) if parsed is not None else text.splitlines())
        event = {"type": "chat", "frame": start, "role": "tool", "name": name, "result": line, "status": "error" if is_error else "ok",
                 "ms": ms, "run": max(0.5, (self.index - start) / FPS), "output": lines[:14]}
        if shown_args:
            event["args"] = shown_args
        self.events.append(event)
        self.calls.append({"name": name, "args": args, "ms": ms, "error": is_error, "text": text[:3000], "result": json.dumps(parsed, ensure_ascii=False)[:6000] if parsed is not None else None})
        return parsed, text, is_error

    @staticmethod
    def brief(parsed, text, is_error):
        if is_error:
            return text.strip().splitlines()[0][:160] if text.strip() else "error"
        if isinstance(parsed, dict):
            for key in ("count", "total"):
                if key in parsed:
                    return "%s: %s" % (key, parsed[key])
            keys = [k for k in parsed if not isinstance(parsed[k], (dict, list))][:3]
            return ", ".join("%s: %s" % (k, parsed[k]) for k in keys) or "ok"
        return (text.strip().splitlines() or ["ok"])[0][:160]

    # Output ------------------------------------------------------------------------------------------------------------------

    def save(self):
        r = self.ritual
        size = list(CAPTURE)
        first = next((f for f in self.files if f), None)
        if first:
            from PIL import Image
            size = list(Image.open(self.dir / first).size)  # the real capture size (the main window can come out a few px short)
        data = {"fps": FPS, "size": size, "frames": self.index, "layout": "split" if self.visual else "terminal",
                "intro": {"id": r.id, "number": r.number, "circled": r.circled, "glyph": r.glyph, "title": r.title,
                          "subtitle": r.desc, "via": r.via, "kind": r.kind},
                "outro": {"id": r.id}, "events": self.events}
        if self.visual:
            data["files"] = self.files
        (self.dir / "timeline.json").write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
        (self.dir / "calls.json").write_text(json.dumps(self.calls, indent=1, ensure_ascii=False), encoding="utf-8")
        (self.dir / "notes.txt").write_text("\n".join(self.notes), encoding="utf-8")

    def finish(self):
        # Let the last camera move finish and leave a beat before the end card.
        self.hold(1.0)
        self.save()


def reset_samples(mcp):
    """Restores /Game/AethyrSamples to a known state. Disposable host only."""
    parsed, text, is_error, ms = mcp.call("install_samples", {"reset": True, "confirm": True}, timeout=600)
    if is_error:
        raise RuntimeError("install_samples reset failed: " + text[:400])
    bad = [a for a in (parsed or {}).get("assets", []) if a.get("status") not in ("created", "skipped")]
    if bad:
        raise RuntimeError("samples not clean: %s" % bad)


def run_scene(editor, mcp, ritual_id, reset=True):
    import scenes
    ritual = rituals.get(ritual_id)
    close_all(editor)
    if reset:
        reset_samples(mcp)
    editor.py("unreal.ShotLibrary.move_window('', 0, 0, %d, %d)\nunreal.ShotLibrary.set_application_scale(%s)" % (CAPTURE[0], CAPTURE[1], SCALE))
    rec = Rec(editor, mcp, ritual)
    try:
        scenes.SCENES[ritual_id](rec)
        rec.finish()
    finally:
        try:
            rec.close_editors()
        except Exception:  # noqa: BLE001
            pass
    return rec


def render_scene(ritual_id, theme=None):
    import render
    ritual = rituals.get(ritual_id)
    OUT.mkdir(parents=True, exist_ok=True)
    stem = "%02d-%s" % (ritual.number, ritual.id)
    renderer = render.make(str(RAW / ritual_id), theme)
    renderer.render(str(OUT / (stem + ".mp4")), str(OUT / (stem + ".jpg")))
    return OUT / (stem + ".mp4")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    mode, names = sys.argv[1], sys.argv[2:]
    if mode == "render":
        for name in names:
            print("wrote", render_scene(name), flush=True)
        return
    import scenes
    if mode == "all":
        names = list(scenes.SCENES)
    editor = Editor()
    mcp = mcp_client.Mcp(log=str(REPO / ".video" / "logs" / "mcp-record.log"))
    failed = []
    try:
        for name in names:
            try:
                rec = run_scene(editor, mcp, name)
                print("recorded %s: %d frames, %d calls" % (name, rec.index, len(rec.calls)), flush=True)
            except Exception:  # noqa: BLE001
                import traceback
                traceback.print_exc()
                failed.append(name)
                print("FAILED", name, flush=True)
    finally:
        mcp.close()
        editor.close()
    if failed:
        raise SystemExit("failed: " + " ".join(failed))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
