import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSub]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSub(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message ?? 'Login failed')
    } finally {
      setSub(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ color: 'var(--accent)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem' }}>
          Mana Tactics
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
            Email
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
            Password
            <input
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting} style={{ marginTop: '0.25rem' }}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}
