import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import Navbar from '../components/Navbar'
import CardPicker from '../components/CardPicker'

const COLORS = ['white', 'blue', 'black', 'red', 'green']

export default function DeckDetail() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [deck, setDeck]           = useState(null)
  const [deckCards, setDeckCards] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Edit form state
  const [name, setName]     = useState('')
  const [desc, setDesc]     = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (user) fetchAll()
  }, [id, user])

  async function fetchAll() {
    setLoading(true)
    setError('')
    try {
      await Promise.all([fetchDeck(), fetchDeckCards()])
    } finally {
      setLoading(false)
    }
  }

  async function fetchDeck() {
    const res = await api.get(`/decks?id=eq.${id}&user_id=eq.${user.id}`)
    if (!res.data || res.data.length === 0) {
      navigate('/')
      return
    }
    const d = res.data[0]
    setDeck(d)
    setName(d.name)
    setDesc(d.description ?? '')
  }

  async function fetchDeckCards() {
    const res = await api.get(`/deck_cards?deck_id=eq.${id}&select=*,cards(*)`)
    setDeckCards(res.data)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    try {
      await api.patch(`/decks?id=eq.${id}`, { name, description: desc })
      setDeck(prev => ({ ...prev, name, description: desc }))
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch (err) {
      setSaveMsg(err.response?.data?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDeck() {
    if (!window.confirm('Delete this deck and all its cards? This cannot be undone.')) return
    try {
      await api.delete(`/decks?id=eq.${id}`)
      navigate('/')
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete deck')
    }
  }

  async function handleRemoveCard(deckCardId) {
    try {
      await api.delete(`/deck_cards?id=eq.${deckCardId}`)
      await fetchDeckCards()
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to remove card')
    }
  }

  const totalCards = deckCards.reduce((sum, dc) => sum + (dc.quantity ?? 0), 0)
  const existingCardIds = deckCards.map(dc => dc.card_id)

  if (loading) return (
    <>
      <Navbar />
      <p className="loading-msg">Loading deck…</p>
    </>
  )

  if (error) return (
    <>
      <Navbar />
      <div className="page-container"><p className="error-msg">{error}</p></div>
    </>
  )

  if (!deck) return null

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Back to decks
          </Link>
        </div>

        {/* Edit form */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--accent)' }}>{deck.name}</h2>
            <span className={`badge-${deck.color}`}>{deck.color}</span>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Deck Name
              <input
                className="input"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Description
              <textarea
                className="input"
                rows={2}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saveMsg && (
                <span style={{ color: saveMsg === 'Saved!' ? 'var(--accent)' : '#ff6b6b', fontSize: '0.85rem' }}>
                  {saveMsg}
                </span>
              )}
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteDeck}
                style={{ marginLeft: 'auto' }}
              >
                Delete Deck
              </button>
            </div>
          </form>
        </div>

        {/* Card list */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--accent)' }}>Cards in Deck</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Total: {totalCards}
            </span>
          </div>

          {deckCards.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No cards yet. Add some below.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {deckCards.map(dc => {
              const card = dc.cards
              return (
                <div
                  key={dc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid rgba(212,175,55,0.15)',
                  }}
                >
                  <span className={`badge-${card?.color}`} style={{ flexShrink: 0 }}>
                    {card?.color}
                  </span>
                  <span style={{ flex: 1 }}>{card?.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{card?.type}</span>
                  {card?.type === 'creature' && card?.power != null && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {card.power}/{card.toughness}
                    </span>
                  )}
                  <span style={{ fontWeight: 'bold', minWidth: 20, textAlign: 'center' }}>×{dc.quantity}</span>
                  <button
                    className="btn-danger"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => handleRemoveCard(dc.id)}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card picker */}
        <div className="card">
          <CardPicker
            deckId={id}
            existingCardIds={existingCardIds}
            deckCards={deckCards}
            onCardAdded={fetchDeckCards}
          />
        </div>
      </div>
    </>
  )
}
