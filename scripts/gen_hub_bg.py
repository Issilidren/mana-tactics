"""
gen_hub_bg.py  — Rich isometric pre-rendered background for the Hub scene.

Approach (Tasklet): one PNG replaces the live tile grid so there are zero
sprite-extraction seams. Characters walk on top via IsoEngine grid math.

Run:   python3 scripts/gen_hub_bg.py
Out:   public/assets/hub-bg.png  (1184×636)
Use in HubScene:
    this.add.image(400, 306, 'hub-bg').setDepth(-2)
"""

import os, math, random
from PIL import Image, ImageDraw, ImageFilter

# ── Map (mirrors HubScene.js HUB_MAP exactly) ────────────────────────────────
VOID=0;STONE=1;GRASS=2;WATER=3;WOOD=4
WALL=5;BOOKSHELF=6;TABLE=7;FOUNTAIN=8;CARPET=9;DOOR=10

S=STONE;G=GRASS;W=WATER;WL=WALL;BK=BOOKSHELF;TB=TABLE;FN=FOUNTAIN;DR=DOOR

HUB_MAP = [
    [WL,WL,WL,WL,WL,WL,WL,WL,WL,DR,DR,WL,WL,WL,WL,WL,WL,WL,WL,WL],
    [WL, S, S, S, S,BK, S, S, S, S, S, S, S, S,BK, S, S, S, S,WL],
    [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL],
    [WL, S, S,TB, S, S, S, S, S, S, S, S, S, S, S, S,TB, S, S,WL],
    [WL, S, S, S, S, S, S, S, G, G, G, G, S, S, S, S, S, S, S,WL],
    [DR, S, S, S, S, S, S, G, G, G, G, G, G, S, S, S, S, S, S,DR],
    [WL, S, S, S, S, S, G, G, G,FN,FN, G, G, G, S, S, S, S, S,WL],
    [WL, S, S, S, S, S, G, G,FN, W, W,FN, G, G, S, S, S, S, S,WL],
    [WL, S, S, S, S, S, G, G,FN, W, W,FN, G, G, S, S, S, S, S,WL],
    [WL, S, S, S, S, S, G, G, G,FN,FN, G, G, G, S, S, S, S, S,WL],
    [DR, S, S, S, S, S, S, G, G, G, G, G, G, S, S, S, S, S, S,DR],
    [WL, S, S, S, S, S, S, S, G, G, G, G, S, S, S, S, S, S, S,WL],
    [WL, S, S,TB, S, S, S, S, S, S, S, S, S, S, S, S,TB, S, S,WL],
    [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL],
    [WL, S, S, S, S,BK, S, S, S, S, S, S, S, S,BK, S, S, S, S,WL],
    [WL,WL,WL,WL,WL,WL,WL,WL,WL,DR,DR,WL,WL,WL,WL,WL,WL,WL,WL,WL],
]
MAP_COLS, MAP_ROWS = 20, 16

# ── IsoEngine grid params (must match HubScene.js create()) ───────────────────
TW, TH = 64, 32
SW, SH = 800, 600
ORIGIN_X = SW//2 - ((MAP_COLS-1)-(MAP_ROWS-1))*(TW//4)   # 336
ORIGIN_Y = SH//2 - ((MAP_COLS-1)+(MAP_ROWS-1))*(TH//4)+20  # 48

IMG_LEFT, IMG_TOP     = -192, -12
IMG_RIGHT, IMG_BOTTOM =  992, 624
IMG_W = IMG_RIGHT - IMG_LEFT   # 1184
IMG_H = IMG_BOTTOM - IMG_TOP   # 636

# ── Colour palette ────────────────────────────────────────────────────────────
# Floor
FL_A  = (188, 162,  98)   # warm tan A
FL_B  = (168, 144,  82)   # warm tan B (alt)
FL_ML = (140, 118,  64)   # mortar line
FL_SH = (148, 126,  70)   # shadow edge

# Wall stone
WL_TOP  = (125, 118, 130)
WL_LFT  = ( 88,  82,  94)
WL_RGT  = ( 72,  66,  78)
WL_OUT  = ( 55,  50,  60)
WL_ML   = ( 62,  56,  68)   # mortar line on wall face
WL_HI   = (155, 148, 164)   # highlight on top

# Carpet / green
CARP_A  = (148,  28,  38)
CARP_B  = (124,  20,  28)
CARP_E  = (168,  88,  28)   # gold border
GRSS_A  = ( 58,  96,  44)
GRSS_B  = ( 44,  78,  32)

