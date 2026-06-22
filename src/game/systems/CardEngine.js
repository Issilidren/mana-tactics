// CardEngine.js — Pure JS MTG rules engine (no React, no Phaser)

// ── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function flattenDeck(deckCards) {
  const flat = []
  for (const entry of deckCards) {
    const card = entry.card || entry
    const qty = entry.quantity || 1
    for (let i = 0; i < qty; i++) flat.push({ ...card })
  }
  return flat
}

export function getManaCost(card) {
  if (!card.mana_cost) return card.type === 'land' ? 0 : 1
  const total = Object.values(card.mana_cost).reduce((a, b) => a + b, 0)
  // Non-land cards with zero or empty mana_cost get a floor of 1
  if (total === 0 && card.type !== 'land') return 1
  return total
}

// Basic land definitions — injected if player deck has no lands
const BASIC_LANDS = {
  white:     { id: '00000001-0000-0000-0000-000000000016', name: 'Plains',   type: 'land', color: 'white', mana_cost: null, power: null, toughness: null, rarity: 'common', description: 'Tap: Add W', abilities: [] },
  blue:      { id: '00000001-0000-0000-0000-000000000017', name: 'Island',   type: 'land', color: 'blue',  mana_cost: null, power: null, toughness: null, rarity: 'common', description: 'Tap: Add U', abilities: [] },
  black:     { id: '00000001-0000-0000-0000-000000000018', name: 'Swamp',    type: 'land', color: 'black', mana_cost: null, power: null, toughness: null, rarity: 'common', description: 'Tap: Add B', abilities: [] },
  red:       { id: '00000001-0000-0000-0000-000000000019', name: 'Mountain', type: 'land', color: 'red',   mana_cost: null, power: null, toughness: null, rarity: 'common', description: 'Tap: Add R', abilities: [] },
  green:     { id: '00000001-0000-0000-0000-000000000020', name: 'Forest',   type: 'land', color: 'green', mana_cost: null, power: null, toughness: null, rarity: 'common', description: 'Tap: Add G', abilities: [] },
  colorless: { id: '00000001-0000-0000-0000-000000000016', name: 'Plains',   type: 'land', color: 'white', mana_cost: null, power: null, toughness: null, rarity: 'common', description: 'Tap: Add W', abilities: [] },
}

function ensureLands(deckCards, color) {
  const hasLands = deckCards.some(c => c.type === 'land')
  if (hasLands) return deckCards
  const land = BASIC_LANDS[color] || BASIC_LANDS.white
  const lands = Array.from({ length: 8 }, () => ({ ...land }))
  return [...deckCards, ...lands]
}

// Parse spell effects from description string
function parseSpellEffect(description) {
  if (!description) return null
  const desc = description.toLowerCase()

  const dealMatch = desc.match(/deal (\d+) damage/)
  if (dealMatch) return { type: 'damage', amount: parseInt(dealMatch[1]) }

  const drawMatch = desc.match(/draw (\d+) cards?/)
  if (drawMatch) return { type: 'draw', amount: parseInt(drawMatch[1]) }

  if (desc.includes('counter target spell') || desc.includes('discard a card from opponent')) {
    return { type: 'counter' }
  }

  if (desc.includes('destroy target creature') || desc.includes('destroy target')) {
    return { type: 'destroy' }
  }

  const pumpMatch = desc.match(/\+(\d+)\/\+(\d+) until end of turn/)
  if (pumpMatch) return { type: 'pump', power: parseInt(pumpMatch[1]), toughness: parseInt(pumpMatch[2]) }

  const manaMatch = desc.match(/add (\d+) mana/)
  if (manaMatch) return { type: 'mana', amount: parseInt(manaMatch[1]) }

  // ability-based fallbacks
  return null
}

// ── CardEngine class ─────────────────────────────────────────────────────────

export class CardEngine {
  constructor(playerDeck, aiDeck, playerColor = 'white') {
    this.state = this.initState(playerDeck, aiDeck, playerColor)
    this._tempBuffs = []
  }

  initState(playerDeck, aiDeck, playerColor) {
    const playerCards = ensureLands(flattenDeck(playerDeck), playerColor)
    const aiCards     = ensureLands(flattenDeck(aiDeck),     'colorless')
    return {
      turn: 1,
      phase: 'draw',
      activePlayer: 'player',
      player: {
        life: 10,
        hand: [],
        battlefield: [],  // { card, tapped, summoningSick, damage } — creatures/enchantments/artifacts
        lands: [],        // { card, tapped } — land permanents
        graveyard: [],
        library: shuffle([...playerCards]),
        availableMana: 0,
        landsPlayedThisTurn: 0,
        landLimit: 1,
      },
      ai: {
        life: 10,
        hand: [],
        battlefield: [],
        lands: [],
        graveyard: [],
        library: shuffle([...aiCards]),
        availableMana: 0,
        landsPlayedThisTurn: 0,
        landLimit: 1,
      },
      attackers: [],     // indices into active player's battlefield
      blockers: {},      // { attackerIndex: blockerIndex } from defending player's battlefield
      log: [],
      winner: null,
    }
  }

