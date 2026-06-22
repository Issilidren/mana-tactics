#!/usr/bin/env python3
"""
Mana Tactics — GBA/FFTA-style pixel art generator
Produces 24x32 sprite PNGs and 32x32 tile PNGs using Pillow.
Run: python3 scripts/generate_assets.py
"""

from PIL import Image, ImageDraw
import os

SPRITES_DIR = '/mnt/c/Users/Kenny/mana-tactics/public/assets/sprites'
TILES_DIR   = '/mnt/c/Users/Kenny/mana-tactics/public/assets/tiles'
os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(TILES_DIR, exist_ok=True)

SW, SH = 24, 32   # sprite size
TW, TH = 32, 32   # tile size
T = (0, 0, 0, 0)  # transparent

# ── GBA-style colour palette ──────────────────────────────────────────────────
OUTLINE   = (8, 6, 10, 255)

SKIN_A    = (248, 200, 128, 255)   # light warm skin
SKIN_B    = (220, 164,  92, 255)   # skin shadow
SKIN_PALE = (200, 220, 232, 255)   # academic/pale
SKIN_PALE2= (168, 196, 216, 255)
SKIN_TAN  = (196, 144,  88, 255)   # tan skin
SKIN_TAN2 = (160, 110,  62, 255)

HAIR_BLACK= ( 28,  22,  18, 255)
HAIR_DARK = ( 44,  34,  26, 255)
HAIR_WHITE= (238, 234, 220, 255)
HAIR_PINK = (255, 138, 210, 255)
HAIR_PINK2= (255,  96, 170, 255)

EYE_D     = ( 20,  14,  12, 255)   # pupil dark
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
PANTS_A   = ( 36,  48, 142, 255)
PANTS_B   = ( 24,  32, 100, 255)
COLLAR    = (228, 228, 244, 255)
STRIPE    = (236, 236, 248, 255)
BROWN_A   = (124,  76,  32, 255)
BROWN_B   = ( 88,  52,  18, 255)
BOOK_A    = (136,  56,  28, 255)
BOOK_B    = (100,  36,  12, 255)
BOOK_PAGE = (245, 236, 210, 255)

# ── Drawing helpers ───────────────────────────────────────────────────────────

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
    """1-px outline (8-directional) around all opaque pixels."""
    w, h = img.size
    src = [(img.getpixel((x,y)) if 0<=x<w and 0<=y<h else T)
           for y in range(h) for x in range(w)]
    def s(x,y): return src[y*w+x][3] if 0<=x<w and 0<=y<h else 0

    out = img.copy()
    for y in range(h):
        for x in range(w):
            if src[y*w+x][3] < 32:   # transparent pixel
                # opaque neighbour → paint outline
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

# ═══════════════════════════════════════════════════════════════════════════════
#  SPRITES
# ═══════════════════════════════════════════════════════════════════════════════

# ── player ────────────────────────────────────────────────────────────────────
def make_player():
    im = canvas()
    # feet
    fill(im, 5,29, 10,31, SHOE); fill(im,13,29,18,31,SHOE)
    hline(im,29,5,10,SHOE_HI); hline(im,29,13,18,SHOE_HI)
    # pants
    fill(im, 6,23,10,28,PANTS_A); fill(im,13,23,17,28,PANTS_A)
    vline(im, 6,23,28,PANTS_B); vline(im,17,23,28,PANTS_B)
    # jacket body
    fill(im, 3,14,20,22,BLUE_A)
    fill(im, 3,14,20,15,BLUE_HI)  # top highlight
    vline(im,3,14,22,BLUE_HI)     # left highlight
    # white collar
    fill(im, 8,14,15,16,COLLAR)
    # white centre stripe
    fill(im,10,14,13,22,STRIPE)
    # jacket shadow
    vline(im,20,14,22,BLUE_B)
    fill(im, 3,20,20,22,BLUE_B)
    # neck
    fill(im, 9,11,14,14,SKIN_A)
    # head — big chibi
    fill(im, 3, 3,20,13,SKIN_A)   # main head
    fill(im, 4, 2,19, 4,SKIN_A)   # rounded top
    px(im,5,2,SKIN_A); px(im,18,2,SKIN_A)
    fill(im, 2, 5, 3,12,SKIN_A)   # left ear bump
    fill(im,20, 5,21,12,SKIN_A)   # right ear bump
    fill(im, 2,13, 3,13,SKIN_B)   # ear shadow
    fill(im,20,13,21,13,SKIN_B)
    # chin shadow
    hline(im,13,4,19,SKIN_B)
    # hair at bottom of head
    fill(im, 3,11,20,14,HAIR_BLACK)
    vline(im, 3, 4,14,HAIR_BLACK)
    vline(im,20, 4,14,HAIR_BLACK)
    # cap brim — wide
    fill(im, 1, 4,22, 6,RED_A)
    hline(im,6,1,22,RED_B)        # underside shadow
    # cap crown
    fill(im, 6, 0,17, 4,RED_A)
    fill(im, 7, 0,16, 1,RED_HI)   # top highlight
    vline(im,6,0,4,RED_B)
    vline(im,17,0,4,RED_B)
    # eyes — 3×2, left & right
    fill(im, 6, 7, 8, 8, EYE_D); fill(im,15, 7,17, 8,EYE_D)
    px(im,6,8,IRIS_BLUE); px(im,15,8,IRIS_BLUE)
    px(im,8,7,EYE_SHINE); px(im,17,7,EYE_SHINE)
    # blush cheeks
    fill(im,2,9,3,10,BLUSH); fill(im,20,9,21,10,BLUSH)
    # mouth
    fill(im,9,11,14,11,MOUTH); px(im,9,11,SKIN_B); px(im,14,11,SKIN_B)
    save_sprite(im,'player')

