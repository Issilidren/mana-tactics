// IsoEngine.js — Isometric tile rendering engine for Mana Tactics
// FFTA-style diamond grid with height support and depth sorting.
// Pattern: each scene defines a 2D map array, IsoEngine renders it as
// an isometric world with walkability, depth sorting, and camera support.

import Phaser from 'phaser';

// ── Tile type constants ──
export const TILE = {
  VOID: 0,
  STONE: 1,
  GRASS: 2,
  WATER: 3,
  WOOD: 4,
  WALL: 5,
  BOOKSHELF: 6,
  TABLE: 7,
  FOUNTAIN: 8,
  CARPET: 9,
  DOOR: 10,
};

// ── Tile visual + behavior config ──
// top/left/right = fill colors for the 3 visible isometric faces
// outline = edge color, height = pixel elevation, walkable = collision
const TILE_CONFIG = {
  [TILE.VOID]:      null,
  [TILE.STONE]:     { top: 0x9B968E, left: 0x827D75, right: 0x6E6961, outline: 0x5A5650, height: 4, walkable: true },
  [TILE.GRASS]:     { top: 0x5A8A4D, left: 0x4A7A3D, right: 0x3A6A2D, outline: 0x2A5A1D, height: 3, walkable: true },
  [TILE.WATER]:     { top: 0x4B7BB5, left: 0x3B6BA5, right: 0x2B5B95, outline: 0x1B4B85, height: 0, walkable: false },
  [TILE.WOOD]:      { top: 0xA08040, left: 0x8B6B2B, right: 0x765616, outline: 0x614100, height: 0, walkable: true },
  [TILE.WALL]:      { top: 0x7C7C8E, left: 0x5C5C6E, right: 0x4C4C5E, outline: 0x3C3C4E, height: 28, walkable: false },
  [TILE.BOOKSHELF]: { top: 0x8B6236, left: 0x6B4216, right: 0x5B3206, outline: 0x4B2200, height: 22, walkable: false },
  [TILE.TABLE]:     { top: 0xBB9250, left: 0x9B7230, right: 0x8B6220, outline: 0x7B5210, height: 10, walkable: false },
  [TILE.FOUNTAIN]:  { top: 0x8AAABB, left: 0x6A8A9B, right: 0x5A7A8B, outline: 0x4A6A7B, height: 14, walkable: false },
  [TILE.CARPET]:    { top: 0xAA3050, left: 0x8A1030, right: 0x7A0020, outline: 0x6A0010, height: 0, walkable: true },
  [TILE.DOOR]:      { top: 0xD4B050, left: 0xB49030, right: 0xA48020, outline: 0x947010, height: 4, walkable: true },
};

export { TILE_CONFIG };


export default class IsoEngine {
  /**
   * @param {Phaser.Scene} scene
   * @param {Object} config - { tileWidth, tileHeight, originX, originY }
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.tileWidth = config.tileWidth || 64;
    this.tileHeight = config.tileHeight || 32;
    this.originX = config.originX || 500;
    this.originY = config.originY || 50;
    this.mapData = null;
    this.rows = 0;
    this.cols = 0;
    this.tileConfig = config.tileOverrides
      ? Object.assign({}, TILE_CONFIG, config.tileOverrides)
      : TILE_CONFIG;
    // tileSprites: { [TILE_TYPE]: 'phaserImageKey' } — flat diamond sprite per tile type
    this.tileSprites = config.tileSprites || {};
  }

  // ── Coordinate conversion ──

  /** Convert grid (col, row) → screen (x, y) center of tile */
  gridToScreen(col, row) {
    const x = this.originX + (col - row) * (this.tileWidth / 2);
    const y = this.originY + (col + row) * (this.tileHeight / 2);
    return { x, y };
  }

  /** Convert screen (x, y) → nearest grid (col, row) */
  screenToGrid(sx, sy) {
    const dx = sx - this.originX;
    const dy = sy - this.originY;
    const col = Math.round((dx / (this.tileWidth / 2) + dy / (this.tileHeight / 2)) / 2);
    const row = Math.round((dy / (this.tileHeight / 2) - dx / (this.tileWidth / 2)) / 2);
    return { col, row };
  }

  // ── Map data ──

  /** Load a 2D array of TILE constants */
  loadMap(mapData) {
    this.mapData = mapData;
    this.rows = mapData.length;
    this.cols = mapData[0].length;
  }

  /** Get tile type at (col, row), VOID if out of bounds */
  getTile(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return TILE.VOID;
    return this.mapData[row][col];
  }

  /** Check if tile at (col, row) allows movement */
  isWalkable(col, row) {
    const cfg = this.tileConfig[this.getTile(col, row)];
    return cfg ? cfg.walkable : false;
  }

  /** Depth value for sorting — higher (col+row) = drawn on top */
  getDepth(col, row) {
    return (col + row) * 2;
  }

  // ── Map extent helpers (for camera bounds) ──

  getMapScreenBounds() {
    const c = this.cols - 1;
    const r = this.rows - 1;
    const topPt    = this.gridToScreen(0, 0);
    const rightPt  = this.gridToScreen(c, 0);
    const bottomPt = this.gridToScreen(c, r);
    const leftPt   = this.gridToScreen(0, r);

    const tw = this.tileWidth;
    const th = this.tileHeight;
    const maxH = 28; // tallest wall height

    return {
      left:   leftPt.x - tw / 2 - 16,
      right:  rightPt.x + tw / 2 + 16,
      top:    topPt.y - th / 2 - maxH - 16,
      bottom: bottomPt.y + th / 2 + 16,
    };
  }

  // ── Rendering ──

