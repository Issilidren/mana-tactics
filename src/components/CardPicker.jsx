import { useEffect, useState } from 'react'
import api from '../lib/axios'

const COLORS = ['all', 'white', 'blue', 'black', 'red', 'green', 'colorless']
const TYPES  = ['all', 'creature', 'spell', 'enchantment', 'artifact', 'land']

const CARD_FRAME = {
  white:     { border: '#8B7A30', header: '#D4C460', headerText: '#2a1a00', bg: '#F5EFD0', art1: '#E8DC90', art2: '#BCA840' },
  blue:      { border: '#113377', header: '#2255AA', headerText: '#EEF4FF', bg: '#E8F0F8', art1: '#5588CC', art2: '#1133AA' },
  black:     { border: '#6611BB', header: '#6633AA', headerText: '#EEE8FF', bg: '#281A3A', art1: '#7744BB', art2: '#2A1040' },
  red:       { border: '#881100', header: '#CC3311', headerText: '#FFF0EE', bg: '#F8EAE5', art1: '#DD7755', art2: '#AA2200' },
  green:     { border: '#0A5A0A', header: '#228822', headerText: '#F0FFF0', bg: '#E5F0E5', art1: '#66BB66', art2: '#224422' },
  colorless: { border: '#444444', header: '#777777', headerText: '#FFFFFF', bg: '#F0EEEA', art1: '#AAAAAA', art2: '#666666' },
}

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
}

const ART_OVERLAY = [
  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
  'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
].join(', ')