# ── npc-white ─────────────────────────────────────────────────────────────────
def make_npc_white():
    im = canvas()
    # shoes
    fill(im, 5,29,10,31,BROWN_B); fill(im,13,29,18,31,BROWN_B)
    # wide robe skirt
    fill(im, 1,18,22,31,WHITE_A)
    fill(im, 2,18,21,19,WHITE_B)  # top of skirt
    fill(im, 1,28,22,31,WHITE_B)  # bottom shadow
    # gold hem
    hline(im,30,1,22,GOLD)
    # robe upper body
    fill(im, 4,13,19,18,WHITE_A)
    # gold trim vertical
    vline(im,11,13,18,GOLD); vline(im,12,13,18,GOLD)
    # collar
    fill(im, 8,13,15,15,WHITE_B)
    fill(im,10,13,13,15,WHITE_A)
    # gold shoulder trim
    hline(im,13,4,19,GOLD)
    # neck
    fill(im, 9,10,14,13,SKIN_A)
    # head
    fill(im, 3, 2,20,12,SKIN_A)
    fill(im, 4, 1,19, 2,SKIN_A)   # rounded top
    px(im,5,1,SKIN_A); px(im,18,1,SKIN_A)
    fill(im, 2, 4, 3,11,SKIN_A)   # ear
    fill(im,20, 4,21,11,SKIN_A)
    hline(im,12,3,20,SKIN_B)
    # white flowing hair
    fill(im, 3, 2,20, 5,HAIR_WHITE)
    vline(im, 3, 3,12,HAIR_WHITE)
    vline(im,20, 3,12,HAIR_WHITE)
    fill(im, 3,10,5,13,HAIR_WHITE)
    fill(im,18,10,20,13,HAIR_WHITE)
    # eyes — gentle blue 3×2
    fill(im, 6, 7, 8, 8,EYE_D); fill(im,15, 7,17, 8,EYE_D)
    px(im,6,8,IRIS_BLUE); px(im,15,8,IRIS_BLUE)
    px(im,8,7,EYE_SHINE); px(im,17,7,EYE_SHINE)
    # blush
    fill(im,2,9,3,10,BLUSH); fill(im,20,9,21,10,BLUSH)
    # smile
    hline(im,11,9,14,MOUTH); px(im,9,11,SKIN_B); px(im,14,11,SKIN_B)
    # halo dots
    for hx in [5,8,11,14,18]: px(im,hx,0,GOLD)
    save_sprite(im,'npc-white')

