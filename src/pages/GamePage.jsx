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
    setActiveBattle(null)
    let next
    if (winner === 'player') {
      const newGold  = progress.gold + (reward ?? 0)
      const newSeals = progress.seals.includes(color)
        ? progress.seals
        : [...progress.seals, color].filter(Boolean)
      next = { gold: newGold, hp: progress.hp, seals: newSeals }
    } else {
      next = { gold: progress.gold, hp: Math.max(1, progress.hp - hpDamage), seals: progress.seals }
    }
    setProgress(next)
    saveProgress(next.gold, next.hp, next.seals)
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
    </div>
  )
}

const styles = {
  center: { width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080510' },
}
