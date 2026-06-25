# ⚔️ Mana Tactics

A GBA-style tactical card battler inspired by **Final Fantasy Tactics Advance** and **Magic: The Gathering**.

Enroll at the prestigious Mana Academy, choose your path of magic, collect powerful cards, and battle your way through five elemental regions to earn all five Mana Seals.

> **Visual Style:** FFTA / GBA isometric pixel art · **Card Rules:** MTG-inspired · **Tone:** All-ages magical academy

---

## 🎮 How to Play

### Getting Started

1. **Title Screen** — Press Start to begin your journey
2. **Choose Your Starter Deck** — Pick one of five color-aligned decks:

| Deck | Color | Star Card | Playstyle |
|------|-------|-----------|-----------|
| **Dawn's Shield** | ⬜ White | Serra Angel | Protect · Heal · Endure |
| **Mind's Reach** | 🔵 Blue | Air Elemental | Draw · Control · Counter |
| **Shadow's Grasp** | ⚫ Black | Sengir Vampire | Destroy · Drain · Dominate |
| **Flame's Fury** | 🔴 Red | Shivan Dragon | Fast · Fierce · Final |
| **Wild's Call** | 🟢 Green | Force of Nature | Ramp · Grow · Overwhelm |

3. **Academy Hub** — Explore the academy, talk to NPCs, and prepare for battles

---

### The Academy Hub

The Hub is your home base. Walk around and interact with characters:

- **NPCs at desks** — Talk to fellow students and instructors for tips and lore
- **Mana Fountain** — The centerpiece of the academy, pulsing with arcane energy
- **Portal Door** — Step through to access the World Map
- **Bookshelves & Tables** — Furniture decorates the academy halls
- **Class Banners** — Each of the five mana colors is represented

Use **arrow keys** or **WASD** to move. Walk up to an NPC and press **Space** or **Enter** to talk.

---

### The World Map

From the World Map, choose a region to challenge:

| Region | Color | Location |
|--------|-------|----------|
| **Solara Plains** | ⬜ White | Mana Academy |
| **Tidefall Isles** | 🔵 Blue | Scholar's Library |
| **Shadowmere Bog** | ⚫ Black | Shadow Tower |
| **Embercrest Peaks** | 🔴 Red | The Forge |
| **Thornveil Woods** | 🟢 Green | Forest Shrine |

Regions unlock sequentially — earn the previous Seal to advance. Defeat the region's champion to earn their **Mana Seal**.

**Collect all 5 Seals to complete the game!**

---

### Battle System

Battles use **Magic: The Gathering** rules adapted for tactical play:

#### Turn Structure
Each turn follows this sequence:

```
Draw Phase → Main Phase 1 → Combat Phase → Main Phase 2 → End Phase
```

- **Draw Phase** — Draw a card from your deck
- **Main Phase 1** — Play lands, cast creatures and sorceries
- **Combat Phase** — Declare attackers, opponent declares blockers, damage resolves
- **Main Phase 2** — Play additional lands/creatures/sorceries after combat
- **End Phase** — Turn passes to your opponent

#### Playing Cards

- **Lands** — Play one land per turn (no mana cost). Lands generate mana each turn.
- **Creatures** — Pay the mana cost to summon. Creatures can attack and block.
- **Instants** — Cast anytime, even on your opponent's turn. Immediate effect.
- **Sorceries** — Cast only during your own Main Phase.

#### Mana System

Each land produces mana of its color. Cards cost a mix of colored and colorless mana:
- Colored mana (W/U/B/R/G) can only come from matching lands
- Colorless mana can come from any land

#### Combat

1. **Declare Attackers** — Tap your creatures to attack (tapped creatures can't block)
2. **Declare Blockers** — Opponent assigns blockers to your attackers
3. **Damage Resolution** — Creatures deal damage equal to their power
   - If damage ≥ toughness, the creature dies
   - Unblocked attackers deal damage directly to the opponent's life total

#### Winning

Reduce your opponent's **life total to 0** to win the battle.

---

### Card Abilities

Cards can have keyword abilities that change how they work in combat:

| Keyword | Effect |
|---------|--------|
| **Flying** | Can only be blocked by creatures with Flying or Reach |
| **First Strike** | Deals combat damage before creatures without First Strike |
| **Vigilance** | Attacking doesn't tap this creature |
| **Trample** | Excess damage carries through to the opponent |
| **Haste** | Can attack the turn it enters the battlefield |
| **Lifelink** | Damage dealt also heals you for the same amount |
| **Deathtouch** | Any amount of damage this deals to a creature destroys it |
| **Reach** | Can block creatures with Flying |

#### Ability Interactions
- **Deathtouch + Trample** — Only 1 damage is needed to kill the blocker; the rest tramples through
- **Lifelink + Trample** — You heal for ALL damage dealt (to blocker + to opponent)
- **First Strike vs First Strike** — Both deal damage simultaneously in the first-strike step

---

### The Shop

Earn **gold** from battles and visit the shop to buy booster packs. Packs contain random cards to strengthen your deck and explore new strategies.

---

### Exploration Rooms

Beyond the Hub, visit:

- **Club Rooms** — Each color has its own club with unique NPCs and flavor
- **The Archives** — A library of arcane knowledge with its own characters

---

## 🛠️ Development

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

### Tech Stack

- **Phaser 3** — Game engine (exploration, world map, sprites)
- **React** — UI layer (battle screen, shop, menus)
- **Vite** — Build tool
- **Supabase** — Backend services

### Project Structure

```
src/game/
├── scenes/
│   ├── BootScene.js          # Asset loading
│   ├── TitleScene.js         # Title screen
│   ├── StarterPickScene.js   # Deck selection
│   ├── HubScene.js           # Academy hub (exploration)
│   ├── ClubScene.js          # Color club rooms
│   ├── ArchivesScene.js      # Library/archives
│   └── WorldMapScene.js      # Region select + battle entry
├── systems/
│   ├── CardEngine.js         # MTG rules engine
│   ├── AIOpponent.js         # AI battle logic
│   └── SoundEngine.js        # Audio management
├── data/
│   └── aiDecks.js            # NPC deck definitions
├── BattleScreen.jsx          # Battle UI (React)
├── ShopOverlay.jsx           # Shop UI (React)
├── PhaserGame.jsx            # Phaser↔React bridge
└── index.js                  # Game config
```

---

## 📜 License

All rights reserved © 2025 Kenny Abadia Castellano
