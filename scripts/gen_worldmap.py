"""
Generates public/assets/worldmap-bg.png (800x600)
Run: powershell.exe -Command "python 'C:\\Users\\Kenny\\mana-tactics\\scripts\\gen_worldmap.py'"
"""
from PIL import Image, ImageDraw
import math

W, H = 800, 600
img = Image.new('RGB', (W, H), (10, 18, 45))
d = ImageDraw.Draw(img)

# ── Palette ────────────────────────────────────────────────────────────────
SKY0  = (10,  18,  45)
SKY1  = (28,  55,  98)
SKY2  = (45,  80, 130)
MTN_B = (38,  45,  62)
MTN_M = (58,  66,  82)
MTN_F = (75,  80,  95)
SNOW  = (210, 218, 235)
SEA   = (25,  82, 115)
WAVE  = (38, 108, 148)
COAST = (48, 130, 170)
LAND  = (62, 105,  44)
LAND2 = (78, 125,  56)
PATH  = (170, 138,  78)
PATH2 = (148, 118,  60)
PLAINS1 = (195, 178,  85)
PLAINS2 = (175, 158,  65)
FOREST1 = (22,  62,  18)
FOREST2 = (38,  88,  28)
FOREST3 = (55, 112,  40)
EMBER1  = (88,  32,  14)
EMBER2  = (62,  24,   8)
LAVA    = (210,  80,  20)
LAVA2   = (255, 140,  40)
SHADOW1 = (34,  22,  52)
SHADOW2 = (52,  36,  72)
TIDE1   = (40, 100, 140)
TIDE2   = (55, 128, 168)
STN0    = (55,  52,  65)
STN1    = (78,  74,  88)
STN2    = (108,102, 118)
STN3    = (138,130, 148)
GOLD    = (210, 172,  55)
GOLD2   = (238, 210,  90)
CRYS_P  = (135,  65, 195)
CRYS_C  = (55,  195, 215)
CRYS_W  = (215, 178, 255)
WOOD    = (92,  65,  32)
WOOD2   = (115,  85,  45)
FIRE    = (240, 100,  20)

# ─────────────────────────────────────────────────────────────────────────────
# 1. SKY GRADIENT
# ─────────────────────────────────────────────────────────────────────────────
for y in range(195):
    t = y / 194
    if t < 0.5:
        t2 = t / 0.5
        r = int(SKY0[0] + t2 * (SKY1[0] - SKY0[0]))
        g = int(SKY0[1] + t2 * (SKY1[1] - SKY0[1]))
        b = int(SKY0[2] + t2 * (SKY1[2] - SKY0[2]))
    else:
        t2 = (t - 0.5) / 0.5
        r = int(SKY1[0] + t2 * (SKY2[0] - SKY1[0]))
        g = int(SKY1[1] + t2 * (SKY2[1] - SKY1[1]))
        b = int(SKY1[2] + t2 * (SKY2[2] - SKY1[2]))
    d.rectangle([(0, y), (W, y + 1)], fill=(r, g, b))

# ─────────────────────────────────────────────────────────────────────────────
# 2. CLOUD STREAKS
# ─────────────────────────────────────────────────────────────────────────────
clouds = [(80, 55, 110, 10), (220, 42, 160, 8), (440, 62, 130, 9),
          (620, 48, 100, 8), (730, 65, 80, 7)]
for cx, cy, cw, ch in clouds:
    d.ellipse([(cx, cy - ch), (cx + cw, cy + ch)], fill=(200, 215, 240))
    d.ellipse([(cx + 15, cy - ch - 3), (cx + cw - 15, cy + ch + 2)], fill=(220, 230, 248))

# ─────────────────────────────────────────────────────────────────────────────
# 3. DISTANT MOUNTAIN RANGES (back → front)
# ─────────────────────────────────────────────────────────────────────────────
def mountain_range(points, col):
    d.polygon(points, fill=col)

# Back range
back = [(0,195),(55,128),(115,155),(180,118),(250,142),(320,105),(395,132),
        (465,110),(540,138),(610,112),(680,140),(748,115),(800,135),(800,195)]
mountain_range(back, MTN_B)

# Mid range
mid = [(0,195),(30,158),(85,135),(155,162),(215,122),(285,148),(355,118),
       (425,144),(495,120),(565,148),(630,122),(700,152),(762,128),(800,148),(800,195)]
mountain_range(mid, MTN_M)

# Front foothills
front = [(0,195),(45,172),(100,185),(170,175),(245,188),(315,170),
         (390,182),(460,172),(535,184),(605,170),(670,180),(740,168),(800,178),(800,195)]
