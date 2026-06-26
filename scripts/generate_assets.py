#!/usr/bin/env python3
"""
Mana Tactics — FFTA Chibi Sprite Generator (32×48 px RGBA).
Uses polygon-based isometric trapezoid bodies + layer compositing + drop shadows.
No external PNG files required — all layers are generated in-memory.
Run: python3 scripts/generate_assets.py
"""

from PIL import Image, ImageDraw
import os

BASE        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES_DIR = os.path.join(BASE, 'public', 'assets', 'sprites')
TILES_DIR   = os.path.join(BASE, 'public', 'assets', 'tiles')
os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(TILES_DIR,   exist_ok=True)

SW, SH = 32, 48   # sprite canvas
TW, TH = 32, 32   # tile canvas
T      = (0, 0, 0, 0)

# ── Shared palette ─────────────────────────────────────────────────────────────
OUTLINE   = (8,   6,  10, 255)

SKIN_A    = (248, 200, 128, 255)
SKIN_B    = (220, 164,  92, 255)
SKIN_PALE = (210, 228, 240, 255)
SKIN_PALE2= (180, 204, 220, 255)
SKIN_TAN  = (200, 148,  88, 255)
SKIN_TAN2 = (164, 112,  62, 255)

HAIR_BLACK= ( 32,  24,  18, 255)
HAIR_DARK = ( 52,  38,  26, 255)
HAIR_WHITE= (238, 234, 220, 255)
HAIR_PINK = (255, 138, 210, 255)
HAIR_RED  = (196,  56,  36, 255)
HAIR_AUBURN=(168,  80,  32, 255)
HAIR_BROWN= (136,  80,  32, 255)
HAIR_TEAL = ( 80, 200, 172, 255)
HAIR_ICE  = (160, 220, 240, 255)
HAIR_SILVER=(220, 228, 240, 255)
HAIR_GOLD = (220, 180,  60, 255)

EYE_D     = ( 20,  14,  12, 255)
EYE_SHINE = (255, 255, 255, 255)
IRIS_BLUE = ( 44, 118, 204, 255)
IRIS_BROWN= ( 96,  56,  22, 255)
IRIS_GREEN= ( 48, 148,  56, 255)
IRIS_PURP = (176,  56, 230, 255)
IRIS_ORAN = (230, 100,  20, 255)
EYE_GLO_B = ( 60, 180, 255, 255)
EYE_GLO_P = (200,  80, 255, 255)
EYE_GLO_G = ( 80, 220,  80, 255)
BLUSH     = (240, 148, 148, 160)
MOUTH     = (196, 108,  64, 255)

GOLD      = (212, 175,  55, 255)
GOLD_D    = (160, 128,  24, 255)
GOLD_HI   = (240, 210, 100, 255)

RED_A     = (220,  36,  36, 255)
RED_B     = (180,  18,  18, 255)
RED_C     = (140,   8,   8, 255)

BLUE_A    = ( 56, 106, 208, 255)
BLUE_B    = ( 36,  72, 164, 255)
BLUE_C    = ( 20,  44, 112, 255)
BLUE_HI   = ( 90, 150, 244, 255)

DARK_A    = ( 20,  10,  36, 255)
DARK_B    = ( 10,   4,  20, 255)
PURP_A    = (100,  30, 160, 255)
PURP_B    = ( 64,  16, 104, 255)
PURP_GLO  = (200,  80, 255, 255)

ARMOR_A   = (192,  28,   8, 255)
ARMOR_B   = (148,  14,   4, 255)
ARMOR_C   = ( 96,   8,   2, 255)
ARMOR_HI  = (240,  80,  60, 255)
CREST_A   = (255,  90,   0, 255)
CREST_B   = (255, 170,  40, 255)

GREEN_A   = ( 56, 144,  40, 255)
GREEN_B   = ( 36,  96,  24, 255)
GREEN_C   = ( 20,  60,  12, 255)

WHITE_A   = (250, 246, 234, 255)
WHITE_B   = (218, 210, 190, 255)
WHITE_C   = (184, 174, 152, 255)

PLATE_A   = (210, 212, 224, 255)
PLATE_B   = (170, 172, 188, 255)
PLATE_C   = (130, 132, 150, 255)
PLATE_HI  = (240, 242, 252, 255)

IRON_A    = (108, 116, 128, 255)
IRON_B    = ( 76,  84,  96, 255)
IRON_C    = ( 48,  54,  64, 255)
IRON_HI   = (168, 178, 194, 255)

TEAL_A    = ( 64, 180, 160, 255)
TEAL_B    = ( 40, 130, 114, 255)
TEAL_C    = ( 24,  88,  76, 255)

