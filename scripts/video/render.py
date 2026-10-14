# Turns a recorded Ritual scene into a finished 2560x1440 mp4: title card, chat panel (or terminal readout), an eased camera on the
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
#   fps, size [w, h] of the editor frames, frames (count: the length of the body), still (+, optional: one image used for every frame),
#   files (+, optional: a file name per frame, so a hold repeats one PNG)
#   layout (+): "split" (editor on the left, chat on the right) or "terminal" (chat and terminal readout, no editor)
#   intro (+): {id, number, glyph, title, subtitle, via, kind: "tutorial" | "troubleshoot"}    outro (+): {id}
#   events: caption {text, step, pos}, highlight {items: [{rect, label, color: c1|c2|warm}]}, focus {rect}, pointer {x, y, click},
#           keys {text}, and chat (+):
#     {"type": "chat", "frame": F, "role": "you",  "who": "you", "text": "...", "dur": secs}
#     {"type": "chat", "frame": F, "role": "tool", "name": "get_graph", "args": "...", "result": "...", "status": "ok|error",
#         "ms": 41, "run": 0.5, "output": ["line", ...]}      (output feeds the terminal readout)
#     {"type": "chat", "frame": F, "role": "ai",   "who": "Aethyr · your AI", "text": "...", "dur": secs}
#     A tool event attaches to the AI turn that follows the latest "you" line. The AI text streams in after its tool chips.
import bisect
import json
import math
import os
import random
import re
import subprocess
import sys
import urllib.request
import zlib
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

# All layout below is written in 1920x1080 "design" units and drawn at S times that, so the output is 2560x1440 with the same
# composition, only sharper. Face, D and paste_layer take design units. Anything that works on view/panel pixels says so.
S = 4 / 3
W, H = 1920, 1080
OW, OH = round(W * S), round(H * S)
FPS = 30
# The editor footage must stay near 1:1. Effective scale = output panel pixels per source pixel, at every camera keyframe.
MIN_SCALE, MAX_SCALE = 0.8, 1.25
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

def sc(value):
    """Design units to output pixels."""
    return int(round(value * S))


def sz(width, height):
    return (sc(width), sc(height))


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
    """A site font at a design size (drawn at S times that), plus the symbol fallback. Lengths come back in design units.

    Circled Ritual numbers fall back to Segoe UI Symbol, where they are drawn small, so they get their own size: the circle is
    scaled to the cap height of the main font."""

    def __init__(self, kind, size, weight=400):
        self.kind, self.size, self.weight = kind, size, weight
        self.px = sc(size)
        self.main = _pil(kind, self.px, weight)
        self.fallback = ImageFont.truetype(SYMBOL_FONT, self.px)
        cap = self.main.getbbox("H")
        probe = ImageFont.truetype(SYMBOL_FONT, 100).getbbox("\u2460")
        self.circle = ImageFont.truetype(SYMBOL_FONT, max(6, int(100 * (cap[3] - cap[1]) * 1.2 / (probe[3] - probe[1]))))

    def runs(self, text):
        out = []
        for ch in text:
            if _covers(self.kind, self.weight, ch):
                font = self.main
            elif "\u2460" <= ch <= "\u2473":
                font = self.circle
            else:
                font = self.fallback
            if out and out[-1][0] is font:
                out[-1][1] += ch
            else:
                out.append([font, ch])
        return out

    def length(self, text, track=0):
        return sum(font.getlength(sub) for font, sub in self.runs(text)) / S + track * len(text)

    def draw(self, draw, xy, text, fill, anchor="la", track=0, px=False):
        """Draws at xy (design units, or output pixels with px=True). Returns the width in design units."""
        raw = getattr(draw, "raw", draw)
        x, y = xy if px else (xy[0] * S, xy[1] * S)
        gap = track * S
        width = sum(font.getlength(sub) for font, sub in self.runs(text)) + gap * len(text)
        if anchor[0] == "m":
            x -= width / 2
        elif anchor[0] == "r":
            x -= width
        asc, desc = self.main.getmetrics()
        base = {"a": y + asc, "m": y + (asc - desc) / 2, "s": y}[anchor[1]]
        height = raw.im.size[1]
        if base - asc > height + 8 or base + desc < -8:
            return width / S  # entirely off the image (a panel scrolled past it): nothing to draw, and PIL rejects the empty mask
        for font, sub in self.runs(text):
            if gap:
                for ch in sub:
                    raw.text((x, base), ch, font=font, fill=fill, anchor="ls")
                    x += font.getlength(ch) + gap
            else:
                raw.text((x, base), sub, font=font, fill=fill, anchor="ls")
                x += font.getlength(sub)
        return width / S


@lru_cache(maxsize=None)
def F(kind, size, weight=400):
    return Face(kind, size, weight)


class D:
    """ImageDraw that takes design units and scales shapes by S."""

    def __init__(self, image):
        self.raw = ImageDraw.Draw(image)

    @staticmethod
    def _box(box):
        return tuple(v * S for v in box)

    @staticmethod
    def _w(width):
        return max(1, int(round(width * S)))

    def rounded_rectangle(self, box, radius=0, fill=None, outline=None, width=1):
        self.raw.rounded_rectangle(self._box(box), radius=radius * S, fill=fill, outline=outline, width=self._w(width))

    def rectangle(self, box, fill=None, outline=None, width=1):
        self.raw.rectangle(self._box(box), fill=fill, outline=outline, width=self._w(width))

    def line(self, box, fill=None, width=1):
        self.raw.line(self._box(box), fill=fill, width=self._w(width))

    def ellipse(self, box, fill=None, outline=None, width=1):
        self.raw.ellipse(self._box(box), fill=fill, outline=outline, width=self._w(width))


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


def _shoot(html_name, svg_name, size, out):
    LOGO_DIR.mkdir(parents=True, exist_ok=True)
    html = LOGO_DIR / html_name
    html.write_text('<html><body style="margin:0;background:transparent"><img src="%s" width="%d" height="%d"></body></html>'
                    % (svg_name, size[0], size[1]), encoding="utf-8")
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
            (LOGO_DIR / "crystal-t.svg").write_text((brand / "aethyr-crystal.svg").read_text(encoding="utf-8"), encoding="utf-8")
            _shoot("crystal.html", "crystal-t.svg", (640, 640), out)
    image = Image.open(out).convert("RGBA")
    return image.crop(image.getchannel("A").getbbox())


