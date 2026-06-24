#!/usr/bin/env python3
"""
Mana Tactics — GBA/FFTA pixel art generator (3/4 isometric view).
All sprites face SW (lower-left). Near side (left) = highlights; far side (right) = shadow.
Feet staggered: left foot lower on screen (nearer in depth).
Run: python3 scripts/generate_assets.py
"""

from PIL import Image
import os

SPRITES_DIR = '/mnt/c/Users/Kenny/mana-tactics/public/assets/sprites'
TILES_DIR   = '/mnt/c/Users/Kenny/mana-tactics/public/assets/tiles'
os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(TILES_DIR, exist_ok=True)

SW, SH = 24, 32
TW, TH = 32, 32
T = (0, 0, 0, 0)

# ── Shared palette ─────────────────────────────────────────────────────────────
OUTLINE   = (8, 6, 10, 255)

SKIN_A    = (248, 200, 128, 255)
SKIN_B    = (220, 164,  92, 255)
SKIN_PALE = (200, 220, 232, 255)
SKIN_PALE2= (168, 196, 216, 255)
SKIN_TAN  = (196, 144,  88, 255)
SKIN_TAN2 = (160, 110,  62, 255)

HAIR_BLACK= ( 28,  22,  18, 255)
HAIR_DARK = ( 44,  34,  26, 255)
HAIR_WHITE= (238, 234, 220, 255)
HAIR_PINK = (255, 138, 210, 255)
HAIR_PINK2= (255,  96, 170, 255)

EYE_D     = ( 20,  14,  12, 255)
EYE_SHINE = (255, 255, 255, 255)
IRIS_BLUE = ( 44, 118, 204, 255)
IRIS_BROWN= ( 96,  56,  22, 255)
IRIS_PURP = (176,  56, 230, 255)
IRIS_ORAN = (230,  80,  20, 255)
EYE_GLO_B = ( 60, 180, 255, 255)
EYE_GLO_P = (200,  80, 255, 255)
BLUSH     = (240, 148, 148, 180)
MOUTH     = (204, 120,  72, 255)

GOLD      = (212, 175,  55, 255)
GOLD_D    = (160, 128,  24, 255)

RED_A     = (228,  40,  40, 255)
RED_B     = (190,  22,  22, 255)
RED_C     = (148,  12,  12, 255)
RED_HI    = (255,  90,  90, 255)

BLUE_A    = ( 56, 106, 208, 255)
BLUE_B    = ( 36,  72, 164, 255)
BLUE_C    = ( 20,  44, 112, 255)
BLUE_HI   = ( 88, 148, 240, 255)

NAVY_A    = ( 28,  52, 136, 255)
NAVY_B    = ( 18,  34,  96, 255)
NAVY_C    = ( 10,  20,  64, 255)

DARK_A    = ( 16,   8,  28, 255)
DARK_B    = (  8,   4,  16, 255)
DARK_C    = (  4,   2,   8, 255)
PURP_A    = ( 96,  28, 156, 255)
PURP_B    = ( 64,  16, 104, 255)
PURP_C    = ( 40,   8,  68, 255)
PURP_GLO  = (200,  80, 255, 255)

ARMOR_A   = (188,  26,   8, 255)
ARMOR_B   = (148,  14,   4, 255)
ARMOR_C   = ( 96,   8,   2, 255)
ARMOR_HI  = (240,  80,  60, 255)
VISOR     = (255, 120,  60, 255)
VISOR_GLO = (255, 200, 100, 255)
CREST_A   = (255,  80,   0, 255)
CREST_B   = (255, 160,  40, 255)

GREEN_A   = ( 52, 140,  40, 255)
GREEN_B   = ( 34,  96,  24, 255)
GREEN_C   = ( 20,  60,  12, 255)
GREEN_HI  = ( 88, 196,  68, 255)

PINK_A    = (240, 110, 185, 255)
PINK_B    = (200,  72, 148, 255)
PINK_C    = (160,  40, 110, 255)

WHITE_A   = (250, 246, 234, 255)
WHITE_B   = (218, 210, 190, 255)
WHITE_C   = (184, 174, 152, 255)

SHOE      = ( 22,  18,  26, 255)
SHOE_HI   = ( 48,  42,  58, 255)
BROWN_A   = (124,  76,  32, 255)
BROWN_B   = ( 88,  52,  18, 255)
BOOK_A    = (136,  56,  28, 255)
BOOK_B    = (100,  36,  12, 255)
BOOK_PAGE = (245, 236, 210, 255)
COLLAR    = (228, 228, 244, 255)


