#!/usr/bin/env python3
"""
extract_sprites.py — Slices mana_tactics_character_sprites.png into 9 individual
transparent-background PNGs and saves them to public/assets/sprites/.

Grid: 5 columns × 2 rows
  Row 0: player | chronicler | archivist | tactician | ironclad (SKIPPED)
  Row 1: fire-st | water-st  | earth-st  | wind-st   | shadow-st

Run: python3 scripts/extract_sprites.py
"""
from PIL import Image
from collections import deque
import os

SRC = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                   '..', 'Downloads', 'mana_tactics_character_sprites.png')
DST = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                   'public', 'assets', 'sprites')

SRC = os.path.normpath(SRC)

# (row, col) → output sprite name  (None = skip)
GRID = {
    (0, 0): 'player',
    (0, 1): 'npc-chronicler',
    (0, 2): 'npc-archivist',
    (0, 3): 'npc-tactician',
    (0, 4): None,          # ironclad — Kenny's personal admin sprite, do not overwrite
    (1, 0): 'npc-fire-student',
    (1, 1): 'npc-water-student',
    (1, 2): 'npc-earth-student',
    (1, 3): 'npc-wind-student',
    (1, 4): 'npc-shadow-student',
}

BG = (254, 248, 238)   # cream background colour sampled from sheet corners
TOLERANCE   = 40       # how close a pixel must be to BG to count as background
LABEL_TRIM  = 130      # pixels to cut from bottom of each cell (removes text label)


def is_bg(r, g, b):
    return max(abs(int(r)-BG[0]), abs(int(g)-BG[1]), abs(int(b)-BG[2])) <= TOLERANCE


def remove_background(cell):
    """Flood-fill from every edge pixel outward, turning cream → transparent."""
    img = cell.convert('RGBA')
    px  = img.load()
    W, H = img.size

    visited = bytearray(W * H)   # flat bool array, faster than a set

    def idx(x, y): return y * W + x

    queue = deque()

    # Seed queue from all 4 edges
    for x in range(W):
        for y in [0, H - 1]:
            r, g, b, a = px[x, y]
            if not visited[idx(x, y)] and is_bg(r, g, b):
                visited[idx(x, y)] = 1
                queue.append((x, y))
    for y in range(H):
        for x in [0, W - 1]:
            r, g, b, a = px[x, y]
            if not visited[idx(x, y)] and is_bg(r, g, b):
                visited[idx(x, y)] = 1
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x-1, y), (x+1, y), (x, y-1), (x, y+1)):
            if 0 <= nx < W and 0 <= ny < H:
                i = idx(nx, ny)
                if not visited[i]:
                    r, g, b, a = px[nx, ny]
                    if is_bg(r, g, b):
                        visited[i] = 1
                        queue.append((nx, ny))

    return img


def main():
    print(f'Opening: {SRC}')
    sheet = Image.open(SRC).convert('RGBA')
    W, H  = sheet.size
    CW    = W // 5
    CH    = H // 2
    print(f'Sheet {W}×{H}  →  cells {CW}×{CH}  (label trim: {LABEL_TRIM}px)\n')

    os.makedirs(DST, exist_ok=True)

    for (row, col), name in sorted(GRID.items()):
        if name is None:
            print(f'  [{row},{col}] SKIP (ironclad — protected sprite)')
            continue

        x0 = col * CW
        y0 = row * CH
        x1 = x0 + CW
        y1 = y0 + CH - LABEL_TRIM      # cut label text from bottom

        cell   = sheet.crop((x0, y0, x1, y1))
        result = remove_background(cell)
        bbox   = result.getbbox()
        if bbox:
            result = result.crop(bbox)

        out = os.path.join(DST, f'{name}.png')
        result.save(out)
        print(f'  [{row},{col}] saved  {name}.png  ({result.size[0]}×{result.size[1]})')

    print('\nDone. Drop the file in the sprites folder and run npm run dev.')


main()