WATER_A   = ( 80, 185, 225, 255)
WATER_B   = ( 48, 132, 172, 255)
WATER_C   = ( 24,  84, 124, 255)

WIND_A    = (200, 215, 238, 255)
WIND_B    = (164, 182, 210, 255)
WIND_C    = (128, 148, 182, 255)

EARTH_A   = (108,  68,  24, 255)
EARTH_B   = ( 76,  44,  12, 255)
LEAF_A    = ( 64, 144,  44, 255)

BROWN_A   = (136,  80,  32, 255)
BROWN_B   = ( 96,  52,  16, 255)
BOOK_A    = (140,  58,  28, 255)
BOOK_B    = (100,  36,  12, 255)
BOOK_PAGE = (244, 235, 208, 255)
SHOE      = ( 28,  20,  28, 255)
SHOE_HI   = ( 52,  44,  58, 255)


# ══════════════════════════════════════════════════════════════════════════════
#  LOW-LEVEL HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def canvas():
    return Image.new('RGBA', (SW, SH), T)

def px(im, x, y, c):
    if 0 <= x < SW and 0 <= y < SH:
        im.putpixel((x, y), c)

def hline(im, y, x0, x1, c):
    for x in range(x0, x1+1): px(im, x, y, c)

def vline(im, x, y0, y1, c):
    for y in range(y0, y1+1): px(im, x, y, c)

def fill(im, x0, y0, x1, y1, c):
    for y in range(y0, y1+1):
        for x in range(x0, x1+1): px(im, x, y, c)

def outline(img):
    """1px black outline around all opaque pixels."""
    w, h = img.size
    src = [img.getpixel((x, y)) for y in range(h) for x in range(w)]
    def a(x, y): return src[y*w+x][3] if 0 <= x < w and 0 <= y < h else 0
    out = img.copy()
    for y in range(h):
        for x in range(w):
            if src[y*w+x][3] < 32:
                for dx, dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,-1),(-1,1),(1,1)]:
                    if a(x+dx, y+dy) > 64:
                        out.putpixel((x, y), OUTLINE)
                        break
    return out

def save_sprite(img, name):
    img = outline(img)
    img.save(os.path.join(SPRITES_DIR, f'{name}.png'))
    print(f'  saved sprites/{name}.png')

def save_tile(img, name):
    img.save(os.path.join(TILES_DIR, f'{name}.png'))
    print(f'  saved tiles/{name}.png')


# ══════════════════════════════════════════════════════════════════════════════
#  ISOMETRIC POLYGON LAYER SYSTEM
#  Each "draw_*" creates a fresh RGBA layer and composites it onto `im`.
#  This avoids rectangle artifacts — every body shape uses polygon().
# ══════════════════════════════════════════════════════════════════════════════

def draw_drop_shadow(im, cx=16, cy=46):
    """Semi-transparent oval shadow anchors sprite to isometric floor."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.ellipse([cx-11, cy-3, cx+11, cy+3], fill=(0, 0, 0, 72))
    im.alpha_composite(layer)


def draw_iso_robe(im, col_near, col_mid, col_far, y_top=26, y_bot=44, trim=None):
    """
    Isometric trapezoid robe using polygon() — proper 3/4 perspective.
    Near half (left) = brighter, far half (right) = darker.
    Near bottom corner is 1px lower than far (depth cue).
    Shoulders wide (~22px), hem narrow (~6px) for clear chibi silhouette.
    """
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)

    # Near (left) half — viewer-side, brighter
    near = [(5, y_top), (16, y_top), (15, y_bot), (11, y_bot+1)]
    d.polygon(near, fill=col_near)

    # Far (right) half — back-side, darker
    far = [(16, y_top), (27, y_top), (20, y_bot-1), (15, y_bot)]
    d.polygon(far, fill=col_mid)

    # Far edge — darkest strip
    edge = [(25, y_top), (27, y_top), (20, y_bot-1), (23, y_bot-1)]
    d.polygon(edge, fill=col_far)

    # Center fold highlight
    for y in range(y_top+2, y_bot-2):
        t = (y - y_top) / max(1, y_bot - y_top)
        cx = int(16 - t * 1)
        px(layer, cx, y, col_mid)

    im.alpha_composite(layer)

    # Gold hem trim
    if trim:
        for y in [y_bot-1, y_bot]:
            hline(im, y, 12, 20, trim)


def draw_iso_armor(im, col_hi, col_mid, col_shadow, y_top=26, y_bot=44):
    """Armor body — same isometric trapezoid but with plate shading."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)

    # Near plate panel
    near = [(5, y_top), (15, y_top), (14, y_bot), (10, y_bot+1)]
    d.polygon(near, fill=col_hi)
    # Far plate panel
    far = [(15, y_top), (27, y_top), (21, y_bot-1), (14, y_bot)]
    d.polygon(far, fill=col_mid)
    # Far shadow edge
    edge = [(24, y_top), (27, y_top), (21, y_bot-1), (23, y_bot-1)]
    d.polygon(edge, fill=col_shadow)
    # Gold chest line
    for y in range(y_top, y_top+2):
        hline(layer, y, 5, 27, GOLD)

    im.alpha_composite(layer)


