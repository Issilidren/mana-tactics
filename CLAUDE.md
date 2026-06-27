# Mana Tactics — Claude Code Project Guide

## What This Project Is
MTG x Final Fantasy Tactics deck builder + Phaser RPG. Two layers:
- **Web app** (school project, done): Vite + React + Supabase deck builder, 320 Scryfall cards
- **Full game** (next phase): Phaser.js RPG with hub world, clubs, battles, progression

## Git Workflow
- **Always work on `dev` branch** — never commit directly to `main`
- `main` = stable snapshots only, merged from dev via PR
- Remote: `github.com/Issilidren/mana-tactics`

## npm / WSL Split — IMPORTANT
Running `npm install` from Windows and WSL installs different native Rollup binaries — they conflict.
- **Windows Command Prompt**: run `npm install` to get Windows binaries → enables `npm run dev` (Vite watcher)
- **WSL**: run `npm install` to get Linux binaries → enables `npx vite build` and Claude Code tool use
- After any WSL `npm install`, Kenny must re-run `npm install` from Windows cmd before `npm run dev` works again
- This is a known npm bug with optional native dependencies — not a project issue

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
- `.env.example` exists at project root with placeholder values — safe to commit
- Tables: `users`, `cards` (320 Scryfall cards, read-only), `decks`, `deck_cards`, `player_profiles`, `player_cards`, `shop_listings`, `purchases`, `transactions`
- RLS: users can only see/edit their own decks, profiles, and purchases
- `deck_cards.quantity` constraint: `>= 1` (no upper limit — basic lands are unlimited)
- `player_cards`: tracks owned card quantities per user — `UNIQUE (user_id, card_id)`; deployed 2026-06-26
- Schema file: `supabase/schema.sql` — run in Supabase SQL editor to deploy
- **CRITICAL**: If you get a 404 on any `/rest/v1/<table>` call, the table doesn't exist in Supabase — run the CREATE TABLE from schema.sql in the SQL editor

