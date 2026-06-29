# Mana Tactics — Official MTG Rules Compliance Handoff

> **Purpose:** Map every aspect of CardEngine.js + BattleScreen.jsx against official MTG Comprehensive Rules, identify what's wrong, what's intentionally adapted, and give exact fix guidance.
>
> **Scope:** CardEngine.js (920 lines), AIOpponent.js, BattleScreen.jsx, aiDecks.js
>
> **Status key:** ✅ Correct | ⚠️ Wrong — fix it | 🏠 House Rule — keep but document | 🚫 Missing — implement

---

## Table of Contents
1. [Life & Win Conditions](#1-life--win-conditions)
2. [Opening Hand & Mulligan](#2-opening-hand--mulligan)
3. [Turn Structure & Phases](#3-turn-structure--phases)
4. [Mana System & Color Requirements](#4-mana-system--color-requirements)
5. [Card Types](#5-card-types)
6. [Summoning Sickness](#6-summoning-sickness)
7. [Combat — Declare Attackers](#7-combat--declare-attackers)
8. [Combat — Declare Blockers](#8-combat--declare-blockers)
9. [Combat — Damage Resolution](#9-combat--damage-resolution)
10. [Keyword Abilities](#10-keyword-abilities)
11. [Spell Timing & The Stack](#11-spell-timing--the-stack)
12. [Card-Specific Bugs](#12-card-specific-bugs)
13. [Zones](#13-zones)
14. [Card Display / UI](#14-card-display--ui)
15. [Summary Priority Table](#15-summary-priority-table)

---

## 1. Life & Win Conditions

### Starting Life
- **MTG Rule:** 20 life (Comprehensive Rules 103.4)
- **Current:** `life: 10` in `CardEngine.initState()` (line 202, 213)
- **UI:** `LifeDots` renders max 10 hearts
- **Verdict:** 🏠 **House Rule — intentional for faster games**
- **Action:** Keep at 10 BUT document it in-game (tooltip: "Mana Tactics uses 10 life for faster duels"). Update to 20 if you want standard-length games. If keeping 10, note that balance needs adjusting (aggro decks dominate at 10 life).

### Win Conditions
- ✅ Life ≤ 0 → lose (line 909-916)
- ✅ Library empty on draw → lose (line 242-245)
- 🚫 **Missing:** No "poison counter" win (not needed for current card pool)
- **Verdict:** Fine for now.

---

## 2. Opening Hand & Mulligan

### Opening Hand Size
- **MTG Rule:** Draw 7 cards initially (CR 103.5)
- **Current:** Draws 5 cards for each player (BattleScreen.jsx ~line 838)
  ```js
  for (let i = 0; i < 5; i++) engine.drawCard('player')
  for (let i = 0; i < 5; i++) engine.drawCard('ai')
  ```
- **Verdict:** ⚠️ **Should be 7**
- **Fix:** Change both loops to `i < 7`. At 10 life this might flood hands — consider keeping 5 as a house rule if 7 feels too strong.

### Mulligan
- **MTG Rule:** London Mulligan — shuffle hand back, draw 7, put 1 on bottom per mulligan taken
- **Current:** 🚫 No mulligan at all
- **Verdict:** ⚠️ **Missing**
- **Fix:** Add a pre-game mulligan prompt:
  1. Show opening hand
  2. "Keep" or "Mulligan" button
  3. On mulligan: shuffle hand into library, draw 7, put N cards from hand on bottom of library (where N = number of mulligans taken)
  4. AI mulligans if hand has 0-1 lands or 6-7 lands

---

## 3. Turn Structure & Phases

### MTG Turn Phases (CR 500)
```
Beginning Phase:
  - Untap Step
  - Upkeep Step
  - Draw Step
Main Phase 1 (pre-combat)
Combat Phase:
  - Beginning of Combat
  - Declare Attackers
  - Declare Blockers
  - Combat Damage
  - End of Combat
Main Phase 2 (post-combat)    ← MISSING
Ending Phase:
  - End Step
  - Cleanup Step              ← MISSING (discard to hand size)
```

### Current Implementation
- ✅ Untap (line 263 — untaps all creatures and lands at turn start)
- 🚫 **No Upkeep** — some cards trigger "at the beginning of your upkeep"
- ✅ Draw Step (line 283)
- ✅ Main Phase (line 284)
- ✅ Combat Phase (attackers → blockers → damage)
- ⚠️ **No Main Phase 2** — After combat, phase goes directly to 'end' (line 854). Player cannot play creatures/sorceries after attacking.
- ⚠️ **No Cleanup Step** — No discard-to-hand-size check

### Fixes Required

**Main Phase 2 (CRITICAL):**
In `resolveCombat()`, change:
```js
// OLD:
this.state.phase = 'end'
// NEW:
this.state.phase = 'main'  // post-combat main phase
```
Then in BattleScreen, after combat resolves, return to the main phase UI so the player can play more cards before clicking "End Turn."

**Cleanup / Max Hand Size:**
In `endTurn()`, before passing the turn, add:
```js
const MAX_HAND = 7
while (p.hand.length > MAX_HAND) {
  const discarded = p.hand.pop()  // auto-discard last drawn
  p.graveyard.push(discarded)
  this._log(`${who} discards ${discarded.name} (hand limit)`)
}
```
For AI, auto-discard highest-cost card. For player, show a discard picker UI in BattleScreen.

---

## 4. Mana System & Color Requirements

### The Big One: Color-Specific Mana
- **MTG Rule:** Mana costs specify colors. Serra Angel costs {3}{W}{W} — you need 2 white mana + 3 of any color, not just "5 mana."
- **Current:** `availableMana` is a single number. `getManaCost()` sums all mana_cost values into one total. Color is completely ignored.
- **Result:** A player with 5 Mountains can cast Serra Angel (which requires White mana). This is fundamentally wrong.
- **Verdict:** ⚠️ **Major — but fixing it properly is a big lift**

### Recommended Fix (Simplified Color Mana)
Instead of tracking individual mana by source, track a **mana pool** object:
```js
// In player state, replace:
availableMana: 0,
// With:
manaPool: { white: 0, blue: 0, black: 0, red: 0, green: 0, colorless: 0 },

// When a land untaps, add to pool based on land color:
// Plains → white++, Island → blue++, etc.
```

Then change `castCreature` / `castSpell` to check:
```js
function canPayCost(pool, manaCost) {
  if (!manaCost) return true
  const remaining = { ...pool }
  // Pay colored costs first
  for (const [color, amount] of Object.entries(manaCost)) {
    if (color === 'colorless') continue
    if ((remaining[color] || 0) < amount) return false
    remaining[color] -= amount
  }
  // Pay colorless with any remaining mana
  const totalRemaining = Object.values(remaining).reduce((a, b) => a + b, 0)
  return totalRemaining >= (manaCost.colorless || 0)
}
```

**Auto-tap lands smartly:** Tap colored lands first to match colored costs, then use whatever's left for colorless.

### Mana Dork (Llanowar Elves)
- **Current:** Has ability `mana_dork` and description "Add 1 green mana to your pool each turn" — but `parseActivatedAbility()` only matches `{t}: add` regex patterns. The `mana_dork` ability isn't handled.
- **Fix:** In `parseActivatedAbility()`, add:
```js
if (card.abilities?.includes('mana_dork')) {
  return { cost: 'tap', type: 'mana', amount: 1, color: card.color || 'green' }
}
```
- Then in `activateAbility()`, when type is 'mana', add to the specific color pool (once color mana is implemented) or to generic pool.

---

## 5. Card Types

### Supported Types
- ✅ `creature` — works
- ✅ `instant` — works (with timing window)
- ✅ `sorcery` — works BUT no sorcery-speed enforcement (see §11)
- ✅ `land` — works
- 🏠 `spell` — catch-all type used alongside instant/sorcery. Not an MTG type but harmless.

### Missing Types
- 🚫 `enchantment` — permanent that stays on battlefield with continuous effects
- 🚫 `artifact` — colorless permanent
- 🚫 `planeswalker` — not needed for current scope
- 🚫 `equipment` (artifact subtype) — attach to creatures
- 🚫 `aura` (enchantment subtype) — attach to permanents

### Recommendation
For the current card pool (15 cards), this doesn't matter. BUT when expanding the card pool, you'll want at least **enchantment** and **artifact** types. Implementation:
- Treat them like creatures that stay on the battlefield but can't attack/block
- Apply continuous effects via a new `_applyStaticEffects()` check each phase

---

## 6. Summoning Sickness

- ✅ Creatures can't attack the turn they enter (line 318, line 684)
- ✅ Haste bypasses summoning sickness (line 317)
- ✅ Visual indicator — "NEW" badge + reduced opacity (line 282-297)
- ⚠️ **Minor:** Summoning sickness should only prevent attacking and tap abilities, NOT all tap-to-activate. Currently it doesn't block activated abilities (which is correct for most cases) — but should be explicitly checked for tap-to-activate abilities.
- **Fix:** In `activateAbility()`, add check:
```js
if (slot.summoningSick && ability.cost === 'tap' && !hasAbility(slot.card, 'haste')) {
  return { ok: false, error: `${slot.card.name} has summoning sickness — cannot use tap abilities this turn` }
}
```

---

## 7. Combat — Declare Attackers

- ✅ Only untapped, non-summoning-sick creatures can attack (line 682-685)
- ✅ Tapped creatures can't attack
- ⚠️ **Missing: Menace enforcement** — Menace means "can't be blocked by fewer than 2 creatures." Since the engine only supports 1 blocker per attacker, menace effectively means "unblockable." Need to either implement multi-blocking or treat menace as pseudo-unblockable.
- **Recommendation:** For now, treat menace as: "This creature can't be blocked by a single creature" — skip blocker assignment for menace attackers in the `declareBlockers` validation.

---

## 8. Combat — Declare Blockers

### Flying/Reach
- ✅ Flying validation in `declareBlockers()` (line 701-718) — already fixed
- ✅ AI blocker flying check in AIOpponent.js

### Multiple Blockers
- **MTG Rule:** Multiple creatures can block a single attacker. Attacker assigns damage order.
- **Current:** Only 1 blocker per attacker (blockerMap is `{ attackerIdx: blockerIdx }`)
- **Verdict:** 🏠 **House Rule — keep for simplicity**
- This means menace is effectively "unblockable" (see §7)

### A Creature Can Only Block Once
- ✅ The blockerMap structure enforces this (each blocker index appears once)

---

## 9. Combat — Damage Resolution

### Basic Combat Damage
- ✅ Attacker deals power as damage, blocker deals power as damage (line 771-772)
- ✅ Damage tracked per creature, destroyed when damage ≥ toughness (line 860-872)
- ✅ Damage resets at end of turn (line 878)

### Trample
- ⚠️ **Bug:** Excess damage calculation ignores existing damage on blocker
  - **Current (line 815):** `const excess = Math.max(0, attackPow - blockerSlot.card.toughness)`
  - **Correct:** `const excess = Math.max(0, attackPow - (blockerSlot.card.toughness - blockerSlot.damage))`
  - With deathtouch + trample, only 1 damage needs to be assigned to the blocker (since any amount is lethal), and the rest tramples through. Current code doesn't handle this interaction.

### Deathtouch
- ⚠️ **Implementation is wrong**
  - **Current (line 782):** `let dmgToBlocker = attackerDT ? Math.max(attackPow, blockerSlot.card.toughness) : attackPow`
  - **Problem:** This *inflates* the damage dealt, which breaks lifelink interaction (heals too much) and trample interaction
  - **MTG Rule:** Deathtouch means "any amount of damage this deals to a creature is enough to destroy it." It doesn't change the amount of damage — it changes the destruction threshold.
  - **Fix:** Don't modify `dmgToBlocker`. Instead, in `_destroyDamaged()`, check:
  ```js
  // A creature is destroyed if:
  // - damage >= toughness, OR
  // - it was dealt damage by a source with deathtouch (any amount)
  ```
  Add a `dealtDeathtouchDamage` flag to battlefield slots during combat.

### Double Strike
- ⚠️ **Implementation is wrong**
  - **Current (line 786):** `if (attackerDS) dmgToBlocker *= 2` — just doubles damage
  - **MTG Rule:** Double Strike means the creature deals damage in BOTH first-strike AND regular combat damage steps. It doesn't simply double the number.
  - **Why it matters:** With first strike, the doubled creature should deal damage first, potentially killing the blocker before it hits back. Current implementation already handles first-strike ordering (line 789-805) but the "double" is just a multiplier, not two phases.
  - **Practical difference:** With current code, a 2/2 Double Strike vs a 3/3 does 4 damage to the blocker (kills it) but blocker hits back for 3. In real MTG: first strike phase deals 2 (doesn't kill 3/3), then regular phase deals another 2 (total 4, kills it), and blocker hits back for 3 in regular phase. Result is the same in this case BUT the interaction with first-strike-kills-before-damage-back is wrong.
  - **Fix:** Split combat into two damage steps when any creature has first/double strike. Double strikers deal damage in both steps.

### Lifelink
- ⚠️ **Double-counted for trampling creatures**
  - **Lines 818 + 824-828:** When a creature with trample AND lifelink attacks, life is gained from the trample excess (line 818) AND then again from the general lifelink check (line 824-828). This means healing happens twice.
  - **Fix:** Remove the trample-specific lifelink gain (line 818) and let the general lifelink block handle it — OR add a `lifelinkApplied` flag.
  - **Also:** Lifelink should heal based on total damage dealt (to blocker + trample), not just `attackPow`. Fix line 825:
  ```js
  // Should be total damage actually dealt, not raw power
  const totalDealt = Math.min(dmgToBlocker, blockerSlot.card.toughness) + excess
  attackerPlayer.life += totalDealt
  ```

---

## 10. Keyword Abilities

### Implemented & Working
| Keyword | Status | Notes |
|---------|--------|-------|
| Flying | ✅ | Properly enforced in declareBlockers + resolveCombat |
| First Strike | ✅ | First-strike-kills-before-damage-back works |
| Vigilance | ✅ | Doesn't tap on attack |
| Trample | ⚠️ | See §9 — excess calc ignores existing damage |
| Haste | ✅ | No summoning sickness |
| Lifelink | ⚠️ | See §9 — double-counted with trample |
| Deathtouch | ⚠️ | See §9 — inflates damage instead of lowering threshold |
| Reach | ✅ | Can block flyers |
| Double Strike | ⚠️ | See §9 — just doubles damage instead of two phases |
| Flash | ✅ | Checked in instant window |

### Listed in UI but NOT Enforced in Engine
| Keyword | What Should Happen | Current |
|---------|-------------------|---------|
| Menace | Can't be blocked by fewer than 2 creatures | 🚫 Not checked |
| Hexproof | Can't be targeted by opponent's spells/abilities | 🚫 Not checked — opponent can Terror/Bolt it freely |
| Indestructible | Survives destroy effects and lethal damage | 🚫 Not checked — still destroyed normally |
| Ward | Spells targeting this cost extra mana | 🚫 Not checked |
| Protection | Can't be blocked/targeted/damaged by chosen quality | 🚫 Not checked |

### Fix Priority
1. **Hexproof** — Add to `castSpell()` when targeting a creature: check if target has hexproof and caster is opponent → reject
2. **Indestructible** — Add to `_destroyDamaged()`: skip destruction if creature has indestructible. Also check in destroy/exile effects.
3. **Menace** — Add to `declareBlockers()`: if attacker has menace and only 1 blocker, reject (or since multi-blocking isn't supported, make menace = unblockable)
4. **Protection** — Complex. Start with "can't be blocked by [color]" and "can't be targeted by [color] spells"
5. **Ward** — Add mana cost check to targeting

---

## 11. Spell Timing & The Stack

### Instant vs Sorcery Timing
- **MTG Rule:** Sorceries can only be cast during your own main phase when the stack is empty. Instants can be cast any time you have priority.
- **Current:** ⚠️ Both instant AND sorcery can be cast during the instant window (opponent's turn). The UI code at line 1722 enables the Cast Spell button for `instant`, `sorcery`, and `spell` types during `instantWindow`.
- **Fix:** In `handleCastSpell()`, add sorcery timing check:
```js
if ((card.type === 'sorcery') && gameState.activePlayer !== 'player') {
  return showMessage("Sorceries can only be cast during your main phase")
}
if ((card.type === 'sorcery') && gameState.phase !== 'main') {
  return showMessage("Sorceries can only be cast during your main phase")
}
```

### The Stack
- **MTG Rule:** Spells go on a stack and resolve last-in-first-out. Players pass priority.
- **Current:** Spells resolve immediately. The "instant window" is a simplified priority system where the player can respond to AI actions.
- **Verdict:** 🏠 **House Rule — keep simplified.** A full stack is too complex for the current UI. The instant window system is a reasonable adaptation.

### Counterspells
- ⚠️ **Counter doesn't actually counter**
  - **Current (line 396-404):** Counter effect just discards the opponent's last hand card. It never interacts with the stack/instant window.
  - **BUT:** BattleScreen.jsx line 959-962 DOES have counter-during-instant-window logic that cancels the AI's pending action! So the counter mechanic partially works when responding to AI spells.
  - **Problem:** When cast outside the instant window, it just randomly discards an opponent's card — that's not countering, that's "discard" (like Duress).
  - **Fix:** Counter spells should only be castable during the instant window in response to an opponent's spell. If cast at any other time, show "No spell to counter." The BattleScreen counter logic (line 959-962) is correct — just restrict when counter cards can be played.

---

## 12. Card-Specific Bugs

### Brainstorm
- **Current:** "Draw 3 cards" — draws 3 and that's it
- **Real MTG:** "Draw 3 cards, then put 2 cards from your hand on top of your library"
- **Fix:** Return a `{ needsChoice: 'brainstorm' }` result from castSpell, show a UI where player picks 2 cards to put back, then call a new `completeBrainstorm(who, cardIds)` method
- **Priority:** Medium — current version is just a stronger Brainstorm

### Dark Ritual
- **Current:** "Add 3 mana to your pool" — costs {B} (1 mana), adds 3 = net +2
- **Real MTG:** Costs {B}, adds {B}{B}{B} = net +2 black mana
- **With generic mana:** Works correctly as-is (spend 1, gain 3 = net +2)
- **With color mana:** Should add 3 BLACK mana specifically
- **Priority:** Only matters when color mana is implemented

### Sengir Vampire
- **Current:** Only has `flying` in abilities array
- **Real MTG:** "Whenever a creature dealt damage by Sengir Vampire this turn dies, put a +1/+1 counter on Sengir Vampire"
- **Fix:** Would require a damage-source tracking system + death trigger system. Complex.
- **Priority:** Low — flavored correctly but ability is non-functional

### White Knight — Protection from Black
- **Current:** Has `first_strike` in abilities. Description mentions "Protection from black" but it's not in abilities array and protection isn't implemented.
- **Fix:** Add `'protection_from_black'` to abilities, implement protection checks
- **Priority:** Low until protection is implemented

### Giant Growth
- **Current:** `+3/+3 until end of turn` — works via pump effect, temp buffs expire at end of turn
- ✅ Correct implementation

### Llanowar Elves (Mana Dork)
- **Current:** Has `mana_dork` ability but `parseActivatedAbility()` only matches `{t}: add` regex. Description "Add 1 green mana to your pool each turn" doesn't match the regex either because it lacks "{t}:" or "tap:".
- **Fix:** Add to `parseActivatedAbility()`:
```js
// Check abilities array for mana_dork
if (card.abilities?.includes('mana_dork')) {
  return { cost: 'tap', type: 'mana', amount: 1 }
}
```
- OR change description to "Tap: Add 1 mana to your pool."
- **Priority:** HIGH — mana dork is a core green mechanic and currently does nothing

---

## 13. Zones

### MTG Zones (CR 400)
| Zone | Status | Notes |
|------|--------|-------|
| Library (deck) | ✅ | `library[]` |
| Hand | ✅ | `hand[]` |
| Battlefield | ✅ | `battlefield[]` (creatures) + `lands[]` |
| Graveyard | ✅ | `graveyard[]` |
| Stack | 🚫 | No stack — spells resolve immediately |
| Exile | ⚠️ | Cards exiled just vanish — no `exile[]` array |
| Command | 🚫 | Not needed |

### Fix: Add Exile Zone
```js
// In initState(), add to both player and ai:
exile: [],

// In castSpell() exile effect, instead of just removing:
// ADD: p.exile = [...p.exile, slot.card]  (or opp.exile)
```
Matters for cards that interact with exile (like Eldrazi processors, Wish effects that grab from exile, etc.)

---

## 14. Card Display / UI

### "Only Showing Top Half"
Kenny noted cards look like "the top half." Here's what's rendered:

**Battlefield Card (82×114px):**
1. ✅ Header — name + mana cost (or HP for creatures)
2. ✅ Art area — emoji placeholder with pixel grid overlay
3. ✅ Type bar — card type + first ability
4. ✅ Keyword pills — up to 3 ability badges
5. ⚠️ Text area — only shows first ability explanation OR truncated description (55 chars)
6. ✅ P/T badge — power/toughness in bottom-right

**What's missing from the visible card:**
- Full oracle text (descriptions are truncated to 55 chars)
- Rarity indicator on battlefield cards
- Mana cost breakdown (shows total but not color split)
- Art (just emoji placeholders — needs real pixel art)

**Tooltip (`CardTooltip`) shows the full card** — but players might not know to hover.

### Fixes:
1. Make the card tooltip more discoverable — add a subtle "ℹ" icon or pulsing border on hover
2. Show mana cost as colored pips (e.g., ◆◆◆ in color) instead of just a number
3. When cards are NOT on the battlefield (in hand), show more text since hand cards have a larger relative importance
4. Replace emoji art placeholders with actual pixel art sprites (see tileset/sprite handoffs)

---

## 15. Summary Priority Table

### 🔴 Critical — Fix Now
| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **No Main Phase 2** | CardEngine.resolveCombat() line 854 | Can't play cards after attacking — major strategic limitation |
| 2 | **Llanowar Elves mana ability broken** | CardEngine.parseActivatedAbility() | Core green mechanic non-functional |
| 3 | **Lifelink double-counted with trample** | CardEngine.resolveCombat() lines 818 + 824 | Heals too much — balance-breaking |
| 4 | **Sorceries castable on opponent's turn** | BattleScreen instant window check | Violates fundamental timing rules |
| 5 | **Deathtouch inflates damage** | CardEngine.resolveCombat() line 782 | Breaks lifelink/trample interactions |

### 🟡 Important — Fix Soon
| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | Trample excess ignores existing damage | resolveCombat() line 815 | Slightly less trample damage than should be |
| 7 | No max hand size / cleanup discard | endTurn() | Infinite hand size = card hoarders win |
| 8 | Hexproof not enforced | castSpell() targeting | Hexproof creatures can be targeted |
| 9 | Indestructible not enforced | _destroyDamaged() | Indestructible creatures still die |
| 10 | Counter spells work wrong outside instant window | castSpell() counter effect | Random discard instead of countering |
| 11 | Mana is colorless (no color requirements) | Entire mana system | Any deck can cast anything |
| 12 | Opening hand is 5 instead of 7 | BattleScreen init | Fewer options on turn 1 |

### 🟢 Nice to Have
| # | Issue | Notes |
|---|-------|-------|
| 13 | No mulligan | London mulligan would be great UX |
| 14 | No exile zone tracking | Cards just vanish on exile |
| 15 | Menace not enforced | Treat as pseudo-unblockable until multi-block |
| 16 | Ward not enforced | Need mana cost modification UI |
| 17 | Protection not enforced | Complex — color-based blocking/targeting/damage prevention |
| 18 | Double strike just doubles damage | Should be two damage steps |
| 19 | Brainstorm is "draw 3" not "draw 3, put 2 back" | Strictly better than real card |
| 20 | Sengir Vampire death trigger | Needs damage-source tracking |
| 21 | No upkeep step | Matters for future cards with upkeep triggers |
| 22 | Summoning sickness doesn't block tap abilities | Need check in activateAbility() |

---

## Quick-Start: The 5 Fixes That Make the Biggest Difference

If you only do 5 things, do these:

1. **Main Phase 2** — Change `this.state.phase = 'end'` to `this.state.phase = 'main'` in `resolveCombat()` and let the player play cards post-combat.

2. **Fix Llanowar Elves** — Add `mana_dork` check in `parseActivatedAbility()`:
   ```js
   // At the top of parseActivatedAbility():
   if (card?.abilities?.includes('mana_dork')) {
     return { cost: 'tap', type: 'mana', amount: 1 }
   }
   ```

3. **Fix lifelink with trample** — Remove the duplicate lifelink heal from the trample block (line 818). Let the general lifelink handler (line 824-828) cover it.

4. **Block sorceries during instant window** — In BattleScreen's handleCastSpell, add:
   ```js
   if (card.type === 'sorcery' && gameState.activePlayer !== 'player') {
     return showMessage("Sorceries can only be cast on your own turn")
   }
   ```

5. **Fix deathtouch** — Don't inflate damage. Instead, add a flag during combat and check it in `_destroyDamaged()`:
   ```js
   // In resolveCombat, after calculating damage:
   if (attackerDT) blockerSlot._deathtouched = true
   if (blockerDT) attackerSlot._deathtouched = true

   // In _destroyDamaged:
   if (slot.damage >= slot.card.toughness || (slot._deathtouched && slot.damage > 0)) {
     // destroyed
   }
   ```

---

*"The rules of mana are older than the Academy itself. We merely teach them — we do not bend them."*
— Archon Tasklet, from the Founder's Treatise on Tactical Mana Theory