# ── Drawing helpers ────────────────────────────────────────────────────────────

def canvas(w=SW, h=SH):
    return Image.new('RGBA', (w, h), T)

def px(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), c)

def hline(im, y, x0, x1, c):
    for x in range(x0, x1+1): px(im, x, y, c)

def vline(im, x, y0, y1, c):
    for y in range(y0, y1+1): px(im, x, y, c)

def fill(im, x0, y0, x1, y1, c):
    for y in range(y0, y1+1):
        for x in range(x0, x1+1): px(im, x, y, c)

def outline(img):
    w, h = img.size
    src = [(img.getpixel((x,y)) if 0<=x<w and 0<=y<h else T)
           for y in range(h) for x in range(w)]
    def s(x,y): return src[y*w+x][3] if 0<=x<w and 0<=y<h else 0
    out = img.copy()
    for y in range(h):
        for x in range(w):
            if src[y*w+x][3] < 32:
                for dx,dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,-1),(-1,1),(1,1)]:
                    if s(x+dx,y+dy) > 64:
                        out.putpixel((x,y), OUTLINE)
                        break
    return out

def save_sprite(img, name):
    img = outline(img)
    img.save(os.path.join(SPRITES_DIR, f'{name}.png'))
    print(f'  saved sprites/{name}.png')

def save_tile(img, name):
    img.save(os.path.join(TILES_DIR, f'{name}.png'))
    print(f'  saved tiles/{name}.png')

# ── Shared 3/4 head helper ─────────────────────────────────────────────────────
# head_skin: fill color; left_hair/right_hair: hair colors on each side
def draw_head_34(im, skin, skin_shadow, y_top=2, y_bot=12,
                 hair_top=None, hair_side=None,
                 iris_col=IRIS_BLUE, has_blush=True):
    """Draw a 3/4-view chibi head. Near side (left) lighter, far side (right) darker.
    Head occupies cols 3–20, y_top to y_bot."""
    fill(im, 3, y_top, 20, y_bot, skin)
    fill(im, 4, y_top-1, 19, y_top, skin)
    fill(im, 2, y_top+2, 3, y_bot-1, skin)    # left ear (near, fuller)
    fill(im, 20, y_top+3, 21, y_bot-2, skin)  # right ear (far, smaller)
    hline(im, y_bot, 4, 19, skin_shadow)       # chin shadow

    if hair_top:
        fill(im, 4, y_top-1, 19, y_top+1, hair_top)  # top hairline
        vline(im, 3, y_top, y_bot, hair_side or hair_top)  # near side
        vline(im, 20, y_top, y_bot, hair_side or hair_top) # far side (same)

    # Eyes — left eye (near) at cols 5-8, right eye (far) at cols 14-16
    ey = y_top + 5
    fill(im, 5, ey, 8, ey+1, EYE_D)
    fill(im, 14, ey, 16, ey+1, EYE_D)
    px(im, 5, ey+1, iris_col); px(im, 14, ey+1, iris_col)
    px(im, 8, ey, EYE_SHINE);  px(im, 16, ey, EYE_SHINE)

    if has_blush:
        fill(im, 2, ey+2, 3, ey+3, BLUSH)
        fill(im, 20, ey+2, 21, ey+3, BLUSH)

    # Mouth
    hline(im, y_top+8, 8, 14, MOUTH)
    px(im, 8, y_top+8, skin_shadow); px(im, 14, y_top+8, skin_shadow)


# ══════════════════════════════════════════════════════════════════════════════
#  SPRITES
# ══════════════════════════════════════════════════════════════════════════════

def make_player():
    """Placeholder — player sprite is generated by gen_player_sprite.py"""
    # Only regenerate if the file doesn't exist; gen_player_sprite.py is canonical
    path = os.path.join(SPRITES_DIR, 'player.png')
    if not os.path.exists(path):
        print('  player.png missing — run gen_player_sprite.py')


