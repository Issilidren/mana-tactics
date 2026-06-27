// AIOpponent.js — AI decision making for card battles
import { getManaCost } from './CardEngine.js'

// Case-insensitive ability check (mirrors CardEngine.hasAbility)
function hasAb(card, ab) {
  if (!card?.abilities) return false
  const norm = ab.toLowerCase().replace(/[\s_]/g, '')
  return card.abilities.some(a => a.toLowerCase().replace(/[\s_]/g, '') === norm)
}

export class AIOpponent {
  constructor(engine, difficulty = 'normal') {
    this.engine = engine
    this.difficulty = difficulty
  }

  // Returns a sequence of action objects for the AI's full turn
  // Actions are descriptive — BattleScreen animates them sequentially
  takeTurn() {
    const actions = []
    const state = this.engine.state
    let ai = state.ai
    const player = state.player

    // Play a land first if the AI has one — this updates engine state immediately
    // so all subsequent mana math uses the correct value
    const landIdx = ai.hand.findIndex(c => c.type === 'land')
    if (landIdx !== -1 && ai.landsPlayedThisTurn < ai.landLimit) {
      this.engine.playLand('ai', landIdx)
      ai = state.ai  // re-read: hand and mana have changed
    }

    // Current available mana this turn
    let manaLeft = ai.availableMana

    // ── Priority 1: Cast removal on the biggest player threat ────────────────
    const isSpell = c => c.type === 'instant' || c.type === 'sorcery' || c.type === 'spell'

    const removalSpells = ai.hand
      .map((card, i) => ({ card, i }))
      .filter(({ card }) => {
        if (!isSpell(card)) return false
        return card.abilities && (
          card.abilities.includes('destroy') ||
          card.abilities.includes('damage')
        )
      })

    if (removalSpells.length > 0 && player.battlefield.length > 0) {
      // Find biggest threat (highest power)
      const biggestThreatIdx = player.battlefield.reduce((best, slot, i) => {
        const prev = player.battlefield[best]
        return (slot.card.power || 0) > (prev.card.power || 0) ? i : best
      }, 0)

      for (const { card, i } of removalSpells) {
        const cost = getManaCost(card)
        if (manaLeft >= cost) {
          // Check if destroy or damage
          const isDestroy = card.abilities && card.abilities.includes('destroy')
          const isDamage = card.abilities && card.abilities.includes('damage')

          const targetCard = player.battlefield[biggestThreatIdx].card
          // Only use damage spell if it can kill the creature or player is low
          if (isDamage && !isDestroy) {
            const dmgAmount = 3  // lightning bolt default
            const targetTough = targetCard.toughness
            if (dmgAmount >= targetTough || player.life <= 3) {
              actions.push({
                type: 'castSpell',
                cardId: card.id,
                targetType: dmgAmount >= targetTough ? 'creature' : 'player',
                targetIndex: biggestThreatIdx,
              })
              manaLeft -= cost
              break
            }
          } else if (isDestroy) {
            actions.push({
              type: 'castSpell',
              cardId: card.id,
              targetType: 'creature',
              targetIndex: biggestThreatIdx,
            })
            manaLeft -= cost
            break
          }
        }
      }
    }

    // ── Priority 2: Cast direct damage at player if life low ─────────────────
    if (player.life <= 4) {
      const dmgSpells = ai.hand
        .map((card, i) => ({ card, i }))
        .filter(({ card, i }) => {
          if (!isSpell(card)) return false
          return card.abilities && card.abilities.includes('damage')
        })

      for (const { card, i } of dmgSpells) {
        const cost = getManaCost(card)
        if (manaLeft >= cost) {
          // Don't double-cast if we already queued a spell with this cardId
          const alreadyQueued = actions.some(a => a.cardId === card.id)
          if (!alreadyQueued) {
            actions.push({ type: 'castSpell', cardId: card.id, targetType: 'player', targetIndex: -1 })
            manaLeft -= cost
          }
        }
      }
    }

    // ── Priority 3: Cast creatures (cheapest first that fits mana) ────────────
    const creaturesInHand = ai.hand
      .map((card, i) => ({ card, i }))
      .filter(({ card }) => card.type === 'creature')
      .sort((a, b) => getManaCost(a.card) - getManaCost(b.card))  // cheapest first

    for (const { card, i } of creaturesInHand) {
      const cost = getManaCost(card)
      if (manaLeft >= cost) {
        const alreadyQueued = actions.some(a => a.type === 'castCreature' && a.cardId === card.id)
        if (!alreadyQueued) {
          actions.push({ type: 'castCreature', cardId: card.id })
          manaLeft -= cost
        }
        if (manaLeft === 0) break
      }
    }

    // ── Priority 4: Cast draw spells if hand is empty ─────────────────────────
    if (ai.hand.length <= 2) {
      const drawSpells = ai.hand
        .map((card, i) => ({ card, i }))
        .filter(({ card }) => {
          if (!isSpell(card)) return false
          return card.abilities && card.abilities.includes('draw')
        })

      for (const { card, i } of drawSpells) {
        const cost = getManaCost(card)
        if (manaLeft >= cost) {
          const alreadyQueued = actions.some(a => a.cardId === card.id)
          if (!alreadyQueued) {
            actions.push({ type: 'castSpell', cardId: card.id, targetType: 'player', targetIndex: -1 })
            manaLeft -= cost
          }
        }
      }
    }

    // ── Priority 5: Attack ────────────────────────────────────────────────────
    const attackerIndices = this._chooseAttackers(state)
    if (attackerIndices.length > 0) {
      actions.push({ type: 'attack', attackerIndices })
    }

    return actions
  }

