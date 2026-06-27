import Phaser from 'phaser'
import { SoundEngine } from '../systems/SoundEngine.js'
import { tileToWorld, placeProp, buildWalls } from '../systems/IsoEngine.js'
import { setupPlayerBody, setupNPCBody, handleMovement, createDirectionIndicator, updateDirectionIndicator } from '../systems/MovementHelper.js'

const TILE = 32
const COLS = 25
const ROWS = 18

// W=wall  F=floor. Bottom wall has a 3-tile gap (cols 11-13) for the World Map door.
// prettier-ignore
const MAP = [
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 0  top wall
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 1
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 2
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 3
  'WFFFFWFFFFFFFFFFFFFWFFFFW', // 4  study tables
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 5
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 6
  'WFFFFFFFFFFWWWWFFFFFFFFFW', // 7  fountain outer
  'WFFFFFFFFFWWWWWFFFFFFFFFW', // 8  fountain basin
  'WFFFFFFFFFWWWWWFFFFFFFFFW', // 9  fountain center
  'WFFFFFFFFFWWWWWFFFFFFFFFW', // 10 fountain basin
  'WFFFFFFFFFFWWWWFFFFFFFFFW', // 11 fountain base
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 12
  'WFFFFWFFFFFFFFFFFFFWFFFFW', // 13 study tables
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 14
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 15
  'WFFFFFFFFFFFFFFFFFFFFFFFW', // 16
  'WWWWWWWWWWWFFFWWWWWWWWWWW', // 17 bottom wall — gap at cols 11-13
]

