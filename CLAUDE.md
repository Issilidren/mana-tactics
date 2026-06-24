# Mana Tactics — Claude Code Project Guide

## What This Project Is
MTG x Final Fantasy Tactics deck builder + Phaser RPG. Two layers:
- **Web app** (school project, done): Vite + React + Supabase deck builder, 320 Scryfall cards
- **Full game** (next phase): Phaser.js RPG with hub world, clubs, battles, progression

## Git Workflow
- **Always work on `dev` branch** — never commit directly to `main`
- `main` = stable snapshots only, merged from dev via PR
- Remote: `github.com/Issilidren/mana-tactics`

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | Vite + React 18 |
| Auth + DB | Supabase (REST via Axios) |
| Game engine | Phaser 3.87.0 (embedded in React via `PhaserGame.jsx`) |
| Pixel assets | Python 3 + Pillow (`scripts/generate_assets.py`) |
| Card rules | Pure JS (`src/game/systems/CardEngine.js`) |

## Supabase
- URL + anon key are in `.env` (gitignored — never commit)
- Tables: `users`, `cards` (320 Scryfall cards, read-only), `decks`, `deck_cards`
- RLS: users can only see/edit their own decks

## Phaser Scene Flow
```
BootScene → TitleScene → StarterPickScene (first time only) → HubScene
HubScene ↔ WorldMapScene ↔ ClubScenes (white/blue/black/red/green)
ClubScene → battle → BattleScreen (React overlay, zIndex 200)
```
- `localStorage('mt_starter')` — tracks whether starter deck was picked
- `localStorage('mt_gold')` and `localStorage('mt_seals')` — progression
- Phaser → React bridge: `game.events.emit('battleStart', npcData)` and `game.events.emit('starterPicked', data)`

## Key Files
```
src/game/scenes/TitleScene.js       — title screen (stars, nebula, color orbs, press any key)
src/game/scenes/StarterPickScene.js — 5-color deck picker, Librarian Mira dialog
src/game/scenes/HubScene.js         — overworld hub, player + NPCs; warm living world; mini-map HUD top-right; 3 NPCs have movement tweens; portal to WorldMap fixed
src/game/scenes/WorldMapScene.js    — full pixel art RPG overworld map (worldmap-bg.png); 5 region markers
src/game/scenes/ClubScene.js        — per-color club interiors; uses club-*-bg.png backgrounds
src/game/scenes/BootScene.js        — asset preload → starts TitleScene; preloads all *-bg.png images
src/game/systems/CardEngine.js      — MTG rules engine (mana, creatures, spells, combat)
src/game/systems/AIOpponent.js      — AI turn logic (play land → removal → creatures → attack)
src/game/data/aiDecks.js            — hardcoded NPC deck definitions
src/game/BattleScreen.jsx           — full battle UI (PTCG GBC card style)
src/game/PhaserGame.jsx             — mounts Phaser instance, bridges events to React
src/pages/Home.jsx                  — deck builder; premium full-art card grid, art_crop Scryfall images
src/pages/GamePage.jsx              — loads deck from Supabase, handles starterPicked
```

## Asset Pipeline
- Sprites/tiles are PNG files in `public/assets/`
- Regenerate sprites: `python3 scripts/generate_assets.py`
- Regenerate world map: `python scripts/gen_worldmap.py` → `public/assets/worldmap-bg.png`
- Regenerate hub interior: `python scripts/gen_hub.py` → `public/assets/hub-bg.png`
- Regenerate club interiors: `python scripts/gen_clubs.py` → `public/assets/club-{color}-bg.png` (×5)
- Style target: FFTA GBA pixel art — warm tan cobblestone, chibi sprites at 0.65 scale
- Sprites are 24×32, tiles are 32×32
- **CRITICAL**: Do NOT use or copy assets from `C:\Users\Kenny\Downloads\CelestialShaman_v8_PATCHED\` — that is a completely separate project and is off limits

## Background Image System
All scene backgrounds are pre-generated PNG files loaded via BootScene.js preload():
- `worldmap-bg.png` — sky, mountains, 5 terrain zones, buildings, paths, Crystal Nexus
- `hub-bg.png` — warm golden-brown stone floor (`#C4A265`), 5 club banners on north wall, 5-color Crystal Nexus (all mana colors), card shop booth right side, librarian counter, bookshelves, decorative pillars, portal door
- `club-white-bg.png` — cream/gold warm stone (Solara Plains)
- `club-blue-bg.png` — cool blue, navy carpet (Tidefall Isles)
- `club-black-bg.png` — dark purple-grey, glowing cracks (Shadowmere Bog)
- `club-red-bg.png` — volcanic lava seams, crimson (Embercrest Peaks)
- `club-green-bg.png` — wood planks, moss carpet (Thornveil Woods)

