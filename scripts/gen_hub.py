"""
Generates public/assets/hub-bg.png (800x576)
Mana Academy interior -- top-down RPG hub scene
Run: powershell.exe -Command "python 'C:\\Users\\Kenny\\mana-tactics\\scripts\\gen_hub.py'"
"""
from PIL import Image, ImageDraw
import math

W, H = 800, 576
TILE = 32
COLS = 25  # 0..24
ROWS = 18  # 0..17

img = Image.new('RGB', (W, H), (20, 22, 35))
d = ImageDraw.Draw(img)

# ── Palette ──────────────────────────────────────────────────────────────────
# Walls (warm stone wall)
WALL_BG   = (107,  91,  62)
WALL_FACE = (125, 108,  78)
WALL_TOP  = (139, 125,  98)
WALL_LINE = ( 88,  72,  45)
WALL_HIGH = (158, 142, 108)

# Floor (warm stone tiles)
FLOOR_A   = (196, 162, 101)
FLOOR_B   = (166, 139,  75)
FLOOR_GRID= (148, 122,  65)
FLOOR_SPEC= (210, 178, 115)

# Wood (warmer)
WOOD_D    = ( 92,  58,  30)
WOOD_M    = (115,  75,  38)
WOOD_L    = (139, 105,  20)
WOOD_H    = (165, 130,  45)

# Crystal / glow
CRYS_BLUE  = (60, 200, 240)
CRYS_TEAL  = (40, 225, 195)
CRYS_PURP  = (140, 80, 220)
CRYS_WHITE = (210, 235, 255)
GLOW_BLUE  = (80, 160, 220)
GLOW_TEAL  = (55, 195, 175)
GLOW_PURP  = (120, 60, 180)

# Portal
PORT_ARCH  = (68,  72,  92)
PORT_GLOW  = (55, 210, 195)
PORT_INNER = (30, 165, 155)
PORT_DARK  = (18, 105, 100)
PORT_SHINE = (140, 255, 240)

# Books
BOOK_COLS = [
    (195,  55,  55), (55, 115, 195), (55, 175,  80),
    (210, 160,  40), (145,  60, 195), (195, 105,  40),
    (55, 195, 185), (215, 215,  55), (165,  48,  88),
]

# Gold
GOLD    = (210, 172,  55)
GOLD_L  = (238, 210,  90)

# Rug
RUG_RED   = (148,  42,  42)
RUG_GOLD  = (188, 145,  40)
RUG_DARK  = (108,  28,  28)

# HUD bar at very top
HUD_BG    = (12,  14,  20)

# Stone detail (warmer, less blue)
STN0  = ( 85,  72,  50)
STN1  = (105,  90,  65)
STN2  = (128, 112,  82)
STN3  = (155, 138, 105)

# Shadow / overlay
SHADOW = (0, 0, 0)

# ── Helpers ──────────────────────────────────────────────────────────────────
def tx(col): return col * TILE
def ty(row): return row * TILE
def tile_rect(col, row, w=1, h=1): return [(tx(col), ty(row)), (tx(col+w), ty(row+h))]

def rect(x0, y0, x1, y1, fill, outline=None, ow=1):
    d.rectangle([(x0, y0), (x1, y1)], fill=fill)
    if outline:
        d.rectangle([(x0, y0), (x1, y1)], outline=outline, width=ow)

def lerp_color(c0, c1, t):
    return tuple(int(c0[i] + t * (c1[i] - c0[i])) for i in range(3))


# =============================================================================
# 1. FLOOR TILES (interior, rows 1-16, cols 1-23)
# =============================================================================
for row in range(1, ROWS - 1):
    for col in range(1, COLS - 1):
        x0, y0 = tx(col), ty(row)
        x1, y1 = x0 + TILE, y0 + TILE

        # Distance from center for slight vignette
        cx = (col - 12) / 12.0
        cy = (row - 8.5) / 8.5
        dist = math.sqrt(cx*cx + cy*cy)
        t = min(1.0, dist * 0.55)

        base = lerp_color(FLOOR_SPEC, FLOOR_A, t)
        # Checkerboard micro-variation
        if (col + row) % 2 == 0:
            base = lerp_color(base, FLOOR_B, 0.3)

        d.rectangle([(x0, y0), (x1, y1)], fill=base)
        # Grid lines
        d.line([(x1-1, y0), (x1-1, y1-1)], fill=FLOOR_GRID, width=1)
        d.line([(x0, y1-1), (x1-1, y1-1)], fill=FLOOR_GRID, width=1)


# =============================================================================
# 2. WALLS
# =============================================================================

# -- Top wall (row 0) ---------------------------------------------------------
for col in range(COLS):
    x0, y0 = tx(col), ty(0)
    x1, y1 = x0 + TILE, y0 + TILE
    rect(x0, y0, x1, y1, WALL_BG)
    # Stone face detail
    if col > 0 and col < COLS - 1:
        # Alternating stone blocks
        if col % 2 == 0:
            rect(x0+2, y0+4, x1-2, y1-2, WALL_FACE)
        else:
            rect(x0+2, y0+6, x1-2, y1-2, WALL_TOP)
        # Mortar lines
        d.line([(x0, y1-1), (x1, y1-1)], fill=WALL_LINE, width=1)
        d.line([(x0, y0), (x0, y1)], fill=WALL_LINE, width=1)
        # Highlight top
        d.line([(x0+2, y0+2), (x1-2, y0+2)], fill=WALL_HIGH, width=1)