mountain_range(front, MTN_F)

# Snow caps on prominent peaks
snow_peaks = [(55,128),(180,118),(320,105),(465,110),(610,112),(748,115)]
for px, py in snow_peaks:
    d.polygon([(px,py),(px-12,py+20),(px+12,py+20)], fill=SNOW)
    d.polygon([(px,py),(px-5,py+9),(px+5,py+9)], fill=(240,245,255))

# ─────────────────────────────────────────────────────────────────────────────
# 4. OCEAN (east side)
# ─────────────────────────────────────────────────────────────────────────────
ocean_poly = [(560,185),(575,200),(580,270),(578,355),(560,445),(510,498),
              (W,498),(W,195)]
d.polygon(ocean_poly, fill=SEA)
# Wave lines
for wy in range(200, 500, 16):
    if wy < 498:
        x0 = max(560, 555 + (wy - 200) // 8)
        d.line([(x0, wy), (W, wy)], fill=WAVE, width=1)
# Coastline
coast_pts = [(560,185),(575,200),(580,270),(578,355),(560,445),(510,498)]
d.line(coast_pts, fill=COAST, width=3)

# ─────────────────────────────────────────────────────────────────────────────
# 5. MAIN LANDMASS
# ─────────────────────────────────────────────────────────────────────────────
land_poly = [(88,200),(165,168),(258,152),(358,140),(450,155),(528,172),
             (558,220),(562,290),(558,360),(542,440),(482,492),(395,508),
             (305,502),(220,475),(155,432),(108,368),(88,295)]
d.polygon(land_poly, fill=LAND)
# Subtle grass variation
d.polygon([(200,220),(340,195),(460,210),(520,260),(480,340),
           (360,380),(220,360),(145,290),(160,225)], fill=LAND2)

# ─────────────────────────────────────────────────────────────────────────────
# 6. REGION TERRAIN ZONES
# ─────────────────────────────────────────────────────────────────────────────

# Solara Plains (north center)
d.polygon([(275,152),(385,138),(455,158),(450,225),(385,248),(305,240),(268,205)],
          fill=PLAINS1)
d.polygon([(310,162),(385,148),(445,168),(440,215),(385,232),(318,225)],
          fill=PLAINS2)
# Plains grass marks
for gx, gy in [(330,175),(360,190),(390,170),(415,195),(345,215),(375,215)]:
    d.line([(gx, gy), (gx+4, gy-6)], fill=(155,135,55), width=1)
    d.line([(gx+2, gy), (gx+6, gy-5)], fill=(155,135,55), width=1)

# Thornveil Woods (west)
d.polygon([(88,200),(168,168),(218,202),(212,295),(168,348),(108,338),(88,292)],
          fill=FOREST1)
# Tree canopy blobs
for fx, fy, fr in [(122,238,20),(155,268,18),(140,300,16),(108,262,14),(188,235,15),
                    (165,310,13),(128,285,12),(175,280,14)]:
    d.ellipse([(fx-fr,fy-fr),(fx+fr,fy+fr)], fill=FOREST2)
    fr2 = max(8, fr - 5)
    d.ellipse([(fx-fr2+2,fy-fr2-3),(fx+fr2+2,fy+fr2-3)], fill=FOREST3)

# Tidefall coastal area (east)
d.polygon([(450,155),(528,172),(558,220),(562,290),(538,275),(508,228),(472,195),(462,165)],
          fill=TIDE1)
# Tidal flats
d.polygon([(510,225),(555,240),(555,285),(530,278),(512,250)], fill=TIDE2)

# Embercrest Peaks (south-west)
d.polygon([(148,395),(222,362),(308,372),(332,428),(298,478),(222,488),(162,455),(135,415)],
          fill=EMBER1)
d.polygon([(175,405),(260,375),(310,395),(328,438),(285,465),(218,475),(165,445)],
          fill=EMBER2)
# Lava cracks
lava_cracks = [
    [(180,415),(208,405),(225,418)],
    [(248,385),(268,398),(285,388)],
    [(278,445),(295,435),(310,448)],
    [(195,452),(215,440),(235,458)],
]
for pts in lava_cracks:
    d.line(pts, fill=LAVA, width=2)
    d.line([(pts[1][0]-1, pts[1][1]+1),(pts[2][0]-1,pts[2][1]+1)], fill=LAVA2, width=1)

# Shadowmere Bog (south-east)
d.polygon([(388,392),(468,375),(528,388),(542,440),(508,478),(428,492),(380,466),(368,415)],
          fill=SHADOW1)
d.polygon([(405,402),(478,390),(522,405),(532,442),(500,468),(425,478),(390,450)],
          fill=SHADOW2)
# Bog mist rings
for mx, my, mr in [(430,418,18),(475,435,14),(458,458,12),(500,420,12)]:
    d.ellipse([(mx-mr,my-mr//2),(mx+mr,my+mr//2)], outline=(80,60,105), width=1)

# ─────────────────────────────────────────────────────────────────────────────
# 7. PATH NETWORK
# ─────────────────────────────────────────────────────────────────────────────
CENTER = (385, 310)
# Path targets (just outside each building)
PATH_ENDS = {
    'white': (382, 205),
    'blue':  (522, 252),
    'black': (472, 412),
    'red':   (232, 410),
    'green': (168, 282),
}
for name, (ex, ey) in PATH_ENDS.items():
    # Edge (slightly darker)
    d.line([(CENTER[0], CENTER[1]), (ex, ey)], fill=PATH2, width=12)
    # Main path
    d.line([(CENTER[0], CENTER[1]), (ex, ey)], fill=PATH, width=8)
    # Center light strip
    d.line([(CENTER[0], CENTER[1]), (ex, ey)], fill=(188, 158, 95), width=3)

# ─────────────────────────────────────────────────────────────────────────────
# 8. CRYSTAL NEXUS (center hub)
# ─────────────────────────────────────────────────────────────────────────────
nx, ny = CENTER
# Stone platform
d.ellipse([(nx-38, ny-22),(nx+38, ny+22)], fill=STN1)
d.ellipse([(nx-32, ny-18),(nx+32, ny+18)], fill=STN2)
d.ellipse([(nx-25, ny-13),(nx+25, ny+13)], fill=STN3)
# Runic ring
for i in range(8):
    angle = math.radians(i * 45)
    rx = int(nx + 20 * math.cos(angle))
    ry = int(ny + 10 * math.sin(angle))
    d.ellipse([(rx-2,ry-2),(rx+2,ry+2)], fill=GOLD)

# Crystal cluster
def crystal(cx, cy, w, h, col, highlight):
    pts = [(cx, cy-h), (cx+w, cy), (cx, cy+h//3), (cx-w, cy)]
    d.polygon(pts, fill=col)
    d.line([(cx,cy-h),(cx+w,cy)], fill=highlight, width=1)
    d.line([(cx,cy-h),(cx-w,cy)], fill=highlight, width=1)

crystal(nx,    ny-28, 9, 26, CRYS_P, CRYS_W)   # tall center
crystal(nx-16, ny-14, 7, 18, CRYS_C, CRYS_W)   # left
crystal(nx+16, ny-14, 7, 18, CRYS_C, CRYS_W)   # right
crystal(nx-26, ny-6,  5, 12, CRYS_W, (255,255,255))  # far left
crystal(nx+26, ny-6,  5, 12, CRYS_W, (255,255,255))  # far right
# Glow halo
d.ellipse([(nx-42, ny-50),(nx+42, ny+10)], outline=(140,80,200,60), width=2)

# ─────────────────────────────────────────────────────────────────────────────
# 9. REGION BUILDINGS
# ─────────────────────────────────────────────────────────────────────────────

def rect(x0, y0, x1, y1, fill, outline=None, ow=1):
    d.rectangle([(x0,y0),(x1,y1)], fill=fill)
    if outline:
        d.rectangle([(x0,y0),(x1,y1)], outline=outline, width=ow)

def tri(pts, fill):
    d.polygon(pts, fill=fill)

# ── Mana Academy (white/north) — 3-tower castle ──
ax, ay = 382, 180
# Base curtain wall
rect(ax-28, ay-8,  ax+28, ay+14, STN1)
rect(ax-30, ay-10, ax+30, ay+14, STN1, STN2)
# Center tower
rect(ax-10, ay-38, ax+10, ay-8,  STN2)
tri([(ax-12,ay-38),(ax+12,ay-38),(ax,ay-54)], GOLD)           # roof
d.rectangle([(ax-3,ay-30),(ax+3,ay-20)], fill=(160,200,240))  # window
d.rectangle([(ax-6,ay-8),(ax+6,ay+14)], fill=STN0)            # doorway
# Left tower
rect(ax-26, ay-28, ax-14, ay-8, STN2)
tri([(ax-28,ay-28),(ax-12,ay-28),(ax-20,ay-42)], GOLD2)
d.rectangle([(ax-24,ay-22),(ax-16,ay-14)], fill=(160,200,240))
# Right tower
rect(ax+14, ay-28, ax+26, ay-8, STN2)
tri([(ax+12,ay-28),(ax+28,ay-28),(ax+20,ay-42)], GOLD2)
d.rectangle([(ax+16,ay-22),(ax+24,ay-14)], fill=(160,200,240))
# Battlements on center tower top
for bx in range(ax-10, ax+12, 5):
    rect(bx, ay-40, bx+3, ay-37, STN3)
# Flag
d.line([(ax, ay-54),(ax, ay-62)], fill=GOLD, width=2)
d.polygon([(ax,ay-62),(ax+8,ay-58),(ax,ay-54)], fill=GOLD)

# ── Tidefall Library (blue/east) ──
lx, ly = 522, 236
rect(lx-16, ly-38, lx+16, ly+12, STN1)
rect(lx-18, ly-40, lx+18, ly+12, STN1, STN2)
tri([(lx-18,ly-40),(lx+18,ly-40),(lx,ly-58)], (60, 95, 130))
# Arched windows (3 rows)
for wy in [ly-32, ly-20, ly-8]:
    rect(lx-5, wy, lx+5, wy+9, (75, 138, 188))
    # Arch
    d.ellipse([(lx-5,wy-3),(lx+5,wy+2)], fill=(75,138,188))
# Wide base
rect(lx-22, ly-20, lx+22, ly+12, STN2, STN1)
# Steps
rect(lx-18, ly+12, lx+18, ly+16, STN3)
rect(lx-14, ly+16, lx+14, ly+19, STN2)
# Dock post
rect(lx+26, ly-2,  lx+29, ly+18, WOOD)
d.line([(lx+22,ly+15),(lx+38,ly+15)], fill=WOOD, width=2)
# Tidefall banner (blue)
d.polygon([(lx+0,ly-58),(lx+0,ly-48),(lx+10,ly-53)], fill=(50,100,160))

# ── Shadow Tower (black/south-east) ──
tx, ty = 472, 422
# Base
rect(tx-18, ty-14, tx+18, ty+14, (48,36,62))
rect(tx-18, ty-14, tx+18, ty+14, (48,36,62), STN0)
# Tower shaft
rect(tx-10, ty-52, tx+10, ty-14, (36,26,50))
# Battlements
for bx in range(tx-9, tx+10, 6):
    rect(bx, ty-60, bx+4, ty-52, (48,36,62))
# Purple windows
for wy in [ty-46, ty-34, ty-22]:
    rect(tx-3, wy, tx+3, wy+7, (155, 75, 215))
# Spire
tri([(tx-4,ty-60),(tx+4,ty-60),(tx,ty-72)], (110,55,175))
# Side mini-towers
for stx in [tx-16, tx+16]:
    rect(stx-4, ty-32, stx+4, ty-14, (42,30,58))
    tri([(stx-5,ty-32),(stx+5,ty-32),(stx,ty-42)], (90,45,145))

# ── Embercrest Forge (red/south-west) ──
fx, fy = 232, 418
# Building body
rect(fx-24, fy-14, fx+24, fy+14, (105,50,28))
rect(fx-26, fy-16, fx+26, fy+14, (105,50,28), (75,35,18))
# Roof
tri([(fx-26,fy-16),(fx+26,fy-16),(fx+18,fy-32),(fx-18,fy-32)], (75,32,16))
d.polygon([(fx-26,fy-16),(fx+26,fy-16),(fx+18,fy-32),(fx-18,fy-32)], fill=(75,32,16))
# Chimneys
for chx in [fx-12, fx+12]:
    rect(chx-4, fy-42, chx+4, fy-32, (58,38,22))
    tri([(chx-5,fy-42),(chx+5,fy-42),(chx,fy-55)], FIRE)
    tri([(chx-3,fy-43),(chx+3,fy-43),(chx,fy-52)], LAVA2)
    d.ellipse([(chx-4,fy-46),(chx+4,fy-42)], fill=(180,60,10))
# Windows (orange glow)
for wx in [fx-14, fx, fx+14]:
    rect(wx-4, fy-10, wx+4, fy-2, (200,85,20))
# Door
rect(fx-5, fy-2, fx+5, fy+14, (42,25,10))
# Anvil outside
rect(fx+28, fy-2, fx+36, fy+4, STN1)
rect(fx+26, fy+4, fx+38, fy+8, STN2)

# ── Forest Shrine (green/west) ──
sx, sy = 165, 268
# Stone base
rect(sx-22, sy-4, sx+22, sy+12, (75,85,55))
rect(sx-22, sy-4, sx+22, sy+12, (75,85,55),(60,72,42))
# Pillars
for px in [sx-14, sx+14]:
    rect(px-5, sy-32, px+5, sy-4, WOOD)
    rect(px-4, sy-34, px+4, sy-32, WOOD2)
# Crossbeam
rect(sx-16, sy-36, sx+16, sy-32, WOOD2)
# Arch detail
d.arc([(sx-14,sy-44),(sx+14,sy-30)], start=0, end=180, fill=WOOD, width=3)
# Central stone altar
rect(sx-4, sy-28, sx+4, sy-16, STN2)
# Crystal on altar
tri([(sx,sy-40),(sx+5,sy-30),(sx,sy-25),(sx-5,sy-30)], (70,175,70))
d.line([(sx,sy-40),(sx+4,sy-32)], fill=(140,230,140), width=1)
# Flanking trees
for tree_x in [sx-28, sx+28]:
    rect(tree_x-2, sy-18, tree_x+2, sy+12, (65,45,22))
    d.ellipse([(tree_x-11,sy-38),(tree_x+11,sy-18)], fill=FOREST1)
    d.ellipse([(tree_x-9, sy-42),(tree_x+9, sy-22)], fill=FOREST2)
    d.ellipse([(tree_x-7, sy-44),(tree_x+7, sy-26)], fill=FOREST3)

# ─────────────────────────────────────────────────────────────────────────────
# 10. SCATTERED DETAILS
# ─────────────────────────────────────────────────────────────────────────────
# Extra trees on landmass interior
for tx2, ty2, tr2 in [(320,215,9),(348,248,8),(310,272,7),(285,255,8),(338,285,7)]:
    d.ellipse([(tx2-tr2,ty2-tr2),(tx2+tr2,ty2+tr2)], fill=FOREST1)
    d.ellipse([(tx2-tr2+2,ty2-tr2-3),(tx2+tr2-2,ty2+tr2-5)], fill=FOREST2)

# Boulders near Embercrest
for rx, ry, rr in [(198,445,6),(262,458,5),(290,385,5),(215,395,4)]:
    d.ellipse([(rx-rr,ry-rr//2+2),(rx+rr,ry+rr//2+2)], fill=STN0)
    d.line([(rx-rr+1,ry-2),(rx+rr-1,ry-2)], fill=STN1, width=1)

# Small shrubs on plains
for sx2, sy2 in [(350,190),(400,195),(365,220),(420,205),(330,240)]:
    d.ellipse([(sx2-5,sy2-4),(sx2+5,sy2+3)], fill=(148,128,52))

# ─────────────────────────────────────────────────────────────────────────────
# 11. COMPASS ROSE
# ─────────────────────────────────────────────────────────────────────────────
crx, cry = 88, 532
# Outer ring
d.ellipse([(crx-22,cry-22),(crx+22,cry+22)], fill=(35,28,18), outline=GOLD, width=1)
# Cardinal arms
for angle, label in [(90,'N'),(0,'E'),(270,'S'),(180,'W')]:
    rad = math.radians(angle)
    ex2 = int(crx + 18 * math.cos(rad))
    ey2 = int(cry - 18 * math.sin(rad))
    d.polygon([
        (crx, cry),
        (int(crx + 6*math.cos(rad+1.57)), int(cry - 6*math.sin(rad+1.57))),
        (ex2, ey2),
        (int(crx + 6*math.cos(rad-1.57)), int(cry - 6*math.sin(rad-1.57))),
    ], fill=GOLD if angle == 90 else STN2)
# Center dot
d.ellipse([(crx-3,cry-3),(crx+3,cry+3)], fill=GOLD2)

# ─────────────────────────────────────────────────────────────────────────────
# 12. BORDER FRAME
# ─────────────────────────────────────────────────────────────────────────────
# Outer stone border
d.rectangle([(0,0),(W-1,H-1)], outline=(30,24,18), width=6)
d.rectangle([(3,3),(W-4,H-4)], outline=GOLD, width=2)
d.rectangle([(6,6),(W-7,H-7)], outline=(55,45,28), width=1)

# Corner ornaments
for ox, oy in [(8,8),(W-8,8),(8,H-8),(W-8,H-8)]:
    d.ellipse([(ox-5,oy-5),(ox+5,oy+5)], fill=GOLD)
    d.ellipse([(ox-3,oy-3),(ox+3,oy+3)], fill=GOLD2)

# ─────────────────────────────────────────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────────────────────────────────────────
out = r'C:\Users\Kenny\mana-tactics\public\assets\worldmap-bg.png'
img.save(out)
print(f'Saved {W}x{H} -> {out}')