In Phaser scenes: `this.add.image(0, 0, 'key').setOrigin(0, 0).setDepth(0)` renders the background.
Physics wall groups (ClubScene `this.wallGroup`) are kept as invisible colliders — do NOT delete them.

## Card Data Format
`mana_cost` is stored as JSONB: `{"white": 2, "colorless": 3}`  
When fetched via API it arrives as a JS object — `getManaCost()` sums all values.

## CardEngine Rules (Simplified MTG)
- Each player starts with 10 life
- 1 land per turn, lands give 1 mana each
- `startTurn(who)` — untaps all, sets `availableMana = lands.length`, draws 1 card
- `playLand(who, idx)` — plays land from hand, `availableMana += 1`
- `castCreature(who, idx)` — checks `availableMana >= cost`, taps lands, sets `summoningSick: true`
- `castSpell(who, idx, targetIdx, targetType)` — parses effect from description or abilities
- Abilities: flying, vigilance, trample, haste, first_strike, lifelink, deathtouch

## UI — Login Screen (LOCKED 2026-06-23)
- Background: `public/assets/login-bg.png` — the pixel art mockup (`mana_tactics_login_screen.png`)
- `backgroundSize: '100% 100%'` — do NOT change to `cover`, it breaks % positioning
- Input box masks the drawn "PLAYER NAME" text: `position:absolute, left:44%, top:39.5%, width:22.5%, height:12.5%`
- Box fill: `rgb(11,17,33)` — matches the mockup panel color
- Two inputs (email + password), no labels, placeholder text only
- CONTINUE hit-area: `position:fixed, left:30%, top:56%, width:41%, height:8%` — transparent, submits form
- NEW GAME hit-area: `position:absolute, left:30%, top:64.5%, width:41%, height:7.5%` — Link to /register
- All Login.jsx changes must be written via `C:\Users\Kenny\write_login.py` run through PowerShell
  (WSL file writes don't trigger Vite's Windows watcher)

## UI — Register Screen (LOCKED 2026-06-23)
- Same `login-bg.png` full-screen background as login
- Centered floating panel: `rgb(11,17,33)` bg, `2px solid #D4AF37` border, `clamp(280px,30vw,400px)` wide
- Title "CREATE ACCOUNT" in Cinzel font, gold, uppercase
- Three inputs: Email, Password, Confirm Password — same style as login inputs
- Gold REGISTER button (`#D4AF37` bg, dark text, Cinzel font)
- Success state: "Enrollment Sent" with confirmation message, same background
- Written via `C:\Users\Kenny\write_register.py` run through PowerShell

## UI — Fonts
- Cinzel (Google Fonts, loaded in `index.html`) — used for titles and buttons
- Courier New monospace — used for all body/input text, labels, error messages

## UI — Shared Input Style
- Background: `rgba(6,12,24,0.9)`
- Border: `1px solid rgba(90,120,160,0.5)` at rest, `1px solid #D4AF37` on focus
- Gold caret, cream text `rgba(240,238,216,0.95)`
- Autofill override: `WebkitBoxShadow: '0 0 0 1000px rgb(11,17,33) inset'`
- Global CSS class `.game-input::placeholder` — muted blue-cream italic

## UI — Windows Python Write Pattern
All source file edits go through Windows Python to trigger Vite's watcher:
```
powershell.exe -Command "python 'C:\Users\Kenny\write_login.py'"
```
Scripts live at `C:\Users\Kenny\write_*.py`

