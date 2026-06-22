import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/login')
    } catch {
      // silently ignore sign-out errors
    }
  }

  return (
    <nav style={{
      background: '#0A1828',
      borderBottom: '3px solid #101010',
      padding: '0.6rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link
        to="/"
        style={{
          color: 'var(--accent)',
          textDecoration: 'none',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          textShadow: '1px 1px 0 rgba(0,0,0,0.8)',
        }}
      >
        ◆ MANA TACTICS
      </Link>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#506880', fontSize: '0.8rem', letterSpacing: 1 }}>
            {user.email}
          </span>
          <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
            LOGOUT
          </button>
        </div>
      )}
    </nav>
  )
}