# ── npc-blue ──────────────────────────────────────────────────────────────────
def make_npc_blue():
    im = canvas()
    # shoes
    fill(im, 5,29,10,31,NAVY_C); fill(im,13,29,18,31,NAVY_C)
    # wide robe
    fill(im, 1,18,22,31,NAVY_A)
    fill(im, 2,18,21,19,BLUE_HI)
    fill(im, 1,28,22,31,NAVY_B)
    # rune detail
    fill(im, 4,22, 7,23,BLUE_A); fill(im,16,24,19,25,BLUE_A)
    # robe upper
    fill(im, 4,13,19,18,NAVY_A)
    hline(im,13,4,19,BLUE_A)
    # wizard collar
    fill(im, 8,13,15,15,NAVY_B)
    hline(im,14,8,15,(100,140,200,255))
    # neck
    fill(im, 9,10,14,13,SKIN_PALE)
    # head
    fill(im, 3, 2,20,12,SKIN_PALE)
    fill(im, 4, 1,19, 2,SKIN_PALE)
    fill(im, 2, 4, 3,11,SKIN_PALE)
    fill(im,20, 4,21,11,SKIN_PALE)
    hline(im,12,3,20,SKIN_PALE2)
    # hat brim
    fill(im, 1, 2,22, 5,NAVY_A)
    hline(im,2,1,22,BLUE_A)       # highlight
    hline(im,5,1,22,NAVY_B)       # brim shadow
    # hat crown (pointed)
    fill(im, 7, 0,16, 2,NAVY_A)
    fill(im, 9, 0,14, 1,NAVY_A)
    fill(im,10, 0,13, 0,NAVY_A)
    vline(im, 7, 0, 2,NAVY_B); vline(im,16, 0, 2,NAVY_B)
    # star on hat
    px(im,11,0,GOLD); px(im,12,0,GOLD)
    px(im,11,1,GOLD); px(im,12,1,GOLD)
    # glowing eyes 3×2
    fill(im, 6, 7, 8, 8,EYE_D); fill(im,15, 7,17, 8,EYE_D)
    px(im,6,7,EYE_GLO_B); px(im,15,7,EYE_GLO_B)
    px(im,8,7,EYE_SHINE); px(im,17,7,EYE_SHINE)
    # eye glow halo
    fill(im, 5, 7, 9, 8,(60,160,255,80))
    fill(im,14, 7,18, 8,(60,160,255,80))
    # stern mouth
    hline(im,11,9,14,(160,180,200,255))
    save_sprite(im,'npc-blue')

# ── npc-black ─────────────────────────────────────────────────────────────────
def make_npc_black():
    im = canvas()
    # entire cloak — fills body
    fill(im, 1,10,22,31,DARK_A)
    # hood
    fill(im, 2, 0,21,12,DARK_A)
    # hood interior shadow
    fill(im, 4, 3,19,12,DARK_C)
    # hood peak
    fill(im, 8, 0,15, 3,DARK_A)
    fill(im,10, 0,13, 1,DARK_A)
    # purple shimmer edge
    hline(im, 0,2,21,PURP_A)
    vline(im, 1, 0,12,PURP_B)
    vline(im,22, 0,12,PURP_B)
    vline(im, 1,10,31,PURP_C)
    vline(im,22,10,31,PURP_C)
    # cloak fold shadow
    vline(im,11,11,31,DARK_C); vline(im,12,11,31,DARK_C)
    # cloak bottom fringe
    fill(im, 1,28,22,31,DARK_C)
    for fx in range(2,22,3): vline(im,fx,28,31,DARK_B)
    # glowing purple eyes — ONLY visible feature (big!)
    fill(im, 6, 7, 9, 9,PURP_GLO); fill(im,14, 7,17, 9,PURP_GLO)
    fill(im, 7, 7, 8, 8,EYE_SHINE); fill(im,15, 7,16, 8,EYE_SHINE)
    # eye glow bleed
    fill(im, 5, 7,10, 9,(160,40,220,80))
    fill(im,13, 7,18, 9,(160,40,220,80))
    save_sprite(im,'npc-black')

