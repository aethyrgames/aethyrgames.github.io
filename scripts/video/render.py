# Turns a recorded Ritual scene into a finished 1920x1080 mp4: title card, chat panel (or terminal readout), an eased camera on the
# editor footage, pointer and click ripple, dim plus glowing highlight boxes with label pills, captions with step numbers, key chips,
# and an end card. Reads <scene>\timeline.json and the numbered frames beside it, pipes frames to ffmpeg.
#
# Origin: adapted from Tether's Tools\ShotEdit.py (D:\Projects\StableActorIDPlugin, the Tether plugin's own video renderer). The
# pacing rules (slowdown, pauses that never land mid-transition, highlight/camera sync) are Tether's and are kept as they were. What
# changed for Aethyr: colours come from the live site theme (css/theme.css -> css/themes/<id>.css), fonts are the site's, the logo
# shows on the cards, and the chat panel and terminal readout are new.
#
#   python scripts/video/render.py <scene dir> <out.mp4> [poster.jpg] [--theme <id>]
#
# timeline.json (the Tether shape, plus the Aethyr additions marked +):
#   fps, size [w, h] of the editor frames, frames (count: the length of the body), still (+, optional: one image used for every frame)
#   layout (+): "split" (editor on the left, chat on the right) or "terminal" (chat and terminal readout, no editor)
#   intro (+): {id, number, glyph, title, subtitle, via, kind: "tutorial" | "troubleshoot"}    outro (+): {id}
#   events: caption {text, step, pos}, highlight {items: [{rect, label, color: c1|c2|warm}]}, focus {rect}, pointer {x, y, click},
#           keys {text}, and chat (+):
#     {"type": "chat", "frame": F, "role": "you",  "who": "you", "text": "...", "dur": secs}
#     {"type": "chat", "frame": F, "role": "tool", "name": "get_graph", "args": "...", "result": "...", "status": "ok|error",
#         "ms": 41, "run": 0.5, "output": ["line", ...]}      (output feeds the terminal readout)
#     {"type": "chat", "frame": F, "role": "ai",   "who": "Aethyr · your AI", "text": "...", "dur": secs}
#     A tool event attaches to the AI turn that follows the latest "you" line. The AI text streams in after its tool chips.
import json
import math
import os
import re
import subprocess
import sys
import urllib.request
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

REPO = Path(__file__).resolve().parents[2]
FONT_DIR = REPO / ".video" / "fonts"
LOGO_DIR = REPO / ".video" / "logo"
EDGE = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
FFMPEG = r"C:\ffmpeg\bin\ffmpeg"

W, H = 1920, 1080
FPS = 30
EASE = 0.9
# Pacing (Tether's): the body plays a little slower than it was recorded and holds still for a moment after each new caption,
# highlight or finished chat beat, so there's time to read before things move on.
SLOW = 1.15
CAPTION_PAUSE = 0.7
HIGHLIGHT_PAUSE = 0.6
TOOL_PAUSE = 0.45
INTRO_LEN = 3.2
OUTRO_LEN = 4.5

# Layout (px on the 1920x1080 canvas)
HEADER_H = 76
EDITOR = (40, HEADER_H, 1292, 727)  # 16:9
CHAT_SPLIT = (1360, HEADER_H, 520, 1040 - HEADER_H)
CHAT_TERM = (48, 84, 848, 820)
TERM_TERM = (924, 84, 948, 820)
CAPTION_ZONE_SPLIT = (40, 818, 1292, 222)  # x, y, w, h: the caption sits at the bottom of this
CAPTION_ZONE_TERM = (48, 924, 1824, 116)

FONT_URLS = {
    "ChakraPetch-Regular.ttf": "chakrapetch/ChakraPetch-Regular.ttf",
    "ChakraPetch-Medium.ttf": "chakrapetch/ChakraPetch-Medium.ttf",
    "ChakraPetch-SemiBold.ttf": "chakrapetch/ChakraPetch-SemiBold.ttf",
    "ChakraPetch-Bold.ttf": "chakrapetch/ChakraPetch-Bold.ttf",
    "IMFePIrm28P.ttf": "imfelldwpica/IMFePIrm28P.ttf",
    "Sora[wght].ttf": "sora/Sora%5Bwght%5D.ttf",
    "JetBrainsMono[wght].ttf": "jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
}
GOOGLE_FONTS = "https://raw.githubusercontent.com/google/fonts/main/ofl/"


# ---------------------------------------------------------------------------------------------------------------------------
# Theme: read the live tokens from css/theme.css -> css/themes/<id>.css so a theme change recolours everything.
# ---------------------------------------------------------------------------------------------------------------------------

def _split_top(text):
    parts, depth, cur = [], 0, ""
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    parts.append(cur)
    return parts


