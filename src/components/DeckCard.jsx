import { Link } from 'react-router-dom'

const COLOR_STYLES = {
  white:     { background: '#F5F0E1', color: '#1a1208' },
  blue:      { background: '#1A3A5C', color: '#F5F0E1' },
  black:     { background: '#1C1C2E', color: '#F5F0E1', border: '1px solid #a89070' },
  red:       { background: '#8B0000', color: '#F5F0E1' },
  green:     { background: '#2E5A1E', color: '#F5F0E1' },
  colorless: { background: '#555',    color: '#F5F0E1' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function truncate(str, max = 90) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str
}

export default function DeckCard({ deck, onDelete }) {
  const colorStyle = COLOR_STYLES[deck.color] ?? COLOR_STYLES.colorless

  async function handleDelete() {
    if (!window.confirm(`Delete deck "${deck.name}"? This cannot be undone.`)) return
    await onDelete(deck.id)
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Color dot */}
        <span style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: colorStyle.background,
          border: colorStyle.border ?? '1px solid var(--border)',
          flexShrink: 0,
          display: 'inline-block',
        }} />
        <span className={`badge-${deck.color}`}>{deck.color}</span>
      </div>

      <h3 style={{ color: 'var(--accent)', fontSize: '1.05rem' }}>{deck.name}</h3>

      {deck.description && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>
          {truncate(deck.description)}
        </p>
      )}

      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        Created {formatDate(deck.created_at)}
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <Link to={`/decks/${deck.id}`} className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
          View / Edit
        </Link>
        <button className="btn-danger" style={{ fontSize: '0.85rem' }} onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}