def fit_width(image, width):
    """Scales to `width` output pixels."""
    return image.resize((int(width), int(round(image.height * width / image.width))), Image.LANCZOS)


# ---------------------------------------------------------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------------------------------------------------------

def paste_layer(frame, layer, at=(0, 0), alpha=1.0):
    """Pastes an RGBA layer (output pixels) at `at` (design units)."""
    if alpha < 1.0:
        a = layer.getchannel("A").point(lambda v: int(v * alpha))
        layer = layer.copy()
        layer.putalpha(a)
    frame.paste(layer, (int(round(at[0] * S)), int(round(at[1] * S))), layer)


def rounded_mask(size, radius, alpha=255):
    """A rounded-rectangle mask. size and radius are output pixels."""
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
        self.files = data.get("files")  # one file name per frame (holds repeat a name), instead of numbered frames
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
            prev = cur[1] if cur else 0
            cur = (t, off)
        if not cur:
            return 0
        return lerp(prev, cur[1], ease((now - cur[0]) / 0.4))


# ---------------------------------------------------------------------------------------------------------------------------
# Chat panel: styled like the site's .chat / .turn / .tools blocks (docs/docs.css). Sizes are design units, the image is output px.
# ---------------------------------------------------------------------------------------------------------------------------

THINK = 0.9  # seconds of "thinking" before an AI turn's first chip or text
TYPE_CAP = 6.5  # the longest a question takes to type, whatever its length
TYPE_LEAD = 0.25  # a beat before the first key


def _rng(text, salt):
    return random.Random(zlib.crc32((salt + text).encode("utf-8")))


def _codeish(word):
    core = word.strip(".,?!;:()\"'")
    return core.startswith("/") or "_" in core or "." in core or bool(re.search(r"[a-z][A-Z]", core))


def typing_schedule(text):
    """Seconds after the start of typing at which each character appears: a person at a keyboard, 40 to 90 ms a key with
    jitter, a little extra after spaces, a longer stop after commas and full stops, and a slower start on a path or other code-ish
    token. Seeded from the text so every render comes out the same."""
    rng = _rng(text, "type")
    code_start = {m.start() for m in re.finditer(r"\S+", text) if _codeish(m.group(0))}
    times, t = [], TYPE_LEAD
    for i, ch in enumerate(text):
        d = rng.uniform(0.040, 0.090)
        if i in code_start:
            d += rng.uniform(0.12, 0.25)
        if i > 0:
            prev = text[i - 1]
            if prev == " ":
                d += rng.uniform(0.02, 0.07)
            if prev in ",;:.?!":
                d += rng.uniform(0.15, 0.35)
        t += d
        times.append(t)
    return times


def typing_plan(text, cap=TYPE_CAP):
    """(times, total): the schedule squeezed to fit `cap` seconds when a human cadence would run longer."""
    times = typing_schedule(text)
    natural = (times[-1] + 0.2) if times else 0.0
    total = min(natural, cap)
    k = total / natural if natural else 1.0
    return [t * k for t in times], total


def stream_plan(count, seed):
    """Token-sized bursts for a streamed reply: chunks of 1 to 4 words arriving at an uneven but fast rate. Returns the chunk
    boundaries and each chunk's arrival as a fraction (0 to 0.92) of the streaming time."""
    rng = _rng(seed, "stream")
    chunks, i = [], 0
    while i < count:
        k = rng.choice([1, 1, 2, 2, 2, 3, 3, 4])
        chunks.append((i, min(count, i + k)))
        i += k
    gaps = [rng.uniform(0.5, 1.6) * (0.6 + 0.4 * (b - a)) for a, b in chunks]
    arrivals, total = [], 0.0
    for gap in gaps[:-1]:
        arrivals.append(total)
        total += gap
    arrivals.append(total)
    scale = 0.92 / total if total > 0 else 0.0
    return chunks, [a * scale for a in arrivals]


def reveal_chars(lines, count):
    """The wrapped lines with the first `count` characters of the text visible. Lines fill strictly in order, and a line not yet
    reached comes back empty."""
    out, left = [], count
    for line in lines:
        take = max(0, min(len(line), left))
        left -= len(line) + 1
        out.append(line[:take])
    return out


def selftest():
    """Guards against typing several wrapped lines at once (a negative slice once showed most of every later line)."""
    lines = ["aaaa bbbb", "cccc dddd", "eeee"]
    got = reveal_chars(lines, int(sum(len(x) + 1 for x in lines) * 0.3))
    assert got[0] == "aaaa bb" and got[1] == "" and got[2] == "", got
    assert reveal_chars(lines, 0) == ["", "", ""]
    assert reveal_chars(lines, 11) == ["aaaa bbbb", "c", ""], reveal_chars(lines, 11)
    assert reveal_chars(lines, 999) == lines
    times, total = typing_plan("What does /Game/AethyrSamples/AI/BP_Enemy do? Give me the gist, then the event graph.")
    assert all(b >= a for a, b in zip(times, times[1:])) and 2.0 < total <= TYPE_CAP, (total,)
    assert typing_plan("same text")[0] == typing_plan("same text")[0]
    chunks, arrivals = stream_plan(40, "x")
    assert chunks[0][0] == 0 and chunks[-1][1] == 40 and all(b >= a for a, b in zip(arrivals, arrivals[1:])) and arrivals[-1] <= 0.92 + 1e-9
    return True


