import Phaser from 'phaser'
import { SoundEngine } from '../systems/SoundEngine.js'

const TILE = 32
const COLS = 25
const ROWS = 18

// W=wall, F=floor. Bottom wall has a 3-tile gap (cols 11-13) for the World Map door.
// prettier-ignore
const MAP = [
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 0  top wall
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 1
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 2
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 3
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 4
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 5
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 6
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 7
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 8
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 9
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 10
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 11
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 12
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 13
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 14
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 15
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 16
  'WWWWWWWWWWWFFFWWWWWWWWWWW', // 17 bottom wall — gap at cols 11-13
]

const NPC_DEFS = [
  {
    key: 'librarian',
    texture: 'npc-librarian',
    tileX: 4, tileY: 3,
    tabColor: 0xCC44AA,
    name: 'Grand Librarian Mira',
    dialog: [
      'Welcome to the Mana Academy, Initiate!',
      'Five Archmages await you across the realm. Each commands a different magic.',
      'Build your deck, then step through the World Map portal at the south.',
    ],
    battle: null,
  },
  {
    key: 'white-scholar',
    texture: 'npc-white',
    tileX: 5, tileY: 5,
    tabColor: 0xB89A20,
    name: 'Scholar Lirien',
    dialog: [
      'White mages believe in order, unity, and protection.',
      'Flying creatures and healing are our greatest strengths. Care to spar?',
    ],
    battle: { npcName: 'Scholar Lirien', color: 'white', deckType: 'white', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'red-knight',
    texture: 'npc-red',
    tileX: 19, tileY: 5,
    tabColor: 0xAA2200,
    name: 'Knight Embrus',
    dialog: [
      'Red mages strike fast and burn everything in their path.',
      'You will not withstand my assault! En garde!',
    ],
    battle: { npcName: 'Knight Embrus', color: 'red', deckType: 'red', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'practice-duelist',
    texture: 'npc-blue',
    tileX: 12, tileY: 9,
    tabColor: 0x1A4A90,
    name: 'Duelist Kael',
    dialog: [
      'Another new initiate. Fine — I\'ll spare a few minutes.',
      "I'll even let you see every card I draw. I won't need the advantage.",
      'This is me at a fraction of my strength. Remember that when we meet again.',
    ],
    battle: { npcName: 'Duelist Kael', color: 'blue', deckType: 'starter', reward: 10, tutorial: true, difficulty: 'easy' },
  },
  {
    key: 'green-ranger',
    texture: 'npc-green',
    tileX: 5, tileY: 12,
    tabColor: 0x1A6818,
    name: 'Ranger Thornwood',
    dialog: [
      'The green wilds grow strong with massive creatures.',
      'We overwhelm opponents with size and trample! Shall we?',
    ],
    battle: { npcName: 'Ranger Thornwood', color: 'green', deckType: 'green', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'black-shade',
    texture: 'npc-black',
    tileX: 19, tileY: 12,
    tabColor: 0x501880,
    name: 'Shade Duskren',
    dialog: [
      '...',
      'You seek power? Black mages know only domination. Face me.',
    ],
    battle: { npcName: 'Shade Duskren', color: 'black', deckType: 'black', reward: 30, difficulty: 'easy' },
  },
  {
    key: 'shopkeeper',
    texture: 'npc-merchant',
    tileX: 21, tileY: 4,
    tabColor: 0xC8961E,
    name: 'Merchant Voss',
    dialog: [
      'Welcome, initiate. I deal in rare cards — knowledge has its price.',
      'A Booster Pack costs 50 gold. Five cards drawn from the full collection.',
      'Spend wisely.',
    ],
    shop: true,
  },
  {
    key: 'caretaker',
    texture: 'npc-caretaker',
    tileX: 10, tileY: 7,
    tabColor: 0x44AA88,
    name: 'Caretaker Elys',
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
    this.player = null
    this.cursors = null
    this.wasd = null
    this.npcs = []
    this.dialogState = null
    this.promptLabel = null
    this.eKey = null
    this.portalBounds = null
    this.shopBounds = null
    this.statsText = null
    this.transitioning = false   // CRITICAL: prevents portal from firing every frame
    this.minimapGfx = null
    this.minimapPlayerDot = null
    this.leftPassageBounds = null
  }

  create() {
    this.transitioning = false
    const walkable = this.buildWalkableMap()
    this.drawMap(walkable)           // renders FFTA tiles + wall physics bodies
    this.drawFurniture()             // tables, bookshelves, carpet, plants + fountain
    this.drawPortalDoor()            // south exit to World Map
    this.createPlayer()
    this.createNPCs()
    this.setupCamera()
    this.setupInput()
    this.createUI()
    this.startNPCBehaviors()
  }

  // ── Walkable grid ──────────────────────────────────────────────────────────

  buildWalkableMap() {
    const grid = []
    for (let r = 0; r < ROWS; r++) {
      grid[r] = []
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r]?.[c] ?? 'W'
        grid[r][c] = ch !== 'W'
      }
    }
    return grid
  }

  // ── Floor and wall tiles ───────────────────────────────────────────────────

  drawMap(walkable) {
    this.wallGroup = this.physics.add.staticGroup()

    // Tile-by-tile rendering using FFTA tile images (64x64 displayed at 32x32)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE + TILE / 2
        const y = r * TILE + TILE / 2
        const isWall = !walkable[r][c]

        if (isWall) {
          const tileKey = r === 0 ? 'tile-banner-wall' : 'tile-wall-top'
          this.add.image(x, y, tileKey).setDisplaySize(TILE, TILE).setDepth(0)
          const wall = this.wallGroup.create(x, y, 'tile-wall')
          wall.setAlpha(0)
          wall.setOrigin(0.5, 0.5)
          wall.body.setSize(TILE, TILE)
          wall.refreshBody()
        } else {
          let tileKey = 'tile-warm-stone'
          if (c === 12 && (r === 8 || r === 9)) tileKey = 'tile-magic-circle'
          else if (c >= 9 && c <= 15 && r >= 6 && r <= 11) tileKey = 'tile-crimson-carpet'
          else if (c <= 2 || c >= 22) tileKey = 'tile-rune-stone'
          else if (r <= 2) tileKey = 'tile-wood-plank'
          else if (r >= 15 && c >= 10 && c <= 14) tileKey = 'tile-gold-star'
          this.add.image(x, y, tileKey).setDisplaySize(TILE, TILE).setDepth(0)
        }
      }
    }

    // Portal trigger zone — col 12 center=400, row 16 center=528
    this.portalBounds = new Phaser.Geom.Rectangle(360, 518, 80, 30)
    // Card shop interaction zone — cols 19-22, rows 5-6 front edge
    this.shopBounds = new Phaser.Geom.Rectangle(600, 185, 112, 45)
    // Left passage to Archives (rows 8-10, left wall)
    this.leftPassageBounds = new Phaser.Geom.Rectangle(0, 262, 50, 80)
  }

  // ── Fountain (FFTA-style centrepiece) ─────────────────────────────────────

  drawFountain() {
    const cx = 12 * TILE + TILE / 2   // column 12 centre — 400
    const cy = 7 * TILE + TILE / 2    // row 7 centre — 240
    const g = this.add.graphics().setDepth(2)

    // Drop shadow
    g.fillStyle(0x000000, 0.18)
    g.fillEllipse(cx + 4, cy + 4, 60, 18)
    // Outer stone basin rim
    g.fillStyle(0xC4B890)
    g.fillCircle(cx, cy, 28)
    g.lineStyle(2, 0x98845A, 1)
    g.strokeCircle(cx, cy, 28)
    // Rim highlight (top-left light)
    g.fillStyle(0xE0D0A8, 0.65)
    g.fillCircle(cx - 9, cy - 9, 10)
    // Gold dot ornaments around rim
    g.fillStyle(0xD4AF37, 0.75)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      g.fillCircle(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, 2)
    }
    // Water — bright blue
    g.fillStyle(0x58A4D0)
    g.fillCircle(cx, cy, 19)
    // Water shimmer
    g.fillStyle(0x88C8F0, 0.7)
    g.fillCircle(cx - 5, cy - 5, 8)
    // Water ripples
    g.lineStyle(1, 0x2878A8, 0.45)
    g.strokeCircle(cx, cy, 13)
    g.strokeCircle(cx, cy, 7)
    // Central stone pillar
    g.fillStyle(0xCCBA90)
    g.fillRect(cx - 4, cy - 26, 8, 24)
    g.fillStyle(0xE0CCA8, 0.65)
    g.fillRect(cx - 4, cy - 26, 2, 24)
    // Pillar top cap
    g.fillStyle(0xB8A470)
    g.fillRect(cx - 7, cy - 28, 14, 4)
    g.lineStyle(1, 0x98845A, 0.8)
    g.strokeRect(cx - 7, cy - 28, 14, 4)
    // Pillar base flare
    g.fillStyle(0xB8A470)
    g.fillRect(cx - 7, cy - 4, 14, 4)
    g.strokeRect(cx - 7, cy - 4, 14, 4)
    // Water spray droplets
    g.fillStyle(0x88C8F0)
    g.fillCircle(cx, cy - 32, 3)
    g.fillCircle(cx - 5, cy - 30, 2)
    g.fillCircle(cx + 5, cy - 30, 2)
    g.fillStyle(0x58A4D0, 0.65)
    g.fillCircle(cx - 9, cy - 26, 2)
    g.fillCircle(cx + 9, cy - 26, 2)
    g.fillCircle(cx - 2, cy - 34, 1.5)
    g.fillCircle(cx + 2, cy - 34, 1.5)

    // Academy plaque below fountain
    this.add.text(cx, cy + 38, '✦ MANA ACADEMY ✦', {
      fontSize: '9px', color: '#907050',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5).setDepth(3)
  }

  // ── Furniture & decoration ─────────────────────────────────────────────────

  drawFurniture() {
    const g = this.add.graphics().setDepth(2)

    // ── 1. Librarian counter (top section, cols 1-8, rows 1-2) ──────────────
    const counterX = 1 * TILE
    const counterY = 1 * TILE
    const counterW = 8 * TILE
    const counterH = 2 * TILE

    // Dark wood backing (bookshelves behind counter)
    g.fillStyle(0x4A2E10)
    g.fillRect(counterX, counterY, counterW, counterH)
    // Book spines on shelves
    const spineColors = [0xCC2200, 0x2255AA, 0x228822, 0xCC8800, 0x6633AA, 0x005588, 0xCC2200, 0x228822]
    for (let bi = 0; bi < 8; bi++) {
      g.fillStyle(spineColors[bi % spineColors.length])
      const bx = counterX + 4 + bi * (counterW / 8)
      const bw = counterW / 8 - 6
      g.fillRect(bx, counterY + 3, bw, counterH - 10)
      // Book highlight
      g.fillStyle(0xFFFFFF, 0.15)
      g.fillRect(bx + 1, counterY + 3, 2, counterH - 10)
    }
    // Counter top (lighter wood surface)
    g.fillStyle(0x7A5030)
    g.fillRect(counterX, counterY + counterH - 10, counterW, 10)
    // Gold counter border
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(counterX, counterY, counterW, counterH)
    // Horizontal shelf divider
    g.lineStyle(1, 0xD4AF37, 0.4)
    g.lineBetween(counterX, counterY + counterH / 2, counterX + counterW, counterY + counterH / 2)

    // ── 2. Green duel carpet (center arena) ──────────────────────────────────
    const carpetX = 9 * TILE
    const carpetY = 6 * TILE
    const carpetW = 7 * TILE
    const carpetH = 6 * TILE

    g.fillStyle(0x38882A)
    g.fillRect(carpetX, carpetY, carpetW, carpetH)
    // Subtle tile grid on carpet
    g.lineStyle(1, 0x50A840, 0.4)
    for (let ci = 1; ci < 7; ci++) g.lineBetween(carpetX + ci * TILE, carpetY, carpetX + ci * TILE, carpetY + carpetH)
    for (let ri = 1; ri < 6; ri++) g.lineBetween(carpetX, carpetY + ri * TILE, carpetX + carpetW, carpetY + ri * TILE)
    // Gold border + corner gems
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(carpetX, carpetY, carpetW, carpetH)
    g.fillStyle(0xD4AF37)
    g.fillRect(carpetX - 3, carpetY - 3, 7, 7)
    g.fillRect(carpetX + carpetW - 4, carpetY - 3, 7, 7)
    g.fillRect(carpetX - 3, carpetY + carpetH - 4, 7, 7)
    g.fillRect(carpetX + carpetW - 4, carpetY + carpetH - 4, 7, 7)
    // Label on carpet
    this.add.text(carpetX + carpetW / 2, carpetY + carpetH / 2, '⚔ DUEL ZONE', {
      fontSize: '11px', color: '#D4AF37',
      fontFamily: 'monospace', fontStyle: 'bold', alpha: 0.8,
    }).setOrigin(0.5, 0.5).setDepth(3)

    // ── 3. Four study tables ─────────────────────────────────────────────────
    this.drawTable(g, 5, 4)    // upper-left (near white scholar)
    this.drawTable(g, 19, 4)   // upper-right (near red knight)
    this.drawTable(g, 5, 13)   // lower-left (near green ranger)
    this.drawTable(g, 19, 13)  // lower-right (near black shade)

    // ── 4. Bookshelves along right interior wall ──────────────────────────────
    this.drawBookshelf(g, 23, 2, 5)   // upper shelf (rows 2-6)
    this.drawBookshelf(g, 23, 10, 5)  // lower shelf (rows 10-14)

    // ── 5. Potted plants ────────────────────────────────────────────────────
    this.drawPlant(g, 1, 6)    // left wall middle
    this.drawPlant(g, 1, 10)   // left wall middle-lower
    this.drawPlant(g, 8, 16)   // bottom area left
    this.drawPlant(g, 16, 16)  // bottom area right

    // ── 6. Centrepiece fountain ─────────────────────────────────────────────
    this.drawFountain()
  }

  drawTable(g, col, row) {
    const cx = col * TILE + TILE / 2
    const cy = row * TILE + TILE / 2
    const R = 18

    // Shadow
    g.fillStyle(0x000000, 0.25)
    g.fillCircle(cx + 3, cy + 3, R)
    // Table surface
    g.fillStyle(0x8B5A2A)
    g.fillCircle(cx, cy, R)
    g.lineStyle(2, 0x5A3010, 1)
    g.strokeCircle(cx, cy, R)
    // Wood grain accent
    g.fillStyle(0xA07040, 0.5)
    g.fillCircle(cx - 3, cy - 3, 8)
    // Gold rim highlight
    g.lineStyle(1, 0xD4AF37, 0.5)
    g.strokeCircle(cx, cy, R - 2)

    // Chairs (N, S, E, W)
    const CO = R + 10  // chair offset
    for (const [dx, dy] of [[0, -CO], [0, CO], [-CO, 0], [CO, 0]]) {
      g.fillStyle(0x6A4020)
      g.fillRect(cx + dx - 6, cy + dy - 6, 12, 12)
      g.fillStyle(0x8A6040, 0.6)
      g.fillRect(cx + dx - 5, cy + dy - 5, 5, 5)  // highlight
      g.lineStyle(1, 0x4A2010, 1)
      g.strokeRect(cx + dx - 6, cy + dy - 6, 12, 12)
    }
  }

  drawBookshelf(g, col, rowStart, rowCount) {
    const x = col * TILE
    const y = rowStart * TILE
    const w = TILE
    const h = rowCount * TILE

    // Shelf backing
    g.fillStyle(0x4A2E10)
    g.fillRect(x, y, w, h)
    // Shelf boards
    for (let i = 0; i <= rowCount; i++) {
      g.fillStyle(0x7A5030)
      g.fillRect(x, y + i * TILE - 3, w, 5)
    }
    // Book spines
    const colors = [0xCC2200, 0x2255AA, 0x228822, 0x6633AA, 0xCC8800, 0xFF8800, 0x005588, 0xAA0044]
    let ci = 0
    for (let shelf = 0; shelf < rowCount; shelf++) {
      const sy = y + shelf * TILE + 5
      const sh = TILE - 10
      let bx = x + 2
      while (bx < x + w - 4) {
        const bw = 5 + (ci * 3) % 5
        g.fillStyle(colors[ci % colors.length])
        g.fillRect(bx, sy, bw, sh)
        g.fillStyle(0xFFFFFF, 0.1)
        g.fillRect(bx + 1, sy, 1, sh)  // spine shine
        bx += bw + 1
        ci++
      }
    }
    // Gold border
    g.lineStyle(2, 0xD4AF37, 0.7)
    g.strokeRect(x, y, w, h)
  }

  drawPlant(g, col, row) {
    const cx = col * TILE + TILE / 2
    const cy = row * TILE + TILE / 2

    // Pot
    g.fillStyle(0x8B5A2A)
    g.fillRect(cx - 8, cy + 2, 16, 12)
    g.lineStyle(1, 0xD4AF37, 0.6)
    g.strokeRect(cx - 8, cy + 2, 16, 12)
    // Soil
    g.fillStyle(0x5A3010)
    g.fillRect(cx - 6, cy + 2, 12, 4)
    // Leaves
    g.fillStyle(0x228822)
    g.fillCircle(cx, cy - 5, 10)
    g.fillCircle(cx - 7, cy + 1, 7)
    g.fillCircle(cx + 7, cy + 1, 7)
    // Leaf highlight
    g.fillStyle(0x44BB44, 0.5)
    g.fillCircle(cx - 3, cy - 7, 5)
  }

  // ── Portal door at bottom center ───────────────────────────────────────────

  drawPortalDoor() {
    const doorCol = 12  // center column
    const px = doorCol * TILE + TILE / 2   // = 400
    const py = 16 * TILE + TILE / 2         // = 528 (row 16 center)

    const g = this.add.graphics().setDepth(2)

    // Stone pillar left
    g.fillStyle(0x485838)
    g.fillRect(px - 58, py - 36, 14, 52)
    g.lineStyle(2, 0x101010, 1)
    g.strokeRect(px - 58, py - 36, 14, 52)
    // Stone pillar right
    g.fillRect(px + 44, py - 36, 14, 52)
    g.strokeRect(px + 44, py - 36, 14, 52)

    // Door arch frame
    g.fillStyle(0x304828)
    g.fillRect(px - 48, py - 36, 96, 52)
    // Dark inner portal
    g.fillStyle(0x0A1828)
    g.fillRect(px - 40, py - 30, 80, 46)
    // Portal shimmer bands (GBC dark blue glow)
    g.fillStyle(0x1A4080, 0.5)
    g.fillRect(px - 36, py - 26, 72, 8)
    g.fillRect(px - 36, py - 12, 72, 8)
    g.fillRect(px - 36, py + 2, 72, 8)
    // Arch frame border
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(px - 48, py - 36, 96, 52)
    // Arch top (semicircle)
    g.fillStyle(0x304828)
    g.fillRect(px - 48, py - 54, 96, 24)
    g.fillStyle(0x0A1828)
    g.fillRect(px - 40, py - 50, 80, 20)
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(px - 48, py - 54, 96, 24)

    // "WORLD MAP" label
    this.add.text(px, py + 24, 'WORLD MAP', {
      fontSize: '10px', color: '#D4AF37',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(3)

    // Portal trigger zone (player walks into this)
    this.portalBounds = new Phaser.Geom.Rectangle(px - 40, py - 10, 80, 30)
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  createPlayer() {
    const startX = Math.floor(COLS / 2) * TILE + TILE / 2
    const startY = Math.floor(ROWS / 2) * TILE + TILE / 2

    this.player = this.physics.add.sprite(startX, startY, 'player')
    this.player.setDisplaySize(30, 48)           // GBA-scale: ~1 tile wide
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
    this.player.body.setSize(20, 20)
    this.player.body.setOffset(
      (this.player.width - 20) / 2,
      this.player.height - 24
    )
    this._bumpCooldown = 0
    this.physics.add.collider(this.player, this.wallGroup, () => {
      SoundEngine.bump()
    })
  }

  // ── NPCs ───────────────────────────────────────────────────────────────────

  createNPCs() {
    this.npcs = []
    for (const def of NPC_DEFS) {
      const x = def.tileX * TILE + TILE / 2
      const y = def.tileY * TILE + TILE / 2
      const sprite = this.physics.add.sprite(x, y, def.texture)
      sprite.setDisplaySize(28, 44)
      sprite.setDepth(9)
      sprite.setImmovable(true)
      sprite.body.moves = false
      sprite.body.setSize(20, 20)
      sprite.body.setOffset(
        (sprite.width - 20) / 2,
        sprite.height - 24
      )
      this.physics.add.collider(this.player, sprite)
      this.npcs.push({ def, sprite })
    }
  }

  startNPCBehaviors() {
    for (const npc of this.npcs) {
      if (npc.def.key === 'white-scholar') {
        // Slow patrol between two y positions
        this.tweens.add({
          targets: npc.sprite,
          y: npc.def.tileY * TILE + TILE / 2 + 3 * TILE,
          duration: 3500,
          ease: 'Linear',
          yoyo: true,
          repeat: -1,
          hold: 1500,
        })
      } else if (npc.def.key === 'practice-duelist') {
        // Gentle idle bob
        this.tweens.add({
          targets: npc.sprite,
          y: npc.sprite.y + 4,
          duration: 800,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      } else if (npc.def.key === 'shopkeeper') {
        // Slow weight-shift side to side — busy counting coins
        this.tweens.add({
          targets: npc.sprite,
          x: npc.sprite.x + 4,
          duration: 1400,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      } else if (npc.def.key === 'green-ranger') {
        // Side-to-side weight shift
        this.tweens.add({
          targets: npc.sprite,
          x: npc.sprite.x + 6,
          duration: 1200,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      }
    }
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  setupCamera() {
    const mapW = COLS * TILE
    const mapH = ROWS * TILE
    this.physics.world.setBounds(0, 0, mapW, mapH)
    this.cameras.main.setBounds(0, 0, mapW, mapH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor(0xB0986A)  // warm tan to match floor grout
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.eKey.on('down', () => this.onEPress())
    SoundEngine.startBGM('hub')
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  createUI() {
    // HUD bar — 32px matching background PNG
    const barBg = this.add.graphics().setScrollFactor(0).setDepth(20)
    barBg.fillStyle(0x0A111E)
    barBg.fillRect(0, 0, COLS * TILE, 32)
    barBg.lineStyle(1, 0x503810, 1)
    barBg.lineBetween(0, 31, COLS * TILE, 31)
    barBg.lineStyle(1, 0xD4AF37, 1)
    barBg.lineBetween(0, 32, COLS * TILE, 32)

    // Status token panel (top-left)
    const tokenBg = this.add.graphics().setScrollFactor(0).setDepth(21)
    tokenBg.fillStyle(0x0A111E)
    tokenBg.fillRect(4, 4, 210, 24)
    tokenBg.lineStyle(1, 0xD4AF37, 0.7)
    tokenBg.strokeRect(4, 4, 210, 24)

    this.statsText = this.add.text(10, 8, '', {
      fontSize: '11px',
      color: '#F0EED8',
      fontFamily: 'Courier New, monospace',
    }).setScrollFactor(0).setDepth(22)

    this.updateStats()

    // Prompt label
    this.promptLabel = this.add.text(0, 0, '[E] Talk', {
      fontSize: '10px', color: '#101010',
      fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#F0EED8',
      padding: { x: 5, y: 2 },
    }).setDepth(30).setVisible(false)

    // Compass rose (bottom-left)
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
    const arms = [[0, false], [90, true], [180, false], [270, false]]
    for (const [angle, isNorth] of arms) {
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
    const gold = this.registry.get('gold') ?? 0
    const seals = this.registry.get('seals') ?? []
    const hpDisplay = this.registry.get('hp') ?? 10
    const hpFull  = Math.min(hpDisplay, 5)
    const hpEmpty = Math.max(0, 5 - hpFull)
    const hearts   = '❤'.repeat(hpFull) + '♡'.repeat(hpEmpty)
    const sealStr  = '★'.repeat(seals.length) + '☆'.repeat(5 - seals.length)
    this.statsText.setText(`${hearts}  ◆ ${gold}  ${sealStr}  ◉◉◉`)
  }

  drawMinimap() {
    const MM_W = 90, MM_H = 90
    const MM_X = COLS * TILE - MM_W - 4
    const MM_Y = 2
    const SW = Math.floor(MM_W / COLS)
    const SH = Math.floor(MM_H / ROWS)

    const g = this.add.graphics().setScrollFactor(0).setDepth(28)
    g.fillStyle(0x060C18, 0.92)
    g.fillRect(MM_X - 2, MM_Y, MM_W + 4, MM_H + 4)
    g.lineStyle(1, 0xD4AF37, 0.9)
    g.strokeRect(MM_X - 2, MM_Y, MM_W + 4, MM_H + 4)

    // Map tiles
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r]?.[c] ?? 'W'
        const px = MM_X + c * SW
        const py = MM_Y + 2 + r * SH
        g.fillStyle(ch === 'W' ? 0x5A4830 : 0xC4A265, ch === 'W' ? 1 : 0.75)
        g.fillRect(px, py, SW, SH)
      }
    }

    // Portal dot (teal)
    g.fillStyle(0x37D3C4)
    g.fillRect(MM_X + 12 * SW - 1, MM_Y + 2 + 17 * SH, SW + 2, SH)

    // NPC dots
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
    this._mmX = MM_X
    this._mmY = MM_Y
    this._mmSW = SW
    this._mmSH = SH
  }

  updateMinimap() {
    if (!this.minimapPlayerDot || !this.player || !this._mmX) return
    const px = this._mmX + Math.floor(this.player.x / TILE) * this._mmSW
    const py = this._mmY + 2 + Math.floor(this.player.y / TILE) * this._mmSH
    this.minimapPlayerDot.clear()
    this.minimapPlayerDot.fillStyle(0xFFD700)
    this.minimapPlayerDot.fillRect(px, py, this._mmSW + 1, this._mmSH + 1)
  }

  // ── Dialog (FFTA style: rounded cream box, portrait right, name tab) ───────

  openDialog(npc) {
    if (this.dialogState) return

    const camX = this.cameras.main.scrollX
    const camY = this.cameras.main.scrollY
    const BOX_X = camX + 20
    const BOX_Y = camY + 414
    const BOX_W = COLS * TILE - 40
    const BOX_H = 150
    const PORT_W = 70
    const TEXT_X = BOX_X + PORT_W + 22
    const TEXT_W = BOX_W - PORT_W - 30

    const bg = this.add.graphics().setDepth(50)

    // Main box — FFTA rounded cream
    bg.fillStyle(0xFEFAF0)
    bg.fillRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(3, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    // Inner accent border
    bg.lineStyle(1, 0xA88860, 0.3)
    bg.strokeRoundedRect(BOX_X + 5, BOX_Y + 5, BOX_W - 10, BOX_H - 10, 6)

    // Name tab (pops up above box, top-left, NPC colour)
    const tabColor = npc.def.tabColor || 0x4878C8
    const tabW = 160
    bg.fillStyle(tabColor)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y - 22, tabW, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
    bg.lineStyle(2, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y - 22, tabW, 26, { tl: 6, tr: 6, bl: 0, br: 0 })

    // Portrait zone (LEFT side) — warm cream recess
    bg.fillStyle(0xE8DFC8)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)
    bg.lineStyle(1, 0x9A8060, 0.7)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)

    // Portrait sprite — fixed display size regardless of source texture
    const portrait = this.add.sprite(
      BOX_X + PORT_W / 2 + 8,
      BOX_Y + BOX_H / 2,
      npc.def.texture
    ).setDepth(52)
    portrait.setDisplaySize(56, 110)

    // Name text on the tab (white bold)
    const nameText = this.add.text(BOX_X + 16, BOX_Y - 14, npc.def.name, {
      fontSize: '12px',
      color: '#FFFFFF',
      fontFamily: '"Arial", sans-serif',
      fontStyle: 'bold',
      stroke: '#2A1808',
      strokeThickness: 2,
    }).setDepth(53)

    // Dialog body text — dark on cream, readable sans-serif
    const bodyText = this.add.text(TEXT_X, BOX_Y + 20, '', {
      fontSize: '13px',
      color: '#18100A',
      fontFamily: '"Arial", sans-serif',
      wordWrap: { width: TEXT_W },
      lineSpacing: 5,
    }).setDepth(52)

    // Continue prompt — bottom right of text area
    const hint = this.add.text(BOX_X + TEXT_W + 10, BOX_Y + BOX_H - 12, '[E] ▼', {
      fontSize: '11px',
      color: '#806040',
      fontFamily: '"Arial", sans-serif',
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
        this.time.delayedCall(100, () => {
          this.game.events.emit('battleStart', npc.def.battle)
        })
      } else if (npc.def.shop) {
        this.time.delayedCall(100, () => {
          this.game.events.emit('shopOpen')
        })
      } else if (npc.def.rest) {
        this.time.delayedCall(100, () => {
          this.game.events.emit('playerRest')
        })
      }
    }
  }

  closeDialog() {
    if (!this.dialogState) return
    const { bg, nameText, bodyText, hint, portrait } = this.dialogState
    bg.destroy(); nameText.destroy(); bodyText.destroy(); hint.destroy(); portrait.destroy()
    this.dialogState = null
  }

  // ── Input handler ──────────────────────────────────────────────────────────

  onEPress() {
    if (this.dialogState) {
      this.advanceDialog()
      return
    }
    const nearby = this.getNearbyNPC()
    if (nearby) { this.openDialog(nearby); return }
    if (this.isNearShop()) {
      this.game.events.emit('shopOpen')
    }
  }

  isNearShop() {
    if (!this.shopBounds) return false
    return this.shopBounds.contains(this.player.x, this.player.y)
  }

  getNearbyNPC() {
    const px = this.player.x
    const py = this.player.y
    for (const npc of this.npcs) {
      const dx = npc.sprite.x - px
      const dy = npc.sprite.y - py
      if (Math.sqrt(dx * dx + dy * dy) < 52) return npc
    }
    return null
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  update() {
    if (!this.player) return
    this.handleMovement()
    this.updateNPCPrompts()
    this.checkPortalOverlap()
    this.checkPassages()
    this.updateStats()
    this.updateMinimap()
  }

  handleMovement() {
    if (this.dialogState || this.transitioning) {
      this.player.setVelocity(0, 0)
      return
    }
    const SPEED = 160
    let vx = 0
    let vy = 0
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -SPEED
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx = SPEED
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -SPEED
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy = SPEED
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }
    this.player.setVelocity(vx, vy)
  }

  updateNPCPrompts() {
    const nearby = this.getNearbyNPC()
    if (nearby && !this.dialogState) {
      const label = nearby.def.battle ? '[E] Duel' : nearby.def.shop ? '[E] Shop' : nearby.def.rest ? '[E] Rest' : '[E] Talk'
      this.promptLabel.setText(label)
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(
        nearby.sprite.x - this.promptLabel.width / 2,
        nearby.sprite.y - 36,
      )
    } else if (this.isNearShop() && !this.dialogState) {
      this.promptLabel.setText('[E] Shop')
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(648 - this.promptLabel.width / 2, 172)
    } else if (this.leftPassageBounds?.contains(this.player.x, this.player.y) && !this.dialogState) {
      this.promptLabel.setText('[← Archives]')
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(48, 302 - this.promptLabel.height / 2)
    } else {
      this.promptLabel.setVisible(false)
    }
  }

  checkPassages() {
    if (this.dialogState || this.transitioning) return
    const lb = this.leftPassageBounds
    if (lb && lb.contains(this.player.x, this.player.y)) {
      this.transitioning = true
      this.player.setVelocity(0, 0)
      this.cameras.main.fadeOut(400, 16, 48, 88)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Archives')
      })
    }
  }

  checkPortalOverlap() {
    if (this.dialogState || this.transitioning) return
    const pb = this.portalBounds
    if (pb && pb.contains(this.player.x, this.player.y)) {
      this.transitioning = true                    // ← guard prevents re-fire
      this.player.setVelocity(0, 0)
      this.cameras.main.fadeOut(500, 16, 48, 88)  // fade to dark GBC navy
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WorldMap')
      })
    }
  }
}
