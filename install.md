# Install or update Aethyr (for AI assistants)

This page is a plain-markdown playbook. If a user asked you to "get Aethyr from aethyr.gg", "install Aethyr", or "update Aethyr", follow it. It is written for Windows and an Unreal Engine 5.8 or later project.

Aethyr is an MCP server plus an Unreal editor plugin. It lets an AI assistant read and edit Blueprints and drive the live editor. The release zips are at <https://github.com/aethyrgames/aethyr-mcp-releases/releases>.

## Ground rules

- Work on one project at a time. Setup writes inside that project, plus the MCP client config files it lists in its summary (some of those live in the user's profile, like Claude Desktop's or Codex's).
- You don't need admin rights.
- Show the user the dry-run summary first and get one yes for the whole run. Don't ask again for each step it lists.
- Don't pipe anything into `iex`. Save the script, read it, then run it.

## Flow 1: "Get Aethyr from aethyr.gg" / "install Aethyr"

1. **Find the project.** Look for the `.uproject` in the current folder. If there isn't exactly one, ask the user which project. Note the folder that holds it.
2. **Fetch the bootstrap and read it.** Download `https://aethyr.gg/install.ps1` and save it as `<Project>/Saved/Aethyr/install.ps1`. For example, in PowerShell:

   ```powershell
   New-Item -ItemType Directory -Force "<Project>\Saved\Aethyr" | Out-Null
   Invoke-WebRequest -UseBasicParsing https://aethyr.gg/install.ps1 -OutFile "<Project>\Saved\Aethyr\install.ps1"
   ```

   Read the file. Tell the user what it does: it downloads the release zip from `github.com/aethyrgames/aethyr-mcp-releases`, checks the SHA256, extracts it into the project's `Saved/Aethyr/setup-staging/`, and runs the bundled `AethyrMcp.exe setup`.
3. **Preview.** This downloads and stages the zip, then runs setup with `--dry-run`. It changes nothing else:

   ```powershell
   powershell -ExecutionPolicy Bypass -File "<Project>\Saved\Aethyr\install.ps1" -Project "<Project>\My.uproject" -DryRun
   ```

   Show the user the summary. Ask once: "Go ahead with all of this?"
4. **Run it** after the yes. Same command without `-DryRun`.
5. **Act on the next steps** (below), then **verify** (below).

The script's parameters:

| Parameter | Meaning |
| --- | --- |
| `-Project <dir or .uproject>` | The project. Required, unless the current folder holds exactly one `.uproject`. |
| `-Release <tag>` | A release tag such as `v0.6.0`. Default is the latest. |
| `-Zip <path>` | Use a local release zip and skip the download. |
| `-DryRun` | Preview. Stages the zip, then runs setup with `--dry-run`. |
| `-SetupArgs '<string>'` | Extra `setup` flags as one quoted string, like `'--no-epic-mcp --deny StalePlugin'`. |

`-SetupArgs` can't carry a path with a space, and it refuses `--zip` and `--project` (use `-Zip` and `-Project`).

Setup's exit code passes through: 0 when setup succeeded, 1 when it refused or failed. The bootstrap also exits 1 when it refuses on its own. An exit code of 2 means a usage error, such as a mistyped flag in `-SetupArgs`. It also shows up when the staged exe predates `setup` (older than 0.6.0), so the command wasn't recognized.

Each run stages into `Saved/Aethyr/setup-staging/<timestamp>-<pid>/`. The three newest folders are kept. A local zip passed with `-Zip` is copied into staging and the original is never touched.

## Flow 2: "Update Aethyr"

1. **Check whether Aethyr's MCP tools respond.** Call `health_check`.
2. **If they do:**
   1. Call `apply_update` with no arguments. This only previews.
   2. Tell the user what it reported and ask for a yes.
   3. After the yes, call `apply_update` with `confirm:true`. It downloads the matching zip, verifies it against `SHA256SUMS`, and swaps it in once every MCP client using the current exe has closed. A failed health check on the new exe rolls back on its own.
   4. Then follow "Next steps" below.
   A Fab build has `health_check` but no `apply_update`. It updates through Fab, not here.
3. **If they don't** (old server, the server won't start, or no tools in this session): run Flow 1. The bootstrap detects the existing install and updates it. `setup` stops this project's own Aethyr servers by pid so the files can be replaced.

`apply_update` swaps the server exe. `setup` does a fuller job: it also mirrors the whole plugin folder, refreshes skills and client configs, and applies the Epic MCP settings. If the user wants those, or the update needs a new plugin build, prefer `setup`.

## What setup changes

