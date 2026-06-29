import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import { supabase } from '../lib/supabase'
import PhaserGame from '../game/PhaserGame'
import BattleScreen from '../game/BattleScreen'
import ShopOverlay from '../game/ShopOverlay'
import Home from './Home'

const STARTER_NAMES = {
  white: "Dawn's Shield",
  blue:  "Mind's Reach",
  black: "Shadow's Grasp",
  red:   "Flame's Fury",
  green: "Wild's Call",
}

// Seed-card UUIDs guaranteed to exist — used in every starter deck
const SEED_CARDS = {
  white_knight: '00000001-0000-0000-0000-000000000003',
  serra_angel:  '00000001-0000-0000-0000-000000000001',
  archangel:    '00000001-0000-0000-0000-000000000002',
  air_elemental:'00000001-0000-0000-0000-000000000004',
  counterspell: '00000001-0000-0000-0000-000000000005',
  brainstorm:   '00000001-0000-0000-0000-000000000006',
  sengir_vampire:'00000001-0000-0000-0000-000000000007',
  dark_ritual:  '00000001-0000-0000-0000-000000000008',
  terror:       '00000001-0000-0000-0000-000000000009',
  shivan_dragon:'00000001-0000-0000-0000-000000000010',
  lightning_bolt:'00000001-0000-0000-0000-000000000011',
  goblin_guide: '00000001-0000-0000-0000-000000000012',
  force_of_nature:'00000001-0000-0000-0000-000000000013',
  llanowar_elves:'00000001-0000-0000-0000-000000000014',
  giant_growth: '00000001-0000-0000-0000-000000000015',
  plains:       '00000001-0000-0000-0000-000000000016',
  island:       '00000001-0000-0000-0000-000000000017',
  swamp:        '00000001-0000-0000-0000-000000000018',
  mountain:     '00000001-0000-0000-0000-000000000019',
  forest:       '00000001-0000-0000-0000-000000000020',
}

// Curated seed cards per color: { card_id, quantity }[]
// 10 lands + ~20 non-land = 30 cards
const STARTER_SEED_CARDS = {
  white: [
    { card_id: SEED_CARDS.white_knight,  quantity: 4 },
    { card_id: SEED_CARDS.serra_angel,   quantity: 3 },
    { card_id: SEED_CARDS.archangel,     quantity: 2 },
    { card_id: SEED_CARDS.plains,        quantity: 10 },
  ],
  blue: [
    { card_id: SEED_CARDS.air_elemental, quantity: 3 },
    { card_id: SEED_CARDS.counterspell,  quantity: 4 },
    { card_id: SEED_CARDS.brainstorm,    quantity: 4 },
    { card_id: SEED_CARDS.island,        quantity: 10 },
  ],
  black: [
    { card_id: SEED_CARDS.sengir_vampire,quantity: 3 },
    { card_id: SEED_CARDS.dark_ritual,   quantity: 4 },
    { card_id: SEED_CARDS.terror,        quantity: 4 },
    { card_id: SEED_CARDS.swamp,         quantity: 10 },
  ],
  red: [
    { card_id: SEED_CARDS.lightning_bolt,quantity: 4 },
    { card_id: SEED_CARDS.goblin_guide,  quantity: 3 },
    { card_id: SEED_CARDS.shivan_dragon, quantity: 2 },
    { card_id: SEED_CARDS.mountain,      quantity: 10 },
  ],
  green: [
    { card_id: SEED_CARDS.llanowar_elves,quantity: 4 },
    { card_id: SEED_CARDS.giant_growth,  quantity: 4 },
    { card_id: SEED_CARDS.force_of_nature,quantity: 2 },
    { card_id: SEED_CARDS.forest,        quantity: 10 },
  ],
}

