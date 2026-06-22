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
src/game/scenes/HubScene.js         — overworld hub, player + NPCs
src/game/scenes/WorldMapScene.js    — parchment map with terrain + compass rose
src/game/scenes/ClubScene.js        — per-color club interiors
src/game/scenes/BootScene.js        — asset preload → starts TitleScene
src/game/systems/CardEngine.js      — MTG rules engine (mana, creatures, spells, combat)
src/game/systems/AIOpponent.js      — AI turn logic (play land → removal → creatures → attack)
src/game/data/aiDecks.js            — hardcoded NPC deck definitions
src/game/BattleScreen.jsx           — full battle UI (PTCG GBC card style)
src/game/PhaserGame.jsx             — mounts Phaser instance, bridges events to React
src/pages/GamePage.jsx              — loads deck from Supabase, handles starterPicked
```

## Asset Pipeline
- Sprites/tiles are PNG files in `public/assets/`
- Regenerate with: `python3 scripts/generate_assets.py`
- Style target: FFTA GBA pixel art — warm tan cobblestone, chibi sprites at 0.65 scale
- Sprites are 24×32, tiles are 32×32
- **CRITICAL**: Do NOT use or copy assets from `C:\Users\Kenny\Downloads\CelestialShaman_v8_PATCHED\` — that is a completely separate project and is off limits

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

## Known Bugs Fixed (this session)
- `getManaCost` now returns minimum 1 for non-land cards with null/empty mana_cost (was returning 0, making creatures free)
- BattleScreen now shows mana cost hint when selecting cards and tooltip on disabled buttons

## Pending Work (priority order)
1. **Visual polish** — isometric view is a major arch change; smaller wins first:
   - Ironclad wolf knight player sprite (create fresh in Python/Pillow, NOT from CelestialShaman)
   - NPC seated poses, dialog portrait on LEFT side
2. **Battle system improvements**
   - Card play animations
   - Win/lose state improvements
   - Better AI difficulty scaling per club/region
3. **Booster pack shop** — buy packs with gold, open animation
4. **Progression persistence** — seals/gold/HP beyond localStorage → Supabase
5. **Sound/music** — chiptune BGM per region, battle theme, SFX
6. **ComfyUI image gen** — generate real card art and backgrounds
   - ComfyUI installed at: `C:\Users\Kenny\Downloads\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable\`
   - Model: `flux1-schnell.safetensors` (fp8) in `ComfyUI\models\checkpoints\`
   - MCP server: `comfyui-mcp` added to local config, connects to `localhost:8188`
   - Puppeteer MCP also installed for UI screenshots

## MCPs Installed (this project)
- `puppeteer` — screenshot the running app for visual feedback
- `comfyui-mcp` — generate images when ComfyUI is running at localhost:8188

## Visual Style Reference
- FFTA GBA — warm tan cobblestone floors, blue-slate roof caps, gold trim
- Background color: `0xB0986A` (warm tan, not blue-gray)
- Night/space: `0x080510`
- Card style: PTCG GBC — pixel font, hard borders, color-coded frames per MTG color
- World map: parchment `0xC8A870`, teal ocean, ink border, terrain symbols, compass rose

## Full Game Schema (reference)
14 tables total — split into two DrawSQL files for the 11-table limit:
- `supabase/drawsql-part1.sql` — users, player_profiles, cards, decks, deck_cards, regions, clubs
- `supabase/drawsql-part2.sql` — npcs, npc_decks, player_seals, battles, battle_events, shop_listings, purchases