- **The plugin folder** (`<Project>/Plugins/Aethyr`) is mirrored from the zip. Files the new release no longer has are removed.
- **`Plugins/Aethyr/Intermediate` is cleared**, so stale generated headers can't break the next build.
- **Client configs** (Claude Code `.mcp.json`, VS Code, Cursor, Codex, and so on) only get the `aethyr` key. Other servers and settings stay. A config that isn't valid JSON is refused and never overwritten. A `.bak` is kept.
- **Skills, agents, and the `AGENTS.md` section.** The Claude skills and agent go to the project's `.claude/`, and the Aethyr section goes into the project's `AGENTS.md` between `aethyr:start` and `aethyr:end`. `--no-skills` skips this.
- **Epic MCP is on by default.** Setup adds `ModelContextProtocol` and the `EditorToolset` plugin to the `.uproject` (each with `TargetAllowList: ["Editor"]`) and sets `bAutoStartServer=True` and `bEnableToolSearch=True` in `Config/DefaultEditorPerProjectUserSettings.ini`. This is what makes the Engine Toolset Bridge reachable. `--no-epic-mcp` skips all of it. If the user doesn't want their `.uproject` or config edited, pass `--epic-mcp=launch` instead. It edits no project file and writes a launcher script (see "Start the editor without editing the project" below).
- **Running servers.** This project's Aethyr processes are stopped by pid so the exe can be replaced. `--no-stop-servers` makes setup refuse instead.
- **Perforce.** Read-only files that setup needs to replace are made writable. They are not checked out and Perforce is not touched. The user reconciles them in P4V afterward.

## Next steps

Setup ends with a `next_steps` list. Do these in order, and tell the user about the ones that need them:

1. `build_editor`: run the command setup gives. It shows up for a source install, a custom engine, or a project with C++ modules.
2. `restart_clients`: close and reopen every MCP client so it launches the new server.
3. `restart_editor`: restart the Unreal Editor so it loads the plugins and Epic's MCP server.
   With `--epic-mcp=launch` you get `launch_editor` instead: start the editor through `Saved/Aethyr/Launch-Editor.bat` so Epic's MCP server is on for that session.
4. `approve_server`: in Claude Code, approve the new `aethyr` server when it asks.
5. `reconcile_scc`: Perforce users reconcile the files setup made writable.

## Verify

Once the client has restarted, call `health_check`. It should report the new `current_version` and no errors. If you can't reach the tools yet, run `<Project>/Plugins/Aethyr/Binaries/Win64/AethyrMcp.exe doctor`. It prints findings and writes nothing.

## Flags

These are `AethyrMcp.exe setup` flags. Pass them through the bootstrap with `-SetupArgs`.

| Flag | What it does |
| --- | --- |
| `--project <dir or .uproject>` | The project to set up. The bootstrap sets this for you. |
| `--zip <path>` | Install from this release zip and don't download. Setup uses it only when its flavor fits the engine. Otherwise it downloads and verifies the matching flavor of the same version and says so. The summary's `flavor` shows what was installed. |
| `--flavor auto\|precompiled\|source` | `auto` picks precompiled when `<Engine>/Engine/Build/InstalledBuild.txt` exists. |
| `--release <tag>` | Release to install. Default is the latest. |
| `--clients auto\|none\|<id>,...` | Which MCP clients to register. `auto` means every client with an existing config file or a detected CLI or app. |
| `--epic-mcp[=project\|launch\|off]` | How Epic's MCP gets turned on. `project` is the default, and a bare `--epic-mcp` means `project`. It edits the `.uproject` and the settings ini. `launch` edits no project file. It writes `Saved/Aethyr/Launch-Editor.bat` and adds a `launch_editor` next step. `off` skips the step. The last of the `--epic-mcp` and `--no-epic-mcp` flags wins. |
| `--no-epic-mcp` | Same as `--epic-mcp=off`. |
| `--private-epic-build` | Only with `--epic-mcp=launch`. The launcher builds private copies of Epic's plugins under `Saved/Aethyr/EpicMcp` and loads those, so a source engine's own plugin folders are never written to. |
| `--epic-toolsets core\|all\|none\|<Name>,...` | Which Epic toolset plugins to enable. Default `core`, which is `EditorToolset`. It applies in every `--epic-mcp` mode. |
| `--deny <Plugin>,...` | Append to the project plugin denylist (below). |
| `--no-skills` | Skip skills, agents, and the `AGENTS.md` section. |
| `--no-stop-servers` | Refuse instead of stopping this project's Aethyr processes. |
| `--dry-run` | Report every step as `dry_run`. No download, no write, no process stop. |
| `--json` | Print only the summary JSON on stdout. The bootstrap always sets this. |

## Start the editor without editing the project

`setup --epic-mcp=launch` leaves the `.uproject` and the config files alone. Epic's `ModelContextProtocol` plugin and its server are switched on for one editor session through command line arguments. Setup writes `<Project>/Saved/Aethyr/Launch-Editor.bat`, which runs the launcher. You can run it yourself too:

```
<Project>/Plugins/Aethyr/Binaries/Win64/AethyrMcp.exe launch-editor --project <Project> [--epic-toolsets core|all|none|<Name>,...] [--no-epic-mcp] [--build] [--private-epic-build] [--dry-run] [-- <extra editor args>]
```

It starts `UnrealEditor.exe` detached, so the command returns right away. Everything after a bare `--` goes to the editor, for example `-RenderOffScreen -unattended -nosplash`. `--dry-run` prints the command and starts nothing. It prints JSON with `ok`, `pid`, `command`, `engine` and `mcp_binaries`.