## ComfyUI / Image Gen
- Installed at: `C:\Users\Kenny\Downloads\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\`
- Model: `flux1-schnell-fp8.safetensors` in `ComfyUI\models\checkpoints\`
- LoRAs downloaded: `Retro-Pixel.safetensors`, `pktrainer_F1-v1-0.safetensors` in `models\loras\`
- ComfyUI API only reachable from Windows Python via PowerShell (WSL curl can't hit Windows localhost)
- MCP server: `comfyui-mcp` connects to `localhost:8188`

## Deck Builder (Home.jsx) — 5-Panel Layout (2026-06-24)
- **Outer frame**: warm dark wood `#3B2A1A`, gold corner rivets, gold border `#C8961E`
- **MY DECKS bar**: horizontal strip at top — deck slots with color thumbnail, name, description, VIEW/EDIT + DELETE buttons, `+ NEW DECK` with sparkle icons
- **Left column**: `PortraitPanel` (CSS chibi tactician + Ironclad wolf at desk, contextual speech bubble) + `CollectiblesPanel` (4 world item icons)
- **Sort column**: `SortByPanel` — sort cards by health/mana/name/color
- **Center**: ALL CARDS grid — full-bleed `art_crop` Scryfall images, 4-col auto-fill, mana badge top-left, qty badge top-right, Cinzel name, ATK/DEF circles
- **Filters column**: `FiltersPanel` — 5 colored element buttons (☀💧💀🔥🍃) + creature/spell/land type toggles
- **Right column**: CURRENT DECK — mini card thumbnails grouped by CREATURES / SPELLS; VALIDATE DECK button (green at 30 cards, gold pulse animation `goldPulse` at exactly 30)
- Deck size: **30 cards** (changed from 40)
- Speech bubble states: "Choose your arsenal!" → "Needs more cards!" → "Ready for battle!"
- Tooltip: art_crop image + colored ATK/DEF circles + glow border — unchanged

## Known Bugs Fixed
- `getManaCost` now returns minimum 1 for non-land cards with null/empty mana_cost (was returning 0, making creatures free)
- BattleScreen now shows mana cost hint when selecting cards and tooltip on disabled buttons
- `portalBounds` was never set after `drawPortalDoor()` was removed — portal to WorldMap was broken; fixed by inlining `new Phaser.Geom.Rectangle(360, 518, 80, 30)` at end of `drawMap()`

## Pending Work (priority order)
1. **Additional academy rooms** — Hub is one room inside the academy; mini-map shows passage left (upward) and bottom exit (World Map). Future rooms follow the same pattern: `gen_*.py` → PNG background, new `*Scene.js` mirroring HubScene structure. Plug-and-play.
2. **Ironclad wolf knight player sprite** — create fresh in Python/Pillow, NOT from CelestialShaman
3. **Battle system improvements**
   - Card play animations
   - Win/lose state improvements
   - Better AI difficulty scaling per club/region
4. **Booster pack shop** — buy packs with gold, open animation
5. **Progression persistence** — seals/gold/HP beyond localStorage → Supabase
6. **Sound/music** — chiptune BGM per region, battle theme, SFX

## MCPs Installed (this project)
- `puppeteer` — screenshot the running app for visual feedback
- `comfyui-mcp` — generate images when ComfyUI is running at localhost:8188

## Visual Style Reference
- FFTA GBA — warm tan cobblestone floors, blue-slate roof caps, gold trim
- Background color: `0xB0986A` (warm tan, not blue-gray)
- Night/space: `0x080510`
- Card style: full-bleed art_crop with color glow borders, Cinzel name text, ATK/DEF circles
- World map: full pixel art RPG overworld — sky, mountains, 5 terrain zones, landmark buildings
- Club interiors: themed isometric-style rooms per color, baked into PNG backgrounds
- Deck builder: `login-bg.png` page background with warm wood `#3B2A1A` outer frame + gold rivets overlay

## Full Game Schema (reference)
14 tables total — split into two DrawSQL files for the 11-table limit:
- `supabase/drawsql-part1.sql` — users, player_profiles, cards, decks, deck_cards, regions, clubs
- `supabase/drawsql-part2.sql` — npcs, npc_decks, player_seals, battles, battle_events, shop_listings, purchases