  _log(msg) {
    this.state.log = [...this.state.log.slice(-49), msg]
  }

  _player(who) {
    return this.state[who]
  }

  _opponent(who) {
    return who === 'player' ? this.state.ai : this.state.player
  }

  _opponentName(who) {
    return who === 'player' ? 'ai' : 'player'
  }

  // ── Game Flow ───────────────────────────────────────────────────────────────

  drawCard(who) {
    const p = this._player(who)
    if (p.library.length === 0) {
      this._log(`${who} has no cards left — ${who} loses!`)
      this.state.winner = who === 'player' ? 'ai' : 'player'
      return false
    }
    const card = p.library.shift()
    p.hand = [...p.hand, card]
    this._log(`${who} draws ${card.name}`)
    return true
  }

  startTurn(who) {
    const p = this._player(who)
    const { turn } = this.state

    // Untap all permanents and lands
    p.battlefield = p.battlefield.map(slot => ({ ...slot, tapped: false, summoningSick: false }))
    p.lands = p.lands.map(l => ({ ...l, tapped: false }))

    // Available mana = number of untapped lands
    p.availableMana = p.lands.length
    p.landsPlayedThisTurn = 0

    this.state.phase = 'draw'
    this._log(`Turn ${turn} — ${who}'s turn. Lands: ${p.lands.length}, Mana: ${p.availableMana}`)

    this.drawCard(who)
    this.state.phase = 'main'
    this.checkWinner()
  }

  playLand(who, handIndex) {
    const p = this._player(who)
    if (p.landsPlayedThisTurn >= p.landLimit) return { ok: false, error: 'Already played a land this turn' }
    if (handIndex < 0 || handIndex >= p.hand.length) return { ok: false, error: 'Invalid hand index' }
    const card = p.hand[handIndex]
    if (!card || card.type !== 'land') return { ok: false, error: 'Not a land card' }

    p.hand = p.hand.filter((_, i) => i !== handIndex)
    p.lands = [...p.lands, { card, tapped: false }]
    p.landsPlayedThisTurn += 1
    p.availableMana += 1
    this._log(`${who} plays ${card.name} (mana now: ${p.availableMana})`)
    return { ok: true }
  }

  castCreature(who, handIndex) {
    const p = this._player(who)
    if (handIndex < 0 || handIndex >= p.hand.length) return { ok: false, error: 'Invalid hand index' }

    const card = p.hand[handIndex]
    if (card.type !== 'creature') return { ok: false, error: 'Not a creature card' }

    const cost = getManaCost(card)
    if (p.availableMana < cost) return { ok: false, error: `Need ${cost} mana — tap more lands first (have ${p.availableMana})` }

    p.availableMana -= cost
    this._tapLandsForCost(p, cost)
    p.hand = p.hand.filter((_, i) => i !== handIndex)

    // Haste creatures enter without summoning sickness
    const hasteCard = card.abilities && card.abilities.includes('haste')
    p.battlefield = [...p.battlefield, { card, tapped: false, summoningSick: !hasteCard, damage: 0 }]

    this._log(`${who} casts ${card.name} (${cost} mana)`)

    // Lifegain on enter
    if (card.abilities && card.abilities.includes('lifegain_enter')) {
      p.life += 2
      this._log(`${who} gains 2 life from ${card.name} (life: ${p.life})`)
    }

    this.checkWinner()
    return { ok: true }
  }

