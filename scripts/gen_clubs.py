"""
gen_clubs.py — 5 MTG club interior backgrounds (800×576, 2.5D oblique style)
Run: python scripts/gen_clubs.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from iso_utils import *
from PIL import Image, ImageDraw
import math, random

OUTPUT_DIR = r"C:\Users\Kenny\mana-tactics\public\assets"

# ── Per-club theme data ───────────────────────────────────────────────────────
THEMES = {
    "white": {
        "filename": "club-white-bg.png",
        "desc": "Solara Plains — cream stone, gold trim",
        "floor_a":  (244, 240, 226),
        "floor_b":  (228, 222, 206),
        "floor_g":  (205, 198, 180),
        "wall_top": (218, 212, 194),
        "wall_face":(232, 225, 208),
        "wall_bg":  (205, 198, 180),
        "wall_line":(178, 168, 148),
        "wall_hi":  (248, 244, 232),
        "carpet":   (210, 192, 88),
        "carpet_b": (238, 218, 118),
        "podium":   (245, 238, 220),
        "podium_t": (210, 178, 78),
        "crystal":  (255, 238, 145),
        "crystal_g":(245, 220, 90),
        "banner":   (238, 198, 78),
        "book_a":   (198, 158, 78),
        "book_b":   (238, 218, 138),
        "portal_g": (220, 198, 78),
        "wood":     (168, 138, 78),
    },
    "blue": {
        "filename": "club-blue-bg.png",
        "desc": "Tidefall Isles — cool slate, navy carpet",
        "floor_a":  (210, 220, 240),
        "floor_b":  (192, 204, 226),
        "floor_g":  (168, 180, 205),
        "wall_top": (148, 162, 192),
        "wall_face":(162, 178, 210),
        "wall_bg":  (138, 152, 182),
        "wall_line":(112, 128, 158),
        "wall_hi":  (188, 202, 230),
        "carpet":   (28, 78, 165),
        "carpet_b": (58, 118, 210),
        "podium":   (22, 54, 118),
        "podium_t": (55, 175, 178),
        "crystal":  (72, 195, 218),
        "crystal_g":(42, 158, 182),
        "banner":   (35, 92, 192),
        "book_a":   (38, 78, 158),
        "book_b":   (55, 175, 198),
        "portal_g": (55, 118, 218),
        "wood":     (78, 115, 175),
    },
    "black": {
        "filename": "club-black-bg.png",
        "desc": "Shadowmere Bog — dark stone, purple carpet",
        "floor_a":  (48, 38, 62),
        "floor_b":  (40, 30, 52),
        "floor_g":  (32, 24, 42),
        "wall_top": (35, 25, 50),
        "wall_face":(45, 32, 62),
        "wall_bg":  (30, 22, 44),
        "wall_line":(22, 15, 32),
        "wall_hi":  (68, 52, 88),
        "carpet":   (65, 22, 95),
        "carpet_b": (118, 55, 158),
        "podium":   (18, 14, 28),
        "podium_t": (138, 38, 195),
        "crystal":  (175, 55, 238),
        "crystal_g":(125, 30, 178),
        "banner":   (95, 18, 148),
        "book_a":   (58, 18, 78),
        "book_b":   (138, 38, 178),
        "portal_g": (118, 38, 178),
        "wood":     (55, 35, 75),
    },
    "red": {
        "filename": "club-red-bg.png",
        "desc": "Embercrest Peaks — volcanic stone, crimson carpet",
        "floor_a":  (88, 52, 32),
        "floor_b":  (72, 40, 22),
        "floor_g":  (58, 30, 15),
        "wall_top": (78, 40, 22),
        "wall_face":(95, 52, 30),
        "wall_bg":  (68, 35, 18),
        "wall_line":(48, 22, 10),
        "wall_hi":  (122, 75, 48),
        "carpet":   (158, 25, 18),
        "carpet_b": (218, 78, 38),
        "podium":   (58, 28, 18),
        "podium_t": (218, 98, 18),
        "crystal":  (252, 135, 18),
        "crystal_g":(198, 85, 15),
        "banner":   (195, 35, 18),
        "book_a":   (118, 38, 18),
        "book_b":   (195, 78, 18),
        "portal_g": (218, 78, 18),
        "wood":     (115, 58, 28),
    },
    "green": {
        "filename": "club-green-bg.png",
        "desc": "Thornveil Woods — wood planks, moss carpet",
        "floor_a":  (60, 78, 32),
        "floor_b":  (48, 65, 24),
        "floor_g":  (38, 52, 18),
        "wall_top": (52, 65, 28),
        "wall_face":(65, 80, 35),
        "wall_bg":  (45, 58, 22),
        "wall_line":(32, 42, 14),
        "wall_hi":  (88, 108, 52),
        "carpet":   (35, 92, 25),
        "carpet_b": (75, 155, 55),
        "podium":   (75, 95, 38),
        "podium_t": (75, 155, 38),
        "crystal":  (115, 215, 55),
        "crystal_g":(78, 162, 32),
        "banner":   (38, 135, 28),
        "book_a":   (38, 78, 18),
        "book_b":   (75, 155, 38),
        "portal_g": (55, 155, 38),
        "wood":     (88, 62, 28),
    },
}


def generate_club(name, t):
    img = Image.new('RGB', (W, H), t['floor_b'])
    d   = ImageDraw.Draw(img)

    # ── 1. Floor with depth shading ──────────────────────────────────────────
    for row in range(1, ROWS - 1):
        for col in range(1, COLS - 1):
            depth_t = (row - 1) / (ROWS - 3)
            base = lerp_color(t['floor_a'], t['floor_b'], depth_t * 0.4)
            if (col + row) % 2 == 0:
                base = darken(base, 10)
            d.rectangle([(tx(col), ty(row)), (tx(col + 1), ty(row + 1))], fill=base)
            d.line([(tx(col + 1) - 1, ty(row)), (tx(col + 1) - 1, ty(row + 1) - 1)],
                   fill=t['floor_g'], width=1)
            d.line([(tx(col), ty(row + 1) - 1), (tx(col + 1) - 1, ty(row + 1) - 1)],
                   fill=t['floor_g'], width=1)

    # ── 2. Walls with 3D faces ────────────────────────────────────────────────
    for col in range(COLS):
        wall_n(d, col, t['wall_top'], t['wall_face'], t['wall_line'], t['wall_hi'])

    for row in range(1, ROWS):
        wall_l(d, row, t['wall_bg'], lighten(t['wall_face'], 8), t['wall_line'], t['wall_hi'])
        wall_r(d, row, t['wall_bg'], lighten(t['wall_face'], 8), t['wall_line'], t['wall_hi'])

    # Bottom wall with portal gap (cols 11-13)
    for col in range(COLS):
        wall_s(d, col, t['wall_bg'], t['wall_line'], gap_cols={11, 12, 13})

    # Wall–floor shadow line
    d.line([(0, TILE), (W, TILE)], fill=darken(t['wall_line'], 8), width=2)

    # ── 3. Podium / raised platform (rows 1-2, full width) ───────────────────
    pod_col = t['podium']
    pod_face = darken(t['podium'], 25)
    # Top surface
    d.rectangle([(TILE, TILE), (W - TILE, TILE * 3)], fill=lighten(pod_col, 15))
    # 3D front face strip
    d.rectangle([(TILE, TILE * 3), (W - TILE, TILE * 3 + 8)], fill=pod_face)
    # Trim line
    d.rectangle([(TILE, TILE * 3 - 2), (W - TILE, TILE * 3)], fill=t['podium_t'])
    d.rectangle([(TILE, TILE), (TILE + 4, TILE * 3)], fill=darken(pod_col, 22))
    # Crystal in center
    cx2, cy2 = 400, 64
    d.ellipse([(cx2 - 14, cy2 - 14), (cx2 + 14, cy2 + 14)], fill=darken(t['crystal'], 35))
    d.ellipse([(cx2 - 10, cy2 - 10), (cx2 + 10, cy2 + 10)], fill=t['crystal'])
    d.ellipse([(cx2 - 5, cy2 - 7), (cx2 + 2, cy2 - 2)], fill=lighten(t['crystal'], 60))
    # Decorative dots on trim
    for dx in range(TILE + 20, W - TILE, 50):
        d.ellipse([(dx - 3, TILE * 3 - 6), (dx + 3, TILE * 3)], fill=t['podium_t'])

    # ── 4. Carpet (duel zone, rows 4-14, cols 4-20) ──────────────────────────
    CX0, CY0 = tx(4), ty(4)
    CX1, CY1 = tx(21), ty(15)
    d.rectangle([(CX0, CY0), (CX1, CY1)], fill=t['carpet'])
    d.rectangle([(CX0, CY0), (CX1, CY1)], outline=t['carpet_b'], width=4)
    d.rectangle([(CX0 + 6, CY0 + 6), (CX1 - 6, CY1 - 6)],
                outline=lighten(t['carpet'], 22), width=1)
    # Diamond center
    cx3, cy3 = (CX0 + CX1) // 2, (CY0 + CY1) // 2
    ds2 = 64
    d.polygon([(cx3, cy3 - ds2), (cx3 + ds2, cy3), (cx3, cy3 + ds2), (cx3 - ds2, cy3)],
              outline=t['carpet_b'], fill=None)
    ds3 = 32
    d.polygon([(cx3, cy3 - ds3), (cx3 + ds3, cy3), (cx3, cy3 + ds3), (cx3 - ds3, cy3)],
              outline=lighten(t['carpet'], 35), fill=None)
    # Corner gems
    for gx4, gy4 in [(CX0, CY0), (CX1, CY0), (CX0, CY1), (CX1, CY1)]:
        d.ellipse([(gx4 - 6, gy4 - 6), (gx4 + 6, gy4 + 6)],
                  fill=darken(t['crystal'], 20))
        d.ellipse([(gx4 - 4, gy4 - 4), (gx4 + 4, gy4 + 4)], fill=t['crystal'])
        d.ellipse([(gx4 - 2, gy4 - 5), (gx4 + 1, gy4 - 1)],
                  fill=lighten(t['crystal'], 50))

    # ── 5. Bookshelves (right wall, cols 21-23, rows 3-14) ───────────────────
    BSH_X0, BSH_X1 = tx(21), tx(24) - 2
    BSH_Y0, BSH_Y1 = ty(3), ty(15)
    d.rectangle([(BSH_X0, BSH_Y0), (BSH_X1, BSH_Y1)], fill=darken(t['wood'], 15))
    depth_rect(d, BSH_X0, BSH_Y0, BSH_X1, BSH_Y0 + 5,
               t['wood'], darken(t['wood'], 20), depth=4)
    random.seed(hash(name) % 1000)
    for si in range(4):
        sy0 = BSH_Y0 + si * TILE * 3
        sy1 = sy0 + TILE * 3
        d.rectangle([(BSH_X0, sy1 - 5), (BSH_X1, sy1)], fill=lighten(t['wood'], 15))
        bx = BSH_X0 + 4
        while bx < BSH_X1 - 4:
            bw2 = random.randint(8, 15)
            bc = lighten(t['book_a'], random.randint(0, 50)) if random.random() > 0.5 else t['book_b']
            bx2 = min(bx + bw2, BSH_X1 - 4)
            d.rectangle([(bx, sy0 + 6), (bx2, sy1 - 7)], fill=bc)
            d.line([(bx + 2, sy0 + 8), (bx + 2, sy1 - 9)],
                   fill=lighten(bc, 45), width=1)
            bx = bx2 + 2

    # ── 6. Banners (left wall, rows 3-14) ────────────────────────────────────
    banner_c  = t['banner']
    banner_d  = darken(banner_c, 35)
    banner_hi = lighten(banner_c, 30)
    bw2, bh2  = 26, 46
    for by_start in [ty(3) + 8, ty(8) + 8, ty(12) + 8]:
        bx5 = tx(1) + 4
        d.rectangle([(bx5, by_start), (bx5 + bw2, by_start + bh2)], fill=banner_c)
        d.rectangle([(bx5, by_start), (bx5 + bw2, by_start + bh2)],
                    outline=banner_d, width=2)
        d.rectangle([(bx5 + 4, by_start + 4), (bx5 + bw2 - 4, by_start + bh2 - 4)],
                    outline=banner_hi, width=1)
        mx5 = bx5 + bw2 // 2
        my5 = by_start + bh2 // 2
        d.line([(mx5, by_start + 8), (mx5, by_start + bh2 - 8)], fill=banner_d, width=2)
        d.line([(bx5 + 8, my5), (bx5 + bw2 - 8, my5)], fill=banner_d, width=2)
        for ddx, ddy in [(4, 4), (4, -4), (-4, 4), (-4, -4)]:
            d.ellipse([(mx5 + ddx - 2, my5 + ddy - 2),
                       (mx5 + ddx + 2, my5 + ddy + 2)], fill=banner_d)

    # ── 7. Portal door (bottom center, cols 11-13) ────────────────────────────
    PX0, PX1 = tx(11), tx(14)
    PY0, PY1 = ty(15), H
    PCX      = (PX0 + PX1) // 2
    PIL_W2   = 10
    pg       = t['portal_g']

    # Arch
    AARCH_TOP = PY0 - 18
    arch_pts2 = [
        (PX0, PY0), (PX0 + PIL_W2, PY0),
        (PCX - 6, AARCH_TOP + 6), (PCX, AARCH_TOP),
        (PCX + 6, AARCH_TOP + 6),
        (PX1 - PIL_W2, PY0), (PX1, PY0),
    ]
    # Pillars
    d.rectangle([(PX0, PY0), (PX0 + PIL_W2, PY1)], fill=darken(t['wall_top'], 10))
    d.rectangle([(PX1 - PIL_W2, PY0), (PX1, PY1)], fill=darken(t['wall_top'], 10))
    d.polygon(arch_pts2, fill=t['wall_top'])
    d.line(arch_pts2 + [arch_pts2[0]], fill=lighten(t['wall_top'], 18), width=1)
    d.polygon([(PCX - 4, AARCH_TOP + 4), (PCX + 4, AARCH_TOP + 4),
               (PCX + 3, AARCH_TOP + 12), (PCX - 3, AARCH_TOP + 12)], fill=GOLD)

    # Portal glow interior
    GX0, GX1 = PX0 + PIL_W2, PX1 - PIL_W2
    dark_pg = darken(pg, 50)
    d.rectangle([(GX0, PY0), (GX1, PY1)], fill=dark_pg)
    for ri in range(6, 32, 6):
        a5 = 1.0 - ri / 32.0
        gc5 = blend(dark_pg, pg, a5)
        mid5x = (GX0 + GX1) // 2
        mid5y = (PY0 + PY1) // 2
        d.ellipse([(mid5x - ri, mid5y - ri), (mid5x + ri, mid5y + ri)],
                  outline=gc5, width=1)
    mid5x = (GX0 + GX1) // 2
    mid5y = (PY0 + PY1) // 2
    d.ellipse([(mid5x - 16, mid5y - 16), (mid5x + 16, mid5y + 16)], fill=pg)
    d.ellipse([(mid5x - 6, mid5y - 6), (mid5x + 6, mid5y + 6)],
              fill=lighten(pg, 60))

    # ── 8. Study tables (4 positions) ────────────────────────────────────────
    for col6, row6 in [(5, 6), (18, 6), (5, 12), (18, 12)]:
        cx6 = tx(col6) + TILE // 2
        cy6 = ty(row6) + TILE // 2
        R6  = 24
        d.ellipse([(cx6 - R6 + 4, cy6 - R6 // 2 + 6), (cx6 + R6 + 4, cy6 + R6 // 2 + 6)],
                  fill=darken(t['wood'], 30))
        d.ellipse([(cx6 - R6, cy6 - R6 // 2), (cx6 + R6, cy6 + R6 // 2)],
                  fill=t['wood'])
        d.ellipse([(cx6 - R6 + 3, cy6 - R6 // 2 + 2), (cx6 + R6 - 3, cy6 + R6 // 2 - 2)],
                  fill=lighten(t['wood'], 22))
        d.ellipse([(cx6 - R6, cy6 - R6 // 2), (cx6 + R6, cy6 + R6 // 2)],
                  outline=darken(t['wood'], 28), width=1)

    # ── 9. HUD bar ───────────────────────────────────────────────────────────
    draw_hud_bar(d)

    # ── Save ──────────────────────────────────────────────────────────────────
    out_path = os.path.join(OUTPUT_DIR, t['filename'])
    img.save(out_path)
    print(f'  Saved: {t["filename"]} ({t["desc"]})')


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print('Generating club backgrounds...')
    for name, t in THEMES.items():
        generate_club(name, t)
    print('Done — 5 clubs generated.')


if __name__ == '__main__':
    main()
