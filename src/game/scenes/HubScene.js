import Phaser from 'phaser'
import IsoEngine, { TILE } from '../systems/IsoEngine.js'
import { SoundEngine } from '../systems/SoundEngine.js'

// ── Tile aliases ──────────────────────────────────────────────────────────────
const S  = TILE.STONE, G = TILE.GRASS, W  = TILE.WATER
const WL = TILE.WALL,  BK = TILE.BOOKSHELF, TB = TILE.TABLE
const FN = TILE.FOUNTAIN, DR = TILE.DOOR

// ── Hub Academy Courtyard — 20 cols × 16 rows ──────────────────────────────
// prettier-ignore
const HUB_MAP = [
  [WL,WL,WL,WL,WL,WL,WL,WL,WL,DR,DR,WL,WL,WL,WL,WL,WL,WL,WL,WL],  // 0 top wall + sanctum door
  [WL, S, S, S, S,BK, S, S, S, S, S, S, S, S,BK, S, S, S, S,WL],  // 1
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL],  // 2
  [WL, S, S,TB, S, S, S, S, S, S, S, S, S, S, S, S,TB, S, S,WL],  // 3 study tables
  [WL, S, S, S, S, S, S, S, G, G, G, G, S, S, S, S, S, S, S,WL],  // 4
  [DR, S, S, S, S, S, S, G, G, G, G, G, G, S, S, S, S, S, S,DR],  // 5 left/right doors
  [WL, S, S, S, S, S, G, G, G,FN,FN, G, G, G, S, S, S, S, S,WL],  // 6
  [WL, S, S, S, S, S, G, G,FN, W, W,FN, G, G, S, S, S, S, S,WL],  // 7 fountain
  [WL, S, S, S, S, S, G, G,FN, W, W,FN, G, G, S, S, S, S, S,WL],  // 8
  [WL, S, S, S, S, S, G, G, G,FN,FN, G, G, G, S, S, S, S, S,WL],  // 9
  [DR, S, S, S, S, S, S, G, G, G, G, G, G, S, S, S, S, S, S,DR],  // 10 left/right doors
  [WL, S, S, S, S, S, S, S, G, G, G, G, S, S, S, S, S, S, S,WL],  // 11
  [WL, S, S,TB, S, S, S, S, S, S, S, S, S, S, S, S,TB, S, S,WL],  // 12 study tables
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL],  // 13
  [WL, S, S, S, S,BK, S, S, S, S, S, S, S, S,BK, S, S, S, S,WL],  // 14
  [WL,WL,WL,WL,WL,WL,WL,WL,WL,DR,DR,WL,WL,WL,WL,WL,WL,WL,WL,WL],  // 15 bottom wall + world map door
]

const MAP_COLS = HUB_MAP[0].length   // 20
const MAP_ROWS = HUB_MAP.length      // 16

