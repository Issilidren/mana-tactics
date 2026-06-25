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
  if (total === 0 && card.type !== 'land') return 1
  return total
}

// Normalize ability string — handles both 'first_strike' and 'first strike'
function hasAbility(card, ab) {
  if (!card.abilities) return false
  const normalized = ab.toLowerCase().replace(/[\s_]/g, '')
  return card.abilities.some(a => a.toLowerCase().replace(/[\s_]/g, '') === normalized)
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

// ── Spell effect parser ───────────────────────────────────────────────────────
// Reads the card's Oracle description text and returns a structured effect.
// Falls back to the abilities array via _effectFromAbilities when text is unrecognized.
function parseSpellEffect(description) {
  if (!description) return null
  const desc = description.toLowerCase()

  // Damage effects
  const dealMatch = desc.match(/deal[s]? (\d+) damage/) || desc.match(/deals? (\d+) damage/)
  if (dealMatch) return { type: 'damage', amount: parseInt(dealMatch[1]) }

  // Draw effects
  const drawMatch = desc.match(/draw (\d+) cards?/)
  if (drawMatch) return { type: 'draw', amount: parseInt(drawMatch[1]) }
  if (desc.includes('draw a card') && !desc.includes('draw a card for each')) return { type: 'draw', amount: 1 }

  // Lifegain effects — check before counter to avoid "gain life" in other text
  const gainMatch = desc.match(/(?:you )?gain (\d+) life/) || desc.match(/gains? (\d+) life/)
  if (gainMatch) return { type: 'lifegain', amount: parseInt(gainMatch[1]) }

  // Counters / discard
  if (desc.includes('counter target spell') || desc.includes('negate') || desc.includes('counter target')) {
    return { type: 'counter' }
  }

  // Board wipes — check before single-target destroy
  if (
    desc.includes('destroy all creatures') ||
    desc.includes('destroy all nonland') ||
    desc.includes('exile all creatures') ||
    desc.includes('all creatures get') ||
    desc.includes('deals damage equal') ||
    desc.match(/destroy all/)
  ) {
    return { type: 'boardwipe' }
  }

  // Exile target (treat as destroy but no graveyard)
  if (
    desc.includes('exile target creature') ||
    desc.includes('exile target') ||
    (desc.includes('exile') && (desc.includes('target') || desc.includes('creature')))
  ) {
    return { type: 'exile' }
  }

  // Destroy target
  if (desc.includes('destroy target creature') || desc.includes('destroy target')) {
    return { type: 'destroy' }
  }

  // Bounce — return to hand
  if (
    desc.includes('return target creature') ||
    desc.includes("return target") ||
    desc.includes("return target nonland permanent") ||
    desc.includes('return to') && desc.includes("hand")
  ) {
    return { type: 'bounce' }
  }

  // Mill
  const millMatch = desc.match(/mill (\d+)/) ||
    desc.match(/put the top (\d+) cards? of (?:target )?(?:their|your|a) library into (?:their|your|the) graveyard/) ||
    desc.match(/target player puts? the top (\d+)/)
  if (millMatch) return { type: 'mill', amount: parseInt(millMatch[1]) }

  // Pump — +N/+N until end of turn
  const pumpMatch = desc.match(/\+(\d+)\/\+(\d+) until end of turn/)
  if (pumpMatch) return { type: 'pump', power: parseInt(pumpMatch[1]), toughness: parseInt(pumpMatch[2]) }

  // Mana burst
  const manaMatch = desc.match(/add (\d+) mana/) || desc.match(/add {(\d+)} to your mana pool/)
  if (manaMatch) return { type: 'mana', amount: parseInt(manaMatch[1]) }

  // Discard — target player discards
  const discardMatch = desc.match(/discards? (\d+) cards?/) || desc.match(/target player discards/)
  if (discardMatch) {
    const amount = discardMatch[1] ? parseInt(discardMatch[1]) : 1
    return { type: 'discard', amount, target: 'opponent' }
  }

  // Search / tutor effects
  if (
    desc.includes('search your library') ||
    desc.includes('searches? your library') ||
    desc.includes('tutor') ||
    desc.includes('from outside the game') ||
    desc.includes('mastermind')
  ) {
    return { type: 'search' }
  }

  // Token creation — simplified: summon a small creature
  const tokenMatch = desc.match(/create (\d+) (\d+)\/(\d+) (?:\w+ )*creature token/)
  if (tokenMatch) {
    return { type: 'token', count: parseInt(tokenMatch[1]), power: parseInt(tokenMatch[2]), toughness: parseInt(tokenMatch[3]) }
  }
  if (desc.includes('create') && desc.includes('token')) {
    return { type: 'token', count: 1, power: 1, toughness: 1 }
  }

  return null
}

// ── ETB trigger parser ────────────────────────────────────────────────────────
function parseETBEffect(description) {
  if (!description) return null
  const desc = description.toLowerCase()
  // Match "when [card name / ~ / this / it] enters [the battlefield][,] [effect]"
  const m = desc.match(/when (?:~|this|.+?) enters(?: the battlefield)?[,\s]+(.+?)(?:\.|;|$)/)
  if (m) return parseSpellEffect(m[1].trim())
  // Fallback: plain "enters the battlefield," pattern
  const m2 = desc.match(/enters the battlefield[,:\s]+(.+?)(?:\.|;|$)/)
  if (m2) return parseSpellEffect(m2[1].trim())
  return null
}

// ── Activated ability parser ──────────────────────────────────────────────────
function parseActivatedAbility(description) {
  if (!description) return null
  const desc = description.toLowerCase()
  if (desc.match(/(?:\{t\}|tap): add/)) return { cost: 'tap', type: 'mana', amount: 1 }
  const dmg = desc.match(/(?:\{t\}|tap): .*deal[s]? (\d+) damage/)
  if (dmg) return { cost: 'tap', type: 'damage', amount: parseInt(dmg[1]) }
  if (desc.match(/(?:\{t\}|tap): draw/)) return { cost: 'tap', type: 'draw', amount: 1 }
  return null
}

// ── CardEngine class ─────────────────────────────────────────────────────────

export class CardEngine {
  constructor(playerDeck, aiDeck, playerColor = 'white', tutorialMode = false) {
    this.state = this.initState(playerDeck, aiDeck, playerColor)
    this._tempBuffs = []
    this._tokenCounter = 0
    this.tutorialMode = tutorialMode
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
        battlefield: [],  // { card, tapped, summoningSick, damage }
        lands: [],        // { card, tapped }
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
      attackers: [],
      blockers: {},
      log: [],
      winner: null,
    }
  }

  _log(msg) {
    this.state.log = [...this.state.log.slice(-49), msg]
  }

  _player(who) { return this.state[who] }
  _opponent(who) { return who === 'player' ? this.state.ai : this.state.player }
  _opponentName(who) { return who === 'player' ? 'ai' : 'player' }

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
    if (who === 'ai') {
      this._log(this.tutorialMode
        ? `Kael shows you: drew ${card.name}.`
        : 'Opponent draws a card.')
    } else {
      this._log(`You draw ${card.name}`)
    }
    return true
  }

  startTurn(who) {
    const p = this._player(who)
    const { turn } = this.state

    p.battlefield = p.battlefield.map(slot => ({ ...slot, tapped: false, summoningSick: false }))
    p.lands = p.lands.map(l => ({ ...l, tapped: false }))
    p.availableMana = p.lands.length
    p.landsPlayedThisTurn = 0

    this.state.phase = 'draw'
    this._log(`Turn ${turn} — ${who}'s turn. Lands: ${p.lands.length}, Mana: ${p.availableMana}`)

    // Tutorial tips at specific player turn milestones
    if (this.tutorialMode && who === 'player') {
      if (turn === 1)
        this._log('Kael: "Play a land first. Even beginners know that."')
      else if (turn === 2)
        this._log('Kael: "Now spend that mana — select a creature and hit Play Creature."')
      else if (turn === 3)
        this._log(`Kael: "When you're ready — Attack, pick your creatures, Confirm. Go on."`)
      else if (turn === 4)
        this._log('Kael: "Spells target the player or a creature on the field. Try one."')
    }

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

    const hasHaste = hasAbility(card, 'haste')
    p.battlefield = [...p.battlefield, { card, tapped: false, summoningSick: !hasHaste, damage: 0 }]

    this._log(`${who} casts ${card.name} (${cost} mana)`)

    if (hasAbility(card, 'lifegain_enter')) {
      p.life += 2
      this._log(`${who} gains 2 life from ${card.name} (life: ${p.life})`)
    }

    // ETB effect from Oracle text
    const etbEffect = parseETBEffect(card.description)
    if (etbEffect) {
      const etbResult = this._resolveETBEffect(who, card, etbEffect)
      if (etbResult?.needsTarget) {
        this.checkWinner()
        return { ok: true, needsETBTarget: { card, effect: etbEffect } }
      }
    }

    this.checkWinner()
    return { ok: true }
  }

  castSpell(who, handIndex, targetIndex, targetType = 'player') {
    const p = this._player(who)
    const opp = this._opponent(who)
    const oppName = this._opponentName(who)

    if (handIndex < 0 || handIndex >= p.hand.length) return { ok: false, error: 'Invalid hand index' }

    const card = p.hand[handIndex]
    if (card.type !== 'instant' && card.type !== 'sorcery' && card.type !== 'spell') {
      return { ok: false, error: 'Not a spell card' }
    }

    // Sorcery timing: only during your own main phase
    if (card.type === 'sorcery') {
      if (this.state.activePlayer !== who) {
        return { ok: false, error: 'Sorceries can only be cast on your own turn' }
      }
      if (this.state.phase !== 'main' && this.state.phase !== 'main2') {
        return { ok: false, error: 'Sorceries can only be cast during a main phase' }
      }
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
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            slot.damage += effect.amount
            this._log(`${card.name} deals ${effect.amount} damage to ${slot.card.name}`)
            this._destroyDamaged(oppName)
          } else if ((targetType === 'creature' || targetType === 'own_creature') && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            // Can target own creature (e.g. Giant Growth targets own)
            const slot = p.battlefield[targetIndex]
            slot.damage += effect.amount
            this._log(`${card.name} deals ${effect.amount} damage to ${slot.card.name}`)
            this._destroyDamaged(who)
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
        case 'lifegain': {
          p.life += effect.amount
          this._log(`${card.name} — ${who} gains ${effect.amount} life (life: ${p.life})`)
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
        case 'discard': {
          const count = Math.min(effect.amount || 1, opp.hand.length)
          const discarded = opp.hand.slice(-count)
          opp.hand = opp.hand.slice(0, -count)
          opp.graveyard = [...opp.graveyard, ...discarded]
          this._log(`${card.name} — ${oppName} discards ${count} card(s)`)
          applied = true
          break
        }
        case 'destroy': {
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            opp.graveyard = [...opp.graveyard, slot.card]
            opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} destroys ${slot.card.name}`)
          } else if (targetType === 'own_creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            p.graveyard = [...p.graveyard, slot.card]
            p.battlefield = p.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} destroys own ${slot.card.name}`)
          } else {
            this._log(`${card.name} — no valid target to destroy`)
          }
          applied = true
          break
        }
        case 'exile': {
          // Exile is like destroy but doesn't go to graveyard
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} exiles ${slot.card.name}`)
          } else if (targetType === 'own_creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            p.battlefield = p.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} exiles own ${slot.card.name}`)
          } else {
            this._log(`${card.name} — no valid target to exile`)
          }
          applied = true
          break
        }
        case 'bounce': {
          // Return target creature to owner's hand
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            opp.hand = [...opp.hand, slot.card]
            opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} returns ${slot.card.name} to ${oppName}'s hand`)
          } else if ((targetType === 'creature' || targetType === 'own_creature') && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            p.hand = [...p.hand, slot.card]
            p.battlefield = p.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} returns ${slot.card.name} to ${who}'s hand`)
          } else {
            this._log(`${card.name} — no valid target to bounce`)
          }
          applied = true
          break
        }
        case 'boardwipe': {
          const killedOpp = opp.battlefield.map(s => s.card)
          const killedSelf = p.battlefield.map(s => s.card)
          opp.graveyard = [...opp.graveyard, ...killedOpp]
          p.graveyard = [...p.graveyard, ...killedSelf]
          opp.battlefield = []
          p.battlefield = []
          this._log(`${card.name} — ALL creatures destroyed!`)
          applied = true
          break
        }
        case 'mill': {
          for (let i = 0; i < effect.amount; i++) {
            const milled = opp.library.shift()
            if (milled) opp.graveyard = [...opp.graveyard, milled]
          }
          this._log(`${card.name} mills ${effect.amount} cards from ${oppName}'s library`)
          applied = true
          break
        }
        case 'pump': {
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            slot.card = {
              ...slot.card,
              power:     slot.card.power     + effect.power,
              toughness: slot.card.toughness + effect.toughness,
            }
            this._tempBuffs.push({ who, bfIndex: targetIndex, power: effect.power, toughness: effect.toughness })
            this._log(`${slot.card.name} gets +${effect.power}/+${effect.toughness} until end of turn`)
          }
          applied = true
          break
        }
        case 'token': {
          const tk = {
            id: `token-${++this._tokenCounter}`,
            name: `${effect.power}/${effect.toughness} Token`,
            type: 'creature',
            color: card.color || 'colorless',
            mana_cost: null,
            power: effect.power,
            toughness: effect.toughness,
            abilities: [],
            description: 'Token creature.',
          }
          for (let n = 0; n < effect.count; n++) {
            p.battlefield = [...p.battlefield, { card: { ...tk }, tapped: false, summoningSick: false, damage: 0 }]
          }
          this._log(`${card.name} creates ${effect.count} ${effect.power}/${effect.toughness} token(s)`)
          applied = true
          break
        }
        case 'mana': {
          p.availableMana += effect.amount
          this._log(`${card.name} adds ${effect.amount} mana (pool: ${p.availableMana})`)
          applied = true
          break
        }
        case 'search': {
          // Signal to BattleScreen that player must choose a card from their library
          p.graveyard = [...p.graveyard, card]
          this.checkWinner()
          return { ok: true, applied: true, needsChoice: 'search', library: [...p.library] }
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

  // Called after player picks a card from their library (search effect)
  completeSearch(who, cardId) {
    const p = this._player(who)
    const idx = p.library.findIndex(c => c.id === cardId)
    if (idx < 0) return { ok: false, error: 'Card not found in library' }
    const found = p.library.splice(idx, 1)[0]
    p.library = shuffle([...p.library])
    p.hand = [...p.hand, found]
    this._log(`${who} searches library and finds ${found.name}`)
    return { ok: true }
  }

  // Called when player wishes for a card from "outside the game" (their collection)
  completeWish(who, card) {
    const p = this._player(who)
    p.hand = [...p.hand, { ...card }]
    this._log(`${who} wishes for ${card.name}`)
    return { ok: true }
  }

  _resolveETBEffect(who, card, effect, targetIdx = -1) {
    const p = this._player(who)
    const opp = this._opponent(who)
    const oppName = this._opponentName(who)

    switch (effect.type) {
      case 'draw':
        for (let i = 0; i < effect.amount; i++) this.drawCard(who)
        this._log(`${card.name} ETB — ${who} draws ${effect.amount} card(s)`)
        return { ok: true }
      case 'lifegain':
        p.life += effect.amount
        this._log(`${card.name} ETB — ${who} gains ${effect.amount} life (life: ${p.life})`)
        return { ok: true }
      case 'damage':
        if (targetIdx >= 0 && targetIdx < opp.battlefield.length) {
          opp.battlefield[targetIdx].damage += effect.amount
          this._log(`${card.name} ETB — deals ${effect.amount} damage to ${opp.battlefield[targetIdx].card.name}`)
          this._destroyDamaged(oppName)
        } else {
          opp.life -= effect.amount
          this._log(`${card.name} ETB — deals ${effect.amount} damage to ${oppName} (life: ${opp.life})`)
        }
        this.checkWinner()
        return { ok: true }
      case 'destroy':
      case 'exile':
      case 'bounce':
        if (targetIdx >= 0 && targetIdx < opp.battlefield.length) {
          const slot = opp.battlefield[targetIdx]
          if (effect.type === 'bounce') opp.hand = [...opp.hand, slot.card]
          else opp.graveyard = [...opp.graveyard, slot.card]
          opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIdx)
          this._log(`${card.name} ETB — ${effect.type}s ${slot.card.name}`)
          return { ok: true }
        } else if (opp.battlefield.length > 0 && who === 'player') {
          return { needsTarget: true, effect }
        } else if (opp.battlefield.length > 0) {
          // AI auto-targets first enemy creature
          const slot = opp.battlefield[0]
          if (effect.type === 'bounce') opp.hand = [...opp.hand, slot.card]
          else opp.graveyard = [...opp.graveyard, slot.card]
          opp.battlefield = opp.battlefield.slice(1)
          this._log(`${card.name} ETB — ${effect.type}s ${slot.card.name}`)
          return { ok: true }
        }
        return { ok: true }
      default:
        return { ok: true }
    }
  }

  completeETB(who, card, effect, targetIdx) {
    const result = this._resolveETBEffect(who, card, effect, targetIdx)
    this.checkWinner()
    return result
  }

  activateAbility(who, bfIdx) {
    const p = this._player(who)
    const opp = this._opponent(who)
    const oppName = this._opponentName(who)
    const slot = p.battlefield[bfIdx]
    if (!slot) return { ok: false, error: 'No creature at that position' }
    if (slot.tapped) return { ok: false, error: `${slot.card.name} is already tapped` }

    const ability = parseActivatedAbility(slot.card.description)
    if (!ability) return { ok: false, error: `${slot.card.name} has no activated ability` }

    slot.tapped = true

    switch (ability.type) {
      case 'mana':
        p.availableMana += ability.amount
        this._log(`${who} taps ${slot.card.name}: +${ability.amount} mana (pool: ${p.availableMana})`)
        return { ok: true }
      case 'damage':
        opp.life -= ability.amount
        this._log(`${who} taps ${slot.card.name}: deals ${ability.amount} damage to ${oppName} (life: ${opp.life})`)
        this.checkWinner()
        return { ok: true }
      case 'draw':
        this.drawCard(who)
        this._log(`${who} taps ${slot.card.name}: draws a card`)
        return { ok: true }
      default:
        return { ok: false, error: 'Unknown activated ability type' }
    }
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
    if (hasAbility(card, 'damage'))     return { type: 'damage', amount: 3 }
    if (hasAbility(card, 'draw'))       return { type: 'draw', amount: 1 }
    if (hasAbility(card, 'counter'))    return { type: 'counter' }
    if (hasAbility(card, 'destroy'))    return { type: 'destroy' }
    if (hasAbility(card, 'exile'))      return { type: 'exile' }
    if (hasAbility(card, 'bounce'))     return { type: 'bounce' }
    if (hasAbility(card, 'pump'))       return { type: 'pump', power: 3, toughness: 3 }
    if (hasAbility(card, 'mana_burst')) return { type: 'mana', amount: 3 }
    return null
  }

  // ── Combat ──────────────────────────────────────────────────────────────────

  declareAttackers(attackerIndices) {
    const who = this.state.activePlayer
    const p = this._player(who)
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
    const attackerWho = this.state.activePlayer
    const defenderWho = this._opponentName(attackerWho)
    const attackerPlayer = this._player(attackerWho)
    const defenderPlayer = this._player(defenderWho)

    // Validate each block assignment — enforce flying/reach rules at the engine level
    const validatedMap = {}
    for (const [ai, bi] of Object.entries(blockerMap)) {
      const attackerSlot = attackerPlayer.battlefield[ai]
      const blockerSlot  = defenderPlayer.battlefield[bi]
      if (!attackerSlot || !blockerSlot) continue

      // Flying attackers can only be blocked by flying or reach creatures
      if (hasAbility(attackerSlot.card, 'flying')) {
        const canBlock = hasAbility(blockerSlot.card, 'flying') || hasAbility(blockerSlot.card, 'reach')
        if (!canBlock) {
          this._log(`${blockerSlot.card.name} cannot block ${attackerSlot.card.name} (flying) — block ignored`)
          continue
        }
      }
      validatedMap[ai] = bi
      this._log(`${defenderWho} blocks attacker[${ai}] with ${blockerSlot.card.name}`)
    }
    this.state.blockers = validatedMap
    return { ok: true }
  }

  resolveCombat() {
    const attackerWho  = this.state.activePlayer
    const defenderWho  = this._opponentName(attackerWho)
    const attackerPlayer = this._player(attackerWho)
    const defenderPlayer = this._player(defenderWho)

    const attackers = this.state.attackers
    const blockers  = this.state.blockers
    const lifelinkHeals = []

    for (const attackerIdx of attackers) {
      const attackerSlot = attackerPlayer.battlefield[attackerIdx]
      if (!attackerSlot) continue

      // Vigilance — creature doesn't tap when attacking
      if (!hasAbility(attackerSlot.card, 'vigilance')) {
        attackerSlot.tapped = true
      }

      const blockerIdx = blockers[attackerIdx]

      if (blockerIdx !== undefined && blockerIdx !== null) {
        const blockerSlot = defenderPlayer.battlefield[blockerIdx]
        if (!blockerSlot) {
          // Blocker was removed — damage goes through to player
          const dmg = attackerSlot.card.power
          defenderPlayer.life -= dmg
          if (hasAbility(attackerSlot.card, 'lifelink')) {
            attackerPlayer.life += dmg
            lifelinkHeals.push({ who: attackerWho, amount: dmg })
            this._log(`${attackerSlot.card.name} lifelink — ${attackerWho} gains ${dmg} life`)
          }
          this._log(`${attackerSlot.card.name} unblocked (removed blocker) — deals ${dmg} to ${defenderWho} (life: ${defenderPlayer.life})`)
          continue
        }

        // Reach: flying attackers can only be blocked by flying or reach creatures
        if (hasAbility(attackerSlot.card, 'flying')) {
          const canBlock = hasAbility(blockerSlot.card, 'flying') || hasAbility(blockerSlot.card, 'reach')
          if (!canBlock) {
            this._log(`${blockerSlot.card.name} cannot block ${attackerSlot.card.name} (flying) — treating as unblocked`)
            const dmg = attackerSlot.card.power
            defenderPlayer.life -= dmg
            if (hasAbility(attackerSlot.card, 'lifelink')) { attackerPlayer.life += dmg; lifelinkHeals.push({ who: attackerWho, amount: dmg }) }
            continue
          }
        }

        const attackPow = attackerSlot.card.power
        const blockPow  = blockerSlot.card.power

        const attackerFS  = hasAbility(attackerSlot.card, 'first_strike') || hasAbility(attackerSlot.card, 'first strike')
        const attackerDS  = hasAbility(attackerSlot.card, 'double_strike') || hasAbility(attackerSlot.card, 'double strike')
        const blockerFS   = hasAbility(blockerSlot.card,  'first_strike') || hasAbility(blockerSlot.card,  'first strike')
        const blockerDS   = hasAbility(blockerSlot.card,  'double_strike') || hasAbility(blockerSlot.card, 'double strike')
        const attackerDT  = hasAbility(attackerSlot.card, 'deathtouch')
        const blockerDT   = hasAbility(blockerSlot.card,  'deathtouch')

        const trample     = hasAbility(attackerSlot.card, 'trample')

        // Damage dealt = actual power (deathtouch does NOT inflate damage)
        let dmgToBlocker  = attackPow
        let dmgToAttacker = blockPow

        // Double strike
        if (attackerDS) dmgToBlocker *= 2
        if (blockerDS)  dmgToAttacker *= 2

        // Deathtouch: any amount of damage is lethal
        const blockerLethal = attackerDT ? 1 : blockerSlot.card.toughness
        const attackerLethal = blockerDT ? 1 : attackerSlot.card.toughness

        // First strike sequencing
        const attackerHasStrike = attackerFS || attackerDS
        const blockerHasStrike  = blockerFS  || blockerDS

        if (attackerHasStrike && !blockerHasStrike) {
          if (dmgToBlocker >= blockerLethal) {
            dmgToAttacker = 0
            this._log(`${attackerSlot.card.name} first-strikes ${blockerSlot.card.name} before it can hit back`)
          }
        } else if (blockerHasStrike && !attackerHasStrike) {
          if (dmgToAttacker >= attackerLethal) {
            dmgToBlocker = 0
            this._log(`${blockerSlot.card.name} first-strikes ${attackerSlot.card.name} before it can hit back`)
          }
        }

        // Apply damage
        attackerSlot.damage += dmgToAttacker
        blockerSlot.damage  += dmgToBlocker

        // Deathtouch: if any damage dealt, force it to be lethal
        if (attackerDT && dmgToBlocker > 0) blockerSlot.damage = Math.max(blockerSlot.damage, blockerSlot.card.toughness)
        if (blockerDT  && dmgToAttacker > 0) attackerSlot.damage = Math.max(attackerSlot.damage, attackerSlot.card.toughness)

        this._log(`${attackerSlot.card.name} (${attackPow}/${attackerSlot.card.toughness}) vs ${blockerSlot.card.name} (${blockPow}/${blockerSlot.card.toughness})`)

        // Trample: with deathtouch only 1 dmg needed to kill blocker
        let totalDmgDealtByAttacker = dmgToBlocker
        if (trample) {
          const lethalNeeded = attackerDT ? 1 : blockerSlot.card.toughness
          const excess = Math.max(0, attackPow - lethalNeeded)
          if (excess > 0) {
            defenderPlayer.life -= excess
            totalDmgDealtByAttacker += excess
            this._log(`${attackerSlot.card.name} tramples for ${excess} to ${defenderWho} (life: ${defenderPlayer.life})`)
          }
        }

        // Lifelink: heals once based on TOTAL damage dealt
        if (hasAbility(attackerSlot.card, 'lifelink') && totalDmgDealtByAttacker > 0) {
          attackerPlayer.life += totalDmgDealtByAttacker
          lifelinkHeals.push({ who: attackerWho, amount: totalDmgDealtByAttacker })
          this._log(`${attackerSlot.card.name} lifelink — ${attackerWho} gains ${totalDmgDealtByAttacker} life (life: ${attackerPlayer.life})`)
        }
        if (hasAbility(blockerSlot.card, 'lifelink') && dmgToAttacker > 0) {
          defenderPlayer.life += dmgToAttacker
          lifelinkHeals.push({ who: defenderWho, amount: dmgToAttacker })
          this._log(`${blockerSlot.card.name} lifelink — ${defenderWho} gains ${dmgToAttacker} life (life: ${defenderPlayer.life})`)
        }

      } else {
        // Unblocked — deal damage directly to defending player
        const dmg = attackerSlot.card.power
        defenderPlayer.life -= dmg

        if (hasAbility(attackerSlot.card, 'lifelink')) {
          attackerPlayer.life += dmg
          lifelinkHeals.push({ who: attackerWho, amount: dmg })
          this._log(`${attackerSlot.card.name} lifelink — ${attackerWho} gains ${dmg} life`)
        }
        this._log(`${attackerSlot.card.name} unblocked — deals ${dmg} to ${defenderWho} (life: ${defenderPlayer.life})`)
      }
    }

    this._destroyDamaged(attackerWho)
    this._destroyDamaged(defenderWho)

    this.state.attackers = []
    this.state.blockers  = {}
    this.state.phase = 'main2'         // Main Phase 2: play more cards after combat

    this.checkWinner()
    return { ok: true, lifelinkHeals }
  }

  _destroyDamaged(who) {
    const p = this._player(who)
    const alive = []
    for (const slot of p.battlefield) {
      if (slot.damage >= slot.card.toughness) {
        p.graveyard = [...p.graveyard, slot.card]
        this._log(`${slot.card.name} is destroyed (${slot.damage} damage / ${slot.card.toughness} toughness)`)
      } else {
        alive.push(slot)
      }
    }
    p.battlefield = alive
  }

  endTurn(who) {
    this._expireTempBuffs(who)

    const p = this._player(who)
    p.battlefield = p.battlefield.map(slot => ({ ...slot, damage: 0 }))

    const next = who === 'player' ? 'ai' : 'player'
    this.state.activePlayer = next

    if (who === 'ai') this.state.turn += 1

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
          power:     slot.card.power     - buff.power,
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

  getState() { return { ...this.state } }
}