# ── npc-red ───────────────────────────────────────────────────────────────────
def make_npc_red():
    im = canvas()
    # heavy boots
    fill(im, 4,28,11,31,SHOE); fill(im,12,28,19,31,SHOE)
    hline(im,28,4,11,SHOE_HI); hline(im,28,12,19,SHOE_HI)
    # leg armour (wider, plate style)
    fill(im, 4,21,10,28,ARMOR_B); fill(im,13,21,19,28,ARMOR_B)
    vline(im, 4,21,28,ARMOR_A); vline(im,13,21,28,ARMOR_A)
    # knee guards
    fill(im, 4,20,10,22,ARMOR_A); fill(im,13,20,19,22,ARMOR_A)
    hline(im,20,4,10,ARMOR_HI); hline(im,20,13,19,ARMOR_HI)
    # chest plate — big, boxy
    fill(im, 2,12,21,21,ARMOR_A)
    fill(im, 2,12,21,13,ARMOR_HI)  # top shine
    vline(im, 2,12,21,ARMOR_HI)    # left shine
    fill(im, 5,15,10,19,ARMOR_HI)  # left chest panel
    fill(im,13,15,18,19,ARMOR_HI)  # right chest panel
    fill(im, 2,19,21,21,ARMOR_B)   # bottom shadow
    vline(im,21,12,21,ARMOR_C)
    # pauldrons (shoulder guards) — extra wide
    fill(im, 0,12, 3,18,ARMOR_B); fill(im,20,12,23,18,ARMOR_B)
    hline(im,12,0,3,ARMOR_A); hline(im,12,20,23,ARMOR_A)
    # helmet — round and heavy
    fill(im, 2, 2,21,13,ARMOR_A)
    fill(im, 3, 1,20, 3,ARMOR_A)   # rounded top
    fill(im, 5, 0,18, 2,ARMOR_A)
    fill(im, 2, 2,21, 3,ARMOR_HI)  # helmet top shine
    vline(im, 2, 2,13,ARMOR_HI)    # left shine
    fill(im, 2,11,21,13,ARMOR_B)   # neck shadow
    # visor slit
    fill(im, 4, 9,19,11,VISOR)
    hline(im, 9,4,19,VISOR_GLO)    # bright line
    fill(im, 4,10,19,11,ARMOR_C)   # visor shadow
    # eyes inside visor
    fill(im, 5, 9, 8,10,IRIS_ORAN); fill(im,15, 9,18,10,IRIS_ORAN)
    px(im,6,9,VISOR_GLO); px(im,16,9,VISOR_GLO)
    # crest mohawk
    fill(im, 9, 0,14, 2,CREST_A)
    fill(im,10, 0,13, 1,CREST_B)   # crest highlight
    vline(im, 9, 0, 2,ARMOR_C); vline(im,14, 0, 2,ARMOR_C)
    save_sprite(im,'npc-red')

# ── npc-green ─────────────────────────────────────────────────────────────────
def make_npc_green():
    im = canvas()
    # sandals
    fill(im, 5,29,10,31,BROWN_B); fill(im,13,29,18,31,BROWN_B)
    hline(im,29,5,10,BROWN_A); hline(im,29,13,18,BROWN_A)
    # wide leaf robe
    fill(im, 1,18,22,31,GREEN_A)
    fill(im, 1,28,22,31,GREEN_B)
    # leaf patches on robe
    fill(im, 1,20, 6,24,GREEN_HI); fill(im,17,20,22,24,GREEN_HI)
    fill(im, 2,26, 5,29,GREEN_B);  fill(im,18,26,21,29,GREEN_B)
    # brown belt
    fill(im, 2,17,21,19,BROWN_A)
    fill(im,10,17,13,19,GOLD)      # buckle
    # robe upper
    fill(im, 4,13,19,18,GREEN_A)
    hline(im,13,4,19,GREEN_HI)
    # collar
    fill(im, 8,13,15,15,GREEN_B)
    # neck
    fill(im, 9,10,14,13,SKIN_TAN)
    # head — wide chibi
    fill(im, 3, 2,20,12,SKIN_TAN)
    fill(im, 4, 1,19, 3,SKIN_TAN)
    fill(im, 2, 4, 3,11,SKIN_TAN)
    fill(im,20, 4,21,11,SKIN_TAN)
    hline(im,12,3,20,SKIN_TAN2)
    # leaf hood
    fill(im, 3, 2,20, 5,GREEN_A)
    vline(im, 3, 3,12,GREEN_B); vline(im,20, 3,12,GREEN_B)
    hline(im, 2,3,20,GREEN_HI)    # top of hood
    # leaf crown
    for lx in [4,8,11,15,18]: px(im,lx,1,GREEN_HI)
    fill(im, 5, 0, 7, 1,GREEN_HI); fill(im,16, 0,18, 1,GREEN_HI)
    fill(im,10, 0,13, 0,GREEN_HI)
    # eyes — warm brown 3×2
    fill(im, 6, 7, 8, 8,EYE_D); fill(im,15, 7,17, 8,EYE_D)
    px(im,6,8,IRIS_BROWN); px(im,15,8,IRIS_BROWN)
    px(im,8,7,EYE_SHINE); px(im,17,7,EYE_SHINE)
    # blush
    fill(im,2,9,3,10,BLUSH); fill(im,20,9,21,10,BLUSH)
    # wide smile
    hline(im,11,8,15,MOUTH); px(im,8,11,SKIN_TAN2); px(im,15,11,SKIN_TAN2)
    save_sprite(im,'npc-green')