## Phaser Scene Flow
```
BootScene → TitleScene (first time) → StarterPickScene (first time) → HubScene
BootScene → HubScene (returning players — mt_starter already set, TitleScene skipped)
HubScene ↔ WorldMapScene ↔ ClubScenes (white/blue/black/red/green)
HubScene → SanctumScene (all 5 seals collected — north wall trigger)
ClubScene → battle → BattleScreen (React overlay, zIndex 200)
HubScene → shop booth → ShopOverlay (React overlay, zIndex 200)
GamePage ☰ Menu → DeckBuilder overlay (Home component, zIndex 150, no route change)
```
- `localStorage('mt_starter')` — tracks whether starter deck was picked; BootScene checks this to skip intro
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
src/game/scenes/BootScene.js        — asset preload; skips TitleScene for returning players (checks mt_starter)
src/game/scenes/SanctumScene.js     — postgame Oracle Vault; 3 alumni duelists (Tasklet/Gemini/Claude); unlocks after 5 seals
src/game/systems/CardEngine.js      — MTG rules engine (mana, creatures, spells, combat)
src/game/systems/AIOpponent.js      — AI turn logic (play land → removal → creatures → attack)
src/game/data/aiDecks.js            — hardcoded NPC deck definitions
src/game/BattleScreen.jsx           — full battle UI; retreat sends hpDamage:1 to GamePage
src/game/ShopOverlay.jsx            — booster pack shop UI; card flip reveal animation; logs to purchases table
src/game/PhaserGame.jsx             — mounts Phaser instance; bridges battleStart/starterPicked/shopOpen events to React
src/pages/Home.jsx                  — deck builder; accepts optional onClose prop (closes popup when rendered as overlay)
src/pages/GamePage.jsx              — loads deck + progress from Supabase; deck builder popup (deckOpen state); GameMenuTab
src/lib/cardUtils.js                — shared FRAME palette + artUrl() — imported by Home.jsx and ShopOverlay.jsx
```

## Asset Pipeline
- Sprites/tiles are PNG files in `public/assets/`
- Regenerate **player sprite**: `python3 scripts/gen_player_sprite.py` → `public/assets/sprites/player.png`
- Regenerate **all NPC sprites + tiles**: `python3 scripts/generate_assets.py`
- Regenerate world map: `python scripts/gen_worldmap.py` → `public/assets/worldmap-bg.png`
- Regenerate hub interior: `python scripts/gen_hub.py` → `public/assets/hub-bg.png`
- Regenerate club interiors: `python scripts/gen_clubs.py` → `public/assets/club-{color}-bg.png` (×5)
- Regenerate archives: `python scripts/gen_archives.py` → `public/assets/archives-bg.png`
- Shared drawing utilities: `scripts/iso_utils.py` — imported by all background generators
- Style target: GBA/FFTA oblique 2.5D — visible wall faces, depth shading, 3/4-view sprites
- Sprites are real-artwork PNGs with transparent backgrounds; sizes vary (portraits ~880-944×1200-1380px)
- **Extract spritesheet** (player + hub/archives/club NPCs): `python3 scripts/extract_sprites.py` — slices `mana_tactics_character_sprites.png` from Downloads into 9 sprites with background removal + tight-crop; skips ironclad (protected)
- **Process individual NPCs** (librarian, color NPCs, merchant, caretaker): `python3 scripts/copy_individual_npcs.py` — reads 8 card PNGs from Downloads, removes cream background, crops label, tight-crops
- Tight-crop uses Pillow `getbbox()` after `remove_background()` — strips all transparent padding so sprites sit flush on tiles
- **CRITICAL**: Do NOT use or copy assets from `C:\Users\Kenny\Downloads\CelestialShaman_v8_PATCHED\` — that is a completely separate project and is off limits

## FFTA Extended Tileset (2026-06-25)
16 new 64×64 tile PNGs in `public/assets/tiles/` — preloaded in BootScene with these Phaser keys:
| Key | File |
|---|---|
| `tile-warm-stone` | `01_warm_stone_floor.png` |
| `tile-wood-plank` | `02_wood_plank_floor.png` |
| `tile-crimson-carpet` | `03_crimson_carpet.png` |
| `tile-rune-stone` | `04_rune_stone_floor.png` |
| `tile-banner-wall` | `05_banner_wall.png` |
| `tile-wall-top` | `06_crenellated_wall.png` |
| `tile-arched-door` | `07_arched_door.png` |
| `tile-open-arch` | `08_open_archway.png` |
| `tile-stairs` | `09_staircase.png` |
| `tile-magic-circle` | `10_magic_circle.png` |
| `tile-water-pool` | `11_water_pool.png` |
| `tile-cobblestone` | `12_mossy_cobblestone.png` |
| `tile-void` | `13_void_border.png` |
| `tile-gold-star` | `14_gold_star_floor.png` |
| `tile-carpet-trans` | `15_carpet_stone_transition.png` |
| `tile-skylight` | `16_skylight_ceiling.png` |

Oracle's Vault background: `public/assets/oracle-vault-bg.png` — preloaded as `oracle-vault-bg`

## Visual Style — 2.5D Oblique (2026-06-24)
The game uses **oblique 2.5D** (not true isometric) so physics grid positions match screen positions exactly.
- Grid: 25×18 tiles, TILE=32px, canvas 800×576 — physics layer unchanged
- Walls rendered with a 9px dark "cap" (top face) + 23px lighter "face" (vertical surface) — gives box depth
- `iso_utils.py` exports: `wall_n/l/r/s()`, `floor_tile()`, `depth_rect()`, `draw_hud_bar()`
- Sprites face SW with near-side (left) highlighted, far-side (right) shadowed; left foot lower (nearer in depth)

## 4-Corner HUD Chrome (2026-06-24)
Applied to HubScene, ClubScene, ArchivesScene:
- **Top-left**: 32px dark bar (`#0A111E`) with gold border + status token panel (210×24px, gold outline)
- **Top-right**: 90×90 square minimap (`drawMinimap()`) — SW=3px/tile, SH=5px/tile, gold player dot
- **Bottom-left**: compass rose (`_drawCompassRose()`) — gold N arm, slate other arms, circle at (24, 552)
- **Bottom-center/dialog**: portrait on LEFT side of dialog box (FFTA-authentic), text flows right