function CardHoverTooltip({ card, rect }) {
  if (!card || !rect) return null

  const frame = CARD_FRAME[card.color] || CARD_FRAME.colorless
  const isCreature = card.type === 'creature'
  const isLand = card.type === 'land'
  const abilities = card.abilities || []
  const darkBg = frame.bg === '#281A3A'

  const TW = 210
  const TH = 320
  let left = rect.right + 10
  if (left + TW > window.innerWidth - 8) left = rect.left - TW - 10
  let top = rect.top
  if (top + TH > window.innerHeight - 8) top = window.innerHeight - TH - 8
  top = Math.max(8, top)

  const manaCost = card.mana_cost
    ? Object.values(card.mana_cost).reduce((s, v) => s + (v || 0), 0)
    : 0

  return (
    <div style={{
      position: 'fixed', left, top,
      width: TW, zIndex: 9999,
      pointerEvents: 'none',
      background: frame.bg,
      border: `3px solid ${frame.border}`,
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '4px 4px 0px rgba(0,0,0,0.85)',
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        background: frame.header,
        padding: '6px 8px',
        borderBottom: `2px solid ${frame.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: frame.headerText, flex: 1, lineHeight: 1.2 }}>
            {card.name}
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: frame.headerText, flexShrink: 0, marginLeft: 6 }}>
            {isCreature ? `HP ${(card.toughness || 0) * 10}` : isLand ? '∞' : `${manaCost}◆`}
          </span>
        </div>
        <div style={{ fontSize: '0.5rem', color: `${frame.headerText}cc`, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
          {card.type}{card.rarity ? ` · ${card.rarity}` : ''}
        </div>
      </div>

      {/* Art area */}
      <div style={{
        height: 90,
        background: `radial-gradient(ellipse at 40% 40%, ${frame.art1} 0%, ${frame.art2} 100%)`,
        margin: '5px',
        borderRadius: 3,
        border: `2px solid ${frame.border}88`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: ART_OVERLAY }} />
        <span style={{ fontSize: '2.8rem', filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.8))', zIndex: 1, lineHeight: 1 }}>
          {isCreature ? '⚔' : isLand ? '🏔' : '✨'}
        </span>
      </div>

      {/* Type bar */}
      <div style={{
        background: `${frame.header}55`,
        padding: '3px 8px',
        fontSize: '0.5rem',
        color: darkBg ? '#DDD' : '#222',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
        borderTop: `1px solid ${frame.border}55`,
        borderBottom: `1px solid ${frame.border}55`,
      }}>
        {isCreature ? 'Creature' : isLand ? 'Basic Land' : card.type}
        {card.subtype ? ` — ${card.subtype}` : ''}
      </div>

      {/* Text box */}
      <div style={{ padding: '6px 8px 28px', minHeight: 60, position: 'relative' }}>
        {abilities.map(ab => (
          <div key={ab} style={{
            fontSize: '0.58rem', color: darkBg ? '#DDD8FF' : '#1a1a1a',
            fontStyle: 'italic', lineHeight: 1.35, marginBottom: 3,
          }}>
            {ABILITY_RULES[ab] || ab}
          </div>
        ))}
        {card.description && (
          <div style={{
            fontSize: '0.58rem', color: darkBg ? '#C8C0E8' : '#3a2a10',
            fontStyle: 'italic', lineHeight: 1.35,
            marginTop: abilities.length ? 4 : 0,
            borderTop: abilities.length ? `1px solid ${frame.border}33` : 'none',
            paddingTop: abilities.length ? 4 : 0,
          }}>
            {card.description}
          </div>
        )}
        {isLand && (
          <div style={{ fontSize: '0.55rem', color: darkBg ? '#AAA' : '#555', fontStyle: 'italic' }}>
            Tap: Add 1 mana to your pool.
          </div>
        )}
        {isCreature && card.power != null && (
          <div style={{
            position: 'absolute', bottom: 5, right: 8,
            background: frame.bg, border: `2px solid ${frame.border}`,
            borderRadius: 4, padding: '2px 8px',
            fontSize: '0.82rem', fontWeight: 'bold',
            color: darkBg ? '#EEE' : '#1a1a1a',
            boxShadow: '1px 2px 0 rgba(0,0,0,0.4)',
          }}>
            {card.power} / {card.toughness}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CardPicker({ deckId, existingCardIds, onCardAdded, deckCards }) {
  const [cards, setCards]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [colorFilter, setColor]     = useState('all')
  const [typeFilter, setType]       = useState('all')
  const [search, setSearch]         = useState('')
  const [hovered, setHovered]       = useState(null)  // { card, rect }

  useEffect(() => {
    fetchCards()
  }, [])

  async function fetchCards() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/cards?order=color.asc,name.asc')
      setCards(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to load cards')
    } finally {
      setLoading(false)
    }
  }

  // Build a map of card_id -> {id (deck_card id), quantity}
  const deckCardMap = {}
  if (deckCards) {
    for (const dc of deckCards) {
      deckCardMap[dc.card_id] = { deckCardId: dc.id, quantity: dc.quantity }
    }
  }

  const filtered = cards.filter(c => {
    if (colorFilter !== 'all' && c.color !== colorFilter) return false
    if (typeFilter  !== 'all' && c.type  !== typeFilter)  return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleAdd(card) {
    try {
      await api.post('/deck_cards', { deck_id: deckId, card_id: card.id, quantity: 1 })
      onCardAdded()
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to add card')
    }
  }

  async function handleIncrement(card) {
    const entry = deckCardMap[card.id]
    if (!entry || entry.quantity >= 3) return
    try {
      await api.patch(`/deck_cards?id=eq.${entry.deckCardId}`, { quantity: entry.quantity + 1 })
      onCardAdded()
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to update quantity')
    }
  }

  async function handleDecrement(card) {
    const entry = deckCardMap[card.id]
    if (!entry) return
    try {
      if (entry.quantity === 1) {
        await api.delete(`/deck_cards?id=eq.${entry.deckCardId}`)
      } else {
        await api.patch(`/deck_cards?id=eq.${entry.deckCardId}`, { quantity: entry.quantity - 1 })
      }
      onCardAdded()
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to update quantity')
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {hovered && <CardHoverTooltip card={hovered.card} rect={hovered.rect} />}
      <h3 style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>Add Cards</h3>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <select
          className="input"
          style={{ width: 'auto' }}
          value={colorFilter}
          onChange={e => setColor(e.target.value)}
        >
          {COLORS.map(c => <option key={c} value={c}>{c === 'all' ? 'All colors' : c}</option>)}
        </select>

        <select
          className="input"
          style={{ width: 'auto' }}
          value={typeFilter}
          onChange={e => setType(e.target.value)}
        >
          {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>)}
        </select>

        <input
          className="input"
          style={{ flex: 1, minWidth: 160 }}
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="loading-msg">Loading cards…</p>}
      {error   && <p className="error-msg">{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 380, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No cards match your filters.</p>
          )}
          {filtered.map(card => {
            const entry   = deckCardMap[card.id]
            const inDeck  = Boolean(entry)
            const qty     = entry?.quantity ?? 0
            const atMax   = qty >= 3

            return (
              <div
                key={card.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', position: 'relative' }}
                onMouseEnter={e => setHovered({ card, rect: e.currentTarget.getBoundingClientRect() })}
                onMouseLeave={() => setHovered(null)}
              >
                <span className={`badge-${card.color}`} style={{ flexShrink: 0 }}>{card.color}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{card.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{card.type}</span>
                    {card.type === 'creature' && card.power != null && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {card.power}/{card.toughness}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>[{card.rarity}]</span>
                  </div>
                  {card.description && (
                    <div style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      marginTop: '0.15rem',
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {card.description}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  {inDeck ? (
                    <>
                      <button
                        className="btn-ghost"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '1rem', lineHeight: 1 }}
                        onClick={() => handleDecrement(card)}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 16, textAlign: 'center', fontWeight: 'bold' }}>{qty}</span>
                      <button
                        className="btn-ghost"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '1rem', lineHeight: 1 }}
                        onClick={() => handleIncrement(card)}
                        disabled={atMax}
                      >
                        +
                      </button>
                    </>
                  ) : (
                    <button className="btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => handleAdd(card)}>
                      Add
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