// ── NPC definitions — all 8, positions remapped for 20×16 isometric map ─────
const NPC_DEFS = [
  {
    key: 'librarian', texture: 'npc-librarian', col: 4, row: 2,
    tabColor: 0xCC44AA, name: 'Grand Librarian Mira',
    dialog: [
      'Welcome to the Mana Academy, Initiate!',
      'Five Archmages await you across the realm. Each commands a different magic.',
      'Build your deck, then step through the World Map portal at the south.',
    ],
    battle: null,
  },
  {
    key: 'white-scholar', texture: 'npc-water-student', col: 4, row: 4,
    tabColor: 0xB89A20, name: 'Scholar Lirien',
    dialog: [
      'White mages believe in order, unity, and protection.',
      'Flying creatures and healing are our greatest strengths. Care to spar?',
    ],
    battle: { npcName: 'Scholar Lirien', color: 'white', deckType: 'white', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'red-knight', texture: 'npc-fire-student', col: 15, row: 4,
    tabColor: 0xAA2200, name: 'Knight Embrus',
    dialog: [
      'Red mages strike fast and burn everything in their path.',
      'You will not withstand my assault! En garde!',
    ],
    battle: { npcName: 'Knight Embrus', color: 'red', deckType: 'red', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'practice-duelist', texture: 'npc-wind-student', col: 7, row: 11,
    tabColor: 0x1A4A90, name: 'Duelist Kael',
    dialog: [
      'Another new initiate. Fine — I\'ll spare a few minutes.',
      "I'll even let you see every card I draw. I won't need the advantage.",
      'This is me at a fraction of my strength. Remember that when we meet again.',
    ],
    battle: { npcName: 'Duelist Kael', color: 'blue', deckType: 'starter', reward: 10, tutorial: true, difficulty: 'easy' },
  },
  {
    key: 'green-ranger', texture: 'npc-earth-student', col: 4, row: 11,
    tabColor: 0x1A6818, name: 'Ranger Thornwood',
    dialog: [
      'The green wilds grow strong with massive creatures.',
      'We overwhelm opponents with size and trample! Shall we?',
    ],
    battle: { npcName: 'Ranger Thornwood', color: 'green', deckType: 'green', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'black-shade', texture: 'npc-shadow-student', col: 15, row: 11,
    tabColor: 0x501880, name: 'Shade Duskren',
    dialog: [
      '...',
      'You seek power? Black mages know only domination. Face me.',
    ],
    battle: { npcName: 'Shade Duskren', color: 'black', deckType: 'black', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'shopkeeper', texture: 'npc-merchant', col: 17, row: 3,
    tabColor: 0xC8961E, name: 'Merchant Voss',
    dialog: [
      'Welcome, initiate. I deal in rare cards — knowledge has its price.',
      'A Booster Pack costs 50 gold. Five cards drawn from the full collection.',
      'Spend wisely.',
    ],
    shop: true,
  },
  {
    key: 'caretaker', texture: 'npc-caretaker', col: 10, row: 3,
    tabColor: 0x44AA88, name: 'Caretaker Elys',
    dialog: [
      'The academy takes care of its initiates.',
      'Rest here and I will tend to your wounds. It costs 20 gold — unless you are penniless.',
    ],
    rest: true,
  },
]

export default class HubScene extends Phaser.Scene {
  constructor() {
    super('Hub')
    this.iso            = null
    this.playerSprite   = null
    this.playerGrid     = null
    this.isMoving       = false
    this.transitioning  = false
    this.cursors        = null
    this.wasd           = null
    this.eKey           = null
    this.npcs           = []
    this.dialogState    = null
    this.promptLabel    = null
    this.statsText      = null
    this.minimapGfx     = null
    this.minimapPlayerDot = null
    this._mmX = 0; this._mmY = 0; this._mmSW = 0; this._mmSH = 0
    this._sanctumHintShown = false
  }

  init() {
    this.playerGrid     = { col: 10, row: 12 }
    this.isMoving       = false
    this.transitioning  = false
    this.dialogState    = null
    this._sanctumHintShown = false
    this.npcs           = []
  }

  create() {
    const sw = this.scale.width, sh = this.scale.height
    const tw = 64, th = 32

    // Auto-center the isometric map on screen
    const originX = sw / 2 - ((MAP_COLS - 1) - (MAP_ROWS - 1)) * (tw / 4)
    const originY = sh / 2 - ((MAP_COLS - 1) + (MAP_ROWS - 1)) * (th / 4) + 20

    this.iso = new IsoEngine(this, { tileWidth: tw, tileHeight: th, originX, originY })
    this.iso.loadMap(HUB_MAP)

    // Pre-rendered isometric background — scripts/gen_hub_bg.py draws this from
    // the same HUB_MAP + grid math as IsoEngine, so characters walk in the right
    // spots without any tile-sprite extraction. Centered at world (400,306) to
    // cover the full IsoEngine camera bounds (-192,-12)→(992,624).
    this.add.image(400, 306, 'hub-bg').setDepth(-2)

    this._addFountainGlow(originX, originY, tw, th)
    this._addPortalLabels(sw, sh)

    this.createPlayer()
    this.createNPCs()
    this.setupCamera()
    this.setupInput()
    this.createUI()
    this.startNPCBehaviors()
  }

  // ── Fountain glow overlay ──────────────────────────────────────────────────

  _addFountainGlow(originX, originY, tw, th) {
    // Fountain center at grid (9,7) / (10,7) / (9,8) / (10,8) — pick midpoint
    const cx = originX + (9.5 - 7.5) * (tw / 2)
    const cy = originY + (9.5 + 7.5) * (th / 2)

    const glow = this.add.graphics().setDepth(50).setAlpha(0.22)
    glow.fillStyle(0x40C0D0, 0.2)
    glow.fillCircle(cx, cy, 40)
    this.tweens.add({
      targets: glow, alpha: { from: 0.12, to: 0.38 },
      scaleX: { from: 0.85, to: 1.2 }, scaleY: { from: 0.85, to: 1.2 },
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const sx = cx + Math.cos(angle) * 18
      const sy = cy + Math.sin(angle) * 10
      const spark = this.add.text(sx, sy, '✦', { fontSize: '7px', color: '#80E0F0' })
        .setOrigin(0.5).setDepth(51).setAlpha(0)
      this.tweens.add({
        targets: spark, alpha: { from: 0, to: 0.7 }, y: sy - 12,
        duration: 1800 + i * 300, yoyo: true, repeat: -1, delay: i * 380,
      })
    }
  }

  // ── Portal / destination labels (world space) ──────────────────────────────

  _addPortalLabels() {
    const labelPortals = [
      { col: 9, row: 15, label: 'WORLD MAP' },
      { col: 9, row: 0,  label: 'SANCTUM ✦' },
      { col: 0, row: 5,  label: 'ARCHIVES' },
    ]
    for (const { col, row, label } of labelPortals) {
      const pos = this.iso.gridToScreen(col, row)
      this.add.text(pos.x, pos.y - 20, label, {
        fontSize: '9px', color: '#D4AF37', fontFamily: 'Courier New, monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(200)
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  createPlayer() {
    const pos = this.iso.gridToScreen(this.playerGrid.col, this.playerGrid.row)
    this.playerSprite = this.add.sprite(pos.x, pos.y, 'player').setOrigin(0.5, 1)
    const psrc = this.textures.get('player').getSourceImage()
    if (psrc && psrc.height > 0) this.playerSprite.setDisplaySize(psrc.width * 64 / psrc.height, 64)
    this.playerSprite.setDepth(this.iso.getDepth(this.playerGrid.col, this.playerGrid.row) + 1)
  }

  // ── NPCs ───────────────────────────────────────────────────────────────────

  createNPCs() {
    this.npcs = []
    for (const def of NPC_DEFS) {
      const pos = this.iso.gridToScreen(def.col, def.row)
      const sprite = this.add.sprite(pos.x, pos.y, def.texture).setOrigin(0.5, 1)
      const src = this.textures.get(def.texture).getSourceImage()
      if (src && src.height > 0) sprite.setDisplaySize(src.width * 64 / src.height, 64)
      sprite.setDepth(this.iso.getDepth(def.col, def.row) + 1)
      this.npcs.push({ def, sprite })
    }
  }

  startNPCBehaviors() {
    for (const npc of this.npcs) {
      if (npc.def.key === 'white-scholar') {
        this.tweens.add({
          targets: npc.sprite, y: npc.sprite.y - 4,
          duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      } else if (npc.def.key === 'practice-duelist') {
        this.tweens.add({
          targets: npc.sprite, y: npc.sprite.y + 4,
          duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      } else if (npc.def.key === 'shopkeeper') {
        this.tweens.add({
          targets: npc.sprite, x: npc.sprite.x + 4,
          duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      } else if (npc.def.key === 'green-ranger') {
        this.tweens.add({
          targets: npc.sprite, x: npc.sprite.x + 5,
          duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      }
    }
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  setupCamera() {
    const bounds = this.iso.getMapScreenBounds()
    this.cameras.main.setBounds(
      bounds.left, bounds.top,
      bounds.right - bounds.left,
      bounds.bottom - bounds.top
    )
    this.cameras.main.startFollow(this.playerSprite, true, 0.08, 0.08)
    this.cameras.main.setBackgroundColor(0x1A1A2E)
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  setupInput() {
    this.input.keyboard.disableGlobalCapture()
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.eKey.on('down', () => this.onEPress())
    SoundEngine.stopBGM()
    SoundEngine.startBGM('hub')
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  createUI() {
    const sw = this.scale.width

    const barBg = this.add.graphics().setScrollFactor(0).setDepth(20)
    barBg.fillStyle(0x0A111E)
    barBg.fillRect(0, 0, sw, 32)
    barBg.lineStyle(1, 0x503810, 1)
    barBg.lineBetween(0, 31, sw, 31)
    barBg.lineStyle(1, 0xD4AF37, 1)
    barBg.lineBetween(0, 32, sw, 32)

    const tokenBg = this.add.graphics().setScrollFactor(0).setDepth(21)
    tokenBg.fillStyle(0x0A111E)
    tokenBg.fillRect(4, 4, 210, 24)
    tokenBg.lineStyle(1, 0xD4AF37, 0.7)
    tokenBg.strokeRect(4, 4, 210, 24)

    this.statsText = this.add.text(10, 8, '', {
      fontSize: '11px', color: '#F0EED8', fontFamily: 'Courier New, monospace',
    }).setScrollFactor(0).setDepth(22)
    this.updateStats()

    this.promptLabel = this.add.text(0, 0, '[E] Talk', {
      fontSize: '10px', color: '#101010', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#F0EED8', padding: { x: 5, y: 2 },
    }).setDepth(300).setVisible(false)

    this._drawCompassRose()
    this.drawMinimap()
  }

  _drawCompassRose() {
    const sh = this.scale.height
    const CR = this.add.graphics().setScrollFactor(0).setDepth(28)
    const crx = 24, cry = sh - 24, R = 18
    CR.fillStyle(0x060C18, 0.9)
    CR.fillCircle(crx, cry, R + 4)
    CR.lineStyle(1, 0xD4AF37, 0.9)
    CR.strokeCircle(crx, cry, R + 4)
    for (const [angle, isNorth] of [[0, false], [90, true], [180, false], [270, false]]) {
      const rad = (angle - 90) * Math.PI / 180
      const ex = crx + Math.round(R * Math.cos(rad))
      const ey = cry + Math.round(R * Math.sin(rad))
      const lx = crx + Math.round(5 * Math.cos(rad + Math.PI / 2))
      const ly = cry + Math.round(5 * Math.sin(rad + Math.PI / 2))
      const rx2 = crx + Math.round(5 * Math.cos(rad - Math.PI / 2))
      const ry2 = cry + Math.round(5 * Math.sin(rad - Math.PI / 2))
      CR.fillStyle(isNorth ? 0xD4AF37 : 0x5A6070)
      CR.fillTriangle(lx, ly, rx2, ry2, ex, ey)
    }
    CR.fillStyle(0xD4AF37)
    CR.fillCircle(crx, cry, 3)
    this.add.text(crx, cry - R - 6, 'N', {
      fontSize: '8px', color: '#D4AF37', fontFamily: 'Courier New, monospace',
    }).setScrollFactor(0).setDepth(29).setOrigin(0.5, 1)
  }

  updateStats() {
    const gold  = this.registry.get('gold')  ?? 0
    const seals = this.registry.get('seals') ?? []
    const hp    = this.registry.get('hp')    ?? 10
    const hpFull  = Math.min(hp, 5)
    const hearts  = '❤'.repeat(hpFull) + '♡'.repeat(Math.max(0, 5 - hpFull))
    const sealStr = '★'.repeat(seals.length) + '☆'.repeat(5 - seals.length)
    this.statsText?.setText(`${hearts}  ◆ ${gold}  ${sealStr}  ◉◉◉`)
  }

  drawMinimap() {
    const sw = this.scale.width
    const MM_W = 90, MM_H = 90
    const MM_X = sw - MM_W - 4, MM_Y = 2
    const SW = Math.floor(MM_W / MAP_COLS), SH = Math.floor(MM_H / MAP_ROWS)
    const g = this.add.graphics().setScrollFactor(0).setDepth(28)
    g.fillStyle(0x060C18, 0.92)
    g.fillRect(MM_X - 2, MM_Y, MM_W + 4, MM_H + 4)
    g.lineStyle(1, 0xD4AF37, 0.9)
    g.strokeRect(MM_X - 2, MM_Y, MM_W + 4, MM_H + 4)
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const t = HUB_MAP[r]?.[c] ?? TILE.VOID
        const color = t === TILE.WALL ? 0x5A4830
          : t === TILE.WATER ? 0x2B5B95
          : t === TILE.GRASS || t === TILE.FOUNTAIN ? 0x4A7A3D
          : t === TILE.DOOR ? 0xD4AF37
          : 0xC4A265
        g.fillStyle(color, t === TILE.WALL ? 1 : 0.75)
        g.fillRect(MM_X + c * SW, MM_Y + 2 + r * SH, SW, SH)
      }
    }
    for (const npc of this.npcs) {
      g.fillStyle(npc.def.tabColor)
      g.fillRect(MM_X + npc.def.col * SW, MM_Y + 2 + npc.def.row * SH,
        Math.max(2, SW - 1), Math.max(2, SH - 1))
    }
    this.add.text(MM_X + MM_W / 2, MM_Y - 12, 'MAP', {
      fontSize: '9px', color: '#D4AF37', fontFamily: 'Courier New, monospace',
    }).setScrollFactor(0).setDepth(28).setOrigin(0.5, 0)
    this.minimapGfx = g
    this.minimapPlayerDot = this.add.graphics().setScrollFactor(0).setDepth(29)
    this._mmX = MM_X; this._mmY = MM_Y; this._mmSW = SW; this._mmSH = SH
  }

  updateMinimap() {
    if (!this.minimapPlayerDot) return
    const px = this._mmX + this.playerGrid.col * this._mmSW
    const py = this._mmY + 2 + this.playerGrid.row * this._mmSH
    this.minimapPlayerDot.clear()
    this.minimapPlayerDot.fillStyle(0xFFD700)
    this.minimapPlayerDot.fillRect(px, py, this._mmSW + 1, this._mmSH + 1)
  }

  // ── Dialog ─────────────────────────────────────────────────────────────────

  openDialog(npc) {
    if (this.dialogState) return
    const sw = this.scale.width, sh = this.scale.height
    const BOX_X = 20, BOX_Y = sh - 174
    const BOX_W = sw - 40, BOX_H = 150
    const PORT_W = 70
    const TEXT_X = BOX_X + PORT_W + 22, TEXT_W = BOX_W - PORT_W - 30

    const bg = this.add.graphics().setDepth(50).setScrollFactor(0)
    bg.fillStyle(0xFEFAF0)
    bg.fillRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(3, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(1, 0xA88860, 0.3)
    bg.strokeRoundedRect(BOX_X + 5, BOX_Y + 5, BOX_W - 10, BOX_H - 10, 6)
    const tabColor = npc.def.tabColor || 0x4878C8, tabW = 160
    bg.fillStyle(tabColor)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y - 22, tabW, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
    bg.lineStyle(2, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y - 22, tabW, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
    bg.fillStyle(0xE8DFC8)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)
    bg.lineStyle(1, 0x9A8060, 0.7)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)

    const portrait = this.add.sprite(BOX_X + PORT_W / 2 + 8, BOX_Y + BOX_H / 2, npc.def.texture)
      .setDepth(52).setScrollFactor(0)
    portrait.setScale(56 / portrait.width)
    const nameText = this.add.text(BOX_X + 16, BOX_Y - 14, npc.def.name, {
      fontSize: '12px', color: '#FFFFFF', fontFamily: '"Arial", sans-serif',
      fontStyle: 'bold', stroke: '#2A1808', strokeThickness: 2,
    }).setDepth(53).setScrollFactor(0)
    const bodyText = this.add.text(TEXT_X, BOX_Y + 20, '', {
      fontSize: '13px', color: '#18100A', fontFamily: '"Arial", sans-serif',
      wordWrap: { width: TEXT_W }, lineSpacing: 5,
    }).setDepth(52).setScrollFactor(0)
    const hint = this.add.text(BOX_X + TEXT_W + 10, BOX_Y + BOX_H - 12, '[E] ▼', {
      fontSize: '11px', color: '#806040', fontFamily: '"Arial", sans-serif',
    }).setOrigin(1, 1).setDepth(52).setScrollFactor(0)

    this.dialogState = { npc, pageIndex: 0, bg, nameText, bodyText, hint, portrait }
    this.showDialogPage(0)
  }

  showDialogPage(index) {
    const { npc, bodyText } = this.dialogState
    bodyText.setText(npc.def.dialog[index] || '')
  }

  advanceDialog() {
    SoundEngine.dialogTick()
    if (!this.dialogState) return
    const { npc, pageIndex } = this.dialogState
    const next = pageIndex + 1
    if (next < npc.def.dialog.length) {
      this.dialogState.pageIndex = next
      this.showDialogPage(next)
    } else {
      this.closeDialog()
      if (npc.def.battle) {
        this.time.delayedCall(100, () => this.game.events.emit('battleStart', npc.def.battle))
      } else if (npc.def.shop) {
        this.time.delayedCall(100, () => this.game.events.emit('shopOpen'))
      } else if (npc.def.rest) {
        this.time.delayedCall(100, () => this.game.events.emit('playerRest'))
      }
    }
  }

  closeDialog() {
    if (!this.dialogState) return
    const { bg, nameText, bodyText, hint, portrait } = this.dialogState
    bg.destroy(); nameText.destroy(); bodyText.destroy(); hint.destroy(); portrait.destroy()
    this.dialogState = null
  }

  // ── Input handlers ─────────────────────────────────────────────────────────

  onEPress() {
    if (this.dialogState) { this.advanceDialog(); return }
    const nearby = this.getNearbyNPC()
    if (nearby) { this.openDialog(nearby); return }
  }

  // ── Movement (grid-based) ──────────────────────────────────────────────────

  isNPCAt(col, row) {
    return this.npcs.some(n => n.def.col === col && n.def.row === row)
  }

  getNearbyNPC() {
    const { col: pc, row: pr } = this.playerGrid
    for (const npc of this.npcs) {
      const dc = Math.abs(npc.def.col - pc)
      const dr = Math.abs(npc.def.row - pr)
      if (dc <= 1 && dr <= 1 && (dc + dr) > 0) return npc
    }
    return null
  }

  movePlayer(newCol, newRow) {
    this.isMoving = true
    this.playerGrid.col = newCol
    this.playerGrid.row = newRow
    const pos = this.iso.gridToScreen(newCol, newRow)
    const newDepth = this.iso.getDepth(newCol, newRow) + 1
    this.tweens.add({
      targets: this.playerSprite,
      x: pos.x, y: pos.y,
      duration: 160, ease: 'Linear',
      onUpdate: () => this.playerSprite.setDepth(newDepth),
      onComplete: () => {
        this.isMoving = false
        this.checkPortal(newCol, newRow)
      },
    })
  }

  // ── Portal / scene transitions ─────────────────────────────────────────────

  checkPortal(col, row) {
    if (this.transitioning || this.dialogState) return
    const tileType = this.iso.getTile(col, row)
    if (tileType !== TILE.DOOR) return

    if (row === MAP_ROWS - 1)        this._doTransition('WorldMap', [16, 48, 88])
    else if (row === 0)              this._checkSanctum()
    else if (col === 0)              this._doTransition('Archives', [16, 48, 88])
  }

  _doTransition(sceneKey, fadeColor = [16, 48, 88]) {
    this.transitioning = true
    SoundEngine.sceneTransition()
    this.cameras.main.fadeOut(400, ...fadeColor)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      SoundEngine.stopBGM()
      this.scene.start(sceneKey)
    })
  }

  _checkSanctum() {
    const seals = this.registry.get('seals') ?? []
    if (seals.length >= 5) {
      this._doTransition('Sanctum', [4, 2, 8])
    } else if (!this._sanctumHintShown) {
      this._sanctumHintShown = true
      const sw = this.scale.width
      const hint = this.add.text(sw / 2, 48,
        '✦  The vault is sealed. Defeat all five Archmages first.  ✦', {
        fontSize: '10px', color: '#D4AF37', fontFamily: 'Courier New, monospace',
        backgroundColor: '#0A0420', padding: { x: 8, y: 4 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(60)
      this.time.delayedCall(3000, () => {
        if (hint?.active) hint.destroy()
        this._sanctumHintShown = false
      })
    }
  }

  // ── NPC prompt label ───────────────────────────────────────────────────────

  updateNPCPrompts() {
    const nearby = this.getNearbyNPC()
    if (nearby && !this.dialogState) {
      const label = nearby.def.battle ? '[E] Duel'
        : nearby.def.shop ? '[E] Shop'
        : nearby.def.rest ? '[E] Rest'
        : '[E] Talk'
      this.promptLabel.setText(label).setVisible(true)
        .setPosition(nearby.sprite.x - this.promptLabel.width / 2, nearby.sprite.y - 56)
    } else {
      this.promptLabel.setVisible(false)
    }
  }

  // ── Update loop ────────────────────────────────────────────────────────────

  update() {
    if (this.transitioning) return

    if (!this.isMoving && !this.dialogState) {
      const JD = Phaser.Input.Keyboard.JustDown
      let dc = 0, dr = 0

      if      (JD(this.cursors.up)    || JD(this.wasd.up))    dr = -1
      else if (JD(this.cursors.down)  || JD(this.wasd.down))  dr =  1
      else if (JD(this.cursors.left)  || JD(this.wasd.left))  dc = -1
      else if (JD(this.cursors.right) || JD(this.wasd.right)) dc =  1

      if (dc !== 0 || dr !== 0) {
        const nc = this.playerGrid.col + dc
        const nr = this.playerGrid.row + dr
        if (this.iso.isWalkable(nc, nr) && !this.isNPCAt(nc, nr)) {
          this.movePlayer(nc, nr)
        } else {
          SoundEngine.bump()
        }
      }
    }

    this.updateNPCPrompts()
    this.updateStats()
    this.updateMinimap()
  }
}
