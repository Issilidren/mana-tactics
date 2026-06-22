import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [submitting, setSub]    = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSub(true)
    try {
      await signUp(email, password)
      setSuccess(true)
    } catch (err) {
      setError(err.message ?? 'Registration failed')
    } finally {
      setSub(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}>
        <div className="card" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Almost there!</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Check your email to confirm your account, then{' '}
            <Link to="/login" style={{ color: 'var(--accent)' }}>sign in</Link>.
          </p>
        </div>
      </div>
    )
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
          Create Account
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
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
            Confirm Password
            <input
              className="input"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn-primary" type="submit" disabled={submitting} style={{ marginTop: '0.25rem' }}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