const NPC_DEFS = [
  {
    key: 'librarian', texture: 'npc-librarian', tileX: 4, tileY: 3,
    tabColor: 0xCC44AA, name: 'Grand Librarian Mira',
    dialog: [
      'Welcome to the Mana Academy, Initiate!',
      'Five Archmages await you across the realm. Each commands a different magic.',
      'Build your deck, then step through the World Map portal at the south.',
    ],
    battle: null,
  },
  {
    key: 'white-scholar', texture: 'npc-white', tileX: 5, tileY: 5,
    tabColor: 0xB89A20, name: 'Scholar Lirien',
    dialog: [
      'White mages believe in order, unity, and protection.',
      'Flying creatures and healing are our greatest strengths. Care to spar?',
    ],
    battle: { npcName: 'Scholar Lirien', color: 'white', deckType: 'white', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'red-knight', texture: 'npc-red', tileX: 19, tileY: 5,
    tabColor: 0xAA2200, name: 'Knight Embrus',
    dialog: [
      'Red mages strike fast and burn everything in their path.',
      'You will not withstand my assault! En garde!',
    ],
    battle: { npcName: 'Knight Embrus', color: 'red', deckType: 'red', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'practice-duelist', texture: 'npc-blue', tileX: 8, tileY: 9,
    tabColor: 0x1A4A90, name: 'Duelist Kael',
    dialog: [
      'Another new initiate. Fine — I\'ll spare a few minutes.',
      "I'll even let you see every card I draw. I won't need the advantage.",
      'This is me at a fraction of my strength. Remember that when we meet again.',
    ],
    battle: { npcName: 'Duelist Kael', color: 'blue', deckType: 'starter', reward: 10, tutorial: true, difficulty: 'easy' },
  },
  {
    key: 'green-ranger', texture: 'npc-green', tileX: 5, tileY: 12,
    tabColor: 0x1A6818, name: 'Ranger Thornwood',
    dialog: [
      'The green wilds grow strong with massive creatures.',
      'We overwhelm opponents with size and trample! Shall we?',
    ],
    battle: { npcName: 'Ranger Thornwood', color: 'green', deckType: 'green', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'black-shade', texture: 'npc-black', tileX: 19, tileY: 12,
    tabColor: 0x501880, name: 'Shade Duskren',
    dialog: [
      '...',
      'You seek power? Black mages know only domination. Face me.',
    ],
    battle: { npcName: 'Shade Duskren', color: 'black', deckType: 'black', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'shopkeeper', texture: 'npc-merchant', tileX: 21, tileY: 4,
    tabColor: 0xC8961E, name: 'Merchant Voss',
    dialog: [
      'Welcome, initiate. I deal in rare cards — knowledge has its price.',
      'A Booster Pack costs 50 gold. Five cards drawn from the full collection.',
      'Spend wisely.',
    ],
    shop: true,
  },
  {
    key: 'caretaker', texture: 'npc-caretaker', tileX: 10, tileY: 7,
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
    this.player        = null
    this.cursors       = null
    this.wasd          = null
    this.npcs          = []
    this.dialogState   = null
    this.promptLabel   = null
    this.eKey          = null
    this.portalBounds  = null
    this.shopBounds    = null
    this.statsText     = null
    this.transitioning = false
    this.minimapGfx    = null
    this.minimapPlayerDot = null
    this.dirIndicator  = null
    this.leftPassageBounds = null
    this.sanctumBounds = null
    this._sanctumHintShown = false
  }

  create() {
    this.transitioning = false
    this.drawMap()            // floor graphics + physics walls
    this.drawFurniture()      // counter, carpet, desks, bookshelves, plants, lanterns
    this.drawFountain()       // fountain sprite + glow
    this.drawPortalDoor()     // portal arch at south wall
    this.setupTriggerZones()
    this.createPlayer()
    this.dirIndicator = createDirectionIndicator(this, this.player)
    this.createNPCs()
    this.setupCamera()
    this.setupInput()
    this.createUI()
    this.startNPCBehaviors()
  }

  // ── Floor tiles + physics walls ────────────────────────────────────────────

  drawMap() {
    // Warm stone floor with subtle checkerboard shading
    const g = this.add.graphics().setDepth(0)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (MAP[r]?.[c] === 'W') continue
        g.fillStyle(((r + c) % 2 === 0) ? 0xBB9E72 : 0xAF9264)
        g.fillRect(c * TILE, r * TILE, TILE, TILE)
      }
    }
    // Subtle mortar lines
    g.lineStyle(1, 0x8A6840, 0.18)
    for (let c = 0; c <= COLS; c++) g.lineBetween(c * TILE, 0, c * TILE, ROWS * TILE)
    for (let r = 0; r <= ROWS; r++) g.lineBetween(0, r * TILE, COLS * TILE, r * TILE)

    this.wallGroup = buildWalls(this, MAP)
  }

  // ── Fountain — tileset sprite + animated glow ──────────────────────────────

  drawFountain() {
    // Fountain block center: col 12, row 9.  Anchor sprite to bottom of row 11.
    const cx = 12 * TILE + TILE / 2   // 400
    const baseY = 12 * TILE           // 384 — bottom of block

    const fSpr = this.add.image(cx, baseY, 'hub-fountain')
      .setOrigin(0.5, 1.0)
      .setDepth(3)
    if (fSpr.height > 0) fSpr.setScale((5 * TILE) / fSpr.height)

    // Pulsing blue-green glow behind the crystal
    const glow = this.add.graphics().setDepth(2).setAlpha(0.25)
    glow.fillStyle(0x40C0D0, 0.18)
    glow.fillCircle(cx, baseY - 80, 64)
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.15, to: 0.45 },
      scaleX: { from: 0.88, to: 1.18 },
      scaleY: { from: 0.88, to: 1.18 },
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Rising sparkles
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const sx = cx + Math.cos(angle) * 22
      const sy = baseY - 120 + Math.sin(angle) * 10
      const spark = this.add.text(sx, sy, '✦', {
        fontSize: '8px', color: '#80E0F0',
      }).setOrigin(0.5).setDepth(4).setAlpha(0)
      this.tweens.add({
        targets: spark,
        alpha: { from: 0, to: 0.7 }, y: sy - 14,
        duration: 1800 + i * 300, yoyo: true, repeat: -1, delay: i * 380,
      })
    }

    this.add.text(cx, baseY + 6, '✦ MANA ACADEMY ✦', {
      fontSize: '9px', color: '#907050', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(4)
  }

  // ── Furniture & decoration ─────────────────────────────────────────────────

  drawFurniture() {
    const g = this.add.graphics().setDepth(2)

    // ── 1. Librarian counter (cols 1-8, rows 1-2) — dark wood Graphics ────
    const cX = TILE, cY = TILE, cW = 8 * TILE, cH = 2 * TILE
    g.fillStyle(0x4A2E10)
    g.fillRect(cX, cY, cW, cH)
    const spineC = [0xCC2200, 0x2255AA, 0x228822, 0xCC8800, 0x6633AA, 0x005588, 0xCC2200, 0x228822]
    for (let bi = 0; bi < 8; bi++) {
      const bx = cX + 4 + bi * (cW / 8), bw = cW / 8 - 6
      g.fillStyle(spineC[bi % spineC.length])
      g.fillRect(bx, cY + 3, bw, cH - 10)
      g.fillStyle(0xFFFFFF, 0.15)
      g.fillRect(bx + 1, cY + 3, 2, cH - 10)
    }
    g.fillStyle(0x7A5030)
    g.fillRect(cX, cY + cH - 10, cW, 10)
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(cX, cY, cW, cH)
    g.lineStyle(1, 0xD4AF37, 0.4)
    g.lineBetween(cX, cY + cH / 2, cX + cW, cY + cH / 2)

    // ── 2. Duel marker — small rug near Duelist Kael (col 7-9, row 8-10) ──
    const dX = 7 * TILE, dY = 8 * TILE, dW = 3 * TILE, dH = 3 * TILE
    g.fillStyle(0x38882A)
    g.fillRect(dX, dY, dW, dH)
    g.lineStyle(2, 0xD4AF37, 0.7)
    g.strokeRect(dX, dY, dW, dH)

    // ── 3. Study desks — tileset sprite ──────────────────────────────────
    for (const [col, row] of [[5, 4], [19, 4], [5, 13], [19, 13]])
      placeProp(this, 'hub-desk', col, row, { targetH: 52, depth: 2 })

    // ── 4. Bookshelves — tileset sprite, one covering each 5-row block ───
    // Anchored to bottom of row 6 / row 14 so they span 5 rows upward
    placeProp(this, 'hub-bookshelf', 23,  6, { targetH: 5 * TILE, depth: 2 })
    placeProp(this, 'hub-bookshelf', 23, 14, { targetH: 5 * TILE, depth: 2 })

    // ── 5. Plants — tileset sprite ────────────────────────────────────────
    for (const [col, row] of [[1, 6], [1, 10], [8, 16], [16, 16]])
      placeProp(this, 'hub-plant', col, row, { targetH: 44, depth: 2 })

    // ── 6. Lanterns — away from bookshelves (right ones at col 20, not 22) ─
    for (const [col, row] of [[2, 2], [2, 14], [20, 2], [20, 14]])
      placeProp(this, 'hub-lantern', col, row, { targetH: 40, depth: 2 })

    // ── 7. Physics walls for all props so player can't walk through them ──
    // Desks — one tile each
    for (const [col, row] of [[5, 4], [19, 4], [5, 13], [19, 13]]) {
      const { x, y } = tileToWorld(col, row)
      const w = this.wallGroup.create(x, y, null)
      w.body.setSize(TILE, TILE)
      w.setVisible(false)
    }
    // Bookshelves — 5 tiles tall at col 23 (rows 2-6 and rows 10-14)
    for (const [col, r0, r1] of [[23, 2, 6], [23, 10, 14]]) {
      for (let row = r0; row <= r1; row++) {
        const { x, y } = tileToWorld(col, row)
        const w = this.wallGroup.create(x, y, null)
        w.body.setSize(TILE, TILE)
        w.setVisible(false)
      }
    }
    this.wallGroup.refresh()
  }

  // ── Portal door at bottom center ───────────────────────────────────────────

  drawPortalDoor() {
    const px = 12 * TILE + TILE / 2   // 400
    const py = 16 * TILE + TILE / 2   // 528
    const g  = this.add.graphics().setDepth(2)

    g.fillStyle(0x485838)
    g.fillRect(px - 58, py - 36, 14, 52)
    g.lineStyle(2, 0x101010, 1)
    g.strokeRect(px - 58, py - 36, 14, 52)
    g.fillRect(px + 44, py - 36, 14, 52)
    g.strokeRect(px + 44, py - 36, 14, 52)
    g.fillStyle(0x304828)
    g.fillRect(px - 48, py - 36, 96, 52)
    g.fillStyle(0x0A1828)
    g.fillRect(px - 40, py - 30, 80, 46)
    g.fillStyle(0x1A4080, 0.5)
    g.fillRect(px - 36, py - 26, 72, 8)
    g.fillRect(px - 36, py - 12, 72, 8)
    g.fillRect(px - 36, py + 2,  72, 8)
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(px - 48, py - 36, 96, 52)
    g.fillStyle(0x304828)
    g.fillRect(px - 48, py - 54, 96, 24)
    g.fillStyle(0x0A1828)
    g.fillRect(px - 40, py - 50, 80, 20)
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(px - 48, py - 54, 96, 24)
  }

  // ── Trigger zones (portal, archives, shop, sanctum) ────────────────────────

  setupTriggerZones() {
    const px = 12 * TILE + TILE / 2
    const py = 16 * TILE + TILE / 2
    this.portalBounds = new Phaser.Geom.Rectangle(px - 40, py - 10, 80, 30)
    this.add.text(px, py + 24, 'WORLD MAP', {
      fontSize: '10px', color: '#D4AF37', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(3)

    this.leftPassageBounds = new Phaser.Geom.Rectangle(0, 8 * TILE, TILE, 3 * TILE)
    this.shopBounds = new Phaser.Geom.Rectangle(600, 185, 112, 45)

    this.sanctumBounds = new Phaser.Geom.Rectangle(344, 0, 96, 56)
    this.add.text(400, 4, '✦', {
      fontSize: '10px', color: '#D4AF3744', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(3)
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  createPlayer() {
    const startX = Math.floor(COLS / 2) * TILE + TILE / 2  // col 12, x=400
    const startY = 14 * TILE + TILE / 2                     // row 14 — clear floor below fountain
    this.player = this.physics.add.sprite(startX, startY, 'player')
    setupPlayerBody(this.player)
    this._bumpCooldown = 0
    this.physics.add.collider(this.player, this.wallGroup, () => SoundEngine.bump())
  }

  // ── NPCs ───────────────────────────────────────────────────────────────────

  createNPCs() {
    this.npcs = []
    this.npcGroup = this.physics.add.group()
    for (const def of NPC_DEFS) {
      const x = def.tileX * TILE + TILE / 2
      const y = def.tileY * TILE + TILE / 2
      const sprite = this.physics.add.sprite(x, y, def.texture)
      setupNPCBody(sprite)
      this.physics.add.collider(this.player, sprite)
      this.npcs.push({ def, sprite })
    }
  }

  startNPCBehaviors() {
    const maxY = 16 * TILE
    for (const npc of this.npcs) {
      if (npc.def.key === 'white-scholar') {
        this.tweens.add({
          targets: npc.sprite,
          y: Math.min(npc.def.tileY * TILE + TILE / 2 + 3 * TILE, maxY),
          duration: 3500, ease: 'Linear', yoyo: true, repeat: -1, hold: 1500,
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
          targets: npc.sprite, x: npc.sprite.x + 6,
          duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      }
    }
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  setupCamera() {
    const mapW = COLS * TILE, mapH = ROWS * TILE
    this.physics.world.setBounds(0, 0, mapW, mapH)
    this.cameras.main.setBounds(0, 0, mapW, mapH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor(0x6A4A28)
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
    const barBg = this.add.graphics().setScrollFactor(0).setDepth(20)
    barBg.fillStyle(0x0A111E)
    barBg.fillRect(0, 0, COLS * TILE, 32)
    barBg.lineStyle(1, 0x503810, 1)
    barBg.lineBetween(0, 31, COLS * TILE, 31)
    barBg.lineStyle(1, 0xD4AF37, 1)
    barBg.lineBetween(0, 32, COLS * TILE, 32)

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
    }).setDepth(30).setVisible(false)

    this._drawCompassRose()
    this.drawMinimap()
  }

  _drawCompassRose() {
    const CR = this.add.graphics().setScrollFactor(0).setDepth(28)
    const crx = 24, cry = 552, R = 18
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
      const rx = crx + Math.round(5 * Math.cos(rad - Math.PI / 2))
      const ry = cry + Math.round(5 * Math.sin(rad - Math.PI / 2))
      CR.fillStyle(isNorth ? 0xD4AF37 : 0x5A6070)
      CR.fillTriangle(lx, ly, rx, ry, ex, ey)
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
    const MM_W = 90, MM_H = 90
    const MM_X = COLS * TILE - MM_W - 4, MM_Y = 2
    const SW = Math.floor(MM_W / COLS), SH = Math.floor(MM_H / ROWS)
    const g = this.add.graphics().setScrollFactor(0).setDepth(28)
    g.fillStyle(0x060C18, 0.92)
    g.fillRect(MM_X - 2, MM_Y, MM_W + 4, MM_H + 4)
    g.lineStyle(1, 0xD4AF37, 0.9)
    g.strokeRect(MM_X - 2, MM_Y, MM_W + 4, MM_H + 4)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r]?.[c] ?? 'W'
        g.fillStyle(ch === 'W' ? 0x5A4830 : 0xC4A265, ch === 'W' ? 1 : 0.75)
        g.fillRect(MM_X + c * SW, MM_Y + 2 + r * SH, SW, SH)
      }
    }
    g.fillStyle(0x37D3C4)
    g.fillRect(MM_X + 12 * SW - 1, MM_Y + 2 + 17 * SH, SW + 2, SH)
    for (const npc of this.npcs) {
      g.fillStyle(npc.def.tabColor)
      g.fillRect(MM_X + npc.def.tileX * SW, MM_Y + 2 + npc.def.tileY * SH,
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
    if (!this.minimapPlayerDot || !this.player || !this._mmX) return
    const px = this._mmX + Math.floor(this.player.x / TILE) * this._mmSW
    const py = this._mmY + 2 + Math.floor(this.player.y / TILE) * this._mmSH
    this.minimapPlayerDot.clear()
    this.minimapPlayerDot.fillStyle(0xFFD700)
    this.minimapPlayerDot.fillRect(px, py, this._mmSW + 1, this._mmSH + 1)
  }

  // ── Dialog ─────────────────────────────────────────────────────────────────

  openDialog(npc) {
    if (this.dialogState) return
    const camX = this.cameras.main.scrollX, camY = this.cameras.main.scrollY
    const BOX_X = camX + 20, BOX_Y = camY + 414
    const BOX_W = COLS * TILE - 40, BOX_H = 150
    const PORT_W = 70
    const TEXT_X = BOX_X + PORT_W + 22, TEXT_W = BOX_W - PORT_W - 30
    const bg = this.add.graphics().setDepth(50)
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
    const portrait = this.add.sprite(BOX_X + PORT_W / 2 + 8, BOX_Y + BOX_H / 2, npc.def.texture).setDepth(52)
    portrait.setScale(56 / portrait.width)
    const nameText = this.add.text(BOX_X + 16, BOX_Y - 14, npc.def.name, {
      fontSize: '12px', color: '#FFFFFF', fontFamily: '"Arial", sans-serif',
      fontStyle: 'bold', stroke: '#2A1808', strokeThickness: 2,
    }).setDepth(53)
    const bodyText = this.add.text(TEXT_X, BOX_Y + 20, '', {
      fontSize: '13px', color: '#18100A', fontFamily: '"Arial", sans-serif',
      wordWrap: { width: TEXT_W }, lineSpacing: 5,
    }).setDepth(52)
    const hint = this.add.text(BOX_X + TEXT_W + 10, BOX_Y + BOX_H - 12, '[E] ▼', {
      fontSize: '11px', color: '#806040', fontFamily: '"Arial", sans-serif',
    }).setOrigin(1, 1).setDepth(52)
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

  // ── Input ──────────────────────────────────────────────────────────────────

  onEPress() {
    if (this.dialogState) { this.advanceDialog(); return }
    const nearby = this.getNearbyNPC()
    if (nearby) { this.openDialog(nearby); return }
    if (this.isNearShop()) this.game.events.emit('shopOpen')
  }

  isNearShop() {
    return this.shopBounds?.contains(this.player.x, this.player.y) ?? false
  }

  getNearbyNPC() {
    const { x: px, y: py } = this.player
    for (const npc of this.npcs) {
      const dx = npc.sprite.x - px, dy = npc.sprite.y - py
      if (dx * dx + dy * dy < 52 * 52) return npc
    }
    return null
  }

  // ── Update loop ────────────────────────────────────────────────────────────

  update() {
    if (!this.player) return
    this.handleMovement()
    this.updateNPCPrompts()
    this.checkPortalOverlap()
    this.checkPassages()
    this.checkSanctumEntrance()
    this.updateStats()
    this.updateMinimap()
    updateDirectionIndicator(this.dirIndicator, this.player)
  }

  handleMovement() {
    if (this.dialogState || this.transitioning) {
      this.player.setVelocity(0, 0); return
    }
    handleMovement(this.player, this.cursors, this.wasd, this.dirIndicator)
  }

  updateNPCPrompts() {
    const nearby = this.getNearbyNPC()
    if (nearby && !this.dialogState) {
      const label = nearby.def.battle ? '[E] Duel' : nearby.def.shop ? '[E] Shop' : nearby.def.rest ? '[E] Rest' : '[E] Talk'
      this.promptLabel.setText(label).setVisible(true)
        .setPosition(nearby.sprite.x - this.promptLabel.width / 2, nearby.sprite.y - 36)
    } else if (this.isNearShop() && !this.dialogState) {
      this.promptLabel.setText('[E] Shop').setVisible(true)
        .setPosition(648 - this.promptLabel.width / 2, 172)
    } else if (this.leftPassageBounds?.contains(this.player.x, this.player.y) && !this.dialogState) {
      this.promptLabel.setText('[← Archives]').setVisible(true)
        .setPosition(48, 302 - this.promptLabel.height / 2)
    } else {
      this.promptLabel.setVisible(false)
    }
  }

  checkPassages() {
    if (this.dialogState || this.transitioning) return
    if (this.leftPassageBounds?.contains(this.player.x, this.player.y)) {
      this.transitioning = true
      this.player.setVelocity(0, 0)
      SoundEngine.sceneTransition()
      this.cameras.main.fadeOut(400, 16, 48, 88)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundEngine.stopBGM(); this.scene.start('Archives')
      })
    }
  }

  checkSanctumEntrance() {
    if (this.dialogState || this.transitioning) return
    if (!this.sanctumBounds?.contains(this.player.x, this.player.y)) return
    const seals = this.registry.get('seals') ?? []
    if (seals.length >= 5) {
      this.transitioning = true
      this.player.setVelocity(0, 0)
      SoundEngine.sceneTransition()
      this.cameras.main.fadeOut(500, 4, 2, 8)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundEngine.stopBGM(); this.scene.start('Sanctum')
      })
    } else if (!this._sanctumHintShown) {
      this._sanctumHintShown = true
      const hint = this.add.text(400, 48,
        '✦  The vault is sealed. Defeat all five Archmages first.  ✦', {
        fontSize: '10px', color: '#D4AF37', fontFamily: 'Courier New, monospace',
        backgroundColor: '#0A0420', padding: { x: 8, y: 4 },
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(60)
      this.time.delayedCall(3000, () => { if (hint?.active) hint.destroy(); this._sanctumHintShown = false })
    }
  }

  checkPortalOverlap() {
    if (this.dialogState || this.transitioning) return
    if (this.portalBounds?.contains(this.player.x, this.player.y)) {
      this.transitioning = true
      this.player.setVelocity(0, 0)
      SoundEngine.sceneTransition()
      this.cameras.main.fadeOut(500, 16, 48, 88)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundEngine.stopBGM(); this.scene.start('WorldMap')
      })
    }
  }
}
