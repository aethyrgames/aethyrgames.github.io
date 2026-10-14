"""Rituals 1 to 5 (read, author, atomic, debug, pickup)."""
from sceneslib import *  # noqa: F401,F403


def read(r):
    r.open_asset(ENEMY)
    r.hold(1.0)
    r.you(0)
    r.tool("list_blueprints", {"path": SAMPLES + "/AI"}, result=lambda p, t: "%d Blueprints under %s/AI" % (p["count"], SAMPLES))
    r.tool("summarize_blueprint", {"asset_path": ENEMY},
           result=lambda p, t: "%s: parent %s, %d variables, %d functions" % (p["name"], p["parent_class"].rsplit(".", 1)[-1], p["variable_count"], p["function_count"]))
    rows = rows_of(r, ["Health", "MaxHealth", "Speed", "bIsAlive", "LootTable"])
    funcs = rows_of(r, ["Die", "TakeDamage"])
    r.caption("Five variables and two functions, read without clicking through the graphs.", step=1)
    r.focus(union(rows + funcs), pad=330)
    r.highlight((union(rows), "5 variables", "c1", "right"), (union(funcs), "2 functions", "c2", "right"))
    r.hold(2.0)
    r.clear()
    r.focus()
    tab(r, "EventGraph")
    r.tool("get_graph", {"asset_path": ENEMY}, result=lambda p, t: "EventGraph: %d nodes" % len(p["nodes"]))
    r.caption("The event graph, read as plain data. BeginPlay only prints a greeting.", step=2)
    area = graph_area(r)
    if area:
        r.highlight((area.grow(-40, -40, -300, -250), "Event graph", "warm", "above"))
    r.hold(2.0)
    r.clear()
    r.ai(0)


def author(r):
    r.open_asset(ENEMY)
    r.hold(1.0)
    r.you(0)
    r.tool("add_variable", {"asset_path": ENEMY, "name": "bCanDash", "type": "bool", "default_value": "true"},
           result=lambda p, t: "bCanDash (bool) created" if not p["already_existed"] else "already existed", shown_args="bCanDash: bool")
    r.tool("add_variable", {"asset_path": ENEMY, "name": "DashCooldown", "type": "float", "default_value": "2.0"},
           result=lambda p, t: "DashCooldown (float) created", shown_args="DashCooldown: float = 2.0")
    r.refresh()
    new = rows_of(r, ["bCanDash", "DashCooldown"])
    r.caption("Two new variables land in My Blueprint.", step=1)
    r.focus(union(new), pad=330)
    r.highlight((union(new), "New variables", "c2", "right"))
    r.hold(2.2)
    r.clear()
    r.tool("compile_function", {"asset_path": ENEMY, "function_name": "ResetDash", "body": [{"set": "bCanDash", "to": {"lit": True}}]},
           result=lambda p, t: "ResetDash compiled, %d errors" % p["compile_errors"], shown_args="ResetDash")
    r.tool("compile_function", {"asset_path": ENEMY, "function_name": "Dash", "body": [
        {"if": {"var": "bCanDash"}, "then": [
            {"call": "Character::LaunchCharacter", "args": {"LaunchVelocity": {"call": "KismetMathLibrary::Multiply_VectorFloat", "args": {
                "A": {"call": "Actor::GetActorForwardVector"}, "B": {"lit": 1200}}}}},
            {"set": "bCanDash", "to": {"lit": False}},
            {"call": "KismetSystemLibrary::K2_SetTimer", "args": {"FunctionName": {"lit": "ResetDash"}, "Time": {"var": "DashCooldown"}}}]}]},
           result=lambda p, t: "Dash compiled: %d nodes wired, %d errors" % (sum(1 for x in p["results"] if "node_id" in x), p["compile_errors"]), shown_args="Dash")
    r.tool("auto_layout_graph", {"asset_path": ENEMY, "graph_name": "Dash"}, result=lambda p, t: "Dash graph tidied")
    r.tool("get_compile_status", {"asset_path": ENEMY}, result=lambda p, t: "BP_Enemy compiles: %s" % p["status"])
    r.refresh()
    r.focus()
    r.caption("A Dash function now exists, wired and compiled.", step=2)
    open_graph(r, "Dash")
    r.hold(1.5)
    area = graph_area(r)
    if area:
        r.highlight((area.grow(-60, -20, -60, -40), "Dash, wired by Aethyr", "c1", "above"))
    r.hold(2.5)
    r.clear()
    r.ai("Added bCanDash (bool, true) and DashCooldown (float, 2.0). Dash guards on bCanDash, launches the character along its forward vector, clears the flag, and starts a timer that calls ResetDash after DashCooldown seconds. Compiled clean.")
    r.note("The samples have no player Blueprint, so Dash went on BP_Enemy (a Character).")
    r.note("The real run used compile_function (twice, plus a ResetDash helper) and auto_layout_graph, not add_function > add_node > wire_pins > set_pin_default. It launches with LaunchCharacter, not AddImpulse.")


