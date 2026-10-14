"""Registry of the 19 Ritual scenes. Each scene function takes a Rec (record.py). See sceneslib.py for helpers."""
import scenes_a
import scenes_b
import scenes_c

SCENES = {}
for module in (scenes_a, scenes_b, scenes_c):
    SCENES.update(module.SCENES)
