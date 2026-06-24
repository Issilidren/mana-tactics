import { useState, useRef, useEffect, useCallback } from 'react'
import { CardEngine, getManaCost } from './systems/CardEngine.js'
import { AIOpponent } from './systems/AIOpponent.js'

// ── PTCG-style card frame colors per MTG color ──────────────────────────────
const CARD_FRAME = {
  white:     { border: '#8B7A30', header: '#D4C460', headerText: '#2a1a00', bg: '#F5EFD0', art1: '#E8DC90', art2: '#BCA840' },
  blue:      { border: '#113377', header: '#2255AA', headerText: '#EEF4FF', bg: '#E8F0F8', art1: '#5588CC', art2: '#1133AA' },
  black:     { border: '#6611BB', header: '#6633AA', headerText: '#EEE8FF', bg: '#281A3A', art1: '#7744BB', art2: '#2A1040' },
  red:       { border: '#881100', header: '#CC3311', headerText: '#FFF0EE', bg: '#F8EAE5', art1: '#DD7755', art2: '#AA2200' },
  green:     { border: '#0A5A0A', header: '#228822', headerText: '#F0FFF0', bg: '#E5F0E5', art1: '#66BB66', art2: '#224422' },
  colorless: { border: '#444444', header: '#777777', headerText: '#FFFFFF',  bg: '#F0EEEA', art1: '#AAAAAA', art2: '#666666' },
}

// ── Plain-English ability explanations ──────────────────────────────────────
const ABILITY_RULES = {
  'flying':         'Flying — Only creatures with Flying or Reach can block this.',
  'first strike':   'First Strike — Deals combat damage before non-first-strikers.',
  'double strike':  'Double Strike — Deals both first-strike AND regular combat damage.',
  'vigilance':      'Vigilance — Attacking does not cause this creature to tap.',
  'trample':        'Trample — Excess combat damage carries through to the opponent.',
  'haste':          'Haste — Can attack the same turn it enters the battlefield.',
  'lifelink':       'Lifelink — Damage dealt also heals you for the same amount.',
  'deathtouch':     'Deathtouch — Any amount of damage from this destroys a creature.',
  'reach':          'Reach — This creature can block creatures with Flying.',
  'menace':         'Menace — Must be blocked by two or more creatures to attack.',
  'flash':          'Flash — May be played at any time, like an instant spell.',
  'hexproof':       "Hexproof — Cannot be targeted by your opponent's spells or abilities.",
  'indestructible': 'Indestructible — Cannot be destroyed by damage or effects.',
  'ward':           'Ward — Spells targeting this cost 2 extra mana to cast.',
  'protection':     'Protection — Cannot be blocked, targeted, or damaged by chosen color.',
}

// ── Color accent used in top/bottom bars ────────────────────────────────────
const COLOR_ACCENT = {
  white: '#D4C460', blue: '#5588cc', black: '#9966cc',
  red: '#cc4422', green: '#44aa55', colorless: '#888888',
}

// Pixel grid overlay that gives the GBC pixel-art look to art areas
const ART_OVERLAY = [
  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
  'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
].join(', ')

// ── GBC Heart HP display ──────────────────────────────────────────────────────
function LifeDots({ life, max = 10 }) {
  const hearts = Math.min(life, max)
  const empty  = Math.max(0, max - hearts)
  return (
    <span style={{ letterSpacing: 1, fontSize: '0.9rem' }}>
      {Array.from({ length: hearts }, (_, i) => (
        <span key={`f${i}`} style={{ color: '#E83838' }}>♥</span>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <span key={`e${i}`} style={{ color: '#484040' }}>♥</span>
      ))}
      <span style={{
        color: '#E8F0FF',
        fontSize: '0.75rem',
        marginLeft: 5,
        fontWeight: 'bold',
      }}>{life}</span>
    </span>
  )
}

