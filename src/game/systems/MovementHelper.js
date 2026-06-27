// ── Shared movement utilities for FFTA-quality physics ──────────────────────
// Consistent player body sizes, NPC collision, 4-direction facing, drop shadows

import Phaser from 'phaser'
import { SoundEngine } from './SoundEngine.js'

export const PLAYER_BODY_W = 20
export const PLAYER_BODY_H = 20
export const PLAYER_DISPLAY_H = 72
export const NPC_DISPLAY_H = 64
export const NPC_BODY_W = 24
export const NPC_BODY_H = 24
export const MOVE_SPEED = 160

/**
 * Configure a player sprite with correct collision body.
 * Body is a 20×20 square centered at the character's feet.
 */
export function setupPlayerBody(player) {
  player.setScale(PLAYER_DISPLAY_H / player.height)
  player.setCollideWorldBounds(true)
  player.setDepth(10)
  // Body is in unscaled texture space — scale it to get world-size body
  const scl = player.scale
  const bw = Math.round(PLAYER_BODY_W / scl)
  const bh = Math.round(PLAYER_BODY_H / scl)
  player.body.setSize(bw, bh)
  // Center horizontally, anchor at feet
  const ox = Math.round((player.width - bw) / 2)
  const oy = player.height - bh - Math.round(4 / scl)
  player.body.setOffset(ox, oy)
}

/**
 * Configure an NPC sprite with correct collision body.
 */
export function setupNPCBody(sprite) {
  sprite.setScale(NPC_DISPLAY_H / sprite.height)
  sprite.setDepth(9)
  sprite.setImmovable(true)
  sprite.body.moves = false
  const scl = sprite.scale
  const bw = Math.round(NPC_BODY_W / scl)
  const bh = Math.round(NPC_BODY_H / scl)
  sprite.body.setSize(bw, bh)
  const ox = Math.round((sprite.width - bw) / 2)
  const oy = sprite.height - bh - Math.round(4 / scl)
  sprite.body.setOffset(ox, oy)
}

/**
 * Create a drop shadow + directional chevron beneath the player.
 * Returns an object { shadow, chevron, dir } to store on the scene.
 * Call updateDirectionIndicator() every frame.
 */
export function createDirectionIndicator(scene, player) {
  // Drop shadow ellipse beneath player
  const shadow = scene.add.ellipse(player.x, player.y + 32, 28, 10, 0x000000, 0.3)
  shadow.setDepth(player.depth - 1)

  // Small directional chevron — a tiny triangle pointing the way the player faces
  const chevron = scene.add.triangle(
    player.x, player.y + 38,
    0, 6,   // left vertex
    5, 0,   // top (point) vertex
    10, 6,  // right vertex
    0xD4AF37, 0.7
  )
  chevron.setDepth(player.depth - 1)

  return { shadow, chevron, dir: 'down' }
}

/**
 * Update the direction indicator position and rotation each frame.
 */
export function updateDirectionIndicator(indicator, player) {
  if (!indicator || !indicator.shadow) return

  const { shadow, chevron, dir } = indicator

  // Shadow follows player feet
  shadow.setPosition(player.x, player.y + 32)

  // Chevron shows facing direction
  let cx = player.x, cy = player.y + 38
  let angle = 180 // default: facing down

  switch (dir) {
    case 'up':    cy = player.y - 40; angle = 0; break
    case 'down':  cy = player.y + 38; angle = 180; break
    case 'left':  cx = player.x - 20; cy = player.y + 4; angle = 270; break
    case 'right': cx = player.x + 20; cy = player.y + 4; angle = 90; break
  }

  chevron.setPosition(cx, cy)
  chevron.setAngle(angle)
}

/**
 * Handle 4-direction movement with proper facing.
 * Uses flipX for left/right. Returns movement result with direction.
 */
export function handleMovement(player, cursors, wasd, indicator) {
  // Block movement while any text input or textarea has focus (deck builder search, etc.)
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    player.setVelocity(0, 0)
    return
  }

  const S = MOVE_SPEED
  let vx = 0, vy = 0
  if (cursors.left.isDown  || wasd.left.isDown)  vx = -S
  if (cursors.right.isDown || wasd.right.isDown) vx =  S
  if (cursors.up.isDown    || wasd.up.isDown)    vy = -S
  if (cursors.down.isDown  || wasd.down.isDown)  vy =  S
  // Diagonal normalization
  if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }
  player.setVelocity(vx, vy)

  // 4-direction facing
  let dir = indicator?.dir ?? 'down'
  if (vx < 0)      { player.setFlipX(true);  dir = 'left' }
  else if (vx > 0)  { player.setFlipX(false); dir = 'right' }
  if (vy < 0 && Math.abs(vy) >= Math.abs(vx)) dir = 'up'
  if (vy > 0 && Math.abs(vy) >= Math.abs(vx)) dir = 'down'

  // Update indicator direction
  if (indicator) indicator.dir = dir

  // Footstep sound (throttled to every ~220ms while moving)
  if (vx !== 0 || vy !== 0) {
    const now = Date.now()
    if (!handleMovement._lastStep || now - handleMovement._lastStep > 220) {
      handleMovement._lastStep = now
      SoundEngine.footstep()
    }
  }

  return { vx, vy, moving: vx !== 0 || vy !== 0, dir }
}
