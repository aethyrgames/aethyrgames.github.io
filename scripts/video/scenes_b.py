"""Rituals 6 to 12 (onboard, grow-stat, fork-variant, designer-tour, batch-recover, boss-fight, loot-table)."""
from sceneslib import *  # noqa: F401,F403
from record import Rect  # noqa: F401


def onboard(r):
    # Nothing visual in the editor for this one: a read-only tour, so chat plus the terminal readout.
    r.you(0)
    p, _, _ = r.tool("get_project_metadata", {}, result=lambda p, t: "%s, engine %s, %d plugins" % (p["project_name"], p["engine_association"], len(p["raw"]["Plugins"])),
                     output=lambda p, t: ["project_name: " + p["project_name"], "engine_association: " + p["engine_association"], "description: " + p["description"]]
                     + ["plugin: %s (enabled)" % x["Name"] for x in p["raw"]["Plugins"]])
    plugins = ", ".join(x["Name"] for x in p["raw"]["Plugins"])
    r.ai("Read the project file. It's %s, engine association %s. The plugins it lists are %s. Nothing here writes: this is pure metadata off the .uproject." % (p["project_name"], p["engine_association"], plugins))
    r.you(1)
    lb, _, _ = r.tool("list_blueprints", {"path": "/Game"}, result=lambda p, t: "%d Blueprints under /Game" % p["count"],
                      output=lambda p, t: ["%s  (parent %s)" % (x["name"], x["parent_class"].rsplit(".", 1)[-1].replace("_C", "")) for x in p["results"]])
    sm, _, _ = r.tool("summarize_blueprint", {"asset_path": ENEMY}, result=lambda p, t: "%s: %d variables, %d functions" % (p["name"], p["variable_count"], p["function_count"]))
    ov, _, _ = r.tool("find_overriders", {"parent_class": "/Script/Engine.Actor", "function_name": "ReceiveBeginPlay"},
                      result=lambda p, t: "%d Blueprints on Actor" % len(p), output=lambda p, t: [x["name"] for x in p])
    r.tool("get_referencers", {"asset_path": ENEMY}, result=lambda p, t: "BP_Enemy is referenced by %d asset" % p["count"],
           output=lambda p, t: ["referencers:"] + ["  " + x for x in p["referencers"]])
    names = ", ".join(x["name"] for x in lb["results"])
    r.ai("There are %d Blueprints under /Game: %s. BP_Boss is a child of BP_Enemy, the one Character in the set (%d variables, %d functions). %d Actor-based Blueprints are ready to carry a BeginPlay. A reference read shows BP_Boss is the only asset that points at BP_Enemy, so that's its change surface. Everything was a read, nothing was opened for edit or saved."
         % (lb["count"], names, sm["variable_count"], sm["function_count"], len(ov)))
    r.note("The host has no /Game/MyGame project, so the tour runs on /Game/AethyrSamples. Only the first two Ritual turns were used. The audit turn (a subagent) and the BP_Player blast-radius turn name assets the host doesn't have.")


