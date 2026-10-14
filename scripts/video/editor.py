"""Drives the video host's editor over the engine's Python remote-execution bridge (Tether's EditorRemote/ShotVideo Editor class).

    python scripts/video/editor.py "print(unreal.ShotLibrary.windows())"
"""
import importlib.util
import sys
import time

CLIENT = r"D:\Games\Epic Games\UE_5.8\Engine\Plugins\Experimental\PythonScriptPlugin\Content\Python\remote_execution.py"


class Editor:
    def __init__(self, wait=15):
        spec = importlib.util.spec_from_file_location("remote_execution", CLIENT)
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.remote = self.module.RemoteExecution()
        self.remote.start()
        deadline = time.time() + wait
        while time.time() < deadline and not self.remote.remote_nodes:
            time.sleep(0.2)
        if not self.remote.remote_nodes:
            self.remote.stop()
            raise SystemExit("no editor answered on the remote-execution bridge")
        self.remote.open_command_connection(self.remote.remote_nodes[0]["node_id"])

    def py(self, code):
        result = self.remote.run_command(code, exec_mode=self.module.MODE_EXEC_FILE)
        if not result.get("success"):
            raise RuntimeError(result.get("result"))
        return result.get("result")

    def out(self, code):
        # The printed output of a statement, from the editor's log lines.
        result = self.remote.run_command(code, exec_mode=self.module.MODE_EXEC_FILE)
        if not result.get("success"):
            raise RuntimeError(result.get("result"))
        return "\n".join(entry.get("output", "") for entry in result.get("output", []))

    def close(self):
        self.remote.stop()


if __name__ == "__main__":
    ed = Editor()
    try:
        print(ed.out(" ".join(sys.argv[1:])))
    finally:
        ed.close()