Before it starts the editor it checks that Epic's plugin binaries exist and were built for this engine, by comparing the `BuildId` in each plugin's `UnrealEditor.modules` with the engine's. `mcp_binaries` is `present`, `built_now`, `missing`, `stale` or `not_checked`.

- **Installed engine (Launcher build).** It ships the binaries, so launch arguments are enough. If they are missing or stale the launcher refuses and says why.
- **Source engine.** The launcher refuses with the exact build command, the project's editor target plus `-BuildPlugin=ModelContextProtocol+<toolsets>`. `--build` runs it. That writes build output into the engine's plugin folders. Setup adds the same argument to its `build_editor` command on a source engine.
- **Source engine, plugin folders left clean (`--private-epic-build`).** The launcher copies Epic's plugins (source only) to a private folder and raises each copy's `Version` above the engine's so it wins. It also copies any dependency the engine hasn't built, such as `ToolsetRegistry`, so `BuildPlugin` doesn't compile it into the engine's plugin folders. It builds each copy with `RunUAT BuildPlugin`, dependencies first, and launches with `-PLUGIN=` pointing at the builds. The first build takes about 3 minutes per plugin. Later launches reuse it until the engine's BuildId changes. By default the copies live in `<Project>/Saved/Aethyr/EpicMcp`. BuildPlugin makes very long paths and Unreal Build Tool refuses anything over 260 characters, so a deep project path moves the build to `%LOCALAPPDATA%\AeMcp` on its own, shared by every project on that engine. `AETHYR_EPIC_PRIVATE_DIR` sets the folder yourself, and a folder inside the engine is refused. Nothing under `Engine/Plugins` is written. `RunUAT` still keeps its own logs under `Engine/Programs/AutomationTool/Saved`. After launching it waits up to a minute for the editor's log to say which copy it mounted.

`Launch-Editor.bat` uses paths relative to itself, so non-ASCII project paths are fine, and everything typed after its name goes to the editor. The editor module also starts Epic's server on its own when the module is loaded and nothing has. `AETHYR_EPIC_AUTOSTART=0` in the editor's environment turns that off.

`doctor` and `health_check` report the same check as `epic_mcp_binaries` (`present`, `missing`, `stale`, or `private_present` when a current private build exists).

## Plugin denylist

Some projects enable a plugin the headless editor can't load, such as a marketplace plugin built for another engine. Aethyr can leave named plugins out of its headless launch. The list lives in either place, and the server uses both:

- the `AETHYR_PLUGIN_DENYLIST` environment variable
- `Config/DefaultAethyr.ini` in the project:

  ```ini
  [Aethyr]
  PluginDenylist=StalePlugin,SomeOtherPlugin
  ```

Names are comma-separated and case-insensitive. Plugins that depend on a listed one are added automatically. It applies to the headless launch only and never edits the `.uproject`. `doctor` and `health_check` say whether each entry came from `env` or `ini`. `--deny` writes the ini for you.

## When setup refuses

Setup stops with a `refused.code` instead of guessing. Report the message to the user.

| Code | What to do |
| --- | --- |
| `fab_install` | Aethyr came from Fab. Setup refuses when the engine has a Fab copy under `Engine/Plugins/Marketplace` or the project's copy is a Fab package. **Update through Fab** (the Epic Games Launcher), because a GitHub zip would replace the binaries Fab ships. |
| `project_not_found` | Check the path. Pass the `.uproject` or its folder. |
| `engine_not_found` | Setup couldn't find the engine. Open the project once in the editor, or set `AETHYR_ENGINE_DIR` to the engine root. |
| `editor_running` | Ask the user to close the Unreal Editor for this project, then run it again. |
| `aethyr_source_checkout` | The folder is the maintainers' source repo. Setup won't overwrite it. |
| `download_failed` | Check the network, or download the zip by hand and use `-Zip`. Put the release's `SHA256SUMS` beside the zip so it gets verified. Without it the bootstrap warns that verification was skipped. |
| `checksum_mismatch` | The zip doesn't match `SHA256SUMS`. Don't use it. Download again. |
| `locked_files` | Something holds files in the plugin folder open. Close it and retry. |
| `servers_running` | Only with `--no-stop-servers`. Close the project's Aethyr servers, or drop the flag. |
| `internal_error` | Setup hit an unexpected error. The message says where. Run with `-DryRun` to see how far it gets, then report it. |

The bootstrap itself also refuses when it can't find the project or the checksum doesn't match, and it stops before it changes anything.

## Manual fallback

If you can't run PowerShell scripts, download `Aethyr-plugin-precompiled.zip` and `SHA256SUMS` from the latest release, check the hash, extract the zip, and run `Aethyr\Binaries\Win64\AethyrMcp.exe setup --project <Project> --zip <path to the zip>`. The manual install steps are at <https://aethyr.gg/download/>.

Releases before 0.6.0 have no `setup` command. The bootstrap says "setup subcommand not found" if you point it at one with `-Release`.
