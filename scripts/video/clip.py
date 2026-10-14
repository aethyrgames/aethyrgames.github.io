"""Cuts a short clip out of a recorded scene, for checking the chat animation:
    python scripts/video/clip.py <id> <start seconds> <length seconds> <out.mp4>
Times are seconds into the finished video."""
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render  # noqa: E402

rid, start, length, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
rd = render.make(str(render.REPO / ".video" / "raw" / rid), name=rid)
ff = subprocess.Popen([render.FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (render.OW, render.OH),
                       "-r", str(render.FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-tune", "animation", "-crf", "20",
                       "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
for k in range(int(length * render.FPS)):
    ff.stdin.write(rd.play_frame(start + k / render.FPS).tobytes())
ff.stdin.close()
ff.wait()
print("wrote", out)