def draw_chibi_head(im, skin, shadow, hair, iris=IRIS_BLUE, has_blush=True, glow=None):
    """
    Chibi SD head — oversized for FFTA look (y=2-20 = 18px = 37% of 48px sprite).
    Uses ellipse() for round head + explicit pixel details.
    Near (left) ear wider, far (right) smaller for 3/4 view.
    """
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    # Main round head — tall chibi oval
    d.ellipse([6, 2, 26, 20], fill=skin)
    # Near (left) ear/cheek bulge
    d.ellipse([4, 5, 10, 17], fill=skin)
    # Far (right) ear — smaller, shadowed
    d.ellipse([22, 6, 27, 16], fill=shadow)
    im.alpha_composite(layer)

    # Far-side face shading
    for y in range(5, 20):
        x = 25 - max(0, (y-5)//4)
        px(im, x, y, shadow)
    hline(im, 19, 9, 24, shadow)  # chin

    # Hair (top + sides)
    fill(im, 7, 0, 25, 5, hair)
    fill(im, 5, 2, 8, 11, hair)   # near side
    fill(im, 24, 2, 27, 11, hair) # far side

    # Eyes — SD style: sit in lower half of head
    ey = 9
    fill(im, 9, ey, 12, ey+2, EYE_D)
    fill(im, 18, ey, 20, ey+2, EYE_D)
    px(im, 10, ey+1, iris); px(im, 11, ey+1, iris)
    px(im, 18, ey+1, iris)
    px(im, 12, ey, EYE_SHINE); px(im, 20, ey, EYE_SHINE)
    if glow:
        px(im, 10, ey+2, glow); px(im, 11, ey+2, glow)

    if has_blush:
        fill(im, 6, ey+2, 8, ey+3, BLUSH)
        fill(im, 22, ey+2, 24, ey+3, BLUSH)

    # Mouth
    hline(im, 16, 12, 18, MOUTH)
    px(im, 12, 16, shadow); px(im, 18, 16, shadow)


def draw_neck(im, skin):
    fill(im, 13, 20, 19, 24, skin)


def draw_iso_shoulders(im, col, y=25):
    """Full-width shoulder block — clearly wider than head (head x=6-26) for SD silhouette."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    # Isometric shoulder bar: slightly wider on near side
    pts = [(0, y-3), (SW-1, y-3), (SW-2, y+1), (1, y+1)]
    d.polygon(pts, fill=col)
    # Near highlight
    hline(layer, y-3, 0, SW-1, col)
    im.alpha_composite(layer)


def draw_feet(im, boot=SHOE, boot_hi=SHOE_HI):
    """Left foot (near/forward, lower), right foot (far/back, higher)."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    # Near foot — left, slightly lower
    d.ellipse([6, 43, 14, 47], fill=boot)
    px(layer, 7, 43, boot_hi); px(layer, 8, 43, boot_hi)
    # Far foot — right, slightly higher
    d.ellipse([17, 42, 24, 46], fill=boot)
    px(layer, 18, 42, boot_hi); px(layer, 19, 42, boot_hi)
    im.alpha_composite(layer)


def draw_staff(im, staff_col, tip_col=None):
    """Wooden/magic staff on left side."""
    vline(im, 2, 5, 46, staff_col)
    vline(im, 3, 5, 46,
          tuple(max(0, c-20) for c in staff_col[:3]) + (255,))
    if tip_col:
        fill(im, 0, 2, 4, 6, tip_col)
        px(im, 2, 1, tuple(min(255, c+40) for c in tip_col[:3]) + (255,))


# ══════════════════════════════════════════════════════════════════════════════
#  SPRITE FUNCTIONS — each uses layer compositing
# ══════════════════════════════════════════════════════════════════════════════

def make_npc_white():
    """Scholar Lirien — white/gold robes, white hair, crystal staff."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_A, BROWN_B)
    draw_iso_robe(im, WHITE_A, WHITE_B, WHITE_C, trim=GOLD)
    # Gold vertical lapel
    vline(im, 14, 26, 42, GOLD); vline(im, 15, 26, 42, GOLD_D)
    draw_iso_shoulders(im, GOLD)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_WHITE, iris=IRIS_BLUE)
    # Halo dots above head
    for hx in [9, 12, 16, 20, 23]: px(im, hx, 0, GOLD)
    # Crystal staff
    draw_staff(im, WHITE_B, tip_col=(160, 220, 255, 255))
    save_sprite(im, 'npc-white')


def make_npc_blue():
    """Wizard Kael — deep blue robes, dark hair, glowing orb."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, SHOE, SHOE_HI)
    draw_iso_robe(im, BLUE_A, BLUE_B, BLUE_C, trim=GOLD)
    vline(im, 14, 26, 42, GOLD_D); vline(im, 15, 26, 42, GOLD)
    draw_iso_shoulders(im, GOLD_D)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_DARK, iris=IRIS_BLUE)
    # Glowing orb in left hand
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.ellipse([1, 29, 6, 34], fill=BLUE_HI)
    d.ellipse([2, 30, 5, 33], fill=(200, 240, 255, 255))
    im.alpha_composite(layer)
    px(im, 2, 29, (255, 255, 255, 180))
    save_sprite(im, 'npc-blue')


