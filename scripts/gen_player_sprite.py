"""
gen_player_sprite.py — Ironclad Wolf Knight (24×32 px, RGBA).
3/4 isometric view: character faces SW (lower-left).
Near side (left) = brighter highlights; far side (right) = shadow.
Left pauldron prominent; right shoulder recessed; feet staggered (left forward).
Run: python3 scripts/gen_player_sprite.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image

SW, SH = 24, 32
T = (0, 0, 0, 0)
OUTLINE = (8, 6, 10, 255)

# ── Palette ────────────────────────────────────────────────────────────────────
STEEL_D  = ( 42,  42,  55, 255)
STEEL_M  = ( 66,  66,  82, 255)
STEEL_L  = (108, 108, 128, 255)
STEEL_HI = (168, 168, 192, 255)
GOLD     = (210, 172,  55, 255)
GOLD_D   = (152, 118,  18, 255)
CAPE_D   = (128,  18,  18, 255)
CAPE_M   = (172,  36,  36, 255)
CAPE_HI  = (210,  78,  58, 255)
WOLF_FUR = (192, 185, 170, 255)
WOLF_D   = (126, 118, 104, 255)
WOLF_EAR = (192,  76,  76, 255)
EYE_AMB  = (228, 152,  14, 255)
EYE_GLO  = (255, 208,  56, 255)
EYE_PUP  = ( 18,  12,   8, 255)
SWORD_B  = (198, 208, 220, 255)
SWORD_HI = (236, 244, 255, 255)
CHAIN    = ( 86,  86, 100, 255)
SHADOW   = ( 28,  28,  38, 200)   # transparent shadow overlay color


def canvas():
    return Image.new('RGBA', (SW, SH), T)

def px(im, x, y, c):
    if 0 <= x < SW and 0 <= y < SH:
        im.putpixel((x, y), c)

def fill(im, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px(im, x, y, c)

def vline(im, x, y0, y1, c):
    for y in range(y0, y1 + 1): px(im, x, y, c)

def hline(im, y, x0, x1, c):
    for x in range(x0, x1 + 1): px(im, x, y, c)

def outline(img):
    src = list(img.getdata())
    w, h = img.size
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


def make_wolf_knight():
    im = canvas()

    # ── Left boot — near side, lower (forward in depth) ───────────────────────
    # Left foot lower on screen = closer to viewer in iso perspective
    fill(im, 4, 30,  9, 31, STEEL_M)
    hline(im, 30, 4, 9, STEEL_L)       # near boot highlight
    hline(im, 31, 4, 9, GOLD_D)        # toe cap trim

    # ── Right boot — far side, higher (receded in depth) ──────────────────────
    fill(im, 13, 29, 17, 31, STEEL_D)  # darker, narrower — far side
    hline(im, 29, 13, 17, STEEL_M)
    hline(im, 31, 13, 17, GOLD_D)

    # ── Greaves / legs ─────────────────────────────────────────────────────────
    # Left leg — near, brighter
    fill(im,  4, 23,  9, 29, STEEL_M)
    vline(im, 4, 23, 29, STEEL_L)      # near-edge highlight
    fill(im,  4, 24,  9, 25, STEEL_L)  # kneecap
    hline(im, 23, 4, 9, GOLD_D)

    # Right leg — far, narrower, darker
    fill(im, 13, 23, 17, 29, STEEL_D)
    vline(im, 17, 23, 29, STEEL_D)
    fill(im, 13, 24, 17, 25, STEEL_M)  # kneecap (dimmer)
    hline(im, 23, 13, 17, GOLD_D)

    # ── Cape — billows right and back (far side of body) ─────────────────────
    fill(im, 16, 14, 22, 29, CAPE_D)
    vline(im, 16, 14, 29, CAPE_M)      # leading edge highlight
    vline(im, 22, 14, 29, CAPE_D)      # trailing edge dark
    vline(im, 17, 16, 27, CAPE_HI)     # fold catch-light
    px(im, 18, 29, CAPE_M); px(im, 20, 28, CAPE_D)  # flutter

    # ── Breastplate — 3/4 perspective: left half brighter, right darker ───────
    # Left chest panel (near side)
    fill(im,  3, 14, 10, 22, STEEL_L)
    fill(im,  3, 14, 10, 15, STEEL_HI)  # top near-edge shine
    vline(im, 3, 14, 22, STEEL_HI)      # near vertical edge

    # Right chest panel (far side, darker)
    fill(im, 10, 14, 15, 22, STEEL_M)
    fill(im, 10, 14, 15, 15, STEEL_L)
    vline(im, 15, 14, 22, STEEL_D)      # far vertical edge

    # Center ridge
    vline(im, 10, 14, 22, STEEL_HI)

    # Gold cross emblem — shifted left of center (near side)
    hline(im, 17,  6, 13, GOLD)
    vline(im,  9, 15, 21, GOLD)

    # Gold pauldron trim line
    hline(im, 14, 3, 16, GOLD)

    # ── Left wolf pauldron — near side, prominent ──────────────────────────────
    fill(im, 0, 11, 7, 17, STEEL_D)    # pauldron body
    fill(im, 1, 11, 6, 13, WOLF_FUR)   # wolf head fur on pauldron
    fill(im, 0, 13, 2, 16, WOLF_D)     # snout/muzzle shadow
    vline(im, 7, 11, 17, STEEL_L)      # near edge of pauldron
    # Wolf ear on pauldron
    px(im, 1, 10, WOLF_FUR); px(im, 2,  9, WOLF_FUR)
    px(im, 3,  9, WOLF_FUR); px(im, 2, 10, WOLF_EAR)
    # Wolf eye on pauldron
    px(im, 3, 12, EYE_AMB); px(im, 4, 12, EYE_GLO)
    # Pauldron gold trim
    hline(im, 17, 0, 7, GOLD_D)

    # ── Right gauntlet — far side, recessed (smaller) ─────────────────────────
    fill(im, 16, 17, 18, 22, STEEL_M)
    hline(im, 17, 16, 18, STEEL_L)

    # ── Left gauntlet — near side ──────────────────────────────────────────────
    fill(im, 1, 17,  4, 22, STEEL_M)
    hline(im, 17, 1, 4, STEEL_L)
    vline(im, 1, 17, 22, STEEL_HI)     # near-edge shine

    # ── Sword — right side, 3/4 angle ─────────────────────────────────────────
    fill(im, 19, 29, 21, 31, GOLD)     # pommel
    px(im, 20, 28, GOLD)
    vline(im, 20, 23, 28, STEEL_D)     # grip
    hline(im, 22, 18, 22, GOLD)        # guard
    vline(im, 20, 17, 22, SWORD_B)     # blade
    vline(im, 19, 17, 21, SWORD_HI)    # blade near-edge shine
    px(im, 20, 16, SWORD_B)            # tip

    # ── Chain mail neck ────────────────────────────────────────────────────────
    fill(im, 7, 12, 14, 14, CHAIN)
    hline(im, 12, 4, 16, GOLD_D)

    # ── Helmet ─────────────────────────────────────────────────────────────────
    # Main helmet — slightly left-heavy for 3/4 feel
    fill(im, 3,  3, 18, 12, STEEL_M)
    fill(im, 4,  2, 17,  3, STEEL_M)
    fill(im, 6,  1, 15,  2, STEEL_M)
    px(im, 7, 1, STEEL_M); px(im, 14, 1, STEEL_M)

    # Near-side (left) highlight
    fill(im, 3,  3,  9,  5, STEEL_L)
    vline(im, 3,  3, 12, STEEL_HI)

    # Far-side (right) shadow
    vline(im, 18,  4, 12, STEEL_D)
    fill(im, 14,  4, 18,  6, STEEL_D)

    # Visor — slightly left-leaning (near side wider)
    fill(im, 4,  6, 17,  8, STEEL_D)

    # Eyes in visor — left eye slightly larger (near side)
    fill(im, 5,  6,  9,  8, STEEL_D)  # left eye recess (wider)
    fill(im, 12,  6, 16,  8, STEEL_D) # right eye recess (narrower)
    px(im, 6, 7, EYE_AMB); px(im, 7, 7, EYE_GLO)  # left eye (bright)
    px(im, 13, 7, EYE_AMB); px(im, 14, 7, EYE_GLO) # right eye (slightly dimmer)
    px(im, 6, 7, EYE_PUP)   # left pupil
    px(im, 13, 7, EYE_PUP)  # right pupil

    # Gold crown ridge
    hline(im, 3, 4, 16, GOLD)
    hline(im, 3, 8, 11, GOLD_D)
    vline(im, 10, 3, 12, GOLD_D)       # nasal guard (slightly left of center)
    px(im, 9, 4, GOLD); px(im, 11, 4, GOLD)

    # ── Wolf ears on helmet ────────────────────────────────────────────────────
    # Left ear — near, more prominent
    px(im, 5, 0, WOLF_FUR); px(im, 6, 0, WOLF_FUR); px(im, 7, 0, WOLF_FUR)
    px(im, 4, 1, WOLF_FUR); px(im, 5, 1, WOLF_FUR); px(im, 6, 1, WOLF_FUR)
    px(im, 5, 1, WOLF_EAR)
    px(im, 5, 2, STEEL_D); px(im, 6, 2, STEEL_D)

    # Right ear — far, slightly smaller
    px(im, 15, 0, WOLF_FUR); px(im, 16, 0, WOLF_FUR)
    px(im, 15, 1, WOLF_FUR); px(im, 16, 1, WOLF_FUR); px(im, 17, 1, WOLF_FUR)
    px(im, 16, 1, WOLF_EAR)
    px(im, 15, 2, STEEL_D); px(im, 16, 2, STEEL_D)

    return outline(im)


out_path = os.path.normpath(os.path.join(
    os.path.dirname(__file__), '..', 'public', 'assets', 'sprites', 'player.png'
))
make_wolf_knight().save(out_path)
print(f'Saved: {out_path}')