  castSpell(who, handIndex, targetIndex, targetType = 'player') {
    // targetType: 'player' (opposing player), 'creature' (creature on battlefield)
    // targetIndex: index into the target's battlefield (if targetType === 'creature')
    const p = this._player(who)
    const opp = this._opponent(who)
    const oppName = this._opponentName(who)

    if (handIndex < 0 || handIndex >= p.hand.length) return { ok: false, error: 'Invalid hand index' }

    const card = p.hand[handIndex]
    if (card.type !== 'instant' && card.type !== 'sorcery' && card.type !== 'spell') {
      return { ok: false, error: 'Not a spell card' }
    }

    const cost = getManaCost(card)
    if (p.availableMana < cost) return { ok: false, error: `Need ${cost} mana — tap more lands first (have ${p.availableMana})` }

    p.availableMana -= cost
    this._tapLandsForCost(p, cost)
    p.hand = p.hand.filter((_, i) => i !== handIndex)

    const effect = parseSpellEffect(card.description) || this._effectFromAbilities(card)

    let applied = false
    if (effect) {
      switch (effect.type) {
        case 'damage': {
          if (targetType === 'creature') {
            if (targetIndex < 0 || targetIndex >= opp.battlefield.length) {
              // deal to player instead
              opp.life -= effect.amount
              this._log(`${card.name} deals ${effect.amount} damage to ${oppName} (life: ${opp.life})`)
            } else {
              const slot = opp.battlefield[targetIndex]
              slot.damage += effect.amount
              this._log(`${card.name} deals ${effect.amount} damage to ${slot.card.name}`)
              this._destroyDamaged(oppName)
            }
          } else {
            opp.life -= effect.amount
            this._log(`${card.name} deals ${effect.amount} damage to ${oppName} (life: ${opp.life})`)
          }
          applied = true
          break
        }
        case 'draw': {
          for (let i = 0; i < effect.amount; i++) this.drawCard(who)
          applied = true
          break
        }
        case 'counter': {
          if (opp.hand.length > 0) {
            const discarded = opp.hand[opp.hand.length - 1]
            opp.hand = opp.hand.slice(0, -1)
            opp.graveyard = [...opp.graveyard, discarded]
            this._log(`${card.name} counters — ${oppName} discards ${discarded.name}`)
          } else {
            this._log(`${card.name} counters but ${oppName} has no cards in hand`)
          }
          applied = true
          break
        }
        case 'destroy': {
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            opp.graveyard = [...opp.graveyard, slot.card]
            opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} destroys ${slot.card.name}`)
          } else {
            this._log(`${card.name} has no valid target`)
          }
          applied = true
          break
        }
        case 'pump': {
          // pump own creature
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            slot.card = {
              ...slot.card,
              power: slot.card.power + effect.power,
              toughness: slot.card.toughness + effect.toughness,
            }
            this._tempBuffs.push({ who, bfIndex: targetIndex, power: effect.power, toughness: effect.toughness })
            this._log(`${slot.card.name} gets +${effect.power}/+${effect.toughness} until end of turn`)
          }
          applied = true
          break
        }
        case 'mana': {
          p.availableMana += effect.amount
          this._log(`${card.name} adds ${effect.amount} mana (pool: ${p.availableMana})`)
          applied = true
          break
        }
        default:
          this._log(`${card.name} resolves (no recognized effect)`)
          applied = true
      }
    } else {
      this._log(`${card.name} resolves`)
      applied = true
    }

    p.graveyard = [...p.graveyard, card]
    this.checkWinner()
    return { ok: true, applied }
  }

  _tapLandsForCost(p, cost) {
    let tapped = 0
    p.lands = p.lands.map(l => {
      if (!l.tapped && tapped < cost) { tapped++; return { ...l, tapped: true } }
      return l
    })
  }

  _effectFromAbilities(card) {
    if (!card.abilities) return null
    if (card.abilities.includes('damage')) return { type: 'damage', amount: 3 }
    if (card.abilities.includes('draw')) return { type: 'draw', amount: 3 }
    if (card.abilities.includes('counter')) return { type: 'counter' }
    if (card.abilities.includes('destroy')) return { type: 'destroy' }
    if (card.abilities.includes('pump')) return { type: 'pump', power: 3, toughness: 3 }
    if (card.abilities.includes('mana_burst')) return { type: 'mana', amount: 3 }
    return null
  }

  declareAttackers(attackerIndices) {
    const who = this.state.activePlayer
    const p = this._player(who)
    // Filter to valid attackers: creatures that aren't tapped and not summoning sick
    const valid = attackerIndices.filter(i => {
      const slot = p.battlefield[i]
      return slot && !slot.tapped && !slot.summoningSick && slot.card.type === 'creature'
    })
    this.state.attackers = valid
    if (valid.length > 0) {
      const names = valid.map(i => p.battlefield[i].card.name).join(', ')
      this._log(`${who} attacks with: ${names}`)
    }
    this.state.phase = 'combat'
    return { ok: true, attackers: valid }
  }

  declareBlockers(blockerMap) {
    // blockerMap: { attackerIndex: blockerIndex } — blocker is from defending player's battlefield
    this.state.blockers = blockerMap
    const who = this._opponentName(this.state.activePlayer)
    const opp = this._player(who)
    for (const [ai, bi] of Object.entries(blockerMap)) {
      const blocker = opp.battlefield[bi]
      if (blocker) this._log(`${who} blocks attacker[${ai}] with ${blocker.card.name}`)
    }
    return { ok: true }
  }

  resolveCombat() {
    const attackerWho = this.state.activePlayer
    const defenderWho = this._opponentName(attackerWho)
    const attackerPlayer = this._player(attackerWho)
    const defenderPlayer = this._player(defenderWho)

    const attackers = this.state.attackers
    const blockers = this.state.blockers

    for (const attackerIdx of attackers) {
      const attackerSlot = attackerPlayer.battlefield[attackerIdx]
      if (!attackerSlot) continue

      attackerSlot.tapped = true  // tap attacker

      const blockerIdx = blockers[attackerIdx]
      if (blockerIdx !== undefined && blockerIdx !== null) {
        // Blocked combat
        const blockerSlot = defenderPlayer.battlefield[blockerIdx]
        if (!blockerSlot) {
          // Blocker was removed, damage goes through
          defenderPlayer.life -= attackerSlot.card.power
          this._log(`${attackerSlot.card.name} is unblocked — deals ${attackerSlot.card.power} to ${defenderWho} (life: ${defenderPlayer.life})`)
          continue
        }

        const attackPow = attackerSlot.card.power
        const blockPow = blockerSlot.card.power

        // First strike: attacker with first strike deals damage first
        const attackerFirstStrike = attackerSlot.card.abilities && attackerSlot.card.abilities.includes('first_strike')

        attackerSlot.damage += blockPow
        blockerSlot.damage += attackPow

        this._log(`${attackerSlot.card.name} (${attackPow}/${attackerSlot.card.toughness}) vs ${blockerSlot.card.name} (${blockPow}/${blockerSlot.card.toughness})`)

        // Trample: excess damage goes through to player
        const trample = attackerSlot.card.abilities && attackerSlot.card.abilities.includes('trample')
        if (trample) {
          const excess = Math.max(0, attackPow - blockerSlot.card.toughness)
          if (excess > 0) {
            defenderPlayer.life -= excess
            this._log(`${attackerSlot.card.name} tramples for ${excess} to ${defenderWho} (life: ${defenderPlayer.life})`)
          }
        }
      } else {
        // Unblocked — deal damage to defending player
        defenderPlayer.life -= attackerSlot.card.power
        this._log(`${attackerSlot.card.name} unblocked — deals ${attackerSlot.card.power} to ${defenderWho} (life: ${defenderPlayer.life})`)
      }
    }

    // Destroy damaged creatures
    this._destroyDamaged(attackerWho)
    this._destroyDamaged(defenderWho)

    // Reset combat state
    this.state.attackers = []
    this.state.blockers = {}
    this.state.phase = 'end'

    this.checkWinner()
    return { ok: true }
  }

  _destroyDamaged(who) {
    const p = this._player(who)
    const dead = []
    const alive = []
    for (const slot of p.battlefield) {
      if (slot.damage >= slot.card.toughness) {
        dead.push(slot)
        p.graveyard = [...p.graveyard, slot.card]
        this._log(`${slot.card.name} is destroyed`)
      } else {
        alive.push(slot)
      }
    }
    p.battlefield = alive
  }

  endTurn(who) {
    // Remove temp buffs
    this._expireTempBuffs(who)

    // Clear per-turn combat damage from surviving creatures
    const p = this._player(who)
    p.battlefield = p.battlefield.map(slot => ({ ...slot, damage: 0 }))

    // Switch active player
    const next = who === 'player' ? 'ai' : 'player'
    this.state.activePlayer = next

    // Increment turn only when player's turn ends (full round)
    if (who === 'ai') {
      this.state.turn += 1
    }

    this.state.phase = 'draw'
    this._log(`--- Turn passed to ${next} ---`)

    return { ok: true, nextPlayer: next }
  }

  _expireTempBuffs(who) {
    const remove = this._tempBuffs.filter(b => b.who === who)
    this._tempBuffs = this._tempBuffs.filter(b => b.who !== who)

    const p = this._player(who)
    for (const buff of remove) {
      const slot = p.battlefield[buff.bfIndex]
      if (slot) {
        slot.card = {
          ...slot.card,
          power: slot.card.power - buff.power,
          toughness: slot.card.toughness - buff.toughness,
        }
      }
    }
  }

  checkWinner() {
    if (this.state.winner) return this.state.winner
    if (this.state.player.life <= 0) {
      this.state.winner = 'ai'
      this._log('Player life reaches 0 — AI wins!')
    } else if (this.state.ai.life <= 0) {
      this.state.winner = 'player'
      this._log('AI life reaches 0 — Player wins!')
    }
    return this.state.winner
  }

  // Convenience: get a snapshot of state (shallow copy)
  getState() {
    return { ...this.state }
  }
}