def make_npc_black():
    """Shade Duskren — dark hooded cloak, pale skin, purple wisps."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, DARK_A, DARK_B)
    draw_iso_robe(im, DARK_A, DARK_B, (4, 2, 8, 255), trim=PURP_A)
    draw_iso_shoulders(im, PURP_B)
    draw_neck(im, SKIN_PALE)
    # Hood pre-fill (covers head area)
    fill(im, 4, 0, 28, 22, DARK_A)
    fill(im, 5, 4, 27, 20, DARK_B)
    draw_chibi_head(im, SKIN_PALE, SKIN_PALE2, DARK_A, iris=EYE_GLO_P, has_blush=False)
    # Re-cover hood top and side panels
    fill(im, 4, 0, 28, 7, DARK_A)
    fill(im, 4, 6, 28, 10, DARK_B)
    fill(im, 4, 10, 8, 21, DARK_B)
    fill(im, 24, 10, 28, 21, DARK_B)
    # Purple wisps
    for wx, wy in [(2,30),(1,36),(29,31),(28,40),(3,42)]:
        px(im, wx, wy, PURP_GLO); px(im, wx+1, wy-1, PURP_A)
    save_sprite(im, 'npc-black')


def make_npc_red():
    """Knight Embrus — red/gold plate armor, fiery crest."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, SHOE, SHOE_HI)
    # Leg armor
    draw_iso_armor(im, ARMOR_A, ARMOR_B, ARMOR_C, y_top=34, y_bot=44)
    # Chest armor
    draw_iso_armor(im, ARMOR_A, ARMOR_B, ARMOR_C, y_top=26, y_bot=34)
    # Gold cross emblem
    vline(im, 14, 28, 33, GOLD); hline(im, 30, 9, 23, GOLD)
    # Shoulder pauldrons (isometric polygon)
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.polygon([(0,22),(6,22),(6,28),(1,28)], fill=ARMOR_B)
    d.polygon([(26,22),(31,22),(31,27),(26,27)], fill=ARMOR_C)
    hline(layer, 22, 0, 6, GOLD); hline(layer, 22, 26, 31, GOLD)
    im.alpha_composite(layer)
    draw_neck(im, SKIN_TAN)
    draw_chibi_head(im, SKIN_TAN, SKIN_TAN2, HAIR_RED, iris=IRIS_ORAN, has_blush=False)
    # Flame crest
    fill(im, 7, 0, 9, 3, CREST_A); fill(im, 12, 0, 14, 2, CREST_B)
    fill(im, 17, 0, 19, 3, CREST_A); px(im, 22, 1, CREST_B)
    save_sprite(im, 'npc-red')