## Background Image System
All scene backgrounds are pre-generated PNG files loaded via BootScene.js preload():
- `worldmap-bg.png` — sky, mountains with shadow faces, 5 terrain zones, buildings, paths, Crystal Nexus
- `hub-bg.png` — oblique 2.5D stone room: crystal nexus cluster, counter, shelves, portal arch, 5 banners
- `archives-bg.png` — dark oak library: bookshelves left wall, scroll racks right wall, candle sconces
- `club-white-bg.png` — cream/gold podium + diamond carpet (Solara Plains)
- `club-blue-bg.png` — slate/navy (Tidefall Isles)
- `club-black-bg.png` — dark/purple glowing cracks (Shadowmere Bog)
- `club-red-bg.png` — volcanic/crimson lava seams (Embercrest Peaks)
- `club-green-bg.png` — wood/moss planks (Thornveil Woods)

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
- `castCreature(who, idx)` — checks `availableMana >= cost`, taps lands, sets `summoningSick: true`; fires ETB effects
- `castSpell(who, idx, targetIdx, targetType)` — parses effect from description or abilities
- Abilities: flying, vigilance, trample, haste, first_strike, lifelink, deathtouch
- `activateAbility(who, bfIdx)` — taps creature to execute `{T}:` ability (mana, damage, draw)

## Battle System — MTG Rules (2026-06-24)

### Instant Speed Window
- After all AI actions, but BEFORE `startTurn('player')`, an **instant window** opens
- If player has instants in hand AND AI is about to cast spell/creature, window opens mid-AI-turn too
- `pendingAiActions = { actions, nextIdx }` state pauses the AI action chain in BattleScreen
- PASS button: orange when mid-AI-turn (`pendingAiActions !== null`), blue when end-of-turn
- Counter spells cast during the window auto-cancel the AI's pending action and skip it
- `playerPassedPriority = true` param prevents re-opening the window on resume

### ETB (Enter the Battlefield) Effects
- `parseETBEffect(description)` in CardEngine.js — regex: `when (?:~|this|.+?) enters(?: the battlefield)?`
- Fallback regex: `enters the battlefield[,:\s]+` — catches any remaining Scryfall Oracle text formats
- Auto-resolve: draw, lifegain (no target needed)
- Needs target: destroy/exile/bounce — returns `needsETBTarget: { card, effect }` from `castCreature`
- BattleScreen stores `pendingETB` state; player clicks AI creature to resolve; "Skip ETB" button available
- AI auto-targets first enemy creature for its own ETB effects

### Activated Abilities
- `parseActivatedAbility(description)` — matches `{T}: add`, `{T}: deal X damage`, `{T}: draw`
- `activateAbility(who, bfIdx)` — taps creature, executes effect
- Player triggers by clicking own untapped creature in main phase with no card selected

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

## Shop NPCs (2026-06-24)
- **Hub NPC — Merchant Voss**: added to HubScene NPC_DEFS at tileX:21, tileY:4; `shop: true` flag
  - Dialog ends with `game.events.emit('shopOpen')`; prompt label shows `[E] Shop`
  - Sprite: `public/assets/sprites/npc-merchant.png` — 24×32 pixel art, gold robe, gray hair, coin bag
  - Loaded in BootScene: `this.load.image('npc-merchant', 'assets/sprites/npc-merchant.png')`
- **Overworld — Merchant Voss**: `drawMerchant()` in WorldMapScene at (330, 490)
  - Clickable panel with gold border, hover highlight, emits `shopOpen` on click

## Archmage Victory Pack Reward (2026-06-24)
- Defeating an archmage **for the first time** (first seal win per color) awards a free booster pack
- `ClubScene.js`: all 5 archmage battle defs have `archmage: true`
- `GamePage.jsx`: `isFirstSealWin = winner === 'player' && activeBattle?.archmage && !progress.seals.includes(color)`
  - Fetches 5 random cards → stores in `prizePackCards` state → second `<ShopOverlay>` instance renders
