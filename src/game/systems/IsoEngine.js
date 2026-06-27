// IsoEngine.js — Tile placement utilities used by HubScene and future scenes.

export const TILE = 32  // world units per grid cell

// Grid position → world center {x, y}
export function tileToWorld(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 }
}

// Place a prop sprite anchored to the bottom of a grid cell.
// targetH: scale the sprite so its height = targetH px (aspect preserved)
// Returns the Phaser Image object for tweens/animation.
export function placeProp(scene, textureKey, col, row, {
  anchorX = 0.5, anchorY = 1.0,
  depth = 2,
  targetH = null,
  offsetX = 0, offsetY = 0,
} = {}) {
  const x = col * TILE + TILE / 2 + offsetX
  const y = row * TILE + TILE      + offsetY   // bottom edge of the tile
  const spr = scene.add.image(x, y, textureKey)
    .setOrigin(anchorX, anchorY)
    .setDepth(depth)
  if (targetH && spr.height > 0) spr.setScale(targetH / spr.height)
  return spr
}

// Build invisible arcade-physics wall tiles from a MAP string array.
// Skips the portal gap at the bottom row (cols 11-13).
// Returns the Phaser StaticGroup so callers can set up colliders.
export function buildWalls(scene, mapRows) {
  const rows = mapRows.length
  const wallGroup = scene.physics.add.staticGroup()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < mapRows[r].length; c++) {
      if (mapRows[r][c] !== 'W') continue
      if (r === rows - 1 && c >= 11 && c <= 13) continue   // portal gap
      const { x, y } = tileToWorld(c, r)
      const wall = wallGroup.create(x, y, null)
      wall.body.setSize(TILE, TILE)
      wall.setVisible(false)
    }
  }
  return wallGroup
}