def make_npc_green():
    """Ranger Thornwood — forest green druid robes, leaf accents, staff."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, BROWN_A)
    draw_iso_robe(im, GREEN_A, GREEN_B, GREEN_C, trim=GOLD_D)
    # Leaf pattern on robe
    for lx, ly in [(4,29),(23,31),(4,35),(23,38),(7,41),(21,43)]:
        fill(im, lx, ly, lx+2, ly+2, LEAF_A)
    vline(im, 14, 26, 42, GOLD_D)
    draw_iso_shoulders(im, GOLD_D)
    draw_neck(im, SKIN_TAN)
    draw_chibi_head(im, SKIN_TAN, SKIN_TAN2, HAIR_BROWN, iris=IRIS_GREEN)
    draw_staff(im, BROWN_A, tip_col=LEAF_A)
    save_sprite(im, 'npc-green')


def make_npc_librarian():
    """Grand Librarian Mira — crimson/gold robes, pink hair, open book."""
    CRIM_A = (172, 24, 48, 255); CRIM_B = (132, 14, 32, 255); CRIM_C = (92, 6, 18, 255)
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, BROWN_A)
    draw_iso_robe(im, CRIM_A, CRIM_B, CRIM_C, trim=GOLD)
    vline(im, 14, 26, 42, GOLD); vline(im, 15, 26, 42, GOLD_D)
    draw_iso_shoulders(im, GOLD)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_PINK, iris=IRIS_PURP)
    # Pink hair flowing
    fill(im, 4, 5, 7, 20, HAIR_PINK)
    fill(im, 25, 5, 28, 14, (220, 96, 170, 255))
    # Open book held in both hands
    fill(im, 8, 31, 23, 39, BOOK_PAGE)
    fill(im, 15, 31, 16, 39, BOOK_B)
    fill(im, 8, 31, 23, 32, BOOK_A); fill(im, 8, 38, 23, 39, BOOK_A)
    for ty in [34, 36]: hline(im, ty, 9, 14, BOOK_B); hline(im, ty, 17, 22, BOOK_B)
    save_sprite(im, 'npc-librarian')


def make_npc_merchant():
    """Merchant Voss — amber/gold robes, gray hair, coin pouch."""
    AMB_A = (200, 148, 48, 255); AMB_B = (160, 112, 28, 255); AMB_C = (120, 80, 12, 255)
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, SHOE, SHOE_HI)
    draw_iso_robe(im, AMB_A, AMB_B, AMB_C, trim=GOLD)
    vline(im, 15, 26, 42, GOLD)
    draw_iso_shoulders(im, GOLD)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, (170, 164, 154, 255), iris=IRIS_BROWN, has_blush=True)
    # Wide smile
    hline(im, 16, 10, 20, MOUTH)
    # Coin pouch in right hand
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.ellipse([24, 30, 30, 38], fill=AMB_B)
    im.alpha_composite(layer)
    for cy in [32, 34, 36]: px(im, 26, cy, GOLD); px(im, 27, cy, GOLD)
    save_sprite(im, 'npc-merchant')


def make_npc_caretaker():
    """Caretaker Elys — teal robes, teal hair, healing staff."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, BROWN_A)
    draw_iso_robe(im, TEAL_A, TEAL_B, TEAL_C, trim=GOLD_D)
    vline(im, 14, 26, 42, GOLD_D)
    draw_iso_shoulders(im, GOLD_D)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_TEAL, iris=(40, 180, 130, 255))
    draw_staff(im, BROWN_A, tip_col=(80, 220, 120, 255))
    save_sprite(im, 'npc-caretaker')


