import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import PhaserGame from '../game/PhaserGame'
import BattleScreen from '../game/BattleScreen'

const STORAGE_KEY_GOLD  = 'mt_gold'
const STORAGE_KEY_SEALS = 'mt_seals'

// Starter deck templates — card counts per type when auto-building
const STARTER_NAMES = {
  white: "Dawn's Shield",
  blue:  "Mind's Reach",
  black: "Shadow's Grasp",
  red:   "Flame's Fury",
  green: "Wild's Call",
}

function loadProgress() {
  return {
    gold:  parseInt(localStorage.getItem(STORAGE_KEY_GOLD)  ?? '0', 10),
    seals: JSON.parse(localStorage.getItem(STORAGE_KEY_SEALS) ?? '[]'),
  }
}

function saveProgress(gold, seals) {
  localStorage.setItem(STORAGE_KEY_GOLD,  String(gold))
  localStorage.setItem(STORAGE_KEY_SEALS, JSON.stringify(seals))
}

export default function GamePage() {
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const gameRef      = useRef(null)   // set by PhaserGame via callback

  const [playerCards, setPlayerCards]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeBattle, setActiveBattle] = useState(null)
  const [progress, setProgress]         = useState(loadProgress)

  // Load most-recent deck on mount and auto-select it
  useEffect(() => {
    if (!user) return
    loadLatestDeck()
  }, [user])

  async function loadLatestDeck() {
    setLoading(true)
    try {
      const res = await api.get(`/decks?user_id=eq.${user.id}&order=updated_at.desc&limit=1`)
      if (res.data.length > 0) {
        await loadDeckCards(res.data[0].id)
      }
    } catch (_) {}
    setLoading(false)
  }

  async function loadDeckCards(deckId) {
    const res = await api.get(`/deck_cards?deck_id=eq.${deckId}&select=*,cards(*)`)
    const flat = []
    for (const entry of res.data) {
      for (let i = 0; i < (entry.quantity ?? 1); i++) {
        flat.push({ ...entry.cards })
      }
    }
    setPlayerCards(flat)
  }

  // Create a starter deck in Supabase when StarterPickScene emits the event
  async function handleStarterPicked({ color }) {
    try {
      const name = STARTER_NAMES[color] ?? 'Starter Deck'

      // Create the deck
      const deckRes = await api.post('/decks', {
        user_id: user.id,
        name,
        color,
        description: `Your first deck — ${name}`,
      })
      const deck = deckRes.data[0]
      if (!deck) return

      // Pull creatures + spells of that color (max 20), add at quantity 2
      const cardRes = await api.get(
        `/cards?color=eq.${color}&type=neq.land&order=rarity.desc&limit=18`
      )
      if (cardRes.data.length > 0) {
        const inserts = cardRes.data.map(c => ({
          deck_id: deck.id, card_id: c.id, quantity: 2,
        }))
        await api.post('/deck_cards', inserts)
      }

      // Also grab some lands (colorless or matching)
      const landRes = await api.get(`/cards?type=eq.land&color=eq.${color}&limit=4`)
      if (landRes.data.length > 0) {
        const landInserts = landRes.data.map(c => ({
          deck_id: deck.id, card_id: c.id, quantity: 3,
        }))
        await api.post('/deck_cards', landInserts)
      }

      await loadDeckCards(deck.id)
    } catch (_) {}
  }

  function handleBattleStart(npcData) {
    setActiveBattle(npcData)
  }

  function handleBattleEnd({ winner, reward }) {
    setActiveBattle(null)
    if (winner === 'player') {
      const newGold  = progress.gold + (reward ?? 0)
      const newSeals = progress.seals.includes(activeBattle?.color)
        ? progress.seals
        : [...progress.seals, activeBattle?.color].filter(Boolean)
      const next = { gold: newGold, seals: newSeals }
      setProgress(next)
      saveProgress(next.gold, next.seals)
    }
  }

  if (loading) return (
    <div style={styles.center}>
      <p style={{ color: '#D4AF37', fontFamily: 'monospace', letterSpacing: 2 }}>
        Loading…
      </p>
    </div>
  )

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080510' }}>
      <PhaserGame
        user={{ ...user, gold: progress.gold, seals: progress.seals, hp: 10 }}
        playerDeck={playerCards}
        onBattleStart={handleBattleStart}
        onStarterPicked={handleStarterPicked}
        onExitGame={() => navigate('/')}
        onGameReady={(game) => { gameRef.current = game }}
      />

      {activeBattle && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.92)',
        }}>
          <BattleScreen
            npcData={activeBattle}
            playerDeck={playerCards}
            userProgress={progress}
            onBattleEnd={handleBattleEnd}
          />
        </div>
      )}
    </div>
  )
}

const styles = {
  center: {
    width: '100vw', height: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#080510',
  },
}
