"""
extract_tiles.py — Extract all tiles from academy-tileset-v1.png into individual PNGs.

Usage:
    python3 scripts/extract_tiles.py           # skip files that already exist
    python3 scripts/extract_tiles.py --force   # re-extract everything

Each tile is flood-filled from all 4 edges to remove the background color,
then saved as RGBA PNG. Output goes to public/assets/tiles/.

To add a new tile: add one entry to scripts/tileset_manifest.py, then re-run.
"""

import sys
import os
from collections import deque
from PIL import Image

# Resolve paths relative to this script so it works from any cwd
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)

# Import manifest from the same scripts/ directory
sys.path.insert(0, SCRIPT_DIR)
from tileset_manifest import TILESET_SRC, BG_COLOR, BG_THRESH, TILES

OUTPUT_DIR = os.path.join(ROOT_DIR, 'public', 'assets', 'tiles')
FORCE      = '--force' in sys.argv


def flood_fill_bg(img_rgba, bg=BG_COLOR, thresh=BG_THRESH):
    """BFS flood-fill from all 4 edges; make background pixels transparent."""
    w, h   = img_rgba.size
    pixels = img_rgba.load()
    visited = bytearray(w * h)  # flat bool array, faster than list-of-lists

    def enqueue_if_bg(queue, x, y):
        idx = y * w + x
        if not visited[idx]:
            r, g, b, a = pixels[x, y]
            if abs(r-bg[0]) + abs(g-bg[1]) + abs(b-bg[2]) <= thresh:
                visited[idx] = 1
                queue.append((x, y))

    queue = deque()
    for x in range(w):
        enqueue_if_bg(queue, x, 0)
        enqueue_if_bg(queue, x, h - 1)
    for y in range(h):
        enqueue_if_bg(queue, 0, y)
        enqueue_if_bg(queue, w - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
            if 0 <= nx < w and 0 <= ny < h:
                enqueue_if_bg(queue, nx, ny)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Normalise Windows-style path so Pillow can open it from WSL
    src_path = TILESET_SRC.replace('\\', '/')
    if src_path.startswith('C:/'):
        src_path = '/mnt/c/' + src_path[3:]

    if not os.path.exists(src_path):
        print(f'ERROR: tileset not found at {src_path}')
        print('  Update TILESET_SRC in scripts/tileset_manifest.py')
        sys.exit(1)

    src = Image.open(src_path).convert('RGB')
    skipped = extracted = 0

    for name, tile in TILES.items():
        out_path = os.path.join(OUTPUT_DIR, name + '.png')

        if os.path.exists(out_path) and not FORCE:
            print(f'  skip   {name}.png')
            skipped += 1
            continue

        x, y, w, h = tile['x'], tile['y'], tile['w'], tile['h']
        crop = src.crop((x, y, x + w, y + h))
        rgba = crop.convert('RGBA')
        flood_fill_bg(rgba)
        rgba.save(out_path)

        px = list(rgba.getdata())
        opaque = sum(1 for p in px if p[3] > 0)
        print(f'  wrote  {name}.png  ({w}×{h}, opaque={opaque:,}, {tile["type"]})')
        extracted += 1

    print(f'\nDone — {extracted} extracted, {skipped} skipped.')
    if skipped and not FORCE:
        print('  Run with --force to re-extract skipped files.')


if __name__ == '__main__':
    main()
