"""Tiles .video/stills/<id>-*.png into one sheet: python scripts/video/montage.py <id> [cols] [cell_width]"""
import sys
from pathlib import Path

from PIL import Image

repo = Path(__file__).resolve().parents[2]
rid = sys.argv[1]
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3
cw = int(sys.argv[3]) if len(sys.argv) > 3 else 840
files = sorted((repo / ".video" / "stills").glob(rid + "-0*.png"))
ch = cw * 9 // 16
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cw + (cols + 1) * 8, rows * ch + (rows + 1) * 8), (6, 8, 12))
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((cw, ch), Image.LANCZOS)
    sheet.paste(im, (8 + (i % cols) * (cw + 8), 8 + (i // cols) * (ch + 8)))
out = repo / ".video" / "stills" / (rid + "-montage.png")
sheet.save(out)
print(out, len(files))
