"""
gen_hub.py — Mana Academy hub interior (800×576, 2.5D oblique style)
Run: python scripts/gen_hub.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from iso_utils import *
from PIL import Image, ImageDraw
import math, random

img = Image.new('RGB', (W, H), (15, 17, 28))
d = ImageDraw.Draw(img)

# ── Palette ───────────────────────────────────────────────────────────────────
WALL_TOP   = (148, 132, 102)   # top cap of north wall
WALL_FACE  = (118,  100,  72)   # front face of north wall
WALL_BG    = (105,  89,  60)    # body of left/right walls
WALL_FACE2 = (125, 106,  78)   # east/west visible face
WALL_LINE  = ( 80,  66,  42)
WALL_HIGH  = (168, 150, 112)

FLOOR_A    = (196, 164, 105)   # warm tan
FLOOR_B    = (172, 144,  88)   # slightly darker alt tile
FLOOR_GRID = (145, 122,  68)
FLOOR_FAR  = (208, 178, 118)   # lighter (far/top — ceiling light)
FLOOR_NEAR = (182, 152,  94)   # darker (near/bottom — depth shadow)

WOOD_D = ( 88,  55,  26)
WOOD_M = (112,  72,  36)
WOOD_L = (138, 102,  20)
WOOD_H = (162, 128,  42)

CRYS_TEAL  = ( 40, 222, 195)
CRYS_BLUE  = ( 60, 198, 240)
CRYS_PURP  = (140,  78, 220)
CRYS_WHITE = (215, 238, 255)
GLOW_TEAL  = ( 55, 192, 172)
GLOW_BLUE  = ( 80, 158, 218)

PORT_ARCH  = ( 65,  70,  90)
PORT_GLOW  = ( 55, 210, 195)
PORT_INNER = ( 30, 165, 155)
PORT_DARK  = ( 18, 105, 100)
PORT_SHINE = (142, 255, 242)

BOOK_COLS = [
    (195, 55, 55), (55, 115, 195), (55, 175, 80),
    (210, 160, 40), (145, 60, 195), (195, 105, 40),
    (55, 195, 185), (215, 215, 55), (165, 48, 88),
]

STN0 = ( 82,  70,  48)
STN1 = (102,  88,  62)
STN2 = (126, 110,  80)
STN3 = (152, 136, 102)

RUG_RED  = (148,  42,  42)
RUG_GOLD = (188, 145,  40)
RUG_DARK = (108,  28,  28)


# =============================================================================
# 1. FLOOR TILES — depth-aware shading (lighter toward back/top wall)
# =============================================================================
for row in range(1, ROWS - 1):
    for col in range(1, COLS - 1):
        depth_t = (row - 1) / (ROWS - 3)          # 0 = far (row 1), 1 = near (row 16)
        far_mix = 1.0 - depth_t * 0.18
        cx_off  = abs((col - 12) / 12.0) * 0.08   # slight darkening at edges

        base = lerp_color(FLOOR_A, FLOOR_B, depth_t * 0.4 + cx_off)
        if (col + row) % 2 == 0:
            base = darken(base, 12)

        # Subtle center-glow from nexus at col 12, rows 8-9
        ncx = (col - 12) / 12.0
        ncy = (row - 8.5) / 8.5
        ndist = math.sqrt(ncx * ncx + ncy * ncy)
        if ndist < 0.6:
            t = (0.6 - ndist) / 0.6 * 0.12
            base = blend(base, CRYS_TEAL, t)

        d.rectangle([(tx(col), ty(row)), (tx(col + 1), ty(row + 1))], fill=base)
        d.line([(tx(col + 1) - 1, ty(row)), (tx(col + 1) - 1, ty(row + 1) - 1)],
               fill=FLOOR_GRID, width=1)
        d.line([(tx(col), ty(row + 1) - 1), (tx(col + 1) - 1, ty(row + 1) - 1)],
               fill=FLOOR_GRID, width=1)


# =============================================================================
# 2. WALLS — 3D faces
# =============================================================================
# -- North wall (row 0) -------------------------------------------------------
for col in range(COLS):
    wall_n(d, col, WALL_TOP, WALL_FACE, WALL_LINE, WALL_HIGH)

# -- Left wall — gap rows 8-10 (Archives passage) ----------------------------
LPASS = {8, 9, 10}
for row in range(1, ROWS):
    if row in LPASS:
        d.rectangle([(0, ty(row)), (TILE, ty(row + 1))], fill=FLOOR_A)
    else:
        wall_l(d, row, WALL_BG, WALL_FACE2, WALL_LINE, WALL_HIGH)

# Archives passage portal glow
LPASS_Y0 = ty(8)
LPASS_Y1 = ty(11)
d.rectangle([(0, LPASS_Y0), (26, LPASS_Y1)], fill=(18, 14, 28))
for bi, ry in enumerate(range(LPASS_Y0 + 8, LPASS_Y1 - 8, 14)):
    a = 0.55 - bi * 0.14
    gc = blend((18, 14, 28), PORT_GLOW, a)
    d.rectangle([(2, ry), (22, ry + 8)], fill=gc)
d.rectangle([(0, LPASS_Y0 - 4), (38, LPASS_Y0 + 4)], fill=GOLD)
d.rectangle([(0, LPASS_Y1 - 4), (38, LPASS_Y1 + 4)], fill=GOLD)
d.line([(38, LPASS_Y0), (38, LPASS_Y1)], fill=STN3, width=3)
KS_Y = (LPASS_Y0 + LPASS_Y1) // 2
d.polygon([(8, KS_Y - 6), (14, KS_Y), (8, KS_Y + 6), (4, KS_Y)], fill=GOLD)

# -- Right wall (col 24) ------------------------------------------------------
for row in range(1, ROWS):
    wall_r(d, row, WALL_BG, WALL_FACE2, WALL_LINE, WALL_HIGH)

# -- Bottom wall — gap cols 11-13 (portal) ------------------------------------
PORTAL_GAP = {11, 12, 13}
for col in range(COLS):
    wall_s(d, col, WALL_BG, WALL_LINE, gap_cols=PORTAL_GAP)

# Wall–floor border (subtle shadow under north wall face)
d.line([(0, TILE), (W, TILE)], fill=darken(WALL_LINE, 5), width=2)


# =============================================================================
# 3. CENTRAL RUG / DAIS
# =============================================================================
RUG_CX, RUG_CY = tx(12) + TILE // 2, ty(8) + TILE + TILE // 2
RUG_R = 94
for y in range(int(RUG_CY - RUG_R), int(RUG_CY + RUG_R) + 1):
    for x in range(int(RUG_CX - RUG_R), int(RUG_CX + RUG_R) + 1):
        dist = math.sqrt((x - RUG_CX)**2 + (y - RUG_CY)**2)
        if dist <= RUG_R and dist > RUG_R - 10:
            d.point((x, y), fill=RUG_GOLD)
        elif dist <= RUG_R - 10 and dist > RUG_R - 20:
            d.point((x, y), fill=RUG_DARK)
        elif dist <= RUG_R - 20 and dist > RUG_R - 30:
            d.point((x, y), fill=RUG_RED)
        elif dist <= RUG_R - 30:
            d.point((x, y), fill=RUG_DARK)
for i in range(8):
    angle = math.radians(i * 45)
    ex2 = int(RUG_CX + (RUG_R - 5) * math.cos(angle))
    ey2 = int(RUG_CY + (RUG_R - 5) * math.sin(angle))
    d.line([(int(RUG_CX + 36 * math.cos(angle)), int(RUG_CY + 36 * math.sin(angle))),
            (ex2, ey2)], fill=RUG_GOLD, width=1)
for r in [RUG_R, RUG_R - 10, RUG_R - 20, RUG_R - 30]:
    d.ellipse([(RUG_CX - r, RUG_CY - r), (RUG_CX + r, RUG_CY + r)], outline=GOLD, width=1)


# =============================================================================
# 4. CRYSTAL NEXUS — raised dais with 3D base
# =============================================================================
FNX, FNY = tx(12) + TILE // 2, ty(8) + TILE

# Shadow under dais
d.ellipse([(FNX - 54, FNY - 20), (FNX + 54, FNY + 16)], fill=(22, 24, 36))

# Stone dais — 3D concentric rings with visible front face
DAIS_R = 48
for ri, (top_c, face_c) in [
    (DAIS_R,      (STN1, darken(STN1, 20))),
    (DAIS_R - 6,  (STN2, darken(STN2, 15))),
    (DAIS_R - 12, (STN3, darken(STN3, 10))),
]:
    d.ellipse([(FNX - ri, FNY - ri // 2), (FNX + ri, FNY + ri // 2)], fill=top_c)
    # Front face arc (bottom half of ellipse, offset down)
    d.ellipse([(FNX - ri, FNY - ri // 2 + 6), (FNX + ri, FNY + ri // 2 + 6)], fill=face_c)
    d.ellipse([(FNX - ri, FNY - ri // 2), (FNX + ri, FNY + ri // 2)], fill=top_c)
    d.ellipse([(FNX - ri, FNY - ri // 2), (FNX + ri, FNY + ri // 2)],
              outline=WALL_LINE, width=1)

# Rune ring
for i in range(12):
    angle = math.radians(i * 30)
    rx = int(FNX + (DAIS_R - 18) * math.cos(angle))
    ry = int(FNY + (DAIS_R // 2 - 9) * math.sin(angle))
    d.ellipse([(rx - 2, ry - 2), (rx + 2, ry + 2)], fill=GLOW_TEAL)


def draw_crystal(cx, cy, w, h, col, hi, shadow_col):
    pts = [(cx, cy - h), (cx + w, cy - h // 4), (cx + w // 2, cy),
           (cx - w // 2, cy), (cx - w, cy - h // 4)]
    d.polygon(pts, fill=col)
    d.polygon([(cx, cy - h), (cx + w, cy - h // 4), (cx + w // 2, cy - h // 2)], fill=hi)
    d.polygon([(cx, cy - h), (cx - w, cy - h // 4), (cx - w // 2, cy - h // 2)], fill=shadow_col)
    d.line([(cx, cy - h), (cx + w, cy - h // 4), (cx + w // 2, cy), (cx - w // 2, cy),
            (cx - w, cy - h // 4), (cx, cy - h)], fill=CRYS_WHITE, width=1)


# Glow halos
for r in [54, 38, 22]:
    d.ellipse([(FNX - r, FNY - r - 12), (FNX + r, FNY + r - 12)], outline=GLOW_TEAL, width=1)

# Crystal cluster (main + satellite)
draw_crystal(FNX, FNY - 28, 10, 40, CRYS_TEAL, (162, 250, 238), (24, 154, 144))
draw_crystal(FNX - 19, FNY - 10, 7, 26, CRYS_BLUE, (162, 222, 255), (34, 128, 186))
draw_crystal(FNX + 19, FNY - 10, 7, 26, CRYS_PURP, (200, 155, 255), (88, 40, 165))
draw_crystal(FNX - 31, FNY - 4, 5, 16, CRYS_WHITE, (238, 248, 255), (165, 192, 220))
draw_crystal(FNX + 31, FNY - 4, 5, 16, CRYS_TEAL, (180, 248, 235), (28, 148, 134))
draw_crystal(FNX + 8, FNY - 34, 5, 14, CRYS_PURP, (195, 152, 248), (86, 38, 158))
draw_crystal(FNX - 8, FNY - 32, 5, 14, CRYS_BLUE, (155, 215, 255), (32, 124, 180))
draw_crystal(FNX - 14, FNY - 12, 6, 22, (212, 48, 58), (255, 118, 128), (140, 20, 30))
draw_crystal(FNX + 14, FNY - 12, 6, 22, (50, 180, 70), (130, 230, 140), (25, 108, 40))
draw_crystal(FNX + 4, FNY - 40, 4, 12, (222, 242, 255), (255, 255, 255), (160, 188, 220))

# Mana beam spokes
for color, angle in [
    ((255, 255, 220), 270), ((30, 144, 255), 30), ((138, 43, 226), 150),
    ((220, 60, 40), 210), ((55, 180, 55), 330),
]:
    bx = int(FNX + 40 * math.cos(math.radians(angle)))
    by = int(FNY - 22 + 40 * math.sin(math.radians(angle)))
    d.line([(FNX, FNY - 22), (bx, by)], fill=color, width=1)

# Sparkles
random.seed(42)
for _ in range(36):
    a = random.uniform(0, math.pi * 2)
    r2 = random.uniform(22, 60)
    sx = int(FNX + r2 * math.cos(a))
    sy = int(FNY - 8 + r2 * 0.5 * math.sin(a))
    sc = random.choice([CRYS_WHITE, CRYS_TEAL, CRYS_BLUE, GLOW_TEAL])
    sz = random.randint(1, 2)
    d.ellipse([(sx - sz, sy - sz), (sx + sz, sy + sz)], fill=sc)


# =============================================================================
# 5. LIBRARIAN COUNTER — 3D depth face
# =============================================================================
CTR_X0, CTR_Y0 = tx(1), ty(1)
CTR_X1, CTR_Y1 = tx(7), ty(5)

# Shadow
d.rectangle([(CTR_X0 + 5, CTR_Y0 + 5), (CTR_X1 + 5, CTR_Y1 + 8)], fill=(28, 30, 42))
# Counter body with 3D depth face
depth_rect(d, CTR_X0, CTR_Y0, CTR_X1, CTR_Y1, WOOD_M, darken(WOOD_D, 10), depth=10)
# Counter top surface
d.rectangle([(CTR_X0 + 4, CTR_Y0 + 4), (CTR_X1 - 4, CTR_Y0 + 26)], fill=WOOD_L)
# Wood grain
for gy in range(CTR_Y0 + 32, CTR_Y1 - 4, 9):
    d.line([(CTR_X0 + 4, gy), (CTR_X1 - 4, gy)], fill=WOOD_D, width=1)
# Border
d.rectangle([(CTR_X0, CTR_Y0), (CTR_X1, CTR_Y1)], outline=WOOD_H, width=1)

# Items on counter
INK_X, INK_Y = CTR_X0 + 20, CTR_Y0 + 14
d.rectangle([(INK_X - 6, INK_Y - 8), (INK_X + 6, INK_Y + 4)], fill=(22, 22, 35))
d.ellipse([(INK_X - 3, INK_Y - 11), (INK_X + 3, INK_Y - 7)], fill=(180, 195, 220))
d.line([(INK_X + 4, INK_Y - 8), (INK_X + 14, INK_Y - 23)], fill=(230, 225, 200), width=2)

BK_X0 = CTR_X0 + 42
d.rectangle([(BK_X0, CTR_Y0 + 8), (BK_X0 + 38, CTR_Y0 + 20)], fill=(88, 48, 18))
d.rectangle([(BK_X0 + 2, CTR_Y0 + 10), (BK_X0 + 36, CTR_Y0 + 18)], fill=(115, 65, 25))
d.line([(BK_X0 + 6, CTR_Y0 + 8), (BK_X0 + 6, CTR_Y0 + 20)], fill=(72, 38, 12), width=2)

CND_X, CND_Y = CTR_X0 + 92, CTR_Y0 + 12
d.rectangle([(CND_X - 3, CND_Y), (CND_X + 3, CND_Y + 16)], fill=(230, 225, 200))
d.polygon([(CND_X - 4, CND_Y - 8), (CND_X + 4, CND_Y - 8),
           (CND_X + 2, CND_Y - 14), (CND_X, CND_Y - 18), (CND_X - 2, CND_Y - 14)],
          fill=(242, 160, 40))


# =============================================================================
# 6. BOOKSHELVES — right wall, 3D spines
# =============================================================================
BSH_X0, BSH_X1 = tx(21), tx(24) - 2
BSH_Y0, BSH_Y1 = ty(2), ty(15)

d.rectangle([(BSH_X0, BSH_Y0), (BSH_X1, BSH_Y1)], fill=WOOD_D)
# Shelf cap and face
depth_rect(d, BSH_X0, BSH_Y0, BSH_X1, BSH_Y0 + 6, WOOD_L, darken(WOOD_D, 10), depth=4)

SHELF_H = TILE * 3
random.seed(42)
for shelf_i in range(4):
    sy0 = BSH_Y0 + shelf_i * SHELF_H
    sy1 = sy0 + SHELF_H
    d.rectangle([(BSH_X0, sy1 - 6), (BSH_X1, sy1)], fill=WOOD_H)
    d.line([(BSH_X0, sy1 - 7), (BSH_X1, sy1 - 7)], fill=WOOD_D, width=1)
    bx = BSH_X0 + 4
    bi = shelf_i * 7
    while bx < BSH_X1 - 4:
        bw2 = random.randint(8, 16)
        bc = BOOK_COLS[bi % len(BOOK_COLS)]
        bi += 1
        bx2 = min(bx + bw2, BSH_X1 - 4)
        d.rectangle([(bx, sy0 + 8), (bx2, sy1 - 8)], fill=bc)
        d.line([(bx + 2, sy0 + 10), (bx + 2, sy1 - 10)],
               fill=lighten(bc, 50), width=1)
        d.rectangle([(bx, sy0 + 8), (bx2, sy0 + 12)], fill=darken(bc, 22))
        bx = bx2 + 2

d.rectangle([(BSH_X0, BSH_Y0), (BSH_X0 + 4, BSH_Y1)], fill=WOOD_M)
d.rectangle([(BSH_X0, BSH_Y0), (BSH_X1, BSH_Y0 + 6)], fill=WOOD_L)


# =============================================================================
# 7. LEFT WALL BOOKSHELVES (cols 1-3, rows 5-14)
# =============================================================================
LBSH_X0, LBSH_X1 = tx(1), tx(4) - 2
LBSH_Y0, LBSH_Y1 = ty(5), ty(14)

d.rectangle([(LBSH_X0, LBSH_Y0), (LBSH_X1, LBSH_Y1)], fill=WOOD_D)
random.seed(77)
for shelf_i in range(3):
    sy0 = LBSH_Y0 + shelf_i * TILE * 3
    sy1 = min(sy0 + TILE * 3, LBSH_Y1)
    d.rectangle([(LBSH_X0, sy1 - 6), (LBSH_X1, sy1)], fill=WOOD_H)
    bx = LBSH_X0 + 3
    bi = shelf_i * 5 + 3
    while bx < LBSH_X1 - 3:
        bw2 = random.randint(7, 13)
        bc = BOOK_COLS[bi % len(BOOK_COLS)]
        bi += 1
        bx2 = min(bx + bw2, LBSH_X1 - 3)
        d.rectangle([(bx, sy0 + 6), (bx2, sy1 - 7)], fill=bc)
        d.line([(bx + 1, sy0 + 8), (bx + 1, sy1 - 9)],
               fill=lighten(bc, 40), width=1)
        bx = bx2 + 2

d.rectangle([(LBSH_X0, LBSH_Y0), (LBSH_X1, LBSH_Y0 + 6)], fill=WOOD_L)
d.rectangle([(LBSH_X1 - 4, LBSH_Y0), (LBSH_X1, LBSH_Y1)], fill=WOOD_M)
# Clear passage rows
for row in {8, 9, 10}:
    d.rectangle([(LBSH_X0, ty(row)), (LBSH_X0 + 20, ty(row + 1))], fill=FLOOR_A)
    for gi in range(3):
        gx = LBSH_X0 + gi * 7
        gc = blend(FLOOR_A, PORT_GLOW, 0.2 - gi * 0.05)
        d.rectangle([(gx, ty(row) + 4), (gx + 9, ty(row + 1) - 4)], fill=gc)


# =============================================================================
# 8. CARD SHOP BOOTH (cols 19-22, rows 2-5)
# =============================================================================
SHOP_X0, SHOP_Y0 = tx(19), ty(2)
SHOP_X1, SHOP_Y1 = tx(22), ty(6)

d.rectangle([(SHOP_X0 + 4, SHOP_Y0 + 5), (SHOP_X1 + 5, SHOP_Y1 + 5)], fill=(65, 55, 38))
depth_rect(d, SHOP_X0, SHOP_Y0, SHOP_X1, SHOP_Y1, WOOD_M, darken(WOOD_D, 8), depth=10)
d.rectangle([(SHOP_X0 + 4, SHOP_Y0 + 4), (SHOP_X1 - 4, SHOP_Y0 + 22)], fill=WOOD_L)

# Parchment sign
SG_X0, SG_Y0, SG_X1, SG_Y1 = SHOP_X0 + 6, SHOP_Y0 - 18, SHOP_X1 - 6, SHOP_Y0 - 4
d.rectangle([(SG_X0, SG_Y0), (SG_X1, SG_Y1)], fill=(246, 232, 196))
d.rectangle([(SG_X0, SG_Y0), (SG_X1, SG_Y1)], outline=GOLD, width=1)
for ly in range(SG_Y0 + 4, SG_Y1 - 2, 4):
    d.line([(SG_X0 + 3, ly), (SG_X1 - 3, ly)], fill=(158, 138, 98), width=1)

# Card packs
for pi, pc in enumerate([(180, 40, 40), (40, 100, 200), (40, 160, 60)]):
    px0 = SHOP_X0 + 6 + pi * 26
    d.rectangle([(px0, SHOP_Y0 + 6), (px0 + 20, SHOP_Y0 + 14)], fill=pc)
    d.rectangle([(px0, SHOP_Y0 + 6), (px0 + 20, SHOP_Y0 + 14)], outline=GOLD, width=1)
    d.line([(px0 + 2, SHOP_Y0 + 7), (px0 + 2, SHOP_Y0 + 13)],
           fill=lighten(pc, 60), width=1)

d.rectangle([(SHOP_X0, SHOP_Y0), (SHOP_X1, SHOP_Y1)], outline=GOLD, width=2)


# =============================================================================
# 9. STUDY TABLES
# =============================================================================
TABLE_POS = [(5, 6), (19, 6), (5, 12), (19, 12)]

def draw_study_table(col, row):
    cx = tx(col) + TILE // 2
    cy = ty(row) + TILE // 2
    R = 26
    # Shadow
    d.ellipse([(cx - R + 5, cy - R // 2 + 8), (cx + R + 5, cy + R // 2 + 8)],
              fill=(44, 46, 62))
    # Table surface
    d.ellipse([(cx - R, cy - R // 2), (cx + R, cy + R // 2)], fill=WOOD_M)
    d.ellipse([(cx - R + 2, cy - R // 2 + 1), (cx + R - 2, cy + R // 2 - 1)],
              fill=WOOD_L)
    # Grain lines
    for i in range(3):
        a = math.radians(30 + i * 60)
        d.line([(int(cx - (R - 5) * math.cos(a)), int(cy - (R // 2 - 3) * math.sin(a))),
                (int(cx + (R - 5) * math.cos(a)), int(cy + (R // 2 - 3) * math.sin(a)))],
               fill=WOOD_D, width=1)
    d.ellipse([(cx - R, cy - R // 2), (cx + R, cy + R // 2)], outline=WOOD_D, width=2)
    # Book
    bc = BOOK_COLS[(col + row) % len(BOOK_COLS)]
    d.rectangle([(cx - 10, cy - 5), (cx + 2, cy + 3)], fill=bc)
    d.line([(cx - 8, cy - 5), (cx - 8, cy + 3)], fill=darken(bc, 30), width=1)
    # Candle
    d.rectangle([(cx + 5, cy - 6), (cx + 8, cy + 4)], fill=(230, 228, 205))
    d.polygon([(cx + 4, cy - 6), (cx + 9, cy - 6), (cx + 8, cy - 11),
               (cx + 6, cy - 14), (cx + 4, cy - 10)], fill=(240, 155, 38))

for col, row in TABLE_POS:
    draw_study_table(col, row)


# =============================================================================
# 10. PORTAL DOOR — 3D arch with depth
# =============================================================================
PORT_X0 = tx(11)
PORT_X1 = tx(14)
PORT_Y0 = ty(15)
PORT_Y1 = ty(18)
PORT_CX  = (PORT_X0 + PORT_X1) // 2
PIL_W    = 12

# Stone pillars with 3D depth
depth_rect(d, PORT_X0, PORT_Y0, PORT_X0 + PIL_W, PORT_Y1, STN1, darken(STN1, 25), depth=8)
depth_rect(d, PORT_X1 - PIL_W, PORT_Y0, PORT_X1, PORT_Y1, STN1, darken(STN1, 25), depth=8)
for pil_x in [PORT_X0, PORT_X1 - PIL_W]:
    d.line([(pil_x + 2, PORT_Y0), (pil_x + 2, PORT_Y1)], fill=WALL_HIGH, width=1)

# Arch keystone
ARCH_TOP = PORT_Y0 - 22
arch_pts = [
    (PORT_X0, PORT_Y0), (PORT_X0 + PIL_W, PORT_Y0),
    (PORT_CX - 8, ARCH_TOP + 8), (PORT_CX, ARCH_TOP),
    (PORT_CX + 8, ARCH_TOP + 8),
    (PORT_X1 - PIL_W, PORT_Y0), (PORT_X1, PORT_Y0),
]
d.polygon(arch_pts, fill=STN2)
d.line(arch_pts + [arch_pts[0]], fill=STN3, width=2)
d.polygon([(PORT_CX - 6, ARCH_TOP + 4), (PORT_CX + 6, ARCH_TOP + 4),
           (PORT_CX + 4, ARCH_TOP + 14), (PORT_CX - 4, ARCH_TOP + 14)], fill=GOLD)

# Portal glow interior
GLOW_X0 = PORT_X0 + PIL_W
GLOW_X1 = PORT_X1 - PIL_W
GLOW_Y0 = PORT_Y0
d.rectangle([(GLOW_X0, GLOW_Y0), (GLOW_X1, PORT_Y1)], fill=PORT_DARK)
for ri in range(6, 36, 6):
    a = 1.0 - ri / 36.0
    gc = blend(PORT_DARK, PORT_GLOW, a)
    mid_x = (GLOW_X0 + GLOW_X1) // 2
    mid_y = (GLOW_Y0 + PORT_Y1) // 2
    d.ellipse([(mid_x - ri, mid_y - ri), (mid_x + ri, mid_y + ri)], outline=gc, width=1)
for wy in range(GLOW_Y0, PORT_Y1, 4):
    wave_t = (wy - GLOW_Y0) / (PORT_Y1 - GLOW_Y0)
    sx_off = int(4 * math.sin(wave_t * math.pi * 3))
    gc2 = blend(PORT_INNER, PORT_GLOW, abs(math.sin(wave_t * math.pi)))
    d.line([(GLOW_X0 + sx_off, wy), (GLOW_X1 + sx_off, wy)], fill=gc2, width=2)
mid_x = (GLOW_X0 + GLOW_X1) // 2
mid_y = (GLOW_Y0 + PORT_Y1) // 2
d.ellipse([(mid_x - 20, mid_y - 20), (mid_x + 20, mid_y + 20)], fill=PORT_GLOW)
d.ellipse([(mid_x - 8, mid_y - 8), (mid_x + 8, mid_y + 8)], fill=PORT_SHINE)
random.seed(99)
for _ in range(20):
    px2 = random.randint(GLOW_X0 + 2, GLOW_X1 - 2)
    py2 = random.randint(GLOW_Y0 + 2, PORT_Y1 - 2)
    d.ellipse([(px2 - 1, py2 - 1), (px2 + 1, py2 + 1)], fill=PORT_SHINE)

# Floor glow from portal
for ry in range(ty(15), ty(17)):
    t = (ry - ty(15)) / (ty(17) - ty(15))
    a = (1.0 - t) * 0.38
    gr = blend(FLOOR_B, PORT_GLOW, a)
    spread = int(22 + 28 * t)
    d.line([(PORT_CX - spread, ry), (PORT_CX + spread, ry)], fill=gr, width=1)


# =============================================================================
# 11. TORCHES ON WALL FACES
# =============================================================================
TORCH_COLS = [tx(4), tx(8), tx(12), tx(16), tx(20)]
for twx in TORCH_COLS:
    twy = ty(1) - 2
    d.rectangle([(twx - 4, twy + 4), (twx + 4, twy + 14)], fill=STN2)
    d.line([(twx, twy + 4), (twx, twy + 2)], fill=STN3, width=2)
    d.polygon([(twx - 5, twy + 4), (twx + 5, twy + 4),
               (twx + 3, twy - 4), (twx, twy - 8), (twx - 3, twy - 4)],
              fill=(220, 108, 24))
    d.polygon([(twx - 3, twy + 3), (twx + 3, twy + 3),
               (twx + 2, twy - 2), (twx, twy - 6), (twx - 2, twy - 2)],
              fill=(248, 198, 52))
    for gr in [14, 10, 6]:
        a = gr / 14.0
        gc = blend(WALL_FACE, (240, 200, 80), a * 0.5)
        d.ellipse([(twx - gr, twy - gr // 2), (twx + gr, twy + gr)], outline=gc, width=1)

# Left & right side torches
for trow in [4, 9, 14]:
    for is_right in [False, True]:
        twy_s = ty(trow) + TILE // 2
        if is_right:
            twx_s = tx(24) + 2
            d.rectangle([(twx_s - 14, twy_s - 4), (twx_s - 4, twy_s + 4)], fill=STN2)
            d.polygon([(twx_s - 4, twy_s - 5), (twx_s - 4, twy_s + 5),
                       (twx_s + 4, twy_s + 3), (twx_s + 8, twy_s), (twx_s + 4, twy_s - 3)],
                      fill=(220, 108, 24))
        else:
            twx_s = tx(1) - 2
            d.rectangle([(twx_s + 4, twy_s - 4), (twx_s + 14, twy_s + 4)], fill=STN2)
            d.polygon([(twx_s + 4, twy_s - 5), (twx_s + 4, twy_s + 5),
                       (twx_s - 4, twy_s + 3), (twx_s - 8, twy_s), (twx_s - 4, twy_s - 3)],
                      fill=(220, 108, 24))


# =============================================================================
# 12. DECORATIVE PILLARS
# =============================================================================
PILLAR_POS = [
    (tx(7) + TILE // 2, ty(5) + TILE // 2),
    (tx(17) + TILE // 2, ty(5) + TILE // 2),
    (tx(7) + TILE // 2, ty(12) + TILE // 2),
    (tx(17) + TILE // 2, ty(12) + TILE // 2),
]
PH = 46
for plx, ply in PILLAR_POS:
    d.ellipse([(plx - 14, ply - 5), (plx + 14, ply + 10)], fill=(38, 40, 56))
    d.ellipse([(plx - 12, ply - 4), (plx + 12, ply + 7)], fill=STN1)
    d.ellipse([(plx - 10, ply - 3), (plx + 10, ply + 5)], fill=STN2)
    # Shaft
    d.rectangle([(plx - 7, ply - PH), (plx + 7, ply)], fill=STN2)
    # Front face depth strip
    d.rectangle([(plx - 7, ply), (plx + 7, ply + 6)], fill=darken(STN1, 20))
    d.line([(plx - 5, ply - PH + 2), (plx - 5, ply)], fill=WALL_HIGH, width=1)
    d.line([(plx + 4, ply - PH + 2), (plx + 4, ply)], fill=STN0, width=1)
    # Capital
    d.rectangle([(plx - 10, ply - PH - 4), (plx + 10, ply - PH)], fill=STN3)
    d.rectangle([(plx - 10, ply - PH - 6), (plx + 10, ply - PH - 4)], fill=WALL_HIGH)
    # Rune glyph
    d.ellipse([(plx - 3, ply - PH // 2 - 4), (plx + 3, ply - PH // 2 + 4)],
              fill=GLOW_TEAL)


# =============================================================================
# 13. FLOOR RUNE CIRCLES
# =============================================================================
RUNE_POS = [
    (tx(3) + TILE // 2, ty(9) + TILE // 2),
    (tx(21) + TILE // 2, ty(9) + TILE // 2),
    (tx(12) + TILE // 2, ty(3) + TILE // 2),
    (tx(12) + TILE // 2, ty(14) + TILE // 2),
]
for rx, ry in RUNE_POS:
    for rr in [18, 14, 10]:
        d.ellipse([(rx - rr, ry - rr), (rx + rr, ry + rr)], outline=GOLD, width=1)
    for ri in range(6):
        a = math.radians(ri * 60)
        rrx = int(rx + 11 * math.cos(a))
        rry = int(ry + 11 * math.sin(a))
        d.ellipse([(rrx - 2, rry - 2), (rrx + 2, rry + 2)], fill=GOLD)


# =============================================================================
# 14. CLUB BANNERS — hanging from north wall face
# =============================================================================
BANNER_DATA = [
    (tx(4) + TILE, (220, 210, 160), (210, 172, 55)),
    (tx(8) + TILE, (30, 144, 255), (55, 80, 160)),
    (tx(12) + TILE, (75, 0, 130), (138, 43, 226)),
    (tx(16) + TILE, (180, 20, 50), (220, 60, 40)),
    (tx(20) + TILE, (34, 139, 34), (55, 180, 55)),
]
bw, bh = 28, 50
for bx_c, bc_dark, bc_light in BANNER_DATA:
    # Rod on wall face (at WALL_CAP level)
    d.line([(bx_c - bw // 2 - 4, WALL_CAP + 4), (bx_c + bw // 2 + 4, WALL_CAP + 4)],
           fill=WOOD_H, width=3)
    # Banner cloth
    d.polygon([(bx_c - bw // 2, WALL_CAP + 6),
               (bx_c + bw // 2, WALL_CAP + 6),
               (bx_c + bw // 2, WALL_CAP + 6 + bh),
               (bx_c, WALL_CAP + 6 + bh + 10),
               (bx_c - bw // 2, WALL_CAP + 6 + bh)],
              fill=bc_dark)
    d.rectangle([(bx_c - 2, WALL_CAP + 8), (bx_c + 2, WALL_CAP + 6 + bh - 4)],
                fill=bc_light)
    # Star emblem
    star_cy = WALL_CAP + 6 + bh // 2
    for si in range(5):
        sa = math.radians(si * 72 - 90)
        d.ellipse([(int(bx_c + 7 * math.cos(sa)) - 2, int(star_cy + 7 * math.sin(sa)) - 2),
                   (int(bx_c + 7 * math.cos(sa)) + 2, int(star_cy + 7 * math.sin(sa)) + 2)],
                  fill=GOLD)
    d.ellipse([(bx_c - 3, star_cy - 3), (bx_c + 3, star_cy + 3)], fill=darken(GOLD, 10))


# =============================================================================
# 15. AMBIENT NEXUS GLOW on floor
# =============================================================================
GLOW_R = 155
for gy in range(max(ty(3), FNY - GLOW_R), min(ty(16), FNY + GLOW_R)):
    for gx in range(max(tx(4), FNX - GLOW_R), min(tx(20), FNX + GLOW_R)):
        dist = math.sqrt((gx - FNX)**2 + (gy - FNY)**2)
        if dist < GLOW_R:
            t = (1.0 - dist / GLOW_R) ** 2 * 0.13
            px_col = img.getpixel((gx, gy))
            img.putpixel((gx, gy), blend(px_col, CRYS_TEAL, t))


# =============================================================================
# 16. CORNER STONE BRACKETS
# =============================================================================
CORNERS = [(tx(0), ty(0)), (tx(24), ty(0)), (tx(0), ty(17)), (tx(24), ty(17))]
for cnx, cny in CORNERS:
    d.rectangle([(cnx, cny), (cnx + TILE, cny + TILE)], fill=STN0)
    d.rectangle([(cnx + 2, cny + 2), (cnx + TILE - 2, cny + TILE - 2)], fill=STN1)
    d.line([(cnx + 4, cny + 4), (cnx + TILE - 4, cny + 4)], fill=WALL_HIGH, width=1)
    d.line([(cnx + 4, cny + 4), (cnx + 4, cny + TILE - 4)], fill=WALL_HIGH, width=1)
    d.ellipse([(cnx + TILE // 2 - 3, cny + TILE // 2 - 3),
               (cnx + TILE // 2 + 3, cny + TILE // 2 + 3)], fill=GOLD)


# =============================================================================
# 17. HUD BAR
# =============================================================================
draw_hud_bar(d)


# =============================================================================
# SAVE
# =============================================================================
out = r'C:\Users\Kenny\mana-tactics\public\assets\hub-bg.png'
img.save(out)
print('Saved %dx%d -> %s' % (W, H, out))
