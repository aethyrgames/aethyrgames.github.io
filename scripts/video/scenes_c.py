"""Rituals 13 to 19 (menu-typo, turret-bt, prove-live, lava-material, content-cleanup, who-broke-it, health-update)."""
import json

from sceneslib import *  # noqa: F401,F403
from record import Rect  # noqa: F401

HOST_SAVED = "D:/Projects/Aethyr/wt/site-videos/.video/host/Saved"


def quiet(r, name, args):
    """A real MCP call made as staging, off the record (no chat chip). It is still logged in calls.json."""
    listed = name in r.listed
    parsed, text, err, ms = r.mcp.call(name, args) if listed else r.mcp.call("call_tool", {"name": name, "arguments": args})
    r.calls.append({"name": name + " (staging)", "args": args, "ms": ms, "error": err, "text": text[:1500], "result": json.dumps(parsed)[:3000] if parsed is not None else None})
    if err:
        raise RuntimeError("staging call %s failed: %s" % (name, text[:300]))
    return parsed


def menu_typo(r):
    W = SAMPLES + "/UI/WBP_MainMenu"
    r.open_asset(W)
    r.hold(1.0)
    r.you(0)
    rw, _, _ = r.tool("read_widget_blueprint", {"asset_path": W}, result=lambda p, t: "%d widgets, root %s" % (len(p["nodes"]), p["root_name"]),
                      output=lambda p, t: ["%s (%s)  parent: %s" % (n["name"], n["class"], n["parent"] or "-") for n in p["nodes"]])
    r.caption("The widget tree, read without opening the designer.", step=1)
    r.hold(2.0)
    r.ai("Read WBP_MainMenu: the root is a CanvasPanel with a VerticalBox named ButtonColumn holding PlayButton, OptionsButton, and QuitButton. Each button has a TextBlock child. The one under PlayButton is named PlayLabel and it reads \"Strat Game\".")
    r.you(1)
    r.tool("set_widget_property", {"asset_path": W, "widget_name": "PlayLabel", "property_name": "Text", "value": "Start Game"},
           result=lambda p, t: "PlayLabel.Text: Strat Game -> Start Game", shown_args="PlayLabel.Text")
    r.tool("add_widget", {"asset_path": W, "widget_class": "TextBlock", "name": "DemoBadge", "parent_name": "CanvasPanel_0"},
           result=lambda p, t: "DemoBadge (TextBlock) added" if p["created"] else "already existed", shown_args="TextBlock DemoBadge")
    r.tool("set_widget_property", {"asset_path": W, "widget_name": "DemoBadge", "property_name": "Text", "value": "DEMO BUILD"},
           result=lambda p, t: "DemoBadge.Text set to DEMO BUILD", shown_args="DemoBadge.Text")
    r.tool("bind_widget_event", {"asset_path": W, "widget_name": "QuitButton", "event_name": "OnClicked", "handler_function": "HandleQuit"},
           result=lambda p, t: "QuitButton.OnClicked bound to HandleQuit" if p["bound"] else "not bound", shown_args="QuitButton.OnClicked")
    r.ai("Set Text on PlayLabel to \"Start Game\". Added a TextBlock named DemoBadge under the root and set its Text to \"DEMO BUILD\". Then I bound OnClicked on QuitButton to HandleQuit, creating the handler with the click event's signature.")
    r.you(2)
    r.tool("compile_widget_blueprint", {"asset_path": W}, result=lambda p, t: "compiled: %s" % str(p["compiled"]).lower())
    reopen(r, W)
    r.hold(1.5)
    r.caption("Typo fixed, badge added, handler bound, compiled.", step=2)
    r.hold(2.5)
    r.ai("Compiled: true. No errors. The typo is gone, the demo badge is in, and HandleQuit is waiting for its \"are you sure?\" popup. Go to bed.")