# ── npc-white — Paladin Mage, robes 3/4 angle ─────────────────────────────────
def make_npc_white():
    im = canvas()

    # Brown sandals — left foot lower (near/forward)
    fill(im, 5, 30, 10, 31, BROWN_B)
    fill(im, 13, 29, 17, 31, BROWN_B)  # right foot slightly higher

    # Wide robe skirt — left side gets top highlight (near side)
    fill(im, 1, 18, 22, 31, WHITE_A)
    fill(im, 1, 18,  9, 19, WHITE_B)   # near-side top fold
    fill(im, 9, 18, 22, 19, WHITE_C)   # far-side top fold darker
    fill(im, 1, 28, 22, 31, WHITE_B)   # bottom shadow

    # Gold hem
    hline(im, 30, 1, 22, GOLD)

    # Robe vertical fold — left third brighter, right third darker
    vline(im, 8, 18, 30, WHITE_B)      # near fold shadow
    vline(im, 16, 18, 30, WHITE_C)     # far fold shadow

    # Robe upper body — near side lighter
    fill(im, 4, 13, 11, 18, WHITE_A)   # left (near)
    fill(im, 11, 13, 19, 18, WHITE_B)  # right (far, slightly darker)

    # Gold trim vertical (slightly left of center for 3/4 feel)
    vline(im, 10, 13, 18, GOLD)
    vline(im, 11, 13, 18, GOLD)

    # Collar
    fill(im, 8, 13, 14, 15, WHITE_B)
    fill(im, 9, 13, 13, 15, WHITE_A)

    # Gold shoulder trim
    hline(im, 13, 4, 19, GOLD)

    # Neck
    fill(im, 9, 10, 14, 13, SKIN_A)

    # Head
    draw_head_34(im, SKIN_A, SKIN_B, y_top=2, y_bot=12,
                 hair_top=HAIR_WHITE, hair_side=HAIR_WHITE, iris_col=IRIS_BLUE)

    # White flowing hair — near side fuller
    fill(im, 3, 2, 20, 5, HAIR_WHITE)
    vline(im, 3, 3, 12, HAIR_WHITE)
    vline(im, 20, 3, 12, HAIR_WHITE)
    fill(im, 2, 9, 5, 13, HAIR_WHITE)   # near-side hair falls forward
    fill(im, 18, 10, 20, 13, HAIR_WHITE)

    # Halo dots (slightly left of center)
    for hx in [4, 7, 10, 14, 18]: px(im, hx, 0, GOLD)

    save_sprite(im, 'npc-white')


# ── npc-blue — Wizard, robes 3/4 angle ────────────────────────────────────────
def make_npc_blue():
    im = canvas()

    # Navy shoes — left lower
    fill(im, 5, 30, 10, 31, NAVY_C)
    fill(im, 13, 29, 17, 31, NAVY_C)

    # Robe — near side lighter, far side darker
    fill(im, 1, 18, 22, 31, NAVY_A)
    fill(im, 1, 18, 10, 19, BLUE_A)    # near-side highlight
    fill(im, 10, 18, 22, 19, NAVY_B)   # far-side shadow
    fill(im, 1, 28, 22, 31, NAVY_B)

    # Rune detail on near side (left)
    fill(im, 2, 22,  6, 24, BLUE_A)
    fill(im, 2, 25,  4, 27, BLUE_A)

    # Robe fold line
    vline(im, 9, 18, 31, NAVY_B)

    # Robe upper — near side lighter
    fill(im, 4, 13, 11, 18, NAVY_A)
    fill(im, 11, 13, 19, 18, NAVY_B)
    hline(im, 13, 4, 19, BLUE_A)

    # Wizard collar
    fill(im, 8, 13, 14, 15, NAVY_B)
    hline(im, 14, 8, 14, (100, 140, 200, 255))

    # Neck
    fill(im, 9, 10, 14, 13, SKIN_PALE)

    # Head
    fill(im, 3, 2, 20, 12, SKIN_PALE)
    fill(im, 4, 1, 19, 2, SKIN_PALE)
    fill(im, 2, 4, 3, 11, SKIN_PALE)   # near ear (fuller)
    fill(im, 20, 4, 21, 10, SKIN_PALE) # far ear (smaller)
    hline(im, 12, 3, 20, SKIN_PALE2)

    # Hat brim — 3/4 slight tilt (near edge lower)
    fill(im, 1, 3, 22, 5, NAVY_A)
    hline(im, 3, 1, 12, BLUE_A)        # near-half highlight
    hline(im, 3, 12, 22, NAVY_A)       # far-half flat
    hline(im, 5, 1, 22, NAVY_B)

    # Hat crown — pointed, leaning slightly
    fill(im, 7, 0, 15, 3, NAVY_A)
    fill(im, 9, 0, 13, 1, NAVY_A)
    vline(im, 7, 0, 3, NAVY_B)
    vline(im, 15, 0, 3, NAVY_B)
    vline(im, 8, 0, 3, BLUE_A)         # near edge catch-light

    # Star on hat
    px(im, 10, 0, GOLD); px(im, 11, 0, GOLD)
    px(im, 10, 1, GOLD); px(im, 11, 1, GOLD)

    # Eyes — glowing blue, left (near) more prominent
    ey = 7
    fill(im, 5, ey, 9, ey+1, EYE_D)
    fill(im, 14, ey, 17, ey+1, EYE_D)
    px(im, 5, ey, EYE_GLO_B); px(im, 14, ey, EYE_GLO_B)
    px(im, 9, ey, EYE_SHINE); px(im, 17, ey, EYE_SHINE)
    # Glow halo — stronger on near side
    fill(im, 4, ey, 10, ey+1, (60, 160, 255, 100))
    fill(im, 13, ey, 18, ey+1, (60, 160, 255, 60))

    # Stern mouth
    hline(im, 11, 8, 14, (160, 180, 200, 255))

    save_sprite(im, 'npc-blue')