def parse_color(text, tokens):
    """A CSS colour to (r, g, b, a) with a 0..1 alpha. Handles hex, rgb()/rgba() in both syntaxes, var(), and color-mix(in srgb)."""
    text = text.strip()
    for _ in range(8):
        text = re.sub(r"var\(\s*--([\w-]+)\s*(?:,[^)]*)?\)", lambda m: tokens[m.group(1)].strip(), text)
        if "var(" not in text:
            break
    if text.startswith("#"):
        h = text[1:]
        if len(h) in (3, 4):
            h = "".join(c * 2 for c in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return (r, g, b, int(h[6:8], 16) / 255 if len(h) == 8 else 1.0)
    m = re.match(r"rgba?\((.*)\)$", text)
    if m:
        nums = re.split(r"[\s,/]+", m.group(1).strip())
        vals = [float(n[:-1]) / 100 if n.endswith("%") else float(n) for n in nums]
        alpha = vals[3] if len(vals) > 3 else 1.0
        return (int(vals[0]), int(vals[1]), int(vals[2]), alpha)
    m = re.match(r"color-mix\((.*)\)$", text)
    if m:
        parts = _split_top(m.group(1))
        a_text, b_text = parts[1], parts[2]
        pa = re.search(r"\s+([\d.]+)%\s*$", a_text)
        pb = re.search(r"\s+([\d.]+)%\s*$", b_text)
        fa = float(pa.group(1)) / 100 if pa else None
        fb = float(pb.group(1)) / 100 if pb else None
        if fa is None and fb is None:
            fa = fb = 0.5
        elif fa is None:
            fa = 1 - fb
        elif fb is None:
            fb = 1 - fa
        ca = parse_color(a_text[:pa.start()] if pa else a_text, tokens)
        cb = parse_color(b_text[:pb.start()] if pb else b_text, tokens)
        total = fa + fb
        return tuple(int(round((x * fa + y * fb) / total)) for x, y in zip(ca[:3], cb[:3])) + ((ca[3] * fa + cb[3] * fb) / total,)
    raise ValueError("cannot parse colour: %r" % text)


class Theme:
    def __init__(self, theme_id=None):
        entry = (REPO / "css" / "theme.css").read_text(encoding="utf-8")
        entry = re.sub(r"/\*.*?\*/", "", entry, flags=re.S)
        self.id = theme_id or re.search(r"@import\s+url\(\s*[\"']?themes/([\w-]+)\.css", entry).group(1)
        text = (REPO / "css" / "themes" / (self.id + ".css")).read_text(encoding="utf-8")
        text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
        raw = {k: v.strip() for k, v in re.findall(r"--([\w-]+)\s*:\s*([^;]+);", text)}

        def rgb(name):
            return parse_color(raw[name], raw)[:3]

        self.void, self.void2 = rgb("void"), rgb("void-2")
        self.ink, self.ink2, self.dim = rgb("ink"), rgb("ink-2"), rgb("ink-dim")
        self.c1, self.c2, self.warm = rgb("c1"), rgb("c2"), rgb("warm")
        self.warm2 = rgb("warm-2") if "warm-2" in raw else self.warm
        self.on_c1 = rgb("on-c1")
        self.ok = rgb("ok")
        self.panel_alpha = parse_color(raw["panel"], raw)[3]
        line = parse_color(raw["line"], raw)
        self.line, self.line_alpha = line[:3], line[3]
        self.glow_k = float(raw.get("glow-k", "0").strip() or 0)
        # Ambient grid: the first colour in --bg-image, falling back to the line colour.
        self.grid, self.grid_alpha, self.grid_size = self.line, self.line_alpha * 0.45, 28
        bg = raw.get("bg-image", "")
        found = re.search(r"rgba?\([^)]*\)", bg)
        if found:
            c = parse_color(found.group(0), raw)
            self.grid, self.grid_alpha = c[:3], c[3]
        size = re.search(r"(\d+)px", raw.get("bg-size", ""))
        if size:
            self.grid_size = int(size.group(1))
        # Title gradient: the first two colour tokens named in --title-grad (c1 to c2 on most themes).
        names = [n for n in re.findall(r"var\(--([\w-]+)\)", raw.get("title-grad", "")) if n in ("c1", "c2", "warm", "warm-2")]
        pick = {"c1": self.c1, "c2": self.c2, "warm": self.warm, "warm-2": self.warm2}
        self.grad = (pick[names[0]], pick[names[1] if len(names) > 1 else names[0]]) if names else (self.c1, self.c2)
        self.kinds = {"tutorial": self.c1, "troubleshoot": self.warm}

    def color(self, name):
        # Highlight colours cycle c1, c2, warm. Tether's old names still work.
        return {"c1": self.c1, "c2": self.c2, "warm": self.warm, "blue": self.c1, "green": self.c2, "amber": self.warm}.get(name, self.c1)


def mix(a, b, k):
    """a at strength k over b."""
    return tuple(int(round(x * k + y * (1 - k))) for x, y in zip(a, b))


# ---------------------------------------------------------------------------------------------------------------------------
# Fonts: the site's four families from Google Fonts (OFL), cached under .video/fonts. Glyphs the families lack (the Ritual glyphs,
# circled numbers) fall back to Segoe UI Symbol, the way the browser falls back on the site.
# ---------------------------------------------------------------------------------------------------------------------------

def fetch_fonts():
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for name, path in FONT_URLS.items():
        target = FONT_DIR / name
        if not target.exists():
            print("downloading", name)
            urllib.request.urlretrieve(GOOGLE_FONTS + path, target)


SYMBOL_FONT = "C:/Windows/Fonts/seguisym.ttf"


@lru_cache(maxsize=None)
def _pil(kind, size, weight):
    if kind == "display":
        name = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold"}[weight]
        return ImageFont.truetype(str(FONT_DIR / ("ChakraPetch-%s.ttf" % name)), size)
    if kind == "arcane":
        return ImageFont.truetype(str(FONT_DIR / "IMFePIrm28P.ttf"), size)
    name = "Sora[wght].ttf" if kind == "body" else "JetBrainsMono[wght].ttf"
    face = ImageFont.truetype(str(FONT_DIR / name), size)
    face.set_variation_by_axes([weight])
    return face


@lru_cache(maxsize=None)
def _covers(kind, weight, ch):
    if ord(ch) < 128 or ch.isspace():
        return True
    font = _pil(kind, 40, weight)
    return (font.getbbox(ch), font.getlength(ch)) != (font.getbbox("\uffff"), font.getlength("\uffff"))


class Face:
    """A site font plus the symbol fallback, with measuring and drawing that handle both."""

    def __init__(self, kind, size, weight=400):
        self.kind, self.size, self.weight = kind, size, weight
        self.main = _pil(kind, size, weight)
        self.fallback = ImageFont.truetype(SYMBOL_FONT, size)

    def runs(self, text):
        out = []
        for ch in text:
            font = self.main if _covers(self.kind, self.weight, ch) else self.fallback
            if out and out[-1][0] is font:
                out[-1][1] += ch
            else:
                out.append([font, ch])
        return out

    def length(self, text, track=0):
        return sum(font.getlength(sub) for font, sub in self.runs(text)) + track * len(text)

    def draw(self, draw, xy, text, fill, anchor="la", track=0):
        x, y = xy
        width = self.length(text, track)
        if anchor[0] == "m":
            x -= width / 2
        elif anchor[0] == "r":
            x -= width
        asc, desc = self.main.getmetrics()
        base = {"a": y + asc, "m": y + (asc - desc) / 2, "s": y}[anchor[1]]
        for font, sub in self.runs(text):
            if track:
                for ch in sub:
                    draw.text((x, base), ch, font=font, fill=fill, anchor="ls")
                    x += font.getlength(ch) + track
            else:
                draw.text((x, base), sub, font=font, fill=fill, anchor="ls")
                x += font.getlength(sub)
        return width


@lru_cache(maxsize=None)
def F(kind, size, weight=400):
    return Face(kind, size, weight)


def _break_long(word, face, width):
    # A word wider than the line (an asset path, say) breaks after a slash or dot where it can, else anywhere.
    if face.length(word) <= width:
        return [word]
    out, cur = [], ""
    for ch in word:
        if cur and face.length(cur + ch) > width:
            cut = max(cur.rfind("/"), cur.rfind("."), cur.rfind("_"))
            if cut > len(cur) // 2:
                out.append(cur[:cut + 1])
                cur = cur[cut + 1:]
            else:
                out.append(cur)
                cur = ""
        cur += ch
    return out + [cur]


def wrap(text, face, width):
    words, lines, line = [], [], ""
    for word in text.split():
        words += _break_long(word, face, width)
    for word in words:
        trial = (line + " " + word).strip()
        if face.length(trial) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def wrap_even(text, face, width):
    # Like wrap, but evens the lines out so a last word isn't left alone on its own line.
    lines = wrap(text, face, width)
    if len(lines) < 2:
        return lines
    best = width
    trial = width
    while trial > width / 2:
        trial -= 20
        if len(wrap(text, face, trial)) != len(lines):
            break
        best = trial
    return wrap(text, face, best)


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_rect(a, b, t):
    return tuple(lerp(x, y, t) for x, y in zip(a, b))


def overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return max(0, min(ax + aw, bx + bw) - max(ax, bx)) * max(0, min(ay + ah, by + bh) - max(ay, by))


# ---------------------------------------------------------------------------------------------------------------------------
# Logo: rasterize the brand SVGs with Edge headless (transparent background). Cached under .video/logo.
# ---------------------------------------------------------------------------------------------------------------------------

def _edge():
    for path in EDGE:
        if os.path.exists(path):
            return path
    # Edge keeps versioned folders under Application\<version>\msedge.exe too.
    for base in EDGE:
        root = os.path.dirname(base)
        if os.path.isdir(root):
            for sub in sorted(os.listdir(root), reverse=True):
                candidate = os.path.join(root, sub, "msedge.exe")
                if os.path.exists(candidate):
                    return candidate
    raise RuntimeError("Edge not found, cannot rasterize the logo SVGs")


def _shoot(html_name, svg_markup_name, size, out):
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    html = LOGO_DIR / html_name
    html.write_text('<html><body style="margin:0;background:transparent"><img src="%s" width="%d" height="%d"></body></html>'
                    % (svg_markup_name, size[0], size[1]), encoding="utf-8")
    subprocess.run([_edge(), "--headless", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                    "--window-size=%d,%d" % size, "--screenshot=" + str(out), html.resolve().as_uri()],
                   check=True, capture_output=True)


@lru_cache(maxsize=None)
def logo(name):
    """'lockup' or 'crystal', as a transparent RGBA image trimmed to its content."""
    out = LOGO_DIR / (name + ".png")
    if not out.exists():
        LOGO_DIR.mkdir(parents=True, exist_ok=True)
        brand = REPO / "img" / "brand"
        if name == "lockup":
            # The master lockup carries a solid void rectangle behind it. Drop it so the card's own backdrop shows through.
            svg = re.sub(r'<rect x="0" y="0" width="1120" height="380"[^>]*/>', "", (brand / "aethyr-lockup.svg").read_text(encoding="utf-8"))
            (LOGO_DIR / "lockup-t.svg").write_text(svg, encoding="utf-8")
            _shoot("lockup.html", "lockup-t.svg", (1120, 380), out)
        else:
            shutil_copy = (brand / "aethyr-crystal.svg").read_text(encoding="utf-8")
            (LOGO_DIR / "crystal-t.svg").write_text(shutil_copy, encoding="utf-8")
            _shoot("crystal.html", "crystal-t.svg", (640, 640), out)
    image = Image.open(out).convert("RGBA")
    return image.crop(image.getchannel("A").getbbox())


def fit_width(image, width):
    return image.resize((int(width), int(round(image.height * width / image.width))), Image.LANCZOS)


# ---------------------------------------------------------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------------------------------------------------------

def paste_layer(frame, layer, at=(0, 0), alpha=1.0):
    if alpha < 1.0:
        a = layer.getchannel("A").point(lambda v: int(v * alpha))
        layer = layer.copy()
        layer.putalpha(a)
    frame.paste(layer, (int(at[0]), int(at[1])), layer)


def rounded_mask(size, radius, alpha=255):
    big = Image.new("L", (size[0] * 3, size[1] * 3), 0)
    ImageDraw.Draw(big).rounded_rectangle((0, 0, size[0] * 3 - 1, size[1] * 3 - 1), radius=radius * 3, fill=alpha)
    return big.resize(size, Image.LANCZOS)


class Timeline:
    def __init__(self, folder, theme):
        data = json.load(open(os.path.join(folder, "timeline.json"), encoding="utf-8"))
        self.folder = folder
        self.src_fps = data["fps"]
        self.src_w, self.src_h = data["size"]
        self.count = data["frames"]
        self.still = data.get("still")
        self.layout = data.get("layout", "split")
        self.intro = data["intro"]
        self.outro = data.get("outro", {"id": self.intro.get("id", "")})
        self.events = sorted(data["events"], key=lambda e: e["frame"])
        self.accent = theme.kinds.get(self.intro.get("kind"), theme.c1)

    def at(self, kind, time):
        # The latest event of this kind at or before time, and the one before it.
        current, previous = None, None
        for event in self.events:
            if event["type"] != kind:
                continue
            if event["frame"] / self.src_fps > time:
                break
            previous, current = current, event
        return current, previous

    def all(self, kind):
        return [e for e in self.events if e["type"] == kind]


# ---------------------------------------------------------------------------------------------------------------------------
# Scrolling for the chat and terminal panels
# ---------------------------------------------------------------------------------------------------------------------------

class Scroller:
    """Keeps the newest revealed content in view. steps are (time, bottom y) pairs, offsets only ever grow."""

    def __init__(self, steps, view_h, pad=18):
        self.marks, best = [], 0
        for t, bottom in sorted(steps):
            best = max(best, bottom + pad - view_h)
            self.marks.append((t, max(0, best)))

    def offset(self, now):
        prev, cur = 0, None
        for t, off in self.marks:
            if t > now:
                break
            prev_off = cur[1] if cur else 0
            cur = (t, off)
            prev = prev_off
        if not cur:
            return 0
        return lerp(prev, cur[1], ease((now - cur[0]) / 0.4))


# ---------------------------------------------------------------------------------------------------------------------------
# Chat panel: styled like the site's .chat / .turn / .tools blocks (docs/docs.css).
# ---------------------------------------------------------------------------------------------------------------------------

class ChatPanel:
    PAD = 20

    def __init__(self, theme, accent, size, events, fps):
        self.th, self.accent, self.w, self.h = theme, accent, size[0], size[1]
        self.f_who = F("display", 15, 600)
        self.f_body = F("body", 21, 400)
        self.f_code = F("mono", 17, 500)
        self.f_res = F("mono", 15, 400)
        self.lh, self.res_lh = 32, 22
        self.inner = self.w - self.PAD * 2
        self.turns = self.group([e for e in events if e["type"] == "chat"], fps)
        self.layout()

    def group(self, events, fps):
        turns, ai = [], None
        for e in events:
            t0 = e["frame"] / fps
            role = e["role"]
            if role == "you":
                text = e["text"]
                turns.append({"role": "you", "who": e.get("who", "you"), "text": text, "t0": t0,
                              "dur": e.get("dur") or max(1.0, len(text) / 26)})
                ai = None
                continue
            if ai is None:
                ai = {"role": "ai", "who": e.get("who", "Aethyr · your AI"), "text": "", "t0": t0, "tools": [], "text_t0": None, "dur": 1.0}
                turns.append(ai)
            if role == "tool":
                ai["tools"].append({"name": e["name"], "args": e.get("args", ""), "result": e.get("result", ""), "t0": t0,
                                    "run": e.get("run", 0.5), "ms": e.get("ms"), "status": e.get("status", "ok")})
            else:
                ai["text"], ai["text_t0"] = e["text"], t0
                ai["who"] = e.get("who", ai["who"])
                ai["dur"] = e.get("dur") or max(1.0, len(e["text"].split()) / 7)
        return turns

    def layout(self):
        y = 0
        steps = []
        for turn in self.turns:
            turn["y"] = y
            y += 16 + 20 + 6  # padding, label, gap
            steps.append((turn["t0"], y))
            if turn["role"] == "you":
                turn["lines"] = wrap(turn["text"], self.f_body, self.inner)
                turn["text_y"] = y
                n = max(1, len(turn["lines"]))
                for i in range(n):
                    steps.append((turn["t0"] + turn["dur"] * i / n, y + (i + 1) * self.lh))
                y += n * self.lh
            else:
                for tool in turn["tools"]:
                    tool["y"] = y
                    tool["res_lines"] = wrap(tool["result"], self.f_res, self.inner - 14) if tool["result"] else []
                    steps.append((tool["t0"], y + 36))
                    y += 36
                    if tool["res_lines"]:
                        steps.append((tool["t0"] + tool["run"], y + 4 + self.res_lh * len(tool["res_lines"])))
                        y += 4 + self.res_lh * len(tool["res_lines"])
                    y += 12
                turn["lines"] = wrap(turn["text"], self.f_body, self.inner) if turn["text"] else []
                turn["text_y"] = y
                n = max(1, len(turn["lines"]))
                for i in range(len(turn["lines"])):
                    steps.append((turn["text_t0"] + turn["dur"] * i / n, y + (i + 1) * self.lh))
                y += len(turn["lines"]) * self.lh
            y += 16
            turn["h"] = y - turn["y"]
        self.total = y
        self.scroll = Scroller(steps, self.h)

    def reveal(self, lines, frac, by_word):
        """The lines with the first part of the text visible. Returns [(shown, full_length_line)]."""
        if by_word:
            total = sum(len(line.split()) for line in lines)
            left = math.ceil(total * frac)
            out = []
            for line in lines:
                words = line.split()
                take = min(len(words), left)
                left -= take
                out.append(" ".join(words[:take]))
            return out
        total = sum(len(line) + 1 for line in lines)
        left = int(total * frac)
        out = []
        for line in lines:
            take = min(len(line), left)
            left -= len(line) + 1
            out.append(line[:take])
        return out

    def draw(self, now):
        th = self.th
        image = Image.new("RGB", (self.w, self.h), th.void)
        draw = ImageDraw.Draw(image)
        off = self.scroll.offset(now)
        ai_bg = mix(th.c2, th.void, 0.05)
        for turn in self.turns:
            if now < turn["t0"]:
                break
            top = turn["y"] - off
            if turn["role"] == "ai":
                draw.rectangle((0, top, self.w, top + turn["h"]), fill=ai_bg)
            draw.line((0, top + turn["h"], self.w, top + turn["h"]), fill=mix(th.line, th.void, th.line_alpha), width=1)
            bg = ai_bg if turn["role"] == "ai" else th.void
            fade = ease((now - turn["t0"]) / 0.2)
            label_color = th.c1 if turn["role"] == "you" else th.c2
            self.f_who.draw(draw, (self.PAD, top + 16), turn["who"].upper(), mix(label_color, bg, fade), "la", track=2.2)
            if turn["role"] == "you":
                frac = (now - turn["t0"]) / turn["dur"]
                shown = self.reveal(turn["lines"], max(0, min(1, frac)), by_word=False)
                for i, part in enumerate(shown):
                    self.f_body.draw(draw, (self.PAD, top + turn["text_y"] - turn["y"] + i * self.lh), part, th.ink, "la")
                typing = frac < 1
                if typing or int((now - turn["t0"] - turn["dur"]) * 2) % 2 == 0 and now - turn["t0"] - turn["dur"] < 3:
                    last = max(0, sum(1 for part in shown if part) - 1)
                    cx = self.PAD + (self.f_body.length(shown[last]) if shown else 0) + 3
                    cy = top + turn["text_y"] - turn["y"] + last * self.lh
                    draw.rectangle((cx, cy + 5, cx + 2, cy + self.lh - 5), fill=th.c1)
            else:
                for tool in turn["tools"]:
                    if now >= tool["t0"]:
                        self.draw_tool(draw, tool, top - turn["y"], now, bg)
                if turn["lines"] and turn["text_t0"] is not None and now >= turn["text_t0"]:
                    frac = (now - turn["text_t0"]) / turn["dur"]
                    shown = self.reveal(turn["lines"], max(0, min(1, frac)), by_word=True)
                    for i, part in enumerate(shown):
                        self.f_body.draw(draw, (self.PAD, top + turn["text_y"] - turn["y"] + i * self.lh), part, th.ink, "la")
        return image

    def draw_tool(self, draw, tool, shift, now, bg):
        th = self.th
        y = tool["y"] + shift
        age = now - tool["t0"]
        fade = ease(age / 0.18)
        done = age >= tool["run"]
        name = tool["name"]
        width = self.f_code.length(name) + 24 + 30
        box = (self.PAD, y, self.PAD + width, y + 30)
        draw.rounded_rectangle(box, radius=15, fill=mix(th.void2, bg, fade), outline=mix(th.line, bg, fade * 0.9 + 0.1), width=1)
        failed = tool["status"] == "error"
        if not done:
            icon, icon_col = "." * (int(age * 6) % 3 + 1), th.c1
        else:
            icon, icon_col = ("\u2715", th.warm) if failed else ("\u2713", th.ok)
        self.f_code.draw(draw, (self.PAD + 14, y + 15), icon, mix(icon_col, bg, fade), "lm")
        self.f_code.draw(draw, (self.PAD + 38, y + 15), name, mix(th.warm2, bg, fade), "lm")
        if done and tool.get("ms") is not None:
            self.f_res.draw(draw, (self.PAD + width + 10, y + 15), "%d ms" % tool["ms"], mix(th.dim, bg, ease((age - tool["run"]) / 0.2)), "lm")
        if done and tool["res_lines"]:
            k = ease((age - tool["run"]) / 0.22)
            color = mix(th.warm if failed else th.dim, bg, k)
            for i, line in enumerate(tool["res_lines"]):
                self.f_res.draw(draw, (self.PAD + 14, y + 36 + 4 + i * self.res_lh), line, color, "la")

    def render(self, now):
        return self.draw(now)


# ---------------------------------------------------------------------------------------------------------------------------
# Terminal readout: the tool results as a themed terminal (JetBrains Mono on --void, prompt in the accent).
# ---------------------------------------------------------------------------------------------------------------------------

class TermPanel:
    PAD = 22
    BAR = 44

    def __init__(self, theme, accent, size, events, fps):
        self.th, self.accent, self.w, self.h = theme, accent, size[0], size[1]
        self.f = F("mono", 19, 400)
        self.f_bar = F("mono", 15, 500)
        self.lh = 28
        self.inner = self.w - self.PAD * 2
        self.calls = []
        y, steps = 0, []
        for e in events:
            if e["type"] != "chat" or e["role"] != "tool":
                continue
            t0 = e["frame"] / fps
            run = e.get("run", 0.5)
            head = "\u276f " + e["name"] + ((" " + e["args"]) if e.get("args") else "")
            head_lines = wrap(head, self.f, self.inner)
            out = []
            lines = e.get("output") or ([e["result"]] if e.get("result") else [])
            for line in lines:
                out += wrap(line, self.f, self.inner - 24) or [""]
            call = {"t0": t0, "run": run, "name": e["name"], "head": head_lines, "out": out, "y": y,
                    "status": e.get("status", "ok"), "ms": e.get("ms")}
            steps.append((t0, y + self.lh * len(head_lines)))
            for i in range(len(out)):
                steps.append((t0 + run + 0.07 * i, y + self.lh * (len(head_lines) + i + 1)))
            y += self.lh * (len(head_lines) + len(out) + 1) + 10
            self.calls.append(call)
        self.scroll = Scroller(steps, self.h - self.BAR - 10)

    def draw(self, now):
        th = self.th
        image = Image.new("RGB", (self.w, self.h), mix(th.void, (0, 0, 0), 0.92))
        draw = ImageDraw.Draw(image)
        bar_bg = mix(th.void2, th.void, 0.9)
        draw.rectangle((0, 0, self.w, self.BAR), fill=bar_bg)
        draw.line((0, self.BAR, self.w, self.BAR), fill=mix(th.line, bar_bg, th.line_alpha), width=1)
        for i, col in enumerate((th.warm, th.c2, self.accent)):
            draw.ellipse((self.PAD + i * 22, self.BAR / 2 - 6, self.PAD + i * 22 + 12, self.BAR / 2 + 6), fill=mix(col, bar_bg, 0.55))
        self.f_bar.draw(draw, (self.w / 2, self.BAR / 2), "AethyrMcp.exe  \u00b7  stdio", th.dim, "mm", track=1.5)
        off = self.scroll.offset(now)
        bg = image.getpixel((2, self.BAR + 4))
        body = Image.new("RGB", (self.w, self.h - self.BAR - 1), bg)
        bd = ImageDraw.Draw(body)
        for call in self.calls:
            if now < call["t0"]:
                break
            y = 10 + call["y"] - off
            typed = ease((now - call["t0"]) / 0.35)
            for i, line in enumerate(call["head"]):
                shown = line[: int(len(line) * typed) + 1] if typed < 1 else line
                x = self.PAD
                if i == 0 and shown.startswith("\u276f "):
                    x += self.f.draw(bd, (x, y), "\u276f ", self.accent, "la")
                    shown = shown[2:]
                    name = call["name"]
                    part = shown[: len(name)]
                    x += self.f.draw(bd, (x, y), part, th.warm2, "la")
                    shown = shown[len(name):]
                self.f.draw(bd, (x, y + i * self.lh), shown, th.dim, "la")
            y += self.lh * len(call["head"])
            failed = call["status"] == "error"
            for i, line in enumerate(call["out"]):
                shown_at = call["t0"] + call["run"] + 0.07 * i
                if now < shown_at:
                    break
                k = ease((now - shown_at) / 0.15)
                ly = y + i * self.lh
                m = re.match(r"^(\s*[\w./-]{1,28}):\s(.*)$", line)
                if failed:
                    self.f.draw(bd, (self.PAD + 24, ly), line, mix(th.warm, bg, k), "la")
                elif m:
                    w = self.f.draw(bd, (self.PAD + 24, ly), m.group(1) + ": ", mix(th.c2, bg, k), "la")
                    self.f.draw(bd, (self.PAD + 24 + w, ly), m.group(2), mix(th.ink2, bg, k), "la")
                else:
                    self.f.draw(bd, (self.PAD + 24, ly), line, mix(th.ink2, bg, k), "la")
            if now >= call["t0"] + call["run"] + 0.07 * max(0, len(call["out"]) - 1) + 0.1:
                tail = ("\u2715 error" if failed else "\u2713 ok") + (("  %d ms" % call["ms"]) if call.get("ms") is not None else "")
                self.f_bar.draw(bd, (self.PAD + 24, y + len(call["out"]) * self.lh + 1), tail, th.warm if failed else th.ok, "la")
        image.paste(body, (0, self.BAR + 1))
        return image

    def render(self, now):
        return self.draw(now)


# ---------------------------------------------------------------------------------------------------------------------------
# The renderer
# ---------------------------------------------------------------------------------------------------------------------------

class Renderer:
    def __init__(self, timeline, theme):
        self.th = theme
        self.t = timeline
        self.accent = timeline.accent
        self.split = timeline.layout == "split"
        self.vw, self.vh = (EDITOR[2], EDITOR[3]) if self.split else (W, H)
        self.k = self.vw / 1920
        self.full = self.fit((0, 0, timeline.src_w, timeline.src_h))
        self.frames = {}
        self.glow_cache = {}
        self.focus_times = [e["frame"] / timeline.src_fps for e in timeline.all("focus")]
        self.highlights = timeline.all("highlight")
        self.shown = [self.shown_at(e) for e in self.highlights]
        self.chat_events = timeline.all("chat")
        if self.split:
            self.chat = ChatPanel(theme, self.accent, CHAT_SPLIT[2:], timeline.events, timeline.src_fps)
            self.term = None
        else:
            self.chat = ChatPanel(theme, self.accent, CHAT_TERM[2:], timeline.events, timeline.src_fps)
            self.term = TermPanel(theme, self.accent, TERM_TERM[2:], timeline.events, timeline.src_fps)
        self.pauses = self.find_pauses()
        self.cache = {}
        self.base = self.build_base()

    # --- camera, highlights and pointer (Tether's logic, scaled to the editor view) -----------------------------------------

    def fit(self, rect):
        # Grow a rect to 16:9 around its centre and keep it inside the frame.
        x, y, w, h = rect
        cx, cy = x + w / 2, y + h / 2
        w = max(w, 820)
        h = max(h, 820 * 9 / 16)
        if w / h > 16 / 9:
            h = w * 9 / 16
        else:
            w = h * 16 / 9
        w = min(w, self.t.src_w)
        h = min(h, self.t.src_h)
        x = min(max(cx - w / 2, 0), self.t.src_w - w)
        y = min(max(cy - h / 2, 0), self.t.src_h - h)
        return (x, y, w, h)

    def source(self, index):
        if self.t.still:
            if "still" not in self.frames:
                self.frames["still"] = Image.open(os.path.join(self.t.folder, self.t.still)).convert("RGB")
            return self.frames["still"]
        index = max(0, min(self.t.count - 1, index))
        if index not in self.frames:
            if len(self.frames) > 8:
                self.frames.clear()
            self.frames[index] = Image.open(os.path.join(self.t.folder, "%05d.png" % index)).convert("RGB")
        return self.frames[index]

    def camera(self, time):
        current, previous = self.t.at("focus", time)
        target = self.full if not current or not current.get("rect") else self.fit(current["rect"])
        if not current:
            return target
        start = self.full if not previous or not previous.get("rect") else self.fit(previous["rect"])
        elapsed = time - current["frame"] / self.t.src_fps
        return lerp_rect(start, target, ease(elapsed / EASE))

    def shown_at(self, event):
        # A highlight waits for a camera move that starts with it or just before it, so its boxes don't slide into place. A clear
        # never waits, or the old boxes would linger through the move.
        start = event["frame"] / self.t.src_fps
        if not event.get("items"):
            return start
        for begin in self.focus_times:
            if begin <= start < begin + EASE:
                start = max(start, begin + EASE * 0.8)
        return start

    def find_pauses(self):
        # Where the body holds still, in recorded time, once a caption, highlight or chat beat has landed. A pause never lands
        # inside a transition (a camera move, a pointer on its way, a click ripple, a fade, a key chip, a chat reveal), since
        # freezing one halfway looks broken. It waits for the transition to finish instead. Pauses close together merge.
        fps = self.t.src_fps
        busy = [(t, t + EASE) for t in self.focus_times]
        for e in self.t.all("pointer"):
            start = e["frame"] / fps
            travel = e.get("travel", 0.45)
            busy.append((start, start + travel + (0.5 if e.get("click") else 0.0)))
        for i, e in enumerate(self.highlights):
            busy.append((self.shown[i], self.shown[i] + (0.35 if e.get("items") else 0.25)))
        for e in self.t.all("caption"):
            busy.append((e["frame"] / fps, e["frame"] / fps + 0.3))
        for e in self.t.all("keys"):
            start = e["frame"] / fps
            busy += [(start, start + 0.15), (start + 1.3, start + 1.6)]
        marks = [(e["frame"] / fps + 0.35, CAPTION_PAUSE) for e in self.t.all("caption") if e.get("text")]
        marks += [(self.shown[i] + 0.4, HIGHLIGHT_PAUSE) for i, e in enumerate(self.highlights) if e.get("items")]
        for turn in self.chat.turns:
            if turn["role"] == "you":
                busy.append((turn["t0"], turn["t0"] + turn["dur"] + 0.1))
                continue
            for tool in turn["tools"]:
                busy.append((tool["t0"], tool["t0"] + tool["run"] + 0.3))
                marks.append((tool["t0"] + tool["run"] + 0.3, TOOL_PAUSE))
            if turn["text"] and turn["text_t0"] is not None:
                end = turn["text_t0"] + turn["dur"]
                busy.append((turn["text_t0"], end + 0.1))
                marks.append((end + 0.1, min(2.0, 0.5 + 0.045 * len(turn["text"].split()))))

        def settled(at):
            moved = True
            while moved:
                moved = False
                for begin, end in busy:
                    if begin <= at < end:
                        at, moved = end + 0.05, True
            return at

        body = self.t.count / fps
        pauses = []
        for at, length in sorted((settled(at), length) for at, length in marks):
            if at >= body - 0.2:
                continue
            if pauses and at - pauses[-1][0] < 0.5:
                pauses[-1] = (pauses[-1][0], max(pauses[-1][1], length))
            else:
                pauses.append((at, length))
        self.busy = busy
        return pauses

    def body_length(self):
        return (self.t.count / self.t.src_fps + sum(length for _, length in self.pauses)) * SLOW

    def recorded_time(self, played):
        # Maps time in the finished video's body back to time in the recording.
        time = played / SLOW
        for at, length in self.pauses:
            if time < at:
                return time
            if time < at + length:
                return at
            time -= length
        return time

    def highlight_state(self, time):
        # The highlight on screen, the last one that had boxes and when it was cleared, and how strong the dim is. A clear
        # fades the old boxes out, and a clear followed closely by a new highlight keeps the dim up instead of flashing.
        seg_start, seg_from, seg_to = 0.0, 0.0, 0.0
        current, last_items, cleared_at = None, None, None
        for i, event in enumerate(self.highlights):
            start = self.shown[i]
            if start > time:
                break
            lit = bool(event.get("items"))
            if not lit:
                upcoming = next((j for j in range(i + 1, len(self.highlights)) if self.highlights[j].get("items")), None)
                lit = upcoming is not None and self.shown[upcoming] - start < 0.7
            level = seg_from + (seg_to - seg_from) * ease((start - seg_start) / 0.3)
            seg_start, seg_from, seg_to = start, level, (1.0 if lit else 0.0)
            if event.get("items"):
                last_items, cleared_at = event, None
            elif last_items is not None and cleared_at is None:
                cleared_at = start
            current = event
        dim = seg_from + (seg_to - seg_from) * ease((time - seg_start) / 0.3)
        return current, last_items, cleared_at, dim

    def to_out(self, cam, rect):
        cx, cy, cw, ch = cam
        sx, sy = self.vw / cw, self.vh / ch
        x, y, w, h = rect
        return ((x - cx) * sx, (y - cy) * sy, w * sx, h * sy)

    def pointer(self, time):
        moves = self.t.all("pointer")
        if not moves:
            return None, None
        current, previous = None, None
        for event in moves:
            if event["frame"] / self.t.src_fps > time:
                break
            previous, current = current, event
        if not current:
            return None, None
        start = (previous["x"], previous["y"]) if previous else (current["x"], current["y"] + 120)
        elapsed = time - current["frame"] / self.t.src_fps
        travel = current.get("travel", 0.45)
        k = ease(elapsed / travel)
        pos = (lerp(start[0], current["x"], k), lerp(start[1], current["y"], k))
        click = None
        for event in moves:
            if event.get("click") and 0 <= time - (event["frame"] / self.t.src_fps + event.get("travel", 0.45)) < 0.5:
                click = (event["x"], event["y"], time - (event["frame"] / self.t.src_fps + event.get("travel", 0.45)))
        return pos, click

    def glow_box(self, size, color, radius=12):
        key = (int(size[0]) // 2, int(size[1]) // 2, color)
        if key in self.glow_cache:
            return self.glow_cache[key]
        margin = 28
        w, h = int(size[0]) + margin * 2, int(size[1]) + margin * 2
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle((margin, margin, w - margin, h - margin), radius=radius, outline=color + (255,), width=10)
        glow = layer.filter(ImageFilter.GaussianBlur(10))
        glow.alpha_composite(glow)
        crisp = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(crisp).rounded_rectangle((margin, margin, w - margin, h - margin), radius=radius, outline=color + (255,), width=4)
        glow.alpha_composite(crisp)
        if len(self.glow_cache) > 200:
            self.glow_cache.clear()
        self.glow_cache[key] = (glow, margin)
        return glow, margin

    def draw_highlights(self, frame, cam, time):
        current, last_items, cleared_at, dim = self.highlight_state(time)
        if current is not None and current.get("items"):
            event, fade = current, ease((time - self.shown[next(i for i, e in enumerate(self.highlights) if e is current)]) / 0.35)
        elif last_items is not None and cleared_at is not None and time - cleared_at < 0.25:
            event, fade = last_items, 1 - ease((time - cleared_at) / 0.25)
        else:
            event, fade = None, 0.0
        if dim <= 0.01 and event is None:
            return [], []
        pulse = 0.78 + 0.22 * math.sin(time * 2 * math.pi / 1.3)
        boxes = []
        for item in (event["items"] if event else []):
            x, y, w, h = self.to_out(cam, item["rect"])
            # Thin rows sit close together, so they get less padding and don't run into each other.
            pad = 8 if h >= 30 else 4
            boxes.append((x - pad, y - pad, w + pad * 2, h + pad * 2, item))

        # Dim everything outside the boxes. A box fading out lets the dim back in over it.
        mask = Image.new("L", frame.size, int(120 * dim))
        draw = ImageDraw.Draw(mask)
        for x, y, w, h, _ in boxes:
            draw.rounded_rectangle((x, y, x + w, y + h), radius=12, fill=int(120 * dim * (1 - fade)))
        mask = mask.filter(ImageFilter.GaussianBlur(4))
        frame.paste((0, 0, 0), (0, 0) + frame.size, mask)

        overlay = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        for x, y, w, h, item in boxes:
            color = self.th.color(item.get("color", "c1"))
            glow, margin = self.glow_box((w, h), color)
            alpha = glow.getchannel("A").point(lambda a: int(a * fade * pulse))
            glow = glow.copy()
            glow.putalpha(alpha)
            overlay.alpha_composite(glow, (int(x - margin), int(y - margin)))
        frame.paste(overlay, (0, 0), overlay)

        rects = [(x, y, w, h) for x, y, w, h, _ in boxes]
        labels = []
        for x, y, w, h, item in boxes:
            if item.get("label"):
                others = [r for r in rects if r != (x, y, w, h)] + labels
                labels.append(self.draw_label(frame, (x, y, w, h), item["label"], self.th.color(item.get("color", "c1")), fade, item.get("side"), others))
        return rects, labels

    def label_place(self, box, pw, ph, side):
        x, y, w, h = box
        gap = 26
        if side == "above":
            px, py = x + w / 2 - pw / 2, y - ph - gap
            tip = (x + w / 2, y - 4)
            base = ((tip[0] - 11, py + ph), (tip[0] + 11, py + ph))
        elif side == "below":
            px, py = x + w / 2 - pw / 2, y + h + gap
            tip = (x + w / 2, y + h + 4)
            base = ((tip[0] - 11, py), (tip[0] + 11, py))
        elif side == "left":
            px, py = x - pw - gap, y + h / 2 - ph / 2
            tip = (x - 4, y + h / 2)
            base = ((px + pw, tip[1] - 11), (px + pw, tip[1] + 11))
        else:
            px, py = x + w + gap, y + h / 2 - ph / 2
            tip = (x + w + 4, y + h / 2)
            base = ((px, tip[1] - 11), (px, tip[1] + 11))
        clamped = (max(12, min(self.vw - pw - 12, px)), max(12, min(self.vh - ph - 12, py)))
        # A pill pushed back on screen has drifted off its side, so the drift counts against the placement.
        drift = abs(clamped[0] - px) + abs(clamped[1] - py)
        if clamped != (px, py):
            # Move the arrow's base with the pill, so it still joins the pill.
            dx, dy = clamped[0] - px, clamped[1] - py
            base = tuple((bx + dx, by + dy) for bx, by in base)
        return clamped, tip, base, drift

    def draw_label(self, frame, box, text, color, fade, side=None, others=()):
        face = F("display", 22, 600)
        pw, ph = face.length(text, 0.8) + 28, 40
        # Try the sides in a sensible order and keep the one that covers the least of the other boxes and labels. A thin row
        # usually has neighbours above and below, so its label prefers to sit beside it. A side the scene asked for wins ties.
        order = ["right", "left", "above", "below"] if box[3] < 52 else ["above", "below", "right", "left"]
        if side:
            order = [side] + [o for o in order if o != side]
        best = None
        for candidate in order:
            (px, py), tip, base, drift = self.label_place(box, pw, ph, candidate)
            cost = sum(overlap((px, py, pw, ph), other) for other in others) + overlap((px, py, pw, ph), box) + drift * ph
            if best is None or cost < best[0]:
                best = (cost, px, py, tip, base)
            if cost == 0:
                break
        _, px, py, tip, base = best
        layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        a = int(255 * fade)
        draw.polygon([tip, base[0], base[1]], fill=color + (a,))
        draw.rounded_rectangle((px, py, px + pw, py + ph), radius=20, fill=color + (a,))
        face.draw(draw, (px + 14, py + ph / 2), text, self.th.on_c1 + (a,), "lm", track=0.8)
        frame.paste(layer, (0, 0), layer)
        return (px, py, pw, ph)

    def draw_pointer(self, frame, cam, time):
        pos, click = self.pointer(time)
        if not pos:
            return
        x, y, _, _ = self.to_out(cam, (pos[0], pos[1], 0, 0))
        # A pointer parked outside the zoomed view would show cut off at the frame's edge, so it isn't drawn.
        if not (0 <= x < self.vw - 20 and 0 <= y < self.vh - 30):
            return
        layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        if click:
            cx, cy, _, _ = self.to_out(cam, (click[0], click[1], 0, 0))
            k = click[2] / 0.5
            r = 8 + 36 * k
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=self.accent + (int(255 * (1 - k)),), width=5)
        s = 1.0
        arrow = [(0, 0), (0, 34), (9, 26), (15, 40), (21, 37), (15, 24), (27, 24)]
        pts = [(x + px * s, y + py * s) for px, py in arrow]
        shadow = [(px + 3, py + 4) for px, py in pts]
        outline = self.th.void + (255,)
        draw.polygon(shadow, fill=(0, 0, 0, 110))
        draw.polygon(pts, fill=self.th.ink + (255,), outline=outline)
        draw.line(pts + [pts[0]], fill=outline, width=2)
        frame.paste(layer, (0, 0), layer)

    def draw_caption(self, frame, time):
        current, _ = self.t.at("caption", time)
        if not current or not current.get("text"):
            return
        zone = CAPTION_ZONE_SPLIT if self.split else CAPTION_ZONE_TERM
        fade = ease((time - current["frame"] / self.t.src_fps) / 0.3)
        step = current.get("step")
        face = F("body", 30, 400)
        lines = wrap_even(current["text"], face, zone[2] - (130 if step else 80))
        lh = 44
        left = 92 if step else 38
        width = max(face.length(line) for line in lines) + left + 40
        height = lh * len(lines) + 36
        x = zone[0] + zone[2] / 2 - width / 2
        y = zone[1] + (zone[3] - height) / 2 + (1 - fade) * 14
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        a = fade
        th = self.th
        fill = th.void2 + (int(240 * a),)
        draw.rounded_rectangle((x, y, x + width, y + height), radius=16, fill=fill, outline=self.accent + (int(170 * a),), width=2)
        draw.rounded_rectangle((x, y, x + 7, y + height), radius=4, fill=self.accent + (int(255 * a),))
        if step:
            cx, cy = x + 50, y + height / 2
            draw.ellipse((cx - 23, cy - 23, cx + 23, cy + 23), fill=self.accent + (int(255 * a),))
            F("display", 28, 700).draw(draw, (cx, cy + 1), str(step), th.on_c1 + (int(255 * a),), "mm")
        for i, line in enumerate(lines):
            face.draw(draw, (x + left, y + 18 + i * lh + lh / 2), line, th.ink + (int(255 * a),), "lm")
        frame.paste(layer, (0, 0), layer)

    def draw_keys(self, frame, time, avoid=()):
        face = F("display", 26, 600)
        for event in self.t.all("keys"):
            start = event["frame"] / self.t.src_fps
            age = time - start
            if not 0 <= age < 1.6:
                continue
            a = ease(age / 0.15) * (1 - ease((age - 1.3) / 0.3))
            parts = [part.strip() for part in event["text"].split("+")]
            layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(layer)
            widths = [face.length(part) + 34 for part in parts]
            plus = 38
            total = sum(widths) + plus * (len(parts) - 1)
            # Top right unless that covers a highlight or label, then top left, then just above the bottom edge.
            spots = [(self.vw - 40 - total, 40), (40, 40), (self.vw - 40 - total, self.vh - 110)]
            x, top = min(spots, key=lambda spot: (sum(overlap((spot[0], spot[1], total, 56), r) for r in avoid), spots.index(spot)))
            mid = top + 28
            for i, part in enumerate(parts):
                kw = widths[i]
                draw.rounded_rectangle((x, top, x + kw, top + 56), radius=10, fill=self.th.ink + (int(245 * a),), outline=self.th.line + (int(255 * a),), width=3)
                face.draw(draw, (x + kw / 2, mid), part, self.th.void + (int(255 * a),), "mm")
                x += kw
                if i < len(parts) - 1:
                    face.draw(draw, (x + plus / 2, mid), "+", self.th.ink + (int(255 * a),), "mm")
                    x += plus
            frame.paste(layer, (0, 0), layer)

    def view_frame(self, time, pointer=True):
        cam = self.camera(time)
        src = self.source(int(time * self.t.src_fps))
        x, y, w, h = cam
        frame = src.resize((self.vw, self.vh), Image.BICUBIC, box=(x, y, x + w, y + h))
        boxes, labels = self.draw_highlights(frame, cam, time)
        if pointer:
            self.draw_pointer(frame, cam, time)
        self.draw_keys(frame, time, boxes + labels)
        return frame

    # --- backdrop, chrome and the composed body frame ---------------------------------------------------------------------

    def ambient(self):
        th = self.th
        image = Image.new("RGB", (W, H), th.void)
        grad = Image.radial_gradient("L").resize((1500, 1100), Image.BICUBIC)
        grad = ImageChops.invert(grad)
        for color, centre, strength in ((th.c1, (360, 140), 0.20), (th.c2, (1640, 980), 0.14)):
            k = strength * (0.6 + 0.4 * th.glow_k)
            mask = grad.point(lambda v: int(v * v / 255 * k))
            image.paste(color, (centre[0] - 750, centre[1] - 550), mask)
        grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(grid)
        colour = th.grid + (int(255 * min(1.0, th.grid_alpha * 1.6)),)
        for gx in range(0, W, th.grid_size):
            gd.line((gx, 0, gx, H), fill=colour, width=1)
        for gy in range(0, H, th.grid_size):
            gd.line((0, gy, W, gy), fill=colour, width=1)
        image.paste(grid, (0, 0), grid)
        return image

    def build_base(self):
        th = self.th
        info = self.t.intro
        base = self.ambient()
        draw = ImageDraw.Draw(base)
        kicker = "AETHYR  \u00b7  RITUAL %s" % info.get("circled", info.get("number", ""))
        w = F("display", 24, 600).draw(draw, (40, HEADER_H / 2 + 2), kicker, self.accent, "lm", track=3.5)
        title = "%s  %s" % (info.get("glyph", ""), info.get("title", ""))
        F("body", 22, 400).draw(draw, (40 + w + 26, HEADER_H / 2 + 2), title, th.dim, "lm")
        bug = fit_width(logo("crystal"), 40)
        paste_layer(base, bug, (1880 - bug.width, (HEADER_H - bug.height) // 2 + 2), 0.55)
        if self.split:
            ex, ey, ew, eh = EDITOR
            shadow = Image.new("RGBA", (ew + 120, eh + 120), (0, 0, 0, 0))
            ImageDraw.Draw(shadow).rounded_rectangle((60, 70, 60 + ew, 70 + eh), radius=14, fill=(0, 0, 0, 150))
            paste_layer(base, shadow.filter(ImageFilter.GaussianBlur(16)), (ex - 60, ey - 60))
        return base

    def frame_chrome(self, frame):
        """Border around the editor window and the panel borders, drawn over the pasted content."""
        th = self.th

        def outline(rect, color, alpha, radius=12):
            x, y, w, h = rect
            edge = Image.new("L", (w * 3, h * 3), 0)
            ImageDraw.Draw(edge).rounded_rectangle((0, 0, w * 3 - 1, h * 3 - 1), radius=radius * 3, outline=255, width=6)
            edge = edge.resize((w, h), Image.LANCZOS).point(lambda v: int(v * alpha))
            frame.paste(color, (x, y), edge)

        if self.split:
            outline(EDITOR, self.accent, 0.55, 14)
            outline(CHAT_SPLIT, th.line, min(1.0, th.line_alpha * 2.2))
        else:
            outline(CHAT_TERM, th.line, min(1.0, th.line_alpha * 2.2))
            outline(TERM_TERM, self.accent, 0.5)

    def body_frame(self, time, pointer=True):
        frame = self.base.copy()
        panel_alpha = 0.95
        if self.split:
            view = self.view_frame(time, pointer)
            ex, ey, ew, eh = EDITOR
            frame.paste(view, (ex, ey), self.mask("editor", (ew, eh), 14))
            chat = self.chat.render(time)
            frame.paste(chat, CHAT_SPLIT[:2], self.mask("chat", chat.size, 12, panel_alpha))
        else:
            chat = self.chat.render(time)
            frame.paste(chat, CHAT_TERM[:2], self.mask("chat", chat.size, 12, panel_alpha))
            term = self.term.render(time)
            frame.paste(term, TERM_TERM[:2], self.mask("term", term.size, 12, panel_alpha))
        self.frame_chrome(frame)
        self.draw_caption(frame, time)
        return frame

    def mask(self, name, size, radius, alpha=1.0):
        key = (name, size, radius, alpha)
        if key not in self.cache:
            self.cache[key] = rounded_mask(size, radius, int(255 * alpha))
        return self.cache[key]

    # --- title and end cards -----------------------------------------------------------------------------------------------

    def sprite(self, key, build):
        if key not in self.cache:
            self.cache[key] = build()
        return self.cache[key]

    def gradient_text(self, text, face, colors):
        probe = Image.new("L", (1, 1))
        width = int(face.length(text)) + 40
        height = int(face.size * 1.5)
        mask = Image.new("L", (width, height), 0)
        face.draw(ImageDraw.Draw(mask), (20, height / 2), text, 255, "lm")
        grad = Image.new("RGB", (width, height))
        gd = ImageDraw.Draw(grad)
        # linear-gradient(100deg, a, b): close enough to a left to right sweep with a slight tilt.
        for gx in range(width):
            c = mix(colors[1], colors[0], gx / max(1, width - 1))
            gd.line((gx, 0, gx, height), fill=c)
        layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        layer.paste(grad, (0, 0), mask)
        del probe
        return layer

    def card_stack(self):
        """Title card pieces laid out top to bottom: (name, sprite, y) centred on x, plus the bar's y."""
        th, info = self.th, self.t.intro

        def build():
            parts = {}
            parts["lockup"] = fit_width(logo("lockup"), 560)
            kicker = "AETHYR  \u00b7  RITUAL %s" % info.get("circled", info.get("number", ""))
            kface = F("display", 30, 600)
            kw = int(kface.length(kicker, 5)) + 20
            layer = Image.new("RGBA", (kw, 50), (0, 0, 0, 0))
            kface.draw(ImageDraw.Draw(layer), (kw / 2, 25), kicker, self.accent + (255,), "mm", track=5)
            parts["kicker"] = layer
            gface = F("display", 84, 400)
            glyph = Image.new("RGBA", (160, 110), (0, 0, 0, 0))
            F("display", 84, 400).draw(ImageDraw.Draw(glyph), (80, 55), info.get("glyph", ""), th.c2 + (255,), "mm")
            halo = glyph.filter(ImageFilter.GaussianBlur(16))
            halo.putalpha(halo.getchannel("A").point(lambda v: int(v * (0.5 + 0.5 * th.glow_k))))
            halo.alpha_composite(glyph)
            parts["glyph"] = halo
            del gface
            title = info.get("title", "").upper()
            size = 96
            while size > 52:
                face = F("arcane", size)
                lines = wrap_even(title, face, 1560)
                if len(lines) <= 2:
                    break
                size -= 6
            face = F("arcane", size)
            rows = [self.gradient_text(line, face, th.grad) for line in lines]
            gap = int(size * 1.05)
            tl = Image.new("RGBA", (max(r.width for r in rows), gap * len(rows) + int(size * 0.5)), (0, 0, 0, 0))
            for i, row in enumerate(rows):
                tl.alpha_composite(row, ((tl.width - row.width) // 2, i * gap))
            parts["title"] = tl
            sub = Image.new("RGBA", (W, 130), (0, 0, 0, 0))
            sd = ImageDraw.Draw(sub)
            sface = F("body", 32, 400)
            for i, line in enumerate(wrap_even(info.get("subtitle", ""), sface, 1300)):
                sface.draw(sd, (W / 2, 24 + i * 46), line, th.dim + (255,), "mm")
            parts["sub"] = sub
            via = Image.new("RGBA", (W, 40), (0, 0, 0, 0))
            if info.get("via"):
                F("mono", 21, 500).draw(ImageDraw.Draw(via), (W / 2, 20), info["via"], self.accent + (255,), "mm", track=2)
            parts["via"] = via
            return parts

        return self.sprite("card", build)

    def card_backdrop(self):
        return self.sprite("card-bg", self.ambient)

    def intro_frame(self, age):
        p = self.card_stack()
        frame = self.card_backdrop().copy()
        a = ease(age / 0.5)
        heights = [("lockup", 0), ("kicker", 34), ("glyph", 12), ("title", 4), ("bar", 28), ("sub", 30), ("via", 4)]
        sizes = {k: (p[k].height if k in p else 8) for k, _ in heights}
        sizes["sub"] = 56 * max(1, len(wrap_even(self.t.intro.get("subtitle", ""), F("body", 32, 400), 1300))) + 6
        total = sum(sizes[k] + gap for k, gap in heights)
        y = (H - total) / 2 + 10
        pos = {}
        for key, gap in heights:
            y += gap
            pos[key] = y
            y += sizes[key]
        rise = (1 - a) * 18
        for key in ("lockup", "kicker", "glyph"):
            paste_layer(frame, p[key], ((W - p[key].width) // 2, pos[key] + rise), a)
        title_a = ease((age - 0.1) / 0.5)
        paste_layer(frame, p["title"], ((W - p["title"].width) // 2, pos["title"] + (1 - title_a) * 20), title_a)
        bar = 420 * ease((age - 0.25) / 0.6)
        ImageDraw.Draw(frame).rounded_rectangle((W / 2 - bar / 2, pos["bar"], W / 2 + bar / 2, pos["bar"] + 6), radius=3, fill=self.accent)
        paste_layer(frame, p["sub"], (0, pos["sub"] - 24), ease((age - 0.45) / 0.5))
        paste_layer(frame, p["via"], (0, pos["via"]), ease((age - 0.6) / 0.5))
        return frame

    def outro_frame(self, age):
        th, info = self.th, self.t.outro
        frame = self.card_backdrop().copy()
        a = ease(age / 0.4)
        lock = fit_width(logo("lockup"), 640)
        url = "aethyr.gg/docs/tutorials/#%s" % info.get("id", "")

        def build():
            kface = F("display", 26, 600)
            ktext = "READ THE RITUAL"
            kw = int(kface.length(ktext, 5)) + 20
            kicker = Image.new("RGBA", (kw, 44), (0, 0, 0, 0))
            kface.draw(ImageDraw.Draw(kicker), (kw / 2, 22), ktext, self.accent + (255,), "mm", track=5)
            uface = F("mono", 44, 500)
            uw = int(uface.length(url)) + 90
            pill = Image.new("RGBA", (uw, 100), (0, 0, 0, 0))
            pd = ImageDraw.Draw(pill)
            pd.rounded_rectangle((0, 0, uw - 1, 99), radius=16, fill=th.void2 + (int(255 * 0.92),), outline=self.accent + (200,), width=2)
            uface.draw(pd, (uw / 2, 50), url, th.ink + (255,), "mm")
            return kicker, pill

        kicker, pill = self.sprite(("outro", url), build)
        glyph_face = F("display", 36, 600)
        label = "%s  %s" % (self.t.intro.get("glyph", ""), self.t.intro.get("title", ""))
        total = lock.height + 56 + kicker.height + 18 + pill.height + 46 + 44
        y = (H - total) / 2
        paste_layer(frame, lock, ((W - lock.width) // 2, y), a)
        y += lock.height + 56
        paste_layer(frame, kicker, ((W - kicker.width) // 2, y), ease((age - 0.2) / 0.4))
        y += kicker.height + 18
        paste_layer(frame, pill, ((W - pill.width) // 2, y), ease((age - 0.3) / 0.4))
        y += pill.height + 46
        d = ImageDraw.Draw(frame)
        glyph_face.draw(d, (W / 2, y + 22), label, mix(th.dim, th.void, ease((age - 0.5) / 0.4)), "mm")
        return frame

    # --- assembly ---------------------------------------------------------------------------------------------------------

    def play_frame(self, time):
        """The finished video's frame at `time` seconds: title card, then body, then end card."""
        blend = 0.5
        body_len = self.body_length()
        last = self.t.count / self.t.src_fps - 1 / self.t.src_fps
        black = Image.new("RGB", (W, H), (0, 0, 0))
        if time < INTRO_LEN:
            frame = self.intro_frame(time)
            if time < 0.35:
                frame = Image.blend(black, frame, ease(time / 0.35))
            if time > INTRO_LEN - blend:
                frame = Image.blend(frame, self.body_frame(0.0), ease((time - (INTRO_LEN - blend)) / blend))
        elif time < INTRO_LEN + body_len:
            frame = self.body_frame(min(self.recorded_time(time - INTRO_LEN), last))
        else:
            age = time - INTRO_LEN - body_len
            frame = self.outro_frame(age)
            if age < blend:
                frame = Image.blend(self.body_frame(last, pointer=False), frame, ease(age / blend))
            if age > OUTRO_LEN - 0.5:
                frame = Image.blend(frame, black, ease((age - (OUTRO_LEN - 0.5)) / 0.5))
        return frame

    def total_length(self):
        return INTRO_LEN + self.body_length() + OUTRO_LEN

    def render(self, out, poster=None, limit=None):
        # Written under a temporary name and renamed at the end, so an interrupted render never leaves a broken video behind.
        partial = out[:-4] + ".part.mp4"
        ff = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H), "-r", str(FPS),
                               "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", partial],
                              stdin=subprocess.PIPE)
        total = int(self.total_length() * FPS)
        if limit:
            total = min(total, int(limit * FPS))
        for k in range(total):
            ff.stdin.write(self.play_frame(k / FPS).tobytes())
        ff.stdin.close()
        if ff.wait() != 0:
            raise RuntimeError("ffmpeg failed on %s" % out)
        os.replace(partial, out)
        if poster:
            self.save_poster(poster)
        return out

    def save_poster(self, poster):
        # The poster is the title card as it stands one second in, once the logo, title, bar and subtitle are all in.
        self.intro_frame(1.4).resize((1280, 720), Image.LANCZOS).save(poster, quality=88)


def make(folder, theme_id=None):
    fetch_fonts()
    theme = Theme(theme_id)
    return Renderer(Timeline(folder, theme), theme)


def render(folder, out, poster=None, theme_id=None):
    return make(folder, theme_id).render(out, poster)


if __name__ == "__main__":
    args = sys.argv[1:]
    theme_arg = None
    if "--theme" in args:
        i = args.index("--theme")
        theme_arg = args[i + 1]
        del args[i:i + 2]
    render(args[0], args[1], args[2] if len(args) > 2 else None, theme_arg)
