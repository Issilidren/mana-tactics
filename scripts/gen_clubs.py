"""
gen_clubs.py - Generates 5 MTG-themed club interior background images using PIL/Pillow.
800x576 pixels, 25 cols x 18 rows, each tile is 32x32 pixels.
"""

import os
from PIL import Image, ImageDraw

OUTPUT_DIR = r"C:\Users\Kenny\mana-tactics\public\assets"

# Color themes for each club
THEMES = {
    "white": {
        "filename": "club-white-bg.png",
        "floor": (244, 240, 228),
        "carpet": (212, 196, 96),
        "wall": (220, 214, 196),
        "podium_base": (248, 244, 232),
        "podium_trim": (212, 180, 80),
        "table": (200, 180, 120),
        "crystal": (255, 240, 160),
        "door_shimmer": (220, 200, 80),
        "banner": (240, 200, 80),
        "wall_accent": (200, 190, 160),  # vein/seam color
        "carpet_border": (240, 220, 120),
        "book_spine_a": (200, 160, 80),
        "book_spine_b": (240, 220, 140),
    },
    "blue": {
        "filename": "club-blue-bg.png",
        "floor": (212, 220, 240),
        "carpet": (34, 85, 170),
        "wall": (148, 164, 196),
        "podium_base": (28, 60, 120),
        "podium_trim": (60, 180, 180),
        "table": (80, 120, 180),
        "crystal": (80, 200, 220),
        "door_shimmer": (60, 120, 220),
        "banner": (40, 100, 200),
        "wall_accent": (100, 120, 160),
        "carpet_border": (80, 140, 220),
        "book_spine_a": (40, 80, 160),
        "book_spine_b": (60, 180, 200),
    },
    "black": {
        "filename": "club-black-bg.png",
        "floor": (48, 38, 62),
        "carpet": (68, 28, 98),
        "wall": (32, 24, 44),
        "podium_base": (20, 16, 28),
        "podium_trim": (140, 40, 200),
        "table": (60, 40, 80),
        "crystal": (180, 60, 240),
        "door_shimmer": (120, 40, 180),
        "banner": (100, 20, 160),
        "wall_accent": (80, 20, 120),
        "carpet_border": (120, 60, 160),
        "book_spine_a": (60, 20, 80),
        "book_spine_b": (140, 40, 180),
    },
    "red": {
        "filename": "club-red-bg.png",
        "floor": (88, 52, 32),
        "carpet": (160, 28, 20),
        "wall": (80, 40, 24),
        "podium_base": (60, 30, 20),
        "podium_trim": (220, 100, 20),
        "table": (120, 60, 30),
        "crystal": (255, 140, 20),
        "door_shimmer": (220, 80, 20),
        "banner": (200, 40, 20),
        "wall_accent": (160, 60, 20),
        "carpet_border": (220, 80, 40),
        "book_spine_a": (120, 40, 20),
        "book_spine_b": (200, 80, 20),
    },
    "green": {
        "filename": "club-green-bg.png",
        "floor": (62, 78, 32),
        "carpet": (38, 95, 28),
        "wall": (48, 60, 24),
        "podium_base": (80, 100, 40),
        "podium_trim": (80, 160, 40),
        "table": (60, 90, 30),
        "crystal": (120, 220, 60),
        "door_shimmer": (60, 160, 40),
        "banner": (40, 140, 30),
        "wall_accent": (60, 80, 20),
        "carpet_border": (80, 160, 60),
        "book_spine_a": (40, 80, 20),
        "book_spine_b": (80, 160, 40),
    },
}

W, H = 800, 576
TILE = 32


def darken(color, amount=20):
    """Return a slightly darkened version of color."""
    return tuple(max(0, c - amount) for c in color)


def lighten(color, amount=20):
    """Return a slightly lightened version of color."""
    return tuple(min(255, c + amount) for c in color)


