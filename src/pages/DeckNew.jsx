import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'
import Navbar from '../components/Navbar'

const COLORS = ['white', 'blue', 'black', 'red', 'green']

export default function DeckNew() {
  const { user }               = useAuth()
  const navigate               = useNavigate()

  const [name, setName]           = useState('')
  const [color, setColor]         = useState('white')
  const [description, setDesc]    = useState('')
  const [error, setError]         = useState('')
  const [submitting, setSub]      = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSub(true)
    try {
      const res = await api.post('/decks', {
        user_id: user.id,
        name,
        color,
        description,
      })
      const newDeck = Array.isArray(res.data) ? res.data[0] : res.data
      navigate(`/decks/${newDeck.id}`)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to create deck')
    } finally {
      setSub(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div style={{ marginBottom: '1.25rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Back to decks
          </Link>
        </div>

        <div className="card" style={{ maxWidth: 520 }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: '1.25rem' }}>New Deck</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Deck Name *
              <input
                className="input"
                type="text"
                required
                maxLength={80}
                placeholder="e.g. Red Aggro"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Color
              <select
                className="input"
                value={color}
                onChange={e => setColor(e.target.value)}
              >
                {COLORS.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
              Description
              <textarea
                className="input"
                rows={3}
                placeholder="Optional description…"
                value={description}
                onChange={e => setDesc(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </label>

            {error && <p className="error-msg">{error}</p>}

            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Deck'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