def grow_stat(r):
    r.open_asset(ENEMY)
    r.hold(1.0)
    r.you(0)
    lv, _, _ = r.tool("list_variables", {"asset_path": ENEMY},
                      result=lambda p, t: "%d variables" % p["count"],
                      output=lambda p, t: ["%s: %s = %s" % (x["name"], x["type"]["sub_category"] or x["type"]["category"], x["default_value"]) for x in p["results"]])
    r.tool("get_function", {"asset_path": ENEMY, "function_name": "TakeDamage"}, result=lambda p, t: "TakeDamage: %d nodes" % len(p["graph"]["nodes"]))
    rows = rows_of(r, ["Health", "MaxHealth", "Speed", "bIsAlive", "LootTable"])
    r.caption("Five bare variables, none filed in a category.", step=1)
    r.focus(union(rows), pad=330)
    r.highlight((union(rows), "No categories", "warm", "right"))
    r.hold(2.0)
    r.clear()
    r.ai("Five variables: Health (float, 100), MaxHealth (float, 100), Speed (float, 300), bIsAlive (bool, true) and LootTable (name, DT_Loot). All editable, all in Default. TakeDamage subtracts from Health, but nothing keeps Health under MaxHealth.")
    r.focus()
    ops = [
        {"op": "rename_variable", "asset_path": ENEMY, "old_name": "Health", "new_name": "CurrentHealth"},
        {"op": "set_variable_category", "asset_path": ENEMY, "name": "CurrentHealth", "category": "Vitals"},
        {"op": "set_variable_category", "asset_path": ENEMY, "name": "MaxHealth", "category": "Vitals"},
    ]
    heal = {"asset_path": ENEMY, "function_name": "Heal", "inputs": [{"name": "Amount", "type": "float"}], "body": [
        {"set": "CurrentHealth", "to": {"call": "KismetMathLibrary::FClamp", "args": {
            "Value": {"call": "+f", "args": {"A": {"var": "CurrentHealth"}, "B": {"var": "Amount"}}}, "Min": {"lit": 0}, "Max": {"var": "MaxHealth"}}}}]}
    r.you(1)
    r.tool("preview_ops", {"ops": ops}, result=lambda p, t: "%d ops valid, %d failed, would compile %d asset" % (p["validated"], p["failed"], len(p["would_compile"])))
    r.tool("compile_function", dict(heal, dry_run=True), result=lambda p, t: "Heal dry run: %d ops lowered, nothing written" % len(p["ops"]), shown_args="Heal (dry_run)")
    r.ai("Staged, nothing written yet. The preview is clean: one rename (Health to CurrentHealth, with the graph's nodes following) and both variables filed under Vitals. A dry run of Heal(Amount) lowers to a branch-free clamp of CurrentHealth + Amount into [0, MaxHealth].")
    r.you(2)
    r.tool("apply_ops", {"ops": ops}, result=lambda p, t: "applied %d ops, %d errors" % (len(p["results"]), p["compile_errors"]), shown_args="3 ops, atomic")
    r.tool("compile_function", heal, result=lambda p, t: "Heal compiled, %d errors" % p["compile_errors"], shown_args="Heal(Amount)")
    r.tool("get_compile_status", {"asset_path": ENEMY}, result=lambda p, t: "BP_Enemy compiles: %s" % p["status"])
    r.refresh()
    vitals = r.find("Vitals", "STextBlock", exact=True)
    r.click((vitals.x - 10, vitals.y + vitals.h / 2), settle=0.8)
    r.caption("CurrentHealth and MaxHealth now sit under Vitals, and Heal exists.", step=2)
    new = rows_of(r, ["CurrentHealth", "MaxHealth", "Heal"])
    r.focus(union(new), pad=330)
    r.highlight((union(new), "Vitals + Heal", "c2", "right"))
    r.hold(2.5)
    r.clear()
    r.focus()
    r.ai("Applied and compiled. The rename and both category moves landed together, and Heal(Amount) compiled clean after them: BP_Enemy has no errors and no warnings.")
    r.note("The rename and categories were one apply_ops batch, and Heal was a separate compile_function call afterwards (preview_ops can't bind a new function's entry node), so the whole change was not one atomic batch.")