def draw_floor(draw, theme):
    """Fill entire image with floor color, then draw tile grid lines."""
    floor = theme["floor"]
    draw.rectangle([0, 0, W - 1, H - 1], fill=floor)
    grid_color = darken(floor, 12)
    # Vertical lines every 32px
    for x in range(0, W + 1, TILE):
        draw.line([(x, 0), (x, H)], fill=grid_color, width=1)
    # Horizontal lines every 32px
    for y in range(0, H + 1, TILE):
        draw.line([(0, y), (W, y)], fill=grid_color, width=1)


def draw_walls(draw, theme):
    """Draw wall borders: top row, left col, right col, bottom row with texture."""
    wall = theme["wall"]
    accent = theme["wall_accent"]

    # Top wall row (y=0 to y=32)
    draw.rectangle([0, 0, W, TILE], fill=wall)
    # Left wall col (x=0 to x=32)
    draw.rectangle([0, 0, TILE, H], fill=wall)
    # Right wall col (x=768 to x=800)
    draw.rectangle([W - TILE, 0, W, H], fill=wall)
    # Bottom wall row (y=544 to y=576) - except portal gap cols 11-13 (x=352-448)
    draw.rectangle([0, H - TILE, W, H], fill=wall)
    # Portal gap in bottom wall - clear it back to floor color so door shows
    draw.rectangle([352, H - TILE, 448, H], fill=theme["floor"])

    # Texture: subtle horizontal lines on top wall
    for y in range(4, TILE, 6):
        draw.line([(0, y), (W, y)], fill=accent, width=1)

    # Texture: subtle lines on left wall
    for y in range(TILE + 4, H - TILE, 8):
        draw.line([(0, y), (TILE, y)], fill=accent, width=1)

    # Texture: subtle lines on right wall
    for y in range(TILE + 4, H - TILE, 8):
        draw.line([(W - TILE, y), (W, y)], fill=accent, width=1)


def draw_podium(draw, theme):
    """Draw podium area: rows 1-2 (y=32 to y=96), raised platform, crystal in center."""
    podium = theme["podium_base"]
    trim = theme["podium_trim"]
    crystal = theme["crystal"]

    # Raised platform full width
    podium_light = lighten(podium, 15)
    draw.rectangle([TILE, TILE, W - TILE, TILE * 3], fill=podium_light)

    # Shadow on left side to give raised look
    draw.rectangle([TILE, TILE, TILE + 4, TILE * 3], fill=darken(podium, 20))

    # Trim line at bottom of podium
    draw.rectangle([TILE, TILE * 3 - 2, W - TILE, TILE * 3], fill=trim)

    # Step edge (darker strip just below the trim inside)
    draw.rectangle([TILE, TILE, W - TILE, TILE + 3], fill=darken(podium, 25))

    # Crystal/symbol in center at x=400, y=64
    cx, cy = 400, 64
    # Outer glow
    draw.ellipse([cx - 14, cy - 14, cx + 14, cy + 14], fill=darken(crystal, 40))
    # Crystal body
    draw.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=crystal)
    # Highlight
    draw.ellipse([cx - 5, cy - 7, cx + 2, cy - 2], fill=lighten(crystal, 60))

    # Small decorative dots along trim
    for x in range(TILE + 16, W - TILE, 48):
        draw.ellipse([x - 3, TILE * 3 - 6, x + 3, TILE * 3], fill=trim)


def draw_bookshelves(draw, theme):
    """Draw bookshelves on right wall area (x=672-768, y=96-512)."""
    shelf_bg = darken(theme["wall"], 15)
    spine_a = theme["book_spine_a"]
    spine_b = theme["book_spine_b"]

    # Shelf background
    draw.rectangle([672, 96, 768, 512], fill=shelf_bg)

    # Draw shelf boards and book spines
    shelf_y_positions = list(range(96, 512, 52))
    for sy in shelf_y_positions:
        if sy + 48 > 512:
            break
        # Shelf board (horizontal strip)
        draw.rectangle([672, sy + 44, 768, sy + 48], fill=lighten(shelf_bg, 30))
        # Book spines between shelf boards
        x = 676
        toggle = True
        while x < 764:
            book_w = 8 + (4 if toggle else 0)
            color = spine_a if toggle else spine_b
            draw.rectangle([x, sy + 4, x + book_w - 1, sy + 43], fill=color)
            # Book highlight
            draw.rectangle([x, sy + 4, x + 2, sy + 43], fill=lighten(color, 30))
            x += book_w + 2
            toggle = not toggle

    # Shelf side borders
    draw.rectangle([672, 96, 676, 512], fill=darken(shelf_bg, 20))
    draw.rectangle([764, 96, 768, 512], fill=darken(shelf_bg, 20))


