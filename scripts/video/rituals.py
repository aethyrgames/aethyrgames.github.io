"""Reads the 19 Rituals out of data/docs-tutorials.json so titles, glyphs, ids and the user's lines are never retyped.

    python scripts/video/rituals.py            # prints one line per Ritual
"""
import json
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DATA = REPO / "data" / "docs-tutorials.json"

# Rituals shown with the troubleshooting accent (--warm): (4) debug, (10) batch-recover, (18) who-broke-it.
TROUBLESHOOT = {"debug", "batch-recover", "who-broke-it"}


@dataclass
class Turn:
    role: str  # "you" or "ai"
    who: str  # the label the page shows, e.g. "Aethyr · your AI"
    text: str  # plain text, tags removed, whitespace collapsed
    tools: list = field(default_factory=list)  # tool names from the "used a -> b -> c" line
    note: str = ""  # the rest of the tools line when it names no tools (for example "nothing was modified")


@dataclass
class Ritual:
    id: str
    number: int
    circled: str
    glyph: str
    title: str  # the short title from article.stories
    heading: str  # the full section heading without the circled number
    desc: str
    via: str
    kind: str  # "tutorial" or "troubleshoot"
    chats: list  # one list of Turn per .chat block on the page

    @property
    def turns(self):
        return self.chats[0] if self.chats else []

    @property
    def user_lines(self):
        return [t.text for t in self.turns if t.role == "you"]

    @property
    def url(self):
        return "aethyr.gg/docs/tutorials/#" + self.id


class _Chats(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.chats, self.depth = [], 0
        self.turn = None
        self.turn_depth = self.tools_depth = None
        self.in_who = self.in_b = False
        self.tools_text = ""
        self.names = []

    def handle_starttag(self, tag, attrs):
        cls = (dict(attrs).get("class") or "").split()
        if tag == "div":
            self.depth += 1
            if "chat" in cls:
                self.chats.append([])
            elif "turn" in cls and self.chats:
                self.turn = Turn("ai" if "ai" in cls else "you", "", "")
                self.turn_depth = self.depth
                self.parts = []
            elif "tools" in cls and self.turn:
                self.tools_depth = self.depth
                self.tools_text, self.names = "", []
        elif tag == "span" and "who" in cls and self.turn:
            self.in_who = True
        elif tag == "b" and self.tools_depth:
            self.in_b = True
            self.names.append("")

    def handle_endtag(self, tag):
        if tag == "span":
            self.in_who = False
        elif tag == "b":
            self.in_b = False
        elif tag == "div":
            if self.tools_depth == self.depth:
                self.tools_depth = None
                tools = self.turn.tools = [n for n in self.names if re.fullmatch(r"[a-z_0-9]+", n)]
                if not tools:
                    self.turn.note = re.sub(r"\s+", " ", self.tools_text).strip()
            if self.turn is not None and self.turn_depth == self.depth:
                self.turn.text = re.sub(r"\s+", " ", "".join(self.parts)).strip()
                self.chats[-1].append(self.turn)
                self.turn = None
            self.depth -= 1

    def handle_data(self, data):
        if self.turn is None:
            return
        if self.in_who:
            self.turn.who += data
        elif self.tools_depth:
            self.tools_text += data
            if self.in_b:
                self.names[-1] += data
        else:
            self.parts.append(data)


def load():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    article = data["article"]
    stories = {s["href"].lstrip("#"): s for s in article["stories"]}
    out = []
    for i, section in enumerate(article["sections"]):
        story = stories[section["id"]]
        parser = _Chats()
        parser.feed(section["html"])
        heading = re.sub(r"^[①-⑳]\s*", "", section["heading"])
        out.append(Ritual(
            id=section["id"], number=i + 1, circled=chr(0x2460 + i), glyph=story["glyph"],
            title=story["title"], heading=heading, desc=story["desc"],
            via=story.get("via", ""),
            kind="troubleshoot" if section["id"] in TROUBLESHOOT else "tutorial",
            chats=parser.chats,
        ))
    return out


def get(ritual_id):
    return next(r for r in load() if r.id == ritual_id)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    for r in load():
        print("%02d %s %-14s %-12s %s | %s" % (r.number, r.glyph, r.id, r.kind, r.title, r.user_lines[0][:60] if r.user_lines else ""))
        for chat in r.chats:
            for t in chat:
                if t.tools or t.note:
                    print("      tools:", " > ".join(t.tools) or "(" + t.note + ")")