# -- Left wall (col 0, rows 1-17) ---------------------------------------------
for row in range(1, ROWS):
    x0, y0 = tx(0), ty(row)
    x1, y1 = x0 + TILE, y0 + TILE
    rect(x0, y0, x1, y1, WALL_BG)
    if row < ROWS - 1:
        if row % 2 == 1:
            rect(x0+2, y0+2, x1-2, y1-4, WALL_FACE)
        else:
            rect(x0+2, y0+4, x1-2, y1-2, WALL_TOP)
        d.line([(x0, y0), (x1, y0)], fill=WALL_LINE, width=1)
        d.line([(x1-1, y0), (x1-1, y1)], fill=WALL_LINE, width=1)
        d.line([(x0+2, y0+2), (x0+2, y1-2)], fill=WALL_HIGH, width=1)

# -- Right wall (col 24, rows 1-17) ------------------------------------------
for row in range(1, ROWS):
    x0, y0 = tx(24), ty(row)
    x1, y1 = x0 + TILE, y0 + TILE
    rect(x0, y0, x1, y1, WALL_BG)
    if row < ROWS - 1:
        if row % 2 == 1:
            rect(x0+2, y0+2, x1-2, y1-4, WALL_FACE)
        else:
            rect(x0+2, y0+4, x1-2, y1-2, WALL_TOP)
        d.line([(x0, y0), (x1, y0)], fill=WALL_LINE, width=1)
        d.line([(x0, y0), (x0, y1)], fill=WALL_LINE, width=1)
        d.line([(x1-3, y0+2), (x1-3, y1-2)], fill=WALL_HIGH, width=1)

# -- Bottom wall (row 17, cols 0-10 and 14-24) --------------------------------
for col in range(COLS):
    if 11 <= col <= 13:
        continue  # portal gap
    x0, y0 = tx(col), ty(17)
    x1, y1 = x0 + TILE, y0 + TILE
    rect(x0, y0, x1, y1, WALL_BG)
    rect(x0+2, y0+4, x1-2, y1-1, WALL_FACE)
    d.line([(x0, y0), (x1, y0)], fill=WALL_LINE, width=1)
    d.line([(x0, y0), (x0, y1)], fill=WALL_LINE, width=1)
    d.line([(x0+2, y0+2), (x1-2, y0+2)], fill=WALL_HIGH, width=1)

# Wall top decorative strip (row 0 highlight)
d.line([(0, ty(1)), (W, ty(1))], fill=WALL_LINE, width=2)


# =============================================================================
# 3. CENTRAL RUG / DAIS SURROUND
# =============================================================================
# Large circular rug under the fountain area
RUG_CX, RUG_CY = tx(12) + TILE//2, ty(8) + TILE + TILE//2  # 400, 304
RUG_R = 96

# Outer rug ring
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

# Rug pattern lines (radial)
for i in range(8):
    angle = math.radians(i * 45)
    ex2 = int(RUG_CX + (RUG_R - 5) * math.cos(angle))
    ey2 = int(RUG_CY + (RUG_R - 5) * math.sin(angle))
    d.line([(int(RUG_CX + 35*math.cos(angle)), int(RUG_CY + 35*math.sin(angle))),
            (ex2, ey2)], fill=RUG_GOLD, width=1)

# Rug border circles
for r in [RUG_R, RUG_R - 10, RUG_R - 20, RUG_R - 30]:
    d.ellipse([(RUG_CX-r, RUG_CY-r), (RUG_CX+r, RUG_CY+r)], outline=GOLD, width=1)


# =============================================================================
# 4. CRYSTAL FOUNTAIN / NEXUS
# =============================================================================
FNX, FNY = tx(12) + TILE//2, ty(8) + TILE  # 400, 288

# -- Stone dais (raised platform) --
DAIS_R = 48
DAIS_SHADOW_R = 52