def fork_variant(r):
    ELITE = SAMPLES + "/AI/BP_EliteEnemy"
    r.open_asset(ENEMY)
    r.hold(1.0)
    r.you(0)
    r.tool("read_blueprint", {"asset_path": ENEMY}, result=lambda p, t: "%s: parent %s" % (p["name"], p["parent_class"].rsplit(".", 1)[-1]))
    r.tool("duplicate_blueprint", {"asset_path": ENEMY, "dest_asset_path": ELITE}, result=lambda p, t: "BP_EliteEnemy created" if not p.get("already_existed") else "already existed", shown_args="BP_Enemy -> BP_EliteEnemy")
    r.ai("Read BP_Enemy first: its parent is Character. Duplicated it as BP_EliteEnemy under /Game/AethyrSamples/AI, so the variant has the same parent and the same variables, functions and graphs, wired exactly the same.")
    r.open_asset(ELITE)
    r.hold(1.0)
    r.you(2)
    r.tool("set_variable_default", {"asset_path": ELITE, "name": "Health", "default_value": "250"}, result=lambda p, t: "Health default set to 250", shown_args="Health = 250")
    r.tool("set_variable_default", {"asset_path": ELITE, "name": "MaxHealth", "default_value": "250"}, result=lambda p, t: "MaxHealth default set to 250", shown_args="MaxHealth = 250")
    r.tool("set_variable_default", {"asset_path": ELITE, "name": "Speed", "default_value": "450"}, result=lambda p, t: "Speed default set to 450", shown_args="Speed = 450")
    r.tool("get_compile_status", {"asset_path": ELITE}, result=lambda p, t: "BP_EliteEnemy compiles: %s" % p["status"])
    r.refresh()
    r.caption("The variant's three defaults changed. Nothing else did.", step=1)
    r.hold(2.0)
    r.ai("Touched only three defaults on the variant: Health 100 to 250, MaxHealth 100 to 250 and Speed 300 to 450. No graph edits, no structural change.")
    r.you(3)
    d, _, _ = r.tool("bp_structural_diff", {"source": ENEMY, "candidate": ELITE},
                     result=lambda p, t: "identical: %s, %d differences" % (str(p["identical"]).lower(), len(p["differences"])),
                     output=lambda p, t: ["identical: %s" % str(p["identical"]).lower(), "differences: %d" % len(p["differences"])])
    r.caption("A structural diff against BP_Enemy: nothing structural drifted.", step=2)
    r.hold(2.5)
    r.ai("Ran a structural diff between the two Blueprints. It reports identical: true with no differences, so the graphs, functions, components and interfaces all match node for node. A structural diff doesn't compare default values, so the three number changes don't show up there. Your variant is a true fork.")
    r.note("The Ritual builds the variant with create_blueprint, add_variable, add_function and clone_graph. The real run used duplicate_blueprint (one call), then three set_variable_default calls and the structural diff. Turn 2 (clone the functions across) is skipped because the duplicate already carries them. The real bp_structural_diff reports identical:true and no differences (it ignores default values), where the Ritual says it reports three default-value deltas. BP_EliteEnemy lives under /Game/AethyrSamples/AI, not /Game/MyGame/AI.")


def designer_tour(r):
    r.open_asset(LOOT, "DT_Loot")
    r.hold(1.0)
    r.you(0)
    dt, _, _ = r.tool("read_data_table", {"asset_path": LOOT}, result=lambda p, t: "DT_Loot: %d rows, columns %s" % (len(p["rows"]), ", ".join(p["columns"][1:])),
                      output=lambda p, t: ["%s  weight %s  %s" % (x["row_name"], x["Weight"], x["Rarity"]) for x in p["rows"]])
    outlier = max(dt["rows"], key=lambda x: x["Weight"])
    row = table_row(r, outlier["row_name"])
    r.caption("One row stands out: a Legendary at the highest weight.", step=1)
    r.focus(row, pad=330)
    r.highlight((row, "Weight %d" % outlier["Weight"], "warm", "below"))
    r.hold(2.5)
    r.clear()
    r.focus()
    r.ai("Read DT_Loot. Row struct S_ItemRow, %d rows. The commons sit at weights 40 and 30, the Uncommon at 20, the Rare at 8. Then one outlier: %s sits at weight %d, more than double the next row. A Legendary item with the highest drop weight in the table reads like a mistake." % (len(dt["rows"]), outlier["row_name"], outlier["Weight"]))
    r.you(1)
    rs, _, _ = r.tool("read_struct", {"asset_path": SAMPLES + "/Data/S_ItemRow"}, result=lambda p, t: "S_ItemRow: %d members" % p["member_count"],
                      output=lambda p, t: ["%s: %s" % (x["name"], x["type"]["category"]) for x in p["members"]])
    r.ai("Read S_ItemRow: Name is a string, Damage a float, Weight an int and Rarity uses the E_Rarity enum. There's also an unused MemberVar_0 bool left from when the struct was created. The labels and the weights agree everywhere except one row.")
    r.you(2)
    r.tool("list_blueprints", {"path": SAMPLES}, result=lambda p, t: "%d Blueprints under /Game/AethyrSamples" % p["count"])
    r.tool("list_variables", {"asset_path": ENEMY}, result=lambda p, t: "BP_Enemy: LootTable (name) = DT_Loot", output=lambda p, t: ["%s: %s" % (x["name"], x["default_value"]) for x in p["results"] if x["name"] == "LootTable"])
    r.ai("Listed the Blueprints under /Game/AethyrSamples and read BP_Enemy's variables. Its LootTable name variable defaults to DT_Loot. A weight change shifts every drop it rolls. That came from reading variables, not from the reference graph, because a plain name isn't a hard reference.")
    r.note("Only the first three Ritual turns were recorded (the fourth, a plan with no tool call, is left out to keep the video short). Real DT_Loot has five columns (MemberVar_0, Name, Damage, Weight, Rarity), the Ritual says four. Only BP_Enemy carries a LootTable variable in the samples (the Ritual also names BP_Crate), so the AI text says BP_Enemy only.")


