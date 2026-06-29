"""
iso_utils.py — Shared drawing helpers for Mana Tactics 2.5D oblique backgrounds.

Grid positions match Phaser physics exactly (25×18 tiles, 32px each).
The "3D" look comes from: visible wall faces, object depth strips, and
depth-aware floor shading — not from coordinate transforms.
"""
from PIL import Image, ImageDraw
import math

W, H = 800, 576
TILE = 32
COLS, ROWS = 25, 18

# Depth of visible face strips (px)
WALL_CAP  = 9    # dark top of wall (seen from above)
WALL_FACE = 23   # visible south/east/west face height
OBJ_DEPTH = 8    # depth face on raised furniture/objects

# ── Color helpers ─────────────────────────────────────────────────────────────
def lerp_color(c0, c1, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c0[i] + t * (c1[i] - c0[i])) for i in range(3))

def darken(color, amount=20):
    return tuple(max(0, c - amount) for c in color)

def lighten(color, amount=20):
    return tuple(min(255, c + amount) for c in color)

def blend(dst, src, alpha):
    """Blend src over dst with 0..1 alpha."""
    return tuple(min(255, int(dst[i] * (1 - alpha) + src[i] * alpha)) for i in range(3))

# ── Grid helpers ──────────────────────────────────────────────────────────────
def tx(col): return col * TILE
def ty(row): return row * TILE

# ── Wall tile renderers ───────────────────────────────────────────────────────

def wall_n(draw, col, top_col, face_col, line_col, hi_col):
    """North wall tile (row 0): dark cap + south-facing front face."""
    x0, y0 = tx(col), 0
    x1, y1 = x0 + TILE, TILE
    cap_bot = y0 + WALL_CAP
    # Top cap — seen from above
    draw.rectangle([(x0, y0), (x1, cap_bot)], fill=darken(top_col, 18))
    # Front face — the vertical surface facing the player
    draw.rectangle([(x0, cap_bot), (x1, y1)], fill=face_col)
    # Bevel highlight on cap top
    draw.line([(x0, y0 + 1), (x1, y0 + 1)], fill=hi_col, width=1)
    # Mortar lines on face
    for my in range(cap_bot + 8, y1, 8):
        draw.line([(x0, my), (x1, my)], fill=line_col, width=1)
    # Vertical joint every 2 tiles
    if col % 2 == 0 and col > 0:
        draw.line([(x0, cap_bot), (x0, y1)], fill=line_col, width=1)
    # Cap–face separation
    draw.line([(x0, cap_bot), (x1, cap_bot)], fill=darken(line_col, 10), width=1)

def wall_l(draw, row, bg_col, face_col, line_col, hi_col):
    """Left wall tile (col 0): dark edge + east-facing visible face."""
    x0, y0 = 0, ty(row)
    x1, y1 = TILE, y0 + TILE
    # Dark left edge
    draw.rectangle([(x0, y0), (x0 + WALL_CAP, y1)], fill=darken(bg_col, 30))
    # East face
    draw.rectangle([(x0 + WALL_CAP, y0), (x1, y1)], fill=face_col)
    # Mortar every other row
    if row % 2 == 1:
        draw.line([(x0, y0), (x1, y0)], fill=line_col, width=1)
    # Highlight left edge
    draw.line([(x0, y0), (x0, y1)], fill=hi_col, width=1)
    # Edge–face seam
    draw.line([(x0 + WALL_CAP, y0), (x0 + WALL_CAP, y1)], fill=darken(line_col, 10), width=1)

def wall_r(draw, row, bg_col, face_col, line_col, hi_col):
    """Right wall tile (col 24): dark edge + west-facing visible face."""
    x0, y0 = tx(24), ty(row)
    x1, y1 = x0 + TILE, y0 + TILE
    # Dark right edge
    draw.rectangle([(x1 - WALL_CAP, y0), (x1, y1)], fill=darken(bg_col, 30))
    # West face
    draw.rectangle([(x0, y0), (x1 - WALL_CAP, y1)], fill=face_col)
    # Mortar every other row
    if row % 2 == 1:
        draw.line([(x0, y0), (x1, y0)], fill=line_col, width=1)
    # Highlight right edge
    draw.line([(x1 - 1, y0), (x1 - 1, y1)], fill=hi_col, width=1)
    draw.line([(x1 - WALL_CAP, y0), (x1 - WALL_CAP, y1)], fill=darken(line_col, 10), width=1)

def wall_s(draw, col, face_col, line_col, gap_cols=None):
    """South wall tile (row 17): cap only (player looks at it head-on)."""
    if gap_cols and col in gap_cols:
        return
    x0, y0 = tx(col), ty(17)
    x1, y1 = x0 + TILE, H
    draw.rectangle([(x0, y0), (x1, y1)], fill=face_col)
    draw.line([(x0, y0), (x1, y0)], fill=line_col, width=2)
    if col % 2 == 0:
        draw.line([(x0, y0), (x0, y1)], fill=line_col, width=1)

def floor_tile(draw, col, row, col_a, col_b, grid_col, depth_t=0.5):
    """Floor tile with depth shading. depth_t 0=far/light, 1=near/dark."""
    x0, y0 = tx(col), ty(row)
    x1, y1 = x0 + TILE, y0 + TILE
    base = col_a if (col + row) % 2 == 0 else col_b
    draw.rectangle([(x0, y0), (x1, y1)], fill=base)
    draw.line([(x1 - 1, y0), (x1 - 1, y1 - 1)], fill=grid_col, width=1)
    draw.line([(x0, y1 - 1), (x1 - 1, y1 - 1)], fill=grid_col, width=1)

# ── Object depth face ─────────────────────────────────────────────────────────

def depth_rect(draw, x0, y0, x1, y1, top_col, face_col, depth=OBJ_DEPTH, hi=True):
    """Raised rectangle: top surface + visible front face strip below."""
    draw.rectangle([(x0, y0), (x1, y1)], fill=top_col)
    draw.rectangle([(x0, y1), (x1, y1 + depth)], fill=face_col)
    draw.line([(x0, y1 + depth), (x1, y1 + depth)], fill=darken(face_col, 30), width=1)
    if hi:
        draw.line([(x0, y0), (x1, y0)], fill=lighten(top_col, 22), width=1)
    draw.line([(x0, y0), (x0, y1 + depth)], fill=darken(face_col, 15), width=1)

def shadow_ellipse(draw, cx, cy, rx, ry, col=(0, 0, 0), alpha=0.35, img=None):
    """Draw a soft drop shadow ellipse (uses pixel blending if img provided)."""
    if img is None:
        draw.ellipse([(cx - rx, cy - ry), (cx + rx, cy + ry)], fill=col)
        return
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                if 0 <= x < W and 0 <= y < H:
                    px = img.getpixel((x, y))
                    img.putpixel((x, y), blend(px, col, alpha * (1 - (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) ** 0.5)))

# ── Standard HUD top bar ──────────────────────────────────────────────────────
GOLD = (210, 172, 55)

def draw_hud_bar(draw):
    """Dark HUD bar at y=0..32 with gold border. Phaser draws UI over this."""
    draw.rectangle([(0, 0), (W, 32)], fill=(12, 14, 20))
    draw.line([(0, 31), (W, 31)], fill=(80, 68, 28), width=1)
    draw.line([(0, 32), (W, 32)], fill=GOLD, width=1)