- `ShopOverlay.jsx`: `prizeCards` prop — on mount, skips browse, jumps straight to card flip opening
  - Header: "✦ VICTORY REWARD ✦" (instead of "✦ CARD SHOP ✦")
  - Phase label: "Seal earned — cards are yours!"
  - "Open Another" button hidden; close button says "Claim & Close"
  - Repeat wins on same color give gold but no second pack

## Seal Gating (2026-06-24)
- Gate order: White (free) → Blue (needs white) → Black (needs blue) → Red (needs black) → Green (needs red)
- Locked regions show 🔒 badge on WorldMapScene marker
- Clicking locked region: `showLockMessage(neededColor)` — 2.2s timed overlay, "Earn the WHITE seal first!"
- Re-checks registry live so unlocks immediately after winning

## UI — Login Screen (2026-06-26)
- Background: `public/assets/login-bg.png` — original pixel art scene (MANA TACTICS title, academy courtyard, guild banners)
- The original image had a pixel art login panel baked in; it was blanked with Python/Pillow (`rgb(8,5,16)` rect at x=34–70%, y=31–78%)
- React panel sits exactly over the blanked area: `position:absolute, left:34%, top:31%, width:36%, height:47%`
- Panel background: `rgb(8,5,16)` fully opaque — matches the painted blank area
- `backgroundSize: '100% 100%'` — do NOT change to `cover`, it breaks % positioning
- To reposition: adjust BOTH the Python rect coordinates AND the Login.jsx panel percentages together
- All Login.jsx edits can be done directly in WSL — Kenny restarts `npm run dev` from Windows cmd after

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

## Card Collection System (2026-06-26)
- `player_cards` table: `(user_id, card_id, quantity)` — tracks what each player owns
- **Deck builder shows ALL 320 cards always** — `_owned` field is a display badge (quantity owned), NOT a filter
- Cards with `_owned: 0` show without a badge; owned cards show their quantity count
- `fetchAllCards()` in `Home.jsx`: parallel fetch of `player_cards` + `cards`, merge via `ownedMap`, set all cards with `_owned`
- `handleBuyPack()` in `GamePage.jsx`: card fetch → gold deduct → purchases log (fire-and-forget) → Supabase JS upsert to `player_cards` → `setCollectionVersion` (always fires via finally)
- `handleStarterPicked()`: seeds `player_cards` via Supabase JS client upsert with `onConflict: 'user_id,card_id'`
- **Always use Supabase JS client for `player_cards` writes** — axios default `Prefer: return=representation` header conflicts with upsert resolution; Supabase client handles it internally
- Prize pack (archmage win): same Supabase JS upsert pattern as booster pack

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

## Sound Engine (2026-06-26)
- `src/game/systems/SoundEngine.js` — Web Audio API procedural chiptune synth (no audio files needed)
- Singleton exported as named `{ SoundEngine }` — import in any scene/component
- AudioContext created lazily on first SFX call (satisfies browser autoplay policy)
- **BGM themes**: `hub`, `archives`, `world`, `battle`, `club`, `sanctum`, `title` — looping multi-voice arrangements
- **SFX methods** (call directly — no `playSFX` wrapper): `cardPlay()`, `spellCast()`, `attackHit()`, `creatureDeath()`, `lifelinkHeal()`, `gainLife()`, `victory()`, `defeat()`, `dialogTick()`, `openMenu()`, `closeMenu()`, `confirm()`, `cancel()`, `goldEarn()`, `sealEarn()`, `purchase()`, `error()`, `levelUp()`, `footstep()`, `bump()`, `sceneTransition()`
- **Volume**: `SoundEngine.setMusicVolume(0-1)`, `SoundEngine.setSFXVolume(0-1)`
- **Mute**: `SoundEngine.toggleMute()` → returns new muted bool; `SoundEngine.muted` getter
- **Mute button**: 🔊/🔇 in BattleScreen top bar (right of TURN counter), gold border when unmuted
- **CRITICAL**: Call SFX methods directly — `SoundEngine.confirm()`, NOT `SoundEngine.playSFX('confirm')` (no such wrapper exists)