export default function GamePage() {
  const { user, signOut }  = useAuth()
  const navigate  = useNavigate()
  const gameRef   = useRef(null)

  const [playerCards, setPlayerCards]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeBattle, setActiveBattle] = useState(null)
  const [shopOpen, setShopOpen]         = useState(false)
  const [prizePackCards, setPrizePackCards] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [deckOpen, setDeckOpen] = useState(false)
  const [collectionVersion, setCollectionVersion] = useState(0)
  const [shopListing, setShopListing]   = useState(null)
  const [progress, setProgress]         = useState(() => ({
    gold:  parseInt(localStorage.getItem('mt_gold')  ?? '0', 10),
    seals: JSON.parse(localStorage.getItem('mt_seals') ?? '[]'),
    hp:    parseInt(localStorage.getItem('mt_hp') ?? '10', 10),
  }))

  useEffect(() => {
    if (!user) return
    loadLatestDeck()
    fetchProgress()
    fetchShopListing()
  }, [user])  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProgress() {
    try {
      const res = await api.get(`/player_profiles?user_id=eq.${user.id}&limit=1`)
      if (res.data.length) {
        const p = res.data[0]
        setProgress({ gold: p.gold, hp: p.hp, seals: p.seals ?? [] })
      } else {
        await api.post('/player_profiles',
          { user_id: user.id, gold: 0, hp: 10, seals: [] },
          { headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }
        )
      }
    } catch (_) {}
  }

  async function saveProgress(gold, hp, seals) {
    localStorage.setItem('mt_gold',  String(gold))
    localStorage.setItem('mt_hp',    String(hp))
    localStorage.setItem('mt_seals', JSON.stringify(seals))
    try {
      await api.post('/player_profiles?on_conflict=user_id',
        { user_id: user.id, gold, hp, seals },
        { headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }
      )
    } catch (_) {}
  }

  async function logTransaction(eventType, goldDelta, hpDelta, description) {
    try {
      await api.post('/transactions', {
        user_id: user.id, event_type: eventType,
        gold_delta: goldDelta, hp_delta: hpDelta, description,
      })
    } catch (_) {}
  }

  async function fetchShopListing() {
    try {
      const res = await api.get('/shop_listings?available=eq.true&limit=1')
      if (res.data.length) setShopListing(res.data[0])
    } catch (_) {}
  }

  async function loadLatestDeck() {
    setLoading(true)
    try {
      const res = await api.get(`/decks?user_id=eq.${user.id}&order=updated_at.desc&limit=1`)
      if (res.data.length > 0) await loadDeckCards(res.data[0].id)
    } catch (_) {}
    setLoading(false)
  }

  async function loadDeckCards(deckId) {
    const res = await api.get(`/deck_cards?deck_id=eq.${deckId}&select=*,cards(*)`)
    const flat = []
    for (const entry of res.data) {
      for (let i = 0; i < (entry.quantity ?? 1); i++) flat.push({ ...entry.cards })
    }
    setPlayerCards(flat)
  }

  async function handleStarterPicked({ color }) {
    try {
      const name    = STARTER_NAMES[color] ?? 'Starter Deck'
      const deckRes = await api.post('/decks', { user_id: user.id, name, color, description: `Your first deck — ${name}` })
      const deck    = deckRes.data[0]
      if (!deck) return

      // Start with curated seed cards for this color
      const seedSlots  = STARTER_SEED_CARDS[color] ?? STARTER_SEED_CARDS.white
      const deckCards  = [...seedSlots]                      // { card_id, quantity }[]
      const collCards  = [...seedSlots]                      // same set goes into collection

      // Fill up to 30 with common/uncommon Scryfall cards of this color (no lands)
      const totalSeed  = seedSlots.reduce((s, e) => s + e.quantity, 0)
      const needed     = 30 - totalSeed
      if (needed > 0) {
        const fillRes = await api.get(
          `/cards?color=eq.${color}&type=neq.land&rarity=in.(common,uncommon)&limit=${Math.ceil(needed / 2)}`
        )
        const filled = fillRes.data.map(c => ({ card_id: c.id, quantity: 2 })).slice(0, Math.ceil(needed / 2))
        deckCards.push(...filled)
        collCards.push(...filled)
      }

      // Write deck_cards
      await api.post('/deck_cards', deckCards.map(e => ({ deck_id: deck.id, card_id: e.card_id, quantity: e.quantity })))

      // Seed the player_cards collection — use Supabase client to avoid Prefer header conflicts
      const { error: collErr } = await supabase
        .from('player_cards')
        .upsert(
          collCards.map(e => ({ user_id: user.id, card_id: e.card_id, quantity: e.quantity })),
          { onConflict: 'user_id,card_id' }
        )
      if (collErr) console.error('player_cards seed failed:', collErr)

      await loadDeckCards(deck.id)
    } catch (err) { console.error('handleStarterPicked failed:', err) }
  }

  function handleBattleStart(npcData) {
    if (playerCards.length === 0) {
      alert('You need a deck first! Visit the Deck Builder from the main menu.')
      return
    }
    setActiveBattle(npcData)
  }

  function handleBattleEnd({ winner, reward, hpDamage = 0 }) {
    const color = activeBattle?.color
    const isFirstSealWin = winner === 'player' && activeBattle?.archmage && !progress.seals.includes(color)
    setActiveBattle(null)
    let next
    if (winner === 'player') {
      const newGold  = progress.gold + (reward ?? 0)
      const newSeals = progress.seals.includes(color)
        ? progress.seals
        : [...progress.seals, color].filter(Boolean)
      // Heal on victory: +2 HP (capped at 10), or full restore for Triad wins
      const isTriad = activeBattle?.deckType?.startsWith('triad-')
      const healedHp = isTriad
        ? 10                                          // Triad victory = full restore
        : Math.min(10, progress.hp + 2)               // Normal win = +2 HP
      next = { gold: newGold, hp: healedHp, seals: newSeals }
      if (newSeals.length >= 5 && !progress.seals.includes(color)) setGameComplete(true)
    } else {
      const newHp = Math.max(0, progress.hp - hpDamage)
      next = { gold: progress.gold, hp: newHp, seals: progress.seals }
      if (newHp <= 0) {
        next.hp = 10  // reset HP so they're not stuck at 0
        setGameOver(true)
      }
    }
    setProgress(next)
    saveProgress(next.gold, next.hp, next.seals)
    if (winner === 'player') {
      const goldEarned = (reward ?? 0)
      const hpGained   = next.hp - progress.hp
      logTransaction('battle_win', goldEarned, hpGained,
        `Defeated ${activeBattle?.name ?? 'opponent'} — +${goldEarned} gold, +${hpGained} HP`)
    } else {
      logTransaction('battle_loss', 0, -(hpDamage),
        `Retreated from ${activeBattle?.name ?? 'battle'} — -${hpDamage} HP`)
    }
    if (isFirstSealWin) {
      const offset = Math.floor(Math.random() * 315)
      api.get(`/cards?order=id.asc&limit=5&offset=${offset}`).then(async res => {
        const cards = res.data
        if (!cards?.length) return
        setPrizePackCards(cards)
        // Add prize cards to collection with proper quantity increment
        try {
          const cardIds = cards.map(c => c.id)
          const { data: existing } = await supabase
            .from('player_cards')
            .select('card_id,quantity')
            .eq('user_id', user.id)
            .in('card_id', cardIds)
          const owned = {}
          for (const row of existing || []) owned[row.card_id] = row.quantity
          const { error } = await supabase
            .from('player_cards')
            .upsert(
              cards.map(c => ({ user_id: user.id, card_id: c.id, quantity: (owned[c.id] || 0) + 1 })),
              { onConflict: 'user_id,card_id' }
            )
          if (error) throw error
          setCollectionVersion(v => v + 1)
        } catch (err) { console.error('Prize pack upsert failed:', err) }
      }).catch(() => {})
    }
  }

  async function handleBuyPack() {
    if (!shopListing || progress.gold < shopListing.gold_price) return []
    try {
      const offset = Math.floor(Math.random() * 315)
      const cardsRes = await api.get(`/cards?order=id.asc&limit=5&offset=${offset}`)
      if (!cardsRes.data?.length) return []

      // Deduct gold immediately — this must not be blocked by purchases/collection saves
      const next = { ...progress, gold: progress.gold - shopListing.gold_price }
      setProgress(next)
      saveProgress(next.gold, next.hp, next.seals)
      logTransaction('shop_purchase', -shopListing.gold_price, 0,
        `Bought Booster Pack — -${shopListing.gold_price} gold`)

      // Log purchase — fire and forget, never block the card reveal
      api.post('/purchases', {
        user_id: user.id, listing_id: shopListing.id, gold_spent: shopListing.gold_price,
      }).catch(e => console.warn('purchases log failed:', e))

      // Add to collection — separate async block, never blocks card reveal
      const cards = cardsRes.data
      ;(async () => {
        try {
          const cardIds = cards.map(c => c.id)
          const { data: existing } = await supabase
            .from('player_cards')
            .select('card_id,quantity')
            .eq('user_id', user.id)
            .in('card_id', cardIds)
          const owned = {}
          for (const row of existing || []) owned[row.card_id] = row.quantity
          const { error } = await supabase
            .from('player_cards')
            .upsert(
              cards.map(c => ({ user_id: user.id, card_id: c.id, quantity: (owned[c.id] || 0) + 1 })),
              { onConflict: 'user_id,card_id' }
            )
          if (error) console.error('player_cards upsert error:', error)
        } catch (e) {
          console.error('Failed to save pack cards to collection:', e)
        } finally {
          setCollectionVersion(v => v + 1)
        }
      })()

      return cards
    } catch (err) {
      console.error('handleBuyPack failed:', err)
      return []
    }
  }

  function handlePlayerRest() {
    if (progress.hp >= 10) return
    const cost     = progress.gold >= 20 ? 20 : 0
    const hpGained = 10 - progress.hp
    const next     = { ...progress, hp: 10, gold: progress.gold - cost }
    setProgress(next)
    saveProgress(next.gold, next.hp, next.seals)
    logTransaction('caretaker_rest', -cost, hpGained,
      `Rested at academy — ${cost > 0 ? `-${cost} gold, ` : 'free, '}+${hpGained} HP`)
  }

  if (loading) return (
    <div style={styles.center}>
      <p style={{ color: '#D4AF37', fontFamily: 'monospace', letterSpacing: 2 }}>Loading…</p>
    </div>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080510' }}>
      <GameMenuTab
        onDeckBuilder={() => setDeckOpen(true)}
        onSignOut={async () => { try { await signOut?.() } catch (_) {} navigate('/login') }}
      />
      <PhaserGame
        user={{ ...user, gold: progress.gold, seals: progress.seals, hp: progress.hp }}
        playerDeck={playerCards}
        onBattleStart={handleBattleStart}
        onStarterPicked={handleStarterPicked}
        onShopOpen={() => setShopOpen(true)}
        onPlayerRest={handlePlayerRest}
        onExitGame={() => setDeckOpen(true)}
        onGameReady={(game) => { gameRef.current = game }}
      />

      {activeBattle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)' }}>
          <BattleScreen
            npcData={activeBattle}
            playerDeck={playerCards}
            userProgress={progress}
            onBattleEnd={handleBattleEnd}
          />
        </div>
      )}

      {shopOpen && (
        <ShopOverlay
          listing={shopListing}
          gold={progress.gold}
          onBuyPack={handleBuyPack}
          onClose={() => setShopOpen(false)}
        />
      )}

      {deckOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, overflowY: 'auto', background: '#080510' }}>
          <button
            onClick={() => setDeckOpen(false)}
            style={{
              position: 'fixed', top: 12, right: 16, zIndex: 160,
              background: 'rgba(8,5,16,0.92)', border: '1px solid #D4AF37',
              color: '#D4AF37', fontFamily: 'Courier New, monospace',
              fontSize: 18, fontWeight: 'bold', width: 36, height: 36,
              borderRadius: 6, cursor: 'pointer', lineHeight: 1,
            }}
          >✕</button>
          <Home onClose={() => setDeckOpen(false)} collectionVersion={collectionVersion} />
        </div>
      )}

      {gameOver && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(8,5,16,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 24,
        }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontSize: '3rem', fontWeight: 'bold',
            color: '#CC2222', textShadow: '0 0 20px rgba(200,20,20,0.8)',
            letterSpacing: '0.12em',
          }}>
            DEFEATED
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '1rem', color: '#F0EED8',
            textAlign: 'center', maxWidth: 360, lineHeight: 1.7,
          }}>
            Your HP reached zero. The Academy has restored your strength.<br />
            Rest and try again, initiate.
          </div>
          <button
            onClick={() => setGameOver(false)}
            style={{
              fontFamily: '"Cinzel", serif', fontSize: '1rem',
              background: '#D4AF37', color: '#1a1208',
              border: '2px solid #B8961E', borderRadius: 4,
              padding: '10px 32px', cursor: 'pointer', fontWeight: 'bold',
              letterSpacing: '0.08em',
            }}
          >
            Return to Academy
          </button>
        </div>
      )}

      {gameComplete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(4,3,14,0.97)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 20,
        }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontSize: '0.9rem', fontWeight: 'bold',
            color: '#C8961E', letterSpacing: '0.3em', textTransform: 'uppercase',
          }}>All Five Seals Obtained</div>
          <div style={{
            fontFamily: '"Cinzel", serif', fontSize: '2.8rem', fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255,200,30,0.85), 0 0 8px rgba(255,180,0,0.5)',
            letterSpacing: '0.1em', textAlign: 'center',
          }}>ARCHMAGE SOVEREIGN</div>
          <div style={{
            fontFamily: 'monospace', fontSize: '1rem', color: '#E8E4C8',
            textAlign: 'center', maxWidth: 440, lineHeight: 1.8,
          }}>
            You have mastered all five schools of magic.<br />
            White, Blue, Black, Red, and Green — the Crystal Nexus bows to your will.<br /><br />
            <span style={{ color: '#D4AF37', fontSize: '0.95rem', fontWeight: 'bold' }}>
              ✦ The Oracle Sanctum has opened ✦
            </span><br />
            <span style={{ color: '#C8A840', fontSize: '0.85rem' }}>
              Three legendary alumni await in the sealed chamber above the Hub.<br />
              They wish to honor you with a match.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <button
              onClick={() => setGameComplete(false)}
              style={{
                fontFamily: '"Cinzel", serif', fontSize: '1rem',
                background: '#1A1208', color: '#FFD700',
                border: '2px solid #C8961E', borderRadius: 4,
                padding: '10px 32px', cursor: 'pointer', fontWeight: 'bold',
                letterSpacing: '0.08em',
                boxShadow: '0 0 16px rgba(200,150,30,0.4)',
              }}
            >Return to Academy</button>
          </div>
        </div>
      )}

      {prizePackCards && (
        <ShopOverlay
          listing={shopListing}
          gold={progress.gold}
          prizeCards={prizePackCards}
          onBuyPack={handleBuyPack}
          onClose={() => setPrizePackCards(null)}
        />
      )}
    </div>
  )
}