# Bookshelf
BK_WD   = ( 92,  56,  24)   # wood
BK_FACE = ( 72,  40,  12)
BK_TOP  = (118,  78,  34)
BOOKS   = [(195,55,55),(55,115,195),(55,175,80),(210,160,40),
           (145,60,195),(195,105,40),(55,195,185),(215,215,55),(165,48,88)]

# Table
TB_TOP  = (158, 108,  48)
TB_LFT  = (118,  78,  28)
TB_RGT  = ( 98,  62,  18)
TB_OUT  = ( 72,  46,  10)

# Fountain / water
FN_TOP  = (108, 130, 148)
FN_LFT  = ( 78, 100, 118)
FN_RGT  = ( 60,  82, 100)
FN_OUT  = ( 42,  64,  82)
WT_TOP  = ( 38,  98, 175)
WT_HI   = ( 80, 160, 220)
CRYS    = ( 60, 210, 200)
CRYS_HI = (180, 255, 245)

# Door
DR_TOP  = (195, 155,  55)
DR_LFT  = (155, 115,  25)
DR_RGT  = (135,  95,  15)
DR_OUT  = ( 95,  65,   5)
DR_GLW  = ( 80, 205, 195)   # portal glow

# Ambient
AMB_TORCH = (200, 130,  40)   # warm torch glow
AMB_CRYS  = ( 40, 200, 185)   # crystal glow

# ── Coordinate helpers ────────────────────────────────────────────────────────
def w2i(wx, wy):
    return (int(round(wx - IMG_LEFT)), int(round(wy - IMG_TOP)))