def turret_bt(r):
    B = SAMPLES + "/AI/BT_Enemy"
    r.open_asset(TURRET)
    r.hold(1.0)
    r.you(0)
    r.tool("summarize_blueprint", {"asset_path": TURRET}, result=lambda p, t: "BP_Turret: %d variables, %d function" % (p["variable_count"], p["function_count"]))
    r.tool("get_function", {"asset_path": TURRET, "function_name": "Fire"}, result=lambda p, t: "Fire: %d nodes" % len(p["graph"]["nodes"]))
    lv, _, _ = r.tool("list_variables", {"asset_path": TURRET}, result=lambda p, t: "FireRate = 0.0, Range = 1500, bCanFire = true",
                      output=lambda p, t: ["%s = %s" % (x["name"], x["default_value"]) for x in p["results"]])
    r.caption("FireRate defaults to 0.0, so Fire never prints.", step=1)
    r.highlight((rows_of(r, ["FireRate"])[0], "FireRate 0.0", "warm", "right"))
    r.hold(2.5)
    r.clear()
    r.ai("Read it. BeginPlay calls Fire, and Fire only prints its line when FireRate is above zero. FireRate defaults to 0.0, so the branch never passes. One very patient turret.")
    r.you(1)
    r.tool("set_variable_default", {"asset_path": TURRET, "name": "FireRate", "default_value": "2.0"}, result=lambda p, t: "FireRate default set to 2.0", shown_args="FireRate = 2.0")
    r.tool("list_behavior_trees", {}, result=lambda p, t: "%d behavior tree: %s" % (p["count"], p["results"][0]["name"]))
    bt, _, _ = r.tool("read_behavior_tree", {"asset_path": B}, result=lambda p, t: "BT_Enemy: %d nodes, %d blackboard keys" % (len(p["nodes"]), len(p["blackboard_keys"])),
                      output=lambda p, t: ["blackboard: " + p["blackboard_asset"].rsplit("/", 1)[-1]] + ["key %s (%s)" % (k["name"], k["key_type"]) for k in p["blackboard_keys"]])
    r.refresh()
    r.hold(1.0)
    keys = ", ".join("%s (%s)" % (k["name"], k["key_type"]) for k in bt["blackboard_keys"])
    r.ai("Set FireRate to 2.0. Found one behavior tree under /Game/AethyrSamples: BT_Enemy. Read it: no nodes yet, linked to the blackboard BB_Enemy, which has %d keys: %s." % (len(bt["blackboard_keys"]), keys))
    r.open_asset(B, "BT_Enemy")
    r.hold(1.0)
    r.you(2)
    root, _, _ = r.tool("add_bt_node", {"asset_path": B, "node_kind": "composite", "node_class": "BTComposite_Sequence"}, result=lambda p, t: "%s added as the root" % p["class"])
    w1, _, _ = r.tool("add_bt_node", {"asset_path": B, "node_kind": "task", "node_class": "BTTask_Wait", "parent_node_id": root["node_id"]}, result=lambda p, t: "%s added under the Sequence" % p["class"])
    w2, _, _ = r.tool("add_bt_node", {"asset_path": B, "node_kind": "task", "node_class": "BTTask_Wait", "parent_node_id": root["node_id"]}, result=lambda p, t: "second %s added" % p["class"])
    r.tool("set_bt_node_property", {"asset_path": B, "node_id": w1["node_id"], "property_name": "WaitTime", "value": "(DefaultValue=0.6,Key=\"\")"},
           result=lambda p, t: "WaitTime: 5.0 -> 0.6", shown_args="WaitTime (DefaultValue=0.6)")
    r.tool("set_bt_node_property", {"asset_path": B, "node_id": w2["node_id"], "property_name": "WaitTime", "value": "(DefaultValue=1.5,Key=\"\")"},
           result=lambda p, t: "WaitTime: 5.0 -> 1.5", shown_args="WaitTime (DefaultValue=1.5)")
    r.tool("compile_behavior_tree", {"asset_path": B}, result=lambda p, t: "compiled: %s" % str(p["compiled"]).lower())
    reopen(r, B, "BT_Enemy")
    r.hold(1.5)
    r.caption("A Sequence at the root with two Wait tasks under it.", step=2)
    r.hold(2.5)
    r.ai("Added a BTComposite_Sequence as the root, then two BTTask_Wait tasks under it. Set the first one's WaitTime to 0.6 and the second one's to 1.5. Then compiled the tree: true.")
    r.note("BT_Enemy's blackboard has four keys (SelfActor, TargetActor, HomeLocation, bCanSeePlayer); the Ritual says three. The real WaitTime is a struct, so the value is (DefaultValue=0.6,Key=\"\"), and a bare \"0.6\" fails to parse.")