// ── Single card component (PTCG GBC style) ──────────────────────────────────
function BattleCard({
  card,
  tapped = false,
  summoningSick = false,
  damage = 0,
  isSelected = false,
  isAttacking = false,
  onClick,
  onHover,
  size = 'battlefield',
}) {
  const cardRef = useRef(null)
  const color = card.color || 'colorless'
  const frame = CARD_FRAME[color] || CARD_FRAME.colorless
  const isCreature = card.type === 'creature'
  const isLand = card.type === 'land'
  const abilities = card.abilities || []
  const darkBg = frame.bg === '#281A3A'

  const w = size === 'hand' ? 72 : 82
  const h = size === 'hand' ? 100 : 114

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => onHover && onHover(card, cardRef.current?.getBoundingClientRect())}
      onMouseLeave={() => onHover && onHover(null, null)}
      style={{
        width: w,
        height: h,
        border: isSelected
          ? '2px solid #FFEE00'
          : isAttacking
            ? '2px solid #FF4400'
            : `2px solid ${frame.border}`,
        borderRadius: 2,
        background: frame.bg,
        cursor: onClick ? 'pointer' : 'default',
        transform: tapped ? 'rotate(90deg)' : 'none',
        transition: 'transform 0.25s, border 0.15s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        opacity: summoningSick ? 0.7 : 1,
        boxShadow: isSelected
          ? '0 0 6px rgba(255,238,0,0.8)'
          : isAttacking
            ? '0 0 6px rgba(255,68,0,0.8)'
            : '2px 3px 0px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* ── Header band ── */}
      <div style={{
        background: frame.header,
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        minHeight: 18,
        borderBottom: `1px solid ${frame.border}88`,
      }}>
        <span style={{
          color: frame.headerText,
          fontWeight: 'bold',
          fontSize: '0.52rem',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          maxWidth: '72%',
          textOverflow: 'ellipsis',
        }}>
          {card.name}
        </span>
        <span style={{ color: frame.headerText, fontSize: '0.5rem', fontWeight: 'bold', flexShrink: 0 }}>
          {isCreature
            ? `HP${(card.toughness || 0) * 10}`
            : isLand
              ? '∞'
              : `${getManaCost(card)}◆`}
        </span>
      </div>

      {/* ── Art area (pixel-grid GBC style) ── */}
      <div style={{
        height: size === 'hand' ? 38 : 44,
        background: `radial-gradient(ellipse at 40% 40%, ${frame.art1} 0%, ${frame.art2} 100%)`,
        margin: '2px',
        borderRadius: 1,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: ART_OVERLAY }} />
        <span style={{
          fontSize: size === 'hand' ? '1.3rem' : '1.5rem',
          filter: 'drop-shadow(1px 1px 0px rgba(0,0,0,0.9))',
          zIndex: 1,
          lineHeight: 1,
        }}>
          {isCreature ? '⚔' : isLand ? '🏔' : '✨'}
        </span>
        {damage > 0 && (
          <div style={{
            position: 'absolute', top: 2, right: 2,
            background: '#cc0000', borderRadius: 3,
            padding: '1px 3px', fontSize: '0.48rem', color: '#fff', fontWeight: 'bold',
          }}>
            -{damage}
          </div>
        )}
      </div>

      {/* ── Type bar ── */}
      <div style={{
        background: `${frame.header}55`,
        padding: '1px 4px',
        fontSize: '0.42rem',
        color: darkBg ? '#DDD8FF' : '#111',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        borderTop: `1px solid ${frame.border}44`,
        borderBottom: `1px solid ${frame.border}44`,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        {card.type}{abilities.length > 0 ? ` · ${abilities[0]}` : ''}
      </div>

      {/* ── Text + stats area ── */}
      <div style={{
        flex: 1,
        padding: '2px 4px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          fontSize: '0.42rem',
          color: darkBg ? '#DDD8FF' : '#2a2a2a',
          fontStyle: 'italic',
          lineHeight: 1.25,
          overflow: 'hidden',
          maxHeight: 28,
        }}>
          {abilities.length > 0
            ? (ABILITY_RULES[abilities[0]] || abilities[0])
            : card.description
              ? card.description.slice(0, 55) + (card.description.length > 55 ? '…' : '')
              : ''}
        </div>

        {/* P/T badge — bottom right */}
        {isCreature && card.power != null && (
          <div style={{
            position: 'absolute',
            bottom: 2,
            right: 3,
            background: frame.bg,
            border: `1px solid ${frame.border}`,
            borderRadius: 1,
            padding: '1px 4px',
            fontSize: '0.6rem',
            fontWeight: 'bold',
            color: damage > 0 ? '#cc0000' : darkBg ? '#EEE' : '#1a1a1a',
            boxShadow: '1px 1px 0 rgba(0,0,0,0.8)',
          }}>
            {card.power}/{card.toughness}
          </div>
        )}
      </div>

      {/* Summoning sick overlay */}
      {summoningSick && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(150,150,255,0.12)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
          padding: 2, borderRadius: 4,
        }}>
          <div style={{
            background: 'rgba(40,40,180,0.85)',
            borderRadius: 2, padding: '0 3px',
            fontSize: '0.38rem', color: '#aaaaff', letterSpacing: 0.5,
          }}>
            NEW
          </div>
        </div>
      )}
    </div>
  )
}