# ── npc-black — Shadow Mage, hooded cloak 3/4 ─────────────────────────────────
def make_npc_black():
    im = canvas()

    # Entire cloak
    fill(im, 1, 10, 22, 31, DARK_A)

    # Hood — fills head area
    fill(im, 2, 0, 21, 12, DARK_A)
    fill(im, 4, 3, 19, 12, DARK_C)    # hood interior shadow

    # Hood peak — slightly off-center (near side)
    fill(im, 7, 0, 14, 3, DARK_A)
    fill(im, 9, 0, 12, 1, DARK_A)

    # 3/4 depth: near edge (left) has purple shimmer; far edge (right) dark
    hline(im, 0, 2, 21, PURP_A)
    vline(im, 1, 0, 12, PURP_B)       # near vertical edge — bright purple
    vline(im, 2, 0, 12, PURP_A)       # near second line
    vline(im, 22, 0, 12, DARK_C)      # far edge — very dark
    vline(im, 1, 10, 31, PURP_C)
    vline(im, 22, 10, 31, DARK_C)

    # Cloak near-side fold (left column brighter)
    fill(im, 1, 12, 4, 31, DARK_B)
    vline(im, 3, 12, 31, PURP_C)      # fold catch-light

    # Cloak fold shadow (center)
    vline(im, 11, 11, 31, DARK_C)
    vline(im, 12, 11, 31, DARK_C)

    # Cloak bottom fringe
    fill(im, 1, 28, 22, 31, DARK_C)
    for fx in range(2, 22, 3): vline(im, fx, 28, 31, DARK_B)

    # Glowing purple eyes — near eye (left) larger and brighter
    fill(im, 5,  7, 9, 9, PURP_GLO)   # near eye — wider
    fill(im, 13, 7, 16, 9, PURP_GLO)  # far eye — narrower
    fill(im, 6,  7, 8, 8, EYE_SHINE)  # near shine
    fill(im, 14, 7, 15, 8, EYE_SHINE) # far shine (smaller)

    # Eye glow bleed — stronger near side
    fill(im, 4, 7, 10, 9, (160, 40, 220, 100))
    fill(im, 12, 7, 17, 9, (160, 40, 220, 60))

    save_sprite(im, 'npc-black')