def batch_recover(r):
    G = "EventGraph"
    r.open_asset(TURRET)
    r.hold(1.0)
    base = [
        {"op": "add_variable", "asset_path": TURRET, "name": "TargetActor", "type": "object:/Script/Engine.Actor"},
        {"op": "add_variable", "asset_path": TURRET, "name": "Cooldown", "type": "float", "default_value": "1.5"},
        {"op": "add_node", "id": "ev", "asset_path": TURRET, "graph_name": G, "kind": "CustomEvent", "event_name": "AcquireTarget", "x": 0, "y": 500},
        {"op": "add_node", "id": "get", "asset_path": TURRET, "graph_name": G, "kind": "VariableGet", "variable": "TargetActor", "x": 300, "y": 750},
        {"op": "add_node", "id": "dmg", "asset_path": TURRET, "graph_name": G, "kind": "CallFunction", "function": "ApplyDamage", "function_owner": "GameplayStatics", "x": 900, "y": 500},
        {"op": "wire_pins", "asset_path": TURRET, "graph_name": G, "from_node": "$ev", "from_pin": "then", "to_node": "$dmg", "to_pin": "execute"},
        {"op": "wire_pins", "asset_path": TURRET, "graph_name": G, "from_node": "$get", "from_pin": "TargetActor", "to_node": "$dmg", "to_pin": "DamagedActor"},
    ]
    bad = base + [{"op": "wire_pins", "asset_path": TURRET, "graph_name": G, "from_node": "$get", "from_pin": "TargetActor", "to_node": "$dmg", "to_pin": "EventInstigator"}]
    fix = [o for o in base if not (o["op"] == "wire_pins" and o["to_pin"] == "execute")] + [
        {"op": "add_node", "id": "cast", "asset_path": TURRET, "graph_name": G, "kind": "Cast", "target_class": "Controller", "x": 600, "y": 500},
        {"op": "wire_pins", "asset_path": TURRET, "graph_name": G, "from_node": "$ev", "from_pin": "then", "to_node": "$cast", "to_pin": "execute"},
        {"op": "wire_pins", "asset_path": TURRET, "graph_name": G, "from_node": "$cast", "from_pin": "then", "to_node": "$dmg", "to_pin": "execute"},
        {"op": "wire_pins", "asset_path": TURRET, "graph_name": G, "from_node": "$get", "from_pin": "TargetActor", "to_node": "$cast", "to_pin": "Object"},
        {"op": "wire_pins", "asset_path": TURRET, "graph_name": G, "from_node": "$cast", "from_pin": "AsController", "to_node": "$dmg", "to_pin": "EventInstigator"}]
    r.you(0)
    r.tool("apply_ops", {"ops": bad}, expect_error=True, result=lambda p, t: "op 7 rejected: Actor is not compatible with Controller", shown_args="8 ops, atomic",
           output=lambda p, t: ["apply_ops failed at op[7] (wire_pins)", "connection rejected by schema:", "  Actor Object Reference is not", "  compatible with Controller Object Reference"])
    r.caption("The batch is rejected at the one bad wire. Nothing is saved.", step=1)
    r.hold(1.5)
    rb, _, _ = r.tool("read_blueprint", {"asset_path": TURRET}, result=lambda p, t: "BP_Turret: %d variables, %d function (Fire)" % (len(p["variables"]), len(p["functions"])))
    r.tool("get_dirty_packages", {}, result=lambda p, t: "dirty content packages: %d" % sum(1 for x in p["results"] if x["is_content"]))
    r.refresh()
    r.ai("Staged as a single atomic apply_ops. Seven ops applied, but the eighth failed: wiring TargetActor (an Actor reference) into ApplyDamage's EventInstigator (a Controller reference) is a type mismatch, so the pins don't connect and the whole batch was rejected. Nothing was written: I re-read BP_Turret and it still has its original three variables and its Fire function, no TargetActor, no Cooldown, no AcquireTarget, and no content package is dirty. Atomic means the whole batch lands or none of it does.")
    r.you(2)
    r.tool("preview_ops", {"ops": fix}, result=lambda p, t: "%d ops valid, %d failed, would compile %d asset" % (p["validated"], p["failed"], len(p["would_compile"])))
    r.ai("The fix is to cast first: I added a Cast To Controller node, so AsController (a Controller reference) feeds EventInstigator. Then I dry-ran the whole batch with preview_ops: it validates clean now, and nothing has touched the asset yet.")
    r.you(3)
    r.tool("apply_ops", {"ops": fix}, result=lambda p, t: "applied %d ops, %d errors, %d warnings" % (len(p["results"]), p["compile_errors"], p["compile_warnings"]), shown_args="%d ops, atomic" % len(fix))
    r.tool("get_compile_status", {"asset_path": TURRET}, result=lambda p, t: "BP_Turret compiles: %s" % p["status"])
    r.refresh()
    tab(r, "EventGraph")
    r.hold(1.0)
    r.caption("Cast first, and the batch lands: variables, event and wiring.", step=2)
    area = graph_area(r)
    if area:
        r.highlight((area.grow(-40, -30, -40, -60), "AcquireTarget, with the cast", "c1", "above"))
    r.hold(2.5)
    r.clear()
    r.ai("Done. apply_ops ran all the steps and saved, and the final get_compile_status came back clean: zero errors, zero warnings. TargetActor, Cooldown, and the AcquireTarget event with its cast-and-apply wiring are all in.")
    r.note("The failing step is real, but it is ApplyDamage's EventInstigator (Controller) rather than a SetTargetActor/Pawn pin, and the fix is a Cast To Controller. AcquireTarget is a custom event, not a function, and there was no AcquireTarget output pin. The failed batch really did roll back (nothing dirty, nothing on disk), as the Ritual says.")