def prove_live(r):
    TURRET_CLASS = SAMPLES + "/AI/BP_Turret.BP_Turret_C"
    # The main editor window, with the level viewport and the Outliner, is what this scene films.
    r.editor.py("sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)\nfor a in sub.get_all_level_actors():\n    if a.get_class().get_name() == 'BP_Turret_C':\n        sub.destroy_actor(a)")
    r.window = ""
    r.visual = True
    OPENED_NONE = None  # noqa: F841
    r.hold(1.0)
    r.you(0)
    hc, _, _ = r.tool("health_check", {}, result=lambda p, t: "%s, game thread responsive: %s" % (p["current"]["state"], str(p["game_thread_responsive"]).lower()),
                      output=lambda p, t: ["state: " + p["current"]["state"], "route: " + p["route"], "game_thread_responsive: %s" % str(p["game_thread_responsive"]).lower(),
                                           "engine: " + p["engine"]["version"], "current_version: " + p["current_version"]])
    r.ai("Probed it. State is %s, the game thread is responsive, and the route is %s. That check doesn't touch the game thread, so it would also have told us if the editor were paused on a breakpoint." % (hc["current"]["state"], "the live editor" if hc["route"] == "live" else hc["route"]))
    r.you(1)
    r.tool("spawn_actor", {"class_path": TURRET_CLASS, "location": {"x": 0, "y": 0, "z": 200}}, result=lambda p, t: "spawned %s" % p["actor_label"], shown_args="BP_Turret at (0, 0, 200)")
    r.tool("console_command", {"command": "slomo 0.25"}, result=lambda p, t: "slomo 0.25 sent, handled: %s" % str(p["handled"]).lower())
    r.refresh()
    r.hold(1.0)
    r.editor.py("sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)\n"
                "sub.set_selected_level_actors([a for a in sub.get_all_level_actors() if a.get_class().get_name() == 'BP_Turret_C'])")
    r.refresh()
    r.hold(1.2)
    hits = [x for x in r.find_all("BP_Turret", "") if x.w > 0 and x.h > 0 and x.kind in ("STextBlock", "SEditableText", "SEditableTextBox")]
    hits.sort(key=lambda x: (x.y, x.x))
    if hits:
        r.caption("The turret is in the level, selected in the Outliner.", step=1)
        r.highlight((hits[0].grow(14, 8, 60, 8), "BP_Turret", "c1", "left"))
    else:
        r.caption("The turret is in the level.", step=1)
    r.hold(2.5)
    r.clear()
    r.ai("Spawned /Game/AethyrSamples/AI/BP_Turret.BP_Turret_C at the spot you described. Then sent slomo 0.25 as a console command. The reply says handled: false in the editor world, so the engine didn't recognise it there. It's meant for a play session.")
    r.you(2)
    r.tool("epic_list_toolsets", {}, result=lambda p, t: "%d toolsets" % len(p["toolsets"]), output=lambda p, t: [x["name"] for x in p["toolsets"][:10]] + ["... %d more" % (len(p["toolsets"]) - 10)])
    r.tool("epic_describe_toolset", {"toolset": "EditorToolset.EditorAppToolset"}, result=lambda p, t: "EditorAppToolset: %d tools" % len(p["tools"]),
           output=lambda p, t: [x["name"].split(".")[-1] for x in p["tools"]][:12])
    r.tool("epic_call_tool", {"tool": "EditorToolset.EditorAppToolset.StartPIE", "arguments": {"options": {"bSimulate": False}}}, result=lambda p, t: "StartPIE returned", shown_args="StartPIE")
    ps, _, _ = r.tool("get_pie_state", {}, result=lambda p, t: "is_playing: %s, %d instance" % (str(p["is_playing"]).lower(), p["instance_count"]))
    r.refresh()
    r.hold(2.0)
    r.caption("Play In Editor is running, started through Epic's own toolset.", step=2)
    r.hold(2.5)
    r.ai("Starting Play In Editor goes through Epic's bridge. Listed the toolsets the editor currently offers, described the editor-app one to find its play function, and called StartPIE. Then I asked for the PIE state: is_playing: %s. BeginPlay calls Fire on the turret, and with FireRate at 0.0 in this fresh sample it stays quiet until you set it, as the previous Ritual did." % str(ps["is_playing"]).lower())
    r.tool("epic_call_tool", {"tool": "EditorToolset.EditorAppToolset.StopPIE", "arguments": {}}, result=lambda p, t: "StopPIE returned", shown_args="StopPIE")
    r.refresh()
    r.hold(1.0)
    r.ai("Then I stopped the play session so the editor is back as you left it.")
    r.note("slomo returned handled:false both in the editor world and during PIE. The turret's FireRate is 0.0 on a fresh sample (Ritual 14 sets it to 2.0), so nothing prints 'Turret fires'. The Ritual's 'play function' is Epic's StartPIE on EditorToolset.EditorAppToolset. The screenshot turn is left out to keep the video short (take_screenshot returned captured:true when tried).")


