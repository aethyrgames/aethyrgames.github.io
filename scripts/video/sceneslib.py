"""The 19 Ritual scenes. Each one gets a Rec (record.py) and plays the Ritual's own sentences through real MCP calls while the
editor window is captured. User lines and the AI text come from data/docs-tutorials.json (rituals.py). Where a real run
disagrees with the Ritual's text, the scene passes its own AI text and r.note() records the difference for the report.
"""
import time


SAMPLES = "/Game/AethyrSamples"
ENEMY = SAMPLES + "/AI/BP_Enemy"
BOSS = SAMPLES + "/AI/BP_Boss"
TURRET = SAMPLES + "/AI/BP_Turret"
PICKUP = SAMPLES + "/Items/BP_HealthPickup"
LOOT = SAMPLES + "/Data/DT_Loot"


def tab(r, name):
    """Clicks a dock tab by its label (the topmost match, since My Blueprint lists graphs with the same names)."""
    hits = [x for x in r.find_all(name, "STextBlock", exact=True) if x.y < 200]
    hits.sort(key=lambda x: x.y)
    if not hits:
        raise RuntimeError("no tab %r" % name)
    r.click(hits[0], settle=0.7)
    return hits[0]


def graph_area(r):
    areas = [x for x in r.find_all("", "SGraphEditor")]
    areas.sort(key=lambda x: -x.w * x.h)
    return areas[0] if areas else None




def rows_of(r, names):
    panel = r.panel("SMyBlueprint")
    return [r.row(n, panel) for n in names]


def union(rects):
    out = rects[0]
    for x in rects[1:]:
        out = out.union(x)
    return out


def open_graph(r, name):
    """Double-clicks a function row in My Blueprint, which opens its graph in a tab."""
    r.double_click(rows_of(r, [name])[0], settle=1.2)


def table_row(r, row_name, width=580):
    """The full row of a DataTable editor list, found from its Row Name cell."""
    cell = r.find(row_name, "STextBlock", exact=True)
    from record import Rect
    return Rect(cell.x - 28, cell.y - 3, width, cell.h + 6)


def reopen(r, path, title=None):
    """Closes and reopens an asset's editor off the record. A DataTable, material or widget editor keeps showing what it loaded,
    so after Aethyr writes to the asset this is what a user does to see the change."""
    with r.cut():
        r.editor.py("unreal.get_editor_subsystem(unreal.AssetEditorSubsystem).close_all_editors_for_asset(unreal.load_asset(%r))" % path)
        r.open_asset(path, title)