# ── npc-red — Fire Knight, heavy armor 3/4 ────────────────────────────────────
def make_npc_red():
    im = canvas()

    # Heavy boots — left lower (near/forward)
    fill(im, 4, 29, 11, 31, SHOE)
    fill(im, 12, 28, 18, 31, SHOE)     # right boot slightly higher
    hline(im, 29, 4, 11, SHOE_HI)
    hline(im, 28, 12, 18, SHOE_HI)

    # Leg armour — left leg near (brighter), right darker and narrower
    fill(im,  4, 21, 10, 29, ARMOR_A)  # near leg
    fill(im, 13, 21, 18, 29, ARMOR_B)  # far leg
    vline(im, 4, 21, 29, ARMOR_HI)     # near-edge shine
    vline(im, 18, 21, 29, ARMOR_C)     # far-edge dark

    # Knee guards
    fill(im, 4, 20, 10, 22, ARMOR_A); fill(im, 13, 20, 18, 22, ARMOR_B)
    hline(im, 20, 4, 10, ARMOR_HI)
    hline(im, 20, 13, 18, ARMOR_A)

    # Chest plate — 3/4 perspective: left panel bright, right panel dark
    fill(im, 2, 12, 10, 21, ARMOR_A)   # near half
    fill(im, 10, 12, 20, 21, ARMOR_B)  # far half
    fill(im, 2, 12, 10, 13, ARMOR_HI)  # near top shine
    vline(im, 2, 12, 21, ARMOR_HI)     # near edge
    fill(im, 5, 15, 9, 19, ARMOR_HI)   # near chest panel detail
    fill(im, 11, 15, 17, 19, ARMOR_A)  # far chest panel (mid tone)
    fill(im, 2, 19, 20, 21, ARMOR_B)   # bottom shadow
    vline(im, 20, 12, 21, ARMOR_C)     # far edge dark

    # Left pauldron — near, larger
    fill(im, 0, 12, 3, 19, ARMOR_A)
    hline(im, 12, 0, 3, ARMOR_HI)
    vline(im, 3, 12, 19, ARMOR_A)

    # Right pauldron — far, smaller and darker
    fill(im, 19, 12, 22, 17, ARMOR_B)
    hline(im, 12, 19, 22, ARMOR_A)

    # Helmet — near side (left) highlighted, far side shadowed
    fill(im, 2, 2, 21, 13, ARMOR_A)
    fill(im, 3, 1, 20,  3, ARMOR_A)
    fill(im, 5, 0, 18, 2, ARMOR_A)
    fill(im, 2, 2, 10, 3, ARMOR_HI)    # near-top shine
    vline(im, 2, 2, 13, ARMOR_HI)      # near edge
    fill(im, 15, 2, 21, 5, ARMOR_B)    # far side darker
    vline(im, 21, 2, 13, ARMOR_C)      # far edge darkest
    fill(im, 2, 11, 21, 13, ARMOR_B)   # neck shadow

    # Visor — near half bright, far half darker
    fill(im, 4, 9, 19, 11, VISOR)
    fill(im, 4, 9, 11, 9, VISOR_GLO)   # near-side visor bright line
    fill(im, 12, 9, 19, 9, VISOR)      # far-side dimmer
    fill(im, 4, 10, 19, 11, ARMOR_C)   # visor shadow

    # Eyes — left (near) bigger/brighter
    fill(im, 5, 9, 9, 10, IRIS_ORAN)
    fill(im, 13, 9, 17, 10, IRIS_ORAN)
    px(im, 5, 9, VISOR_GLO); px(im, 6, 9, VISOR_GLO)  # near: two bright pixels
    px(im, 13, 9, VISOR_GLO)                            # far: one

    # Mohawk crest — leans slightly toward near side
    fill(im, 8, 0, 14, 2, CREST_A)
    fill(im, 9, 0, 13, 1, CREST_B)
    vline(im, 8, 0, 2, ARMOR_C); vline(im, 14, 0, 2, ARMOR_C)

    save_sprite(im, 'npc-red')


