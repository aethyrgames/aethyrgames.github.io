"""Fail if any tool in the server's tools.json has no cookbook recipe.

Usage: python scripts/check-cookbook-coverage.py <path to Aethyr-MCP/docs/tools.json>
Run it for every release, next to scripts/sync-reference.py.
"""
import io, json, sys

tools_path = sys.argv[1] if len(sys.argv) > 1 else '../Aethyr-MCP/docs/tools.json'
tools = json.load(io.open(tools_path, encoding='utf-8'))
names = {t['name'] for t in tools}
cook = json.load(io.open('data/docs-cookbook.json', encoding='utf-8'))
used = set()
for sec in cook['article']['sections']:
    for spell in sec.get('spells', []):
        used.update(spell.get('tools', []))
missing = sorted(names - used)
unknown = sorted(used - names)
print(f'{len(names)} tools, {len(names & used)} covered by the cookbook')
if missing:
    print('No recipe for:', ', '.join(missing))
if unknown:
    print('Recipes name tools that do not exist:', ', '.join(unknown))
sys.exit(1 if missing or unknown else 0)