// ── Full card tooltip (PTCG-style popup on hover) ───────────────────────────
function CardTooltip({ card, rect }) {
  if (!card || !rect) return null

  const color = card.color || 'colorless'
  const frame = CARD_FRAME[color] || CARD_FRAME.colorless
  const isCreature = card.type === 'creature'
  const isLand = card.type === 'land'
  const abilities = card.abilities || []
  const darkBg = frame.bg === '#281A3A'

  const TW = 200
  const TH = 315
  let left = rect.left + rect.width / 2 - TW / 2
  left = Math.max(8, Math.min(left, window.innerWidth - TW - 8))
  let top = rect.top - TH - 8
  if (top < 8) top = rect.bottom + 8

  return (
    <div style={{
      position: 'fixed',
      left,
      top,
      width: TW,
      zIndex: 2000,
      pointerEvents: 'none',
      background: frame.bg,
      border: `3px solid ${frame.border}`,
      borderRadius: 3,
      overflow: 'hidden',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.9)',
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        background: frame.header,
        padding: '6px 8px',
        borderBottom: `2px solid ${frame.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 'bold',
            color: frame.headerText, lineHeight: 1.1, flex: 1,
          }}>
            {card.name}
          </span>
          <span style={{
            color: frame.headerText, fontSize: '0.65rem',
            fontWeight: 'bold', flexShrink: 0, marginLeft: 6,
          }}>
            {isCreature
              ? `HP ${(card.toughness || 0) * 10}`
              : isLand
                ? '∞ mana'
                : `${getManaCost(card)} mana`}
          </span>
        </div>
        <div style={{
          fontSize: '0.5rem', color: `${frame.headerText}cc`,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {isCreature ? 'Creature' : isLand ? 'Basic Land' : card.type}
          {card.rarity ? ` · ${card.rarity}` : ''}
        </div>
      </div>

      {/* Art area */}
      <div style={{
        height: 95,
        background: `radial-gradient(ellipse at 40% 40%, ${frame.art1} 0%, ${frame.art2} 100%)`,
        margin: '5px',
        borderRadius: 5,
        border: `2px solid ${frame.border}88`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: ART_OVERLAY }} />
        <span style={{
          fontSize: '3rem',
          filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.9))',
          zIndex: 1, lineHeight: 1,
        }}>
          {isCreature ? '⚔' : isLand ? '🏔' : '✨'}
        </span>
      </div>

      {/* Type bar */}
      <div style={{
        background: `${frame.header}55`,
        padding: '3px 8px',
        fontSize: '0.52rem',
        color: darkBg ? '#DDD' : '#222',
        borderTop: `1px solid ${frame.border}55`,
        borderBottom: `1px solid ${frame.border}55`,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
      }}>
        {isCreature ? 'Creature' : isLand ? 'Basic Land' : card.type}
        {card.subtype ? ` — ${card.subtype}` : ''}
      </div>

      {/* Text box */}
      <div style={{ padding: '6px 8px 30px', minHeight: 72, position: 'relative' }}>
        {/* Ability lines — each with full plain-English rule */}
        {abilities.map(ab => (
          <div key={ab} style={{
            fontSize: '0.58rem',
            color: darkBg ? '#DDD8FF' : '#1a1a1a',
            fontStyle: 'italic',
            lineHeight: 1.35,
            marginBottom: 3,
          }}>
            {ABILITY_RULES[ab] || ab}
          </div>
        ))}

        {/* Description / flavor text */}
        {card.description && (
          <div style={{
            fontSize: '0.58rem',
            color: darkBg ? '#C8C0E8' : '#3a2a10',
            fontStyle: 'italic',
            lineHeight: 1.35,
            marginTop: abilities.length ? 5 : 0,
            borderTop: abilities.length ? `1px solid ${frame.border}33` : 'none',
            paddingTop: abilities.length ? 5 : 0,
          }}>
            {card.description}
          </div>
        )}

        {/* Land tap note */}
        {isLand && (
          <div style={{
            fontSize: '0.55rem', color: darkBg ? '#AAA' : '#555', fontStyle: 'italic',
          }}>
            Tap: Add 1 mana to your pool.
          </div>
        )}

        {/* P/T badge */}
        {isCreature && card.power != null && (
          <div style={{
            position: 'absolute', bottom: 5, right: 8,
            background: frame.bg,
            border: `2px solid ${frame.border}`,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: '0.78rem',
            fontWeight: 'bold',
            color: darkBg ? '#EEE' : '#1a1a1a',
            boxShadow: '1px 2px 0 rgba(0,0,0,0.4)',
          }}>
            {card.power} / {card.toughness}
          </div>
        )}

        {/* Mana cost tag for non-creatures */}
        {!isCreature && !isLand && (
          <div style={{
            position: 'absolute', bottom: 5, left: 8,
            fontSize: '0.55rem', color: darkBg ? '#AAA' : '#555',
          }}>
            Mana cost: {getManaCost(card)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Battlefield row ──────────────────────────────────────────────────────────
function Battlefield({ slots, label, selectedIdx, onSlotClick, attackingIndices = [], isFlipped = false, onCardHover }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '8px 12px',
    }}>
      <div style={{
        fontSize: '0.6rem',
        color: '#506880',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 6,
        fontFamily: "'Courier New', monospace",
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        minHeight: 120,
        alignItems: 'center',
        transform: isFlipped ? 'scaleY(-1)' : 'none',
      }}>
        {slots.length === 0 && (
          <div style={{ color: '#2A4060', fontSize: '0.72rem', fontStyle: 'italic' }}>— empty —</div>
        )}
        {slots.map((slot, i) => (
          <div key={i} style={{ transform: isFlipped ? 'scaleY(-1)' : 'none' }}>
            <BattleCard
              card={slot.card}
              tapped={slot.tapped}
              summoningSick={slot.summoningSick}
              damage={slot.damage}
              isSelected={selectedIdx === i}
              isAttacking={attackingIndices.includes(i)}
              onClick={onSlotClick ? () => onSlotClick(i) : undefined}
              onHover={onCardHover}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── GBC Dialog Box (Game Log) ─────────────────────────────────────────────────
function GameLog({ log }) {
  const last3 = log.slice(-3)
  return (
    <div style={{
      flex: 1,
      background: '#F0EED8',        // GBC cream/white interior
      border: '3px solid #101010',  // hard black pixel border
      borderRadius: 2,              // barely rounded — GBC hard corners
      padding: '0',
      minWidth: 180,
      maxWidth: 280,
      overflow: 'hidden',
      imageRendering: 'pixelated',
    }}>
      {/* GBC dialog box title bar */}
      <div style={{
        background: '#101010',
        color: '#F0EED8',
        padding: '2px 6px',
        fontSize: '0.55rem',
        letterSpacing: 2,
        fontFamily: "'Courier New', monospace",
        fontWeight: 'bold',
        borderBottom: '2px solid #303030',
      }}>
        ▶ BATTLE LOG
      </div>
      <div style={{ padding: '4px 6px' }}>
        {last3.length === 0 && (
          <div style={{ color: '#888870', fontSize: '0.6rem' }}>Battle begins...</div>
        )}
        {last3.map((line, i) => (
          <div key={i} style={{
            fontSize: '0.6rem',
            color: i === last3.length - 1 ? '#101010' : '#606050',
            lineHeight: 1.45,
            fontFamily: "'Courier New', monospace",
          }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Win/Loss Overlay ─────────────────────────────────────────────────────────
function ResultOverlay({ winner, reward, npcName, onContinue, onRematch, onRetreat }) {
  const won = winner === 'player'
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      flexDirection: 'column',
      gap: 20,
    }}>
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: won ? '#D4AF37' : '#8B0000',
        letterSpacing: 4,
        textShadow: won ? '0 0 20px rgba(212,175,55,0.6)' : '0 0 20px rgba(139,0,0,0.6)',
      }}>
        {won ? 'VICTORY!' : 'DEFEATED'}
      </div>

      {won && (
        <div style={{ color: '#F5F0E1', fontSize: '1.1rem', textAlign: 'center' }}>
          <div>You defeated {npcName}!</div>
          <div style={{ marginTop: 8, color: '#D4AF37', fontSize: '1.4rem' }}>
            🪙 +{reward} gold
          </div>
        </div>
      )}

      {!won && (
        <div style={{ color: '#a89070', fontSize: '1rem', textAlign: 'center' }}>
          {npcName} has bested you...
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {won ? (
          <button className="btn-primary" onClick={onContinue}>Continue</button>
        ) : (
          <>
            <button className="btn-primary" onClick={onRematch}>Rematch</button>
            <button className="btn-ghost" onClick={onRetreat}>Retreat</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Search / Wish Modal ──────────────────────────────────────────────────────
function SearchModal({ library, wishCards, onPickLibrary, onPickWish, onSkip }) {
  const [tab, setTab] = useState('library')
  const cards = tab === 'library' ? library : wishCards

  const TAB_STYLE = (active) => ({
    padding: '4px 14px',
    fontFamily: "'Cinzel',serif",
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    background: active ? '#C8961E' : 'rgba(212,175,55,0.08)',
    color: active ? '#0A0E1A' : '#D4AF37',
    border: `1px solid ${active ? '#D4AF37' : 'rgba(212,175,55,0.3)'}`,
    borderRadius: 3,
  })

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(4,8,16,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 300, fontFamily: "'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        width: '100%', background: '#0A1828',
        borderBottom: '2px solid #C8961E',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: '1rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '0.1em' }}>
          ✦ CHOOSE A CARD ✦
        </span>
        <button onClick={onSkip} style={{
          background: 'transparent', border: '1px solid rgba(212,175,55,0.3)',
          color: '#7090B0', cursor: 'pointer', padding: '3px 10px',
          fontFamily: "'Cinzel',serif", fontSize: '0.65rem',
        }}>
          Skip
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 0 6px' }}>
        <button style={TAB_STYLE(tab === 'library')} onClick={() => setTab('library')}>
          Search Library ({library.length})
        </button>
        <button style={TAB_STYLE(tab === 'wish')} onClick={() => setTab('wish')}>
          From Collection ({wishCards.length})
        </button>
      </div>

      <div style={{ fontSize: '0.6rem', color: '#506880', marginBottom: 8 }}>
        {tab === 'library'
          ? 'Pick a card from your library — it goes to your hand and your library shuffles.'
          : 'Wish for a card from your deck — it comes directly to your hand.'}
      </div>

      {/* Card list */}
      <div style={{
        flex: 1, overflowY: 'auto', width: '100%', maxWidth: 680,
        padding: '0 16px 16px',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        {cards.length === 0 && (
          <div style={{ color: '#506880', fontSize: '0.75rem', textAlign: 'center', marginTop: 24 }}>
            — No cards available —
          </div>
        )}
        {cards.map((card, i) => {
          const color = card.color || 'colorless'
          const frame = CARD_FRAME[color] || CARD_FRAME.colorless
          const isCreature = card.type === 'creature'
          return (
            <div
              key={`${card.id}-${i}`}
              onClick={() => tab === 'library' ? onPickLibrary(card.id) : onPickWish(card)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(90deg, ${frame.bg}22, transparent)`,
                border: `1px solid ${frame.border}44`,
                borderLeft: `3px solid ${frame.border}`,
                borderRadius: 3,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(90deg, ${frame.bg}55, ${frame.bg}22)` }}
              onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(90deg, ${frame.bg}22, transparent)` }}
            >
              {/* Color swatch */}
              <div style={{ width: 8, height: 40, background: frame.header, borderRadius: 2, flexShrink: 0 }} />

              {/* Card info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '0.72rem', fontWeight: 700, color: '#E8E0C8' }}>
                  {card.name}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#7090B0', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {card.type}{card.rarity ? ` · ${card.rarity}` : ''}
                  {isCreature && card.power != null ? ` · ${card.power}/${card.toughness}` : ''}
                </div>
                {card.description && (
                  <div style={{ fontSize: '0.5rem', color: '#A09880', fontStyle: 'italic', marginTop: 2 }}>
                    {card.description.slice(0, 80)}{card.description.length > 80 ? '…' : ''}
                  </div>
                )}
              </div>

              {/* Mana cost badge */}
              {card.type !== 'land' && (
                <div style={{
                  minWidth: 24, height: 24, borderRadius: '50%',
                  background: frame.header, border: `1.5px solid ${frame.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 'bold', color: frame.headerText, flexShrink: 0,
                }}>
                  {getManaCost(card)}
                </div>
              )}

              {/* Pick button */}
              <div style={{
                padding: '4px 10px',
                background: 'rgba(200,150,30,0.15)',
                border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: 3,
                color: '#D4AF37',
                fontSize: '0.65rem',
                fontFamily: "'Cinzel',serif",
                flexShrink: 0,
              }}>
                Pick
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main BattleScreen component ───────────────────────────────────────────────
export default function BattleScreen({ npcData, playerDeck, userProgress, onBattleEnd }) {
  const { npcName = 'Opponent', color = 'colorless', deckType = 'colorless', reward = 50 } = npcData || {}

  const engineRef = useRef(null)
  const aiRef = useRef(null)

  const [gameState, setGameState] = useState(null)
  const [selectedHandIdx, setSelectedHandIdx] = useState(null)
  const [selectedBfIdx, setSelectedBfIdx] = useState(null)
  const [pendingAttackers, setPendingAttackers] = useState([])
  const [selectingAttackers, setSelectingAttackers] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [message, setMessage] = useState('')
  const [hoveredCard, setHoveredCard] = useState(null) // { card, rect }
  const [searchModal, setSearchModal] = useState(null) // { library, wishCards }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const syncState = useCallback(() => {
    if (engineRef.current) {
      setGameState({ ...engineRef.current.state })
    }
  }, [])

  const showMessage = useCallback((msg, duration = 1500) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), duration)
  }, [])

  function handleCardHover(card, rect) {
    setHoveredCard(card ? { card, rect } : null)
  }

  // ── Initialize engine on mount ───────────────────────────────────────────────
  useEffect(() => {
    import('./data/aiDecks.js').then(({ AI_DECKS }) => {
      const aiDeckDef = AI_DECKS[deckType] || AI_DECKS.colorless
      const engine = new CardEngine(playerDeck, aiDeckDef.cards, color)
      engineRef.current = engine
      aiRef.current = new AIOpponent(engine)

      for (let i = 0; i < 5; i++) engine.drawCard('player')
      for (let i = 0; i < 5; i++) engine.drawCard('ai')

      engine.state.phase = 'main'
      engine.state.activePlayer = 'player'

      syncState()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Player action handlers ───────────────────────────────────────────────────

  function handleHandCardClick(i) {
    if (!gameState || gameState.activePlayer !== 'player') return
    if (gameState.phase !== 'main') return
    if (aiThinking) return

    const card = gameState.player.hand[i]
    if (!card) return

    if (selectedHandIdx === i) {
      setSelectedHandIdx(null)
      setSelectedBfIdx(null)
      return
    }

    setSelectedHandIdx(i)
    setSelectedBfIdx(null)

    if (card.type === 'creature') {
      const cost = getManaCost(card)
      const have = gameState.player.availableMana
      const ready = have >= cost
      showMessage(
        ready
          ? `${card.name} (${cost} mana) — click Play Creature`
          : `${card.name} costs ${cost} mana — you have ${have} (play more lands)`,
        2500,
      )
    } else if (card.type === 'instant' || card.type === 'sorcery' || card.type === 'spell') {
      const cost = getManaCost(card)
      const have = gameState.player.availableMana
      const ready = have >= cost
      showMessage(
        ready
          ? `${card.name} (${cost} mana) — click Cast Spell or target a creature`
          : `${card.name} costs ${cost} mana — you have ${have} (play more lands)`,
        2500,
      )
    }
  }

  function handlePlayLand() {
    if (selectedHandIdx === null) return showMessage('Select a land card first')
    const card = gameState.player.hand[selectedHandIdx]
    if (!card || card.type !== 'land') return showMessage('Select a land card from your hand')

    const result = engineRef.current.playLand('player', selectedHandIdx)
    if (!result.ok) return showMessage(result.error)

    setSelectedHandIdx(null)
    syncState()
  }

  function handlePlayCreature() {
    if (selectedHandIdx === null) return showMessage('Select a creature card first')
    const card = gameState.player.hand[selectedHandIdx]
    if (!card || card.type !== 'creature') return showMessage('Select a creature card')

    const result = engineRef.current.castCreature('player', selectedHandIdx)
    if (!result.ok) return showMessage(result.error)

    setSelectedHandIdx(null)
    setSelectedBfIdx(null)
    syncState()
  }

  function handleCastSpell(targetType = 'player', targetIdx = -1) {
    if (selectedHandIdx === null) return showMessage('Select a spell card first')
    const card = gameState.player.hand[selectedHandIdx]
    if (!card || (card.type !== 'instant' && card.type !== 'sorcery' && card.type !== 'spell')) {
      return showMessage('Select a spell card')
    }

    const result = engineRef.current.castSpell('player', selectedHandIdx, targetIdx, targetType)
    if (!result.ok) return showMessage(result.error)

    setSelectedHandIdx(null)
    setSelectedBfIdx(null)

    if (result.needsChoice === 'search') {
      // Build wish cards: unique cards from the player's original deck
      const seen = new Set()
      const wishCards = []
      for (const entry of (playerDeck || [])) {
        const card = entry.card || entry
        if (card && !seen.has(card.id)) { seen.add(card.id); wishCards.push(card) }
      }
      setSearchModal({ library: result.library, wishCards })
      return
    }

    syncState()
  }

  function handlePlayerBfClick(i) {
    if (!gameState || aiThinking) return

    if (gameState.phase === 'main' && selectedHandIdx !== null) {
      const card = gameState.player.hand[selectedHandIdx]
      if (card && (card.type === 'instant' || card.type === 'sorcery' || card.type === 'spell')) {
        handleCastSpell('creature', i)
        return
      }
    }

    if (selectingAttackers) {
      const slot = gameState.player.battlefield[i]
      if (!slot || slot.summoningSick || slot.tapped) {
        return showMessage('That creature cannot attack (summoning sick or already tapped)')
      }
      setPendingAttackers(prev =>
        prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
      )
    }
  }

  function handleAiBfClick(i) {
    if (!gameState || aiThinking) return
    if (gameState.phase !== 'main' || selectedHandIdx === null) return

    const card = gameState.player.hand[selectedHandIdx]
    if (!card || (card.type !== 'instant' && card.type !== 'sorcery' && card.type !== 'spell')) return
    handleCastSpell('creature', i)
  }

  function handleStartAttack() {
    if (!gameState || gameState.phase !== 'main') return
    if (gameState.activePlayer !== 'player') return
    setSelectingAttackers(true)
    setPendingAttackers([])
    showMessage('Click your creatures to select attackers, then Confirm Attack')
  }

  function handleConfirmAttack() {
    if (pendingAttackers.length === 0) {
      setSelectingAttackers(false)
      return showMessage('No attackers selected')
    }

    engineRef.current.declareAttackers(pendingAttackers)
    setSelectingAttackers(false)
    setPendingAttackers([])

    const blockerMap = aiRef.current.chooseBlockers(engineRef.current.state)
    engineRef.current.declareBlockers(blockerMap)
    engineRef.current.resolveCombat()
    syncState()

    if (engineRef.current.state.winner) {
      syncState()
      return
    }

    engineRef.current.state.phase = 'end'
    syncState()
  }

  function handleEndTurn() {
    if (!gameState || gameState.activePlayer !== 'player') return
    if (aiThinking) return

    setSelectedHandIdx(null)
    setSelectedBfIdx(null)
    setSelectingAttackers(false)
    setPendingAttackers([])

    engineRef.current.endTurn('player')
    syncState()

    runAiTurn()
  }

  // ── AI turn runner ───────────────────────────────────────────────────────────
  function runAiTurn() {
    setAiThinking(true)

    setTimeout(() => {
      if (!engineRef.current) return
      engineRef.current.startTurn('ai')
      syncState()

      if (engineRef.current.state.winner) {
        setAiThinking(false)
        syncState()
        return
      }

      const actions = aiRef.current.takeTurn()
      executeAiActions(actions, 0)
    }, 800)
  }

  function executeAiActions(actions, idx) {
    if (!engineRef.current) return

    if (idx >= actions.length || engineRef.current.state.winner) {
      setTimeout(() => {
        if (!engineRef.current) return
        engineRef.current.endTurn('ai')
        syncState()

        engineRef.current.startTurn('player')
        syncState()
        setAiThinking(false)
      }, 600)
      return
    }

    const action = actions[idx]

    setTimeout(() => {
      if (!engineRef.current) return
      const engine = engineRef.current

      try {
        if (action.type === 'castCreature') {
          engine.castCreature('ai', action.handIndex)
        } else if (action.type === 'castSpell') {
          engine.castSpell('ai', action.handIndex, action.targetIndex, action.targetType)
        } else if (action.type === 'attack') {
          engine.declareAttackers(action.attackerIndices)

          const blockerMap = autoPlayerBlock(engine.state)
          engine.declareBlockers(blockerMap)
          engine.resolveCombat()
        }
      } catch (e) {
        console.warn('AI action failed:', e.message)
      }

      syncState()

      if (engine.state.winner) {
        setAiThinking(false)
        return
      }

      executeAiActions(actions, idx + 1)
    }, 700)
  }

  function autoPlayerBlock(state) {
    const player = state.player
    const attackers = state.attackers
    const blockerMap = {}
    const used = new Set()

    for (const attackerIdx of attackers) {
      const attackerSlot = state.ai.battlefield[attackerIdx]
      if (!attackerSlot) continue

      const aPow = attackerSlot.card.power
      const aTough = attackerSlot.card.toughness
      const aFlying = attackerSlot.card.abilities?.includes('flying')

      let bestIdx = null
      let bestScore = -Infinity

      for (let bi = 0; bi < player.battlefield.length; bi++) {
        if (used.has(bi)) continue
        const bSlot = player.battlefield[bi]
        if (!bSlot || bSlot.card.type !== 'creature' || bSlot.summoningSick) continue
        if (aFlying && !bSlot.card.abilities?.includes('flying')) continue

        const bPow = bSlot.card.power
        const bTough = bSlot.card.toughness
        const weKill = bPow >= aTough
        const weSurvive = bTough > aPow

        let score = 0
        if (weKill && weSurvive) score = 3
        else if (weKill) score = 1
        else if (weSurvive) score = 2
        else score = -1

        if (score > bestScore) {
          bestScore = score
          bestIdx = bi
        }
      }

      if (bestIdx !== null) {
        const lethal = player.life - aPow <= 0
        if (lethal || bestScore >= 1) {
          blockerMap[attackerIdx] = bestIdx
          used.add(bestIdx)
        }
      }
    }

    return blockerMap
  }

  // ── Render guards ─────────────────────────────────────────────────────────────
  if (!gameState) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#183858',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#F0EED8', fontSize: '1.2rem', letterSpacing: 3,
        fontFamily: "'Courier New', monospace",
      }}>
        ▶ Preparing battle...
      </div>
    )
  }

  const { player, ai, turn, phase, activePlayer, log, winner } = gameState
  const selectedCard = selectedHandIdx !== null ? player.hand[selectedHandIdx] : null
  const selectedCardCost = selectedCard ? getManaCost(selectedCard) : 0
  const canCast = selectedCard && player.availableMana >= selectedCardCost
  const isPlayerTurn = activePlayer === 'player' && !aiThinking

  const phaseLabel = {
    draw: 'DRAW', main: 'MAIN', combat: 'COMBAT', end: 'END',
  }[phase] || phase.toUpperCase()

  // ── Layout ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#183858',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Courier New', monospace",
      overflow: 'hidden',
      zIndex: 50,
    }}>
      {/* Hover tooltip — rendered at fixed position above everything */}
      {hoveredCard && (
        <CardTooltip card={hoveredCard.card} rect={hoveredCard.rect} />
      )}

      {/* Search / wish modal */}
      {searchModal && (
        <SearchModal
          library={searchModal.library}
          wishCards={searchModal.wishCards}
          onPickLibrary={(cardId) => {
            engineRef.current.completeSearch('player', cardId)
            setSearchModal(null)
            syncState()
          }}
          onPickWish={(card) => {
            engineRef.current.completeWish('player', card)
            setSearchModal(null)
            syncState()
          }}
          onSkip={() => { setSearchModal(null); syncState() }}
        />
      )}

      {/* Result overlay */}
      {winner && (
        <ResultOverlay
          winner={winner}
          reward={reward}
          npcName={npcName}
          onContinue={() => onBattleEnd({ winner: 'player', reward })}
          onRematch={() => {
            engineRef.current = null
            aiRef.current = null
            import('./data/aiDecks.js').then(({ AI_DECKS }) => {
              const aiDeckDef = AI_DECKS[deckType] || AI_DECKS.colorless
              const engine = new CardEngine(playerDeck, aiDeckDef.cards)
              engineRef.current = engine
              aiRef.current = new AIOpponent(engine)
              for (let i = 0; i < 5; i++) engine.drawCard('player')
              for (let i = 0; i < 5; i++) engine.drawCard('ai')
              engine.state.phase = 'main'
              engine.state.activePlayer = 'player'
              setSelectedHandIdx(null)
              setSelectedBfIdx(null)
              setPendingAttackers([])
              setSelectingAttackers(false)
              setAiThinking(false)
              syncState()
            })
          }}
          onRetreat={() => onBattleEnd({ winner: 'ai', reward: 0, hpDamage: 1 })}
        />
      )}

      {/* ── TOP BAR: AI stats ── */}
      <div style={{
        background: '#0A1828',
        borderBottom: '3px solid #101010',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
      }}>
        {/* GBC-style name plate */}
        <div style={{
          background: COLOR_ACCENT[color] || '#5588CC',
          border: '2px solid #101010',
          borderRadius: 2,
          padding: '1px 7px',
          fontSize: '0.72rem',
          fontWeight: 'bold',
          color: '#101010',
          letterSpacing: 1,
        }}>
          {npcName}
        </div>
        <span style={{ color: '#B0C8E8', fontSize: '0.75rem', fontWeight: 'bold' }}>HP</span>
        <LifeDots life={ai.life} />
        <span style={{ color: '#7090B0', fontSize: '0.75rem' }}>
          ◆<span style={{ color: '#88DDFF', marginLeft: 3 }}>{ai.availableMana}</span>
        </span>
        <span style={{ color: '#506880', fontSize: '0.72rem' }}>
          [{ai.hand.length}] [{ai.library.length}]
        </span>
        <span style={{ marginLeft: 'auto', color: '#506880', fontSize: '0.7rem' }}>
          TURN <span style={{ color: '#B0C8E8' }}>{turn}</span>
        </span>
        {aiThinking && (
          <span style={{ color: '#88DDFF', fontSize: '0.7rem', animation: 'pulse 1s infinite' }}>
            ▶ AI...
          </span>
        )}
      </div>

      {/* ── AI BATTLEFIELD ── */}
      <div style={{
        flex: 1,
        borderBottom: '2px solid #101010',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8,20,40,0.55)',
      }}>
        <Battlefield
          slots={ai.battlefield}
          label="AI Battlefield"
          selectedIdx={null}
          onSlotClick={isPlayerTurn && selectedHandIdx !== null ? handleAiBfClick : null}
          isFlipped={false}
          onCardHover={handleCardHover}
        />
      </div>

      {/* ── CENTER DIVIDER ── */}
      <div style={{
        height: 4,
        background: '#101010',
        flexShrink: 0,
        borderTop: '1px solid #285080',
        borderBottom: '1px solid #285080',
      }} />

      {/* ── PLAYER BATTLEFIELD ── */}
      <div style={{
        flex: 1,
        borderBottom: '2px solid #101010',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10,30,55,0.45)',
      }}>
        <Battlefield
          slots={player.battlefield}
          label="Your Battlefield"
          selectedIdx={null}
          onSlotClick={isPlayerTurn ? handlePlayerBfClick : null}
          attackingIndices={selectingAttackers ? pendingAttackers : []}
          onCardHover={handleCardHover}
        />
        {/* Lands zone */}
        {player.lands.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 12px 5px', flexWrap: 'wrap' }}>
            <span style={{ color: '#506880', fontSize: '0.55rem', letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Courier New', monospace" }}>LANDS</span>
            {player.lands.map((l, i) => {
              const lColor = l.card.color || 'colorless'
              const lFrame = CARD_FRAME[lColor] || CARD_FRAME.colorless
              return (
                <div
                  key={i}
                  onMouseEnter={e => handleCardHover(l.card, e.currentTarget.getBoundingClientRect())}
                  onMouseLeave={() => handleCardHover(null, null)}
                  style={{
                    width: 26, height: 34,
                    border: `2px solid ${l.tapped ? '#303030' : '#101010'}`,
                    borderRadius: 1,
                    background: l.tapped ? `${lFrame.art2}55` : lFrame.header,
                    transform: l.tapped ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 'bold',
                    color: l.tapped ? '#404040' : lFrame.headerText,
                    flexShrink: 0,
                    cursor: 'default',
                    fontFamily: "'Courier New', monospace",
                  }}
                  title={l.card.name}
                >
                  {l.card.name[0]}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── BOTTOM BAR: Player controls ── */}
      <div style={{
        background: '#0A1828',
        borderTop: '3px solid #101010',
        padding: '6px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        flexShrink: 0,
      }}>
        {/* Player stats row — GBC name plate + hearts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            background: '#D4AF37',
            border: '2px solid #101010',
            borderRadius: 2,
            padding: '1px 7px',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            color: '#101010',
            letterSpacing: 1,
          }}>
            YOU
          </div>
          <span style={{ color: '#B0C8E8', fontSize: '0.75rem', fontWeight: 'bold' }}>HP</span>
          <LifeDots life={player.life} />
          <span style={{ color: '#7090B0', fontSize: '0.75rem' }}>
            ◆<span style={{ color: '#88DDFF', marginLeft: 3, fontWeight: 'bold' }}>{player.availableMana}</span>
            <span style={{ color: '#506880', marginLeft: 4 }}>({player.lands.length})</span>
          </span>
          <span style={{ color: '#7090B0', fontSize: '0.75rem' }}>
            PHASE: <span style={{ color: '#FFEE88', fontWeight: 'bold' }}>{phaseLabel}</span>
          </span>
          <span style={{ color: '#506880', fontSize: '0.72rem' }}>
            [{player.library.length}]
          </span>
          {message && (
            <span style={{ color: '#FFEE44', fontSize: '0.75rem', marginLeft: 8 }}>{message}</span>
          )}
        </div>

        {/* Hand + controls row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Hand */}
          <div style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            flex: 1,
            minWidth: 0,
          }}>
            {player.hand.length === 0 && (
              <div style={{ color: '#2A4060', fontSize: '0.72rem', alignSelf: 'center', fontStyle: 'italic' }}>
                — no cards —
              </div>
            )}
            {player.hand.map((card, i) => (
              <div
                key={i}
                style={{
                  transform: selectedHandIdx === i ? 'translateY(-8px)' : 'none',
                  transition: 'transform 0.15s',
                }}
              >
                <BattleCard
                  card={card}
                  size="hand"
                  isSelected={selectedHandIdx === i}
                  onClick={isPlayerTurn ? () => handleHandCardClick(i) : undefined}
                  onHover={handleCardHover}
                />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-primary"
                disabled={!isPlayerTurn || selectedHandIdx === null || !selectedCard || selectedCard.type !== 'creature' || !canCast}
                title={
                  !isPlayerTurn ? 'Not your turn'
                  : !selectedCard ? 'Select a creature from your hand'
                  : selectedCard.type !== 'creature' ? 'Select a creature card (not a spell or land)'
                  : !canCast ? `Costs ${selectedCardCost} mana — you have ${player.availableMana} (play more lands)`
                  : `Play ${selectedCard.name}`
                }
                onClick={handlePlayCreature}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Play Creature
              </button>

              <button
                className="btn-ghost"
                disabled={!isPlayerTurn || selectedHandIdx === null || !selectedCard || selectedCard.type !== 'land' || player.landsPlayedThisTurn >= player.landLimit}
                title={
                  !isPlayerTurn ? 'Not your turn'
                  : !selectedCard ? 'Select a land from your hand'
                  : selectedCard.type !== 'land' ? 'Select a land card'
                  : player.landsPlayedThisTurn >= player.landLimit ? 'Already played a land this turn'
                  : `Play ${selectedCard.name}`
                }
                onClick={handlePlayLand}
                style={{ fontSize: '0.75rem', padding: '4px 10px', borderColor: '#D4AF37', color: '#D4AF37' }}
              >
                Play Land
              </button>

              <button
                className="btn-ghost"
                disabled={!isPlayerTurn || selectedHandIdx === null || !selectedCard || (selectedCard.type !== 'instant' && selectedCard.type !== 'sorcery' && selectedCard.type !== 'spell') || !canCast}
                title={
                  !isPlayerTurn ? 'Not your turn'
                  : !selectedCard ? 'Select a spell from your hand'
                  : (selectedCard.type !== 'instant' && selectedCard.type !== 'sorcery' && selectedCard.type !== 'spell') ? 'Select an instant, sorcery, or spell card'
                  : !canCast ? `Costs ${selectedCardCost} mana — you have ${player.availableMana} (play more lands)`
                  : `Cast ${selectedCard.name}`
                }
                onClick={() => handleCastSpell('player', -1)}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Cast Spell
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {!selectingAttackers ? (
                <button
                  className="btn-ghost"
                  disabled={!isPlayerTurn || phase === 'draw'}
                  onClick={handleStartAttack}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  Attack
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleConfirmAttack}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#cc4422' }}
                >
                  Confirm Attack ({pendingAttackers.length})
                </button>
              )}

              <button
                className="btn-ghost"
                disabled={!isPlayerTurn || aiThinking}
                onClick={handleEndTurn}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                End Turn
              </button>
            </div>
          </div>

          {/* Game log */}
          <GameLog log={log} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
