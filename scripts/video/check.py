"""Checks the rendered videos: prints duration, size and bitrate, extracts one mid frame per video, and writes contact sheets.
    python scripts/video/check.py        -> .video/check/mid-NN-<id>.png, sheet-posters.png, sheet-mid-1.png, sheet-mid-2.png"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402

render.selftest()  # wrapped chat lines type strictly in order, and the typing schedule is seeded and monotonic
print("selftest ok")

repo = Path(__file__).resolve().parents[2]
vids = repo / "video" / "tutorials"
out = repo / ".video" / "check"
out.mkdir(parents=True, exist_ok=True)
FF = r"C:\ffmpeg\bin"


def probe(path):
    r = subprocess.run([FF + r"\ffprobe", "-v", "error", "-show_entries", "format=duration,size,bit_rate:stream=width,height", "-of", "json", str(path)],
                       capture_output=True, text=True)
    d = json.loads(r.stdout)
    return float(d["format"]["duration"]), int(d["format"]["size"]), int(d["format"]["bit_rate"]), d["streams"][0]["width"], d["streams"][0]["height"]


files = sorted(vids.glob("*.mp4"))
mids, posters = [], []
total = 0
for f in files:
    dur, size, br, w, h = probe(f)
    total += size
    mid = out / ("mid-" + f.stem + ".png")
    # A frame about 45 percent in lands in the body for every video (the title card is 3.2 s, the end card 4.5 s).
    at = max(4.0, min(dur - 6.0, dur * 0.45))
    subprocess.run([FF + r"\ffmpeg", "-loglevel", "error", "-y", "-ss", "%.2f" % at, "-i", str(f), "-frames:v", "1", str(mid)], check=True)
    mids.append((f.stem, mid))
    posters.append((f.stem, f.with_suffix(".jpg")))
    print("%-24s %5.1f s  %5.2f MB  %4d kbps  %dx%d  mid@%.1fs" % (f.stem, dur, size / 1e6, br / 1000, w, h, at))
print("total %.1f MB for %d videos" % (total / 1e6, len(files)))


def sheet(items, name, cols, cw):
    ch = cw * 9 // 16
    rows = (len(items) + cols - 1) // cols
    img = Image.new("RGB", (cols * cw + (cols + 1) * 8, rows * ch + (rows + 1) * 8), (6, 8, 12))
    for i, (_, p) in enumerate(items):
        im = Image.open(p).convert("RGB").resize((cw, ch), Image.LANCZOS)
        img.paste(im, (8 + (i % cols) * (cw + 8), 8 + (i // cols) * (ch + 8)))
    img.save(out / name)


sheet(posters, "sheet-posters.png", 4, 480)
sheet(mids[:10], "sheet-mid-1.png", 2, 960)
sheet(mids[10:], "sheet-mid-2.png", 2, 960)
