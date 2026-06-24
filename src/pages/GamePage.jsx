import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import PhaserGame from '../game/PhaserGame'
import BattleScreen from '../game/BattleScreen'
import ShopOverlay from '../game/ShopOverlay'

const STARTER_NAMES = {
  white: "Dawn's Shield",
  blue:  "Mind's Reach",
  black: "Shadow's Grasp",
  red:   "Flame's Fury",
  green: "Wild's Call",
}

export default function GamePage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const gameRef   = useRef(null)

  const [playerCards, setPlayerCards]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeBattle, setActiveBattle] = useState(null)
  const [shopOpen, setShopOpen]         = useState(false)
  const [prizePackCards, setPrizePackCards] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [shopListing, setShopListing]   = useState(null)
  const [progress, setProgress]         = useState(() => ({
    gold:  parseInt(localStorage.getItem('mt_gold')  ?? '0', 10),
    seals: JSON.parse(localStorage.getItem('mt_seals') ?? '[]'),
    hp:    10,
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
    try {
      await api.post('/player_profiles',
        { user_id: user.id, gold, hp, seals, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }
      )
    } catch (_) {}
    localStorage.setItem('mt_gold',  String(gold))
    localStorage.setItem('mt_seals', JSON.stringify(seals))
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
      const cardRes = await api.get(`/cards?color=eq.${color}&type=neq.land&order=rarity.desc&limit=18`)
      if (cardRes.data.length)
        await api.post('/deck_cards', cardRes.data.map(c => ({ deck_id: deck.id, card_id: c.id, quantity: 2 })))
      const landRes = await api.get(`/cards?type=eq.land&color=eq.${color}&limit=4`)
      if (landRes.data.length)
        await api.post('/deck_cards', landRes.data.map(c => ({ deck_id: deck.id, card_id: c.id, quantity: 3 })))
      await loadDeckCards(deck.id)
    } catch (_) {}
  }

  function handleBattleStart(npcData) { setActiveBattle(npcData) }

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
      next = { gold: newGold, hp: progress.hp, seals: newSeals }
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
    if (isFirstSealWin) {
      const offset = Math.floor(Math.random() * 315)
      api.get(`/cards?order=id.asc&limit=5&offset=${offset}`)
        .then(res => { if (res.data?.length) setPrizePackCards(res.data) })
        .catch(() => {})
    }
  }

  async function handleBuyPack() {
    if (!shopListing || progress.gold < shopListing.gold_price) return []
    try {
      const offset = Math.floor(Math.random() * 315)
      const [cardsRes] = await Promise.all([
        api.get(`/cards?order=id.asc&limit=5&offset=${offset}`),
        api.post('/purchases', {
          user_id: user.id, listing_id: shopListing.id, gold_spent: shopListing.gold_price,
        }),
      ])
      const next = { ...progress, gold: progress.gold - shopListing.gold_price }
      setProgress(next)
      saveProgress(next.gold, next.hp, next.seals)
      return cardsRes.data
    } catch (_) { return [] }
  }

  function handlePlayerRest() {
    if (progress.hp >= 10) return
    const cost = progress.gold >= 20 ? 20 : 0
    const next = { ...progress, hp: 10, gold: progress.gold - cost }
    setProgress(next)
    saveProgress(next.gold, next.hp, next.seals)
  }

  if (loading) return (
    <div style={styles.center}>
      <p style={{ color: '#D4AF37', fontFamily: 'monospace', letterSpacing: 2 }}>Loading…</p>
    </div>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080510' }}>
      <PhaserGame
        user={{ ...user, gold: progress.gold, seals: progress.seals, hp: progress.hp }}
        playerDeck={playerCards}
        onBattleStart={handleBattleStart}
        onStarterPicked={handleStarterPicked}
        onShopOpen={() => setShopOpen(true)}
        onPlayerRest={handlePlayerRest}
        onExitGame={() => navigate('/')}
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
            White, Blue, Black, Red, and Green — the Crystal Nexus bows to your will.<br />
            <span style={{ color: '#C8A840', fontSize: '0.85rem' }}>The Academy remains open. Your legend continues.</span>
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

const styles = {
  center: { width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080510' },
}