class ChatPanel:
    PAD = 20

    def __init__(self, theme, accent, width, events, fps):
        self.th, self.accent, self.w = theme, accent, width
        self.f_who = F("display", 15, 600)
        self.f_body = F("body", 21, 400)
        self.f_code = F("mono", 17, 500)
        self.f_res = F("mono", 15, 400)
        self.lh, self.res_lh = 32, 22
        self.inner = self.w - self.PAD * 2
        self.turns = self.group([e for e in events if e["type"] == "chat"], fps)
        self.bind(lambda t: t)
        self.content_h = self.total + 4
        self.fit(self.content_h)

    def fit(self, height):
        self.h = height
        self.scroll = Scroller(self.steps, height)

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
        for turn in turns:
            if turn["role"] == "you":
                turn["type_times"], turn["type_total"] = typing_plan(turn["text"])
        return turns

    def extra_pauses(self):
        """Pauses the animation needs on top of the recording: time for a question to be typed at a human pace when the recorded
        hold was shorter, and a thinking beat before each AI turn. Returned as (recorded time, seconds)."""
        out = []
        for turn in self.turns:
            if turn["role"] == "you":
                extra = turn["type_total"] - turn["dur"]
                if extra > 0.01:
                    out.append((turn["t0"], extra))
            else:
                out.append((turn["t0"] - 1e-4, THINK))
        return out

    def bind(self, vt):
        """Lays the turns out and fixes every animation time in virtual time: the unslowed time of the finished video, where the
        pauses above are real time. vt maps recorded time to it."""
        y = 0
        steps = []
        for turn in self.turns:
            turn["y"] = y
            y += 16 + 20 + 6  # padding, label, gap
            if turn["role"] == "you":
                turn["v0"] = vt(turn["t0"])
                steps.append((turn["v0"], y))
                turn["lines"] = wrap(turn["text"], self.f_body, self.inner)
                turn["text_y"] = y
                start = 0
                for i, line in enumerate(turn["lines"]):
                    first = min(start, len(turn["type_times"]) - 1)
                    steps.append((turn["v0"] + (turn["type_times"][first] if turn["type_times"] else 0), y + (i + 1) * self.lh))
                    start += len(line) + 1
                y += max(1, len(turn["lines"])) * self.lh
            else:
                turn["vfirst"] = vt(turn["t0"])
                turn["vstart"] = turn["vfirst"] - THINK
                steps.append((turn["vstart"], y))
                for tool in turn["tools"]:
                    tool["v0"] = vt(tool["t0"])
                    tool["y"] = y
                    tool["res_lines"] = wrap(tool["result"], self.f_res, self.inner - 14) if tool["result"] else []
                    steps.append((tool["v0"], y + 36))
                    y += 36
                    if tool["res_lines"]:
                        steps.append((tool["v0"] + tool["run"], y + 4 + self.res_lh * len(tool["res_lines"])))
                        y += 4 + self.res_lh * len(tool["res_lines"])
                    y += 12
                turn["lines"] = wrap(turn["text"], self.f_body, self.inner) if turn["text"] else []
                turn["text_y"] = y
                if turn["lines"]:
                    turn["vtext"] = vt(turn["text_t0"])
                    tokens = [line.split() for line in turn["lines"]]
                    count = sum(len(t) for t in tokens)
                    chunks, arrivals = stream_plan(count, turn["text"])
                    when = [0.0] * count
                    for (a, b), frac in zip(chunks, arrivals):
                        for k in range(a, b):
                            when[k] = frac * turn["dur"]
                    turn["tokens"], turn["token_when"] = tokens, when
                    index = 0
                    for i, toks in enumerate(tokens):
                        steps.append((turn["vtext"] + (when[index] if toks else 0), y + (i + 1) * self.lh))
                        index += len(toks)
                y += len(turn["lines"]) * self.lh
            y += 16
            turn["h"] = y - turn["y"]
        self.total = y
        self.steps = steps
        if hasattr(self, "h"):
            self.scroll = Scroller(self.steps, self.h)

    def render(self, now):
        """The panel at virtual time `now`."""
        th = self.th
        image = Image.new("RGB", sz(self.w, self.h), th.void)
        draw = D(image)
        off = self.scroll.offset(now)
        ai_bg = mix(th.c2, th.void, 0.05)
        for turn in self.turns:
            begin = turn["v0"] if turn["role"] == "you" else turn["vstart"]
            if now < begin:
                break
            top = turn["y"] - off
            if turn["role"] == "ai":
                draw.rectangle((0, top, self.w, top + turn["h"]), fill=ai_bg)
            draw.line((0, top + turn["h"], self.w, top + turn["h"]), fill=mix(th.line, th.void, th.line_alpha), width=1)
            bg = ai_bg if turn["role"] == "ai" else th.void
            fade = ease((now - begin) / 0.2)
            label_color = th.c1 if turn["role"] == "you" else th.c2
            self.f_who.draw(draw, (self.PAD, top + 16), turn["who"].upper(), mix(label_color, bg, fade), "la", track=2.2)
            text_top = top + turn["text_y"] - turn["y"]
            if turn["role"] == "you":
                self.draw_you(draw, turn, now, text_top)
            else:
                self.draw_ai(draw, turn, now, top, text_top, bg)
        return image

    def draw_you(self, draw, turn, now, text_top):
        th = self.th
        elapsed = now - turn["v0"]
        times = turn["type_times"]
        count = bisect.bisect_right(times, elapsed)
        shown = reveal_chars(turn["lines"], count)
        for i, part in enumerate(shown):
            if part:
                self.f_body.draw(draw, (self.PAD, text_top + i * self.lh), part, th.ink, "la")
        typing = elapsed < turn["type_total"] + 0.1
        after = elapsed - turn["type_total"]
        # The caret sits at the typing point the whole time. It blinks once the typing has stopped, and goes after a few seconds.
        if typing or (after < 3.0 and int(after * 2) % 2 == 0):
            last = max(0, sum(1 for part in shown if part) - 1)
            if count >= len(turn["text"]):
                last = max(0, len(turn["lines"]) - 1)
            cx = self.PAD + (self.f_body.length(shown[last]) if shown and shown[last] else 0) + 3
            draw.rectangle((cx, text_top + last * self.lh + 5, cx + 2, text_top + last * self.lh + self.lh - 5), fill=th.c1)

    def draw_ai(self, draw, turn, now, top, text_top, bg):
        th = self.th
        shift = top - turn["y"]
        # Thinking: three pulsing dots in the accent until the first chip or text arrives.
        if now < turn["vfirst"]:
            y = turn["y"] + 16 + 20 + 6 + shift
            for i in range(3):
                level = 0.35 + 0.65 * (0.5 + 0.5 * math.sin(2 * math.pi * (now * 1.7 - i * 0.2)))
                x = self.PAD + 5 + i * 15
                draw.ellipse((x - 4, y + self.lh / 2 - 4, x + 4, y + self.lh / 2 + 4), fill=mix(th.c2, bg, level))
            return
        for tool in turn["tools"]:
            if now >= tool["v0"]:
                self.draw_tool(draw, tool, shift, now, bg)
        if not turn["lines"] or now < turn["vtext"]:
            return
        elapsed = now - turn["vtext"]
        index, last_pos, streaming = 0, None, elapsed < turn["dur"] + 0.25
        for i, toks in enumerate(turn["tokens"]):
            x = self.PAD
            y = text_top + i * self.lh
            for tok in toks:
                arrive = turn["token_when"][index]
                index += 1
                if elapsed >= arrive:
                    k = ease((elapsed - arrive) / 0.16)
                    self.f_body.draw(draw, (x, y), tok, mix(th.ink, bg, k), "la")
                    last_pos = (x + self.f_body.length(tok), y)
                x += self.f_body.length(tok + " ")
        if streaming and last_pos:
            cx, cy = last_pos
            draw.rectangle((cx + 4, cy + 6, cx + 6, cy + self.lh - 6), fill=th.c2)

    def draw_tool(self, draw, tool, shift, now, bg):
        th = self.th
        y = tool["y"] + shift
        age = now - tool["v0"]
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
            icon, icon_col = ("✕", th.warm) if failed else ("✓", th.ok)
        self.f_code.draw(draw, (self.PAD + 14, y + 15), icon, mix(icon_col, bg, fade), "lm")
        self.f_code.draw(draw, (self.PAD + 38, y + 15), name, mix(th.warm2, bg, fade), "lm")
        if done and tool.get("ms") is not None:
            self.f_res.draw(draw, (self.PAD + width + 10, y + 15), "%d ms" % tool["ms"], mix(th.dim, bg, ease((age - tool["run"]) / 0.2)), "lm")
        if done and tool["res_lines"]:
            k = ease((age - tool["run"]) / 0.22)
            color = mix(th.warm if failed else th.dim, bg, k)
            for i, line in enumerate(tool["res_lines"]):
                self.f_res.draw(draw, (self.PAD + 14, y + 36 + 4 + i * self.res_lh), line, color, "la")