def lava_material(r):
    M = SAMPLES + "/Materials"
    HOT = M + "/MI_Lava_Hot"
    r.open_asset(HOT)
    r.hold(1.0)
    r.you(0)
    r.tool("list_materials", {"path": M}, result=lambda p, t: "%d materials and instances" % p["count"], output=lambda p, t: ["%s  (%s)" % (x["name"], x["parent_class"].rsplit(".", 1)[-1]) for x in p["results"]])
    rm, _, _ = r.tool("read_material", {"asset_path": M + "/M_Lava"}, result=lambda p, t: "M_Lava: %s" % ", ".join(p["parameter_names"]),
                      output=lambda p, t: ["parameters: " + ", ".join(p["parameter_names"])] + ["%s -> %s.%s" % (c["from_node"].replace("MaterialExpression", ""), c["to_node"].replace("MaterialExpression", "") or "output", c["to_pin"]) for c in p["connections"]])
    r.caption("Three exposed knobs on the base material.", step=1)
    r.hold(2.0)
    r.ai("Found M_Lava and two instances, MI_Lava_Hot and MI_Lava_Crust (plus M_Rock). Read the base material's graph: exposed scalars EmissiveStrength and FlowSpeed, and one vector GlowColor. GlowColor times EmissiveStrength feeds the emissive color.")
    r.you(1)
    gp, _, _ = r.tool("get_material_instance_params", {"asset_path": HOT},
                      result=lambda p, t: "EmissiveStrength = %s, FlowSpeed = %.1f" % (p["scalars"][0]["value"], p["scalars"][1]["value"]),
                      output=lambda p, t: ["%s = %s" % (x["name"], round(x["value"], 2)) for x in p["scalars"]] + ["GlowColor = (%.2f, %.2f, %.2f)" % (v["r"], v["g"], v["b"]) for v in p["vectors"]])
    try:
        r.find("EmissiveStrength", "STextBlock")
        row = r.find("EmissiveStrength", "STextBlock")
        r.caption("EmissiveStrength is 12.0. That is the problem.", step=2)
        r.highlight((row.grow(10, 8, 450, 8), "12.0", "warm", "above"))
    except RuntimeError:
        r.caption("EmissiveStrength is 12.0. That is the problem.", step=2)
    r.hold(2.5)
    r.clear()
    r.ai("Scalars: EmissiveStrength = 12.0, FlowSpeed = 0.4. Vector GlowColor is a bright orange (R 1.0, G 0.35, B 0.02). Twelve is the problem. That reads straight off the asset, so no open editor is needed.")
    r.you(2)
    r.tool("set_material_instance_parameter", {"asset_path": HOT, "parameter_name": "EmissiveStrength", "type": "scalar", "value": "3.0"},
           result=lambda p, t: (t.strip().splitlines() or ["ok"])[0][:140] if not p else "EmissiveStrength set to 3.0", shown_args="EmissiveStrength = 3.0")
    r.tool("create_material_instance", {"asset_path": M + "/MI_Lava_Cool", "parent": M + "/M_Lava"}, result=lambda p, t: "MI_Lava_Cool created, parent M_Lava", shown_args="MI_Lava_Cool")
    reopen(r, HOT)
    r.hold(1.0)
    r.caption("Glow down to 3.0, and a cooler variant instance exists.", step=3)
    r.hold(2.5)
    r.ai("Set the scalar override EmissiveStrength to 3.0 on MI_Lava_Hot. Created MI_Lava_Cool as a new instance parented to M_Lava, ready for its own overrides. The art director has been told the lighthouse is decommissioned.")


