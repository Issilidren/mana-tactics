import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SoundEngine } from '../game/systems/SoundEngine'

const autoFillKill = {
  WebkitBoxShadow: '0 0 0 1000px rgb(11,17,33) inset',
  WebkitTextFillColor: 'rgba(240,238,216,0.95)',
  transition: 'background-color 5000s ease-in-out 0s',
}

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()

  if (!loading && user) return <Navigate to="/game" replace />

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [submitting, setSub]    = useState(false)
  const [focused, setFocused]   = useState(null)
  const [showOptions, setShowOptions] = useState(false)
  const [musicVol, setMusicVol] = useState(80)
  const [sfxVol, setSfxVol]     = useState(80)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSub(true)
    SoundEngine.playSFX('confirm')
    try {
      await signIn(email, password)
      navigate('/game')
    } catch (err) {
      SoundEngine.playSFX('error')
      setError(err.message ?? 'Login failed')
    } finally {
      setSub(false)
    }
  }

  const fieldStyle = (name) => ({
    width: '100%',
    padding: '0.5em 0.7em',
    background: 'rgba(6,12,24,0.9)',
    border: `1px solid ${focused === name ? '#D4AF37' : 'rgba(90,120,160,0.5)'}`,
    borderRadius: 2,
    color: 'rgba(240,238,216,0.95)',
    fontFamily: "'Courier New', monospace",
    fontSize: 'clamp(12px, 1.2vw, 16px)',
    letterSpacing: '0.04em',
    outline: 'none',
    caretColor: '#D4AF37',
    boxSizing: 'border-box',
    boxShadow: focused === name ? '0 0 8px rgba(212,175,55,0.15)' : 'none',
    ...autoFillKill,
  })

  const labelStyle = {
    fontSize: 'clamp(9px, 0.8vw, 12px)',
    color: '#7090B0',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: "'Courier New', monospace",
    marginBottom: '0.25em',
  }

  const btnStyle = (primary = true) => ({
    width: '100%',
    padding: '0.6em',
    background: primary
      ? (submitting ? 'rgba(212,175,55,0.4)' : 'linear-gradient(180deg, #D4AF37 0%, #B8941E 100%)')
      : 'transparent',
    border: primary
      ? '1px solid rgba(212,175,55,0.6)'
      : '1px solid rgba(212,175,55,0.4)',
    borderRadius: 2,
    color: primary ? '#0A0E1A' : '#D4AF37',
    fontFamily: "'Cinzel', serif",
    fontSize: 'clamp(11px, 1.1vw, 15px)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: submitting ? 'not-allowed' : 'pointer',
    textShadow: primary ? '0 1px 0 rgba(255,255,255,0.2)' : 'none',
    boxShadow: primary ? '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
  })

  return (
    <div style={{
      width: '100vw', height: '100vh',
      position: 'relative', overflow: 'hidden',
      backgroundImage: 'url(/assets/login-bg.png)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Dark overlay to separate panel from bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(4,2,12,0.55)',
        pointerEvents: 'none',
      }} />

      {/* Main login panel */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: 'clamp(300px, 32vw, 420px)',
        background: 'rgba(10,14,26,0.95)',
        border: '2px solid #D4AF37',
        boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.2), inset 0 0 30px rgba(0,0,0,0.4)',
        padding: 'clamp(1.5rem, 3vw, 2.5rem)',
        boxSizing: 'border-box',
      }}>
        {/* Corner rivets */}
        {[{top:6,left:6},{top:6,right:6},{bottom:6,left:6},{bottom:6,right:6}].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', ...pos,
            width: 10, height: 10, borderRadius: '50%',
            background: '#D4AF37', border: '1px solid rgba(200,150,30,0.6)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          }} />
        ))}

        {/* Crest / Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
            fontWeight: 900,
            color: '#D4AF37',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            textShadow: '0 2px 6px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.15)',
            lineHeight: 1.2,
          }}>
            Mana Tactics
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 0.7vw, 10px)',
            color: '#7090B0',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: '0.4rem',
          }}>
            A Magic Dueling Adventure
          </div>
          {/* Gold divider */}
          <div style={{
            width: '60%', height: 1, margin: '0.8rem auto 0',
            background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
          }} />
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', flexDirection: 'column', gap: '0.8rem',
        }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={labelStyle}>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="your@email.com"
              className="game-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={fieldStyle('email')}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={labelStyle}>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="game-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              style={fieldStyle('password')}
            />
          </label>

          {error && (
            <p style={{
              margin: 0, color: '#ff6b6b',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(9px, 0.85vw, 12px)',
              textShadow: '1px 1px 1px #000',
            }}>{error}</p>
          )}

          {/* Continue / Login button */}
          <button type="submit" disabled={submitting} style={btnStyle(true)}>
            {submitting ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        {/* New Game / Register */}
        <Link
          to="/register"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '0.6rem',
            ...btnStyle(false),
            textDecoration: 'none',
          }}
          onClick={() => SoundEngine.playSFX('menuOpen')}
        >
          New Game
        </Link>

        {/* Options */}
        <button
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.4rem',
            padding: '0.45em',
            background: 'transparent',
            border: '1px solid rgba(90,120,160,0.3)',
            borderRadius: 2,
            color: '#7090B0',
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(10px, 0.95vw, 13px)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          onClick={() => { SoundEngine.playSFX('menuOpen'); setShowOptions(true) }}
        >
          Options
        </button>

        {/* Bottom text */}
        <p style={{
          marginTop: '1rem', textAlign: 'center',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(8px, 0.7vw, 10px)',
          color: 'rgba(112,144,176,0.6)',
          letterSpacing: '0.06em',
        }}>
          © Mana Academy — All rights reserved
        </p>
      </div>

      {/* Options modal */}
      {showOptions && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(4,2,12,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => { SoundEngine.playSFX('menuClose'); setShowOptions(false) }}
        >
          <div style={{
            width: 'clamp(260px, 28vw, 360px)',
            background: 'rgba(10,14,26,0.97)',
            border: '2px solid #D4AF37',
            boxShadow: '0 0 30px rgba(0,0,0,0.8)',
            padding: 'clamp(1.2rem, 2.5vw, 2rem)',
            boxSizing: 'border-box',
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
              fontWeight: 900, color: '#D4AF37',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              textAlign: 'center', marginBottom: '1.2rem',
            }}>
              Options
            </div>

            {/* Music volume */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                ...labelStyle, marginBottom: '0.4em',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>🎵 Music Volume</span>
                <span style={{ color: '#D4AF37' }}>{musicVol}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={musicVol}
                onChange={e => {
                  const v = Number(e.target.value)
                  setMusicVol(v)
                  SoundEngine.setMusicVolume?.(v / 100)
                }}
                style={{ width: '100%', accentColor: '#D4AF37' }}
              />
            </div>

            {/* SFX volume */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{
                ...labelStyle, marginBottom: '0.4em',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>🔊 SFX Volume</span>
                <span style={{ color: '#D4AF37' }}>{sfxVol}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={sfxVol}
                onChange={e => {
                  const v = Number(e.target.value)
                  setSfxVol(v)
                  SoundEngine.setSFXVolume?.(v / 100)
                }}
                style={{ width: '100%', accentColor: '#D4AF37' }}
              />
            </div>

            <button
              onClick={() => { SoundEngine.playSFX('confirm'); setShowOptions(false) }}
              style={{
                ...btnStyle(true),
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