def atomic(r):
    r.open_asset(ENEMY)
    r.hold(1.0)
    G = "EventGraph"
    ops = [
        {"op": "rename_variable", "asset_path": ENEMY, "old_name": "Health", "new_name": "CurrentHealth"},
        {"op": "add_node", "id": "ev", "asset_path": ENEMY, "graph_name": G, "kind": "CustomEvent", "event_name": "ClampHealth", "x": 0, "y": 700},
        {"op": "add_node", "id": "cur", "asset_path": ENEMY, "graph_name": G, "kind": "VariableGet", "variable": "CurrentHealth", "x": 300, "y": 900},
        {"op": "add_node", "id": "max", "asset_path": ENEMY, "graph_name": G, "kind": "VariableGet", "variable": "MaxHealth", "x": 300, "y": 1050},
        {"op": "add_node", "id": "clamp", "asset_path": ENEMY, "graph_name": G, "kind": "CallFunction", "function": "FClamp", "function_owner": "KismetMathLibrary", "x": 650, "y": 900},
        {"op": "add_node", "id": "set", "asset_path": ENEMY, "graph_name": G, "kind": "VariableSet", "variable": "CurrentHealth", "x": 1000, "y": 700},
        {"op": "wire_pins", "asset_path": ENEMY, "graph_name": G, "from_node": "$cur", "from_pin": "CurrentHealth", "to_node": "$clamp", "to_pin": "Value"},
        {"op": "set_pin_default", "asset_path": ENEMY, "graph_name": G, "node_id": "$clamp", "pin_name": "Min", "value": "0"},
        {"op": "wire_pins", "asset_path": ENEMY, "graph_name": G, "from_node": "$max", "from_pin": "MaxHealth", "to_node": "$clamp", "to_pin": "Max"},
        {"op": "wire_pins", "asset_path": ENEMY, "graph_name": G, "from_node": "$clamp", "from_pin": "ReturnValue", "to_node": "$set", "to_pin": "CurrentHealth"},
        {"op": "wire_pins", "asset_path": ENEMY, "graph_name": G, "from_node": "$ev", "from_pin": "then", "to_node": "$set", "to_pin": "execute"},
    ]
    r.you(0)
    r.caption("Before: the variable is still called Health.", step=1)
    r.highlight((rows_of(r, ["Health"])[0], "Health", "warm", "right"))
    r.hold(1.5)
    r.tool("preview_ops", {"ops": ops}, result=lambda p, t: "%d ops valid, %d failed, would compile %d asset" % (p["validated"], p["failed"], len(p["would_compile"])))
    r.hold(0.5)
    r.clear()
    r.ai("Here's the dry run: one rename, one new ClampHealth event that clamps CurrentHealth between 0 and MaxHealth, and no conflicts. MaxHealth already exists on BP_Enemy, so I reused it instead of adding another. Apply it?")
    r.you(1)
    r.tool("apply_ops", {"ops": ops}, result=lambda p, t: "applied %d ops, %d errors" % (len(p["results"]), p["compile_errors"]), shown_args="%d ops, atomic" % len(ops))
    r.tool("get_compile_status", {"asset_path": ENEMY}, result=lambda p, t: "BP_Enemy compiles: %s" % p["status"])
    r.refresh()
    r.caption("After: the variable is CurrentHealth, and the clamp is in the graph.", step=2)
    r.highlight((rows_of(r, ["CurrentHealth"])[0], "CurrentHealth", "c2", "right"))
    r.hold(2.0)
    r.clear()
    tab(r, "EventGraph")
    r.hold(1.0)
    area = graph_area(r)
    if area:
        r.highlight((area.grow(-60, -40, -60, -60), "ClampHealth", "c1", "above"))
    r.hold(2.5)
    r.clear()
    r.ai("Applied as one batch, compiled, saved, and backed up. If the clamp had failed to compile, the rename would have rolled back with it, so your graph is never left half-done.")
    r.note("MaxHealth already exists on BP_Enemy, so the real batch had no add_variable. The clamp is a ClampHealth custom event, because preview_ops can't bind a new function's entry node.")


def debug(r):
    r.open_asset(ENEMY)
    r.hold(1.0)
    r.you(0)
    r.tool("read_blueprint", {"asset_path": ENEMY + ".BP_Enemy"},
           result=lambda p, t: "%s: %d variables, %d functions" % (p["name"], len(p["variables"]), len(p["functions"])), shown_args=".../BP_Enemy.BP_Enemy")
    r.caption("The exact path from the error. This release accepts it.", step=1)
    r.hold(2.0)
    r.tool("read_blueprint", {"asset_path": SAMPLES + "/AI/BP_Enemyy"}, expect_error=True,
           result=lambda p, t: t.strip().splitlines()[0].split(" [asset=")[0][:150], shown_args=".../BP_Enemyy")
    r.caption("A path that is really wrong fails cleanly and says what it tried.", step=2)
    r.hold(2.5)
    r.tool("get_dirty_packages", {}, result=lambda p, t: "dirty content packages: %d" % sum(1 for x in p["results"] if x["is_content"]))
    r.ai("I ran the exact path from your error and this release returns the Blueprint: 5 variables. The object form, with the .BP_Enemy suffix, is normalised to the package path. A path that is really wrong fails with BlueprintNotFound and names what it tried. Neither call touched an asset.")
    r.note("The Ritual says the object path returns AssetNotFound. In v0.6.13 it doesn't: object paths are accepted. The video shows a real BlueprintNotFound from a typo'd path instead.")


