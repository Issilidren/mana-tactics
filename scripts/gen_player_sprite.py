"""
gen_player_sprite.py — Player Hero (32×48 px, RGBA).
Polygon-based isometric layers — same system as generate_assets.py.
Dark navy academy coat, gold trim, crimson cape, glowing mana card.
Run: python3 scripts/gen_player_sprite.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image, ImageDraw

SW, SH  = 32, 48
T       = (0, 0, 0, 0)
OUTLINE = (8, 6, 10, 255)

# ── Palette ───────────────────────────────────────────────────────────────────
SKIN    = (248, 200, 128, 255)
SKIN_SH = (220, 164,  92, 255)
HAIR    = ( 36,  28,  20, 255)
HAIR_HI = ( 68,  52,  36, 255)
EYE     = ( 20,  14,  12, 255)
IRIS    = ( 56, 140, 220, 255)
SHINE   = (255, 255, 255, 255)
BLUSH   = (240, 148, 148, 160)
MOUTH   = (196, 108,  64, 255)

COAT_A  = ( 28,  54, 108, 255)   # near side
COAT_B  = ( 18,  36,  78, 255)   # center
COAT_C  = ( 10,  20,  52, 255)   # far side

GOLD    = (212, 175,  55, 255)
GOLD_D  = (160, 128,  24, 255)
GOLD_HI = (240, 210, 100, 255)

CAPE_A  = (160,  22,  30, 255)
CAPE_B  = (120,  12,  18, 255)
CAPE_C  = ( 80,   6,  10, 255)

BOOT    = ( 30,  22,  18, 255)
BOOT_HI = ( 58,  44,  34, 255)

CARD_A  = (200, 232, 255, 255)
CARD_B  = (100, 180, 240, 255)
CARD_GL = (160, 220, 255, 200)


# ── Helpers ───────────────────────────────────────────────────────────────────
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


# ── Layer functions ───────────────────────────────────────────────────────────

def draw_drop_shadow(im):
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.ellipse([5, 43, 27, 47], fill=(0, 0, 0, 72))
    im.alpha_composite(layer)


def draw_boots(im):
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.ellipse([ 6, 43, 14, 47], fill=BOOT)
    d.ellipse([17, 42, 24, 46], fill=BOOT)
    im.alpha_composite(layer)
    px(im,  7, 43, BOOT_HI); px(im,  8, 43, BOOT_HI)
    px(im, 18, 42, BOOT_HI); px(im, 19, 42, BOOT_HI)


def draw_cape(im):
    """Crimson cape billows to far (right) side, behind coat."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    # Cape trapezoid — wide at shoulder, flares out on far side
    pts = [(21, 22), (31, 22), (31, 43), (20, 43)]
    d.polygon(pts, fill=CAPE_A)
    vline(layer, 21, 22, 43, CAPE_B)
    vline(layer, 30, 22, 43, CAPE_C)
    vline(layer, 31, 24, 41, CAPE_C)
    vline(layer, 22, 22, 43, CAPE_A)  # fold highlight
    im.alpha_composite(layer)


def draw_coat_body(im):
    """Isometric trapezoid coat — near bright, far dark, strong taper."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    # Near (left) coat panel
    d.polygon([(5, 26), (15, 26), (13, 43), (8, 44)], fill=COAT_A)
    # Far (right) coat panel
    d.polygon([(15, 26), (22, 26), (19, 43), (13, 43)], fill=COAT_B)
    # Far edge shadow
    d.polygon([(20, 26), (22, 26), (19, 43), (21, 43)], fill=COAT_C)
    im.alpha_composite(layer)
    # Gold lapels + hem
    vline(im, 13, 26, 43, GOLD)
    vline(im, 14, 26, 43, GOLD_D)
    hline(im, 43, 6, 20, GOLD_D)
    hline(im, 44, 6, 20, GOLD)


def draw_coat_chest(im):
    """Upper chest panels + collar."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.polygon([(5, 20), (14, 20), (15, 26), (5, 26)], fill=COAT_A)
    d.polygon([(14, 20), (22, 20), (22, 26), (15, 26)], fill=COAT_B)
    vline(layer, 5, 20, 26, COAT_A)
    vline(layer, 21, 20, 26, COAT_C)
    im.alpha_composite(layer)
    # Shoulder yoke + lapels
    hline(im, 20, 5, 22, GOLD)
    vline(im, 13, 20, 26, GOLD)
    vline(im, 14, 20, 26, GOLD_D)
    # Collar
    fill(im, 11, 22, 17, 24, COAT_A)
    hline(im, 22, 12, 19, COAT_B)


