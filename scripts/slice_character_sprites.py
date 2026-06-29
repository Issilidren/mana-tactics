"""
Slice mana_tactics_character_sprites.png (1024x768, 5 cols x 2 rows)
into individual PNG files for use in the game.
"""
import os
from PIL import Image

BASE       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC        = os.path.join(os.path.dirname(BASE), 'Downloads', 'mana_tactics_character_sprites.png')
DEST       = os.path.join(BASE, 'public', 'assets', 'sprites')

COLS, ROWS = 5, 2
NAMES = [
    # Row 0 (top)
    'player',
    'npc-chronicler',
    'npc-archivist',
    'npc-tactician',
    'npc-ironclad',
    # Row 1 (bottom)
    'npc-fire-student',
    'npc-water-student',
    'npc-earth-student',
    'npc-wind-student',
    'npc-shadow-student',
]

sheet = Image.open(SRC).convert('RGBA')
W, H  = sheet.size
cw    = W // COLS  # cell width
ch    = H // ROWS  # cell height

os.makedirs(DEST, exist_ok=True)

for idx, name in enumerate(NAMES):
    row = idx // COLS
    col = idx  % COLS
    x0, y0 = col * cw, row * ch
    sprite  = sheet.crop((x0, y0, x0 + cw, y0 + ch))
    out     = os.path.join(DEST, f'{name}.png')
    sprite.save(out)
    print(f'  saved {name}.png  ({cw}x{ch})')

print(f'\nDone — {len(NAMES)} sprites written to {DEST}')
