"""A small MCP client for the Ritual videos. Starts AethyrMcp.exe over stdio (newline-delimited JSON-RPC, protocol 2024-11-05
style) and makes real tool calls, so what the videos show comes from a real run.

    python scripts/video/mcp_client.py tools                 list the tools
    python scripts/video/mcp_client.py call health_check '{}' call one tool

The server is the exe the public release put into the host (.video/host/Plugins/Aethyr/Binaries/Win64), started with the
host project as its working directory so it resolves the host project.
"""
import json
import os
import subprocess
import sys
import threading
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
HOST = REPO / ".video" / "host"
EXE = HOST / "Plugins" / "Aethyr" / "Binaries" / "Win64" / "AethyrMcp.exe"


class McpError(RuntimeError):
    pass


class Mcp:
    def __init__(self, exe=EXE, cwd=HOST, env=None, log=None):
        full = dict(os.environ)
        full.update(env or {})
        self.log = open(log, "a", encoding="utf-8") if log else None
        self.proc = subprocess.Popen([str(exe)], cwd=str(cwd), env=full, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE, text=True, encoding="utf-8", bufsize=1)
        self.next_id = 1
        self.pending = {}
        self.lock = threading.Lock()
        threading.Thread(target=self._read, daemon=True).start()
        threading.Thread(target=self._drain, daemon=True).start()
        info = self.request("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                                           "clientInfo": {"name": "aethyr-video-recorder", "version": "1"}}, timeout=120)
        self.server = info.get("serverInfo", {})
        self.instructions = info.get("instructions", "")
        self.notify("notifications/initialized")

    def _read(self):
        for line in self.proc.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except ValueError:
                continue
            if self.log:
                self.log.write("<< " + line[:4000] + "\n")
            slot = self.pending.get(msg.get("id"))
            if slot is not None:
                slot["msg"] = msg
                slot["event"].set()

    def _drain(self):
        for line in self.proc.stderr:
            if self.log:
                self.log.write("!! " + line)

    def _send(self, payload):
        text = json.dumps(payload)
        if self.log:
            self.log.write(">> " + text[:4000] + "\n")
        self.proc.stdin.write(text + "\n")
        self.proc.stdin.flush()

    def notify(self, method, params=None):
        self._send({"jsonrpc": "2.0", "method": method, **({"params": params} if params is not None else {})})

    def request(self, method, params=None, timeout=300):
        with self.lock:
            rid = self.next_id
            self.next_id += 1
        slot = {"event": threading.Event(), "msg": None}
        self.pending[rid] = slot
        self._send({"jsonrpc": "2.0", "id": rid, "method": method, "params": params or {}})
        if not slot["event"].wait(timeout):
            raise McpError("timeout waiting for %s" % method)
        del self.pending[rid]
        msg = slot["msg"]
        if "error" in msg:
            raise McpError(json.dumps(msg["error"]))
        return msg["result"]

    def tools(self):
        return self.request("tools/list")["tools"]

    def call(self, name, arguments=None, timeout=600):
        """Calls a tool. Returns (parsed, text, is_error, ms). parsed is the JSON the tool returned when its text parses."""
        start = time.perf_counter()
        result = self.request("tools/call", {"name": name, "arguments": arguments or {}}, timeout=timeout)
        ms = int(round((time.perf_counter() - start) * 1000))
        text = "\n".join(part.get("text", "") for part in result.get("content", []) if part.get("type") == "text")
        parsed = result.get("structuredContent")
        if parsed is None:
            try:
                parsed = json.loads(text)
            except ValueError:
                parsed = None
        return parsed, text, bool(result.get("isError")), ms

    def close(self):
        try:
            self.proc.stdin.close()
        except Exception:
            pass
        try:
            self.proc.wait(timeout=10)
        except Exception:
            self.proc.kill()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    mcp = Mcp()
    try:
        if sys.argv[1] == "tools":
            for tool in mcp.tools():
                print(tool["name"])
        elif sys.argv[1] == "call":
            parsed, text, is_error, ms = mcp.call(sys.argv[2], json.loads(sys.argv[3]) if len(sys.argv) > 3 else {})
            print(("ERROR " if is_error else "") + "%d ms" % ms)
            print(text[:6000])
    finally:
        mcp.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