# ── npc-green — Druid, leaf robe 3/4 ──────────────────────────────────────────
def make_npc_green():
    im = canvas()

    # Sandals — left lower
    fill(im, 5, 30, 10, 31, BROWN_B)
    fill(im, 13, 29, 17, 31, BROWN_B)
    hline(im, 30, 5, 10, BROWN_A)
    hline(im, 29, 13, 17, BROWN_A)

    # Wide leaf robe — near side lighter
    fill(im, 1, 18, 22, 31, GREEN_A)
    fill(im, 1, 28, 22, 31, GREEN_B)
    fill(im, 1, 18, 10, 19, GREEN_HI)  # near fold highlight
    fill(im, 10, 18, 22, 19, GREEN_B)  # far fold shadow
    vline(im, 9, 18, 31, GREEN_B)      # center fold

    # Leaf patches — near side fuller
    fill(im, 1, 20,  7, 25, GREEN_HI)
    fill(im, 2, 26,  6, 29, GREEN_B)
    fill(im, 17, 20, 22, 24, GREEN_B)  # far side dimmer
    fill(im, 18, 26, 21, 29, GREEN_C)

    # Brown belt
    fill(im, 2, 17, 21, 19, BROWN_A)
    fill(im, 9, 17, 12, 19, GOLD)      # buckle slightly left of center

    # Robe upper — near side lighter
    fill(im, 4, 13, 11, 18, GREEN_A)
    fill(im, 11, 13, 19, 18, GREEN_B)
    hline(im, 13, 4, 19, GREEN_HI)

    # Collar
    fill(im, 8, 13, 14, 15, GREEN_B)

    # Neck
    fill(im, 9, 10, 14, 13, SKIN_TAN)

    # Head — leaf hood over chibi face
    fill(im, 3, 2, 20, 12, SKIN_TAN)
    fill(im, 4, 1, 19, 3, SKIN_TAN)
    fill(im, 2, 4, 3, 11, SKIN_TAN)    # near ear (fuller)
    fill(im, 20, 4, 21, 10, SKIN_TAN)  # far ear (smaller)
    hline(im, 12, 3, 20, SKIN_TAN2)

    # Leaf hood — near side highlight, far side shadow
    fill(im, 3, 2, 20, 5, GREEN_A)
    vline(im, 3, 3, 12, GREEN_HI)      # near-side bright
    vline(im, 20, 3, 12, GREEN_C)      # far-side dark
    hline(im, 2, 3, 20, GREEN_HI)

    # Leaf crown — slightly left-weighted
    for lx in [3, 6, 9, 13, 17]: px(im, lx, 1, GREEN_HI)
    fill(im, 4, 0, 7, 1, GREEN_HI)
    fill(im, 9, 0, 12, 0, GREEN_HI)
    fill(im, 16, 0, 18, 1, GREEN_B)    # far-side leaves dimmer

    # Eyes — warm brown, near eye at cols 5-8
    ey = 7
    fill(im, 5, ey, 8, ey+1, EYE_D)
    fill(im, 14, ey, 17, ey+1, EYE_D)
    px(im, 5, ey+1, IRIS_BROWN); px(im, 14, ey+1, IRIS_BROWN)
    px(im, 8, ey, EYE_SHINE);    px(im, 17, ey, EYE_SHINE)
    fill(im, 2, ey+2, 3, ey+3, BLUSH)
    fill(im, 20, ey+2, 21, ey+3, BLUSH)

    # Wide smile
    hline(im, 11, 8, 14, MOUTH)
    px(im, 8, 11, SKIN_TAN2); px(im, 14, 11, SKIN_TAN2)

    save_sprite(im, 'npc-green')


# ── npc-librarian — Mira, pink robes 3/4 ─────────────────────────────────────
def make_npc_librarian():
    im = canvas()
    LSKIN = (245, 200, 216, 255)
    LSKIN2= (220, 170, 188, 255)

    # Shoes — left lower
    fill(im, 5, 30, 10, 31, (68, 52, 52, 255))
    fill(im, 13, 29, 17, 31, (68, 52, 52, 255))

    # Wide skirt — near side lighter, far side darker
    fill(im, 1, 18, 22, 31, PINK_A)
    fill(im, 1, 28, 22, 31, PINK_B)
    fill(im, 1, 18, 10, 19, (255, 140, 200, 255))  # near fold highlight
    fill(im, 10, 18, 22, 19, PINK_B)               # far fold
    vline(im, 9, 18, 31, PINK_B)                   # center fold
    hline(im, 18, 1, 22, PINK_C)

    # Blouse — near lighter, far darker
    fill(im, 4, 13, 11, 18, PINK_A)
    fill(im, 11, 13, 19, 18, PINK_B)
    fill(im, 4, 13, 11, 14, PINK_B)

    # Collar bow — slightly left of center
    fill(im, 8, 14, 13, 16, PINK_B)
    fill(im, 9, 13, 12, 17, (255, 80, 160, 255))
    px(im, 10, 14, (255, 180, 220, 255))
    px(im, 11, 14, (255, 180, 220, 255))

    # Book held on left (near) side — more visible in 3/4
    fill(im, 0, 14, 4, 24, BOOK_A)
    fill(im, 1, 15, 3, 23, BOOK_PAGE)
    hline(im, 14, 0, 4, BOOK_B)
    hline(im, 24, 0, 4, BOOK_B)
    vline(im, 4, 14, 24, BOOK_B)       # book spine on near edge

    # Neck
    fill(im, 9, 10, 14, 13, LSKIN)

    # Head
    fill(im, 3, 2, 20, 12, LSKIN)
    fill(im, 4, 1, 19, 3, LSKIN)
    fill(im, 2, 4, 3, 11, LSKIN)       # near ear (fuller)
    fill(im, 20, 4, 21, 10, LSKIN)     # far ear (smaller)
    hline(im, 12, 3, 20, LSKIN2)

    # Pink hair — near side fuller with volume
    fill(im, 3, 2, 20, 6, HAIR_PINK)
    vline(im, 3, 3, 13, HAIR_PINK)
    vline(im, 20, 3, 12, HAIR_PINK)
    fill(im, 2, 8, 5, 13, HAIR_PINK)   # near-side hair falls forward

    # Big bun — slightly left of center
    fill(im, 6, 0, 15, 2, HAIR_PINK)
    fill(im, 7, 0, 14, 1, (255, 180, 228, 255))  # bun highlight

    # Glasses — dark frame
    fill(im, 5, 6, 9, 8, (32, 20, 24, 255))
    fill(im, 13, 6, 17, 8, (32, 20, 24, 255))
    px(im, 11, 7, (32, 20, 24, 255))   # bridge
    # Lens tint
    fill(im, 6, 6, 8, 7, (180, 220, 255, 160))
    fill(im, 14, 6, 16, 7, (180, 220, 255, 160))
    # Eyes behind glasses — near eye (left) slightly fuller
    px(im, 5, 7, IRIS_PURP); px(im, 6, 7, IRIS_PURP)  # near: two pixels
    px(im, 14, 7, IRIS_PURP)                             # far: one pixel
    px(im, 8, 6, EYE_SHINE); px(im, 16, 6, EYE_SHINE)

    # Blush
    fill(im, 2, 9, 3, 10, BLUSH)
    fill(im, 20, 9, 21, 10, BLUSH)

    # Smile
    hline(im, 10, 9, 13, MOUTH)

    save_sprite(im, 'npc-librarian')


