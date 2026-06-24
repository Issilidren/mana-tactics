"""
Fetches Scryfall small-image URLs for every card in Supabase
and writes them back via the REST API.

Run once:  powershell.exe -Command "python 'C:\\Users\\Kenny\\mana-tactics\\scripts\\add-image-urls.py'"

Prereq: ALTER TABLE cards ADD COLUMN IF NOT EXISTS image_url varchar;
        (paste that line into the Supabase SQL editor and run it first)
"""

import json, time, urllib.request, urllib.parse, os

# ── Read .env ────────────────────────────────────────────────────────────
ENV_PATH = r"C:\Users\Kenny\mana-tactics\.env"
env = {}
with open(ENV_PATH) as f:
    for line in f:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

SUPABASE_URL = env["VITE_SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = env["VITE_SUPABASE_ANON_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def sb_get(path):
    req = urllib.request.Request(SUPABASE_URL + path, headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def sb_patch(path, data):
    body = json.dumps(data).encode()
    h = {**HEADERS, "Content-Type": "application/json"}
    req = urllib.request.Request(SUPABASE_URL + path, data=body, headers=h, method="PATCH")
    with urllib.request.urlopen(req) as r:
        return r.status

def scryfall_image(name):
    """Returns the small-image URL for a card name, or None on failure."""
    url = "https://api.scryfall.com/cards/named?exact=" + urllib.parse.quote(name)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ManaTactics/1.0", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        # standard single-face card
        if "image_uris" in data:
            return data["image_uris"].get("small") or data["image_uris"].get("normal")
        # double-faced card — use front face
        if "card_faces" in data and data["card_faces"]:
            face = data["card_faces"][0]
            if "image_uris" in face:
                return face["image_uris"].get("small") or face["image_uris"].get("normal")
    except Exception as e:
        print(f"  Scryfall error for '{name}': {e}")
    return None

# ── Fetch all cards that don't yet have an image_url ────────────────────
print("Fetching cards from Supabase…")
cards = sb_get("/rest/v1/cards?select=id,name,image_url&order=name.asc")
missing = [c for c in cards if not c.get("image_url")]
print(f"{len(missing)} cards need image URLs  ({len(cards) - len(missing)} already done)")

ok = 0
fail = 0
for i, card in enumerate(missing):
    print(f"[{i+1}/{len(missing)}] {card['name']}", end="  ", flush=True)
    img = scryfall_image(card["name"])
    if img:
        sb_patch(f"/rest/v1/cards?id=eq.{card['id']}", {"image_url": img})
        print("OK")
        ok += 1
    else:
        print("SKIP (not found)")
        fail += 1
    time.sleep(0.2)    # respect Scryfall rate limit

print(f"\nDone — {ok} updated, {fail} skipped.")