def draw_left_pauldron(im):
    """Near-side pauldron — prominent, viewer-facing."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.polygon([(0, 18), (8, 18), (8, 25), (0, 25)], fill=COAT_B)
    hline(layer, 18, 0, 8, GOLD)
    hline(layer, 25, 0, 8, GOLD_D)
    vline(layer, 0, 18, 25, COAT_A)
    vline(layer, 7, 18, 25, COAT_C)
    im.alpha_composite(layer)
    px(im, 3, 21, GOLD_HI)


def draw_right_shoulder(im):
    """Far-side shoulder — recessed."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.polygon([(21, 18), (27, 18), (27, 22), (21, 22)], fill=COAT_C)
    hline(layer, 18, 21, 27, GOLD_D)
    im.alpha_composite(layer)


def draw_mana_card(im):
    """Left arm extended with glowing mana card."""
    # Forearm
    fill(im, 1, 26, 5, 30, COAT_B)
    # Card
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.rectangle([1, 31, 5, 42], fill=CARD_A)
    d.rectangle([2, 32, 4, 41], fill=CARD_B)
    im.alpha_composite(layer)
    hline(im, 31, 1, 5, CARD_A)
    hline(im, 42, 1, 5, CARD_A)
    vline(im, 1, 31, 42, CARD_A)
    vline(im, 5, 31, 42, CARD_A)
    # Glow symbol
    px(im, 3, 34, CARD_A); px(im, 2, 35, CARD_A); px(im, 4, 35, CARD_A)
    px(im, 3, 36, CARD_A); px(im, 3, 35, (220, 255, 255, 255))
    # Glow halo
    for gx, gy in [(0,31),(0,37),(6,31),(6,37),(0,34),(6,34),(3,30),(3,43)]:
        px(im, gx, gy, CARD_GL)


def draw_neck(im):
    fill(im, 13, 20, 19, 23, SKIN)


def draw_chibi_head(im):
    """Chibi hero head — 3/4 view, large SD proportions."""
    layer = Image.new('RGBA', (SW, SH), T)
    d = ImageDraw.Draw(layer)
    d.ellipse([ 7, 2, 26, 20], fill=SKIN)       # main round head
    d.ellipse([ 5, 4, 11, 18], fill=SKIN)        # near (left) ear
    d.ellipse([22, 5, 27, 16], fill=SKIN_SH)     # far (right) ear
    im.alpha_composite(layer)
    # Far-side shading
    for y in range(4, 20):
        px(im, 25 - max(0, (y-4)//3), y, SKIN_SH)
    hline(im, 19, 9, 24, SKIN_SH)
    # Hair — dark, tousled
    fill(im,  8, 0, 26,  5, HAIR)
    fill(im,  6, 2,  9, 10, HAIR)
    fill(im, 24, 2, 28,  9, HAIR)
    px(im,  9, 1, HAIR_HI); px(im, 10, 0, HAIR_HI)
    px(im, 14, 0, HAIR_HI); px(im, 18, 0, HAIR_HI)
    fill(im, 6, 5, 8, 14, HAIR)
    # Eyes — left (near) bigger
    ey = 9
    fill(im,  9, ey, 13, ey+2, EYE)
    fill(im, 18, ey, 21, ey+2, EYE)
    px(im, 10, ey+1, IRIS); px(im, 11, ey+1, IRIS)
    px(im, 19, ey+1, IRIS)
    px(im, 13, ey, SHINE); px(im, 21, ey, SHINE)
    # Blush
    fill(im, 6, ey+2, 8, ey+3, BLUSH)
    fill(im, 22, ey+2, 24, ey+3, BLUSH)
    # Determined expression
    hline(im, 16, 11, 16, MOUTH)


def make_hero():
    im = canvas()
    draw_drop_shadow(im)
    draw_boots(im)
    draw_cape(im)
    draw_coat_body(im)
    draw_coat_chest(im)
    draw_left_pauldron(im)
    draw_right_shoulder(im)
    draw_mana_card(im)
    draw_neck(im)
    draw_chibi_head(im)
    return im


out_path = os.path.normpath(os.path.join(
    os.path.dirname(__file__), '..', 'public', 'assets', 'sprites', 'player.png'
))
outline(make_hero()).save(out_path)
print(f'Saved: {out_path}')