# ---------------------------------------------------------------------------------------------------------------------------
# Terminal readout: the tool results as a themed terminal (JetBrains Mono on --void, prompt in the accent).
# ---------------------------------------------------------------------------------------------------------------------------

class TermPanel:
    PAD = 22
    BAR = 44

    def __init__(self, theme, accent, width, events, fps):
        self.th, self.accent, self.w = theme, accent, width
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
            td = min(1.6, 0.35 + 0.012 * len(head))  # the command types out over this long, one character budget across its lines
            out_at = max(run, td + 0.1)
            call = {"t0": t0, "run": run, "name": e["name"], "head": head_lines, "out": out, "y": y,
                    "status": e.get("status", "ok"), "ms": e.get("ms"), "td": td, "out_at": out_at}
            steps.append((t0, y + self.lh * len(head_lines)))
            for i in range(len(out)):
                steps.append((t0 + out_at + 0.07 * i, y + self.lh * (len(head_lines) + i + 1)))
            y += self.lh * (len(head_lines) + len(out) + 1) + 10
            self.calls.append(call)
        self.steps = steps
        self.content_h = self.BAR + 10 + y + 14
        self.fit(self.content_h)

    def fit(self, height):
        self.h = height
        self.scroll = Scroller(self.steps, height - self.BAR - 10)

    def render(self, now):
        th = self.th
        bg = mix(th.void, (0, 0, 0), 0.92)
        image = Image.new("RGB", sz(self.w, self.h), bg)
        draw = D(image)
        bar_bg = mix(th.void2, th.void, 0.9)
        draw.rectangle((0, 0, self.w, self.BAR), fill=bar_bg)
        draw.line((0, self.BAR, self.w, self.BAR), fill=mix(th.line, bar_bg, th.line_alpha), width=1)
        for i, col in enumerate((th.warm, th.c2, self.accent)):
            draw.ellipse((self.PAD + i * 22, self.BAR / 2 - 6, self.PAD + i * 22 + 12, self.BAR / 2 + 6), fill=mix(col, bar_bg, 0.55))
        self.f_bar.draw(draw, (self.w / 2, self.BAR / 2), "AethyrMcp.exe  \u00b7  stdio", th.dim, "mm", track=1.5)
        off = self.scroll.offset(now)
        body = Image.new("RGB", (image.width, image.height - sc(self.BAR + 1)), bg)
        bd = D(body)
        for call in self.calls:
            if now < call["t0"]:
                break
            y = 10 + call["y"] - off
            typed = max(0.0, min(1.0, (now - call["t0"]) / call["td"]))
            budget = sum(len(part) for part in call["head"])
            left = budget if typed >= 1 else int(budget * typed) + 1
            for i, line in enumerate(call["head"]):
                take = max(0, min(len(line), left))  # lines fill in order, never in parallel
                left -= len(line)
                shown = line[:take]
                x = self.PAD
                if i == 0 and shown.startswith("\u276f "):
                    x += self.f.draw(bd, (x, y), "\u276f ", self.accent, "la")
                    shown = shown[2:]
                    name = call["name"]
                    x += self.f.draw(bd, (x, y), shown[: len(name)], th.warm2, "la")
                    shown = shown[len(name):]
                self.f.draw(bd, (x, y + i * self.lh), shown, th.dim, "la")
            y += self.lh * len(call["head"])
            failed = call["status"] == "error"
            for i, line in enumerate(call["out"]):
                shown_at = call["t0"] + call["out_at"] + 0.07 * i
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
            if now >= call["t0"] + call["out_at"] + 0.07 * max(0, len(call["out"]) - 1) + 0.1:
                tail = ("\u2715 error" if failed else "\u2713 ok") + (("  %d ms" % call["ms"]) if call.get("ms") is not None else "")
                self.f_bar.draw(bd, (self.PAD + 24, y + len(call["out"]) * self.lh + 1), tail, th.warm if failed else th.ok, "la")
        image.paste(body, (0, sc(self.BAR + 1)))
        return image


# ---------------------------------------------------------------------------------------------------------------------------
# The renderer
# ---------------------------------------------------------------------------------------------------------------------------