# ── npc-merchant — Merchant Voss, gold robe 3/4 ───────────────────────────────
def make_npc_merchant():
    im = canvas()
    ROBE_A = (184, 142,  42, 255)   # gold robe warm
    ROBE_B = (148, 108,  22, 255)   # robe shadow
    ROBE_H = (220, 182,  80, 255)   # robe highlight
    HAIR_G = (172, 164, 152, 255)   # grey hair
    HAIR_G2= (136, 128, 118, 255)

    # Boots — left lower
    fill(im, 5, 30, 10, 31, (52, 36, 20, 255))
    fill(im, 13, 29, 17, 31, (52, 36, 20, 255))

    # Robe skirt — near side (left) highlight
    fill(im, 1, 18, 22, 31, ROBE_A)
    fill(im, 1, 28, 22, 31, ROBE_B)
    fill(im, 1, 18,  9, 19, ROBE_H)
    fill(im, 9, 18, 22, 19, ROBE_B)
    vline(im, 9, 18, 31, ROBE_B)

    # Gold trim on hem and collar
    hline(im, 30, 1, 22, GOLD)
    hline(im, 17, 2, 21, GOLD_D)

    # Coin bag — hanging from left hand (near side)
    fill(im, 0, 20, 4, 27, (178, 138, 38, 255))
    fill(im, 1, 21, 3, 26, GOLD)
    hline(im, 20, 0, 4, GOLD_D)
    # Bag tie
    hline(im, 21, 1, 3, (88, 68, 18, 255))

    # Robe upper — near lighter, far darker
    fill(im, 4, 13, 11, 18, ROBE_A)
    fill(im, 11, 13, 19, 18, ROBE_B)
    fill(im, 4, 13, 11, 14, ROBE_H)
    hline(im, 13, 4, 19, GOLD)

    # Collar
    fill(im, 8, 13, 14, 15, ROBE_B)

    # Neck
    fill(im, 9, 10, 14, 13, SKIN_A)

    # Head — wide, friendly merchant face
    fill(im, 3, 2, 20, 12, SKIN_A)
    fill(im, 4, 1, 19, 3, SKIN_A)
    fill(im, 2, 4, 3, 11, SKIN_A)   # near ear
    fill(im, 20, 4, 21, 10, SKIN_A) # far ear (smaller)
    hline(im, 12, 3, 20, SKIN_B)

    # Grey hair — near side more visible
    fill(im, 3, 2, 20, 5, HAIR_G)
    vline(im, 3, 3, 12, HAIR_G)
    vline(im, 20, 3, 11, HAIR_G2)   # far side dimmer
    fill(im, 2, 7, 5, 13, HAIR_G)   # near-side sideburn

    # Friendly eyes — warm brown
    ey = 7
    fill(im, 5, ey, 8, ey+1, EYE_D)
    fill(im, 14, ey, 17, ey+1, EYE_D)
    px(im, 5, ey+1, IRIS_BROWN); px(im, 14, ey+1, IRIS_BROWN)
    px(im, 8, ey, EYE_SHINE);    px(im, 17, ey, EYE_SHINE)

    # Blush (jolly merchant)
    fill(im, 2, ey+2, 3, ey+3, BLUSH)
    fill(im, 20, ey+2, 21, ey+3, BLUSH)

    # Wide smile
    hline(im, 11, 7, 15, MOUTH)
    px(im, 7, 11, SKIN_B); px(im, 15, 11, SKIN_B)

    save_sprite(im, 'npc-merchant')


