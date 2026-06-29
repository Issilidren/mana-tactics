// CardEngine.js — Pure JS MTG rules engine (no React, no Phaser)

// ── Helpers ──────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// MTG keyword abilities to detect in oracle text.
// Order matters: multi-word keywords come before their component words.
const KEYWORD_LIST = [
  'first strike', 'double strike',
  'flying', 'haste', 'trample', 'vigilance', 'lifelink', 'deathtouch',
  'reach', 'hexproof', 'shroud', 'indestructible', 'flash', 'menace',
  'split_second', 'magecraft',
]

function parseKeywordsFromOracle(text) {
  if (!text) return []
  const lower = text.toLowerCase()
  const found = []
  for (const kw of KEYWORD_LIST) {
    // Build a word-boundary regex so "nonflying" doesn't match "flying"
    const pattern = kw.replace(/_/g, ' ').split(' ').map(w => `\\b${w}\\b`).join('\\s+')
    if (new RegExp(pattern).test(lower)) found.push(kw)
  }
  return found
}

function flattenDeck(deckCards) {
  const flat = []
  for (const entry of deckCards) {
    const card = entry.card || entry
    const qty = entry.quantity || 1
    for (let i = 0; i < qty; i++) {
      const c = { ...card }
      // Supabase Scryfall cards have abilities: null — parse from oracle text
      if (!c.abilities || c.abilities.length === 0) {
        c.abilities = parseKeywordsFromOracle(c.description)
      }
      flat.push(c)
    }
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
// Returns an ARRAY of every effect encoded in the description.
// Counter is no longer an early-return: side effects (draw, discard, mana) on
// counter spells like Soul Manipulation / Mana Drain / Arcane Denial all fire.
// Scry and Search still return early because they need interactive UI.
function parseAllSpellEffects(description) {
  if (!description) return []
  const desc = description.toLowerCase()

  // Dig Through Time style: "look at top N, put X of them into your hand"
  // Multiple regex variants handle different Scryfall oracle text phrasings
  const WORD_NUMS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7 }
  const _parseWordOrNum = s => (/^\d+$/.test(s) ? parseInt(s) : (WORD_NUMS[s] || 2))

  // Matches any of: "put 2 of them into your hand", "put two of those into your hand",
  //                 "put 2 cards into your hand", or the fallback look-at-top + into-hand pattern
  const _intoHandNum = (() => {
    let m
    if ((m = desc.match(/put (\d+) of (?:them|those)[\w\s]*?into your hand/))) return parseInt(m[1])
    if ((m = desc.match(/put (one|two|three|four|five|six|seven) of (?:them|those)[\w\s]*?into your hand/))) return _parseWordOrNum(m[1])
    if ((m = desc.match(/put (\d+) cards? into your hand/))) return parseInt(m[1])
    if (desc.includes('look at the top') && desc.includes('into your hand')) return 2
    return null
  })()
  if (_intoHandNum !== null) return [{ type: 'draw', amount: _intoHandNum }]

  // Scry / look at top (interactive — keep as early return)
  const scryM = desc.match(/scry (\d+)/)
  if (scryM) return [{ type: 'scry', amount: parseInt(scryM[1]) }]
  const lookM = desc.match(/look at the top (\d+) cards?/)
  if (lookM) return [{ type: 'scry', amount: parseInt(lookM[1]) }]
  // word-form: "look at the top seven cards"
  const lookWordM = desc.match(/look at the top (one|two|three|four|five|six|seven) cards?/)
  if (lookWordM) return [{ type: 'scry', amount: _parseWordOrNum(lookWordM[1]) }]
  if (desc.includes('look at the top card')) return [{ type: 'scry', amount: 1 }]

  // Search / tutor (interactive — early return)
  if (desc.includes('search your library') || desc.includes('tutor') ||
      desc.includes('from outside the game') || desc.includes('mastermind')) {
    return [{ type: 'search' }]
  }

  const effects = []

  // Counter — no longer early return; side effects below will also apply
  if (desc.includes('counter target spell') || desc.includes('counter target') ||
      desc.includes('negate') || desc.includes('cannot be countered') === false && desc.includes('negate')) {
    effects.push({ type: 'counter' })
  }

  // Damage
  const dealM = desc.match(/deal[s]? (\d+) damage/) || desc.match(/deals? (\d+) damage/)
  if (dealM) effects.push({ type: 'damage', amount: parseInt(dealM[1]) })

  // Brainstorm-style net draw: "draw X cards, then put Y cards from your hand on top"
  const netDrawM = desc.match(/draw (\d+) cards?, then put (\d+) cards? from your hand/)
  if (netDrawM) {
    const net = parseInt(netDrawM[1]) - parseInt(netDrawM[2])
    if (net > 0) effects.push({ type: 'draw', amount: net })
  } else {
    const drawM = desc.match(/draw (\d+) cards?/)
    if (drawM) effects.push({ type: 'draw', amount: parseInt(drawM[1]) })
    else if (desc.includes('draw a card') && !desc.includes('draw a card for each')) effects.push({ type: 'draw', amount: 1 })
  }

  // Lifegain
  const gainM = desc.match(/(?:you )?gain (\d+) life/) || desc.match(/gains? (\d+) life/)
  if (gainM) effects.push({ type: 'lifegain', amount: parseInt(gainM[1]) })

  // Boardwipe
  const isBoardwipe = desc.includes('destroy all creatures') || desc.includes('destroy all nonland') ||
    desc.includes('exile all creatures') || desc.includes('all creatures get') || !!desc.match(/destroy all/)
  if (isBoardwipe) {
    effects.push({ type: 'boardwipe' })
  } else {
    if (desc.includes('exile target creature') || desc.includes('exile target')) {
      effects.push({ type: 'exile' })
    }
    if (!effects.some(e => e.type === 'exile') &&
        (desc.includes('destroy target creature') || desc.includes('destroy target'))) {
      effects.push({ type: 'destroy' })
    }
    if (desc.includes('return target creature') || desc.includes('return target') ||
        (desc.includes('return') && desc.includes('hand'))) {
      effects.push({ type: 'bounce' })
    }
  }

  // Untap lands — Snap: "Untap up to two lands"
  const untapM = desc.match(/untap up to (\d+) lands?/)
  if (untapM) effects.push({ type: 'untapLands', amount: parseInt(untapM[1]) })

  // Mill
  const millM = desc.match(/mill (\d+)/) ||
    desc.match(/put the top (\d+) cards? of (?:target )?(?:their|your|a) library into (?:their|your|the) graveyard/) ||
    desc.match(/target player puts? the top (\d+)/)
  if (millM) effects.push({ type: 'mill', amount: parseInt(millM[1]) })

  // Pump
  const pumpM = desc.match(/\+(\d+)\/\+(\d+) until end of turn/)
  if (pumpM) effects.push({ type: 'pump', power: parseInt(pumpM[1]), toughness: parseInt(pumpM[2]) })

  // Mana burst — Mana Drain style: simplified as immediate mana
  const manaM = desc.match(/add (\d+) mana/) || desc.match(/add {(\d+)} to your mana pool/) ||
    desc.match(/add an amount of.*equal to that spell.*mana value/)
  if (manaM) {
    const amt = manaM[1] ? parseInt(manaM[1]) : 3
    effects.push({ type: 'mana', amount: amt })
  }

  // Discard (opponent) — skip if already have counter to avoid double-parsing
  // "discards X" matches real discard effects, not reminder text
  const discardM = desc.match(/(?:opponent|player|controller) discards? (\d+) cards?/) ||
    desc.match(/target player discards? (\d+)/) ||
    (!effects.some(e => e.type === 'counter') && desc.match(/discards? (\d+) cards?/))
  if (discardM) {
    const amount = discardM[1] ? parseInt(discardM[1]) : 1
    effects.push({ type: 'discard', amount, target: 'opponent' })
  }

  // Token creation
  const tokenM = desc.match(/create (\d+) (\d+)\/(\d+) (?:\w+ )*creature token/)
  if (tokenM) {
    effects.push({ type: 'token', count: parseInt(tokenM[1]), power: parseInt(tokenM[2]), toughness: parseInt(tokenM[3]) })
  } else if (desc.includes('create') && desc.includes('token')) {
    effects.push({ type: 'token', count: 1, power: 1, toughness: 1 })
  }

  return effects
}

// ── ETB trigger parser ────────────────────────────────────────────────────────
// Returns an array of ALL effects the creature triggers on entering the battlefield.
function parseAllETBEffects(description) {
  if (!description) return []
  const desc = description.toLowerCase()
  let effectText = null
  const m = desc.match(/when (?:~|this|.+?) enters(?: the battlefield)?[,\s]+(.+?)(?:\.|;|$)/)
  if (m) effectText = m[1].trim()
  else {
    const m2 = desc.match(/enters the battlefield[,:\s]+(.+?)(?:\.|;|$)/)
    if (m2) effectText = m2[1].trim()
  }
  if (!effectText) return []
  return parseAllSpellEffects(effectText)
}

// Keep single-effect version for activated ability fallback
function parseSpellEffect(description) {
  const effects = parseAllSpellEffects(description)
  return effects.length > 0 ? effects[0] : null
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

    // ETB effects — loop over ALL effects the card triggers on entry
    for (const etbEffect of parseAllETBEffects(card.description)) {
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
    const SPELL_TYPES = ['instant', 'sorcery', 'spell', 'enchantment', 'artifact']
    if (!SPELL_TYPES.includes(card.type)) {
      return { ok: false, error: 'Not a spell card' }
    }

    const isSplitSecond = hasAbility(card, 'split_second')

    // Sorcery/permanent timing: only during your own main phase
    const isSorcerySpeed = card.type === 'sorcery' || card.type === 'enchantment' || card.type === 'artifact'
    if (isSorcerySpeed) {
      if (this.state.activePlayer !== who) {
        return { ok: false, error: 'Permanents can only be cast on your own turn' }
      }
      if (this.state.phase !== 'main') {
        return { ok: false, error: 'Permanents can only be cast during your main phase' }
      }
    }

    const cost = getManaCost(card)
    if (p.availableMana < cost) return { ok: false, error: `Need ${cost} mana — tap more lands first (have ${p.availableMana})` }

    p.availableMana -= cost
    this._tapLandsForCost(p, cost)
    p.hand = p.hand.filter((_, i) => i !== handIndex)

    if (isSplitSecond) this._log(`⚡ ${card.name} — Split second! Cannot be responded to.`)

    // Collect ALL effects from description; fall back to abilities array if none found
    const effects = parseAllSpellEffects(card.description)
    if (effects.length === 0) {
      const fallback = this._effectFromAbilities(card)
      if (fallback) effects.push(fallback)
    }

    if (effects.length === 0) {
      this._log(`${card.name} resolves`)
      p.graveyard = [...p.graveyard, card]
      this.checkWinner()
      return { ok: true, applied: false }
    }

    let counterPending = false

    for (const effect of effects) {
      switch (effect.type) {
        // ── Interactive effects — spell goes to graveyard then returns a signal ──
        case 'scry': {
          const scryCards = p.library.slice(0, effect.amount)
          p.graveyard = [...p.graveyard, card]
          this.checkWinner()
          return { ok: true, applied: true, needsChoice: 'scry', scryCards, amount: effect.amount }
        }
        case 'search': {
          p.graveyard = [...p.graveyard, card]
          this.checkWinner()
          return { ok: true, applied: true, needsChoice: 'search', library: [...p.library] }
        }
        case 'counter': {
          // Don't return early — side effects (draw, discard, mana) still apply
          counterPending = true
          break
        }

        // ── Non-interactive effects — all run, then card goes to graveyard at end ──
        case 'damage': {
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            if (hasAbility(slot.card, 'hexproof')) {
              this._log(`${card.name} — ${slot.card.name} has hexproof and cannot be targeted`)
            } else {
              slot.damage += effect.amount
              this._log(`${card.name} deals ${effect.amount} damage to ${slot.card.name}`)
              this._destroyDamaged(oppName)
            }
          } else if (targetType === 'own_creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            slot.damage += effect.amount
            this._log(`${card.name} deals ${effect.amount} damage to ${slot.card.name}`)
            this._destroyDamaged(who)
          } else {
            opp.life -= effect.amount
            this._log(`${card.name} deals ${effect.amount} damage to ${oppName} (life: ${opp.life})`)
          }
          break
        }
        case 'draw': {
          for (let i = 0; i < effect.amount; i++) this.drawCard(who)
          break
        }
        case 'lifegain': {
          p.life += effect.amount
          this._log(`${card.name} — ${who} gains ${effect.amount} life (life: ${p.life})`)
          break
        }
        case 'discard': {
          const count = Math.min(effect.amount || 1, opp.hand.length)
          if (count > 0) {
            const discarded = opp.hand.slice(-count)
            opp.hand = opp.hand.slice(0, opp.hand.length - count)
            opp.graveyard = [...opp.graveyard, ...discarded]
            this._log(`${card.name} — ${oppName} discards ${count} card(s)`)
          } else {
            this._log(`${card.name} — ${oppName} has no cards to discard`)
          }
          break
        }
        case 'destroy': {
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            if (hasAbility(slot.card, 'hexproof')) {
              this._log(`${card.name} — ${slot.card.name} has hexproof and cannot be targeted`)
            } else {
              opp.graveyard = [...opp.graveyard, slot.card]
              opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIndex)
              this._log(`${card.name} destroys ${slot.card.name}`)
            }
          } else if (targetType === 'own_creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            p.graveyard = [...p.graveyard, slot.card]
            p.battlefield = p.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} destroys own ${slot.card.name}`)
          } else {
            this._log(`${card.name} — no valid target to destroy`)
          }
          break
        }
        case 'exile': {
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            if (hasAbility(slot.card, 'hexproof')) {
              this._log(`${card.name} — ${slot.card.name} has hexproof and cannot be targeted`)
            } else {
              opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIndex)
              this._log(`${card.name} exiles ${slot.card.name}`)
            }
          } else if (targetType === 'own_creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            p.battlefield = p.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} exiles own ${slot.card.name}`)
          } else {
            this._log(`${card.name} — no valid target to exile`)
          }
          break
        }
        case 'bounce': {
          if (targetType === 'creature' && targetIndex >= 0 && targetIndex < opp.battlefield.length) {
            const slot = opp.battlefield[targetIndex]
            if (hasAbility(slot.card, 'hexproof')) {
              this._log(`${card.name} — ${slot.card.name} has hexproof and cannot be targeted`)
            } else {
              opp.hand = [...opp.hand, slot.card]
              opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIndex)
              this._log(`${card.name} returns ${slot.card.name} to ${oppName}'s hand`)
            }
          } else if (targetType === 'own_creature' && targetIndex >= 0 && targetIndex < p.battlefield.length) {
            const slot = p.battlefield[targetIndex]
            p.hand = [...p.hand, slot.card]
            p.battlefield = p.battlefield.filter((_, i) => i !== targetIndex)
            this._log(`${card.name} returns ${slot.card.name} to ${who}'s hand`)
          } else {
            this._log(`${card.name} — no valid target to bounce`)
          }
          break
        }
        case 'boardwipe': {
          opp.graveyard = [...opp.graveyard, ...opp.battlefield.map(s => s.card)]
          p.graveyard   = [...p.graveyard,   ...p.battlefield.map(s => s.card)]
          opp.battlefield = []
          p.battlefield   = []
          this._log(`${card.name} — ALL creatures destroyed!`)
          break
        }
        case 'mill': {
          for (let i = 0; i < effect.amount; i++) {
            const milled = opp.library.shift()
            if (milled) opp.graveyard = [...opp.graveyard, milled]
          }
          this._log(`${card.name} mills ${effect.amount} cards from ${oppName}'s library`)
          break
        }
        case 'pump': {
          const pumpIdx = (targetType === 'own_creature' || targetType === 'creature') ? targetIndex : -1
          if (pumpIdx >= 0 && pumpIdx < p.battlefield.length) {
            const slot = p.battlefield[pumpIdx]
            slot.card = { ...slot.card, power: slot.card.power + effect.power, toughness: slot.card.toughness + effect.toughness }
            this._tempBuffs.push({ who, cardId: slot.card.id, power: effect.power, toughness: effect.toughness })
            this._log(`${slot.card.name} gets +${effect.power}/+${effect.toughness} until end of turn`)
          }
          break
        }
        case 'token': {
          const tk = {
            id: `token-${++this._tokenCounter}`,
            name: `${effect.power}/${effect.toughness} Token`,
            type: 'creature', color: card.color || 'colorless',
            mana_cost: null, power: effect.power, toughness: effect.toughness,
            abilities: [], description: 'Token creature.',
          }
          for (let n = 0; n < effect.count; n++) {
            p.battlefield = [...p.battlefield, { card: { ...tk }, tapped: false, summoningSick: true, damage: 0 }]
          }
          this._log(`${card.name} creates ${effect.count} ${effect.power}/${effect.toughness} token(s)`)
          break
        }
        case 'mana': {
          p.availableMana += effect.amount
          this._log(`${card.name} adds ${effect.amount} mana (pool: ${p.availableMana})`)
          break
        }
        case 'untapLands': {
          let untapped = 0
          for (const slot of p.lands) {
            if (slot.tapped && untapped < effect.amount) {
              slot.tapped = false
              untapped++
            }
          }
          p.availableMana = p.lands.filter(l => !l.tapped).length
          if (untapped > 0) this._log(`${card.name} — untapped ${untapped} land(s) (mana: ${p.availableMana})`)
          break
        }
        default:
          this._log(`${card.name} resolves (unrecognized effect: ${effect.type})`)
      }
    }

    p.graveyard = [...p.graveyard, card]
    this.checkWinner()
    if (counterPending) return { ok: true, applied: true, needsChoice: 'counter' }

    // Magecraft: triggers whenever CONTROLLER casts an instant or sorcery (or spell/enchantment/artifact)
    // Each Magecraft creature on the battlefield draws 1 card for its controller
    if (!counterPending) {
      const magecraftSlots = p.battlefield.filter(slot =>
        slot.card && (
          hasAbility(slot.card, 'magecraft') ||
          slot.card.description?.toLowerCase().includes('whenever you cast or copy an instant or sorcery')
        )
      )
      for (const slot of magecraftSlots) {
        this.drawCard(who)
        this._log(`${slot.card.name} Magecraft — ${who} draws a card`)
      }
    }

    return { ok: true, applied: true, ...(isSplitSecond ? { splitSecond: true } : {}) }
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

  // Called after player decides which scried cards stay on top vs go to bottom
  completeScry(who, topCards, bottomCards) {
    const p = this._player(who)
    const total = topCards.length + bottomCards.length
    const rest = p.library.slice(total)
    p.library = [...topCards, ...rest, ...bottomCards]
    const keptNames = topCards.map(c => c.name).join(', ')
    this._log(`${who} scries — keeps on top: ${keptNames || 'none'}`)
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

      case 'discard': {
        const count = Math.min(effect.amount || 1, opp.hand.length)
        if (count > 0) {
          const discarded = opp.hand.slice(-count)
          opp.hand = opp.hand.slice(0, opp.hand.length - count)
          opp.graveyard = [...opp.graveyard, ...discarded]
          this._log(`${card.name} ETB — ${oppName} discards ${count} card(s)`)
        } else {
          this._log(`${card.name} ETB — ${oppName} has no cards to discard`)
        }
        return { ok: true }
      }

      case 'mill': {
        for (let i = 0; i < effect.amount; i++) {
          const milled = opp.library.shift()
          if (milled) opp.graveyard = [...opp.graveyard, milled]
        }
        this._log(`${card.name} ETB — mills ${effect.amount} from ${oppName}'s library`)
        return { ok: true }
      }

      case 'token': {
        const tk = {
          id: `token-${++this._tokenCounter}`,
          name: `${effect.power}/${effect.toughness} Token`,
          type: 'creature', color: card.color || 'colorless',
          mana_cost: null, power: effect.power, toughness: effect.toughness,
          abilities: [], description: 'Token creature.',
        }
        for (let n = 0; n < effect.count; n++) {
          p.battlefield = [...p.battlefield, { card: { ...tk }, tapped: false, summoningSick: true, damage: 0 }]
        }
        this._log(`${card.name} ETB — creates ${effect.count} ${effect.power}/${effect.toughness} token(s)`)
        return { ok: true }
      }

      case 'mana':
        p.availableMana += effect.amount
        this._log(`${card.name} ETB — adds ${effect.amount} mana`)
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
      case 'bounce': {
        // Find valid (non-hexproof) targets
        const validTargets = opp.battlefield.filter(s => !hasAbility(s.card, 'hexproof'))
        if (targetIdx >= 0 && targetIdx < opp.battlefield.length) {
          const slot = opp.battlefield[targetIdx]
          if (hasAbility(slot.card, 'hexproof')) {
            this._log(`${card.name} ETB — ${slot.card.name} has hexproof`)
          } else {
            if (effect.type === 'bounce') opp.hand = [...opp.hand, slot.card]
            else opp.graveyard = [...opp.graveyard, slot.card]
            opp.battlefield = opp.battlefield.filter((_, i) => i !== targetIdx)
            this._log(`${card.name} ETB — ${effect.type}s ${slot.card.name}`)
          }
          return { ok: true }
        } else if (validTargets.length > 0 && who === 'player') {
          return { needsTarget: true, effect }
        } else if (validTargets.length > 0) {
          const slot = validTargets[0]
          const idx = opp.battlefield.indexOf(slot)
          if (effect.type === 'bounce') opp.hand = [...opp.hand, slot.card]
          else opp.graveyard = [...opp.graveyard, slot.card]
          opp.battlefield = opp.battlefield.filter((_, i) => i !== idx)
          this._log(`${card.name} ETB — ${effect.type}s ${slot.card.name}`)
          return { ok: true }
        }
        return { ok: true }
      }

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
    if (slot.summoningSick) return { ok: false, error: `${slot.card.name} is summoning sick — wait until your next turn` }

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

        // --- MTG-compliant combat math ---
        const attackPow = attackerSlot.card.power
        const atkHasDeathtouch = hasAbility(attackerSlot.card, 'deathtouch')
        const atkHasTrample = hasAbility(attackerSlot.card, 'trample')
        const atkHasLifelink = hasAbility(attackerSlot.card, 'lifelink')
        const atkHasFirstStrike = hasAbility(attackerSlot.card, 'first strike')

        const defPow = blockerSlot.card.power
        const defHasDeathtouch = hasAbility(blockerSlot.card, 'deathtouch')
        const defHasFirstStrike = hasAbility(blockerSlot.card, 'first strike')

        // Effective remaining toughness — accounts for prior spell damage this turn
        const atkEffToughness = Math.max(1, attackerSlot.card.toughness - (attackerSlot.damage || 0))
        const defEffToughness = Math.max(1, blockerSlot.card.toughness  - (blockerSlot.damage  || 0))

        let attackerDied = false
        let blockerDied = false
        let totalAtkDmgDealt = 0

        // --- First Strike step ---
        if (atkHasFirstStrike && !defHasFirstStrike) {
          // Attacker hits first
          const lethalToBlocker = atkHasDeathtouch ? 1 : defEffToughness
          if (attackPow >= lethalToBlocker) {
            blockerDied = true
            this._log(`${blockerSlot.card.name} destroyed by first strike from ${attackerSlot.card.name}`)
            const dmgToBlocker = atkHasDeathtouch ? 1 : Math.min(attackPow, defEffToughness)
            const excess = atkHasTrample ? Math.max(0, attackPow - (atkHasDeathtouch ? 1 : defEffToughness)) : 0
            totalAtkDmgDealt = dmgToBlocker + excess
            if (excess > 0) {
              defenderPlayer.life -= excess
              this._log(`${attackerSlot.card.name} tramples for ${excess} to ${defenderWho}`)
            }
          } else {
            // Blocker survives first strike, hits back
            totalAtkDmgDealt = attackPow
            if (defHasDeathtouch || defPow >= atkEffToughness) {
              attackerDied = true
              this._log(`${attackerSlot.card.name} destroyed by ${blockerSlot.card.name} after first strike`)
            }
          }
        } else if (defHasFirstStrike && !atkHasFirstStrike) {
          // Defender hits first
          if (defHasDeathtouch || defPow >= atkEffToughness) {
            attackerDied = true
            this._log(`${attackerSlot.card.name} destroyed by first strike from ${blockerSlot.card.name} — no damage dealt`)
          } else {
            // Attacker survives, deals damage
            const lethalToBlocker = atkHasDeathtouch ? 1 : defEffToughness
            if (attackPow >= lethalToBlocker) {
              blockerDied = true
            }
            const dmgToBlocker = atkHasDeathtouch ? 1 : Math.min(attackPow, defEffToughness)
            const excess = atkHasTrample ? Math.max(0, attackPow - (atkHasDeathtouch ? 1 : defEffToughness)) : 0
            totalAtkDmgDealt = dmgToBlocker + excess
            if (excess > 0) {
              defenderPlayer.life -= excess
              this._log(`${attackerSlot.card.name} tramples for ${excess} to ${defenderWho}`)
            }
          }
        } else {
          // Simultaneous damage (both have or neither has first strike)
          const lethalToBlocker = atkHasDeathtouch ? 1 : defEffToughness
          if (attackPow >= lethalToBlocker) {
            blockerDied = true
          }
          if (defHasDeathtouch || defPow >= atkEffToughness) {
            attackerDied = true
          }
          const dmgToBlocker = atkHasDeathtouch ? 1 : Math.min(attackPow, defEffToughness)
          const excess = atkHasTrample ? Math.max(0, attackPow - (atkHasDeathtouch ? 1 : defEffToughness)) : 0
          totalAtkDmgDealt = dmgToBlocker + excess
          if (excess > 0) {
            defenderPlayer.life -= excess
            this._log(`${attackerSlot.card.name} tramples for ${excess} to ${defenderWho}`)
          }
        }

        // Apply deaths
        if (blockerDied) {
          defenderPlayer.graveyard = [...defenderPlayer.graveyard, blockerSlot.card]
          blockerSlot.card = null
        }
        if (attackerDied) {
          attackerPlayer.graveyard = [...attackerPlayer.graveyard, attackerSlot.card]
          attackerSlot.card = null
        }

        // Lifelink — heals for TOTAL damage dealt (to blocker + trample), once
        if (atkHasLifelink && totalAtkDmgDealt > 0 && !attackerDied) {
          attackerPlayer.life += totalAtkDmgDealt
          lifelinkHeals.push({ who: attackerWho, amount: totalAtkDmgDealt })
          this._log(`${attackerSlot?.card?.name || 'Attacker'} lifelink — ${attackerWho} gains ${totalAtkDmgDealt} life`)
        }

      } else {
        // Unblocked attacker — direct damage to opponent
        const dmg = attackerSlot.card.power
        defenderPlayer.life -= dmg
        this._log(`${attackerSlot.card.name} attacks unblocked — deals ${dmg} to ${defenderWho} (life: ${defenderPlayer.life})`)
        if (hasAbility(attackerSlot.card, 'lifelink')) {
          attackerPlayer.life += dmg
          lifelinkHeals.push({ who: attackerWho, amount: dmg })
          this._log(`${attackerSlot.card.name} lifelink — ${attackerWho} gains ${dmg} life`)
        }
      }
    }  // end for-each attacker

    // Remove null slots left by combat deaths (card set to null above)
    attackerPlayer.battlefield = attackerPlayer.battlefield.filter(s => s.card !== null)
    defenderPlayer.battlefield = defenderPlayer.battlefield.filter(s => s.card !== null)

    this.state.attackers = []
    this.state.blockers  = {}
    this.state.phase = 'main'   // Return to main phase after combat

    this.checkWinner()
    return { ok: true, lifelinkHeals }
  }

  _destroyDamaged(who) {
    const p = this._player(who)
    const alive = []
    for (const slot of p.battlefield) {
      if (!slot.card) continue
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
      const slot = p.battlefield.find(s => s.card && s.card.id === buff.cardId)
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