# Shadow under dais
d.ellipse([(FNX - DAIS_SHADOW_R, FNY - DAIS_SHADOW_R//2 + 8),
           (FNX + DAIS_SHADOW_R, FNY + DAIS_SHADOW_R//2 + 12)],
          fill=(30, 32, 44))

# Stone base rings
for ri, col in [(DAIS_R, STN1), (DAIS_R - 6, STN2), (DAIS_R - 12, STN3)]:
    d.ellipse([(FNX-ri, FNY-ri//2), (FNX+ri, FNY+ri//2)], fill=col)
    d.ellipse([(FNX-ri, FNY-ri//2), (FNX+ri, FNY+ri//2)], outline=WALL_LINE, width=1)

# Rune ring (glowing dots)
for i in range(12):
    angle = math.radians(i * 30)
    rx = int(FNX + (DAIS_R - 18) * math.cos(angle))
    ry = int(FNY + (DAIS_R//2 - 9) * math.sin(angle))
    d.ellipse([(rx-2, ry-2), (rx+2, ry+2)], fill=GLOW_TEAL)

# -- Crystal cluster --
def draw_crystal(cx, cy, w, h, col, hi, shadow_col):
    """Draw a crystal gem shape."""
    pts = [(cx, cy - h),
           (cx + w, cy - h//4),
           (cx + w//2, cy),
           (cx - w//2, cy),
           (cx - w, cy - h//4)]
    d.polygon(pts, fill=col)
    # Highlight face
    d.polygon([(cx, cy-h), (cx+w, cy-h//4), (cx+w//2, cy-h//2)], fill=hi)
    # Shadow face
    d.polygon([(cx, cy-h), (cx-w, cy-h//4), (cx-w//2, cy-h//2)], fill=shadow_col)
    # Outline
    d.line([(cx, cy-h), (cx+w, cy-h//4), (cx+w//2, cy), (cx-w//2, cy),
            (cx-w, cy-h//4), (cx, cy-h)], fill=CRYS_WHITE, width=1)

# Glow halos (drawn first, under crystals)
for r, alpha_col in [(52, (55, 200, 190, 30)), (36, (80, 160, 220, 50)), (20, (140, 80, 220, 70))]:
    d.ellipse([(FNX-r, FNY-r-10), (FNX+r, FNY+r-10)], outline=GLOW_TEAL, width=1)

# Center tall crystal (teal)
draw_crystal(FNX, FNY - 26, 10, 38, CRYS_TEAL,
             (160, 248, 235), (25, 155, 145))
# Left crystal (blue)
draw_crystal(FNX - 18, FNY - 10, 7, 24, CRYS_BLUE,
             (160, 220, 255), (35, 130, 185))
# Right crystal (purple)
draw_crystal(FNX + 18, FNY - 10, 7, 24, CRYS_PURP,
             (200, 155, 255), (90, 42, 165))
# Far-left small (white/blue)
draw_crystal(FNX - 30, FNY - 4, 5, 16, CRYS_WHITE,
             (235, 245, 255), (165, 190, 220))
# Far-right small (teal)
draw_crystal(FNX + 30, FNY - 4, 5, 16, CRYS_TEAL,
             (180, 248, 235), (28, 148, 135))
# Back small (purple)
draw_crystal(FNX + 8, FNY - 32, 5, 14, CRYS_PURP,
             (195, 150, 248), (88, 40, 158))
draw_crystal(FNX - 8, FNY - 30, 5, 14, CRYS_BLUE,
             (155, 215, 255), (32, 125, 180))

# Red crystal (Embercrest)
draw_crystal(FNX-14, FNY-12, 6, 20, (210,50,60), (255,120,130), (140,20,30))
# Green crystal (Thornveil)
draw_crystal(FNX+14, FNY-12, 6, 20, (50,180,70), (130,230,140), (25,110,40))
# White crystal (Order of Sun) - small, behind center
draw_crystal(FNX+4, FNY-38, 4, 12, (220,240,255), (255,255,255), (160,190,220))

# Mana beams radiating from nexus center
MANA_BEAMS = [
    (FNX, FNY-22, (255,255,220), 270),   # white - up
    (FNX, FNY-22, ( 30,144,255),  30),   # blue - upper-right
    (FNX, FNY-22, (138, 43,226), 150),   # black - upper-left
    (FNX, FNY-22, (220, 60, 40), 210),   # red - lower-left
    (FNX, FNY-22, ( 55,180, 55), 330),   # green - lower-right
]
for bx_start, by_start, beam_color, angle in MANA_BEAMS:
    ex = int(bx_start + 38*math.cos(math.radians(angle)))
    ey = int(by_start + 38*math.sin(math.radians(angle)))
    d.line([(bx_start, by_start), (ex, ey)], fill=beam_color, width=1)

# Sparkle particles around fountain
import random
random.seed(42)
for _ in range(32):
    angle = random.uniform(0, math.pi * 2)
    dist2 = random.uniform(22, 58)
    sx = int(FNX + dist2 * math.cos(angle))
    sy = int(FNY - 8 + (dist2 * 0.5) * math.sin(angle))
    sc = random.choice([CRYS_WHITE, CRYS_TEAL, CRYS_BLUE, GLOW_TEAL])
    sz = random.randint(1, 2)
    d.ellipse([(sx-sz, sy-sz), (sx+sz, sy+sz)], fill=sc)


# =============================================================================
# 5. LIBRARIAN COUNTER (top-left, tiles 1-6, 1-4)
# =============================================================================
CTR_X0, CTR_Y0 = tx(1), ty(1)
CTR_X1, CTR_Y1 = tx(7), ty(5)  # cols 1-6, rows 1-4

# Counter shadow
rect(CTR_X0+4, CTR_Y0+4, CTR_X1+4, CTR_Y1+4, (28, 30, 42))

# Counter body
rect(CTR_X0, CTR_Y0, CTR_X1, CTR_Y1, WOOD_D)
rect(CTR_X0+2, CTR_Y0+2, CTR_X1-2, CTR_Y1-2, WOOD_M)

# Counter top surface (lighter, angled inward 2px)
rect(CTR_X0+4, CTR_Y0+4, CTR_X1-4, CTR_Y0+24, WOOD_L)

# Wood grain lines on body
for gy in range(CTR_Y0+30, CTR_Y1-4, 8):
    d.line([(CTR_X0+4, gy), (CTR_X1-4, gy)], fill=WOOD_D, width=1)

# Items on counter top
# Ink pot
INK_X = CTR_X0 + 20
INK_Y = CTR_Y0 + 14
rect(INK_X - 6, INK_Y - 8, INK_X + 6, INK_Y + 4, (22, 22, 35))
rect(INK_X - 4, INK_Y - 10, INK_X + 4, INK_Y - 6, (55, 55, 75))
d.ellipse([(INK_X-3, INK_Y-10), (INK_X+3, INK_Y-7)], fill=(180, 195, 220))

# Quill (feather)
d.line([(INK_X+4, INK_Y-8), (INK_X+14, INK_Y-22)], fill=(230, 225, 200), width=2)
d.line([(INK_X+8, INK_Y-14), (INK_X+18, INK_Y-12)], fill=(215, 205, 175), width=1)
d.line([(INK_X+10, INK_Y-17), (INK_X+16, INK_Y-8)], fill=(215, 205, 175), width=1)

# Spell book on counter
BK_X0 = CTR_X0 + 42
BK_Y0 = CTR_Y0 + 8
BK_X1 = CTR_X0 + 80
BK_Y1 = CTR_Y0 + 20
rect(BK_X0, BK_Y0, BK_X1, BK_Y1, (88, 48, 18))
rect(BK_X0+2, BK_Y0+2, BK_X1-2, BK_Y1-2, (115, 65, 25))
d.line([(BK_X0+6, BK_Y0), (BK_X0+6, BK_Y1)], fill=(72, 38, 12), width=2)
# Gold clasp
d.ellipse([(BK_X0+BK_X1)//2-3, BK_Y0+4, (BK_X0+BK_X1)//2+3, BK_Y0+10], fill=GOLD)

# Candle
CND_X = CTR_X0 + 90
CND_Y = CTR_Y0 + 12
rect(CND_X-3, CND_Y, CND_X+3, CND_Y+16, (230, 225, 200))
d.line([(CND_X, CND_Y-2), (CND_X, CND_Y-8)], fill=(55, 55, 60), width=1)
d.polygon([(CND_X-4, CND_Y-8), (CND_X+4, CND_Y-8),
           (CND_X+2, CND_Y-14), (CND_X, CND_Y-18), (CND_X-2, CND_Y-14)],
          fill=(240, 158, 40))
d.polygon([(CND_X-2, CND_Y-10), (CND_X+2, CND_Y-10),
           (CND_X, CND_Y-16)], fill=(255, 220, 100))

# Counter front panel carving
rect(CTR_X0+8, CTR_Y1-22, CTR_X1-8, CTR_Y1-6, WOOD_D)
d.rectangle([(CTR_X0+10, CTR_Y1-20), (CTR_X1-10, CTR_Y1-8)],
            outline=WOOD_H, width=1)


# =============================================================================
# 6. BOOKSHELVES (right wall area, tiles 21-23, rows 2-15)
# =============================================================================
BSH_X0 = tx(21)
BSH_X1 = tx(24) - 2
BSH_Y0 = ty(2)
BSH_Y1 = ty(15)

# Shelf back panel
rect(BSH_X0, BSH_Y0, BSH_X1, BSH_Y1, WOOD_D)

# Individual shelf boards every 3 rows
SHELF_H = TILE * 3  # 96px per shelf section
for shelf_i in range(4):
    sy0 = BSH_Y0 + shelf_i * SHELF_H
    sy1 = sy0 + SHELF_H

    # Shelf board
    d.rectangle([(BSH_X0, sy1-6), (BSH_X1, sy1)], fill=WOOD_H)
    d.line([(BSH_X0, sy1-7), (BSH_X1, sy1-7)], fill=WOOD_D, width=1)

    # Books in this shelf section
    bx = BSH_X0 + 4
    bi = (shelf_i * 7)
    while bx < BSH_X1 - 4:
        book_w = random.randint(8, 16)
        book_col = BOOK_COLS[bi % len(BOOK_COLS)]
        bi += 1
        book_x1 = min(bx + book_w, BSH_X1 - 4)
        # Book body
        d.rectangle([(bx, sy0+8), (book_x1, sy1-8)], fill=book_col)
        # Book spine highlight
        d.line([(bx+2, sy0+10), (bx+2, sy1-10)],
               fill=tuple(min(255, c+50) for c in book_col), width=1)
        # Book top
        d.rectangle([(bx, sy0+8), (book_x1, sy0+12)],
                    fill=tuple(max(0, c-25) for c in book_col))
        bx = book_x1 + 2

# Shelf side post (left side)
rect(BSH_X0, BSH_Y0, BSH_X0+4, BSH_Y1, WOOD_M)
# Shelf cap (top)
rect(BSH_X0, BSH_Y0, BSH_X1, BSH_Y0+6, WOOD_L)
# Shadow cast by bookshelf onto floor
rect(BSH_X0, BSH_Y0, BSH_X0+8, BSH_Y1, (45, 48, 62))


# =============================================================================
# 7. LEFT WALL BOOKSHELVES (smaller, tiles 2-4, rows 5-15)
# =============================================================================
LBSH_X0 = tx(1)
LBSH_X1 = tx(4) - 2
LBSH_Y0 = ty(5)
LBSH_Y1 = ty(14)

rect(LBSH_X0, LBSH_Y0, LBSH_X1, LBSH_Y1, WOOD_D)
random.seed(77)
for shelf_i in range(3):
    sy0 = LBSH_Y0 + shelf_i * TILE * 3
    sy1 = sy0 + TILE * 3
    if sy1 > LBSH_Y1:
        sy1 = LBSH_Y1
    d.rectangle([(LBSH_X0, sy1-6), (LBSH_X1, sy1)], fill=WOOD_H)
    bx = LBSH_X0 + 3
    bi = shelf_i * 5 + 3
    while bx < LBSH_X1 - 3:
        book_w = random.randint(7, 13)
        book_col = BOOK_COLS[bi % len(BOOK_COLS)]
        bi += 1
        book_x1 = min(bx + book_w, LBSH_X1 - 3)
        d.rectangle([(bx, sy0+6), (book_x1, sy1-7)], fill=book_col)
        d.line([(bx+1, sy0+8), (bx+1, sy1-9)],
               fill=tuple(min(255, c+40) for c in book_col), width=1)
        bx = book_x1 + 2

rect(LBSH_X0, LBSH_Y0, LBSH_X1, LBSH_Y0+6, WOOD_L)
rect(LBSH_X1-4, LBSH_Y0, LBSH_X1, LBSH_Y1, WOOD_M)


# =============================================================================
# 7b. CARD SHOP BOOTH (right side, cols 19-22, rows 2-5)
# =============================================================================
SHOP_X0 = tx(19)
SHOP_Y0 = ty(2)
SHOP_X1 = tx(22)
SHOP_Y1 = ty(6)

# Counter shadow
rect(SHOP_X0+4, SHOP_Y0+4, SHOP_X1+4, SHOP_Y1+4, (70, 60, 40))

# Counter backing (dark wood)
rect(SHOP_X0, SHOP_Y0, SHOP_X1, SHOP_Y1, WOOD_D)
rect(SHOP_X0+2, SHOP_Y0+2, SHOP_X1-2, SHOP_Y1-2, WOOD_M)

# Counter surface (lighter top)
rect(SHOP_X0+4, SHOP_Y0+4, SHOP_X1-4, SHOP_Y0+20, WOOD_L)

# Parchment sign above counter
SIGN_X0 = SHOP_X0 + 6
SIGN_Y0 = SHOP_Y0 - 18
SIGN_X1 = SHOP_X1 - 6
SIGN_Y1 = SHOP_Y0 - 4
rect(SIGN_X0, SIGN_Y0, SIGN_X1, SIGN_Y1, (245, 230, 195))  # parchment
d.rectangle([(SIGN_X0, SIGN_Y0), (SIGN_X1, SIGN_Y1)], outline=GOLD, width=1)
# Horizontal lines suggesting text
for ly in range(SIGN_Y0+4, SIGN_Y1-2, 4):
    d.line([(SIGN_X0+3, ly), (SIGN_X1-3, ly)], fill=(160,140,100), width=1)

# Card packs on counter (3 small rectangles)
PACK_COLORS = [(180,40,40), (40,100,200), (40,160,60)]
for pi, pc in enumerate(PACK_COLORS):
    px0 = SHOP_X0 + 6 + pi * 26
    py0 = SHOP_Y0 + 6
    px1 = px0 + 20
    py1 = py0 + 12
    rect(px0, py0, px1, py1, pc)
    d.rectangle([(px0, py0), (px1, py1)], outline=GOLD, width=1)
    # Shine on pack
    d.line([(px0+2, py0+2), (px0+2, py1-2)], fill=tuple(min(255,c+60) for c in pc), width=1)

# Counter front carving
rect(SHOP_X0+6, SHOP_Y1-16, SHOP_X1-6, SHOP_Y1-4, WOOD_D)
d.rectangle([(SHOP_X0+8, SHOP_Y1-14), (SHOP_X1-8, SHOP_Y1-6)], outline=WOOD_H, width=1)
# Gold border on whole counter
d.rectangle([(SHOP_X0, SHOP_Y0), (SHOP_X1, SHOP_Y1)], outline=GOLD, width=2)


# =============================================================================
# 8. STUDY TABLES (four quadrants)
# =============================================================================
TABLE_POSITIONS = [
    (5,  6),   # top-left quadrant
    (19, 6),   # top-right quadrant
    (5,  12),  # bottom-left quadrant
    (19, 12),  # bottom-right quadrant
]

def draw_study_table(col, row):
    """Draw a round wooden study table with shadow."""
    cx = tx(col) + TILE // 2
    cy = ty(row) + TILE // 2
    R = 26
    SR = 30

    # Table shadow (offset ellipse)
    d.ellipse([(cx - SR + 4, cy - SR//2 + 6),
               (cx + SR + 4, cy + SR//2 + 6)], fill=(48, 50, 66))

    # Table surface
    d.ellipse([(cx-R, cy-R//2), (cx+R, cy+R//2)], fill=WOOD_M)
    d.ellipse([(cx-R+2, cy-R//2+1), (cx+R-2, cy+R//2-1)], fill=WOOD_L)

    # Wood grain lines
    for i in range(3):
        angle = math.radians(30 + i * 60)
        gx1 = int(cx - (R-5) * math.cos(angle))
        gy1 = int(cy - (R//2-3) * math.sin(angle))
        gx2 = int(cx + (R-5) * math.cos(angle))
        gy2 = int(cy + (R//2-3) * math.sin(angle))
        d.line([(gx1, gy1), (gx2, gy2)], fill=WOOD_D, width=1)

    # Table edge
    d.ellipse([(cx-R, cy-R//2), (cx+R, cy+R//2)], outline=WOOD_D, width=2)

    # Table legs (4 corners, seen from top-down as small dark rectangles)
    for la in [45, 135, 225, 315]:
        lx = int(cx + (R - 4) * math.cos(math.radians(la)))
        ly = int(cy + (R//2 - 2) * math.sin(math.radians(la)))
        d.ellipse([(lx-3, ly-2), (lx+3, ly+2)], fill=WOOD_D)

    # Item on table: small book + candle (randomize per position)
    # Small book
    bw, bh = 12, 8
    bx0 = cx - 10
    by0 = cy - 5
    d.rectangle([(bx0, by0), (bx0+bw, by0+bh)],
                fill=BOOK_COLS[(col + row) % len(BOOK_COLS)])
    d.line([(bx0+2, by0), (bx0+2, by0+bh)], fill=(50, 38, 18), width=1)
    # Tiny candle
    d.rectangle([(cx+6, cy-6), (cx+9, cy+4)], fill=(230, 228, 205))
    d.polygon([(cx+5, cy-6), (cx+10, cy-6), (cx+9, cy-10), (cx+7, cy-13), (cx+5, cy-10)],
              fill=(240, 155, 38))

for col, row in TABLE_POSITIONS:
    draw_study_table(col, row)


# =============================================================================
# 9. PORTAL DOOR (bottom-center, cols 11-13, row 17)
# =============================================================================
PORT_X0 = tx(11)
PORT_X1 = tx(14)
PORT_Y0 = ty(15)  # arch starts higher up
PORT_Y1 = ty(18)
PORT_CX = (PORT_X0 + PORT_X1) // 2  # 400
ARCH_W = PORT_X1 - PORT_X0          # 96
ARCH_H = PORT_Y1 - PORT_Y0          # 96

# Stone arch pillars
PIL_W = 12
d.rectangle([(PORT_X0, PORT_Y0), (PORT_X0+PIL_W, PORT_Y1)], fill=STN1)
d.rectangle([(PORT_X1-PIL_W, PORT_Y0), (PORT_X1, PORT_Y1)], fill=STN1)
# Pillar detail
for pil_x in [PORT_X0, PORT_X1-PIL_W]:
    d.line([(pil_x+2, PORT_Y0), (pil_x+2, PORT_Y1)], fill=WALL_HIGH, width=1)
    d.line([(pil_x+PIL_W-3, PORT_Y0), (pil_x+PIL_W-3, PORT_Y1)], fill=STN0, width=1)

# Arch keystone top
ARCH_TOP = PORT_Y0 - 20
arch_pts = [
    (PORT_X0, PORT_Y0),
    (PORT_X0 + PIL_W, PORT_Y0),
    (PORT_CX - 8, ARCH_TOP + 6),
    (PORT_CX, ARCH_TOP),
    (PORT_CX + 8, ARCH_TOP + 6),
    (PORT_X1 - PIL_W, PORT_Y0),
    (PORT_X1, PORT_Y0),
]
d.polygon(arch_pts, fill=STN2)
# Arch outline
d.line(arch_pts, fill=STN3, width=2)
# Keystone
d.polygon([(PORT_CX-6, ARCH_TOP+2), (PORT_CX+6, ARCH_TOP+2),
           (PORT_CX+4, ARCH_TOP+12), (PORT_CX-4, ARCH_TOP+12)], fill=GOLD)

# Portal glow interior
GLOW_X0 = PORT_X0 + PIL_W
GLOW_X1 = PORT_X1 - PIL_W
GLOW_Y0 = PORT_Y0
GLOW_Y1 = PORT_Y1

# Background dark portal
d.rectangle([(GLOW_X0, GLOW_Y0), (GLOW_X1, GLOW_Y1)], fill=PORT_DARK)

# Shimmering teal swirl effect (concentric ellipses with offset)
for ri in range(6, 36, 6):
    alpha = 1.0 - ri / 36.0
    glow = tuple(int(PORT_DARK[i] + alpha * (PORT_GLOW[i] - PORT_DARK[i])) for i in range(3))
    mid_x = (GLOW_X0 + GLOW_X1) // 2
    mid_y = (GLOW_Y0 + GLOW_Y1) // 2
    d.ellipse([(mid_x - ri, mid_y - ri), (mid_x + ri, mid_y + ri)], outline=glow, width=1)

# Portal shimmer lines (horizontal wave bands)
for wy in range(GLOW_Y0, GLOW_Y1, 4):
    wave_t = (wy - GLOW_Y0) / (GLOW_Y1 - GLOW_Y0)
    sx_off = int(4 * math.sin(wave_t * math.pi * 3))
    glow_col = lerp_color(PORT_INNER, PORT_GLOW, abs(math.sin(wave_t * math.pi)))
    d.line([(GLOW_X0 + sx_off, wy), (GLOW_X1 + sx_off, wy)], fill=glow_col, width=2)

# Bright center glow
mid_x = (GLOW_X0 + GLOW_X1) // 2
mid_y = (GLOW_Y0 + GLOW_Y1) // 2
d.ellipse([(mid_x-20, mid_y-20), (mid_x+20, mid_y+20)], fill=PORT_GLOW)
d.ellipse([(mid_x-8, mid_y-8), (mid_x+8, mid_y+8)], fill=PORT_SHINE)

# Portal sparkles
random.seed(99)
for _ in range(20):
    px = random.randint(GLOW_X0+2, GLOW_X1-2)
    py = random.randint(GLOW_Y0+2, GLOW_Y1-2)
    d.ellipse([(px-1, py-1), (px+1, py+1)], fill=PORT_SHINE)

# Floor reflection glow from portal
for ry in range(ty(15), ty(17)):
    t = (ry - ty(15)) / (ty(17) - ty(15))
    alpha = (1.0 - t) * 0.4
    glow_r = tuple(int(FLOOR_B[i] + alpha * (PORT_GLOW[i] - FLOOR_B[i])) for i in range(3))
    spread = int(20 + 30 * t)
    d.line([(PORT_CX - spread, ry), (PORT_CX + spread, ry)], fill=glow_r, width=1)


# =============================================================================
# 10. TORCHES / WALL SCONCES (on top wall, evenly spaced)
# =============================================================================
TORCH_POSITIONS = [tx(4), tx(8), tx(12), tx(16), tx(20)]
for twx in TORCH_POSITIONS:
    twy = ty(1) - 2
    # Sconce bracket
    d.rectangle([(twx-4, twy+4), (twx+4, twy+14)], fill=STN2)
    d.line([(twx, twy+4), (twx, twy+2)], fill=STN3, width=2)
    # Torch flame
    d.polygon([(twx-5, twy+4), (twx+5, twy+4),
               (twx+3, twy-4), (twx, twy-8), (twx-3, twy-4)],
              fill=(220, 110, 25))
    d.polygon([(twx-3, twy+3), (twx+3, twy+3),
               (twx+2, twy-2), (twx, twy-6), (twx-2, twy-2)],
              fill=(248, 200, 55))
    # Glow circle on wall
    for gr in [14, 10, 6]:
        a = gr / 14.0
        gc = tuple(int(WALL_BG[i] + a * (240 - WALL_BG[i])) for i in range(3))
        d.ellipse([(twx-gr, twy-gr//2), (twx+gr, twy+gr)], outline=gc, width=1)
    # Floor glow drop
    d.ellipse([(twx-12, ty(1)+4), (twx+12, ty(1)+16)],
              outline=(188, 148, 48), width=1)

# Side wall torches (left wall)
for trow in [4, 9, 14]:
    twy = ty(trow) + TILE//2
    twx2 = tx(1) - 2
    d.rectangle([(twx2+4, twy-4), (twx2+14, twy+4)], fill=STN2)
    d.polygon([(twx2+4, twy-5), (twx2+4, twy+5),
               (twx2-4, twy+3), (twx2-8, twy), (twx2-4, twy-3)],
              fill=(220, 110, 25))
    d.polygon([(twx2+3, twy-3), (twx2+3, twy+3),
               (twx2-2, twy+2), (twx2-6, twy), (twx2-2, twy-2)],
              fill=(248, 200, 55))
    for grl in [12, 8]:
        a = grl / 12.0
        gc = tuple(int(WALL_BG[i] + a * (220 - WALL_BG[i])) for i in range(3))
        d.ellipse([(twx2-grl, twy-grl//2), (twx2+grl, twy+grl//2)], outline=gc, width=1)

# Side wall torches (right wall)
for trow in [4, 9, 14]:
    twy = ty(trow) + TILE//2
    twx2 = tx(24) + 2
    d.rectangle([(twx2-14, twy-4), (twx2-4, twy+4)], fill=STN2)
    d.polygon([(twx2-4, twy-5), (twx2-4, twy+5),
               (twx2+4, twy+3), (twx2+8, twy), (twx2+4, twy-3)],
              fill=(220, 110, 25))
    d.polygon([(twx2-3, twy-3), (twx2-3, twy+3),
               (twx2+2, twy+2), (twx2+6, twy), (twx2+2, twy-2)],
              fill=(248, 200, 55))
    for grl in [12, 8]:
        a = grl / 12.0
        gc = tuple(int(WALL_BG[i] + a * (220 - WALL_BG[i])) for i in range(3))
        d.ellipse([(twx2-grl, twy-grl//2), (twx2+grl, twy+grl//2)], outline=gc, width=1)


# =============================================================================
# 11. DECORATIVE PILLARS (freestanding, near fountain area)
# =============================================================================
PILLAR_POSITIONS = [
    (tx(7) + TILE//2,  ty(5) + TILE//2),
    (tx(17) + TILE//2, ty(5) + TILE//2),
    (tx(7) + TILE//2,  ty(12) + TILE//2),
    (tx(17) + TILE//2, ty(12) + TILE//2),
]

for plx, ply in PILLAR_POSITIONS:
    # Pillar shadow
    d.ellipse([(plx-14, ply-5), (plx+14, ply+8)], fill=(40, 42, 58))
    # Base
    d.ellipse([(plx-12, ply-4), (plx+12, ply+6)], fill=STN1)
    d.ellipse([(plx-10, ply-3), (plx+10, ply+4)], fill=STN2)
    # Shaft (rectangle up)
    PH = 48  # pillar height
    d.rectangle([(plx-7, ply-PH), (plx+7, ply)], fill=STN2)
    d.line([(plx-5, ply-PH+2), (plx-5, ply)], fill=WALL_HIGH, width=1)
    d.line([(plx+4, ply-PH+2), (plx+4, ply)], fill=STN0, width=1)
    # Capital top
    d.rectangle([(plx-10, ply-PH-4), (plx+10, ply-PH)], fill=STN3)
    d.line([(plx-10, ply-PH-6), (plx+10, ply-PH-6)], fill=WALL_HIGH, width=1)
    # Runic glyph on pillar
    d.ellipse([(plx-3, ply-PH//2-4), (plx+3, ply-PH//2+4)], fill=GLOW_TEAL)


# =============================================================================
# 12. FLOOR RUNIC CIRCLES (decorative)
# =============================================================================
# Corner accent circles in each quadrant floor
RUNE_POSITIONS = [
    (tx(3) + TILE//2,  ty(9) + TILE//2),
    (tx(21) + TILE//2, ty(9) + TILE//2),
    (tx(12) + TILE//2, ty(3) + TILE//2),
    (tx(12) + TILE//2, ty(14) + TILE//2),
]
for rx, ry in RUNE_POSITIONS:
    for rr in [18, 14, 10]:
        d.ellipse([(rx-rr, ry-rr), (rx+rr, ry+rr)], outline=GOLD, width=1)
    for ri in range(6):
        angle = math.radians(ri * 60)
        rrx = int(rx + 11 * math.cos(angle))
        rry = int(ry + 11 * math.sin(angle))
        d.ellipse([(rrx-2, rry-2), (rrx+2, rry+2)], fill=GOLD_L)


# =============================================================================
# 13. WALL BANNERS (hanging from top wall) - five club banners
# =============================================================================
BANNER_DATA = [
    (tx(4)+TILE,  (220,210,160), (210,172, 55), 'sun'),    # White - Order of Sun
    (tx(8)+TILE,  ( 30,144,255), ( 55, 80,160), 'drop'),   # Blue - Tidefall
    (tx(12)+TILE, ( 75,  0,130), (138, 43,226), 'skull'),  # Black - Shadowmere
    (tx(16)+TILE, (180, 20, 50), (220, 60, 40), 'flame'),  # Red - Embercrest
    (tx(20)+TILE, ( 34,139, 34), ( 55,180, 55), 'leaf'),   # Green - Thornveil
]

bw = 28
bh = 52
for bx_c, bc_dark, bc_light, emblem in BANNER_DATA:
    # Curtain rod
    d.line([(bx_c - bw//2 - 4, ty(0)+5), (bx_c + bw//2 + 4, ty(0)+5)],
           fill=WOOD_H, width=3)
    # Banner cloth (pointed bottom)
    d.polygon([(bx_c - bw//2, ty(0) + 6),
               (bx_c + bw//2, ty(0) + 6),
               (bx_c + bw//2, ty(0) + 6 + bh),
               (bx_c, ty(0) + 6 + bh + 10),
               (bx_c - bw//2, ty(0) + 6 + bh)],
              fill=bc_dark)
    # Lighter center strip (4px wide down middle)
    d.rectangle([(bx_c - 2, ty(0)+8), (bx_c+2, ty(0)+6+bh-4)], fill=bc_light)
    # 5-dot star emblem in GOLD centered on banner
    star_cy = ty(0) + 6 + bh//2
    for si in range(5):
        sa = math.radians(si * 72 - 90)
        sx2 = int(bx_c + 7 * math.cos(sa))
        sy2 = int(star_cy + 7 * math.sin(sa))
        d.ellipse([(sx2-2, sy2-2), (sx2+2, sy2+2)], fill=GOLD)
    # Small emblem dot in GOLD_L at center
    d.ellipse([(bx_c-3, star_cy-3), (bx_c+3, star_cy+3)], fill=GOLD_L)


# =============================================================================
# 14. SUBTLE AMBIENT GLOW OVERLAY (fountain light)
# =============================================================================
# Soft radial teal glow on floor around fountain
GLOW_CENTER_X, GLOW_CENTER_Y = FNX, FNY + 10
GLOW_MAX_R = 160

for gy in range(max(ty(3), GLOW_CENTER_Y - GLOW_MAX_R),
               min(ty(16), GLOW_CENTER_Y + GLOW_MAX_R)):
    for gx in range(max(tx(4), GLOW_CENTER_X - GLOW_MAX_R),
                    min(tx(20), GLOW_CENTER_X + GLOW_MAX_R)):
        dist = math.sqrt((gx - GLOW_CENTER_X)**2 + (gy - GLOW_CENTER_Y)**2)
        if dist < GLOW_MAX_R:
            t = 1.0 - dist / GLOW_MAX_R
            t = t * t * 0.15  # subtle, quadratic falloff
            px_col = img.getpixel((gx, gy))
            blended = tuple(min(255, int(px_col[i] + t * (CRYS_TEAL[i] - px_col[i]))) for i in range(3))
            img.putpixel((gx, gy), blended)


# =============================================================================
# 15. HUD BAR AREA (top 30px — very dark overlay)
# =============================================================================
d.rectangle([(0, 0), (W, 30)], fill=HUD_BG)
# Subtle gold divider line
d.line([(0, 29), (W, 29)], fill=(80, 68, 28), width=1)
d.line([(0, 30), (W, 30)], fill=GOLD, width=1)


# =============================================================================
# 16. CORNER STONE BRACKETS
# =============================================================================
# Decorative corner stonework at wall intersections
CORNERS = [(tx(0), ty(0)), (tx(24), ty(0)), (tx(0), ty(17)), (tx(24), ty(17))]
for cnx, cny in CORNERS:
    d.rectangle([(cnx, cny), (cnx+TILE, cny+TILE)], fill=STN0)
    d.rectangle([(cnx+2, cny+2), (cnx+TILE-2, cny+TILE-2)], fill=STN1)
    d.line([(cnx+4, cny+4), (cnx+TILE-4, cny+4)], fill=WALL_HIGH, width=1)
    d.line([(cnx+4, cny+4), (cnx+4, cny+TILE-4)], fill=WALL_HIGH, width=1)
    d.ellipse([(cnx+TILE//2-3, cny+TILE//2-3), (cnx+TILE//2+3, cny+TILE//2+3)],
              fill=GOLD)


# =============================================================================
# SAVE
# =============================================================================
out = r'C:\Users\Kenny\mana-tactics\public\assets\hub-bg.png'
img.save(out)
print('Saved %dx%d -> %s' % (W, H, out))