def draw_banners(draw, theme):
    """Draw 2-3 banners on left wall area (x=32-96, y=96-512)."""
    banner = theme["banner"]
    border = darken(banner, 40)

    banner_defs = [
        (48, 112, 80, 220),
        (48, 240, 80, 348),
        (48, 368, 80, 476),
    ]

    for bx1, by1, bx2, by2 in banner_defs:
        # Banner background
        draw.rectangle([bx1, by1, bx2, by2], fill=banner)
        # Border
        draw.rectangle([bx1, by1, bx2, by2], outline=border, width=2)
        # Inner decorative line
        draw.rectangle([bx1 + 4, by1 + 4, bx2 - 4, by2 - 4], outline=lighten(banner, 30), width=1)
        # Center symbol (simple cross)
        mx = (bx1 + bx2) // 2
        my = (by1 + by2) // 2
        draw.line([(mx, by1 + 8), (mx, by2 - 8)], fill=border, width=2)
        draw.line([(bx1 + 8, my), (bx2 - 8, my)], fill=border, width=2)
        # Corner dots
        for dx, dy in [(4, 4), (4, -4), (-4, 4), (-4, -4)]:
            draw.ellipse([mx + dx - 2, my + dy - 2, mx + dx + 2, my + dy + 2], fill=border)


def draw_carpet(draw, theme):
    """Draw duel carpet from (128,192) to (672,384) with border and corner gems."""
    carpet = theme["carpet"]
    border_c = theme["carpet_border"]
    crystal = theme["crystal"]

    # Main carpet fill
    draw.rectangle([128, 192, 672, 384], fill=carpet)

    # Border (4px)
    draw.rectangle([128, 192, 672, 384], outline=border_c, width=4)

    # Inner border line for depth
    draw.rectangle([134, 198, 666, 378], outline=lighten(carpet, 25), width=1)

    # Center decorative pattern - diamond outline
    cx, cy = 400, 288
    diamond_size = 60
    pts = [
        (cx, cy - diamond_size),
        (cx + diamond_size, cy),
        (cx, cy + diamond_size),
        (cx - diamond_size, cy),
    ]
    draw.polygon(pts, outline=border_c, fill=None)
    # Inner diamond
    s2 = diamond_size // 2
    pts2 = [
        (cx, cy - s2),
        (cx + s2, cy),
        (cx, cy + s2),
        (cx - s2, cy),
    ]
    draw.polygon(pts2, outline=lighten(carpet, 35), fill=None)

    # Corner gems at carpet corners
    gem_positions = [(128, 192), (672, 192), (128, 384), (672, 384)]
    for gx, gy in gem_positions:
        draw.ellipse([gx - 6, gy - 6, gx + 6, gy + 6], fill=darken(crystal, 20))
        draw.ellipse([gx - 4, gy - 4, gx + 4, gy + 4], fill=crystal)
        draw.ellipse([gx - 2, gy - 4, gx + 1, gy - 1], fill=lighten(crystal, 50))


def draw_tables(draw, theme):
    """Draw 4 study tables as circles at specified positions."""
    table = theme["table"]
    positions = [(160, 224), (608, 224), (160, 384), (608, 384)]

    for tx, ty in positions:
        # Shadow
        draw.ellipse([tx - 22, ty - 18, tx + 22, ty + 26], fill=darken(table, 40))
        # Table body (outer circle)
        draw.ellipse([tx - 22, ty - 22, tx + 22, ty + 22], fill=table)
        # Table top (lighter inner circle for 3D look)
        draw.ellipse([tx - 16, ty - 16, tx + 16, ty + 16], fill=lighten(table, 25))
        # Highlight
        draw.ellipse([tx - 10, ty - 14, tx, ty - 6], fill=lighten(table, 50))
        # Rim edge
        draw.ellipse([tx - 22, ty - 22, tx + 22, ty + 22], outline=darken(table, 30), width=2)


