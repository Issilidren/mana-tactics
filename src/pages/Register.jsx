import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const autoFillKill = {
  WebkitBoxShadow: '0 0 0 1000px rgb(11,17,33) inset',
  WebkitTextFillColor: 'rgba(240,238,216,0.95)',
  transition: 'background-color 5000s ease-in-out 0s',
}

const panel = {
  position: 'absolute',
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'clamp(280px, 30vw, 400px)',
  background: 'rgb(11,17,33)',
  border: '2px solid #D4AF37',
  boxShadow: '0 0 0 1px rgba(212,175,55,0.2), inset 0 0 24px rgba(0,0,0,0.6)',
  padding: 'clamp(1.2rem, 3vw, 2rem)',
  boxSizing: 'border-box',
}

const title = {
  fontFamily: "'Cinzel', serif",
  fontSize: 'clamp(1rem, 2vw, 1.4rem)',
  fontWeight: 900,
  color: '#D4AF37',
  textAlign: 'center',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: '1.2rem',
  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
}

const labelTxt = {
  fontSize: 'clamp(8px, 0.75vw, 11px)',
  color: '#7090B0',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontFamily: "'Courier New', monospace",
  marginBottom: '0.2em',
}

export default function Register() {
  const { signUp } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [submitting, setSub]    = useState(false)
  const [focused, setFocused]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    setSub(true)
    try {
      await signUp(email, password)
      setSuccess(true)
    } catch (err) {
      const raw = err?.message ?? ''
      setError(raw && raw !== '{}' ? raw : 'Registration failed. Please try again.')
    } finally {
      setSub(false)
    }
  }

  const field = (name) => ({
    width: '100%',
    padding: '0.4em 0.6em',
    background: 'rgba(6,12,24,0.9)',
    border: `1px solid ${focused === name ? '#D4AF37' : 'rgba(90,120,160,0.5)'}`,
    borderRadius: '1px',
    color: 'rgba(240,238,216,0.95)',
    fontFamily: "'Courier New', monospace",
    fontSize: 'clamp(10px, 1.1vw, 14px)',
    outline: 'none',
    caretColor: '#D4AF37',
    boxSizing: 'border-box',
    boxShadow: focused === name ? '0 0 6px rgba(212,175,55,0.15)' : 'none',
    ...autoFillKill,
  })

  const bg = (
    <div style={{
      width: '100vw', height: '100vh',
      position: 'relative', overflow: 'hidden',
      backgroundImage: 'url(/assets/login-bg.png)',
      backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
    }} />
  )

  if (success) return (
    <div style={{ width:'100vw', height:'100vh', position:'relative', overflow:'hidden',
      backgroundImage:'url(/assets/login-bg.png)', backgroundSize:'100% 100%', backgroundRepeat:'no-repeat' }}>
      <div style={{ ...panel, textAlign: 'center' }}>
        <h2 style={{ ...title, marginBottom: '0.8rem' }}>Enrollment Sent</h2>
        <p style={{ color: '#7090B0', fontFamily:"'Courier New', monospace", fontSize:'0.85rem', lineHeight: 1.6 }}>
          Check your email to confirm your account, then{' '}
          <Link to="/login" style={{ color: '#D4AF37' }}>sign in</Link>.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ width:'100vw', height:'100vh', position:'relative', overflow:'hidden',
      backgroundImage:'url(/assets/login-bg.png)', backgroundSize:'100% 100%', backgroundRepeat:'no-repeat' }}>

      <div style={panel}>
        <h1 style={title}>Create Account</h1>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>

          <label style={{ display:'flex', flexDirection:'column' }}>
            <span style={labelTxt}>Email</span>
            <input type="email" required autoComplete="email" className="game-input"
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              style={field('email')} />
          </label>

          <label style={{ display:'flex', flexDirection:'column' }}>
            <span style={labelTxt}>Password</span>
            <input type="password" required autoComplete="new-password" minLength={6} className="game-input"
              value={password} onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              style={field('password')} />
          </label>

          <label style={{ display:'flex', flexDirection:'column' }}>
            <span style={labelTxt}>Confirm Password</span>
            <input type="password" required autoComplete="new-password" className="game-input"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)}
              style={field('confirm')} />
          </label>

          {error && (
            <p style={{ margin:0, color:'#ff6b6b', fontFamily:"'Courier New', monospace",
              fontSize:'clamp(9px,0.85vw,12px)', textShadow:'1px 1px 1px #000' }}>{error}</p>
          )}

          <button type="submit" disabled={submitting} style={{
            marginTop: '0.25rem',
            padding: '0.55em',
            background: submitting ? 'rgba(212,175,55,0.4)' : '#D4AF37',
            border: '1px solid rgba(212,175,55,0.6)',
            borderRadius: '1px',
            color: '#0A0E1A',
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(10px, 1.1vw, 14px)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            width: '100%',
          }}>
            {submitting ? 'Enrolling…' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop:'1rem', textAlign:'center', fontFamily:"'Courier New', monospace",
          fontSize:'clamp(9px,0.85vw,12px)', color:'#7090B0' }}>
          Already enrolled?{' '}
          <Link to="/login" style={{ color:'#D4AF37', textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