  /**
   * Render the full map.
   * - Flat tiles drawn on a single shared Graphics (depth -1)
   * - Elevated tiles each get their own Graphics for depth sorting
   */
  renderMap() {
    const tw = this.tileWidth;
    const th = this.tileHeight;

    // Polygon fallback layer for tiles without individual sprite art
    const groundGfx = this.scene.add.graphics();
    groundGfx.setDepth(-1);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tileType = this.mapData[row][col];
        const cfg = this.tileConfig[tileType];
        if (!cfg) continue;

        const pos = this.gridToScreen(col, row);

        // Sprite path — string = flat floor, { key, tall } = bottom-anchored prop/wall
        if (this.tileSprites[tileType]) {
          const entry = this.tileSprites[tileType];
          const key   = typeof entry === 'string' ? entry : entry.key;
          const tall  = typeof entry === 'object'  && entry.tall;
          if (tall) {
            const frame = this.scene.textures.getFrame(key);
            const sprH  = frame ? (frame.realHeight / frame.realWidth) * tw : tw * 3;
            this.scene.add.image(pos.x, pos.y + th / 2, key)
              .setOrigin(0.5, 1)
              .setDisplaySize(tw, sprH)
              .setDepth(this.getDepth(col, row));
          } else {
            // Fill the diamond with solid color first so transparent sprite corners
            // don't expose the canvas background.
            this._drawDiamond(groundGfx, pos.x, pos.y, tw, th, cfg.top, cfg.outline);
            this.scene.add.image(pos.x, pos.y, key)
              .setDisplaySize(tw, th)
              .setDepth(-1);
          }
          continue;
        }

        // Polygon fallback
        let topColor = cfg.top;
        if (tileType === TILE.STONE && (col + row) % 2 === 1) {
          topColor = this._shadeColor(cfg.top, -8);
        }

        if (cfg.height === 0) {
          this._drawDiamond(groundGfx, pos.x, pos.y, tw, th, topColor, cfg.outline);
        } else {
          const d = this.getDepth(col, row);
          const g = this.scene.add.graphics();
          g.setDepth(d);
          this._drawElevatedTile(g, pos.x, pos.y, tw, th, cfg);
        }
      }
    }
  }

  // ── Drawing primitives ──

  /** Draw a flat isometric diamond */
  _drawDiamond(gfx, cx, cy, w, h, fillColor, outlineColor) {
    gfx.fillStyle(fillColor);
    gfx.beginPath();
    gfx.moveTo(cx, cy - h / 2);
    gfx.lineTo(cx + w / 2, cy);
    gfx.lineTo(cx, cy + h / 2);
    gfx.lineTo(cx - w / 2, cy);
    gfx.closePath();
    gfx.fillPath();

    gfx.lineStyle(1, outlineColor, 0.5);
    gfx.beginPath();
    gfx.moveTo(cx, cy - h / 2);
    gfx.lineTo(cx + w / 2, cy);
    gfx.lineTo(cx, cy + h / 2);
    gfx.lineTo(cx - w / 2, cy);
    gfx.closePath();
    gfx.strokePath();
  }

  /** Draw an elevated isometric block (top face + left/right side faces) */
  _drawElevatedTile(gfx, cx, cy, tw, th, cfg) {
    const h = cfg.height;

    // Left face (south-west)
    gfx.fillStyle(cfg.left);
    gfx.beginPath();
    gfx.moveTo(cx - tw / 2, cy - h);
    gfx.lineTo(cx, cy + th / 2 - h);
    gfx.lineTo(cx, cy + th / 2);
    gfx.lineTo(cx - tw / 2, cy);
    gfx.closePath();
    gfx.fillPath();

    // Right face (south-east)
    gfx.fillStyle(cfg.right);
    gfx.beginPath();
    gfx.moveTo(cx + tw / 2, cy - h);
    gfx.lineTo(cx, cy + th / 2 - h);
    gfx.lineTo(cx, cy + th / 2);
    gfx.lineTo(cx + tw / 2, cy);
    gfx.closePath();
    gfx.fillPath();

    // Top face (raised diamond)
    gfx.fillStyle(cfg.top);
    gfx.beginPath();
    gfx.moveTo(cx, cy - th / 2 - h);
    gfx.lineTo(cx + tw / 2, cy - h);
    gfx.lineTo(cx, cy + th / 2 - h);
    gfx.lineTo(cx - tw / 2, cy - h);
    gfx.closePath();
    gfx.fillPath();

    // Outline top face
    gfx.lineStyle(1, cfg.outline, 0.5);
    gfx.beginPath();
    gfx.moveTo(cx, cy - th / 2 - h);
    gfx.lineTo(cx + tw / 2, cy - h);
    gfx.lineTo(cx, cy + th / 2 - h);
    gfx.lineTo(cx - tw / 2, cy - h);
    gfx.closePath();
    gfx.strokePath();

    // Vertical edge lines
    gfx.lineStyle(1, cfg.outline, 0.3);
    gfx.beginPath();
    gfx.moveTo(cx - tw / 2, cy - h);
    gfx.lineTo(cx - tw / 2, cy);
    gfx.strokePath();
    gfx.beginPath();
    gfx.moveTo(cx + tw / 2, cy - h);
    gfx.lineTo(cx + tw / 2, cy);
    gfx.strokePath();
    gfx.beginPath();
    gfx.moveTo(cx, cy + th / 2 - h);
    gfx.lineTo(cx, cy + th / 2);
    gfx.strokePath();
  }

  /** Darken/lighten a hex color by amount */
  _shadeColor(color, amount) {
    let r = (color >> 16) & 0xFF;
    let g = (color >> 8) & 0xFF;
    let b = color & 0xFF;
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return (r << 16) | (g << 8) | b;
  }
}