function GameMenuTab({ onDeckBuilder, onSignOut }) {
  const [open, setOpen] = useState(false)

  const btn = (label, icon, onClick, danger) => (
    <button
      key={label}
      onClick={() => { setOpen(false); onClick() }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 14px',
        background: 'transparent', border: 'none',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        color: danger ? '#CC6666' : '#E8DFC8',
        fontFamily: 'Courier New, monospace', fontSize: 12,
        fontWeight: 'bold', letterSpacing: '0.05em',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
      {label}
    </button>
  )

  return (
    <div style={{ position: 'fixed', bottom: 12, left: 12, zIndex: 100, userSelect: 'none' }}>
      {/* Expanded panel — slides up from the tab */}
      {open && (
        <div style={{
          marginBottom: 4,
          background: 'rgba(8,5,16,0.96)',
          border: '1px solid #D4AF37',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 8px rgba(212,175,55,0.2)',
          minWidth: 180,
        }}>
          {/* Panel header */}
          <div style={{
            padding: '6px 14px',
            background: 'rgba(212,175,55,0.12)',
            borderBottom: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37', fontFamily: 'Courier New, monospace',
            fontSize: 10, letterSpacing: '0.2em', fontWeight: 'bold',
          }}>
            — ACADEMY MENU —
          </div>
          {btn('Deck Builder', '⚔', onDeckBuilder)}
          {btn('Sign Out', '✕', onSignOut, true)}
        </div>
      )}

      {/* Toggle tab button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px',
          background: open ? 'rgba(212,175,55,0.18)' : 'rgba(8,5,16,0.92)',
          border: '1px solid #D4AF37',
          borderRadius: 6,
          color: '#D4AF37', fontFamily: 'Courier New, monospace',
          fontSize: 12, fontWeight: 'bold', letterSpacing: '0.08em',
          cursor: 'pointer',
          boxShadow: '0 0 10px rgba(0,0,0,0.6)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(212,175,55,0.12)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'rgba(8,5,16,0.92)' }}
      >
        <span style={{ fontSize: 16 }}>☰</span>
        Menu
      </button>
    </div>
  )
}

const styles = {
  center: { width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080510' },
}