# ══════════════════════════════════════════════════════════════════════════════
#  TILES  (32×32, unchanged — these are floor/wall/door tiles, not sprites)
# ══════════════════════════════════════════════════════════════════════════════

def make_tile_floor():
    from PIL import ImageDraw
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
        d.rectangle([x0,   y0, x1,   y0+1], fill=STONE_HI)
        d.rectangle([x0,   y0, x0+1, y1  ], fill=STONE_HI)
        d.rectangle([x0+2, y0+3, x1-2, y0+5], fill=STONE_MID)
        d.rectangle([x0,   y1, x1,   y1  ], fill=STONE_SH)
        d.rectangle([x1,   y0, x1,   y1  ], fill=STONE_SH)
    stone(1,  1, 14, 14)
    stone(17, 1, 30, 14)
    stone(1, 17, 14, 30)
    stone(17,17, 30, 30)
    save_tile(im, 'floor')


def make_tile_wall():
    from PIL import ImageDraw
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    CREAM    = (216, 200, 160, 255)
    CREAM_HI = (236, 224, 188, 255)
    CREAM_SH = (184, 164, 124, 255)
    JOINT    = (172, 152, 112, 255)
    ROOF     = ( 88, 108, 140, 255)
    ROOF_HI  = (128, 152, 188, 255)
    ROOF_SH  = ( 60,  80, 108, 255)
    ROOF_TRIM= (212, 188, 100, 255)
    d.rectangle([0, 0, TW-1, 6], fill=ROOF)
    d.rectangle([0, 0, TW-1, 1], fill=ROOF_HI)
    d.rectangle([0, 5, TW-1, 6], fill=ROOF_SH)
    d.rectangle([0, 7, TW-1, 7], fill=ROOF_TRIM)
    d.rectangle([0, 8, TW-1, TH-1], fill=CREAM)
    for my in [16, 24]:
        d.rectangle([0, my, TW-1, my], fill=JOINT)
    d.rectangle([16,  8, 16, 15], fill=JOINT)
    d.rectangle([ 8, 16,  8, 23], fill=JOINT)
    d.rectangle([24, 16, 24, 23], fill=JOINT)
    d.rectangle([16, 24, 16, TH-1], fill=JOINT)
    stones = [(1,9,14,15),(17,9,29,15),(1,17,6,23),(9,17,22,23),(25,17,29,23),(1,25,14,30),(17,25,29,30)]
    for (x0,y0,x1,y1) in stones:
        d.rectangle([x0,y0,x1,y0], fill=CREAM_HI)
        d.rectangle([x0,y0,x0,y1], fill=CREAM_HI)
        d.rectangle([x0,y1,x1,y1], fill=CREAM_SH)
        d.rectangle([x1,y0,x1,y1], fill=CREAM_SH)
    save_tile(im, 'wall')


def make_tile_door():
    from PIL import ImageDraw
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    STONE   = (152, 162, 180, 255)
    STONE_HI= (180, 192, 212, 255)
    STONE_SH= (120, 128, 144, 255)
    PORTAL  = ( 18,  38, 100, 255)
    GLOW    = ( 40,  90, 200, 200)
    d.rectangle([0,0,TW-1,TH-1], fill=STONE)
    d.rectangle([6,4,25,28], fill=PORTAL)
    d.rectangle([7,6,24, 9], fill=GLOW)
    d.rectangle([7,13,24,16], fill=GLOW)
    d.rectangle([7,20,24,23], fill=GLOW)
    d.rectangle([6,2,25, 5], fill=PORTAL)
    d.rectangle([10,0,20,3], fill=PORTAL)
    d.rectangle([0,0,TW-1,1], fill=STONE_HI)
    d.rectangle([0,0,1,TH-1], fill=STONE_HI)
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

print('Generating tiles...')
make_tile_floor()
make_tile_wall()
make_tile_door()

print('Done! All assets written to public/assets/')