def pickup(r):
    r.open_asset(PICKUP)
    r.hold(1.0)
    r.you(0)
    r.tool("summarize_blueprint", {"asset_path": PICKUP}, result=lambda p, t: "BP_HealthPickup: %s, %d variable, %d functions" % (p["parent_class"].rsplit(".", 1)[-1], p["variable_count"], p["function_count"]))
    r.tool("get_components", {"asset_path": PICKUP}, result=lambda p, t: "components: " + ", ".join(c["name"] for c in p["results"]))
    r.tool("list_variables", {"asset_path": PICKUP}, result=lambda p, t: "HealAmount: float = %s" % p["results"][0]["default_value"].rstrip("0").rstrip("."))
    r.caption("A mesh, a trigger sphere and one variable. No overlap handler yet.", step=1)
    r.hold(2.0)
    r.ai(0)
    G = "EventGraph"
    ops = [
        {"op": "add_node", "id": "ev", "asset_path": PICKUP, "graph_name": G, "kind": "ComponentBoundEvent", "component_variable": "Trigger", "delegate_name": "OnComponentBeginOverlap", "x": 0, "y": 400},
        {"op": "add_node", "id": "amt", "asset_path": PICKUP, "graph_name": G, "kind": "VariableGet", "variable": "HealAmount", "x": 400, "y": 700},
        {"op": "add_node", "id": "neg", "asset_path": PICKUP, "graph_name": G, "kind": "CallFunction", "function": "Multiply_DoubleDouble", "function_owner": "KismetMathLibrary", "x": 700, "y": 700},
        {"op": "add_node", "id": "heal", "asset_path": PICKUP, "graph_name": G, "kind": "CallFunction", "function": "ApplyDamage", "function_owner": "GameplayStatics", "x": 1000, "y": 400},
        {"op": "wire_pins", "asset_path": PICKUP, "graph_name": G, "from_node": "$amt", "from_pin": "HealAmount", "to_node": "$neg", "to_pin": "A"},
        {"op": "set_pin_default", "asset_path": PICKUP, "graph_name": G, "node_id": "$neg", "pin_name": "B", "value": "-1"},
        {"op": "wire_pins", "asset_path": PICKUP, "graph_name": G, "from_node": "$neg", "from_pin": "ReturnValue", "to_node": "$heal", "to_pin": "BaseDamage"},
        {"op": "wire_pins", "asset_path": PICKUP, "graph_name": G, "from_node": "$ev", "from_pin": "OtherActor", "to_node": "$heal", "to_pin": "DamagedActor"},
        {"op": "wire_pins", "asset_path": PICKUP, "graph_name": G, "from_node": "$ev", "from_pin": "then", "to_node": "$heal", "to_pin": "execute"},
    ]
    r.you(1)
    r.tool("preview_ops", {"ops": ops}, result=lambda p, t: "%d ops valid, %d failed, would compile %d asset" % (p["validated"], p["failed"], len(p["would_compile"])))
    r.ai("Staged first, so you can see the shape before anything touches disk. The handler binds the Trigger's begin-overlap event, reads HealAmount, negates it, and applies it as damage to the overlapping actor. The preview says all nine ops are valid and it touches one asset.")
    r.you(2)
    r.tool("apply_ops", {"ops": ops}, result=lambda p, t: "applied %d ops, %d errors, %d warnings" % (len(p["results"]), p["compile_errors"], p["compile_warnings"]), shown_args="%d ops, atomic" % len(ops))
    r.tool("get_compile_status", {"asset_path": PICKUP}, result=lambda p, t: "BP_HealthPickup compiles: %s" % p["status"])
    r.refresh()
    tab(r, "EventGraph")
    r.hold(1.0)
    r.caption("The begin-overlap handler is in the graph, wired and compiled.", step=2)
    area = graph_area(r)
    if area:
        r.highlight((area.grow(-40, -30, -40, -60), "Heal handler", "c1", "above"))
    r.hold(2.5)
    r.clear()
    r.ai("Applied as one unit and compiled with 0 errors and 0 warnings. BP_HealthPickup now has a begin-overlap handler on its Trigger that reads HealAmount and applies it to the overlapping actor as negative damage.")
    r.note("The sample has no heal function, so the handler applies -HealAmount through ApplyDamage. The real run was preview_ops then apply_ops then get_compile_status (no compile_function).")


SCENES = {"read": read, "author": author, "atomic": atomic, "debug": debug, "pickup": pickup}