  _chooseAttackers(state) {
    const ai = state.ai
    const player = state.player
    const attackerIndices = []

    for (let i = 0; i < ai.battlefield.length; i++) {
      const slot = ai.battlefield[i]
      if (!slot || slot.tapped || slot.summoningSick || slot.card.type !== 'creature') continue

      const myPow = slot.card.power
      const myTough = slot.card.toughness

      // Easy: only attack when player has no blockers at all
      if (this.difficulty === 'easy') {
        if (player.battlefield.length === 0) attackerIndices.push(i)
        continue
      }

      // Always attack if player has no blockers
      if (player.battlefield.length === 0) {
        attackerIndices.push(i)
        continue
      }

      // Find best potential blocker
      const bestBlocker = this._bestBlocker(slot, player.battlefield)

      if (!bestBlocker) {
        // No valid blocker found — attack freely
        attackerIndices.push(i)
        continue
      }

      const { blockerPow, blockerTough } = bestBlocker
      const weKillBlocker = myPow >= blockerTough
      const blockerKillsUs = blockerPow >= myTough
      const ourLifeIsLow = ai.life <= 4

      // Attack if:
      // - We kill blocker and survive
      // - We kill blocker (favorable trade) and our life is comfortable
      // - We have flying and they have no flying blockers
      const hasFlying = hasAb(slot.card, 'flying')
      const noFlyingBlockers = player.battlefield.every(s => !hasAb(s.card, 'flying'))

      if (hasFlying && noFlyingBlockers) {
        attackerIndices.push(i)
      } else if (weKillBlocker && !blockerKillsUs) {
        attackerIndices.push(i)
      } else if (weKillBlocker && !ourLifeIsLow) {
        // Trade — okay if our life is comfortable
        attackerIndices.push(i)
      } else if (!blockerKillsUs && player.life <= 4) {
        // Player is near death — attack with everything
        attackerIndices.push(i)
      }
    }

    // Hard: hold back one creature as emergency blocker if AI life is low
    if (this.difficulty === 'hard' && ai.life <= 5 && attackerIndices.length > 1) {
      // Remove the weakest attacker (lowest power) from attack squad
      const weakestIdx = attackerIndices.reduce((worst, idx) => {
        const wSlot = ai.battlefield[worst]
        const cSlot = ai.battlefield[idx]
        return (cSlot?.card?.power ?? 0) < (wSlot?.card?.power ?? 0) ? idx : worst
      }, attackerIndices[0])
      return attackerIndices.filter(idx => idx !== weakestIdx)
    }

    return attackerIndices
  }

  _bestBlocker(attackerSlot, playerBattlefield) {
    // Returns stats of the strongest potential blocker, or null if none can block
    let best = null
    for (const slot of playerBattlefield) {
      if (!slot || slot.card.type !== 'creature') continue
      const blockerPow = slot.card.power
      const blockerTough = slot.card.toughness
      if (!best || blockerPow > best.blockerPow) {
        best = { blockerPow, blockerTough }
      }
    }
    return best
  }

  chooseBlockers(state) {
    // Assign blockers: block if our creature survives or the trade is favorable
    const ai = state.ai
    const player = state.player
    const attackers = state.attackers
    const blockerMap = {}
    const usedBlockers = new Set()

    // Sort attackers by power descending (block biggest threats first)
    const sortedAttackers = [...attackers].sort((a, b) => {
      const aPow = (player.battlefield[a] || {}).card?.power || 0
      const bPow = (player.battlefield[b] || {}).card?.power || 0
      return bPow - aPow
    })

    for (const attackerIdx of sortedAttackers) {
      const attackerSlot = player.battlefield[attackerIdx]
      if (!attackerSlot) continue

      const attackPow = attackerSlot.card.power
      const attackTough = attackerSlot.card.toughness

      // Flying attacker — only flying or reach creatures can block
      const hasFlying = hasAb(attackerSlot.card, 'flying')

      // Find best blocker for this attacker
      let bestBlockerIdx = null
      let bestScore = -Infinity

      for (let bi = 0; bi < ai.battlefield.length; bi++) {
        if (usedBlockers.has(bi)) continue
        const bSlot = ai.battlefield[bi]
        if (!bSlot || bSlot.card.type !== 'creature') continue

        // Flying check — reach can also block flying
        if (hasFlying && !hasAb(bSlot.card, 'flying') && !hasAb(bSlot.card, 'reach')) continue

        const bPow = bSlot.card.power
        const bTough = bSlot.card.toughness

        const weKillAttacker = bPow >= attackTough
        const attackerKillsUs = attackPow >= bTough

        // Score: prefer blocks where we kill attacker and survive
        let score = 0
        if (weKillAttacker && !attackerKillsUs) score = 3   // favorable trade
        else if (weKillAttacker && attackerKillsUs) score = 1  // even trade — only if damage is too high
        else if (!weKillAttacker && !attackerKillsUs) score = 2  // we survive, don't kill — chump but valuable
        else score = -1  // we die and don't kill — avoid

        if (score > bestScore) {
          bestScore = score
          bestBlockerIdx = bi
        }
      }

      // Only block if it's advantageous or necessary
      if (bestBlockerIdx !== null && bestScore >= 1) {
        // Extra check: only sacrifice if attacker damage would matter
        const bSlot = ai.battlefield[bestBlockerIdx]
        const blockerDies = attackPow >= bSlot.card.toughness
        const attackerDies = bSlot.card.power >= attackTough

        // Block if: we kill attacker, or attacker damage would be lethal to us
        if (attackerDies || ai.life - attackPow <= 2) {
          blockerMap[attackerIdx] = bestBlockerIdx
          usedBlockers.add(bestBlockerIdx)
        }
      }
    }

    return blockerMap
  }
}