# ── npc-librarian ─────────────────────────────────────────────────────────────
def make_npc_librarian():
    im = canvas()
    # shoes
    fill(im, 5,29,10,31,(68,52,52,255)); fill(im,13,29,18,31,(68,52,52,255))
    # wide skirt — magenta
    fill(im, 1,18,22,31,PINK_A)
    fill(im, 1,28,22,31,PINK_B)
    hline(im,18,1,22,PINK_C)
    # blouse
    fill(im, 4,13,19,18,PINK_A)
    fill(im, 4,13,19,14,PINK_B)
    # collar bow
    fill(im, 9,14,14,16,PINK_B)
    fill(im,10,13,13,17,(255,80,160,255))
    px(im,11,14,(255,180,220,255)); px(im,12,14,(255,180,220,255))
    # book held in right hand (sprute right = image left side)
    fill(im, 0,14, 3,23,BOOK_A)
    fill(im, 1,15, 2,22,BOOK_PAGE)
    hline(im,14,0,3,BOOK_B); hline(im,23,0,3,BOOK_B)
    # neck
    fill(im, 9,10,14,13,(245,200,216,255))
    # head
    fill(im, 3, 2,20,12,(245,200,216,255))
    fill(im, 4, 1,19, 3,(245,200,216,255))
    fill(im, 2, 4, 3,11,(245,200,216,255))
    fill(im,20, 4,21,11,(245,200,216,255))
    hline(im,12,3,20,(220,170,188,255))
    # pink hair
    fill(im, 3, 2,20, 6,HAIR_PINK)
    vline(im, 3, 3,13,HAIR_PINK); vline(im,20, 3,13,HAIR_PINK)
    # big bun on top
    fill(im, 7, 0,16, 2,HAIR_PINK)
    fill(im, 8, 0,15, 1,(255,180,228,255))  # bun highlight
    # glasses — dark frame
    fill(im, 5, 6, 9, 8,(32,20,24,255))
    fill(im,13, 6,17, 8,(32,20,24,255))
    px(im,11,7,(32,20,24,255))              # bridge
    # lens tint
    fill(im, 6, 6, 8, 7,(180,220,255,160))
    fill(im,14, 6,16, 7,(180,220,255,160))
    # eyes behind glasses
    px(im,6,7,IRIS_PURP); px(im,14,7,IRIS_PURP)
    px(im,8,6,EYE_SHINE); px(im,16,6,EYE_SHINE)
    # blush
    fill(im,2,9,3,10,BLUSH); fill(im,20,9,21,10,BLUSH)
    # smile
    hline(im,10,9,14,MOUTH)
    save_sprite(im,'npc-librarian')


# ═══════════════════════════════════════════════════════════════════════════════
#  TILES  (32×32)
# ═══════════════════════════════════════════════════════════════════════════════

def make_tile_floor():
    """FFTA-style warm tan cobblestone plaza tile."""
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    # Warm tan palette matching FFTA GBA town plazas
    GROUT    = (148, 128,  92, 255)   # warm brown grout
    STONE    = (196, 176, 136, 255)   # warm cream stone
    STONE_HI = (220, 204, 168, 255)   # light cream highlight
    STONE_MID= (208, 188, 148, 255)   # mid tone
    STONE_SH = (168, 148, 108, 255)   # warm shadow

    d.rectangle([0,0,TW-1,TH-1], fill=GROUT)

    def stone(x0, y0, x1, y1):
        d.rectangle([x0,y0,x1,y1], fill=STONE)
        # top-left highlight (2px L-shape)
        d.rectangle([x0,   y0, x1,   y0+1], fill=STONE_HI)
        d.rectangle([x0,   y0, x0+1, y1  ], fill=STONE_HI)
        # inner tone variation — slight mid-band
        d.rectangle([x0+2, y0+3, x1-2, y0+5], fill=STONE_MID)
        # bottom-right shadow
        d.rectangle([x0,   y1, x1,   y1  ], fill=STONE_SH)
        d.rectangle([x1,   y0, x1,   y1  ], fill=STONE_SH)

    # Four cobblestones — offset pattern like FFTA
    stone(1,  1, 14, 14)
    stone(17, 1, 30, 14)
    stone(1, 17, 14, 30)
    stone(17,17, 30, 30)

    save_tile(im, 'floor')

