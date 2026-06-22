import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import DeckCard from '../components/DeckCard'
import Navbar from '../components/Navbar'

export default function Home() {
  const { user }               = useAuth()
  const navigate               = useNavigate()
  const [decks, setDecks]      = useState([])
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState('')

  useEffect(() => {
    if (user) fetchDecks()
  }, [user])

  async function fetchDecks() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/decks?user_id=eq.${user.id}&order=created_at.desc`)
      setDecks(res.data)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to load decks')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(deckId) {
    try {
      await api.delete(`/decks?id=eq.${deckId}`)
      setDecks(prev => prev.filter(d => d.id !== deckId))
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete deck')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--accent)', fontSize: '1.3rem' }}>My Decks</h2>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn-primary"
              onClick={() => navigate('/game')}
              style={{ background: '#4a2e00', borderColor: '#D4AF37' }}
            >
              ⚔ Enter World
            </button>
            <Link to="/decks/new" className="btn-primary" style={{ textDecoration: 'none' }}>
              + New Deck
            </Link>
          </div>
        </div>

        {loading && <p className="loading-msg">Loading your decks…</p>}
        {error   && <p className="error-msg">{error}</p>}

        {!loading && !error && decks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              You have no decks yet.
            </p>
            <Link to="/decks/new" className="btn-primary" style={{ textDecoration: 'none' }}>
              Create your first deck
            </Link>
          </div>
        )}

        {!loading && !error && decks.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {decks.map(deck => (
              <DeckCard key={deck.id} deck={deck} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