## Known Bugs Fixed
- `getManaCost` now returns minimum 1 for non-land cards with null/empty mana_cost (was returning 0, making creatures free)
- BattleScreen now shows mana cost hint when selecting cards and tooltip on disabled buttons
- `portalBounds` was never set after `drawPortalDoor()` was removed — portal to WorldMap was broken; fixed by inlining `new Phaser.Geom.Rectangle(360, 518, 80, 30)` at end of `drawMap()`
- Deck panel cards had no tooltip and no way to increment quantity — fixed: hover shows tooltip, click card increments, click ×qty badge decrements
- `deck_cards.quantity` DB constraint was `BETWEEN 1 AND 3` — blocked land quantities > 3; changed to `>= 1`
- Register page showed raw `{}` Supabase error — sanitized to "Registration failed. Please try again."
- ETB regex only matched `this/~/it enters` — missed real Scryfall card names like "When Thassa's Oracle enters"; broadened to `.+?` wildcard
- Instant window opened AFTER all AI actions — player couldn't counter; fixed with `pendingAiActions` mid-chain pause
- `SoundEngine` used throughout BattleScreen without import → `ReferenceError` crash on battle start; fixed by creating `SoundEngine.js` and adding named import
- AI hand index desync — `AIOpponent.js` actions now store `cardId: card.id` instead of `handIndex: i`; `BattleScreen.jsx` resolves live index via `findHandIndex(hand, cardId)` at execution time with a -1 skip guard (2026-06-25)
- `starterPicked` fired on every panel click creating duplicate Supabase decks — moved emit out of `pointerdown` into `confirm()` with `{ color: deck.color }` payload (2026-06-25)
- Empty deck could enter battle with no creatures/spells — `handleBattleStart` now guards `playerCards.length === 0` with alert + early return (2026-06-25)
- `schema.sql` type CHECK only covered creature/spell/enchantment/artifact — expanded to include `instant`, `sorcery`, `land`; 5 basic land cards (Plains–Forest) added to `seed.sql` with UUIDs 16–20 (2026-06-25)
- `aiDecks.js` starter deck had wrong card mix — corrected to 4× white_knight, llanowar_elves, giant_growth, goblin_guide (2026-06-25)
- `generate_assets.py` had hardcoded WSL paths for SPRITES_DIR/TILES_DIR — replaced with portable `os.path.dirname(os.path.abspath(__file__))` relative paths (2026-06-25)
- `declareBlockers()` was a pass-through stub — replaced with MTG-correct flying/reach enforcement: flying attackers can only be blocked by flying or reach creatures; illegal blocks logged and dropped (2026-06-25)
- `ClubScene.createNPCs()` used plain `this.add.sprite` — upgraded to `this.physics.add.sprite` with `setImmovable(true)` and per-NPC player collider so NPCs act as solid obstacles (2026-06-25)
- Sprite squishing — `setDisplaySize(w,h)` forced wrong aspect ratio on real-artwork sprites; replaced with `setScale(targetH / sprite.height)` across all 4 scenes (HubScene, ClubScene, ArchivesScene, SanctumScene): player 72px tall, NPCs 64px, dialog portraits 56px wide
- Floating sprites — extracted sprites had 0–93px of transparent padding at top; Pillow `getbbox()` tight-crop strips it in both `extract_sprites.py` and `copy_individual_npcs.py`
- Login auth guard — Supabase persists session in localStorage so authenticated users saw the login form on every revisit; added `if (!loading && user) return <Navigate to="/game" replace />` in Login.jsx
- Refresh-to-intro — refreshing while in-game replayed the TitleScene "press any key" intro; BootScene now checks `localStorage.getItem('mt_starter')` and routes returning players directly to HubScene
- Triad decks missing — SanctumScene fell back to single-color decks; added `triad-tasklet` (Blue/Black control), `triad-gemini` (White/Blue/Green value), `triad-claude` (Red/Black/Green toolbox) to `aiDecks.js` with 25 new multi-color cards (2026-06-26)
- `Login.jsx` had `SoundEngine.playSFX('confirm')` etc. — replaced all 6 calls with direct method calls (`SoundEngine.confirm()`, `SoundEngine.error()`, `SoundEngine.openMenu()`, `SoundEngine.closeMenu()`) — login now works (2026-06-26)
- `BootScene.create()` always started TitleScene — added `mt_starter` check so returning players go directly to Hub (2026-06-26)
- `HubScene` rewritten to use `IsoEngine.js` + `academy-tileset-v1.png` sprites; duplicate `drawFountain()` removed; fountain uses tileset sprite with pulsing glow; desks/bookshelves/plants/lanterns use tileset sprites; floor drawn with Graphics (warm stone checkerboard); `drawPortalDoor()` now explicitly called in `create()` (was only baked into hub-bg.png before) (2026-06-26)
- Login double-vision fixed — Python/Pillow blanked the baked-in pixel art panel from `login-bg.png`; React panel positioned over it at `left:34%, top:31%, width:36%, height:47%` (2026-06-26)
- `player_cards` table was never deployed to Supabase → 404 on all collection reads/writes; table created manually in SQL editor (2026-06-26)
- Booster pack collection save: moved from axios (broken `Prefer` header) to Supabase JS client; purchases log made fire-and-forget; `collectionVersion` increment moved to `finally` so deck builder always refreshes (2026-06-26)
- `fetchAllCards` now shows all 320 cards always with `_owned` badge — previous filter-by-ownership caused invisible cards whenever `player_cards` had any rows but IDs didn't match (2026-06-26)
- `handleStarterPicked` player_cards upsert switched to Supabase JS client for consistency (2026-06-26)

