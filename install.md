# Install, update or uninstall Aethyr (for AI assistants)

This page is a plain-markdown playbook. If a user asked you to "get Aethyr from aethyr.gg", "install Aethyr", "update Aethyr" or "uninstall Aethyr", follow it. It's written for Windows and an Unreal Engine 5.8 or later project.

Aethyr is an MCP server plus an Unreal editor plugin. It lets an AI assistant read and edit Blueprints and drive the live editor. The release zips are at <https://github.com/aethyrgames/aethyr-mcp-releases/releases>.

## How to use this page

Do the steps of one flow in order, one step at a time. Each step says what to run, what to look for in the output, and which step comes next. Don't skip a step, don't add steps, and don't change a command except to put the user's project folder where it says `<Project>`. `<Project>` is the folder that holds the `.uproject` file, for example `C:\Work\MyGame`. If a step's output matches none of its cases, stop and show the user the output.

The sections after the flows are reference. You only need them when a step sends you there.

## Rules for every flow

IMPORTANT: Ignore Perforce completely. Never run `p4` or any `p4` command (`p4 edit`, `p4 add`, `p4 delete`, `p4 reconcile`, `p4 revert`, `p4 opened`, `p4 info`, `p4 login`, `p4 set` or any other). Never check whether the project uses Perforce, never wait on it, and never ask the user about it before or during a flow. Aethyr's commands make read-only files writable on their own and never talk to Perforce. The only Perforce step is the last one, where you pass one sentence to the user.

- Work on one project at a time.
- Don't run a content commandlet (ResavePackages, FixupRedirects, Cook and the like).
- Don't edit the `.uproject`, any `Config/*.ini`, `Source/`, another plugin, the engine, `AGENTS.md`, `.vscode/`, `.cursor/`, `.codex/` or `.gemini/` yourself. Aethyr's commands change only what's listed in "What setup changes".
- Never start, restart or close an Unreal Editor yourself. Ask the user to do it.
- You don't need admin rights.
- Don't pipe anything into `iex`. Save the script, read it, then run it.
- A user who asks you to install Aethyr wants full read and write access. Don't add `--read-only` unless they ask for a read-only install.

## Flow 1: install Aethyr

Use this when the user says "get Aethyr from aethyr.gg" or "install Aethyr".

1. **Find the project.** Run:

   ```powershell
   Get-ChildItem -Filter *.uproject -File
   ```

   - Exactly one file listed: `<Project>` is the current folder. Go to step 2.
   - No file, or more than one: ask the user "Which Unreal project should I install Aethyr into? Please give me the folder that holds the .uproject file." Use their answer as `<Project>`. Go to step 2.

2. **Download the bootstrap script.** Run:

   ```powershell
   New-Item -ItemType Directory -Force "<Project>\Saved\Aethyr" | Out-Null
   Invoke-WebRequest -UseBasicParsing https://aethyr.gg/install.ps1 -OutFile "<Project>\Saved\Aethyr\install.ps1"
   ```

   - No error: go to step 3.
   - An error: show it to the user and stop.

3. **Read the script.** Open `<Project>\Saved\Aethyr\install.ps1` and read it. Then tell the user: "This script downloads the Aethyr release zip from github.com/aethyrgames/aethyr-mcp-releases, checks its SHA256, unpacks it into the project's Saved folder and runs Aethyr's own setup command." Go to step 4.