def draw_portal_door(draw, theme):
    """Draw portal door at bottom center (x=352-448, y=512-576)."""
    shimmer = theme["door_shimmer"]
    wall = theme["wall"]

    # Stone arch border - draw arch frame
    arch_x1, arch_y1, arch_x2, arch_y2 = 352, 512, 448, 576
    arch_color = darken(wall, 10)

    # Left and right stone pillars
    draw.rectangle([arch_x1, arch_y1, arch_x1 + 8, arch_y2], fill=arch_color)
    draw.rectangle([arch_x2 - 8, arch_y1, arch_x2, arch_y2], fill=arch_color)

    # Top arch keystone area
    draw.rectangle([arch_x1, arch_y1, arch_x2, arch_y1 + 10], fill=arch_color)

    # Dark interior of arch
    draw.rectangle([arch_x1 + 8, arch_y1 + 10, arch_x2 - 8, arch_y2], fill=(10, 8, 16))

    # Shimmer/glow oval inside the arch
    glow_cx = (arch_x1 + arch_x2) // 2
    glow_cy = (arch_y1 + 10 + arch_y2) // 2
    gw, gh = 28, 20
    # Outer glow
    draw.ellipse([glow_cx - gw, glow_cy - gh, glow_cx + gw, glow_cy + gh],
                 fill=darken(shimmer, 60))
    # Inner shimmer
    draw.ellipse([glow_cx - gw + 6, glow_cy - gh + 4, glow_cx + gw - 6, glow_cy + gh - 4],
                 fill=shimmer)
    # Bright center
    draw.ellipse([glow_cx - 6, glow_cy - 4, glow_cx + 6, glow_cy + 4],
                 fill=lighten(shimmer, 60))

    # Stone arch trim lines
    draw.rectangle([arch_x1, arch_y1, arch_x2, arch_y2], outline=lighten(arch_color, 20), width=1)


def draw_hud_strip(img):
    """Draw semi-transparent dark rectangle at top (0,0 to 800,32) for UI overlay."""
    # Create RGBA overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    ov_draw.rectangle([0, 0, W, TILE], fill=(0, 0, 0, 100))

    # Composite onto image
    img_rgba = img.convert("RGBA")
    result = Image.alpha_composite(img_rgba, overlay)
    return result.convert("RGB")


def generate_club(name, theme, output_dir):
    """Generate a single club background image."""
    img = Image.new("RGB", (W, H), theme["floor"])
    draw = ImageDraw.Draw(img)

    # Draw in order: back to front
    draw_floor(draw, theme)
    draw_walls(draw, theme)
    draw_podium(draw, theme)
    draw_bookshelves(draw, theme)
    draw_banners(draw, theme)
    draw_carpet(draw, theme)
    draw_tables(draw, theme)
    draw_portal_door(draw, theme)

    # HUD strip (alpha composite)
    img = draw_hud_strip(img)

    # Save
    out_path = os.path.join(output_dir, theme["filename"])
    img.save(out_path)
    print("Saved: " + out_path)


def main():
    print("Generating MTG club background images...")
    print("Output directory: " + OUTPUT_DIR)

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for name, theme in THEMES.items():
        print("Generating " + name.upper() + " club...")
        generate_club(name, theme, OUTPUT_DIR)

    print("")
    print("All 5 club backgrounds generated successfully!")

    # Verify files exist
    print("")
    print("Verifying output files:")
    all_ok = True
    for name, theme in THEMES.items():
        path = os.path.join(OUTPUT_DIR, theme["filename"])
        if os.path.exists(path):
            size = os.path.getsize(path)
            print("  OK: " + theme["filename"] + " (" + str(size) + " bytes)")
        else:
            print("  MISSING: " + theme["filename"])
            all_ok = False

    if all_ok:
        print("")
        print("All files verified!")
    else:
        print("")
        print("ERROR: Some files are missing!")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
