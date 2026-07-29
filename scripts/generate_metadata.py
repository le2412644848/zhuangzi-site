"""Extract lightweight metadata from all chapter JSONs."""
import json, os

SRC = os.path.join(os.path.dirname(__file__), "..", "src", "data", "chapters")
OUT = os.path.join(SRC, "metadata.json")

entries = []
for fname in sorted(os.listdir(SRC)):
    if not fname.endswith(".json"):
        continue
    with open(os.path.join(SRC, fname), encoding="utf-8") as f:
        ch = json.load(f)
    entries.append({
        "id": ch["id"],
        "title": ch["title"],
        "category": ch["category"],
        "order": ch["order"],
        "summary": ch["summary"],
        "conclusion": ch.get("conclusion"),
        "passageCount": len(ch.get("passages", [])),
    })

entries.sort(key=lambda e: e["order"])

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)

print(f"Generated {OUT} with {len(entries)} entries.")
