#!/usr/bin/env python3
"""
copy_individual_npcs.py — Processes 8 individual NPC card PNGs from Downloads:
  1. Removes the cream card background
  2. Crops out the bottom label box
  3. Saves clean transparent PNGs to public/assets/sprites/

Run: python3 scripts/copy_individual_npcs.py
"""
from PIL import Image
from collections import deque
import os

DOWNLOADS = '/mnt/c/Users/Kenny/Downloads'
DST = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'assets', 'sprites')

FILES = [
    'npc-librarian',
    'npc-red',
    'npc-white',
    'npc-blue',
    'npc-green',
    'npc-black',
    'npc-merchant',
    'npc-caretaker',
]


def get_bg_color(img):
    """Sample background from corners — the card background is consistent cream."""
    px = img.load()
    W, H = img.size
    samples = [px[4,4], px[W-5,4], px[4,H-5], px[W-5,H-5]]
    avg = tuple(sum(s[i] for s in samples) // 4 for i in range(3))
    return avg


def is_bg(r, g, b, bg, tol=45):
    return max(abs(int(r)-bg[0]), abs(int(g)-bg[1]), abs(int(b)-bg[2])) <= tol


def find_label_top(img, bg):
    """
    Scan rows from the bottom up.
    Find the last all-background row above the label box.
    The label has a top border line that's almost fully non-bg.
    We look for: a row with >40% non-bg pixels (border line), then walk up
    to find the clean gap above it.
    """
    W, H = img.size
    px = img.load()

    # Build per-row non-bg pixel count (sampled every 4px for speed)
    row_density = []
    for y in range(H):
        count = 0
        samples = 0
        for x in range(4, W-4, 4):
            r, g, b, a = px[x, y]
            if not is_bg(r, g, b, bg):
                count += 1
            samples += 1
        row_density.append(count / max(1, samples))

    # Find the label's top border: a dense horizontal row in the bottom third
    bottom_third_start = H * 2 // 3
    label_border_y = H  # default: no label found

    for y in range(H - 1, bottom_third_start, -1):
        if row_density[y] > 0.35:   # >35% non-bg = dense border line
            label_border_y = y
            break

    if label_border_y == H:
        return H  # no label found — keep full image

    # Walk UP from the border line to find the gap (all-bg rows above it)
    gap_y = label_border_y
    for y in range(label_border_y, bottom_third_start, -1):
        if row_density[y] < 0.04:   # almost all bg = gap row
            gap_y = y
            break

    return max(gap_y - 4, H // 3)   # add small buffer


def remove_background(cell, bg):
    """Flood-fill from all 4 edges to make background transparent."""
    img = cell.convert('RGBA')
    px  = img.load()
    W, H = img.size
    visited = bytearray(W * H)

    def idx(x, y): return y * W + x

    queue = deque()
    for x in range(W):
        for y in [0, H - 1]:
            if not visited[idx(x, y)]:
                r, g, b, a = px[x, y]
                if is_bg(r, g, b, bg):
                    visited[idx(x, y)] = 1
                    queue.append((x, y))
    for y in range(H):
        for x in [0, W - 1]:
            if not visited[idx(x, y)]:
                r, g, b, a = px[x, y]
                if is_bg(r, g, b, bg):
                    visited[idx(x, y)] = 1
                    queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < W and 0 <= ny < H:
                i = idx(nx, ny)
                if not visited[i]:
                    r, g, b, a = px[nx, ny]
                    if is_bg(r, g, b, bg):
                        visited[i] = 1
                        queue.append((nx, ny))
    return img


def process(name):
    src = os.path.join(DOWNLOADS, f'{name}.png')
    img = Image.open(src).convert('RGBA')
    W, H = img.size
    bg  = get_bg_color(img)

    label_top = find_label_top(img, bg)
    cropped   = img.crop((0, 0, W, label_top))
    result    = remove_background(cropped, bg)
    bbox      = result.getbbox()
    if bbox:
        result = result.crop(bbox)

    out = os.path.join(DST, f'{name}.png')
    result.save(out)
    print(f'  {name}.png  {W}×{H} → {result.size[0]}×{result.size[1]}  (label cut at y={label_top}, tight crop applied)')


os.makedirs(DST, exist_ok=True)
print('Processing NPC cards...\n')
for name in FILES:
    process(name)
print('\nDone.')
