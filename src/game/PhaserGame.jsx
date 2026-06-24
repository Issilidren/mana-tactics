import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import gameConfig from './index.js'

export default function PhaserGame({ user, playerDeck, onBattleStart, onStarterPicked, onShopOpen, onExitGame, onGameReady }) {
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Create Phaser game instance pointed at the container div
    const config = {
      ...gameConfig,
      parent: containerRef.current,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    // Pass React props into the Phaser registry so scenes can read them
    game.registry.set('user', user)
    game.registry.set('playerDeck', playerDeck ?? [])
    game.registry.set('gold', user?.gold ?? 0)
    game.registry.set('hp', user?.hp ?? 10)
    game.registry.set('seals', user?.seals ?? [])

    game.events.on('battleStart',    (npcData) => { if (onBattleStart)    onBattleStart(npcData) })
    game.events.on('starterPicked',  (data)    => { if (onStarterPicked)  onStarterPicked(data) })
    game.events.on('shopOpen',       ()        => { if (onShopOpen)       onShopOpen() })

    if (onGameReady) onGameReady(game)

    return () => {
      game.events.off('battleStart')
      game.events.off('starterPicked')
      game.events.off('shopOpen')
      game.destroy(true)
      gameRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Note: intentionally empty deps — game is created once; prop changes are
  // handled by updating the registry below.

  // Keep registry in sync if props change after mount
  useEffect(() => {
    const game = gameRef.current
    if (!game) return
    game.registry.set('user', user)
    game.registry.set('playerDeck', playerDeck ?? [])
    game.registry.set('gold', user?.gold ?? 0)
    game.registry.set('hp', user?.hp ?? 10)
    game.registry.set('seals', user?.seals ?? [])
  }, [user, playerDeck])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1208',
        overflow: 'hidden',
      }}
    >
      {/* Exit Game button overlay — top-left corner */}
      <button
        onClick={onExitGame}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 100,
          backgroundColor: 'rgba(26,18,8,0.85)',
          color: '#D4AF37',
          border: '1px solid #D4AF37',
          borderRadius: 4,
          padding: '4px 10px',
          fontSize: 12,
          fontFamily: 'serif',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(212,175,55,0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(26,18,8,0.85)')}
      >
        ✕ Exit Game
      </button>

      {/* Phaser canvas container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}
