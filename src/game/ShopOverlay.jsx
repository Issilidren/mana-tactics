import { useState, useEffect } from 'react'
import { FRAME, artUrl } from '../lib/cardUtils'

const PACK_COLORS = ['#C8A820','#1A66CC','#5522AA','#EE3311','#228833']

export default function ShopOverlay({ listing, gold, onBuyPack, onClose, prizeCards = null }) {
  const [phase, setPhase]         = useState('browse')   // 'browse' | 'opening' | 'done'
  const [cards, setCards]         = useState([])
  const [revealedCount, setRevealedCount] = useState(0)
  const [buying, setBuying]       = useState(false)
  const [error, setError]         = useState('')

  // Jump to opening phase immediately when prize pack provided
  useEffect(() => {
    if (prizeCards && prizeCards.length > 0) {
      setCards(prizeCards)
      setRevealedCount(0)
      setPhase('opening')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reveal one card at a time during 'opening' phase
  useEffect(() => {
    if (phase !== 'opening') return
    if (revealedCount >= cards.length) { setPhase('done'); return }
    const t = setTimeout(() => setRevealedCount(n => n + 1), 550)
    return () => clearTimeout(t)
  }, [phase, revealedCount, cards.length])

  async function handleBuy() {
    if (buying) return
    setBuying(true)
    setError('')
    const result = await onBuyPack()
    setBuying(false)
    if (!result || result.length === 0) {
      setError('Not enough gold or shop unavailable.')
      return
    }
    setCards(result)
    setRevealedCount(0)
    setPhase('opening')
  }

  function handleClose() {
    setPhase('browse')
    setCards([])
    setRevealedCount(0)
    onClose()
  }

  const canAfford = listing && gold >= listing.gold_price
  const goldColor = canAfford ? '#D4AF37' : '#CC4444'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(4,6,12,0.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
    }}>

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'rgba(20,12,4,0.95)', borderBottom: '2px solid #C8961E',
        padding: '0.6rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: '1.1rem', color: '#D4AF37', letterSpacing: '0.12em', fontWeight: 900 }}>
          {prizeCards ? '✦ VICTORY REWARD ✦' : '✦ CARD SHOP ✦'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ color: goldColor, fontSize: '0.9rem' }}>
            🪙 {gold} gold
          </span>
          <button onClick={handleClose} style={{
            background: 'transparent', border: '1px solid rgba(212,175,55,0.4)',
            color: '#D4AF37', cursor: 'pointer', padding: '0.3rem 0.8rem',
            fontFamily: "'Cinzel',serif", fontSize: '0.7rem', letterSpacing: '0.06em',
          }}>
            ✕ CLOSE
          </button>
        </div>
      </div>

      {/* === BROWSE phase === */}
      {phase === 'browse' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
          background: 'rgba(8,14,26,0.92)', border: '2px solid rgba(212,175,55,0.3)',
          borderRadius: 8, padding: '2rem 2.5rem', maxWidth: 360, width: '90%',
        }}>
          {/* Pack art */}
          <div style={{
            width: 120, height: 160, borderRadius: 10, position: 'relative',
            background: 'linear-gradient(145deg,#1A0E2A,#0A0E1A)',
            border: '2px solid #D4AF37',
            boxShadow: '0 0 24px rgba(212,175,55,0.3), 0 0 8px rgba(212,175,55,0.15)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {/* Color stripe decoration */}
            {PACK_COLORS.map((c, i) => (
              <div key={i} style={{
                position: 'absolute', bottom: 0, left: `${i * 20}%`, width: '20%', height: 4,
                background: c,
              }} />
            ))}
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🃏</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '0.6rem', color: '#D4AF37', letterSpacing: '0.1em', textAlign: 'center' }}>
              BOOSTER<br/>PACK
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1rem', color: '#F0E8C8', marginBottom: 4 }}>
              {listing?.name ?? 'Booster Pack'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#A09070', marginBottom: 12 }}>
              5 random cards from the arcane library
            </div>
            <div style={{ fontSize: '1.1rem', color: '#D4AF37' }}>
              🪙 {listing?.gold_price ?? 50} gold
            </div>
          </div>

          {error && (
            <div style={{ color: '#CC4444', fontSize: '0.7rem', textAlign: 'center' }}>{error}</div>
          )}

          <button
            onClick={handleBuy}
            disabled={buying || !canAfford}
            style={{
              width: '100%', padding: '0.65rem',
              background: canAfford ? '#C8961E' : 'rgba(90,70,40,0.4)',
              border: `1px solid ${canAfford ? '#D4AF37' : 'rgba(90,70,40,0.4)'}`,
              color: canAfford ? '#0A0E1A' : '#5A5040',
              fontFamily: "'Cinzel',serif", fontSize: '0.85rem', fontWeight: 700,
              letterSpacing: '0.08em', cursor: canAfford ? 'pointer' : 'not-allowed',
              borderRadius: 4,
            }}>
            {buying ? 'Opening…' : canAfford ? 'Open Pack' : 'Not Enough Gold'}
          </button>
        </div>
      )}

      {/* === OPENING / DONE phase === */}
      {(phase === 'opening' || phase === 'done') && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', paddingTop: '4rem' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '1rem', color: '#D4AF37', letterSpacing: '0.1em' }}>
            {phase === 'opening' ? (prizeCards ? 'Your victory reward…' : 'Revealing your cards…') : (prizeCards ? 'Seal earned — cards are yours!' : 'Pack opened!')}
          </div>

          {/* 5 card row */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {cards.map((card, i) => {
              const revealed = i < revealedCount
              const f = FRAME[card.color] || FRAME.colorless
              const art = artUrl(card.image_url)
              const isCr = card.type === 'creature'
              const mc = card.mana_cost ? Object.values(card.mana_cost).reduce((s, v) => s + (v || 0), 0) : 0
              return (
                <div key={card.id} style={{
                  width: 110, height: 155, borderRadius: 8, position: 'relative',
                  perspective: 700,
                  cursor: 'default',
                }}>
                  <div style={{
                    width: '100%', height: '100%', position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.5s ease',
                    transform: revealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
                  }}>
                    {/* Front face */}
                    <div style={{
                      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                      borderRadius: 8, overflow: 'hidden',
                      border: `2px solid ${f.glow}`,
                      boxShadow: `0 0 12px ${f.glow}55`,
                      background: '#06090F',
                    }}>
                      {art
                        ? <img src={art} alt={card.name}
                            style={{ width: '100%', height: '70%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                        : <div style={{ height: '70%', background: `radial-gradient(ellipse,${f.art1},${f.art2})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                            {isCr ? '⚔' : '✨'}
                          </div>
                      }
                      <div style={{ padding: '4px 6px', background: f.header }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 'bold', color: f.headerText,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: "'Cinzel',serif" }}>
                          {card.name}
                        </div>
                        <div style={{ fontSize: '0.45rem', color: `${f.headerText}bb`, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {card.type}{card.rarity ? ` · ${card.rarity}` : ''}
                        </div>
                      </div>
                      {!isCr && mc > 0 && (
                        <div style={{ position: 'absolute', top: 4, left: 4, width: 18, height: 18,
                          borderRadius: '50%', background: 'rgba(4,6,12,0.88)', border: `1.5px solid ${f.glow}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.45rem', fontWeight: 'bold', color: '#D4AF37' }}>
                          {mc}
                        </div>
                      )}
                      {isCr && card.power != null && (
                        <div style={{ position: 'absolute', bottom: 36, right: 4, display: 'flex', gap: 2 }}>
                          <div style={{ background: 'rgba(180,30,10,0.9)', border: '1px solid #FF4422',
                            borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.38rem', fontWeight: 'bold', color: '#FFC0B0' }}>
                            {card.power}
                          </div>
                          <div style={{ background: 'rgba(10,120,30,0.9)', border: '1px solid #44CC44',
                            borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.38rem', fontWeight: 'bold', color: '#B0FFB8' }}>
                            {card.toughness}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Back face */}
                    <div style={{
                      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                      borderRadius: 8, transform: 'rotateY(180deg)',
                      background: 'linear-gradient(145deg,#1A0E2A,#06090F)',
                      border: '2px solid rgba(212,175,55,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: '2.2rem', opacity: 0.6 }}>🃏</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {phase === 'done' && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {!prizeCards && <button onClick={() => { setPhase('browse'); setCards([]); setRevealedCount(0) }}
                style={{
                  padding: '0.5rem 1.2rem', background: 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
                  fontFamily: "'Cinzel',serif", fontSize: '0.75rem', letterSpacing: '0.06em',
                  cursor: 'pointer', borderRadius: 4,
                }}>
                Open Another
              </button>}
              <button onClick={handleClose}
                style={{
                  padding: '0.5rem 1.2rem', background: 'transparent',
                  border: '1px solid rgba(90,120,160,0.4)', color: '#7090B0',
                  fontFamily: "'Cinzel',serif", fontSize: '0.75rem', letterSpacing: '0.06em',
                  cursor: 'pointer', borderRadius: 4,
                }}>
                {prizeCards ? 'Claim & Close' : 'Return to Hub'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