class Renderer:
    def __init__(self, timeline, theme, name=""):
        self.th = theme
        self.t = timeline
        self.name = name or timeline.intro.get("id", "")
        self.accent = timeline.accent
        self.split = timeline.layout == "split"
        self.vw, self.vh = (EDITOR[2], EDITOR[3]) if self.split else (W, H)  # editor view, design units
        self.vpx = sz(self.vw, self.vh)
        self.min_cam_w = self.vpx[0] / MAX_SCALE  # never zoom in past MAX_SCALE output px per source px
        self.frames = {}
        self.glow_cache = {}
        self.focus_times = [e["frame"] / timeline.src_fps for e in timeline.all("focus")]
        self.highlights = timeline.all("highlight")
        self.chat_events = timeline.all("chat")
        self.scale_range = None
        if self.split:
            self.full = self.fit((0, 0, timeline.src_w, timeline.src_h))
            self.check_scale()
        else:
            print("%s: no editor footage (terminal layout)" % self.name)
        self.shown = [self.shown_at(e) for e in self.highlights]
        if self.split:
            self.chat = ChatPanel(theme, self.accent, CHAT_SPLIT[2], timeline.events, timeline.src_fps)
            self.chat.fit(CHAT_SPLIT[3])
            self.term = None
            self.chat_rect = CHAT_SPLIT
        else:
            self.chat = ChatPanel(theme, self.accent, CHAT_TERM[2], timeline.events, timeline.src_fps)
            self.term = TermPanel(theme, self.accent, TERM_TERM[2], timeline.events, timeline.src_fps)
            # Size both panels to their content (same height so they read as a pair), centred in the area above the caption.
            height = max(360, min(CHAT_TERM[3], max(self.chat.content_h, self.term.content_h) + 24))
            self.chat.fit(height)
            self.term.fit(height)
            top = CHAT_TERM[1] + (CHAT_TERM[3] - height) / 2
            self.chat_rect = (CHAT_TERM[0], top, CHAT_TERM[2], height)
            self.term_rect = (TERM_TERM[0], top, TERM_TERM[2], height)
        self.pauses = self.find_pauses()
        # The chat animation needs real time of its own (a question typed at a human pace, a thinking beat before each answer).
        # It goes in as extra pauses, so the recording itself is never touched.
        self.pauses = sorted(self.pauses + self.chat.extra_pauses())
        self.chat.bind(self.vt)
        self.cache = {}
        self.base = self.build_base()

    # --- camera, highlights and pointer (Tether's logic, scaled to the editor view) -----------------------------------------

    def fit(self, rect):
        # Grow a rect to 16:9 around its centre and keep it inside the frame. The width never goes below min_cam_w, which is
        # what keeps the editor from being enlarged past MAX_SCALE.
        x, y, w, h = rect
        cx, cy = x + w / 2, y + h / 2
        w = max(w, self.min_cam_w)
        h = max(h, self.min_cam_w * 9 / 16)
        if w / h > 16 / 9:
            h = w * 9 / 16
        else:
            w = h * 16 / 9
        w = min(w, self.t.src_w)
        h = min(h, self.t.src_h)
        x = min(max(cx - w / 2, 0), self.t.src_w - w)
        y = min(max(cy - h / 2, 0), self.t.src_h - h)
        return (x, y, w, h)

    def check_scale(self):
        """Effective scale (output panel px per source px) at every camera keyframe. Fails the render outside the band."""
        rects = [("full view", self.full)] + [("focus at frame %d" % e["frame"], self.fit(e["rect"])) for e in self.t.all("focus") if e.get("rect")]
        scales = [(label, self.vpx[0] / r[2]) for label, r in rects]
        self.scale_range = (min(s for _, s in scales), max(s for _, s in scales))
        print("%s: editor scale min %.2f max %.2f (band %.2f to %.2f)" % (self.name, self.scale_range[0], self.scale_range[1], MIN_SCALE, MAX_SCALE))
        bad = [(label, s) for label, s in scales if s < MIN_SCALE - 1e-6 or s > MAX_SCALE + 1e-6]
        if bad:
            raise RuntimeError(
                "%s: editor scale outside %.2f to %.2f at %s. The panel is %d px wide, so the full view needs a capture roughly %d to %d px wide "
                "(this one is %dx%d). Re-capture at the size in scripts/video/README.md."
                % (self.name, MIN_SCALE, MAX_SCALE, ", ".join("%s (%.2f)" % b for b in bad), self.vpx[0],
                   self.vpx[0] / MAX_SCALE, self.vpx[0] / MIN_SCALE, self.t.src_w, self.t.src_h))

    def source(self, index):
        if self.t.still:
            if "still" not in self.frames:
                self.frames["still"] = Image.open(os.path.join(self.t.folder, self.t.still)).convert("RGB")
            return self.frames["still"]
        index = max(0, min(self.t.count - 1, index))
        name = self.t.files[index] if self.t.files else "%05d.png" % index
        if name not in self.frames:
            if len(self.frames) > 8:
                self.frames.clear()
            self.frames[name] = Image.open(os.path.join(self.t.folder, name)).convert("RGB")
        return self.frames[name]

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

    def vt(self, recorded):
        """Recorded time to virtual time, the unslowed time of the finished video (pauses count as real time)."""
        return recorded + sum(length for at, length in self.pauses if at < recorded)

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
        """Source rect to view pixels (the editor panel, at output resolution)."""
        cx, cy, cw, ch = cam
        sx, sy = self.vpx[0] / cw, self.vpx[1] / ch
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
        margin = sc(28)
        w, h = int(size[0]) + margin * 2, int(size[1]) + margin * 2
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle((margin, margin, w - margin, h - margin), radius=sc(radius), outline=color + (255,), width=sc(10))
        glow = layer.filter(ImageFilter.GaussianBlur(sc(10)))
        glow.alpha_composite(glow)
        crisp = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(crisp).rounded_rectangle((margin, margin, w - margin, h - margin), radius=sc(radius), outline=color + (255,), width=sc(4))
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
            pad = sc(8) if h >= sc(30) else sc(4)
            boxes.append((x - pad, y - pad, w + pad * 2, h + pad * 2, item))

        # Dim everything outside the boxes. A box fading out lets the dim back in over it.
        mask = Image.new("L", frame.size, int(120 * dim))
        draw = ImageDraw.Draw(mask)
        for x, y, w, h, _ in boxes:
            draw.rounded_rectangle((x, y, x + w, y + h), radius=sc(12), fill=int(120 * dim * (1 - fade)))
        mask = mask.filter(ImageFilter.GaussianBlur(sc(4)))
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

    def label_place(self, frame_size, box, pw, ph, side):
        x, y, w, h = box
        gap, half = sc(26), sc(11)
        if side == "above":
            px, py = x + w / 2 - pw / 2, y - ph - gap
            tip = (x + w / 2, y - sc(4))
            base = ((tip[0] - half, py + ph), (tip[0] + half, py + ph))
        elif side == "below":
            px, py = x + w / 2 - pw / 2, y + h + gap
            tip = (x + w / 2, y + h + sc(4))
            base = ((tip[0] - half, py), (tip[0] + half, py))
        elif side == "left":
            px, py = x - pw - gap, y + h / 2 - ph / 2
            tip = (x - sc(4), y + h / 2)
            base = ((px + pw, tip[1] - half), (px + pw, tip[1] + half))
        else:
            px, py = x + w + gap, y + h / 2 - ph / 2
            tip = (x + w + sc(4), y + h / 2)
            base = ((px, tip[1] - half), (px, tip[1] + half))
        m = sc(12)
        clamped = (max(m, min(frame_size[0] - pw - m, px)), max(m, min(frame_size[1] - ph - m, py)))
        # A pill pushed back on screen has drifted off its side, so the drift counts against the placement.
        drift = abs(clamped[0] - px) + abs(clamped[1] - py)
        if clamped != (px, py):
            # Move the arrow's base with the pill, so it still joins the pill.
            dx, dy = clamped[0] - px, clamped[1] - py
            base = tuple((bx + dx, by + dy) for bx, by in base)
        return clamped, tip, base, drift

    def draw_label(self, frame, box, text, color, fade, side=None, others=()):
        face = F("display", 22, 600)
        pw, ph = face.length(text, 0.8) * S + sc(28), sc(40)
        # Try the sides in a sensible order and keep the one that covers the least of the other boxes and labels. A thin row
        # usually has neighbours above and below, so its label prefers to sit beside it. A side the scene asked for wins ties.
        order = ["right", "left", "above", "below"] if box[3] < sc(52) else ["above", "below", "right", "left"]
        if side:
            order = [side] + [o for o in order if o != side]
        best = None
        for candidate in order:
            (px, py), tip, base, drift = self.label_place(frame.size, box, pw, ph, candidate)
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
        draw.rounded_rectangle((px, py, px + pw, py + ph), radius=sc(20), fill=color + (a,))
        face.draw(draw, (px + sc(14), py + ph / 2), text, self.th.on_c1 + (a,), "lm", track=0.8, px=True)
        frame.paste(layer, (0, 0), layer)
        return (px, py, pw, ph)

    def draw_pointer(self, frame, cam, time):
        pos, click = self.pointer(time)
        if not pos:
            return
        x, y, _, _ = self.to_out(cam, (pos[0], pos[1], 0, 0))
        # A pointer parked outside the zoomed view would show cut off at the frame's edge, so it isn't drawn.
        if not (0 <= x < frame.width - sc(20) and 0 <= y < frame.height - sc(30)):
            return
        layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        if click:
            cx, cy, _, _ = self.to_out(cam, (click[0], click[1], 0, 0))
            k = click[2] / 0.5
            r = sc(8) + sc(36) * k
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=self.accent + (int(255 * (1 - k)),), width=sc(5))
        arrow = [(0, 0), (0, 34), (9, 26), (15, 40), (21, 37), (15, 24), (27, 24)]
        pts = [(x + px * S, y + py * S) for px, py in arrow]
        shadow = [(px + sc(3), py + sc(4)) for px, py in pts]
        outline = self.th.void + (255,)
        draw.polygon(shadow, fill=(0, 0, 0, 110))
        draw.polygon(pts, fill=self.th.ink + (255,), outline=outline)
        draw.line(pts + [pts[0]], fill=outline, width=sc(2))
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
        # Drawn on a small layer positioned at (x, y), with a 2-unit margin so the outline isn't clipped.
        layer = Image.new("RGBA", sz(width + 4, height + 4), (0, 0, 0, 0))
        draw = D(layer)
        a = fade
        th = self.th
        draw.rounded_rectangle((2, 2, 2 + width, 2 + height), radius=16, fill=th.void2 + (int(240 * a),), outline=self.accent + (int(170 * a),), width=2)
        draw.rounded_rectangle((2, 2, 9, 2 + height), radius=4, fill=self.accent + (int(255 * a),))
        if step:
            cx, cy = 52, 2 + height / 2
            draw.ellipse((cx - 23, cy - 23, cx + 23, cy + 23), fill=self.accent + (int(255 * a),))
            F("display", 28, 700).draw(draw, (cx, cy + 1), str(step), th.on_c1 + (int(255 * a),), "mm")
        for i, line in enumerate(lines):
            face.draw(draw, (2 + left, 2 + 18 + i * lh + lh / 2), line, th.ink + (int(255 * a),), "lm")
        paste_layer(frame, layer, (x - 2, y - 2))

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
            widths = [face.length(part) * S + sc(34) for part in parts]
            plus = sc(38)
            total = sum(widths) + plus * (len(parts) - 1)
            kh, edge = sc(56), sc(40)
            # Top right unless that covers a highlight or label, then top left, then just above the bottom edge.
            spots = [(frame.width - edge - total, edge), (edge, edge), (frame.width - edge - total, frame.height - sc(110))]
            x, top = min(spots, key=lambda spot: (sum(overlap((spot[0], spot[1], total, kh), r) for r in avoid), spots.index(spot)))
            mid = top + kh / 2
            for i, part in enumerate(parts):
                kw = widths[i]
                draw.rounded_rectangle((x, top, x + kw, top + kh), radius=sc(10), fill=self.th.ink + (int(245 * a),), outline=self.th.line + (int(255 * a),), width=sc(3))
                face.draw(draw, (x + kw / 2, mid), part, self.th.void + (int(255 * a),), "mm", px=True)
                x += kw
                if i < len(parts) - 1:
                    face.draw(draw, (x + plus / 2, mid), "+", self.th.ink + (int(255 * a),), "mm", px=True)
                    x += plus
            frame.paste(layer, (0, 0), layer)

    def view_frame(self, time, pointer=True):
        cam = self.camera(time)
        src = self.source(int(time * self.t.src_fps))
        x, y, w, h = cam
        frame = src.resize(self.vpx, Image.LANCZOS, box=(x, y, x + w, y + h))
        boxes, labels = self.draw_highlights(frame, cam, time)
        if pointer:
            self.draw_pointer(frame, cam, time)
        self.draw_keys(frame, time, boxes + labels)
        return frame

    # --- backdrop, chrome and the composed body frame ---------------------------------------------------------------------

    def ambient(self):
        th = self.th
        image = Image.new("RGB", (OW, OH), th.void)
        grad = ImageChops.invert(Image.radial_gradient("L").resize(sz(1500, 1100), Image.BICUBIC))
        for color, centre, strength in ((th.c1, (360, 140), 0.20), (th.c2, (1640, 980), 0.14)):
            k = strength * (0.6 + 0.4 * th.glow_k)
            mask = grad.point(lambda v: int(v * v / 255 * k))
            image.paste(color, (sc(centre[0] - 750), sc(centre[1] - 550)), mask)
        grid = Image.new("RGBA", (OW, OH), (0, 0, 0, 0))
        gd = ImageDraw.Draw(grid)
        colour = th.grid + (int(255 * min(1.0, th.grid_alpha * 1.6)),)
        step = th.grid_size * S
        for i in range(int(OW / step) + 1):
            gd.line((round(i * step), 0, round(i * step), OH), fill=colour, width=1)
        for i in range(int(OH / step) + 1):
            gd.line((0, round(i * step), OW, round(i * step)), fill=colour, width=1)
        image.paste(grid, (0, 0), grid)
        return image

    def build_base(self):
        th = self.th
        info = self.t.intro
        base = self.ambient()
        draw = D(base)
        kicker = "AETHYR  \u00b7  RITUAL %s" % info.get("circled", info.get("number", ""))
        w = F("display", 24, 600).draw(draw, (40, HEADER_H / 2 + 2), kicker, self.accent, "lm", track=3.5)
        title = "%s  %s" % (info.get("glyph", ""), info.get("title", ""))
        F("body", 22, 400).draw(draw, (40 + w + 26, HEADER_H / 2 + 2), title, th.dim, "lm")
        bug = fit_width(logo("crystal"), sc(40))
        paste_layer(base, bug, (1880 - bug.width / S, (HEADER_H - bug.height / S) / 2 + 2), 0.55)
        if self.split:
            ex, ey, ew, eh = EDITOR
            shadow = Image.new("RGBA", sz(ew + 120, eh + 120), (0, 0, 0, 0))
            D(shadow).rounded_rectangle((60, 70, 60 + ew, 70 + eh), radius=14, fill=(0, 0, 0, 150))
            paste_layer(base, shadow.filter(ImageFilter.GaussianBlur(sc(16))), (ex - 60, ey - 60))
        return base

    def frame_chrome(self, frame):
        """Borders around the editor window and the panels, drawn over the pasted content."""
        th = self.th

        def outline(rect, color, alpha, radius=12):
            x, y, w, h = sc(rect[0]), sc(rect[1]), sc(rect[2]), sc(rect[3])
            edge = Image.new("L", (w * 3, h * 3), 0)
            ImageDraw.Draw(edge).rounded_rectangle((0, 0, w * 3 - 1, h * 3 - 1), radius=sc(radius) * 3, outline=255, width=sc(2) * 3)
            edge = edge.resize((w, h), Image.LANCZOS).point(lambda v: int(v * alpha))
            frame.paste(color, (x, y), edge)

        line_alpha = min(1.0, th.line_alpha * 2.2)
        if self.split:
            outline(EDITOR, self.accent, 0.55, 14)
            outline(self.chat_rect, th.line, line_alpha)
        else:
            outline(self.chat_rect, th.line, line_alpha)
            outline(self.term_rect, self.accent, 0.5)

    def body_frame(self, time, pointer=True, v=None):
        frame = self.base.copy()
        panel_alpha = 0.95
        if self.split:
            view = self.view_frame(time, pointer)
            ex, ey, ew, eh = EDITOR
            frame.paste(view, (sc(ex), sc(ey)), self.mask("editor", view.size, sc(14)))
        chat = self.chat.render(self.vt(time) if v is None else v)
        frame.paste(chat, (sc(self.chat_rect[0]), sc(self.chat_rect[1])), self.mask("chat%d" % chat.height, chat.size, sc(12), panel_alpha))
        if not self.split:
            term = self.term.render(time)
            frame.paste(term, (sc(self.term_rect[0]), sc(self.term_rect[1])), self.mask("term%d" % term.height, term.size, sc(12), panel_alpha))
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
        """Gradient-filled text as an RGBA layer in output pixels."""
        width = int(face.length(text) * S) + sc(40)
        height = int(face.size * 1.5 * S)
        mask = Image.new("L", (width, height), 0)
        face.draw(ImageDraw.Draw(mask), (sc(20), height / 2), text, 255, "lm", px=True)
        grad = Image.new("RGB", (width, height))
        gd = ImageDraw.Draw(grad)
        # linear-gradient(100deg, a, b): close enough to a left to right sweep.
        for gx in range(width):
            gd.line((gx, 0, gx, height), fill=mix(colors[1], colors[0], gx / max(1, width - 1)))
        layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        layer.paste(grad, (0, 0), mask)
        return layer

    def card_stack(self):
        th, info = self.th, self.t.intro

        def build():
            parts = {}
            parts["lockup"] = fit_width(logo("lockup"), sc(560))
            kicker = "AETHYR  \u00b7  RITUAL %s" % info.get("circled", info.get("number", ""))
            kface = F("display", 30, 600)
            kw = int(kface.length(kicker, 5) * S) + sc(20)
            layer = Image.new("RGBA", (kw, sc(50)), (0, 0, 0, 0))
            kface.draw(ImageDraw.Draw(layer), (kw / 2, sc(25)), kicker, self.accent + (255,), "mm", track=5, px=True)
            parts["kicker"] = layer
            glyph = Image.new("RGBA", sz(160, 110), (0, 0, 0, 0))
            F("display", 84, 400).draw(ImageDraw.Draw(glyph), (sc(80), sc(55)), info.get("glyph", ""), th.c2 + (255,), "mm", px=True)
            halo = glyph.filter(ImageFilter.GaussianBlur(sc(16)))
            halo.putalpha(halo.getchannel("A").point(lambda v: int(v * (0.5 + 0.5 * th.glow_k))))
            halo.alpha_composite(glyph)
            parts["glyph"] = halo
            title = info.get("title", "").upper()
            size = 96
            while size > 52:
                lines = wrap_even(title, F("arcane", size), 1560)
                if len(lines) <= 2:
                    break
                size -= 6
            face = F("arcane", size)
            rows = [self.gradient_text(line, face, th.grad) for line in lines]
            gap = int(size * 1.05 * S)
            tl = Image.new("RGBA", (max(r.width for r in rows), gap * len(rows) + int(size * 0.5 * S)), (0, 0, 0, 0))
            for i, row in enumerate(rows):
                tl.alpha_composite(row, ((tl.width - row.width) // 2, i * gap))
            parts["title"] = tl
            sface = F("body", 32, 400)
            sub_lines = wrap_even(info.get("subtitle", ""), sface, 1300)
            sub = Image.new("RGBA", (OW, sc(130)), (0, 0, 0, 0))
            for i, line in enumerate(sub_lines):
                sface.draw(ImageDraw.Draw(sub), (W / 2, 24 + i * 46), line, th.dim + (255,), "mm")
            parts["sub"] = sub
            parts["sub_lines"] = len(sub_lines)
            via = Image.new("RGBA", (OW, sc(40)), (0, 0, 0, 0))
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
        order = [("lockup", 0), ("kicker", 34), ("glyph", 12), ("title", 4), ("bar", 28), ("sub", 30), ("via", 4)]
        sizes = {k: (p[k].height / S if k in p else 8) for k, _ in order}
        sizes["sub"] = 56 * max(1, p["sub_lines"]) + 6
        total = sum(sizes[k] + gap for k, gap in order)
        y = (H - total) / 2 + 10
        pos = {}
        for key, gap in order:
            y += gap
            pos[key] = y
            y += sizes[key]
        rise = (1 - a) * 18
        for key in ("lockup", "kicker", "glyph"):
            paste_layer(frame, p[key], ((W - p[key].width / S) / 2, pos[key] + rise), a)
        title_a = ease((age - 0.1) / 0.5)
        paste_layer(frame, p["title"], ((W - p["title"].width / S) / 2, pos["title"] + (1 - title_a) * 20), title_a)
        bar = 420 * ease((age - 0.25) / 0.6)
        D(frame).rounded_rectangle((W / 2 - bar / 2, pos["bar"], W / 2 + bar / 2, pos["bar"] + 6), radius=3, fill=self.accent)
        paste_layer(frame, p["sub"], (0, pos["sub"] - 24), ease((age - 0.45) / 0.5))
        paste_layer(frame, p["via"], (0, pos["via"]), ease((age - 0.6) / 0.5))
        return frame

    def outro_frame(self, age):
        th, info = self.th, self.t.outro
        frame = self.card_backdrop().copy()
        a = ease(age / 0.4)
        lock = fit_width(logo("lockup"), sc(640))
        url = "aethyr.gg/docs/tutorials/#%s" % info.get("id", "")

        def build():
            kface = F("display", 26, 600)
            ktext = "READ THE RITUAL"
            kw = int(kface.length(ktext, 5) * S) + sc(20)
            kicker = Image.new("RGBA", (kw, sc(44)), (0, 0, 0, 0))
            kface.draw(ImageDraw.Draw(kicker), (kw / 2, sc(22)), ktext, self.accent + (255,), "mm", track=5, px=True)
            uface = F("mono", 44, 500)
            uw = uface.length(url) + 90
            pill = Image.new("RGBA", sz(uw, 100), (0, 0, 0, 0))
            pd = D(pill)
            pd.rounded_rectangle((0, 0, uw - 0.5, 99.5), radius=16, fill=th.void2 + (int(255 * 0.92),), outline=self.accent + (200,), width=2)
            uface.draw(pd, (uw / 2, 50), url, th.ink + (255,), "mm")
            return kicker, pill

        kicker, pill = self.sprite(("outro", url), build)
        label = "%s  %s" % (self.t.intro.get("glyph", ""), self.t.intro.get("title", ""))
        lock_h, kick_h, pill_h = lock.height / S, kicker.height / S, pill.height / S
        total = lock_h + 56 + kick_h + 18 + pill_h + 46 + 44
        y = (H - total) / 2
        paste_layer(frame, lock, ((W - lock.width / S) / 2, y), a)
        y += lock_h + 56
        paste_layer(frame, kicker, ((W - kicker.width / S) / 2, y), ease((age - 0.2) / 0.4))
        y += kick_h + 18
        paste_layer(frame, pill, ((W - pill.width / S) / 2, y), ease((age - 0.3) / 0.4))
        y += pill_h + 46
        F("display", 36, 600).draw(D(frame), (W / 2, y + 22), label, mix(th.dim, th.void, ease((age - 0.5) / 0.4)), "mm")
        return frame

    # --- assembly ---------------------------------------------------------------------------------------------------------

    def play_frame(self, time):
        """The finished video's frame at `time` seconds: title card, then body, then end card."""
        blend = 0.5
        body_len = self.body_length()
        last = self.t.count / self.t.src_fps - 1 / self.t.src_fps
        black = Image.new("RGB", (OW, OH), (0, 0, 0))
        if time < INTRO_LEN:
            frame = self.intro_frame(time)
            if time < 0.35:
                frame = Image.blend(black, frame, ease(time / 0.35))
            if time > INTRO_LEN - blend:
                frame = Image.blend(frame, self.body_frame(0.0, v=0.0), ease((time - (INTRO_LEN - blend)) / blend))
        elif time < INTRO_LEN + body_len:
            frame = self.body_frame(min(self.recorded_time(time - INTRO_LEN), last), v=(time - INTRO_LEN) / SLOW)
        else:
            age = time - INTRO_LEN - body_len
            frame = self.outro_frame(age)
            if age < blend:
                frame = Image.blend(self.body_frame(last, pointer=False, v=1e6), frame, ease(age / blend))
            if age > OUTRO_LEN - 0.5:
                frame = Image.blend(frame, black, ease((age - (OUTRO_LEN - 0.5)) / 0.5))
        return frame

    def total_length(self):
        return INTRO_LEN + self.body_length() + OUTRO_LEN

    def render(self, out, poster=None, limit=None):
        # Written under a temporary name and renamed at the end, so an interrupted render never leaves a broken video behind.
        # Tuned for screen content: -tune animation keeps flat UI areas and fine text clean, CRF 20 keeps the edges.
        partial = out[:-4] + ".part.mp4"
        ff = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (OW, OH), "-r", str(FPS),
                               "-i", "-", "-c:v", "libx264", "-preset", "slow", "-tune", "animation", "-crf", "20", "-pix_fmt", "yuv420p",
                               "-movflags", "+faststart", partial], stdin=subprocess.PIPE)
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
        # The poster is the title card as it stands once the logo, title, bar and subtitle are all in. 1280x720, LANCZOS.
        self.intro_frame(1.4).resize((1280, 720), Image.LANCZOS).save(poster, quality=90)


def make(folder, theme_id=None, name=""):
    fetch_fonts()
    theme = Theme(theme_id)
    return Renderer(Timeline(folder, theme), theme, name or os.path.basename(os.path.normpath(folder)))


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