def make_tile_wall():
    """FFTA-style warm cream building wall with blue slate roof cap."""
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    CREAM    = (216, 200, 160, 255)   # warm building stone
    CREAM_HI = (236, 224, 188, 255)   # highlight
    CREAM_SH = (184, 164, 124, 255)   # shadow
    JOINT    = (172, 152, 112, 255)   # mortar — warm brown
    ROOF     = ( 88, 108, 140, 255)   # blue-slate roof cap
    ROOF_HI  = (128, 152, 188, 255)   # roof highlight
    ROOF_SH  = ( 60,  80, 108, 255)   # roof eave shadow
    ROOF_TRIM= (212, 188, 100, 255)   # gold trim line between roof and wall

    # Roof cap — top 7 rows
    d.rectangle([0, 0, TW-1, 6], fill=ROOF)
    d.rectangle([0, 0, TW-1, 1], fill=ROOF_HI)   # sky highlight
    d.rectangle([0, 5, TW-1, 6], fill=ROOF_SH)   # eave shadow
    # Gold trim strip at roof/wall junction
    d.rectangle([0, 7, TW-1, 7], fill=ROOF_TRIM)

    # Wall stone body
    d.rectangle([0, 8, TW-1, TH-1], fill=CREAM)

    # Mortar horizontal lines
    for my in [16, 24]:
        d.rectangle([0, my, TW-1, my], fill=JOINT)

    # Mortar verticals — running bond (offset per course)
    d.rectangle([16,  8, 16, 15], fill=JOINT)   # top course
    d.rectangle([ 8, 16,  8, 23], fill=JOINT)   # mid course
    d.rectangle([24, 16, 24, 23], fill=JOINT)
    d.rectangle([16, 24, 16, TH-1], fill=JOINT) # bottom course

    # Stone highlights and shadows
    stones = [(1,9,14,15),(17,9,29,15),(1,17,6,23),(9,17,22,23),(25,17,29,23),(1,25,14,30),(17,25,29,30)]
    for (x0,y0,x1,y1) in stones:
        d.rectangle([x0,y0,x1,y0], fill=CREAM_HI)
        d.rectangle([x0,y0,x0,y1], fill=CREAM_HI)
        d.rectangle([x0,y1,x1,y1], fill=CREAM_SH)
        d.rectangle([x1,y0,x1,y1], fill=CREAM_SH)

    save_tile(im, 'wall')

def make_tile_door():
    """Stone portal arch tile for world map door area."""
    im = Image.new('RGBA', (TW, TH), (0,0,0,255))
    d  = ImageDraw.Draw(im)
    STONE  = (152, 162, 180, 255)
    STONE_HI=(180,192,212,255)
    STONE_SH=(120,128,144,255)
    PORTAL = ( 18,  38, 100, 255)
    GLOW   = ( 40,  90, 200, 200)

    # Stone arch frame
    d.rectangle([0,0,TW-1,TH-1], fill=STONE)
    # Portal interior (dark blue glow)
    d.rectangle([6,4,25,28], fill=PORTAL)
    # Glow bands
    d.rectangle([7,6,24, 9], fill=GLOW)
    d.rectangle([7,13,24,16], fill=GLOW)
    d.rectangle([7,20,24,23], fill=GLOW)
    # Arch top (arched top)
    d.rectangle([6,2,25, 5], fill=PORTAL)
    d.rectangle([10,0,20,3], fill=PORTAL)
    # Highlights on stone
    d.rectangle([0,0,TW-1,1], fill=STONE_HI)
    d.rectangle([0,0,1,TH-1], fill=STONE_HI)
    d.rectangle([TW-2,0,TW-1,TH-1], fill=STONE_SH)
    d.rectangle([0,TH-2,TW-1,TH-1], fill=STONE_SH)

    save_tile(im, 'door')

# ═══════════════════════════════════════════════════════════════════════════════
#  RUN
# ═══════════════════════════════════════════════════════════════════════════════

print('Generating sprites...')
make_player()
make_npc_white()
make_npc_blue()
make_npc_black()
make_npc_red()
make_npc_green()
make_npc_librarian()

print('Generating tiles...')
make_tile_floor()
make_tile_wall()
make_tile_door()

print('Done! All assets written to public/assets/')
