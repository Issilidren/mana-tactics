import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const autoFillKill = {
  WebkitBoxShadow: '0 0 0 1000px rgb(11,17,33) inset',
  WebkitTextFillColor: 'rgba(240,238,216,0.95)',
  transition: 'background-color 5000s ease-in-out 0s',
}

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSub]    = useState(false)
  const [focused, setFocused]   = useState(null)

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

  const field = (name) => ({
    width: '100%',
    padding: '0.3em 0.5em',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${focused === name ? '#D4AF37' : 'rgba(90,120,160,0.5)'}`,
    color: 'rgba(240,238,216,0.95)',
    fontFamily: "'Courier New', monospace",
    fontSize: 'clamp(10px, 1.15vw, 15px)',
    letterSpacing: '0.04em',
    outline: 'none',
    caretColor: '#D4AF37',
    boxSizing: 'border-box',
    ...autoFillKill,
  })

  return (
    <div style={{
      width: '100vw', height: '100vh',
      position: 'relative', overflow: 'hidden',
      backgroundImage: 'url(/assets/login-bg.png)',
      backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
    }}>

      {/* mask + input box — covers drawn PLAYER NAME label and input field */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'absolute',
          left: '44%', top: '39.5%',
          width: '22.5%', height: '12.5%',
          background: 'rgb(11,17,33)',
          border: '1px solid rgba(90,120,160,0.35)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          padding: '1% 3%',
        }}
      >
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          className="game-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
          style={field('email')}
        />

        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className="game-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
          style={field('password')}
        />

        {error && (
          <p style={{
            position: 'absolute', bottom: '-1.4em', left: 0,
            margin: 0, color: '#ff6b6b',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 0.8vw, 11px)',
            textShadow: '1px 1px 1px #000', whiteSpace: 'nowrap',
          }}>{error}</p>
        )}

        {/* transparent hit-area over drawn CONTINUE button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            position: 'fixed',
            left: '30%', top: '56%',
            width: '41%', height: '8%',
            background: 'transparent', border: 'none', outline: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        />
      </form>

      {/* transparent hit-area over drawn NEW GAME button */}
      <Link
        to="/register"
        style={{
          position: 'absolute',
          left: '30%', top: '64.5%',
          width: '41%', height: '7.5%',
          display: 'block', cursor: 'pointer',
        }}
      />
    </div>
  )
}