## Postgame — The Legendary Alumni (The Triad)
Unlocks after player collects all 5 Archmage Seals. Full spec in `docs/Mana_Tactics_Legendary_Alumni_Handoff.md`.
- **Archon Tasklet** — Blue/Black control (`deckType: 'triad-tasklet'`) ✅ deck done
- **Sage Gemini** — White/Blue/Green value (`deckType: 'triad-gemini'`) ✅ deck done
- **Artificer Claude** — Red/Black/Green toolbox (`deckType: 'triad-claude'`) ✅ deck done
- Scene: `SanctumScene.js` — Oracle Vault; 3 NPCs fully wired (dialog → battle emit); reward 200 gold each ✅
- Sprites complete: `npc-tasklet.png` (906×1374), `npc-gemini.png` (888×1203), `npc-claude.png` (883×1243) ✅
- Unlock gate: HubScene north wall trigger; checks `seals.length >= 5`; shows 3-sec hint if locked ✅
- BGM: `SoundEngine.startBGM('sanctum')` — ethereal theme ✅
- Uses `oracle-vault-bg.png` as background (preloaded in BootScene)

## Pending Work (priority order)
> ✅ All 7 bugs from the 2026-06-25 Final Audit Handoff are resolved (see Known Bugs Fixed above).
> ✅ FFTA tileset (16 tiles) integrated and preloaded (2026-06-25).
> ✅ Legendary Alumni (The Triad) — decks, sprites, scene, gate logic all complete (2026-06-26).
> ✅ Visual overhaul — real artwork sprites, tight-crop, scaling fixed, 2.5D backgrounds verified.

1. ✅ **Login.jsx SoundEngine bug** — fixed (2026-06-26)
2. ✅ **Login double-vision** — pixel art panel blanked, React panel positioned over it (2026-06-26)
3. ✅ **Booster pack collection** — player_cards table deployed, Supabase JS upsert, always-refresh (2026-06-26)
4. **Battle system polish** (most gameplay-visible)
   - Card play animations (creature lands on field, spell cast flash)
   - Death state when HP hits 0; win/lose screen improvements
   - Better AI difficulty scaling per region
   - More MTG abilities: vigilance, trample bleed-through, lifelink display
3. **HP recovery mechanic** — Caretaker Elys NPC has `rest: true` flag in HubScene but GamePage doesn't handle the rest event yet; fix = listen for `restStart` event → deduct 20 gold → restore HP
4. **Victory screen** — overlay when `progress.seals.length >= 5 && !activeBattle`
5. **Additional academy rooms** — plug-and-play: `gen_*.py` → PNG, new `*Scene.js` mirroring HubScene

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
