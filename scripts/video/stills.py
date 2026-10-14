"""Writes stills from a recorded scene for checking: python scripts/video/stills.py <id> [t1 t2 ...]  (seconds into the finished video)
Without times it writes one frame about every 4 seconds of the body. Output: .video/stills/<id>-<t>.png"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402

repo = render.REPO
rid = sys.argv[1]
rd = render.make(str(repo / ".video" / "raw" / rid), name=rid)
out = repo / ".video" / "stills"
out.mkdir(parents=True, exist_ok=True)
times = [float(t) for t in sys.argv[2:]]
if not times:
    t = render.INTRO_LEN + 1.0
    while t < rd.total_length() - 1:
        times.append(round(t, 1))
        t += 4.0
print("length %.1f s" % rd.total_length())
for t in times:
    rd.play_frame(t).save(out / ("%s-%05.1f.png" % (rid, t)))
    print("wrote", out / ("%s-%05.1f.png" % (rid, t)))
