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
- Tables: `users`, `cards` (320 Scryfall cards, read-only), `decks`, `deck_cards`, `player_profiles`, `shop_listings`, `purchases`
- RLS: users can only see/edit their own decks, profiles, and purchases
- `deck_cards.quantity` constraint: `>= 1` (no upper limit — basic lands are unlimited)
- Schema file: `supabase/schema.sql` — run in Supabase SQL editor to deploy

## Phaser Scene Flow
```
BootScene → TitleScene → StarterPickScene (first time only) → HubScene
HubScene ↔ WorldMapScene ↔ ClubScenes (white/blue/black/red/green)
ClubScene → battle → BattleScreen (React overlay, zIndex 200)
HubScene → shop booth → ShopOverlay (React overlay, zIndex 200)
```
- `localStorage('mt_starter')` — tracks whether starter deck was picked
- `localStorage('mt_gold')` / `localStorage('mt_seals')` — offline cache only; source of truth is Supabase `player_profiles`
- Phaser → React bridges: `game.events.emit('battleStart', npcData)`, `game.events.emit('starterPicked', data)`, `game.events.emit('shopOpen')`
- WorldMapScene: White region always open; each subsequent region requires the previous color's seal (blue needs white, black needs blue, etc.)

## Key Files
```
src/game/scenes/TitleScene.js       — title screen (stars, nebula, color orbs, press any key)
src/game/scenes/StarterPickScene.js — 5-color deck picker, Librarian Mira dialog
src/game/scenes/HubScene.js         — overworld hub; 3 NPCs have movement tweens; shop booth zone (cols 19-22) triggers shopOpen on E; portal to WorldMap
src/game/scenes/WorldMapScene.js    — pixel art overworld; 5 region markers; seal gating (showLockMessage); lock badge on locked regions
src/game/scenes/ClubScene.js        — per-color club interiors; members have movement tweens (patrol/shift/bob by index); archmage stationary
src/game/scenes/BootScene.js        — asset preload → starts TitleScene
src/game/systems/CardEngine.js      — MTG rules engine (mana, creatures, spells, combat)
src/game/systems/AIOpponent.js      — AI turn logic (play land → removal → creatures → attack)
src/game/data/aiDecks.js            — hardcoded NPC deck definitions
src/game/BattleScreen.jsx           — full battle UI; retreat sends hpDamage:1 to GamePage
src/game/ShopOverlay.jsx            — booster pack shop UI; card flip reveal animation; logs to purchases table
src/game/PhaserGame.jsx             — mounts Phaser instance; bridges battleStart/starterPicked/shopOpen events to React
src/pages/Home.jsx                  — deck builder; imports FRAME/artUrl from cardUtils
src/pages/GamePage.jsx              — loads deck + progress from Supabase; handles battle/shop/starter events
src/lib/cardUtils.js                — shared FRAME palette + artUrl() — imported by Home.jsx and ShopOverlay.jsx
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
- `hub-bg.png` — warm golden-brown stone floor (`#C4A265`), 5 club banners on north wall, 5-color Crystal Nexus (all mana colors), card shop booth right side (cols 19-22, rows 2-5), librarian counter, bookshelves, decorative pillars, portal door
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

## Progression System (2026-06-24)
- `player_profiles` Supabase table: `gold`, `hp` (default 10), `seals` (jsonb array of color strings)
- `GamePage.jsx` loads profile on mount via `fetchProgress()`, upserts via `saveProgress(gold, hp, seals)`
- localStorage keeps a fast-load cache but Supabase is source of truth
- **Win battle**: gold += reward, seal added for that color (if not already owned)
- **Retreat/lose**: hp -= 1 (floors at 1) — sent as `hpDamage:1` from BattleScreen `onRetreat`
- HP and gold display in HubScene/ClubScene stats bar via Phaser registry sync (PhaserGame.jsx lines 50-57)

## Shop System (2026-06-24)
- Card shop booth in hub background (right side, cols 19-22, rows 2-5 = pixel 608-704, 64-192)
- `shopBounds = new Phaser.Geom.Rectangle(600, 185, 112, 45)` — interaction zone in front of counter
- Walk to booth → `[E] Shop` prompt → press E → `game.events.emit('shopOpen')` → `ShopOverlay` renders
- Booster Pack: 50 gold, 5 random cards (random offset from 320-card table)
- Card flip reveal animation: cards start face-down (`rotateY(180deg)`), flip one per 550ms
- Purchase logged to `purchases` Supabase table; gold deducted and saved immediately
- `shop_listings` table has one row: "Booster Pack" at 50 gold

## Seal Gating (2026-06-24)
- Gate order: White (free) → Blue (needs white) → Black (needs blue) → Red (needs black) → Green (needs red)
- Locked regions show 🔒 badge on WorldMapScene marker
- Clicking locked region: `showLockMessage(neededColor)` — 2.2s timed overlay, "Earn the WHITE seal first!"
- Re-checks registry live so unlocks immediately after winning

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
- Error sanitization: `{}` Supabase responses shown as "Registration failed. Please try again."
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
- **Deck panel interactions**: hover = tooltip (same as main grid); click thumbnail = add copy (up to ×3 for non-lands); click ×qty badge = remove copy
- **Land copy limit**: basic lands have no per-card copy limit in deck — only 30-card deck total applies. Non-lands still capped at ×3.
- `FRAME` and `artUrl` extracted to `src/lib/cardUtils.js` — import from there, not redefined locally

## Known Bugs Fixed
- `getManaCost` now returns minimum 1 for non-land cards with null/empty mana_cost (was returning 0, making creatures free)
- BattleScreen now shows mana cost hint when selecting cards and tooltip on disabled buttons
- `portalBounds` was never set after `drawPortalDoor()` was removed — portal to WorldMap was broken; fixed by inlining `new Phaser.Geom.Rectangle(360, 518, 80, 30)` at end of `drawMap()`
- Deck panel cards had no tooltip and no way to increment quantity — fixed: hover shows tooltip, click card increments, click ×qty badge decrements
- `deck_cards.quantity` DB constraint was `BETWEEN 1 AND 3` — blocked land quantities > 3; changed to `>= 1`
- Register page showed raw `{}` Supabase error — sanitized to "Registration failed. Please try again."

## Pending Work (priority order)
1. **Additional academy rooms** — Hub is one room inside the academy; mini-map shows passage left (upward) and bottom exit (World Map). Future rooms follow the same pattern: `gen_*.py` → PNG background, new `*Scene.js` mirroring HubScene structure. Plug-and-play.
2. **Ironclad wolf knight player sprite** — create fresh in Python/Pillow, NOT from CelestialShaman
3. **Battle system improvements**
   - Card play animations
   - Win/lose state improvements (death state when HP hits 0, recovery mechanic)
   - Better AI difficulty scaling per club/region
4. **Progression persistence improvements** — seals/gold/HP now in Supabase; next: HP recovery mechanic, gold spending beyond shop packs
5. **Sound/music** — chiptune BGM per region, battle theme, SFX

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
