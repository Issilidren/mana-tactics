# tileset_manifest.py
# Single source of truth for all tile positions in academy-tileset-v1.png.
# To add a tile: one dict entry here, then: python3 scripts/extract_tiles.py
#
# 'type' controls IsoEngine placement:
#   'floor' — tight 2:1 diamond; setDisplaySize(tw, th), origin (0.5, 0.5), depth -1
#   'tall'  — full-height prop;  setDisplaySize(tw, auto), origin (0.5, 1), depth-sorted
#
# Tileset: 1024×1024 RGB, background rgb(233,233,234)
# Row 1 floors : y=0..210   (diamond content y=87..170 — tight crop at y=87, h=84)
# Row 2 walls  : y=255..504 (full height crops from y=255)
# Row 3 props  : y=540..775 (full height crops from y=540)
# Row 4 large  : y=780..969 (full height crops from y=780)

TILESET_SRC = r'C:\Users\Kenny\Downloads\academy-tileset-v1.png'
BG_COLOR    = (233, 233, 234)
BG_THRESH   = 55  # 55 removes the near-white tile-edge outlines that cause bright seams at tile boundaries

TILES = {
    # ── Row 1: floor tiles (tight diamond, y=87 h=84) ───────────────────────
    # Each tile is ~168px wide; content identified by color at y=130.
    # x positions confirmed: stone (visual), grass (visual), carpet (scan).
    # wood/water/cobble are scan-derived — re-extract with --force if misaligned.
    'tile-stone-floor':     { 'x':   0, 'y': 87, 'w': 168, 'h': 84,  'type': 'floor' },  # gray cracked
    'tile-wood-floor':      { 'x': 181, 'y': 87, 'w': 168, 'h': 84,  'type': 'floor' },  # warm brown planks
    'tile-grass-floor':     { 'x': 366, 'y': 87, 'w': 167, 'h': 84,  'type': 'floor' },  # green
    'tile-water-floor':     { 'x': 523, 'y': 87, 'w': 168, 'h': 84,  'type': 'floor' },  # blue
    'tile-carpet-floor':    { 'x': 686, 'y': 87, 'w': 168, 'h': 84,  'type': 'floor' },  # red/gold
    'tile-cobble-floor':    { 'x': 840, 'y': 87, 'w': 168, 'h': 84,  'type': 'floor' },  # dark gray

    # ── Row 2: walls and doors (y=255, h=250) ───────────────────────────────
    'tile-banner-wall':     { 'x':  46, 'y': 255, 'w': 185, 'h': 250, 'type': 'tall' },  # heraldic banner
    'tile-wall-hub':        { 'x': 235, 'y': 255, 'w': 168, 'h': 250, 'type': 'tall' },  # plain stone brick
    'tile-bookshelf-hub':   { 'x': 408, 'y': 255, 'w': 200, 'h': 250, 'type': 'tall' },  # FFTA bookshelf
    'tile-window-hub':      { 'x': 629, 'y': 255, 'w': 128, 'h': 250, 'type': 'tall' },  # arched stained glass
    'tile-door-hub':        { 'x': 799, 'y': 255, 'w': 133, 'h': 250, 'type': 'tall' },  # wooden arch door

    # ── Row 3: props (y=540, h=236) ─────────────────────────────────────────
    'tile-desk-hub':        { 'x':  43, 'y': 540, 'w': 204, 'h': 236, 'type': 'tall' },  # study desk w/ books
    'tile-chair-hub':       { 'x': 262, 'y': 540, 'w':  96, 'h': 236, 'type': 'tall' },  # chair
    'tile-fountain-hub':    { 'x': 377, 'y': 540, 'w': 309, 'h': 236, 'type': 'tall' },  # stone fountain
    'tile-crystal-hub':     { 'x': 733, 'y': 540, 'w':  94, 'h': 236, 'type': 'tall' },  # glowing crystal
    'tile-lantern-hub':     { 'x': 874, 'y': 540, 'w':  80, 'h': 236, 'type': 'tall' },  # hanging lantern

    # ── Row 4: large props (y=780, h=190) ────────────────────────────────────
    'tile-stairs-hub':      { 'x':  57, 'y': 780, 'w': 213, 'h': 190, 'type': 'tall' },  # 3-step stairs
    'tile-platform-hub':    { 'x': 299, 'y': 780, 'w': 221, 'h': 190, 'type': 'tall' },  # stone platform
    'tile-column-hub':      { 'x': 562, 'y': 780, 'w':  93, 'h': 190, 'type': 'tall' },  # pillar/column
    'tile-balustrade-hub':  { 'x': 715, 'y': 780, 'w': 240, 'h': 190, 'type': 'tall' },  # gold railing
}