def boss_fight(r):
    r.open_asset(BOSS)
    r.hold(1.0)
    r.you(0)
    fa, _, _ = r.tool("find_asset", {"query": "Boss"}, result=lambda p, t: "%d hit: %s" % (p["count"], p["results"][0]["asset_path"]))
    sm, _, _ = r.tool("summarize_blueprint", {"asset_path": BOSS}, result=lambda p, t: "BP_Boss: %d variables, %d function, parent BP_Enemy" % (p["variable_count"], p["function_count"]))
    pk, _, _ = r.tool("peek_graph", {"asset_path": BOSS}, result=lambda p, t: "EventGraph: %d nodes, %d connections" % (p["nodes_count"], p["connections_count"]))
    gf, _, _ = r.tool("get_function", {"asset_path": BOSS, "function_name": "BossTakeDamage"}, result=lambda p, t: "BossTakeDamage: %d nodes" % len(p["graph"]["nodes"]))
    fn, _, _ = r.tool("find_node", {"asset_path": BOSS, "query": "BossHealth"}, result=lambda p, t: "%d nodes touch BossHealth" % p["count"])
    r.tool("list_variables", {"asset_path": BOSS}, result=lambda p, t: "BossHealth = 50, BossMaxHealth = 50, ArmorValue = 0",
           output=lambda p, t: ["%s = %s" % (x["name"], x["default_value"]) for x in p["results"]])
    open_graph(r, "BossTakeDamage")
    r.hold(1.2)
    r.caption("BossTakeDamage subtracts the damage and stops. No zero check, no phases.", step=1)
    area = graph_area(r)
    if area:
        r.highlight((area.grow(-60, -20, -60, -60), "One door, no lock", "warm", "above"))
    r.hold(2.5)
    r.clear()
    r.ai("Searched asset names for \"Boss\" and got one hit: /Game/AethyrSamples/AI/BP_Boss, with %d variables of its own, %d function and the parent BP_Enemy. The event graph is only %d nodes of parent calls, so the damage code is in BossTakeDamage: it subtracts the incoming amount from BossHealth and stops there. No zero check, no phases, and ArmorValue is 0 with nothing reading it. A node search shows %d nodes touching BossHealth, all inside that function, so there is one door and no lock. BossHealth and BossMaxHealth both default to 50." % (sm["variable_count"], sm["function_count"], pk["nodes_count"], fn["count"]))
    r.you(2)
    r.tool("set_variable_default", {"asset_path": BOSS, "name": "BossHealth", "default_value": "1500"}, result=lambda p, t: "BossHealth default set to 1500", shown_args="BossHealth = 1500")
    r.tool("set_variable_default", {"asset_path": BOSS, "name": "BossMaxHealth", "default_value": "1500"}, result=lambda p, t: "BossMaxHealth default set to 1500", shown_args="BossMaxHealth = 1500")
    nodes = gf["graph"]["nodes"]
    setter = next(n for n in nodes if n["kind"] == "VariableSet" and n["meta"].get("variableName") == "BossHealth")["id"]
    G = "BossTakeDamage"
    ops = [
        {"op": "add_variable", "asset_path": BOSS, "name": "EnrageThreshold", "type": "float", "default_value": "0.3"},
        {"op": "add_variable", "asset_path": BOSS, "name": "bEnraged", "type": "bool", "default_value": "false"},
        {"op": "add_node", "id": "hp", "asset_path": BOSS, "graph_name": G, "kind": "VariableGet", "variable": "BossHealth", "x": 1300, "y": 500},
        {"op": "add_node", "id": "mx", "asset_path": BOSS, "graph_name": G, "kind": "VariableGet", "variable": "BossMaxHealth", "x": 1300, "y": 650},
        {"op": "add_node", "id": "th", "asset_path": BOSS, "graph_name": G, "kind": "VariableGet", "variable": "EnrageThreshold", "x": 1300, "y": 800},
        {"op": "add_node", "id": "mul", "asset_path": BOSS, "graph_name": G, "kind": "CallFunction", "function": "Multiply_DoubleDouble", "function_owner": "KismetMathLibrary", "x": 1600, "y": 700},
        {"op": "add_node", "id": "le", "asset_path": BOSS, "graph_name": G, "kind": "CallFunction", "function": "LessEqual_DoubleDouble", "function_owner": "KismetMathLibrary", "x": 1900, "y": 600},
        {"op": "add_node", "id": "br", "asset_path": BOSS, "graph_name": G, "kind": "Branch", "x": 2200, "y": 400},
        {"op": "add_node", "id": "en", "asset_path": BOSS, "graph_name": G, "kind": "VariableSet", "variable": "bEnraged", "x": 2500, "y": 400},
        {"op": "wire_pins", "asset_path": BOSS, "graph_name": G, "from_node": "$mx", "from_pin": "BossMaxHealth", "to_node": "$mul", "to_pin": "A"},
        {"op": "wire_pins", "asset_path": BOSS, "graph_name": G, "from_node": "$th", "from_pin": "EnrageThreshold", "to_node": "$mul", "to_pin": "B"},
        {"op": "wire_pins", "asset_path": BOSS, "graph_name": G, "from_node": "$hp", "from_pin": "BossHealth", "to_node": "$le", "to_pin": "A"},
        {"op": "wire_pins", "asset_path": BOSS, "graph_name": G, "from_node": "$mul", "from_pin": "ReturnValue", "to_node": "$le", "to_pin": "B"},
        {"op": "wire_pins", "asset_path": BOSS, "graph_name": G, "from_node": "$le", "from_pin": "ReturnValue", "to_node": "$br", "to_pin": "Condition"},
        {"op": "wire_pins", "asset_path": BOSS, "graph_name": G, "from_node": setter, "from_pin": "then", "to_node": "$br", "to_pin": "execute"},
        {"op": "set_pin_default", "asset_path": BOSS, "graph_name": G, "node_id": "$en", "pin_name": "bEnraged", "value": "true"},
        {"op": "wire_pins", "asset_path": BOSS, "graph_name": G, "from_node": "$br", "from_pin": "then", "to_node": "$en", "to_pin": "execute"},
    ]
    r.tool("preview_ops", {"ops": ops}, result=lambda p, t: "%d ops valid, %d failed, would compile %d asset" % (p["validated"], p["failed"], len(p["would_compile"])))
    r.ai("Two plain writes first: BossHealth and BossMaxHealth defaults 50 to 1500, saved. Then I staged the rest as a batch (a new EnrageThreshold float at 0.3, a new bEnraged bool, a branch in BossTakeDamage after the damage is applied, and the wires) and dry-ran it. The preview says every op is valid and it touches exactly one asset. Apply?")
    r.you(3)
    r.tool("apply_ops", {"ops": ops}, result=lambda p, t: "applied %d ops, %d errors, %d warnings" % (len(p["results"]), p["compile_errors"], p["compile_warnings"]), shown_args="%d ops, atomic" % len(ops))
    r.tool("get_compile_status", {"asset_path": BOSS}, result=lambda p, t: "BP_Boss compiles: %s" % p["status"])
    r.refresh()
    r.hold(1.0)
    r.caption("The enrage branch sits right after the damage.", step=2)
    area = graph_area(r)
    if area:
        r.highlight((area.grow(-60, -20, -60, -60), "Enrage at 30 percent", "c1", "above"))
    r.hold(2.5)
    r.clear()
    r.ai("Landed as one batch and BP_Boss compiles. The boss has 1500 health and a branch that sets bEnraged once its health drops to 30 percent of BossMaxHealth. The pool noodle still does 1 damage. Your playtester has been informed.")
    r.note("Turns 0 and 1 of the Ritual are one turn here (to keep the video short). The branch is real. The Ritual says BossTakeDamage 'stops there' with no zero check, which matches. The branch tests BossHealth <= BossMaxHealth * EnrageThreshold (the Ritual says 'below').")


