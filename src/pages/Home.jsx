import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/axios'

// ── Card frame palette ─────────────────────────────────────────
const FRAME = {
  white:     { border:'#C8A820', glow:'#F0D050', header:'#E8D060', headerText:'#1a1000', art1:'#F0E8A0', art2:'#C8A030' },
  blue:      { border:'#1144AA', glow:'#4488EE', header:'#1A66CC', headerText:'#DDEEFF', art1:'#4488EE', art2:'#0A2288' },
  black:     { border:'#8833CC', glow:'#BB66FF', header:'#5522AA', headerText:'#EEE0FF', art1:'#9955CC', art2:'#1A0830' },
  red:       { border:'#CC2200', glow:'#FF5533', header:'#EE3311', headerText:'#FFEEEE', art1:'#FF6633', art2:'#881100' },
  green:     { border:'#117711', glow:'#44DD44', header:'#228833', headerText:'#EEFFEE', art1:'#55CC44', art2:'#114411' },
  colorless: { border:'#666677', glow:'#9999AA', header:'#888899', headerText:'#FFFFFF', art1:'#BBBBCC', art2:'#555566' },
}

// ── Art crop URL (frameless Scryfall artwork) ────────────────────────
function artUrl(url) { return url?.replace('/small/', '/art_crop/') ?? null }

// ── Per-color per-type art symbol (fallback when no image) ────────────────
const SYM = {
  white:     { creature:'⚔', spell:'✨', enchantment:'✨', artifact:'⚙', land:'⭐' },
  blue:      { creature:'⚡', spell:'💧', enchantment:'💧', artifact:'⚙', land:'💧' },
  black:     { creature:'💀', spell:'🌑', enchantment:'🌑', artifact:'⚙', land:'🌑' },
  red:       { creature:'🔥', spell:'🔥', enchantment:'🔥', artifact:'⚙', land:'⛰' },
  green:     { creature:'🌿', spell:'🌿', enchantment:'🌿', artifact:'⚙', land:'🌲' },
  colorless: { creature:'⚔', spell:'✨', enchantment:'✨', artifact:'⚙', land:'🏔' },
}

const COLOR_DOTS = [
  { key:'all',       bg:'#445566', label:'★' },
  { key:'white',     bg:'#C8B860', label:'W' },
  { key:'blue',      bg:'#2255AA', label:'U' },
  { key:'black',     bg:'#6633AA', label:'B' },
  { key:'red',       bg:'#CC3311', label:'R' },
  { key:'green',     bg:'#228822', label:'G' },
  { key:'colorless', bg:'#607080', label:'C' },
]

const TYPES = ['all','creature','spell','enchantment','artifact','land']

const GRID_LINES = [
  'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)',
  'repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(0,0,0,0.07) 3px,rgba(0,0,0,0.07) 4px)',
].join(',')

const ABILITY_RULES = {
  'flying':'Flying — Only creatures with Flying or Reach can block.',
  'first strike':'First Strike — Deals combat damage before non-first-strikers.',
  'double strike':'Double Strike — Deals both first-strike AND regular combat damage.',
  'vigilance':'Vigilance — Attacking does not cause this creature to tap.',
  'trample':'Trample — Excess damage carries through to the opponent.',
  'haste':'Haste — Can attack the same turn it enters the battlefield.',
  'lifelink':'Lifelink — Damage dealt also heals you.',
  'deathtouch':'Deathtouch — Any damage from this destroys a creature.',
  'reach':'Reach — Can block creatures with Flying.',
  'menace':'Menace — Must be blocked by two or more creatures.',
  'hexproof':"Hexproof — Cannot be targeted by opponent's spells.",
  'indestructible':'Indestructible — Cannot be destroyed by damage or effects.',
}

