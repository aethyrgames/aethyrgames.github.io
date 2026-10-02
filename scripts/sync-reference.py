#!/usr/bin/env python3
"""Rewrite the tool list in data/docs-reference.json from the main repo's docs/tools.json.

Usage:  python scripts/sync-reference.py <path to Aethyr-MCP>/docs/tools.json

Only the "categories" array of the first section (the one with id "tools") changes.
Every other line in the file stays as it is. Run it once per release.
"""
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TARGET = REPO / "data" / "docs-reference.json"

# tools.json category -> heading on the page. Anything not listed is title-cased.
LABELS = {"cpp": "C++", "epic": "Bridge"}
ABBREVIATIONS = {"e.g", "i.e", "etc", "vs", "approx", "cf"}


def first_sentence(text):
    text = re.sub(r"^\[[^\]]*\]\s*", "", text or "")
    text = re.sub(r"\s+", " ", text.replace("`", "")).strip()
    for m in re.finditer(r"[.!?](?=\s|$)", text):
        word = re.search(r"([A-Za-z.]+)$", text[: m.start()])
        if word and word.group(1).lower().rstrip(".") in ABBREVIATIONS:
            continue
        return shorten(text[: m.end()])
    return shorten(text)


def shorten(sentence, limit=200):
    """Cut a very long first sentence at its last clause break (outside parentheses) under the limit."""
    if len(sentence) <= limit:
        return sentence
    depth, cuts = 0, []
    for i, ch in enumerate(sentence[:limit]):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        elif ch in ",;:" and depth == 0 and i >= 60:
            cuts.append(i)
    if cuts:
        return sentence[: cuts[-1]] + "."
    head = sentence[:limit].rsplit(" ", 1)[0]
    if head.count("(") > head.count(")"):
        head = head[: head.rindex("(")].rstrip(" ,;:")
    return head + "..."


def label(category):
    return LABELS.get(category, category.title())


def build_block(tools):
    groups = {}
    for t in tools:
        groups.setdefault(t["category"], []).append(t)
    out = ['        "categories": [']
    ordered = sorted(groups, key=lambda c: (-len(groups[c]), label(c)))
    for ci, cat in enumerate(ordered):
        items = sorted(groups[cat], key=lambda t: t["name"])
        out.append("          {")
        out.append('            "name": %s,' % json.dumps(label(cat), ensure_ascii=False))
        out.append('            "count": %d,' % len(items))
        out.append('            "tools": [')
        for ti, t in enumerate(items):
            comma = "," if ti < len(items) - 1 else ""
            out.append(
                '              { "name": %s, "description": %s }%s'
                % (
                    json.dumps(t["name"], ensure_ascii=False),
                    json.dumps(first_sentence(t.get("description", "")), ensure_ascii=False),
                    comma,
                )
            )
        out.append("            ]")
        out.append("          }" + ("," if ci < len(ordered) - 1 else ""))
    out.append("        ]")
    return out


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    tools = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    if isinstance(tools, dict):
        tools = tools["tools"]
    text = TARGET.read_text(encoding="utf-8")
    lines = text.split("\n")
    start = next(i for i, l in enumerate(lines) if l == '        "categories": [')
    end = next(i for i in range(start + 1, len(lines)) if lines[i] == "        ]")
    lines[start : end + 1] = build_block(tools)
    new = "\n".join(lines)
    json.loads(new)  # refuse to write invalid JSON
    TARGET.write_text(new, encoding="utf-8", newline="")
    print("wrote %d tools in %d categories" % (len(tools), len({t["category"] for t in tools})))


if __name__ == "__main__":
    main()