def make_npc_tactician():
    """Paladin Lyra — white/silver plate armor, gold trim, sun emblem."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, SHOE, SHOE_HI)
    draw_iso_armor(im, PLATE_A, PLATE_B, PLATE_C, y_top=34, y_bot=44)
    draw_iso_armor(im, PLATE_A, PLATE_B, PLATE_C, y_top=26, y_bot=34)
    # Sun emblem
    fill(im, 12, 28, 16, 32, GOLD); px(im, 14, 27, GOLD); px(im, 14, 33, GOLD)
    px(im, 11, 30, GOLD); px(im, 17, 30, GOLD)
    vline(im, 14, 27, 33, GOLD)
    # Left pauldron
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.polygon([(0,22),(7,22),(7,28),(1,28)], fill=PLATE_B)
    hline(layer, 22, 0, 7, GOLD)
    im.alpha_composite(layer)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_WHITE, iris=IRIS_BLUE, has_blush=False)
    # Helmet (covers top of chibi head)
    layer2 = Image.new('RGBA', (SW, SH), T)
    d2 = ImageDraw.Draw(layer2)
    d2.ellipse([5, 1, 27, 12], fill=PLATE_B)
    hline(layer2, 1, 8, 24, GOLD)
    fill(layer2, 6, 6, 26, 10, PLATE_C)  # visor
    px(layer2, 10, 7, GOLD_HI); px(layer2, 11, 7, GOLD_HI)
    px(layer2, 20, 7, GOLD_HI); px(layer2, 21, 7, GOLD_HI)
    im.alpha_composite(layer2)
    save_sprite(im, 'npc-tactician')


def make_npc_chronicler():
    """Scholar Wavren — navy robes, dark hair, scroll."""
    NAVY_A = (36, 56, 140, 255); NAVY_B = (22, 36, 96, 255); NAVY_C = (10, 20, 60, 255)
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, BROWN_A)
    draw_iso_robe(im, NAVY_A, NAVY_B, NAVY_C, trim=GOLD_D)
    vline(im, 14, 26, 42, GOLD_D)
    draw_iso_shoulders(im, GOLD_D)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_DARK, iris=IRIS_BLUE)
    # Scroll in right hand
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.rectangle([24, 28, 30, 42], fill=BOOK_PAGE)
    d.ellipse([23, 26, 31, 30], fill=BROWN_B)
    d.ellipse([23, 40, 31, 44], fill=BROWN_B)
    vline(layer, 24, 28, 42, BOOK_A); vline(layer, 30, 28, 42, BOOK_A)
    im.alpha_composite(layer)
    for ty in [30, 33, 36, 39]: hline(im, ty, 25, 29, (160, 140, 100, 255))
    save_sprite(im, 'npc-chronicler')


def make_npc_shadow_student():
    """Shade Morven — deep hooded cloak, pale skin, purple aura."""
    SHAD_A = (44, 22, 68, 255); SHAD_B = (26, 12, 44, 255); SHAD_C = (12, 4, 22, 255)
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, DARK_A, DARK_B)
    draw_iso_robe(im, SHAD_A, SHAD_B, SHAD_C, trim=PURP_A)
    draw_iso_shoulders(im, PURP_B)
    draw_neck(im, SKIN_PALE)
    # Hood pre-fill
    fill(im, 4, 0, 28, 22, SHAD_A)
    fill(im, 5, 4, 27, 20, SHAD_B)
    draw_chibi_head(im, SKIN_PALE, SKIN_PALE2, SHAD_A, iris=EYE_GLO_P, has_blush=False)
    fill(im, 4, 0, 28, 8, SHAD_A)
    fill(im, 5, 7, 27, 10, SHAD_B)
    fill(im, 4, 10, 8, 21, SHAD_A)
    fill(im, 24, 10, 28, 21, SHAD_A)
    for wx, wy in [(2,29),(1,36),(29,30),(28,40),(3,43)]:
        px(im, wx, wy, PURP_GLO); px(im, wx+1, wy-1, PURP_A)
    save_sprite(im, 'npc-shadow-student')


def make_npc_fire_student():
    """Knight Blazer — red armor, spiky hair, flame in hand."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, SHOE, SHOE_HI)
    draw_iso_armor(im, ARMOR_A, ARMOR_B, ARMOR_C, y_top=34, y_bot=44)
    draw_iso_armor(im, ARMOR_A, ARMOR_B, ARMOR_C, y_top=26, y_bot=34)
    draw_neck(im, SKIN_TAN)
    draw_chibi_head(im, SKIN_TAN, SKIN_TAN2, HAIR_RED, iris=IRIS_ORAN, has_blush=False)
    for hx, hy in [(8,0),(11,-1),(14,0),(17,-1),(20,0),(23,1)]:
        px(im, hx, max(0,hy), CREST_A); px(im, hx, max(0,hy+1), HAIR_RED)
    # Flame in left hand
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.polygon([(2,26),(5,26),(4,29),(3,29)], fill=(255, 160, 20, 255))
    d.polygon([(3,23),(4,23),(4,27),(3,27)], fill=(255, 80, 0, 255))
    im.alpha_composite(layer)
    px(im, 3, 22, (255, 220, 60, 180))
    save_sprite(im, 'npc-fire-student')


def make_npc_water_student():
    """Apprentice Rill — teal/aqua robes, ice-blue hair, water orb."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, BROWN_A)
    draw_iso_robe(im, WATER_A, WATER_B, WATER_C, trim=(140, 212, 255, 255))
    vline(im, 14, 26, 42, (100, 180, 220, 255))
    draw_iso_shoulders(im, (100, 180, 220, 255))
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_ICE, iris=EYE_GLO_B)
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.ellipse([1, 29, 6, 34], fill=WATER_A)
    d.ellipse([2, 30, 5, 33], fill=(200, 240, 255, 255))
    im.alpha_composite(layer)
    px(im, 2, 29, (240, 250, 255, 200))
    save_sprite(im, 'npc-water-student')


def make_npc_earth_student():
    """Visitor Thane — brown/green robes, brown hair, leaf staff."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, EARTH_B)
    draw_iso_robe(im, EARTH_A, EARTH_B, (50, 28, 8, 255), trim=LEAF_A)
    for lx, ly in [(3,29),(24,31),(4,35),(24,38)]:
        fill(im, lx, ly, lx+2, ly+2, LEAF_A); px(im, lx+1, ly+1, GREEN_B)
    vline(im, 14, 26, 42, LEAF_A)
    draw_iso_shoulders(im, LEAF_A)
    draw_neck(im, SKIN_TAN)
    draw_chibi_head(im, SKIN_TAN, SKIN_TAN2, HAIR_BROWN, iris=IRIS_GREEN)
    draw_staff(im, BROWN_A, tip_col=LEAF_A)
    save_sprite(im, 'npc-earth-student')


