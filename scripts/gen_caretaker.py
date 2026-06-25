"""Generate npc-caretaker.png — Caretaker Elys, green-robed academy healer, 24x32px."""
from PIL import Image, ImageDraw
import pathlib

def gen_caretaker():
    img = Image.new('RGBA', (24, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    SKIN      = (220, 180, 140, 255)
    ROBE      = (55, 140, 100, 255)
    ROBE_SHD  = (35, 95, 68, 255)
    ROBE_TRIM = (180, 210, 150, 255)
    HAIR      = (235, 235, 230, 255)
    HAIR_SHD  = (180, 178, 170, 255)
    STAFF     = (120, 80, 40, 255)
    GEM       = (100, 210, 150, 255)
    GEM_GLOW  = (160, 240, 190, 255)
    OUTLINE   = (30, 25, 20, 255)
    SHOE      = (70, 50, 30, 255)

    # ── Hair (rows 0-3, cols 7-16) ─────────────────────────────────────────
    for c in range(8, 16):
        d.point((c, 0), HAIR)
        d.point((c, 1), HAIR)
    for c in range(7, 17):
        d.point((c, 2), HAIR)
        d.point((c, 3), HAIR_SHD)

    # ── Head (rows 4-9, cols 8-15) ────────────────────────────────────────
    for r in range(4, 10):
        for c in range(8, 16):
            d.point((c, r), SKIN)
    # Hair sides
    for r in range(4, 7):
        d.point((7, r), HAIR_SHD)
        d.point((16, r), HAIR_SHD)
    # Eyes (row 6)
    d.point((10, 6), (60, 40, 20, 255))
    d.point((13, 6), (60, 40, 20, 255))
    # Smile (row 8)
    d.point((10, 8), (180, 120, 90, 255))
    d.point((13, 8), (180, 120, 90, 255))

    # ── Collar (row 10) ───────────────────────────────────────────────────
    for c in range(9, 15):
        d.point((c, 10), ROBE_TRIM)

    # ── Body/robe (rows 11-26) ────────────────────────────────────────────
    for r in range(11, 27):
        spread = (r - 11) // 4
        lo = max(7 - spread, 5)
        hi = min(16 + spread, 18)
        for c in range(lo, hi + 1):
            d.point((c, r), ROBE)
        # Center shadow crease
        d.point((11, r), ROBE_SHD)
        d.point((12, r), ROBE_SHD)
        # Trim on hem edges
        if r > 22:
            d.point((lo, r), ROBE_TRIM)
            d.point((hi, r), ROBE_TRIM)

    # ── Left arm extended (rows 12-20, cols 4-6) ─────────────────────────
    for r in range(12, 21):
        for c in range(4, 7):
            d.point((c, r), ROBE_SHD)
    # Left hand
    for c in range(4, 7):
        d.point((c, 20), SKIN)
        d.point((c, 21), SKIN)

    # ── Right arm (rows 12-19, cols 18-20 — holding staff) ───────────────
    for r in range(12, 20):
        d.point((18, r), ROBE_SHD)
        d.point((19, r), ROBE_SHD)
    # Right hand gripping staff
    d.point((20, 18), SKIN)
    d.point((20, 19), SKIN)
    d.point((20, 20), SKIN)

    # ── Staff (col 21, full height, behind/beside body) ───────────────────
    for r in range(1, 30):
        d.point((21, r), STAFF)
    # Staff gem (top)
    d.point((21, 1), GEM_GLOW)
    d.point((21, 2), GEM)
    d.point((20, 2), GEM)
    d.point((22, 2), GEM)
    d.point((21, 3), GEM)

    # ── Feet/shoes (rows 27-31) ───────────────────────────────────────────
    for r in range(27, 30):
        for c in range(9, 15):
            d.point((c, r), ROBE_SHD)
    # Shoe tips
    d.point((9,  30), SHOE)
    d.point((10, 30), SHOE)
    d.point((10, 31), SHOE)
    d.point((13, 30), SHOE)
    d.point((14, 30), SHOE)
    d.point((13, 31), SHOE)

    return img

out = pathlib.Path(__file__).parent.parent / 'public' / 'assets' / 'sprites' / 'npc-caretaker.png'
out.parent.mkdir(parents=True, exist_ok=True)
gen_caretaker().save(out)
print(f'Saved: {out}')
