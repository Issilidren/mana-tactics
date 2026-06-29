"""
gen_archives.py — Academy Archives (800×576, 2.5D oblique style)
Dark oak library: deep burgundy carpet, scroll racks, candlelight.
Right wall gap rows 8-10 = passage back to Hub.
Run: python scripts/gen_archives.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from iso_utils import *
from PIL import Image, ImageDraw
import math, random, pathlib

img = Image.new('RGB', (W, H), (10, 8, 18))
d = ImageDraw.Draw(img)

# ── Palette ───────────────────────────────────────────────────────────────────
WALL_BG    = (52, 33, 20)
WALL_TOP   = (72, 50, 32)
WALL_FACE  = (88, 60, 40)
WALL_LINE  = (36, 22, 12)
WALL_HIGH  = (108, 75, 50)

FLOOR_A    = (86, 60, 36)
FLOOR_B    = (70, 48, 26)
FLOOR_GRID = (58, 38, 20)
FLOOR_SPEC = (106, 76, 48)

CARPET     = (75, 26, 46)
CARPET_D   = (52, 16, 30)
CARPET_B   = (102, 46, 66)

WOOD_D     = (48, 28, 12)
WOOD_M     = (65, 40, 18)
WOOD_L     = (85, 56, 26)
WOOD_H     = (108, 76, 36)

SCROLL_TAN = (198, 172, 118)
SCROLL_D   = (158, 128, 78)

CANDLE_YEL = (255, 208, 78)
CANDLE_ORG = (218, 138, 38)
CANDLE_GLW = (178, 98, 18)

PORT_GLOW  = (55, 210, 195)
PORT_DARK  = (18, 105, 100)

STN1 = (86, 66, 46)
STN2 = (106, 85, 62)
STN3 = (132, 108, 80)

RPASS = {8, 9, 10}   # right wall gap — back to Hub

BOOK_COLS = [
    (158, 38, 38), (38, 78, 158), (38, 138, 58),
    (158, 118, 28), (118, 38, 158), (158, 78, 28),
    (38, 152, 142), (155, 155, 38), (138, 28, 68),
]


# =============================================================================
# 1. FLOOR — oak planks, depth-aware
# =============================================================================
for row in range(1, ROWS - 1):
    for col in range(1, COLS - 1):
        depth_t = (row - 1) / (ROWS - 3)
        base = lerp_color(FLOOR_SPEC, FLOOR_A, depth_t * 0.5)
        if (col + row) % 2 == 0:
            base = darken(base, 14)
        # Plank grain — subtle horizontal lines per 2 rows
        if row % 2 == 0 and col % 3 == 1:
            base = lighten(base, 5)
        d.rectangle([(tx(col), ty(row)), (tx(col + 1), ty(row + 1))], fill=base)
        d.line([(tx(col + 1) - 1, ty(row)), (tx(col + 1) - 1, ty(row + 1) - 1)],
               fill=FLOOR_GRID, width=1)
        d.line([(tx(col), ty(row + 1) - 1), (tx(col + 1) - 1, ty(row + 1) - 1)],
               fill=FLOOR_GRID, width=1)


# =============================================================================
# 2. WALLS — 3D faces
# =============================================================================
# North wall
for col in range(COLS):
    wall_n(d, col, WALL_TOP, WALL_FACE, WALL_LINE, WALL_HIGH)

# Left wall (solid — bookshelves fill this side)
for row in range(1, ROWS):
    wall_l(d, row, WALL_BG, WALL_FACE, WALL_LINE, WALL_HIGH)

# Right wall — gap at rows 8-10 (passage to Hub)
for row in range(1, ROWS):
    if row in RPASS:
        d.rectangle([(tx(24), ty(row)), (W, ty(row + 1))], fill=FLOOR_A)
    else:
        wall_r(d, row, WALL_BG, WALL_FACE, WALL_LINE, WALL_HIGH)

# Bottom wall (solid)
for col in range(COLS):
    wall_s(d, col, WALL_BG, WALL_LINE)

# Right passage portal glow
RPASS_X0 = tx(24) - 8
RPASS_Y0 = ty(8)
RPASS_Y1 = ty(11)
d.rectangle([(tx(24), RPASS_Y0), (W, RPASS_Y1)], fill=(18, 14, 28))
for bi, ry in enumerate(range(RPASS_Y0 + 8, RPASS_Y1 - 8, 14)):
    a = 0.55 - bi * 0.14
    gc = blend((18, 14, 28), PORT_GLOW, a)
    d.rectangle([(tx(24) + 4, ry), (W - 2, ry + 8)], fill=gc)
d.rectangle([(RPASS_X0, RPASS_Y0 - 4), (W, RPASS_Y0 + 4)], fill=GOLD)
d.rectangle([(RPASS_X0, RPASS_Y1 - 4), (W, RPASS_Y1 + 4)], fill=GOLD)
d.line([(RPASS_X0, RPASS_Y0), (RPASS_X0, RPASS_Y1)], fill=STN3, width=3)
KS_X = tx(24) + 12
KS_Y = (RPASS_Y0 + RPASS_Y1) // 2
d.polygon([(KS_X + 4, KS_Y - 6), (KS_X + 10, KS_Y),
           (KS_X + 4, KS_Y + 6), (KS_X - 2, KS_Y)], fill=GOLD)

# Wall–floor shadow
d.line([(0, TILE), (W, TILE)], fill=darken(WALL_LINE, 8), width=2)


# =============================================================================
# 3. BURGUNDY CARPET — center aisle (cols 9-15, rows 4-14)
# =============================================================================
CX0, CY0, CX1, CY1 = tx(9), ty(4), tx(16), ty(15)
d.rectangle([(CX0, CY0), (CX1, CY1)], fill=CARPET)
d.rectangle([(CX0, CY0), (CX1, CY1)], outline=GOLD, width=3)
d.rectangle([(CX0 + 5, CY0 + 5), (CX1 - 5, CY1 - 5)], outline=CARPET_B, width=2)

# Diamond grid pattern
for row in range(4, 15, 2):
    for col in range(9, 16, 2):
        cx4 = tx(col) + 16
        cy4 = ty(row) + 16
        d.polygon([(cx4, cy4 - 10), (cx4 + 10, cy4), (cx4, cy4 + 10), (cx4 - 10, cy4)],
                  outline=CARPET_B, width=1)


# =============================================================================
# 4. BOOKSHELVES — left wall (cols 1-3, rows 2-16)
# =============================================================================
random.seed(42)
for shelf_row in range(2, 16, 3):
    sx0, sy0 = tx(1), ty(shelf_row)
    sx1, sy1 = tx(4), ty(shelf_row + 3)
    depth_rect(d, sx0, sy0, sx1, sy1, WOOD_M, darken(WOOD_D, 10), depth=5)
    d.rectangle([(sx0, sy0), (sx1, sy0 + 5)], fill=WOOD_L)
    d.rectangle([(sx0, sy1 - 5), (sx1, sy1)], fill=WOOD_H)
    bx = sx0 + 3
    while bx < sx1 - 3:
        bw2 = random.randint(6, 11)
        bc = BOOK_COLS[random.randint(0, len(BOOK_COLS) - 1)]
        bx2 = min(bx + bw2, sx1 - 3)
        d.rectangle([(bx, sy0 + 6), (bx2, sy1 - 7)], fill=bc)
        d.line([(bx + 1, sy0 + 8), (bx + 1, sy1 - 9)],
               fill=lighten(bc, 42), width=1)
        bx = bx2 + 2
    d.rectangle([(sx0, sy0), (sx0 + 3, sy1)], fill=WOOD_D)
    d.rectangle([(sx1 - 3, sy0), (sx1, sy1)], fill=WOOD_D)
    d.rectangle([(sx0, sy0), (sx1, sy1)], outline=GOLD, width=1)


# =============================================================================
# 5. SCROLL RACKS — right wall (cols 21-23, rows 2-7; skip passage rows)
# =============================================================================
random.seed(77)
for rack_row in range(2, 16, 3):
    # Skip rows that overlap the right passage exit
    if any(r in RPASS for r in range(rack_row, rack_row + 3)):
        continue
    rx0, ry0 = tx(21), ty(rack_row)
    rx1, ry1 = tx(24), ty(rack_row + 3)
    depth_rect(d, rx0, ry0, rx1, ry1, WOOD_M, darken(WOOD_D, 10), depth=5)
    d.rectangle([(rx0, ry0), (rx1, ry0 + 5)], fill=WOOD_L)
    d.rectangle([(rx0, ry1 - 5), (rx1, ry1)], fill=WOOD_H)
    for sx in range(rx0 + 5, rx1 - 4, 11):
        d.ellipse([(sx, ry0 + 8), (sx + 8, ry1 - 8)], fill=SCROLL_TAN, outline=SCROLL_D)
        d.line([(sx + 4, ry0 + 8), (sx + 4, ry1 - 8)], fill=SCROLL_D, width=1)
    d.rectangle([(rx0, ry0), (rx0 + 3, ry1)], fill=WOOD_D)
    d.rectangle([(rx0, ry0), (rx1, ry1)], outline=GOLD, width=1)


# =============================================================================
# 6. READING TABLES with depth face (cols 10-14, rows 5-7 and 10-12)
# =============================================================================
for tr5, tc5 in [(5, 10), (10, 10)]:
    tx5, ty5 = tx(tc5), ty(tr5)
    tx6, ty6 = tx(tc5 + 5), ty(tr5 + 3)
    depth_rect(d, tx5, ty5, tx6, ty6, WOOD_L, darken(WOOD_M, 15), depth=8)
    d.rectangle([(tx5 + 3, ty5 + 3), (tx6 - 3, ty6 - 3)], fill=WOOD_M)
    for bx in range(tx5 + 8, tx6 - 8, 20):
        bc = BOOK_COLS[(bx // 20) % len(BOOK_COLS)]
        d.rectangle([(bx, ty5 + 8), (bx + 14, ty6 - 8)], fill=bc)
        d.line([(bx + 2, ty5 + 10), (bx + 2, ty6 - 10)],
               fill=lighten(bc, 35), width=1)
    d.rectangle([(tx5, ty5), (tx6, ty6)], outline=GOLD, width=1)


# =============================================================================
# 7. CANDLE SCONCES — left wall, with warm glow
# =============================================================================
for sconce_row in [3, 6, 9, 12, 15]:
    sx8 = tx(4) - 5
    sy8 = ty(sconce_row) + 16
    # Bracket
    d.rectangle([(sx8 - 6, sy8 - 2), (sx8 + 2, sy8 + 2)], fill=WOOD_D)
    # Candle body
    d.rectangle([(sx8 - 4, sy8 - 14), (sx8, sy8 - 2)], fill=(238, 228, 198))
    # Warm glow halo (drawn first, candle on top)
    for gr in range(20, 3, -4):
        a = (20 - gr) / 20.0
        gc7 = blend(FLOOR_A, CANDLE_GLW, a * 0.7)
        d.ellipse([(sx8 - gr, sy8 - 24 - gr), (sx8 + gr, sy8 - 12 + gr)], fill=gc7)
    # Flame
    d.ellipse([(sx8 - 5, sy8 - 24), (sx8 + 1, sy8 - 14)], fill=CANDLE_YEL)
    d.ellipse([(sx8 - 4, sy8 - 22), (sx8, sy8 - 16)], fill=CANDLE_ORG)
    # Candle re-drawn over glow
    d.rectangle([(sx8 - 4, sy8 - 14), (sx8, sy8 - 2)], fill=(238, 228, 198))
    # Wax drip
    d.ellipse([(sx8 - 4, sy8 - 4), (sx8, sy8 - 2)], fill=(220, 215, 185))


# =============================================================================
# 8. ARCHWAY SIGN above north wall center
# =============================================================================
SG_X0, SG_Y0 = tx(10), 2
SG_X1, SG_Y1 = tx(15), 28
d.rectangle([(SG_X0, SG_Y0), (SG_X1, SG_Y1)], fill=(28, 18, 10))
d.rectangle([(SG_X0, SG_Y0), (SG_X1, SG_Y1)], outline=GOLD, width=2)
# Horizontal text-like lines
for ly in range(SG_Y0 + 5, SG_Y1 - 5, 5):
    d.line([(SG_X0 + 4, ly), (SG_X1 - 4, ly)], fill=GOLD, width=1)


# =============================================================================
# 9. CORNER STONE BRACKETS
# =============================================================================
for cnx, cny in [(0, 0), (tx(24), 0), (0, ty(17)), (tx(24), ty(17))]:
    d.rectangle([(cnx, cny), (cnx + TILE, cny + TILE)], fill=STN1)
    d.rectangle([(cnx + 2, cny + 2), (cnx + TILE - 2, cny + TILE - 2)], fill=STN2)
    d.line([(cnx + 4, cny + 4), (cnx + TILE - 4, cny + 4)], fill=WALL_HIGH, width=1)
    d.ellipse([(cnx + TILE // 2 - 3, cny + TILE // 2 - 3),
               (cnx + TILE // 2 + 3, cny + TILE // 2 + 3)], fill=GOLD)


# =============================================================================
# 10. AMBIENT CANDLE GLOW on floor
# =============================================================================
CANDLE_POSITIONS = [(tx(4), ty(r) + 16) for r in [3, 6, 9, 12, 15]]
for cgx, cgy in CANDLE_POSITIONS:
    GLOW_R = 55
    for gy in range(max(TILE, cgy - GLOW_R), min(ty(ROWS - 1), cgy + GLOW_R)):
        for gx in range(max(TILE, cgx - GLOW_R), min(tx(COLS - 1), cgx + GLOW_R)):
            dist = math.sqrt((gx - cgx) ** 2 + (gy - cgy) ** 2)
            if dist < GLOW_R:
                t_glow = (1.0 - dist / GLOW_R) ** 2 * 0.18
                px_col = img.getpixel((gx, gy))
                img.putpixel((gx, gy), blend(px_col, CANDLE_ORG, t_glow))


# =============================================================================
# 11. HUD BAR
# =============================================================================
draw_hud_bar(d)


# =============================================================================
# SAVE
# =============================================================================
out = pathlib.Path(__file__).parent.parent / 'public' / 'assets' / 'archives-bg.png'
out.parent.mkdir(parents=True, exist_ok=True)
img.save(str(out))
print(f'Saved: {out}')