// ── Hover tooltip ─────────────────────────────────────────────
function Tooltip({ card, rect }) {
  if (!card || !rect) return null
  const f = FRAME[card.color] || FRAME.colorless
  const isCr = card.type === 'creature', isLand = card.type === 'land'
  const darkBg = card.color === 'black'
  const TW = 220, TH = 340
  let left = rect.right + 10
  if (left + TW > window.innerWidth - 8) left = rect.left - TW - 10
  const top = Math.max(8, Math.min(rect.top, window.innerHeight - TH - 8))
  const mc = card.mana_cost ? Object.values(card.mana_cost).reduce((s,v)=>s+(v||0),0) : 0
  const art = artUrl(card.image_url)
  return (
    <div style={{ position:'fixed', left, top, width:TW, zIndex:9999, pointerEvents:'none',
      background: darkBg ? '#1A0E2A' : '#F5EFD0',
      border:`2px solid ${f.glow}`, borderRadius:10, overflow:'hidden',
      boxShadow:`0 0 20px ${f.glow}55, 4px 4px 0 rgba(0,0,0,0.85)`,
      fontFamily:"'Courier New',monospace" }}>
      {/* Header */}
      <div style={{ background:f.header, padding:'6px 8px', borderBottom:`2px solid ${f.border}`,
        display:'flex', alignItems:'center', gap:6 }}>
        {!isLand && mc > 0 && (
          <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(4,6,12,0.85)',
            border:`2px solid ${f.glow}`, display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'0.62rem', fontWeight:'bold', color:'#D4AF37', flexShrink:0,
            boxShadow:`0 0 6px ${f.glow}66` }}>
            {mc}
          </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'0.78rem', fontWeight:'bold', color:f.headerText,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>
            {card.name}
          </div>
          <div style={{ fontSize:'0.5rem', color:`${f.headerText}cc`, textTransform:'uppercase',
            letterSpacing:1, marginTop:2 }}>
            {card.type}{card.rarity ? ` · ${card.rarity}` : ''}
          </div>
        </div>
        {isCr && (
          <span style={{ fontSize:'0.68rem', fontWeight:'bold', color:f.headerText, flexShrink:0 }}>
            HP {(card.toughness||0)*10}
          </span>
        )}
        {isLand && (
          <span style={{ fontSize:'0.68rem', color:f.headerText, flexShrink:0 }}>∞</span>
        )}
      </div>
      {/* Art */}
      <div style={{ height:100, position:'relative', margin:'5px', borderRadius:6,
        border:`2px solid ${f.border}88`, overflow:'hidden',
        background:`radial-gradient(ellipse at 40% 40%,${f.art1} 0%,${f.art2} 100%)` }}>
        {art
          ? <img src={art} alt={card.name}
              style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', display:'block' }} />
          : <>
              <div style={{ position:'absolute', inset:0, backgroundImage:GRID_LINES }} />
              <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'2.8rem',
                filter:'drop-shadow(2px 2px 0 rgba(0,0,0,0.8))', zIndex:1, lineHeight:1 }}>
                {isCr ? '⚔' : isLand ? '🏔' : '✨'}
              </span>
            </>
        }
      </div>
      {/* Type bar */}
      <div style={{ background:`${f.header}55`, padding:'3px 8px', fontSize:'0.5rem',
        color:darkBg?'#DDD':'#222', textTransform:'uppercase', letterSpacing:1, fontWeight:'bold',
        borderTop:`1px solid ${f.border}55`, borderBottom:`1px solid ${f.border}55` }}>
        {isCr ? 'Creature' : isLand ? 'Basic Land' : card.type}{card.subtype ? ` — ${card.subtype}` : ''}
      </div>
      {/* Body */}
      <div style={{ padding:'6px 8px 8px', minHeight:60,
        background: darkBg ? '#1A0E2A' : '#F5EFD0' }}>
        {(card.abilities||[]).map(ab => (
          <div key={ab} style={{ fontSize:'0.58rem', color:darkBg?'#DDD8FF':'#1a1a1a',
            fontStyle:'italic', lineHeight:1.35, marginBottom:3 }}>
            {ABILITY_RULES[ab] || ab}
          </div>
        ))}
        {card.description && (
          <div style={{ fontSize:'0.58rem', color:darkBg?'#C8C0E8':'#3a2a10',
            fontStyle:'italic', lineHeight:1.35, marginTop:(card.abilities||[]).length?4:0 }}>
            {card.description}
          </div>
        )}
        {isLand && (
          <div style={{ fontSize:'0.55rem', color:darkBg?'#AAA':'#555', fontStyle:'italic' }}>
            Tap: Add 1 mana to your pool.
          </div>
        )}
        {isCr && card.power != null && (
          <div style={{ display:'flex', gap:5, marginTop:6, justifyContent:'flex-end' }}>
            <div style={{ background:'rgba(180,30,10,0.85)', border:'1px solid #FF4422',
              borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'0.6rem', fontWeight:'bold', color:'#FFC0B0',
              boxShadow:'0 0 5px rgba(255,68,34,0.5)' }}>
              {card.power}
            </div>
            <div style={{ background:'rgba(10,120,30,0.85)', border:'1px solid #44CC44',
              borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'0.6rem', fontWeight:'bold', color:'#B0FFB8',
              boxShadow:'0 0 5px rgba(68,204,68,0.5)' }}>
              {card.toughness}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mini card tile — premium full-art design ──────────────────────────
function MiniCard({ card, qty, canAdd, onAdd, onDec, onHover, onLeave }) {
  const f    = FRAME[card.color] || FRAME.colorless
  const isCr = card.type === 'creature', isLand = card.type === 'land'
  const mc   = card.mana_cost ? Object.values(card.mana_cost).reduce((s,v)=>s+(v||0),0) : 0
  const sym  = (SYM[card.color] || SYM.colorless)[card.type] ?? '✨'
  const art  = artUrl(card.image_url)
  const inDeck = qty > 0
  return (
    <div
      style={{
        aspectRatio: '3/4',
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        userSelect: 'none',
        border: `2px solid ${inDeck ? f.glow : f.border + '55'}`,
        cursor: canAdd ? 'pointer' : inDeck ? 'default' : 'not-allowed',
        opacity: canAdd || inDeck ? 1 : 0.45,
        boxShadow: inDeck
          ? `0 0 14px ${f.glow}88, 0 0 5px ${f.glow}44, inset 0 0 8px ${f.glow}22`
          : `0 0 3px ${f.glow}22`,
        fontFamily: "'Courier New',monospace",
        background: '#06090F',
      }}
      onClick={() => canAdd && onAdd()}
      onMouseEnter={e => onHover(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={onLeave}
    >
      {/* Full-bleed art */}
      {art
        ? <img src={art} alt={card.name}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%',
              objectFit:'cover', objectPosition:'center top', display:'block' }} />
        : <div style={{ position:'absolute', inset:0,
            background:`radial-gradient(ellipse at 40% 35%,${f.art1} 0%,${f.art2} 100%)` }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:GRID_LINES }} />
            <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'1.9rem',
              filter:'drop-shadow(1px 2px 1px rgba(0,0,0,0.9))' }}>{sym}</span>
          </div>
      }

      {/* Bottom gradient scrim */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'52%',
        background:'linear-gradient(to top,rgba(4,6,12,0.96) 0%,rgba(4,6,12,0.7) 50%,transparent 100%)',
        pointerEvents:'none' }} />

      {/* Mana cost badge — top left */}
      {!isLand && mc > 0 && (
        <div style={{ position:'absolute', top:5, left:5, width:20, height:20, borderRadius:'50%',
          background:'rgba(4,6,12,0.88)', border:`1.5px solid ${f.glow}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'0.5rem', fontWeight:'bold', color:'#D4AF37', zIndex:3,
          boxShadow:`0 0 5px ${f.glow}66` }}>
          {mc}
        </div>
      )}

      {/* Qty badge — top right */}
      {qty > 0 && (
        <div style={{ position:'absolute', top:4, right:4, background:'#D4AF37', color:'#0A0E1A',
          fontSize:'0.44rem', fontWeight:'bold', padding:'2px 5px', borderRadius:8,
          cursor:'pointer', zIndex:3, boxShadow:'0 1px 4px rgba(0,0,0,0.8)', letterSpacing:'0.04em' }}
          onClick={e => { e.stopPropagation(); onDec() }}>×{qty}</div>
      )}

      {/* Bottom info panel */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'4px 5px 5px', zIndex:2 }}>
        <div style={{ fontSize:'0.46rem', color:'#F0ECE0', fontWeight:'bold',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          textShadow:'0 1px 4px rgba(0,0,0,0.98)', lineHeight:1.2, marginBottom:3,
          fontFamily:"'Cinzel',serif" }}>
          {card.name}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:f.glow,
            border:'1px solid rgba(255,255,255,0.3)', flexShrink:0,
            boxShadow:`0 0 4px ${f.glow}` }} />
          {isCr && card.power != null && (
            <div style={{ display:'flex', gap:2 }}>
              <div style={{ background:'rgba(180,30,10,0.88)', border:'1px solid #FF4422',
                borderRadius:'50%', width:15, height:15, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'0.37rem', fontWeight:'bold', color:'#FFC0B0' }}>
                {card.power}
              </div>
              <div style={{ background:'rgba(10,120,30,0.88)', border:'1px solid #44CC44',
                borderRadius:'50%', width:15, height:15, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'0.37rem', fontWeight:'bold', color:'#B0FFB8' }}>
                {card.toughness}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 1. PortraitPanel ─────────────────────────────────────────────────
function PortraitPanel({ speechText }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'rgba(20,12,6,0.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
    }}>
      {/* Ambient warm glow bottom-right */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: '70%', height: '60%',
        background: 'radial-gradient(ellipse at 80% 100%, rgba(255,140,26,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Lantern glow top-right */}
      <div style={{
        position: 'absolute', top: '18%', right: '12%', width: 28, height: 28,
        background: 'radial-gradient(circle, rgba(255,180,60,0.45) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      {/* Speech bubble */}
      <div style={{
        position: 'absolute', top: '5%', left: '6%', right: '6%',
        background: 'rgba(245,240,220,0.95)', border: '1px solid #C8961E',
        borderRadius: 6, padding: '5px 8px',
        fontFamily: "'Courier New',monospace", fontSize: '0.55rem', color: '#2A1A08',
        lineHeight: 1.4, zIndex: 4,
      }}>
        {speechText || 'Choose your cards wisely, tactician.'}
        {/* Bubble arrow pointing down */}
        <div style={{
          position: 'absolute', bottom: -7, left: '44%',
          width: 0, height: 0,
          borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
          borderTop: '7px solid #C8961E',
        }} />
        <div style={{
          position: 'absolute', bottom: -5, left: 'calc(44% + 1px)',
          width: 0, height: 0,
          borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
          borderTop: '6px solid rgba(245,240,220,0.95)',
        }} />
      </div>

      {/* Scene area */}
      <div style={{ position: 'relative', width: '90%', marginBottom: 0 }}>

        {/* Wolf (Ironclad) — right side */}
        <div style={{ position: 'absolute', bottom: 12, right: 4, zIndex: 2 }}>
          <div style={{
            width: 22, height: 16, background: '#888898', borderRadius: '6px 6px 4px 4px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -12, right: 2,
              width: 16, height: 14, background: '#9999AA', borderRadius: '5px 5px 3px 3px',
            }}>
              <div style={{
                position: 'absolute', top: -5, left: 2,
                width: 0, height: 0,
                borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                borderBottom: '6px solid #9999AA',
              }} />
              <div style={{
                position: 'absolute', top: -5, right: 2,
                width: 0, height: 0,
                borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                borderBottom: '6px solid #9999AA',
              }} />
              <div style={{
                position: 'absolute', top: 4, left: 4,
                width: 3, height: 3, background: '#222230', borderRadius: '50%',
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 4, left: -8,
              width: 10, height: 4, background: '#888898', borderRadius: '4px 0 0 4px',
              transform: 'rotate(-20deg)',
            }} />
          </div>
        </div>

        {/* Tactician chibi — center-left */}
        <div style={{ position: 'absolute', bottom: 10, left: '25%', zIndex: 3 }}>
          <div style={{
            width: 28, height: 10, background: '#5C2E0A', borderRadius: '4px 4px 0 0',
            marginLeft: -2, marginBottom: -2, position: 'relative', zIndex: 2,
          }} />
          <div style={{
            width: 24, height: 24, background: '#C4875A', borderRadius: '6px 6px 5px 5px',
            position: 'relative', zIndex: 2,
          }}>
            <div style={{
              position: 'absolute', top: 9, left: 5,
              width: 4, height: 4, background: '#2A1206', borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute', top: 9, right: 5,
              width: 4, height: 4, background: '#2A1206', borderRadius: '50%',
            }} />
          </div>
          <div style={{
            width: 20, height: 22, background: '#1A3060', borderRadius: '2px 2px 4px 4px',
            marginLeft: 2, position: 'relative', zIndex: 2,
          }}>
            <div style={{
              position: 'absolute', top: 2, left: -6,
              width: 6, height: 12, background: '#1A3060', borderRadius: 3,
            }} />
            <div style={{
              position: 'absolute', top: 2, right: -6,
              width: 6, height: 12, background: '#1A3060', borderRadius: 3,
            }} />
          </div>
        </div>

        {/* Wooden desk */}
        <div style={{
          width: '100%', height: 10,
          background: '#5C3A1E', borderRadius: '2px 2px 0 0',
          border: '1px solid rgba(212,175,55,0.5)', borderBottom: 'none',
          position: 'relative', zIndex: 4,
        }}>
          {/* Spellbook on desk */}
          <div style={{
            position: 'absolute', top: -10, left: 8,
            width: 18, height: 12, background: '#1A0E2A',
            border: '1px solid #6633AA', borderRadius: 1,
          }}>
            <div style={{ position: 'absolute', top: 3, left: 9, right: 2, height: 1, background: 'rgba(150,120,200,0.4)' }} />
            <div style={{ position: 'absolute', top: 5, left: 9, right: 2, height: 1, background: 'rgba(150,120,200,0.4)' }} />
            <div style={{ position: 'absolute', top: 7, left: 9, right: 2, height: 1, background: 'rgba(150,120,200,0.4)' }} />
            <div style={{ position: 'absolute', top: 3, bottom: 2, left: 8, width: 1, background: 'rgba(100,80,140,0.6)' }} />
          </div>
          {/* Candle */}
          <div style={{ position: 'absolute', top: -16, right: 14 }}>
            <div style={{
              width: 0, height: 0, margin: '0 auto',
              borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
              borderBottom: '6px solid #FF8C1A',
              filter: 'drop-shadow(0 0 3px rgba(255,140,26,0.8))',
            }} />
            <div style={{
              width: 6, height: 10, background: '#F5F0E8',
              border: '1px solid #C8C0A8', borderRadius: '1px 1px 0 0',
            }} />
          </div>
        </div>
        {/* Desk front face */}
        <div style={{
          width: '100%', height: 6, background: '#4A2E14',
          borderLeft: '1px solid rgba(212,175,55,0.5)', borderRight: '1px solid rgba(212,175,55,0.5)',
          borderBottom: '1px solid rgba(212,175,55,0.5)',
        }} />
      </div>
    </div>
  )
}

// ── 2. CollectiblesPanel ──────────────────────────────────────────────
function CollectiblesPanel() {
  const items = [
    { emoji: '📖', label: 'Spellbook',      bg: '#6B2FAF' },
    { emoji: '🛡',  label: 'Sunfire Shield', bg: '#C8961E' },
    { emoji: '⚔',  label: 'Greatsword',     bg: '#B03010' },
    { emoji: '🦊',  label: 'Foe Familiar',   bg: '#C06010' },
  ]
  return (
    <div style={{
      width: '100%', padding: '0.4rem 0.5rem', boxSizing: 'border-box',
      background: 'rgba(20,12,6,0.97)',
      borderTop: '1px solid rgba(212,175,55,0.18)',
    }}>
      <div style={{
        fontFamily: "'Cinzel',serif", fontSize: '0.55rem', color: '#D4AF37',
        letterSpacing: '0.1em', marginBottom: '0.4rem', fontWeight: 700,
      }}>
        WORLD COLLECTIBLES
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between' }}>
        {items.map(item => (
          <div key={item.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
            flex: 1,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: item.bg,
              border: '2px solid rgba(212,175,55,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              boxShadow: `0 0 6px ${item.bg}66`,
            }}>
              {item.emoji}
            </div>
            <div style={{
              fontSize: '0.45rem', color: '#A09070', textAlign: 'center',
              fontFamily: "'Courier New',monospace", lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              width: '100%',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 3. SortByPanel ────────────────────────────────────────────────────
function SortByPanel({ sortBy, onSort }) {
  const options = [
    { key: 'health', icon: '❤', label: 'Health' },
    { key: 'mana',   icon: '◆', label: 'Mana'   },
    { key: 'name',   icon: '✦', label: 'Name'   },
    { key: 'color',  icon: '★', label: 'Color'  },
  ]
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'rgba(8,14,26,0.92)', border: '1px solid rgba(212,175,55,0.3)',
      boxSizing: 'border-box', fontFamily: "'Courier New',monospace", overflow: 'hidden',
    }}>
      <div style={{
        background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.22)',
        padding: '0.4rem 0.65rem',
        fontFamily: "'Cinzel',serif", fontSize: 'clamp(0.6rem,0.9vw,0.82rem)',
        color: '#D4AF37', letterSpacing: '0.08em', flexShrink: 0,
      }}>
        Sort By
      </div>
      <div style={{ flex: 1, padding: '0.3rem 0' }}>
        {options.map(opt => {
          const active = sortBy === opt.key
          return (
            <div key={opt.key}
              onClick={() => onSort(opt.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.3rem 0.5rem',
                cursor: 'pointer',
                borderLeft: active ? '2px solid #D4AF37' : '2px solid transparent',
                color: active ? '#D4AF37' : '#7090B0',
                fontSize: '0.62rem',
                userSelect: 'none',
              }}>
              <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{opt.icon}</span>
              <span style={{ letterSpacing: '0.04em' }}>{opt.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 4. FiltersPanel ───────────────────────────────────────────────────
function FiltersPanel({ colorFilter, setColor, typeFilter, setType }) {
  const elements = [
    { key: 'white', label: '☀',  bg: '#8B7040', glow: '#F5CBA7' },
    { key: 'blue',  label: '💧', bg: '#1A3A6A', glow: '#2980B9' },
    { key: 'black', label: '💀', bg: '#1C1C34', glow: '#8B2BE2' },
    { key: 'red',   label: '🔥', bg: '#6A1A10', glow: '#E74C3C' },
    { key: 'green', label: '🍃', bg: '#1A4A20', glow: '#2ECC71' },
  ]
  const types = [
    { key: 'creature', label: '⚔ Creature' },
    { key: 'spell',    label: '📖 Spell'    },
    { key: 'land',     label: '🏔 Land'     },
  ]
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'rgba(8,14,26,0.92)', border: '1px solid rgba(212,175,55,0.3)',
      boxSizing: 'border-box', fontFamily: "'Courier New',monospace", overflow: 'hidden',
    }}>
      <div style={{
        background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.22)',
        padding: '0.4rem 0.65rem',
        fontFamily: "'Cinzel',serif", fontSize: 'clamp(0.6rem,0.9vw,0.82rem)',
        color: '#D4AF37', letterSpacing: '0.08em', flexShrink: 0,
      }}>
        Filters
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.45rem 0.5rem',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.25) transparent' }}>

        <div style={{
          fontSize: '0.5rem', color: '#A09070', textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: '0.35rem',
        }}>
          Element
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.3rem', marginBottom: '0.25rem' }}>
          {elements.slice(0, 3).map(el => {
            const active = colorFilter === el.key
            return (
              <button key={el.key}
                onClick={() => setColor(active ? 'all' : el.key)}
                style={{
                  width: 36, height: 36, borderRadius: 4,
                  background: el.bg,
                  border: active ? '2px solid #D4AF37' : '1px solid rgba(212,175,55,0.2)',
                  boxShadow: active ? `0 0 8px ${el.glow}99, 0 0 3px ${el.glow}66` : 'none',
                  fontSize: '1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, boxSizing: 'border-box',
                }}>
                {el.label}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {elements.slice(3, 5).map(el => {
            const active = colorFilter === el.key
            return (
              <button key={el.key}
                onClick={() => setColor(active ? 'all' : el.key)}
                style={{
                  width: 36, height: 36, borderRadius: 4,
                  background: el.bg,
                  border: active ? '2px solid #D4AF37' : '1px solid rgba(212,175,55,0.2)',
                  boxShadow: active ? `0 0 8px ${el.glow}99, 0 0 3px ${el.glow}66` : 'none',
                  fontSize: '1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, boxSizing: 'border-box',
                }}>
                {el.label}
              </button>
            )
          })}
        </div>

        <div style={{
          fontSize: '0.5rem', color: '#A09070', textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: '0.35rem', marginTop: '0.5rem',
        }}>
          Type
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
          {types.map(t => {
            const active = typeFilter === t.key
            return (
              <button key={t.key}
                onClick={() => setType(active ? 'all' : t.key)}
                style={{
                  flex: 1, padding: '0.25rem 0.1rem', fontSize: '0.55rem',
                  background: 'transparent',
                  border: active ? '1px solid #D4AF37' : '1px solid rgba(90,120,160,0.35)',
                  color: active ? '#D4AF37' : '#7090B0',
                  cursor: 'pointer', fontFamily: "'Courier New',monospace",
                  borderRadius: 1, textAlign: 'center', lineHeight: 1.3,
                  boxSizing: 'border-box',
                }}>
                {t.label}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setType('all')}
          style={{
            width: '100%', padding: '0.2rem', fontSize: '0.55rem',
            background: typeFilter === 'all' ? 'rgba(212,175,55,0.1)' : 'transparent',
            border: typeFilter === 'all' ? '1px solid rgba(212,175,55,0.55)' : '1px solid rgba(90,120,160,0.25)',
            color: typeFilter === 'all' ? '#D4AF37' : '#7090B0',
            cursor: 'pointer', fontFamily: "'Courier New',monospace",
            borderRadius: 1, letterSpacing: '0.06em', boxSizing: 'border-box',
          }}>
          ALL
        </button>
      </div>
    </div>
  )
}

// ── Deck list item ────────────────────────────────────────────
function DeckItem({ deck, isSelected, onSelect, onDelete }) {
  const f = FRAME[deck.color] || FRAME.colorless
  return (
    <div
      onClick={() => onSelect(deck.id)}
      style={{
        flexShrink: 0,
        width: 140,
        background: isSelected ? 'rgba(212,175,55,0.12)' : 'rgba(6,12,24,0.7)',
        border: `1px solid ${isSelected ? 'rgba(212,175,55,0.65)' : 'rgba(90,120,160,0.25)'}`,
        borderRadius: 3,
        padding: '0.35rem 0.45rem',
        cursor: 'pointer',
        fontFamily: "'Courier New',monospace",
        boxSizing: 'border-box',
        boxShadow: isSelected ? `0 0 8px rgba(212,175,55,0.2)` : 'none',
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.15rem' }}>
        <span style={{
          color: '#D4AF37', fontFamily: "'Cinzel',serif", fontSize: '0.7rem', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 4,
        }}>
          {deck.name}
        </span>
        <span style={{
          width: 9, height: 9, borderRadius: '50%', background: f.glow, flexShrink: 0,
          border: `1px solid ${f.border}`, boxShadow: `0 0 4px ${f.glow}66`,
          display: 'inline-block',
        }} />
      </div>
      {deck.description && (
        <div style={{
          color: '#7090B0', fontSize: '0.55rem', fontStyle: 'italic', marginBottom: '0.25rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {deck.description}
        </div>
      )}
      <div style={{ display:'flex', gap:'0.25rem' }}>
        <button
          style={{
            flex: 1, padding: '0.15rem', fontSize: '0.52rem', background: 'transparent',
            border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', cursor: 'pointer',
            letterSpacing: '0.04em', fontFamily: "'Courier New',monospace",
          }}
          onClick={e => { e.stopPropagation(); onSelect(deck.id) }}>
          VIEW
        </button>
        <button
          style={{
            padding: '0.15rem 0.35rem', fontSize: '0.52rem', background: 'transparent',
            border: '1px solid rgba(204,49,17,0.4)', color: '#CC3311', cursor: 'pointer',
            fontFamily: "'Courier New',monospace",
          }}
          onClick={e => { e.stopPropagation(); onDelete(deck.id) }}>
          DEL
        </button>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────
export default function Home() {
  const { user, signOut }           = useAuth()
  const navigate                    = useNavigate()
  const [decks, setDecks]           = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [deckCards, setDeckCards]   = useState([])
  const [allCards, setAllCards]     = useState([])
  const [colorFilter, setColor]     = useState('all')
  const [typeFilter, setType]       = useState('all')
  const [sortBy, setSortBy]         = useState('mana')
  const [search, setSearch]         = useState('')
  const [hovered, setHovered]       = useState(null)
  const [loadingDecks, setLdDecks]  = useState(true)
  const [loadingCards, setLdCards]  = useState(true)
  const [showNew, setShowNew]       = useState(false)
  const [newName, setNewName]       = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [newColor, setNewColor]     = useState('blue')
  const [creating, setCreating]     = useState(false)

  // Inject goldPulse keyframe once
  useEffect(() => {
    const styleId = 'gold-pulse-keyframe'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @keyframes goldPulse {
          0%   { box-shadow: 0 0 0 0 rgba(212,175,55,0.7); }
          70%  { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => { if (user) { fetchDecks(); fetchAllCards() } }, [user])

  async function fetchDecks() {
    setLdDecks(true)
    try {
      const res = await api.get(`/decks?user_id=eq.${user.id}&order=created_at.desc`)
      setDecks(res.data)
      return res.data
    } finally { setLdDecks(false) }
  }

  async function fetchAllCards() {
    setLdCards(true)
    try {
      const res = await api.get('/cards?order=color.asc,name.asc')
      setAllCards(res.data)
    } finally { setLdCards(false) }
  }

  async function fetchDeckCards(deckId) {
    const res = await api.get(`/deck_cards?deck_id=eq.${deckId}&select=*,cards(*)`)
    setDeckCards(res.data)
  }

  function handleSelectDeck(id) { setSelectedId(id); fetchDeckCards(id) }

  async function handleDeleteDeck(id) {
    if (!window.confirm('Delete this deck? This cannot be undone.')) return
    try {
      await api.delete(`/decks?id=eq.${id}`)
      setDecks(prev => prev.filter(d => d.id !== id))
      if (selectedId === id) { setSelectedId(null); setDeckCards([]) }
    } catch (err) { alert(err.response?.data?.message ?? 'Failed to delete deck') }
  }

  async function handleCreateDeck() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await api.post('/decks', { user_id: user.id, name: newName.trim(), description: newDesc.trim(), color: newColor })
      const updated = await fetchDecks()
      if (updated?.length) handleSelectDeck(updated[0].id)
      setShowNew(false); setNewName(''); setNewDesc(''); setNewColor('blue')
    } catch (err) { alert(err.response?.data?.message ?? 'Failed to create deck') }
    finally { setCreating(false) }
  }

  const deckCardMap = useMemo(() => {
    const m = {}
    for (const dc of deckCards) m[dc.card_id] = { deckCardId: dc.id, quantity: dc.quantity }
    return m
  }, [deckCards])

  const totalCards = deckCards.reduce((s, dc) => s + (dc.quantity ?? 0), 0)

  async function handleAddCard(card) {
    if (!selectedId) return
    try {
      await api.post('/deck_cards', { deck_id: selectedId, card_id: card.id, quantity: 1 })
      await fetchDeckCards(selectedId)
    } catch (err) { alert(err.response?.data?.message ?? 'Failed to add card') }
  }

  async function handleIncrement(card) {
    const e = deckCardMap[card.id]
    if (!e || e.quantity >= 3) return
    try {
      await api.patch(`/deck_cards?id=eq.${e.deckCardId}`, { quantity: e.quantity + 1 })
      await fetchDeckCards(selectedId)
    } catch (err) { alert(err.response?.data?.message ?? 'Failed to update') }
  }

  async function handleDecrement(card) {
    const e = deckCardMap[card.id]
    if (!e) return
    try {
      if (e.quantity === 1) await api.delete(`/deck_cards?id=eq.${e.deckCardId}`)
      else await api.patch(`/deck_cards?id=eq.${e.deckCardId}`, { quantity: e.quantity - 1 })
      await fetchDeckCards(selectedId)
    } catch (err) { alert(err.response?.data?.message ?? 'Failed to update') }
  }

  // Filtered + sorted card list
  const filtered = useMemo(() => {
    const base = allCards.filter(c => {
      if (colorFilter !== 'all' && c.color !== colorFilter) return false
      if (typeFilter  !== 'all' && c.type  !== typeFilter)  return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    return [...base].sort((a, b) => {
      if (sortBy === 'name')   return a.name.localeCompare(b.name)
      if (sortBy === 'color')  return (a.color||'').localeCompare(b.color||'')
      if (sortBy === 'health') {
        const aHP = (a.toughness ?? 0) * 10
        const bHP = (b.toughness ?? 0) * 10
        return bHP - aHP
      }
      // mana (default)
      const aMC = a.mana_cost ? Object.values(a.mana_cost).reduce((s,v)=>s+(v||0),0) : 0
      const bMC = b.mana_cost ? Object.values(b.mana_cost).reduce((s,v)=>s+(v||0),0) : 0
      return aMC - bMC
    })
  }, [allCards, colorFilter, typeFilter, search, sortBy])

  const selectedDeck = decks.find(d => d.id === selectedId) ?? null

  // Speech text based on deck state
  const speechText = useMemo(() => {
    if (!selectedDeck) return 'Choose your cards wisely, tactician.'
    if (totalCards === 0)   return `Start building "${selectedDeck.name}"!`
    if (totalCards >= 30)   return `"${selectedDeck.name}" is battle-ready!`
    if (totalCards >= 20)   return `Almost there — ${30 - totalCards} more cards needed.`
    return `${totalCards} cards in "${selectedDeck.name}". Keep going!`
  }, [selectedDeck, totalCards])

  // Deck card groups for current deck panel
  const deckCreatures = deckCards.filter(dc => dc.cards?.type === 'creature')
  const deckSpells    = deckCards.filter(dc => dc.cards?.type === 'spell' || dc.cards?.type === 'enchantment')
  const deckLands     = deckCards.filter(dc => dc.cards?.type === 'land')
  const deckOther     = deckCards.filter(dc => {
    const t = dc.cards?.type
    return t && t !== 'creature' && t !== 'spell' && t !== 'enchantment' && t !== 'land'
  })

  // Shared style helpers
  const smBtn = (col = '#D4AF37') => ({
    padding: '0.18rem 0.5rem', fontSize: '0.62rem', background: 'transparent',
    border: `1px solid ${col}66`, color: col, cursor: 'pointer',
    fontFamily: "'Courier New',monospace", letterSpacing: '0.04em', borderRadius: 1,
  })
  const inpStyle = {
    width: '100%', padding: '0.28rem 0.4rem', boxSizing: 'border-box',
    background: 'rgba(6,12,24,0.9)', border: '1px solid rgba(90,120,160,0.4)',
    color: 'rgba(240,238,216,0.95)', fontFamily: "'Courier New',monospace", fontSize: '0.72rem',
    outline: 'none', caretColor: '#D4AF37', borderRadius: 1,
  }
  const subHeader = {
    fontSize: '0.5rem', color: '#A09070', textTransform: 'uppercase',
    letterSpacing: '0.08em', padding: '0.2rem 0.4rem',
    borderBottom: '1px solid rgba(212,175,55,0.12)',
    fontFamily: "'Cinzel',serif",
    background: 'rgba(212,175,55,0.03)',
  }

  // Rivet component
  const Rivet = ({ style }) => (
    <div style={{
      position: 'absolute', width: 10, height: 10, borderRadius: '50%',
      background: '#D4AF37', border: '1px solid rgba(200,150,30,0.6)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
      zIndex: 10, ...style,
    }} />
  )

  return (
    <div style={{
      width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden',
      background: '#3B2A1A',
      border: '2px solid #C8961E',
      boxSizing: 'border-box',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/assets/login-bg.png)',
        backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
        opacity: 0.35, pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Corner rivets */}
      <Rivet style={{ top: 6, left: 6 }} />
      <Rivet style={{ top: 6, right: 6 }} />
      <Rivet style={{ bottom: 6, left: 6 }} />
      <Rivet style={{ bottom: 6, right: 6 }} />

      {/* ── Top strip ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4.5%', zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5%',
        background: 'rgba(30,18,8,0.85)', borderBottom: '1px solid rgba(212,175,55,0.22)',
      }}>
        <span style={{
          fontFamily: "'Cinzel',serif", color: '#D4AF37',
          fontSize: 'clamp(0.6rem,1vw,0.85rem)', letterSpacing: '0.12em', fontWeight: 900,
        }}>DECK BUILDER</span>
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <span style={{ color: '#7090B0', fontSize: '0.68rem', fontFamily: "'Courier New',monospace" }}>{user?.email}</span>
          <button style={smBtn('#D4AF37')} onClick={() => navigate('/game')}>Enter World</button>
          <button style={smBtn('#7090B0')} onClick={signOut}>Logout</button>
        </div>
      </div>

      {/* ── MY DECKS horizontal bar ── */}
      <div style={{
        position: 'absolute', top: '4.5%', left: 0, right: 0, height: '18%', zIndex: 5,
        background: 'rgba(12,8,4,0.88)', borderBottom: '1px solid rgba(212,175,55,0.28)',
        display: 'flex', alignItems: 'stretch',
      }}>
        {/* Vertical label */}
        <div style={{
          width: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(212,175,55,0.06)', borderRight: '1px solid rgba(212,175,55,0.2)',
          writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)',
          fontFamily: "'Cinzel',serif", fontSize: '0.52rem', color: '#D4AF37',
          letterSpacing: '0.12em', fontWeight: 700,
        }}>
          ★ MY DECKS ★
        </div>

        {/* Scrollable deck cards */}
        <div style={{
          flex: 1, overflowX: 'auto', overflowY: 'hidden',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 0.5rem',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.25) transparent',
        }}>
          {loadingDecks && (
            <span style={{ color: '#7090B0', fontSize: '0.68rem', fontFamily: "'Courier New',monospace", padding: '0 1rem' }}>Loading…</span>
          )}
          {!loadingDecks && decks.length === 0 && !showNew && (
            <span style={{ color: '#7090B0', fontSize: '0.65rem', fontFamily: "'Courier New',monospace", fontStyle: 'italic', padding: '0 0.5rem' }}>
              No decks yet — create one!
            </span>
          )}
          {decks.map(deck => (
            <DeckItem key={deck.id} deck={deck} isSelected={deck.id === selectedId}
              onSelect={handleSelectDeck} onDelete={handleDeleteDeck} />
          ))}

          {/* New deck inline form */}
          {showNew && (
            <div style={{
              flexShrink: 0, width: 220,
              background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 3, padding: '0.4rem 0.5rem',
              display: 'flex', flexDirection: 'column', gap: '0.25rem',
              fontFamily: "'Courier New',monospace",
            }}>
              <input placeholder="Deck name *" value={newName} onChange={e => setNewName(e.target.value)}
                style={{ ...inpStyle, fontSize: '0.65rem', padding: '0.2rem 0.35rem' }} />
              <input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                style={{ ...inpStyle, fontSize: '0.6rem', padding: '0.18rem 0.35rem' }} />
              <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                {['white','blue','black','red','green','colorless'].map(c => (
                  <div key={c} title={c} style={{
                    width: 14, height: 14, borderRadius: '50%', cursor: 'pointer',
                    background: (FRAME[c] || FRAME.colorless).glow,
                    border: `2px solid ${newColor === c ? '#D4AF37' : 'transparent'}`,
                    boxSizing: 'border-box', flexShrink: 0,
                  }}
                    onClick={() => setNewColor(c)} />
                ))}
              </div>
              <button disabled={creating || !newName.trim()} onClick={handleCreateDeck}
                style={{
                  padding: '0.2rem', background: '#D4AF37', border: 'none', color: '#0A0E1A',
                  fontFamily: "'Cinzel',serif", fontSize: '0.6rem', fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.06em',
                  opacity: creating || !newName.trim() ? 0.45 : 1,
                }}>
                {creating ? 'Creating…' : 'Create Deck'}
              </button>
            </div>
          )}
        </div>

        {/* + NEW DECK button pinned right */}
        <div style={{
          flexShrink: 0, width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderLeft: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)',
          position: 'relative',
        }}>
          <span style={{ position: 'absolute', top: 4, left: 4, fontSize: '0.45rem', color: '#D4AF3766' }}>✦</span>
          <span style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.45rem', color: '#D4AF3766' }}>✦</span>
          <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '0.45rem', color: '#D4AF3766' }}>✦</span>
          <span style={{ position: 'absolute', bottom: 4, right: 4, fontSize: '0.45rem', color: '#D4AF3766' }}>✦</span>
          <button
            onClick={() => setShowNew(v => !v)}
            style={{
              background: showNew ? 'rgba(212,175,55,0.15)' : 'transparent',
              border: `1px solid ${showNew ? '#D4AF37' : 'rgba(212,175,55,0.4)'}`,
              color: '#D4AF37', cursor: 'pointer',
              fontFamily: "'Cinzel',serif", fontSize: '0.55rem', fontWeight: 700,
              padding: '0.3rem 0.4rem', letterSpacing: '0.06em', lineHeight: 1.3, textAlign: 'center',
            }}>
            {showNew ? '✕\nCANCEL' : '+\nNEW'}
          </button>
        </div>
      </div>

      {/* ── Main 5-column content area ── */}
      <div style={{
        position: 'absolute', top: 'calc(4.5% + 18%)', left: '0.5%', right: '0.5%', bottom: '0.4%',
        display: 'flex', gap: '0.5%', zIndex: 4,
      }}>

        {/* COL 1: Portrait + Collectibles (14%) */}
        <div style={{
          width: '14%', flexShrink: 0, display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(212,175,55,0.3)', overflow: 'hidden',
        }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PortraitPanel speechText={speechText} />
          </div>
          <CollectiblesPanel />
        </div>

        {/* COL 2: Sort By (9%) */}
        <div style={{ width: '9%', flexShrink: 0 }}>
          <SortByPanel sortBy={sortBy} onSort={setSortBy} />
        </div>

        {/* COL 3: Card Library (flex:1) */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'rgba(8,14,26,0.92)', border: '1px solid rgba(212,175,55,0.3)',
          overflow: 'hidden',
        }}>
          {/* Library header with search */}
          <div style={{
            background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.22)',
            padding: '0.4rem 0.65rem', flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: '0.35rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontFamily: "'Cinzel',serif", fontSize: 'clamp(0.6rem,0.9vw,0.82rem)',
                color: '#D4AF37', letterSpacing: '0.08em',
              }}>Card Library</span>
              <span style={{ color: '#7090B0', fontSize: '0.62rem', fontFamily: "'Courier New',monospace", fontStyle: 'italic' }}>
                {filtered.length} cards
              </span>
            </div>
            <input
              placeholder="Search cards…" value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.15rem 0.4rem', boxSizing: 'border-box',
                background: 'rgba(6,12,24,0.9)', border: '1px solid rgba(90,120,160,0.35)',
                color: 'rgba(240,238,216,0.85)', fontFamily: "'Courier New',monospace",
                fontSize: '0.65rem', outline: 'none', caretColor: '#D4AF37', borderRadius: 1,
              }} />
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '0.45rem',
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.25) transparent',
          }}>
            {loadingCards && (
              <p style={{ color: '#7090B0', fontSize: '0.8rem', textAlign: 'center', padding: '2rem', fontFamily: "'Courier New',monospace" }}>Loading cards…</p>
            )}
            {!loadingCards && filtered.length === 0 && (
              <p style={{ color: '#7090B0', fontSize: '0.75rem', textAlign: 'center', padding: '1.5rem', fontFamily: "'Courier New',monospace", fontStyle: 'italic' }}>
                No cards match filters.
              </p>
            )}
            {!selectedId && !loadingCards && (
              <div style={{
                position: 'sticky', top: 0, background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.25)', padding: '0.4rem 0.6rem', marginBottom: '0.5rem',
                fontFamily: "'Courier New',monospace", fontSize: '0.68rem', color: '#D4AF37',
                letterSpacing: '0.04em', zIndex: 1,
              }}>
                Select a deck above to start adding cards
              </div>
            )}
            {!loadingCards && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(88px,1fr))', gap: '0.55rem' }}>
                {filtered.map(card => {
                  const entry = deckCardMap[card.id]
                  const qty   = entry?.quantity ?? 0
                  const canAdd = !!selectedId && qty < 3
                  return (
                    <MiniCard key={card.id} card={card} qty={qty} canAdd={canAdd}
                      onAdd={() => qty === 0 ? handleAddCard(card) : handleIncrement(card)}
                      onDec={() => handleDecrement(card)}
                      onHover={rect => setHovered({ card, rect })}
                      onLeave={() => setHovered(null)} />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* COL 4: Filters (9%) */}
        <div style={{ width: '9%', flexShrink: 0 }}>
          <FiltersPanel colorFilter={colorFilter} setColor={setColor} typeFilter={typeFilter} setType={setType} />
        </div>

        {/* COL 5: Current Deck (18%) */}
        <div style={{
          width: '18%', flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'rgba(8,14,26,0.92)', border: '1px solid rgba(212,175,55,0.3)',
          overflow: 'hidden',
        }}>
          {/* Deck header */}
          <div style={{
            background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.22)',
            padding: '0.4rem 0.65rem', flexShrink: 0,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{
              fontFamily: "'Cinzel',serif", fontSize: 'clamp(0.55rem,0.8vw,0.75rem)',
              color: '#D4AF37', letterSpacing: '0.08em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {selectedDeck ? selectedDeck.name : 'No Deck'}
            </span>
            <span style={{
              color: totalCards >= 30 ? '#D4AF37' : '#7090B0',
              fontSize: '0.62rem', fontFamily: "'Courier New',monospace",
              letterSpacing: 0, flexShrink: 0, marginLeft: 4,
            }}>
              {totalCards}/30
            </span>
          </div>

          {!selectedDeck ? (
            <p style={{
              color: '#7090B0', fontSize: '0.68rem', textAlign: 'center',
              padding: '2rem 0.8rem', fontFamily: "'Courier New',monospace", fontStyle: 'italic', lineHeight: 1.6,
            }}>
              Select a deck from the bar above.
            </p>
          ) : null}

          {/* Deck card thumbnails grouped by type */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '0.3rem',
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(212,175,55,0.25) transparent',
          }}>
            {selectedDeck && deckCreatures.length > 0 && (
              <>
                <div style={subHeader}>CREATURES ({deckCreatures.reduce((s,dc)=>s+(dc.quantity??0),0)})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.25rem', padding: '0.25rem 0' }}>
                  {deckCreatures.map(dc => {
                    if (!dc.cards) return null
                    const card = dc.cards
                    const f = FRAME[card.color] || FRAME.colorless
                    const art = artUrl(card.image_url)
                    return (
                      <div key={dc.id}
                        title={`${card.name} ×${dc.quantity}`}
                        onClick={() => handleDecrement(card)}
                        style={{
                          aspectRatio: '1/1', position: 'relative', borderRadius: 4, overflow: 'hidden',
                          cursor: 'pointer', border: `1px solid ${f.border}55`,
                          background: `radial-gradient(ellipse at 40% 35%,${f.art1} 0%,${f.art2} 100%)`,
                        }}>
                        {art && (
                          <img src={art} alt={card.name}
                            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
                        )}
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          background: '#D4AF37', color: '#0A0E1A',
                          fontSize: '0.38rem', fontWeight: 'bold', padding: '1px 3px',
                          borderRadius: '3px 0 0 0', lineHeight: 1.2,
                        }}>×{dc.quantity}</div>
                        {card.mana_cost && (() => {
                          const mc = Object.values(card.mana_cost).reduce((s,v)=>s+(v||0),0)
                          return mc > 0 ? (
                            <div style={{
                              position: 'absolute', top: 2, left: 2, width: 12, height: 12,
                              borderRadius: '50%', background: 'rgba(4,6,12,0.88)',
                              border: `1px solid ${f.glow}`, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '0.32rem', fontWeight: 'bold', color: '#D4AF37',
                            }}>{mc}</div>
                          ) : null
                        })()}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {selectedDeck && deckSpells.length > 0 && (
              <>
                <div style={subHeader}>SPELLS ({deckSpells.reduce((s,dc)=>s+(dc.quantity??0),0)})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.25rem', padding: '0.25rem 0' }}>
                  {deckSpells.map(dc => {
                    if (!dc.cards) return null
                    const card = dc.cards
                    const f = FRAME[card.color] || FRAME.colorless
                    const art = artUrl(card.image_url)
                    return (
                      <div key={dc.id}
                        title={`${card.name} ×${dc.quantity}`}
                        onClick={() => handleDecrement(card)}
                        style={{
                          aspectRatio: '1/1', position: 'relative', borderRadius: 4, overflow: 'hidden',
                          cursor: 'pointer', border: `1px solid ${f.border}55`,
                          background: `radial-gradient(ellipse at 40% 35%,${f.art1} 0%,${f.art2} 100%)`,
                        }}>
                        {art && (
                          <img src={art} alt={card.name}
                            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
                        )}
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          background: '#D4AF37', color: '#0A0E1A',
                          fontSize: '0.38rem', fontWeight: 'bold', padding: '1px 3px',
                          borderRadius: '3px 0 0 0', lineHeight: 1.2,
                        }}>×{dc.quantity}</div>
                        {card.mana_cost && (() => {
                          const mc = Object.values(card.mana_cost).reduce((s,v)=>s+(v||0),0)
                          return mc > 0 ? (
                            <div style={{
                              position: 'absolute', top: 2, left: 2, width: 12, height: 12,
                              borderRadius: '50%', background: 'rgba(4,6,12,0.88)',
                              border: `1px solid ${f.glow}`, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '0.32rem', fontWeight: 'bold', color: '#D4AF37',
                            }}>{mc}</div>
                          ) : null
                        })()}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {selectedDeck && deckLands.length > 0 && (
              <>
                <div style={subHeader}>LANDS ({deckLands.reduce((s,dc)=>s+(dc.quantity??0),0)})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.25rem', padding: '0.25rem 0' }}>
                  {deckLands.map(dc => {
                    if (!dc.cards) return null
                    const card = dc.cards
                    const f = FRAME[card.color] || FRAME.colorless
                    const art = artUrl(card.image_url)
                    return (
                      <div key={dc.id}
                        title={`${card.name} ×${dc.quantity}`}
                        onClick={() => handleDecrement(card)}
                        style={{
                          aspectRatio: '1/1', position: 'relative', borderRadius: 4, overflow: 'hidden',
                          cursor: 'pointer', border: `1px solid ${f.border}55`,
                          background: `radial-gradient(ellipse at 40% 35%,${f.art1} 0%,${f.art2} 100%)`,
                        }}>
                        {art && (
                          <img src={art} alt={card.name}
                            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
                        )}
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          background: '#D4AF37', color: '#0A0E1A',
                          fontSize: '0.38rem', fontWeight: 'bold', padding: '1px 3px',
                          borderRadius: '3px 0 0 0', lineHeight: 1.2,
                        }}>×{dc.quantity}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {selectedDeck && deckOther.length > 0 && (
              <>
                <div style={subHeader}>OTHER ({deckOther.reduce((s,dc)=>s+(dc.quantity??0),0)})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.25rem', padding: '0.25rem 0' }}>
                  {deckOther.map(dc => {
                    if (!dc.cards) return null
                    const card = dc.cards
                    const f = FRAME[card.color] || FRAME.colorless
                    const art = artUrl(card.image_url)
                    return (
                      <div key={dc.id}
                        title={`${card.name} ×${dc.quantity}`}
                        onClick={() => handleDecrement(card)}
                        style={{
                          aspectRatio: '1/1', position: 'relative', borderRadius: 4, overflow: 'hidden',
                          cursor: 'pointer', border: `1px solid ${f.border}55`,
                          background: `radial-gradient(ellipse at 40% 35%,${f.art1} 0%,${f.art2} 100%)`,
                        }}>
                        {art && (
                          <img src={art} alt={card.name}
                            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
                        )}
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0,
                          background: '#D4AF37', color: '#0A0E1A',
                          fontSize: '0.38rem', fontWeight: 'bold', padding: '1px 3px',
                          borderRadius: '3px 0 0 0', lineHeight: 1.2,
                        }}>×{dc.quantity}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {selectedDeck && deckCards.length === 0 && (
              <p style={{
                color: '#7090B0', fontSize: '0.65rem', textAlign: 'center',
                padding: '1.5rem 0.5rem', fontFamily: "'Courier New',monospace", fontStyle: 'italic', lineHeight: 1.5,
              }}>
                No cards yet.<br/>Click cards in the library to add them.
              </p>
            )}
          </div>

          {/* Validate button */}
          {selectedDeck && (
            <div style={{ padding: '0.45rem 0.5rem', borderTop: '1px solid rgba(212,175,55,0.18)', flexShrink: 0 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem',
                fontFamily: "'Courier New',monospace", fontSize: '0.58rem', color: '#7090B0',
              }}>
                <span>C: {deckCreatures.reduce((s,dc)=>s+(dc.quantity??0),0)}</span>
                <span>S: {deckSpells.reduce((s,dc)=>s+(dc.quantity??0),0)}</span>
                <span>L: {deckLands.reduce((s,dc)=>s+(dc.quantity??0),0)}</span>
              </div>
              <button
                onClick={() => alert(totalCards >= 30
                  ? `${selectedDeck.name} is battle-ready! (${totalCards} cards)`
                  : `Need ${30 - totalCards} more cards to complete this deck.`)}
                style={{
                  width: '100%', padding: '0.42rem',
                  background: totalCards >= 30 ? '#27AE60' : 'rgba(212,175,55,0.12)',
                  border: `1px solid ${totalCards >= 30 ? '#2ECC71' : 'rgba(212,175,55,0.35)'}`,
                  color: totalCards >= 30 ? '#FFFFFF' : '#D4AF37',
                  fontFamily: "'Cinzel',serif", fontSize: '0.68rem', fontWeight: 700,
                  letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase',
                  animation: totalCards >= 30 ? 'goldPulse 1.5s ease-out infinite' : 'none',
                }}>
                {totalCards >= 30 ? 'Battle Ready!' : 'Validate Deck'}
              </button>
            </div>
          )}
        </div>
      </div>

      <Tooltip card={hovered?.card} rect={hovered?.rect} />
    </div>
  )
}