def make_npc_wind_student():
    """Visitor Zel — pale gray-blue robes, silver hair, flowing sash."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, BROWN_A)
    draw_iso_robe(im, WIND_A, WIND_B, WIND_C, trim=(190, 210, 250, 255))
    # Flowing sash on far side
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    for y in range(28, 42):
        t = (y - 28) / 14
        x = int(24 + t * 5)
        if x < SW:
            px(layer, x, y, WIND_B)
            if x+1 < SW: px(layer, x+1, y, WIND_A)
    im.alpha_composite(layer)
    draw_iso_shoulders(im, (180, 200, 230, 255))
    draw_neck(im, SKIN_PALE)
    draw_chibi_head(im, SKIN_PALE, SKIN_PALE2, HAIR_SILVER, iris=(148, 180, 224, 255))
    fill(im, 24, 5, 30, 12, HAIR_SILVER)
    save_sprite(im, 'npc-wind-student')


def make_npc_archivist():
    """Archivist Solan — warm brown robes, auburn hair, open tome."""
    ROBE_A = (156, 100, 44, 255); ROBE_B = (114, 70, 24, 255); ROBE_C = (76, 44, 10, 255)
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, BROWN_B, BROWN_A)
    draw_iso_robe(im, ROBE_A, ROBE_B, ROBE_C, trim=GOLD_D)
    vline(im, 14, 26, 42, GOLD_D)
    draw_iso_shoulders(im, GOLD_D)
    draw_neck(im, SKIN_A)
    draw_chibi_head(im, SKIN_A, SKIN_B, HAIR_AUBURN, iris=IRIS_BROWN)
    # Open book in both hands
    fill(im, 6, 30, 25, 40, BOOK_PAGE)
    fill(im, 15, 30, 16, 40, BOOK_B)
    fill(im, 6, 30, 25, 31, BOOK_A); fill(im, 6, 39, 25, 40, BOOK_A)
    fill(im, 6, 30, 7, 40, BOOK_A); fill(im, 24, 30, 25, 40, BOOK_A)
    for ty in [33, 35, 37]:
        hline(im, ty, 7, 14, (160, 140, 100, 180))
        hline(im, ty, 17, 24, (160, 140, 100, 180))
    save_sprite(im, 'npc-archivist')


def make_npc_ironclad():
    """Ironclad Wolf Knight — heavy iron armor, wolf helmet and pauldron."""
    im = canvas()
    draw_drop_shadow(im)
    draw_feet(im, IRON_B, IRON_C)
    draw_iso_armor(im, IRON_A, IRON_B, IRON_C, y_top=34, y_bot=44)
    draw_iso_armor(im, IRON_A, IRON_B, IRON_C, y_top=26, y_bot=34)
    vline(im, 15, 27, 33, IRON_B)
    # Wolf pauldron left
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.polygon([(0,22),(7,22),(7,28),(1,28)], fill=IRON_B)
    fill(layer, 1, 22, 6, 24, (180, 172, 156, 255))
    hline(layer, 28, 0, 7, GOLD_D)
    im.alpha_composite(layer)
    px(im, 3, 25, (220, 168, 20, 255))  # wolf eye
    draw_neck(im, IRON_B)
    # Wolf helmet (covers chibi head)
    layer2 = Image.new('RGBA', (SW, SH), T)
    d2 = ImageDraw.Draw(layer2)
    d2.ellipse([5, 1, 27, 21], fill=IRON_A)
    fill(layer2, 5, 1, 13, 4, IRON_HI)
    fill(layer2, 6, 8, 26, 13, IRON_C)  # visor
    px(layer2, 9, 10, GOLD); px(layer2, 10, 10, GOLD)
    px(layer2, 21, 10, GOLD); px(layer2, 22, 10, GOLD)
    hline(layer2, 1, 7, 25, GOLD)
    # Wolf ears
    d2.polygon([(6,0),(10,0),(8,3)], fill=(180, 172, 156, 255))
    d2.polygon([(22,0),(26,0),(24,3)], fill=(180, 172, 156, 255))
    im.alpha_composite(layer2)
    for hx in [7, 11, 15, 19, 23]: px(im, hx, 0, GOLD)
    save_sprite(im, 'npc-ironclad')


# ══════════════════════════════════════════════════════════════════════════════
#  TILES  (32×32) — unchanged
# ══════════════════════════════════════════════════════════════════════════════

def make_tile_floor():
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    GROUT    = (148, 128,  92, 255)
    STONE    = (196, 176, 136, 255)
    STONE_HI = (220, 204, 168, 255)
    STONE_MID= (208, 188, 148, 255)
    STONE_SH = (168, 148, 108, 255)
    d.rectangle([0,0,TW-1,TH-1], fill=GROUT)
    def stone(x0, y0, x1, y1):
        d.rectangle([x0,y0,x1,y1], fill=STONE)
        d.rectangle([x0,y0,x1,y0+1], fill=STONE_HI)
        d.rectangle([x0,y0,x0+1,y1], fill=STONE_HI)
        d.rectangle([x0+2,y0+3,x1-2,y0+5], fill=STONE_MID)
        d.rectangle([x0,y1,x1,y1], fill=STONE_SH)
        d.rectangle([x1,y0,x1,y1], fill=STONE_SH)
    stone(1,1,14,14); stone(17,1,30,14); stone(1,17,14,30); stone(17,17,30,30)
    save_tile(im, 'floor')


def make_tile_wall():
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    CREAM=(216,200,160,255); CREAM_HI=(236,224,188,255); CREAM_SH=(184,164,124,255)
    JOINT=(172,152,112,255); ROOF=(88,108,140,255); ROOF_HI=(128,152,188,255)
    ROOF_SH=(60,80,108,255); ROOF_TRIM=(212,188,100,255)
    d.rectangle([0,0,TW-1,6], fill=ROOF)
    d.rectangle([0,0,TW-1,1], fill=ROOF_HI)
    d.rectangle([0,5,TW-1,6], fill=ROOF_SH)
    d.rectangle([0,7,TW-1,7], fill=ROOF_TRIM)
    d.rectangle([0,8,TW-1,TH-1], fill=CREAM)
    for my in [16, 24]: d.rectangle([0,my,TW-1,my], fill=JOINT)
    d.rectangle([16,8,16,15], fill=JOINT); d.rectangle([8,16,8,23], fill=JOINT)
    d.rectangle([24,16,24,23], fill=JOINT); d.rectangle([16,24,16,TH-1], fill=JOINT)
    stones = [(1,9,14,15),(17,9,29,15),(1,17,6,23),(9,17,22,23),(25,17,29,23),(1,25,14,30),(17,25,29,30)]
    for x0,y0,x1,y1 in stones:
        d.rectangle([x0,y0,x1,y0], fill=CREAM_HI); d.rectangle([x0,y0,x0,y1], fill=CREAM_HI)
        d.rectangle([x0,y1,x1,y1], fill=CREAM_SH); d.rectangle([x1,y0,x1,y1], fill=CREAM_SH)
    save_tile(im, 'wall')


def make_tile_door():
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    STONE=(152,162,180,255); STONE_HI=(180,192,212,255); STONE_SH=(120,128,144,255)
    PORTAL=(18,38,100,255); GLOW=(40,90,200,200)
    d.rectangle([0,0,TW-1,TH-1], fill=STONE)
    d.rectangle([6,4,25,28], fill=PORTAL)
    d.rectangle([7,6,24,9], fill=GLOW); d.rectangle([7,13,24,16], fill=GLOW)
    d.rectangle([7,20,24,23], fill=GLOW); d.rectangle([6,2,25,5], fill=PORTAL)
    d.rectangle([10,0,20,3], fill=PORTAL)
    d.rectangle([0,0,TW-1,1], fill=STONE_HI); d.rectangle([0,0,1,TH-1], fill=STONE_HI)
    d.rectangle([TW-2,0,TW-1,TH-1], fill=STONE_SH)
    d.rectangle([0,TH-2,TW-1,TH-1], fill=STONE_SH)
    save_tile(im, 'door')


# ══════════════════════════════════════════════════════════════════════════════
print('Generating sprites...')
make_npc_white()
make_npc_blue()
make_npc_black()
make_npc_red()
make_npc_green()
make_npc_librarian()
make_npc_merchant()
make_npc_caretaker()
make_npc_tactician()
make_npc_chronicler()
make_npc_shadow_student()
make_npc_fire_student()
make_npc_water_student()
make_npc_earth_student()
make_npc_wind_student()
make_npc_archivist()
make_npc_ironclad()

print('Generating tiles...')
make_tile_floor()
make_tile_wall()
make_tile_door()

print('Done! All assets written to public/assets/')