def content_cleanup(r):
    P = "/Game/MyGame/Props"
    # Staging, off the record: the host has no /Game/MyGame, so a small Props folder is built from the samples with real calls.
    with r.cut():
        r.editor.py("unreal.EditorAssetLibrary.delete_directory('/Game/MyGame')")  # a previous recording's staging
        quiet(r, "duplicate_blueprint", {"asset_path": SAMPLES + "/Props/BP_Crate", "dest_asset_path": P + "/Crates/BP_Barrel"})
        quiet(r, "duplicate_blueprint", {"asset_path": SAMPLES + "/Props/BP_Crate", "dest_asset_path": P + "/Misc/BP_Barrel"})
        quiet(r, "duplicate_blueprint", {"asset_path": SAMPLES + "/Props/BP_Door", "dest_asset_path": P + "/Doors/BP_OldDoor"})
        quiet(r, "create_blueprint", {"asset_path": P + "/Misc/BP_BarrelChild", "parent_class": P + "/Misc/BP_Barrel.BP_Barrel_C"})
    r.you(0)
    la, _, _ = r.tool("list_assets", {"path": P, "group_by": "folder"},
                      result=lambda p, t: "%d assets in %d folders, flags: %s" % (p["count"], len(p["groups"]), ", ".join("%s on %s" % (f["flag"], f["name"]) for f in p["flags"]) or "none"),
                      output=lambda p, t: ["%s  (%d)" % (g["folder"], g["count"]) for g in p["groups"]] + ["flags: " + (", ".join("%s on %s" % (f["flag"], f["name"]) for f in p["flags"]) or "none")])
    r.hold(1.0)
    r.ai("One call, whole scope: %d assets in %d folders under /Game/MyGame/Props. It all came from the asset registry, so nothing was loaded. Flags: %s." % (la["count"], len(la["groups"]), ", ".join("%s on %s, which lives in two folders" % (f["flag"], f["name"]) for f in la["flags"]) or "none"))
    r.you(1)
    fa, _, _ = r.tool("find_asset", {"query": "BP_OldDoor", "path": "/Game"}, result=lambda p, t: "%d hit: %s" % (p["count"], p["results"][0]["asset_path"]))
    r.tool("get_referencers", {"asset_path": P + "/Doors/BP_OldDoor"}, result=lambda p, t: "referenced by %d assets" % p["count"],
           output=lambda p, t: ["referencers: %d" % p["count"]] + ["  " + x for x in p["referencers"]])
    r.tool("move_asset", {"asset_path": P + "/Doors/BP_OldDoor", "dest_asset_path": P + "/Doors/BP_WoodenDoor"}, result=lambda p, t: "BP_OldDoor -> BP_WoodenDoor", shown_args="BP_OldDoor -> BP_WoodenDoor")
    r.hold(1.0)
    r.ai("Found it with a name search and checked what points at it: nothing, so the rename is safe. Then moved it to the same folder with the new leaf, BP_WoodenDoor. If anything had referenced it, those references would be fixed up and a redirector left behind.")
    r.you(2)
    dl, text, err = r.tool("delete_asset", {"asset_path": P + "/Misc/BP_Barrel"},
                           result=lambda p, t: ("refused: still referenced by %s" % ", ".join(x.rsplit("/", 1)[-1] for x in p["referencing_assets"])) if not p["deleted"] else "deleted",
                           output=lambda p, t: ["deleted: %s" % str(p["deleted"]).lower(), "referencing_assets:"] + ["  " + x for x in p.get("referencing_assets", [])])
    r.hold(1.5)
    refused = not dl["deleted"]
    r.ai("Tried a plain delete of /Game/MyGame/Props/Misc/BP_Barrel. %s I did not force it. Forcing would leave null references in whatever still uses it. Point those at the right barrel first, then ask again." % ("Refused, because BP_BarrelChild still references it, and the refusal handed back its name." if refused else "It went through, because nothing referenced it."))
    r.note("The host has no /Game/MyGame. Before recording the scene staged a /Game/MyGame/Props folder with real duplicate_blueprint and create_blueprint calls (two BP_Barrel, BP_OldDoor, and a child Blueprint of one barrel). The Ritual's 212 assets, 14 redirectors and two referencing levels don't exist here, so the AI text states what the real list_assets, get_referencers and delete_asset returned.")