def gc(col, row):
    """Grid (col,row) → world center (cx, cy)."""
    return (ORIGIN_X + (col-row)*(TW//2),
            ORIGIN_Y + (col+row)*(TH//2))

def shade(c, amt):
    return tuple(max(0,min(255,v+amt)) for v in c)

def blend(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))

def lerp3(c0, c1, t):
    return blend(c0, c1, t)

# ── Drawing primitives ────────────────────────────────────────────────────────
def diamond(draw, wx, wy, tw, th, fill, outline=None):
    pts = [w2i(wx, wy-th/2), w2i(wx+tw/2, wy),
           w2i(wx, wy+th/2), w2i(wx-tw/2, wy)]
    draw.polygon(pts, fill=fill)
    if outline:
        draw.polygon(pts, outline=outline)

def elevated(draw, wx, wy, tw, th, h, top, left, right, outline):
    pts_l = [w2i(wx-tw/2,wy-h), w2i(wx,wy+th/2-h),
             w2i(wx,wy+th/2),   w2i(wx-tw/2,wy)]
    pts_r = [w2i(wx+tw/2,wy-h), w2i(wx,wy+th/2-h),
             w2i(wx,wy+th/2),   w2i(wx+tw/2,wy)]
    pts_t = [w2i(wx,wy-th/2-h), w2i(wx+tw/2,wy-h),
             w2i(wx,wy+th/2-h), w2i(wx-tw/2,wy-h)]
    draw.polygon(pts_l, fill=left)
    draw.polygon(pts_r, fill=right)
    draw.polygon(pts_t, fill=top)
    # Outline top + side edges only
    draw.polygon(pts_t, outline=outline)
    # Vertical edges
    ix0,iy0=w2i(wx-tw/2,wy);  ix1,iy1=w2i(wx-tw/2,wy-h)
    draw.line([ix0,iy0,ix1,iy1], fill=outline, width=1)
    ix0,iy0=w2i(wx+tw/2,wy);  ix1,iy1=w2i(wx+tw/2,wy-h)
    draw.line([ix0,iy0,ix1,iy1], fill=outline, width=1)
    ix0,iy0=w2i(wx,wy+th/2);  ix1,iy1=w2i(wx,wy+th/2-h)
    draw.line([ix0,iy0,ix1,iy1], fill=outline, width=1)


# ── Stone floor tile with mortar lines ───────────────────────────────────────
def draw_stone_floor(draw, wx, wy, col, row):
    # Base checkerboard
    alt = (col+row) % 2 == 1
    base = shade(FL_B if alt else FL_A, -6 if alt else 0)
    # Subtle depth gradient: tiles closer to bottom are slightly darker
    depth_t = (row + col) / (MAP_ROWS + MAP_COLS - 2)
    base = shade(base, int(-10 * depth_t))
    diamond(draw, wx, wy, TW, TH, base)

    # Mortar grid lines inside the diamond
    # Horizontal mortar (parallel to left-right iso axis)
    ix_c, iy_c = w2i(wx, wy)
    half_w, half_h = TW//2, TH//2
    # Two horizontal lines crossing the diamond
    for frac in [0.33, 0.67]:
        # Left half line
        lx0 = int(wx - TW/2 * (1-frac))
        ly0 = int(wy + TH/2 * frac - TH/4)
        lx1 = int(wx + TW/2 * frac)
        ly1 = int(wy - TH/2 * (1-frac))
        p0, p1 = w2i(lx0, ly0), w2i(lx1, ly1)
        draw.line([p0, p1], fill=FL_ML, width=1)
        # Right half
        rx0 = int(wx + TW/2 * (1-frac))
        ry0 = int(wy + TH/2 * frac - TH/4)
        rx1 = int(wx - TW/2 * frac)
        ry1 = int(wy - TH/2 * (1-frac))
        draw.line([w2i(rx0,ry0), w2i(rx1,ry1)], fill=FL_ML, width=1)


# ── Carpet / grass tile ───────────────────────────────────────────────────────
def draw_carpet(draw, wx, wy, col, row):
    # Determine if this is on the N-S carpet corridor (cols 9-10) or edge
    on_carpet = (col in (9, 10))
    if on_carpet:
        base = CARP_A if (col+row)%2==0 else CARP_B
        diamond(draw, wx, wy, TW, TH, base)
        # Gold border stripe along diamond edges
        inner_scale = 0.80
        pts_inner = [
            w2i(wx,          wy - TH/2*inner_scale),
            w2i(wx+TW/2*inner_scale, wy),
            w2i(wx,          wy + TH/2*inner_scale),
            w2i(wx-TW/2*inner_scale, wy),
        ]
        draw.polygon(pts_inner, outline=CARP_E)
    else:
        base = GRSS_A if (col+row)%2==0 else GRSS_B
        diamond(draw, wx, wy, TW, TH, base)
        # Grass texture dots
        random.seed(col*100+row)
        cx, cy = w2i(wx, wy)
        for _ in range(5):
            dx = random.randint(-16, 16)
            dy = random.randint(-6, 6)
            draw.ellipse([(cx+dx-1,cy+dy-1),(cx+dx+1,cy+dy+1)],
                         fill=shade(base, 15))


# ── Wall tile with stone brick face ──────────────────────────────────────────
def draw_wall(draw, wx, wy, col, row):
    h = 28
    elevated(draw, wx, wy, TW, TH, h, WL_TOP, WL_LFT, WL_RGT, WL_OUT)

    # Brick lines on left face
    lx0,ly0 = w2i(wx-TW/2, wy)
    lx1,ly1 = w2i(wx,      wy+TH/2)
    lx2,ly2 = w2i(wx-TW/2, wy-h)
    lx3,ly3 = w2i(wx,      wy+TH/2-h)
    # Horizontal brick mortar on left face, every ~8px
    face_h = ly1 - ly3 if ly1 > ly3 else 1
    for brick_y_frac in [0.30, 0.55, 0.78]:
        by = int(ly3 + face_h * brick_y_frac)
        # Interpolate x across the left face at this y
        t_left  = (by - ly2) / max(1, ly0 - ly2)
        t_right = (by - ly3) / max(1, ly1 - ly3)
        bx_l = int(lx2 + t_left  * (lx0 - lx2))
        bx_r = int(lx3 + t_right * (lx1 - lx3))
        draw.line([(bx_l, by), (bx_r, by)], fill=WL_ML, width=1)

    # Brick lines on right face
    rx0,ry0 = w2i(wx+TW/2, wy)
    rx1,ry1 = w2i(wx,      wy+TH/2)
    rx2,ry2 = w2i(wx+TW/2, wy-h)
    rx3,ry3 = w2i(wx,      wy+TH/2-h)
    face_h2 = ry1 - ry3 if ry1 > ry3 else 1
    for brick_y_frac in [0.30, 0.55, 0.78]:
        by = int(ry3 + face_h2 * brick_y_frac)
        t_left  = (by - ry2) / max(1, ry0 - ry2)
        t_right = (by - ry3) / max(1, ry1 - ry3)
        bx_l = int(rx2 + t_left  * (rx0 - rx2))
        bx_r = int(rx3 + t_right * (rx1 - rx3))
        draw.line([(bx_l, by), (bx_r, by)], fill=WL_ML, width=1)

    # Highlight top edge
    tx0,ty0 = w2i(wx,       wy-TH/2-h)
    tx1,ty1 = w2i(wx+TW/2,  wy-h)
    tx2,ty2 = w2i(wx,       wy+TH/2-h)
    tx3,ty3 = w2i(wx-TW/2,  wy-h)
    draw.line([(tx0,ty0),(tx1,ty1)], fill=WL_HI, width=1)
    draw.line([(tx0,ty0),(tx3,ty3)], fill=WL_HI, width=1)


# ── Door tile ─────────────────────────────────────────────────────────────────
def draw_door(draw, wx, wy, col, row):
    h = 4
    elevated(draw, wx, wy, TW, TH, h, DR_TOP, DR_LFT, DR_RGT, DR_OUT)
    # Small glow dot at center
    cx, cy = w2i(wx, wy-h-2)
    draw.ellipse([(cx-4,cy-3),(cx+4,cy+3)], fill=DR_GLW)
    draw.ellipse([(cx-2,cy-1),(cx+2,cy+1)], fill=CRYS_HI)


# ── Bookshelf tile ────────────────────────────────────────────────────────────
def draw_bookshelf(draw, wx, wy, col, row):
    h = 22
    elevated(draw, wx, wy, TW, TH, h, BK_TOP, BK_WD, BK_FACE, shade(BK_WD,-20))

    # Book spines on the right (visible) face
    # Right face corners in image space
    rf_tl = w2i(wx+TW/2, wy-h)
    rf_bl = w2i(wx+TW/2, wy)
    rf_tr = w2i(wx, wy+TH/2-h)
    rf_br = w2i(wx, wy+TH/2)
    face_w = rf_bl[0] - rf_tr[0]
    face_h = rf_br[1] - rf_tl[1]
    if face_w > 4 and face_h > 4:
        random.seed(col*37+row*13)
        x = rf_tl[0] + 2
        shelf_top = rf_tl[1] + 3
        shelf_bot = rf_bl[1] - 3
        bi = (col + row * 3)
        while x < rf_bl[0] - 3:
            bw = random.randint(4, 8)
            bc = BOOKS[bi % len(BOOKS)]
            bx0, bx1 = x, min(x+bw-1, rf_bl[0]-3)
            # Slant the book rect with the face angle
            # Approximate: just draw a vertical rect clipped to face
            draw.rectangle([(bx0, shelf_top+1), (bx1, shelf_bot-1)], fill=bc)
            draw.line([(bx0+1, shelf_top+2),(bx0+1, shelf_bot-2)],
                      fill=shade(bc,40), width=1)
            x += bw + 1
            bi += 1

    # Wood shelf strip on top face highlight
    tx0,ty0 = w2i(wx, wy-TH/2-h)
    tx1,ty1 = w2i(wx+TW/2, wy-h)
    draw.line([(tx0,ty0),(tx1,ty1)], fill=BK_TOP, width=2)


# ── Study table ───────────────────────────────────────────────────────────────
def draw_table(draw, wx, wy, col, row):
    h = 10
    elevated(draw, wx, wy, TW, TH, h, TB_TOP, TB_LFT, TB_RGT, TB_OUT)
    # Book + candle on top face
    tx0,ty0 = w2i(wx-8,  wy-h-4)
    tx1,ty1 = w2i(wx+2,  wy-h+2)
    bc = BOOKS[(col+row*7) % len(BOOKS)]
    draw.rectangle([tx0,ty0,tx1,ty1], fill=bc)
    draw.rectangle([tx0,ty0,tx1,ty0+3], fill=shade(bc,-30))
    # Candle
    cx2,cy2 = w2i(wx+10, wy-h-2)
    draw.rectangle([(cx2-2,cy2),(cx2+2,cy2+6)], fill=(230,225,200))
    draw.ellipse([(cx2-3,cy2-6),(cx2+3,cy2)], fill=(240,155,38))
    draw.ellipse([(cx2-1,cy2-4),(cx2+1,cy2-2)], fill=(255,230,180))


# ── Fountain rim tile ─────────────────────────────────────────────────────────
def draw_fountain_rim(draw, wx, wy, col, row):
    h = 14
    elevated(draw, wx, wy, TW, TH, h, FN_TOP, FN_LFT, FN_RGT, FN_OUT)
    # Small stone lines on top face
    tx0,ty0 = w2i(wx, wy-TH/2-h)
    tx1,ty1 = w2i(wx+TW/2, wy-h)
    draw.line([(tx0,ty0),(tx1,ty1)], fill=shade(FN_TOP,-15), width=1)


# ── Water / crystal center ────────────────────────────────────────────────────
def draw_water(draw, img, wx, wy, col, row):
    # Water surface diamond
    diamond(draw, wx, wy, TW, TH, WT_TOP)
    # Shimmer
    cx, cy = w2i(wx, wy)
    for dx, dy in [(-8,-3),(4,-4),(0,2),(-4,4),(6,0)]:
        draw.line([(cx+dx,cy+dy),(cx+dx+5,cy+dy-1)], fill=WT_HI, width=1)

    # If this is the center water tile, draw the crystal nexus
    if col == 9 and row == 7:
        _draw_crystal_nexus(draw, img, wx, wy)


def _draw_crystal_nexus(draw, img, wx, wy):
    cx, cy = w2i(wx, wy - 28)

    # Glow halos on the image directly (soft)
    for r, a in [(36, 0.18), (24, 0.28), (14, 0.40)]:
        for gy in range(cy-r, cy+r+1):
            for gx in range(cx-r, cx+r+1):
                if 0<=gx<IMG_W and 0<=gy<IMG_H:
                    d2 = (gx-cx)**2 + (gy-cy)**2
                    if d2 <= r*r:
                        t = a * (1 - d2/(r*r))
                        px = img.getpixel((gx,gy))
                        blended = tuple(int(px[k]*(1-t)+AMB_CRYS[k]*t) for k in range(3))
                        img.putpixel((gx,gy), blended)

    # Stone dais rings
    for ri, tc in [(22, (122,110,80)), (16, (142,132,100)), (10, (160,150,118))]:
        draw.ellipse([(cx-ri, cy-ri//2), (cx+ri, cy+ri//2)], fill=tc,
                     outline=shade(tc,-30))

    # Crystal spike
    pts_c = [(cx,cy-26),(cx+7,cy-10),(cx+4,cy),(cx-4,cy),(cx-7,cy-10)]
    draw.polygon(pts_c, fill=CRYS)
    # Highlight
    draw.polygon([(cx,cy-26),(cx+7,cy-10),(cx+3,cy-16)], fill=CRYS_HI)
    draw.line([(cx,cy-26),(cx+7,cy-10),(cx+4,cy),(cx-4,cy),(cx-7,cy-10),(cx,cy-26)],
              fill=shade(CRYS_HI,-20), width=1)

    # Smaller satellite crystals
    for ang, col_c, sc in [
        (30,  (55, 180, 235), (160,230,255)),
        (150, (160, 80, 225), (205,165,255)),
        (270, (220, 60,  50), (255,130,120)),
    ]:
        rad = math.radians(ang)
        sx = int(cx + 14*math.cos(rad))
        sy = int(cy + 7 *math.sin(rad))
        pts_s = [(sx,sy-14),(sx+4,sy-5),(sx+3,sy),(sx-3,sy),(sx-4,sy-5)]
        draw.polygon(pts_s, fill=col_c)
        draw.line([(sx,sy-14),(sx+4,sy-5)], fill=sc, width=1)

    # Glow spokes
    for ang2, sc2 in [(270,(255,255,220)),(30,(30,144,255)),(150,(138,43,226))]:
        rad2 = math.radians(ang2)
        ex = int(cx + 32*math.cos(rad2))
        ey = int(cy + 16*math.sin(rad2))
        draw.line([(cx,cy-10),(ex,ey)], fill=sc2, width=1)


# ── Guild banners on top-row wall tiles ───────────────────────────────────────
BANNER_DATA = [
    (3,  0, (215, 205, 155), (210,172,55)),   # gold/white
    (6,  0, (30,  144, 255), (55, 80, 160)),  # blue
    (9,  0, (75,   0, 130), (138,43, 226)),   # purple (door gap — skip)
    (12, 0, (175,  18,  48), (220,60,  40)),  # red
    (16, 0, (34,  139,  34), (55,180,  55)),  # green
]

def draw_banners(draw):
    bw, bh = 14, 34
    for col, row, bc_dark, bc_light in BANNER_DATA:
        if HUB_MAP[row][col] == DOOR:
            continue
        wx, wy = gc(col, row)
        # Hang below the top face of the wall tile
        bx, by = w2i(wx, wy - 28 - 4)
        pts = [
            (bx-bw//2, by),
            (bx+bw//2, by),
            (bx+bw//2, by+bh),
            (bx,       by+bh+8),
            (bx-bw//2, by+bh),
        ]
        draw.polygon(pts, fill=bc_dark)
        draw.line([(bx-1, by+4),(bx-1, by+bh-4)], fill=bc_light, width=2)
        # Star dots
        sc_y = by + bh//2
        for si in range(5):
            sa = math.radians(si*72 - 90)
            draw.ellipse([(int(bx+5*math.cos(sa))-1, int(sc_y+5*math.sin(sa))-1),
                          (int(bx+5*math.cos(sa))+1, int(sc_y+5*math.sin(sa))+1)],
                         fill=(210,172,55))


# ── Ambient torch glow — applied to image pixels ─────────────────────────────
def apply_torch_glow(img):
    """Warm amber light near walls; teal glow from crystal center."""
    # Torch positions: perimeter wall tiles
    torch_positions = []
    for col in range(MAP_COLS):
        for row in (0, MAP_ROWS-1):
            if HUB_MAP[row][col] == WALL:
                torch_positions.append(gc(col, row))
    for row in range(1, MAP_ROWS-1):
        for col in (0, MAP_COLS-1):
            if HUB_MAP[row][col] == WALL:
                torch_positions.append(gc(col, row))

    pixels = img.load()
    # Teal glow from crystal center
    crys_wx, crys_wy = gc(9, 7)
    crys_ix, crys_iy = w2i(crys_wx, crys_wy - 28)

    for iy in range(IMG_H):
        for ix in range(IMG_W):
            wx2 = ix + IMG_LEFT
            wy2 = iy + IMG_TOP
            px = pixels[ix, iy]

            # Torch warmth
            torch_t = 0.0
            for twx, twy in torch_positions:
                d2 = (wx2-twx)**2 + (wy2-twy)**2
                r2 = 64*64
                if d2 < r2:
                    torch_t = max(torch_t, (1 - d2/r2)**1.5 * 0.22)
            if torch_t > 0:
                px = blend(px, AMB_TORCH, torch_t)

            # Crystal teal glow
            d2c = (ix-crys_ix)**2 + (iy-crys_iy)**2
            r2c = 90*90
            if d2c < r2c:
                t2 = (1 - d2c/r2c)**2 * 0.15
                px = blend(px, AMB_CRYS, t2)

            pixels[ix, iy] = px


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    random.seed(42)
    img = Image.new('RGB', (IMG_W, IMG_H), (22, 18, 36))
    draw = ImageDraw.Draw(img)

    # Render in painter's algorithm order
    order = sorted(
        ((col, row) for row in range(MAP_ROWS) for col in range(MAP_COLS)),
        key=lambda cr: (cr[0]+cr[1], cr[0])
    )

    for col, row in order:
        tile = HUB_MAP[row][col]
        if tile == VOID:
            continue
        wx, wy = gc(col, row)

        if   tile == STONE:    draw_stone_floor(draw, wx, wy, col, row)
        elif tile == GRASS:    draw_carpet(draw, wx, wy, col, row)
        elif tile == WATER:    draw_water(draw, img, wx, wy, col, row)
        elif tile == WALL:     draw_wall(draw, wx, wy, col, row)
        elif tile == BOOKSHELF:draw_bookshelf(draw, wx, wy, col, row)
        elif tile == TABLE:    draw_table(draw, wx, wy, col, row)
        elif tile == FOUNTAIN: draw_fountain_rim(draw, wx, wy, col, row)
        elif tile == DOOR:     draw_door(draw, wx, wy, col, row)

    # Banners on top wall
    draw_banners(draw)

    # Ambient lighting pass (torch warmth + crystal teal)
    print('Applying ambient lighting...')
    apply_torch_glow(img)

    # Subtle vignette
    for ix in range(IMG_W):
        for iy in range(IMG_H):
            edge = min(ix, IMG_W-1-ix, iy, IMG_H-1-iy)
            if edge < 48:
                t = (1 - edge/48) * 0.55
                px = img.getpixel((ix, iy))
                img.putpixel((ix,iy), blend(px, (8,6,18), t))

    out = os.path.normpath(
        os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'hub-bg.png')
    )
    img.save(out)
    print(f'hub-bg.png  →  {out}  ({IMG_W}×{IMG_H})')


if __name__ == '__main__':
    main()
