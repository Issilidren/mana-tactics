"""
Slice mana_tactics_card_art.png (1024x1024, 4 cols x 4 rows)
into individual card art PNGs for use in BattleScreen / ShopOverlay.
"""
import os
from PIL import Image

BASE  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC   = os.path.join(os.path.dirname(BASE), 'Downloads', 'mana_tactics_card_art.png')
DEST  = os.path.join(BASE, 'public', 'assets', 'card-art')

COLS, ROWS = 4, 4
NAMES = [
    # Row 0
    'island', 'mountain', 'forest', 'swamp',
    # Row 1
    'plains', 'brainstorm', 'ponder', 'dark-ritual',
    # Row 2
    'viscera-seer', 'gitaxian-probe', 'vampiric-tutor', 'reanimate',
    # Row 3
    'entomb', 'village-rites', 'consider', 'mystical-tutor',
]

sheet = Image.open(SRC).convert('RGBA')
W, H  = sheet.size
cw    = W // COLS
ch    = H // ROWS

os.makedirs(DEST, exist_ok=True)

for idx, name in enumerate(NAMES):
    row = idx // COLS
    col = idx  % COLS
    x0, y0 = col * cw, row * ch
    art  = sheet.crop((x0, y0, x0 + cw, y0 + ch))
    out  = os.path.join(DEST, f'{name}.png')
    art.save(out)
    print(f'  saved {name}.png  ({cw}x{ch})')

print(f'\nDone — {len(NAMES)} card art images written to {DEST}')