def who_broke_it(r):
    r.you(0)
    gh, text, err = r.tool("get_asset_history", {"asset_path": TURRET}, result=lambda p, t: p.get("reason", "ok") if p else t[:150],
                           output=lambda p, t: ["ok: %s" % str(p["ok"]).lower(), "reason: " + p.get("reason", "")])
    r.hold(1.0)
    r.ai("Asked your source-control provider. It answered with a plain reason instead of a list: %s. So there is no history to read here, and I haven't touched the asset. With a provider connected and BP_Turret tracked, this would return the newest revisions first, with authors, dates and descriptions." % gh["reason"])
    r.note("The host has no source control, so get_asset_history returns ok:false, reason 'source control is not enabled'. The Ritual's other turns (load_asset_revision, read_blueprint twice, set_variable_default, unload_packages) depend on revisions and were not recorded. This video is the shortest of the set.")


def health_update(r):
    r.you(0)
    hc, _, _ = r.tool("health_check", {}, result=lambda p, t: "%s, update_available: %s" % (p["current"]["state"], str(p["update_available"]).lower()),
                      output=lambda p, t: ["state: " + p["current"]["state"], "game_thread_responsive: %s" % str(p["game_thread_responsive"]).lower(), "current_version: " + p["current_version"],
                                           "update_available: %s" % str(p["update_available"]).lower(), "route: " + p["route"]])
    r.ai("Checked. The editor is healthy and the game thread is answering, so it is not stalled on a dialog or a breakpoint. The same report shows update_available: %s and names the current version, %s." % (str(hc["update_available"]).lower(), hc["current_version"]))
    r.you(1)
    pv, _, _ = r.tool("apply_update", {}, result=lambda p, t: "%s, latest %s" % (p["applied"], p["latest_version"]),
                      output=lambda p, t: ["%s: %s" % (k, v) for k, v in p.items() if not isinstance(v, (dict, list))])
    r.ai("Ran the update in preview mode. With no confirm it only reports and changes nothing on disk. It says applied: %s, current %s, latest %s, so there is nothing to download. When there is, it would verify the zip against the published checksums, stage it, and swap it in once every client using the current exe has closed." % (pv["applied"], pv["current_version"], pv["latest_version"]))
    r.you(2)
    cf, _, _ = r.tool("apply_update", {"confirm": True}, result=lambda p, t: "%s, restart_required: %s" % (p["applied"], str(p["restart_required"]).lower()),
                      output=lambda p, t: ["%s: %s" % (k, v) for k, v in p.items() if not isinstance(v, (dict, list))], shown_args="confirm: true")
    r.ai("Re-ran it with confirm:true since you said yes. Result: %s, restart_required: %s. Nothing was swapped because the install is already on the latest release. If a newer one lands, restart your AI client afterward to pick up new skills or changed tool descriptions." % (cf["applied"], str(cf["restart_required"]).lower()))
    r.note("The host runs the latest public release (v0.6.13), so health_check reports update_available:false and apply_update (preview and confirm) both return applied:'up_to_date'. The Ritual says an update is available.")


SCENES = {"menu-typo": menu_typo, "turret-bt": turret_bt, "prove-live": prove_live, "lava-material": lava_material,
          "content-cleanup": content_cleanup, "who-broke-it": who_broke_it, "health-update": health_update}