def loot_table(r):
    r.open_asset(LOOT, "DT_Loot")
    r.hold(1.0)
    r.you(0)
    r.tool("list_data_tables", {"path": SAMPLES}, result=lambda p, t: "%d DataTable: %s" % (p["count"], p["results"][0]["name"]))
    dt, _, _ = r.tool("read_data_table", {"asset_path": LOOT}, result=lambda p, t: "DT_Loot: %d rows" % len(p["rows"]),
                      output=lambda p, t: ["%s  weight %s  %s" % (x["row_name"], x["Weight"], x["Rarity"]) for x in p["rows"]])
    row = table_row(r, "Legendary_Sword")
    r.caption("Five rows. The Legendary Sword is the most common drop.", step=1)
    r.focus(row, pad=330)
    r.highlight((row, "Weight 90", "warm", "below"))
    r.hold(2.2)
    r.clear()
    r.focus()
    r.ai("One DataTable under /Game/AethyrSamples: DT_Loot. Read it: row struct S_ItemRow, %d rows. The everyday items sit at weights between 8 and 40. Legendary_Sword sits at 90. A legendary dropping more than twice as often as the commonest dagger is, let us say, generous." % len(dt["rows"]))
    r.you(1)
    r.tool("set_data_row_value", {"asset_path": LOOT, "row_name": "Legendary_Sword", "field_name": "Weight", "value": "2"},
           result=lambda p, t: "Weight on %s: %s -> %s" % (p["row_name"], p["old_value"], p["new_value"]))
    r.tool("add_data_row", {"asset_path": LOOT, "row_name": "Legendary_Goblet", "values": {"Name": "Legendary Goblet", "Damage": "0", "Weight": "1", "Rarity": "Legendary"}},
           result=lambda p, t: "%s row %s" % (p["row_name"], "added" if p["created"] else "not added"))
    r.ai("Set the Weight field on Legendary_Sword from 90 to 2. The tool echoes the old and new values, so you can see the coercion landed. Then I added Legendary_Goblet with Weight 1, Damage 0 and Rarity Legendary. The row name was free, so nothing was overwritten.")
    r.you(2)
    dt2, _, _ = r.tool("read_data_table", {"asset_path": LOOT}, result=lambda p, t: "DT_Loot: %d rows" % len(p["rows"]),
                       output=lambda p, t: ["%s  weight %s  %s" % (x["row_name"], x["Weight"], x["Rarity"]) for x in p["rows"]])
    reopen(r, LOOT, "DT_Loot")
    r.hold(0.8)
    sword, goblet = table_row(r, "Legendary_Sword"), table_row(r, "Legendary_Goblet")
    r.caption("Reopened: the Sword sits at weight 2 and the Goblet joined at 1.", step=2)
    r.focus(sword.union(goblet), pad=300)
    r.highlight((sword, "Weight 2", "c2", "above"), (goblet, "New row", "c1", "below"))
    r.hold(3.0)
    r.clear()
    r.focus()
    r.ai("Re-read the table: %d rows now, and both legendaries sit far below the commons. Your players will whisper about the sword instead of vacuuming it up." % len(dt2["rows"]))
    r.note("The open DataTable editor does not refresh when Aethyr writes to the asset, so the scene closes and reopens it (off the record) before showing the result.")


SCENES = {"onboard": onboard, "grow-stat": grow_stat, "fork-variant": fork_variant, "designer-tour": designer_tour,
          "batch-recover": batch_recover, "boss-fight": boss_fight, "loot-table": loot_table}