4. **Preview.** Run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File "<Project>\Saved\Aethyr\install.ps1" -Project "<Project>" -DryRun
   ```

   Find the line that starts with `[Aethyr/install] Setup finished:`.
   - It says `ok`: go to step 5.
   - It says `NOT ok`: find the line that starts with `[Aethyr/install] Refused (`. The word in the brackets is the refusal code. Look it up in "When setup refuses", do what its row says, and stop.
   - There's no such line: show the user the last 20 lines of output and stop.

5. **Ask once.** Show the user the `Steps:` and `MCP clients:` lines from step 4. Then ask exactly: "Go ahead with all of this? And should I install the Aethyr skills for your AI tools too? (yes / no)"
   - They say yes to going ahead: go to step 6.
   - They say no to going ahead: stop. Nothing was installed.
   - Only an explicit no to the skills skips them. If they say no to the skills, add `-SetupArgs '--no-skills'` to the step 6 command. If they say yes, say nothing about skills, or the session has no human, leave it out.

6. **Install.** Run the step 4 command without `-DryRun`:

   ```powershell
   powershell -ExecutionPolicy Bypass -File "<Project>\Saved\Aethyr\install.ps1" -Project "<Project>"
   ```

   - `[Aethyr/install] Setup finished: ok`: go to step 7.
   - `NOT ok`: look up the refusal code in "When setup refuses", do what its row says, and stop.

7. **Do the next steps.** Find the `Next steps:` list at the end of the output. Go through it in order. Each entry's id tells you what to do:

   | id | What you do |
   | --- | --- |
   | `build_editor` | Ask the user: "Aethyr needs one build of your editor. Can I run it? It takes a few minutes." On yes, run the command printed under it. If the build fails, show the user the first error and stop. Don't edit any file to fix a build. |
   | `restart_clients` | Tell the user: "Close and reopen your AI client so it loads Aethyr." |
   | `restart_editor` | Tell the user: "Restart the Unreal Editor if it's open." |
   | `launch_editor` | Tell the user: "Start the editor with `Saved\Aethyr\Launch-Editor.bat` in your project folder." |
   | `review_project_guidance` | Show the user the `project_guidance_leftovers` list from the output and say: "These were already in your project. Aethyr left them alone. You can keep or delete them." |
   | `reconcile_scc` | Tell the user: "If this project uses Perforce, reconcile the Plugins/Aethyr folder in P4V when you're ready." Do nothing else about it. |

   Then go to step 8.

8. **Tell the user you're done.** Say: "Aethyr is installed. After your AI client restarts, ask me to check Aethyr and I'll confirm it works." The flow ends here. In the next session, do "Verify" below.

## Flow 2: update Aethyr

Use this when the user says "update Aethyr".

1. **Check the tools.** Call Aethyr's `health_check` tool.
   - The tool doesn't exist in this session, or the call fails: do Flow 1 from step 1. It updates an existing install the same way.
   - It answers: go to step 2.
2. **Preview.** Call `apply_update` with no arguments.
   - It says there's no update: tell the user "You're already on the newest Aethyr." and stop.
   - The tool doesn't exist (a Fab build): tell the user "This copy came from Fab. Update it through the Epic Games Launcher." and stop.
   - It describes an update: go to step 3.
3. **Ask once.** Show the user what it reported and ask "Update now?".
   - Yes: go to step 4.
   - No: stop.
4. **Update.** Call `apply_update` with `confirm:true`. Then tell the user: "Close and reopen your AI client, and restart the Unreal Editor if it's open." The flow ends here.

`apply_update` swaps the server exe only. If the user also wants refreshed skills and client configs, or the update needs a new plugin build, do Flow 1 instead.

## Flow 3: uninstall Aethyr

Use this when the user says "uninstall Aethyr", or asks to remove or get rid of it. The same steps are in `Plugins/Aethyr/SETUP.md` inside the project, under "Uninstall Aethyr". Follow the steps in order. Do each step exactly as written. Do not improvise, and do not delete anything by hand.

`<Project>` below is the folder that holds the project's `.uproject` file. Fill it in with that folder's full path. Nothing else in the commands changes.

**Step 1. Check that Aethyr is installed.** Run:

```powershell
Test-Path "<Project>\Plugins\Aethyr\Binaries\Win64\AethyrMcp.exe"
```

- `True`: go to step 2.
- `False`: say "Aethyr is not installed in this project, so there is nothing to remove." and stop.

**Step 2. Preview.** Run this command. It changes nothing.

```
<Project>/Plugins/Aethyr/Binaries/Win64/AethyrMcp.exe uninstall --project <Project> --dry-run --json
```

Read the JSON it prints. Find the line `"refused"`.

- If the output starts with `aethyr-mcp: unknown argument 'uninstall'`, this copy of Aethyr is older than the `uninstall` command. Do Flow 1 to update it, then start this flow again from step 1.
- If `"refused"` is `null`, go to step 4.
- If `"refused"` has a `"code"` of `editor_running` or `plugin_locked`, go to step 3.
- If it has any other `"code"`, tell the user the `"message"` text exactly as printed, and stop.

**Step 3. The editor is open.** The Unreal Editor holds Aethyr's files, so nothing can be removed yet. Nothing has been changed. Say this to the user, word for word:

> The Unreal Editor is open on this project, and it has Aethyr loaded. Please save your work and close the editor, then tell me when it is closed. I will not close it for you.

Wait for the user to say the editor is closed. Then go back to step 2. Do not close the editor yourself. Do not kill any process.

**Step 4. Show the plan and ask once.** From the preview JSON, list every item in `"steps"` whose `"status"` is not `not_present`. Write one line each: the step `"id"`, a colon, then its `"detail"`. If `"warnings"` has any entries, add each `"message"` under the list. Then ask the user, word for word:

> This will remove Aethyr from this project. The list above is everything it will change. It leaves your other MCP servers, your other skills, your project files and your engine alone. Remove it now? (yes or no)

- If the user says yes, go to step 5.
- If the user says anything else, say "Okay, nothing was changed." and stop.

**Step 5. Run it.** Run this command. It is the same as step 2 without `--dry-run`.

```
<Project>/Plugins/Aethyr/Binaries/Win64/AethyrMcp.exe uninstall --project <Project> --json
```

Read the JSON it prints. Find the line `"ok"`.

- If `"ok"` is `true`, go to step 6.
- If `"ok"` is `false` and `"refused"` is not `null`, go back to step 3 when its `"code"` is `editor_running` or `plugin_locked`. Otherwise tell the user the `"message"` text and stop.
- If `"ok"` is `false` and `"refused"` is `null`, list each item in `"steps"` whose `"status"` is `failed` (its `"id"` and `"detail"`), tell the user those are the parts that did not finish, and stop. Do not fix them by hand. Running the command again finishes what is left.

**Step 6. Do the next steps.** Look at `"next_steps"` in the JSON. For each entry, find its `"id"` below and do only what it says.

- `restart_clients`: tell the user to quit and reopen every AI tool that used this project.
- `restart_editor`: tell the user to restart the Unreal Editor if it is open.
- `close_editor_first`: go to step 3.
- `confirm_plugin_removed`: the plugin folder is deleted in the background right after the command exits. Wait 10 seconds. Then check whether the folder `<Project>/Plugins/Aethyr` exists. If it is gone, go on. If it still exists, tell the user "The Aethyr folder is still there. Close anything that uses the project, then delete the folder `<Project>/Plugins/Aethyr` yourself." and go on.
- `reconcile_scc`: say this one sentence to the user, and nothing else about it: "Some removed files may need reconciling in your Perforce client." Do not run any `p4` command, whatever the entry says.

When every entry is done, go to step 7.

**Step 7. Tell the user.** Say this, with the brackets filled in. Include a line only when it is true.

> Aethyr is removed from [project name].
> - Removed: [the `"id"` of each step whose `"status"` is `done` or `scheduled`, in one line].
> - Kept because you changed it: [each item with status `kept_user_modified`, or leave this line out].
> - Next: [each next step you were told to pass on, in one line].
> To put Aethyr back later, ask me to install it again.

Stop here. Do not run any other command.

Options, only when the user asks for them by name:

- `--keep-plugin` removes everything except `<Project>/Plugins/Aethyr`. Add it to both commands.
- `--clients <id>,<id>` limits which AI tools it cleans up. The default `auto` looks at all of them and touches only files that hold Aethyr's own entry.

What `uninstall` removes is exactly what `setup` wrote, and nothing else: the project's `aethyr` entry in `.mcp.json` and the same entry in user-level client configs that point at this project, the `mcp__aethyr` permission in `~/.claude/settings.json`, the Aethyr skills and agents that each `aethyr-managed-assets.json` lists (a copy the user changed is kept and reported as `kept_user_modified`), the Aethyr section between the `aethyr:start` and `aethyr:end` markers in the user-level instruction files, Aethyr's own section in `Config/DefaultAethyr.ini`, `Saved/Aethyr/`, and last `Plugins/Aethyr/`. The user-level items are shared by every project on the machine. Running `setup` in another project puts them back. It never touches the `.uproject`, `Source/`, other plugins, other MCP servers, other skills or agents, or the engine. A running exe cannot delete its own folder, so when you run the plugin's own `AethyrMcp.exe`, the plugin folder is deleted by a background process right after the command exits, and the step reports `scheduled`.

## Verify

Do this in the session after an install, once the client has restarted.

1. Call `health_check`.
   - It reports `current.healthy` true: go to step 2.
   - It reports errors, or the tool isn't there: run `<Project>\Plugins\Aethyr\Binaries\Win64\AethyrMcp.exe doctor` and show the user its findings. It writes nothing. Stop.
2. Tell the user: "The first call may start Aethyr's headless editor in the background. It has no window and exits after two minutes idle." Then call `find_asset` with a Blueprint name the user mentioned, or `BP` if they named none.
3. Report both results to the user separately: the health check, then the read.

## Script parameters

| Parameter | Meaning |
| --- | --- |
| `-Project <dir or .uproject>` | The project. Required, unless the current folder holds exactly one `.uproject`. |
| `-Release <tag>` | A release tag such as `v0.7.0-1435`. Default is the latest. |
| `-Zip <path>` | Use a local release zip and skip the download. |
| `-DryRun` | Preview. Stages the zip, then runs setup with `--dry-run`. |
| `-SetupArgs '<string>'` | Extra `setup` flags as one quoted string, like `'--no-epic-mcp --deny StalePlugin'`. |

`-SetupArgs` can't carry a path with a space, and it refuses `--zip` and `--project` (use `-Zip` and `-Project`).

Setup's exit code passes through: 0 when setup succeeded, 1 when it refused or failed. The bootstrap also exits 1 when it refuses on its own. An exit code of 2 means a usage error, such as a mistyped flag in `-SetupArgs`.

Each run stages into `Saved/Aethyr/setup-staging/<timestamp>-<pid>/`. The three newest folders are kept. A local zip passed with `-Zip` is copied into staging and the original is never touched.

The script always starts from the precompiled zip. Setup checks it against the engine and switches to the source zip of the same release on its own when the engine is a source or custom build. On a source or custom engine, expect a `build_editor` next step.

## What setup changes

- **The plugin folder** (`<Project>/Plugins/Aethyr`) is mirrored from the zip. Files the release doesn't contain are deleted.
- **`Plugins/Aethyr/Intermediate` is cleared**, so stale generated headers can't break the next build.
- **MCP client configs, in the project for three clients and in the user's profile for the rest.** For Claude Code, Copilot CLI and VS Code Copilot, setup writes the `aethyr` entry into `<Project>/.mcp.json` (key `mcpServers`), so one entry serves all three. Its `command` is the project-relative path `./Plugins/Aethyr/Binaries/Win64/AethyrMcp.exe` and its one argument, `--serve-installed-project`, makes the server serve the project that holds the exe. The file carries no absolute path, engine folder or user name. Setup writes no `.vscode/mcp.json`. The other clients, and these three with `--user-scope`, get their entry in the user's profile, for the clients the user has. In user scope Claude Code uses `claude mcp add --scope user` when `claude` is on PATH, and otherwise the `mcpServers` key of `~/.claude.json`. The user-scope files are Copilot CLI (`~/.copilot/mcp-config.json`), Cursor (`~/.cursor/mcp.json`), Codex (`~/.codex/config.toml`), Gemini CLI (`~/.gemini/settings.json`), Claude Desktop, Windsurf, and VS Code's user `mcp.json`. Only the `aethyr` key changes. Other servers and settings stay. A config that isn't valid JSON is refused and never overwritten. A user file keeps a `.bak`, and the project file gets none. A new user-scope entry doesn't pin `AETHYR_PROJECT`. One entry serves every project: it follows whichever project the client is opened in. With no `AETHYR_PROJECT` (and no `AETHYR_PLUGIN_DIR`) the server looks for a `.uproject` in its working directory and the folders above it first, and uses that project and its engine. `health_check` and `doctor` report which source won as `project_source`: `env` (`AETHYR_PROJECT`), `installed` (a project entry's `--serve-installed-project`, the project that holds the exe), `cwd` (the working directory), `cwd_child` (the only `.uproject` one level below it, used only when it has Aethyr installed and no `.uproject` is in the working directory or above it) or `exe` (command-line subcommands, and a pinned `AETHYR_PLUGIN_DIR`). A working-directory project with no `Plugins/Aethyr` is still used, and `health_check` warns "This project doesn't have Aethyr installed. Run setup for it." If there is no `.uproject` there and nothing is pinned, the server still starts and lists its tools, but puts "no Unreal project in <folder>. Open your AI client in the project folder, or set AETHYR_PROJECT." in its initialize instructions and answers every tool call with it (`health_check` included, which reports `project_source: none`) It never falls back to the project that owns the exe, because Aethyr's tools run without a prompt and an agent opened in an unrelated repo could otherwise write that project's assets. (Command-line subcommands like `doctor` still use the exe's project.) `health_check` and `doctor` also warn "this project has Aethyr X, the server is Y. Run setup in this project." when the project's `Plugins/Aethyr` is a different version than the running server. Each project gets its own hub, keyed by the resolved project. Terminal clients (Claude Code, Copilot CLI, Gemini CLI, Codex CLI) start the server in the folder you launched them from. VS Code's MCP configuration reference lists a `cwd` field for stdio servers that defaults to the workspace folder, but it doesn't say what a user-scope entry with no workspace of its own gets, and Cursor doesn't document where it starts servers. So setup pins `AETHYR_PROJECT` to the current project in a new Cursor entry and in a VS Code user-scope entry. That entry serves that one project. Setup run in another project leaves a pin to a different project alone and reports it, and `setup --clients vscode` (or `--clients cursor`) there re-pins it. Claude Desktop and Windsurf don't document it either, so pin `AETHYR_PROJECT` in those entries yourself. A pinned `AETHYR_ENGINE_DIR` applies to every project, so setup writes it only when the server can't find the engine on its own. An existing pin to this project stays, and a pin to another project is left alone and reported.
- **Full access.** Setup removes `AETHYR_READ_ONLY` (reported as "writes enabled (was read-only)") and any env that narrows Aethyr's tools (`AETHYR_TOOLS`, `AETHYR_TOOLS_EXCLUDE`, `AETHYR_TOOL_ALLOW`, `AETHYR_TOOL_BLOCK`) from Aethyr's client entries. `AETHYR_PLUGIN_DENYLIST` stays, since it's crash protection and not access. Claude Code gets `"mcp__aethyr"` added to `permissions.allow` in `~/.claude/settings.json` (a JSON merge with a `.bak`, touching only that key), Gemini CLI entries get `"trust": true`, and Copilot CLI entries carry `"tools": ["*"]`, which lists every Aethyr tool as enabled but isn't confirmed to skip its approval prompts. The other clients have no documented per-server approval setting, so setup leaves their prompts alone and says so. `--read-only` keeps or sets `AETHYR_READ_ONLY=1` and grants none of this.
- **Skills, agents, and guidance.** Setup installs the `aethyr-*` skills, the read-only `aethyr-bp-audit` agent and a short guidance section for the AI clients you use: the ones named with `--clients`, otherwise the ones it detects. Claude Code, Copilot CLI and VS Code Copilot all read `<Project>/.claude/skills`, so their skills go to `<Project>/.claude/skills/aethyr-*`. The agent goes to `<Project>/.claude/agents` for Claude Code and `<Project>/.github/agents` for Copilot CLI. In user scope (Codex, Gemini CLI, Cursor, Windsurf, and the three clients above with `--user-scope`) skills go to `~/.agents/skills`, and to `~/.claude/skills` for Claude Code. The user-scope agent goes to `~/.claude/agents`, `~/.copilot/agents` and `~/.gemini/agents`. Setup adds a read-only `tools` line to the agent copies for Claude Code, Copilot CLI and Gemini CLI, each in that client's own tool names. Copilot CLI gets `["aethyr/*", "read", "search"]`, and Gemini CLI gets `mcp_aethyr_*`, `read_file`, `grep_search`, `glob` and `list_directory`. Codex has no agent, since it wants a different format. The guidance section (between `aethyr:start` and `aethyr:end`) is merged into `~/.copilot/copilot-instructions.md`, `~/.codex/AGENTS.md` and `~/.gemini/GEMINI.md`, appended when the file has no markers. Each folder Aethyr writes keeps an `aethyr-managed-assets.json` list, so a later run removes only what Aethyr put there. It also records a content hash per managed skill and agent. A copy you changed is left alone and reported as `user_modified`, and an unreadable copy is reported as `unreadable`. Setup creates `~/.agents/skills` when a client that reads it is selected, but never creates a client's own folder such as `~/.copilot`. `--no-skills` skips the skills and the agent, and `--no-guidance` skips the guidance section. Setup writes no project `AGENTS.md` or `.github/copilot-instructions.md`, so don't add them. Skills, agents, guidance or client entries in the project that setup doesn't manage are left alone. Setup lists them as `project_guidance_leftovers`, and the user can delete them.
- **Epic MCP is set up, with no project edit.** Aethyr's editor module switches on `ModelContextProtocol` and every Epic toolset whose own plugins are already on, once the editor has started, then starts Epic's server. When Epic's binaries are present or will be built, the step reports `active_via_plugin_dependency` (a C++ project, or a source install after its `build_editor` step) or `active_via_runtime_mount` (a Blueprint-only project using the precompiled zip), writes nothing, and adds a `restart_editor` next step. When the binaries are missing or stale, it reports `needs_launcher`, writes `Saved/Aethyr/Launch-Editor.bat` and adds a `launch_editor` next step. `--no-epic-mcp` skips the step, and `--epic-mcp=launch` forces the launcher (see "Start the editor with Epic's MCP on" below).
- **Running servers.** This project's Aethyr processes are stopped by pid so the exe can be replaced. `--no-stop-servers` makes setup refuse instead.
- **Perforce.** Read-only files that setup needs to replace are made writable. They are not checked out and Perforce is not touched. The user reconciles them in P4V afterward. A file another workspace has opened, for example as an exclusive add, can't be written. Setup then stops with `locked_files` (see "When setup refuses").
- **Engine floor.** Setup lists non-fatal heads-ups in a top-level `warnings` array, each `{code, message}`, in a dry run too. `engine_below_floor` means the engine is older than 5.8, which Aethyr can't compile against. Setup still goes ahead, and `doctor` reports the same engine as an error. Tell the user. The word `warnings` has other shapes elsewhere: `doctor.warnings` in setup's output is a count, the `warnings` on the `skills` and `denylist` steps and in `launch-editor` are arrays of strings, and only the top-level setup array holds `{code, message}` objects. Check whether a value is a number, an array of strings or an array of objects before you read `code` or `message`.

## Flags

These are `AethyrMcp.exe setup` flags. Pass them through the bootstrap with `-SetupArgs`.

| Flag | What it does |
| --- | --- |
| `--project <dir or .uproject>` | The project to set up. The bootstrap sets this for you. |
| `--zip <path>` | Install from this release zip and don't download. Setup uses it only when its flavor fits the engine. Otherwise it downloads and verifies the matching flavor of the same version and says so. The summary's `flavor` shows what was installed. |
| `--flavor auto\|precompiled\|source` | `auto` picks precompiled when `<Engine>/Engine/Build/InstalledBuild.txt` exists, then checks the zip's BuildId against the engine and steers to the source zip on a mismatch. `--flavor precompiled` on a mismatched engine stops with `buildid_mismatch`. |
| `--release <tag>` | Release to install. Default is the latest. |
| `--clients auto\|none\|<id>,...` | Which AI clients to set up: the MCP entry and the skills and agent (in the project for Claude Code, Copilot CLI and VS Code Copilot, otherwise in the client's user-scope folders), plus the guidance (always user scope). `auto` means every client with an existing user config file or a detected CLI, app or folder. |
| `--user-scope` | Write the Claude Code, Copilot CLI and VS Code Copilot entries, skills and agent to their user-scope config files and folders. Nothing goes to `<Project>/.mcp.json`, `<Project>/.claude` or `<Project>/.github`. |
| `--read-only` | Opt in to a read-only install. Keeps or sets `AETHYR_READ_ONLY=1` in Aethyr's client entries and grants no tool permissions. Without it, setup gives full access. |
| `--epic-mcp[=on\|launch\|off]` | How Epic's MCP gets set up. `on` is the default, and a bare `--epic-mcp` means `on`. It leaves Epic's MCP to `Aethyr.uplugin`'s optional dependency and the editor module's mount, and writes `Saved/Aethyr/Launch-Editor.bat` only when Epic's binaries are missing or stale. `launch` always writes that script and adds a `launch_editor` next step. `off` skips the step. The last of the `--epic-mcp` and `--no-epic-mcp` flags wins. The old `--epic-mcp=project` is gone, since setup no longer edits the `.uproject`. |
| `--no-epic-mcp` | Same as `--epic-mcp=off`. |
| `--private-epic-build` | Only with `--epic-mcp=launch`. The launcher builds private copies of Epic's plugins under `Saved/Aethyr/EpicMcp` and loads those, so a source engine's own plugin folders are never written to. |
| `--epic-toolsets core\|all\|none\|<Name>,...` | Which Epic toolset plugins the launcher enables. Default `core`, which is `EditorToolset`. |
| `--deny <Plugin>,...` | Append to the plugin denylist in `Config/DefaultAethyr.ini` (below). It is the only flag that makes setup write into `Config/`. |
| `--no-skills` | Skip the skills and the agent. Only pass it when the user explicitly says no. |
| `--no-guidance` | Skip the guidance section in the clients' global instruction files. |
| `--no-stop-servers` | Refuse instead of stopping this project's Aethyr processes. |
| `--dry-run` | Report every step as `dry_run`. No download, no write, no process stop. |
| `--json` | Print only the summary JSON on stdout. The bootstrap always sets this. |

## Start the editor with Epic's MCP on

You rarely need this. Epic's MCP comes up on a normal editor launch. Setup never edits the `.uproject` or the config files. Where Epic's plugin binaries are missing or stale for the engine, or when you pass `--epic-mcp=launch`, Epic's `ModelContextProtocol` plugin and its server are switched on for one editor session through command line arguments. Setup writes `<Project>/Saved/Aethyr/Launch-Editor.bat`, which runs the launcher. You can run it yourself too:

```
<Project>/Plugins/Aethyr/Binaries/Win64/AethyrMcp.exe launch-editor --project <Project> [--epic-toolsets core|all|none|<Name>,...] [--no-epic-mcp] [--build] [--private-epic-build] [--dry-run] [-- <extra editor args>]
```

It starts `UnrealEditor.exe` detached, so the command returns right away. Everything after a bare `--` goes to the editor, for example `-RenderOffScreen -unattended -nosplash`. `--dry-run` prints the command and starts nothing. It prints JSON with `ok`, `pid`, `command`, `engine` and `mcp_binaries`.

Before it starts the editor it checks that Epic's plugin binaries exist and were built for this engine, by comparing the `BuildId` in each plugin's `UnrealEditor.modules` with the engine's. `mcp_binaries` is `present`, `built_now`, `missing`, `stale` or `not_checked`.

- **Installed engine (Launcher build).** It ships the binaries, so launch arguments are enough. If they are missing or stale the launcher refuses and says why.
- **Source engine.** The launcher refuses with the exact build command, the project's editor target plus `-BuildPlugin=ModelContextProtocol+<toolsets>`. The target is the class in `Source/*.Target.cs` that sets `Type = TargetType.Editor`, named without its `Target` suffix, whatever the project is called. A project with none builds `UnrealEditor` with `-Project=`. `--build` runs it. That writes build output into the engine's plugin folders. Setup adds the same argument to its `build_editor` command on a source engine.
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
| `editor_running` | Tell the user: "Please close the Unreal Editor for this project and tell me when it's closed." When they say it's closed, go back to the step that failed. |
| `aethyr_source_checkout` | The folder is the maintainers' source repo. Setup won't overwrite it. |
| `download_failed` | Show the user the message. If it says HTTP 403 or 429, GitHub refused the request (usually its hourly limit). Tell the user: "GitHub refused the download. Please download Aethyr-plugin-precompiled.zip and SHA256SUMS from github.com/aethyrgames/aethyr-mcp-releases/releases into one folder and tell me where." Then run step 4 again with `-Zip "<that folder>\Aethyr-plugin-precompiled.zip"` added. The script checks the zip against the SHA256SUMS beside it. |
| `checksum_mismatch` | The zip doesn't match `SHA256SUMS`. Don't use it. Download again. |
| `buildid_mismatch` | You asked for `--flavor precompiled`, and the zip's modules were built for another engine build than the user's. Nothing was written. Run setup with `--flavor source`, or leave `--flavor` off so setup picks the zip that fits. |
| `locked_files` | Something holds files in the plugin folder open, or a file is opened in another Perforce workspace. Setup only sees that the write failed, because it never runs `p4`. Tell the user: "Some Aethyr files are locked. Close the Unreal Editor and any tool using them, then tell me to try again." If the message prints a `p4 opened` command, show it to the user so they can run it. Don't run it yourself. When the user says to try again, go back to the step that failed. |
| `servers_running` | Most often this is `--no-stop-servers` with Aethyr processes still running for the project. Close them, or drop the flag. It also fires when setup can't read a process's command line or can't stop a pid. The message names the pid, so stop it yourself and run setup again. |
| `internal_error` | Setup hit an unexpected error. The message says where. Run with `-DryRun` to see how far it gets, then report it. |

The bootstrap itself also refuses when it can't find the project or the checksum doesn't match, and it stops before it changes anything.

## Editor configuration and BuildId mismatches

Aethyr starts the headless editor in `Development`, `DebugGame` or `Debug`. Leave `AETHYR_EDITOR_CONFIG` out of the client entry. With it unset, Aethyr reads the project's manifests (`UnrealEditor.modules`, `UnrealEditor-Win64-DebugGame.modules`, `UnrealEditor-Win64-Debug.modules`) and picks the first configuration whose BuildId matches the engine and whose Aethyr module is built, preferring Development. A project built only in DebugGame needs no setting. `launch-editor` and the `build_editor` step use the same choice, so a DebugGame project gets the DebugGame editor and a DebugGame build command. `doctor`, `config` and `health_check` (`editor_config`) show the configuration, whether it came from `env`, `auto` or `default`, and the manifest and BuildIds compared. Other configurations are listed as inactive, and only the active one's mismatch is an error.

If a launch fails with out-of-date modules or a BuildId mismatch, work down this order and stop at the first step that explains it:

1. Read the `editor configuration` line of `doctor`.
2. If another built configuration matches, unset `AETHYR_EDITOR_CONFIG` or set it to that one.
3. If `doctor` says the engine wasn't found, or names another installed engine that matches, set `AETHYR_ENGINE_DIR`.
4. Only then rebuild the editor target in the active configuration. `doctor` prints the command with the real target name.

## Manual fallback

If you can't run PowerShell scripts, download `Aethyr-plugin-precompiled.zip` and `SHA256SUMS` from the latest release, check the hash, extract the zip, and run `Aethyr\Binaries\Win64\AethyrMcp.exe setup --project <Project> --zip <path to the zip>`. The manual install steps are at <https://aethyr.gg/download/>.

The bootstrap needs a release that has the `setup` command. It says "setup subcommand not found" if you point `-Release` at one without it.
