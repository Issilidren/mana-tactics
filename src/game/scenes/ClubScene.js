import Phaser from 'phaser'
import { SoundEngine } from '../systems/SoundEngine.js'

const TILE = 32
const COLS = 25
const ROWS = 18

// Same layout for all clubs — gap in bottom wall for the exit portal
// prettier-ignore
const MAP = [
  'WWWWWWWWWWWWWWWWWWWWWWWWW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WFFFFFFFFFFFFFFFFFFFFFFFFW',
  'WWWWWWWWWWWFFFWWWWWWWWWWW',
]

// ── Club configurations — each defines palette, archmage, and unique members ──

const CONFIGS = {

  // ── WHITE: Solara Plains Club ──────────────────────────────────────────────
  ClubWhite: {
    key: 'ClubWhite',
    bgKey: 'club-white-bg',
    name: 'SOLARA PLAINS CLUB',
    palette: {
      floor: 0xF4F0E4, floorGrid: 0xDDD8C4,
      carpet: 0xD4C460, carpetGrid: 0xE8DC90, carpetBorder: 0x8B7A30,
      wallTint: 0xFFEECC,
      podium: 0xD4C460, podiumDark: 0x8B7A30,
      tabColor: 0xA08020,
    },
    archmage: {
      texture: 'npc-white', name: 'Archmage Solara',
      tileX: 12, tileY: 3,
      dialog: [
        'Welcome to the Solara Plains Club, challenger.',
        'White magic heals, protects, and lifts armies of angels above the fray.',
        'I am Archmage Solara. Earn the Solara Seal — if you can.',
      ],
      battle: { npcName: 'Archmage Solara', color: 'white', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-tactician', tileX: 4,  tileY: 6,  name: 'Paladin Lyra',
        dialog: ['Flying angels are the pride of Solara. Have you faced one yet?'] },
      { texture: 'npc-tactician', tileX: 20, tileY: 6,  name: 'Cleric Cael',
        dialog: ['Lifelink means every attack also heals you. Pure white strategy.'] },
      { texture: 'npc-tactician', tileX: 4,  tileY: 10, name: 'Knight Varis',
        dialog: ['First strike is powerful. Hit them before they can hit back!'] },
      { texture: 'npc-tactician', tileX: 20, tileY: 10, name: 'Warden Sire',
        dialog: ['Vigilance lets us attack AND defend. No rest for white mages.'] },
      { texture: 'npc-green', tileX: 12, tileY: 12, name: 'Visitor Thane',
        dialog: ['I came from the Thornveil Woods to study white magic. Fascinating protection spells...'] },
    ],
  },

  // ── BLUE: Tidefall Isles Club ──────────────────────────────────────────────
  ClubBlue: {
    key: 'ClubBlue',
    bgKey: 'club-blue-bg',
    name: 'TIDEFALL ISLES CLUB',
    palette: {
      floor: 0xD4DCF0, floorGrid: 0xB8C8E4,
      carpet: 0x2255AA, carpetGrid: 0x3366BB, carpetBorder: 0x113377,
      wallTint: 0xAABBDD,
      podium: 0x2255AA, podiumDark: 0x113377,
      tabColor: 0x1A4A90,
    },
    archmage: {
      texture: 'npc-blue', name: 'Archmage Tidefall',
      tileX: 12, tileY: 3,
      dialog: [
        'The Tidefall Isles Club. Knowledge is the ultimate weapon.',
        'Card draw. Counter-spells. Control. We do not rush — we dominate.',
        'I am Archmage Tidefall. Your deck is an open book to me.',
      ],
      battle: { npcName: 'Archmage Tidefall', color: 'blue', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-chronicler', tileX: 4,  tileY: 6,  name: 'Scholar Wavren',
        dialog: ['Card advantage wins games. The more you draw, the more options you have.'] },
      { texture: 'npc-chronicler', tileX: 20, tileY: 6,  name: 'Scholar Tide',
        dialog: ['Flying creatures cross the isles where no others can follow.'] },
      { texture: 'npc-chronicler', tileX: 3,  tileY: 10, name: 'Archivist Brin',
        dialog: ['These tomes hold every counter-spell ever devised. Quite the collection.'] },
      { texture: 'npc-chronicler', tileX: 21, tileY: 10, name: 'Mage Frost',
        dialog: ['The Archmage once countered seven spells in a single turn. Seven!'] },
      { texture: 'npc-chronicler', tileX: 8,  tileY: 13, name: 'Apprentice Rill',
        dialog: ['I am still learning. But blue magic rewards patience above all else.'] },
      { texture: 'npc-white', tileX: 16, tileY: 13, name: 'Visitor Zel',
        dialog: ['I came to study their card draw. White mages never draw quite enough...'] },
    ],
  },

  // ── BLACK: Shadowmere Bog Club ─────────────────────────────────────────────
  ClubBlack: {
    key: 'ClubBlack',
    bgKey: 'club-black-bg',
    name: 'SHADOWMERE BOG CLUB',
    palette: {
      floor: 0x201828, floorGrid: 0x302038,
      carpet: 0x6633AA, carpetGrid: 0x7744BB, carpetBorder: 0x4A1A88,
      wallTint: 0xAA99BB,
      podium: 0x6633AA, podiumDark: 0x3A1060,
      tabColor: 0x4A1880,
    },
    archmage: {
      texture: 'npc-black', name: 'Archmage Shadowmere',
      tileX: 12, tileY: 3,
      dialog: [
        '...',
        'Shadowmere Bog. Where every creature ends up eventually.',
        'Power demands sacrifice. Are you willing to pay?',
      ],
      battle: { npcName: 'Archmage Shadowmere', color: 'black', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-shadow-student', tileX: 4,  tileY: 7,  name: 'Shade Morven',
        dialog: ['Every creature dies eventually. We just... accelerate the process.'] },
      { texture: 'npc-shadow-student', tileX: 20, tileY: 7,  name: 'Shade Nyxe',
        dialog: ['Power comes at a price. We are always willing to pay it.'] },
      { texture: 'npc-shadow-student', tileX: 3,  tileY: 12, name: 'Shade Corvin',
        dialog: ['The strongest spells require sacrifice. Is that so different from anything else?'] },
      { texture: 'npc-shadow-student', tileX: 21, tileY: 12, name: 'Shade Vex',
        dialog: ['Deathtouch. Any creature we touch dies. Think about that.'] },
    ],
  },

  // ── RED: Embercrest Peaks Club ─────────────────────────────────────────────
  ClubRed: {
    key: 'ClubRed',
    bgKey: 'club-red-bg',
    name: 'EMBERCREST PEAKS CLUB',
    palette: {
      floor: 0xF2E0D8, floorGrid: 0xE4C8C0,
      carpet: 0xCC3311, carpetGrid: 0xDD5533, carpetBorder: 0x881100,
      wallTint: 0xDDAA99,
      podium: 0xCC3311, podiumDark: 0x881100,
      tabColor: 0xA01800,
    },
    archmage: {
      texture: 'npc-red', name: 'Archmage Embercrest',
      tileX: 12, tileY: 3,
      dialog: [
        'EMBERCREST PEAKS! We do not wait — we STRIKE!',
        'Haste. Direct damage. First strike. Speed wins everything.',
        'Challenge me RIGHT NOW! I have been waiting!',
      ],
      battle: { npcName: 'Archmage Embercrest', color: 'red', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-fire-student', tileX: 5,  tileY: 6,  name: 'Knight Blazer',
        dialog: ['ATTACK! ALWAYS ATTACK! Defense is for cowards!'] },
      { texture: 'npc-fire-student', tileX: 19, tileY: 6,  name: 'Knight Cinder',
        dialog: ['Lightning Bolt can win games before they even start. Watch!'] },
      { texture: 'npc-fire-student', tileX: 8,  tileY: 9,  name: 'Fighter Sear',
        dialog: ['Speed beats everything. By the time they react, we have already won!'] },
      { texture: 'npc-fire-student', tileX: 16, tileY: 9,  name: 'Fighter Torch',
        dialog: ['Haste creatures! Play them on your turn, swing immediately!'] },
      { texture: 'npc-fire-student', tileX: 5,  tileY: 13, name: 'Warrior Fenn',
        dialog: ['The Archmage burned through a 20-health opponent in TWO turns. Two!'] },
      { texture: 'npc-fire-student', tileX: 19, tileY: 13, name: 'Warrior Ash',
        dialog: ['Direct damage to the face. Ignore their creatures. Go for the win!'] },
    ],
  },

  // ── GREEN: Thornveil Woods Club ────────────────────────────────────────────
  ClubGreen: {
    key: 'ClubGreen',
    bgKey: 'club-green-bg',
    name: 'THORNVEIL WOODS CLUB',
    palette: {
      floor: 0xD4F0D0, floorGrid: 0xB8E0B4,
      carpet: 0x228822, carpetGrid: 0x33AA33, carpetBorder: 0x0A5A0A,
      wallTint: 0xAADD99,
      podium: 0x228822, podiumDark: 0x0A5A0A,
      tabColor: 0x186018,
    },
    archmage: {
      texture: 'npc-green', name: 'Archmage Thornveil',
      tileX: 12, tileY: 3,
      dialog: [
        'Thornveil Woods Club. The ancient forest welcomes all travelers.',
        'More mana, more creatures, more power. Nature does not rush — it overwhelms.',
        'Let the wilds decide our contest, challenger.',
      ],
      battle: { npcName: 'Archmage Thornveil', color: 'green', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-earth-student', tileX: 3,  tileY: 6,  name: 'Ranger Vine',
        dialog: ['Size matters in the woods. My 8/8 trampler proves it every time.'] },
      { texture: 'npc-wind-student',  tileX: 21, tileY: 6,  name: 'Ranger Moss',
        dialog: ['More lands means more mana means bigger creatures. Simple forest math.'] },
      { texture: 'npc-earth-student', tileX: 3,  tileY: 10, name: 'Druid Bark',
        dialog: ['Reach lets our creatures swat those pesky flyers right out of the sky.'] },
      { texture: 'npc-wind-student',  tileX: 21, tileY: 10, name: 'Druid Fern',
        dialog: ['The ancient forests grant strength beyond any other guild. Feel it?'] },
      { texture: 'npc-earth-student', tileX: 7,  tileY: 13, name: 'Scout Twig',
        dialog: ['I patrol the border between the woods and the World Map portal.'] },
      { texture: 'npc-wind-student',  tileX: 17, tileY: 13, name: 'Scout Root',
        dialog: ['Trample through everything. Leave nothing standing in your path!'] },
    ],
  },
}

// ── ClubScene: single class powering all 5 clubs ──────────────────────────────

class ClubScene extends Phaser.Scene {
  constructor(cfg) {
    super(cfg.key)
    this.cfg = cfg
    this.transitioning = false
    this.dialogState = null
    this.player   = null
    this.wallGroup = null
    this.npcs     = []
    this.promptLabel = null
    this.statsText   = null
    this.portalBounds = null
    this.cursors = null
    this.wasd    = null
    this.eKey    = null
  }

  create() {
    this.transitioning = false
    this.dialogState   = null
    this.npcs          = []

    // PNG background (baked-in floor, furniture, carpet, bookshelves)
    this.add.image(0, 0, this.cfg.bgKey).setOrigin(0, 0).setDepth(0)

    const walkable = MAP.map(row => Array.from(row).map(ch => ch !== 'W'))
    this.drawFloor(walkable).setAlpha(0)   // invisible — physics walls still active
    this.drawPortalDoor()
    this.createPlayer()
    this.createNPCs()
    this.startNPCBehaviors()
    this.setupCamera()
    this.setupInput()
    this.createUI()
  }

  // ── Floor & walls ──────────────────────────────────────────────────────────

  drawFloor(walkable) {
    this.wallGroup = this.physics.add.staticGroup()
    const p = this.cfg.palette

    const g = this.add.graphics().setDepth(0)
    // Solid themed floor
    g.fillStyle(p.floor)
    g.fillRect(TILE, TILE, (COLS - 2) * TILE, (ROWS - 2) * TILE)
    // Subtle tile grid
    g.lineStyle(1, p.floorGrid, 0.5)
    for (let r = 1; r <= ROWS - 1; r++) g.lineBetween(TILE, r * TILE, (COLS - 1) * TILE, r * TILE)
    for (let c = 1; c <= COLS - 1; c++) g.lineBetween(c * TILE, TILE, c * TILE, (ROWS - 1) * TILE)

    // Walls with club tint
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!walkable[r][c]) {
          const x = c * TILE + TILE / 2
          const y = r * TILE + TILE / 2
          const w = this.wallGroup.create(x, y, 'tile-wall')
          w.setTint(p.wallTint)
          w.setOrigin(0.5, 0.5)
          w.refreshBody()
        }
      }
    }

    return g
  }

  // ── Portal door (exit to World Map) ────────────────────────────────────────

  drawPortalDoor() {
    const px = 12 * TILE + TILE / 2
    const py = 16 * TILE + TILE / 2
    const g = this.add.graphics().setDepth(2)

    // Stone pillars
    for (const ox of [-58, 44]) {
      g.fillStyle(0x485838)
      g.fillRect(px + ox, py - 40, 14, 56)
      g.lineStyle(2, 0x101010, 1)
      g.strokeRect(px + ox, py - 40, 14, 56)
    }
    // Arch body
    g.fillStyle(0x304828)
    g.fillRect(px - 48, py - 40, 96, 56)
    g.fillStyle(0x0A1828)
    g.fillRect(px - 40, py - 32, 80, 48)
    // Shimmer bands
    g.fillStyle(0x1A4080, 0.4)
    g.fillRect(px - 36, py - 28, 72, 8)
    g.fillRect(px - 36, py - 14, 72, 8)
    g.fillRect(px - 36, py + 0,  72, 8)
    // Arch top cap
    g.fillStyle(0x304828)
    g.fillRect(px - 48, py - 58, 96, 24)
    g.fillStyle(0x0A1828)
    g.fillRect(px - 40, py - 54, 80, 20)
    // Gold borders
    g.lineStyle(3, 0xD4AF37, 1)
    g.strokeRect(px - 48, py - 40, 96, 56)
    g.strokeRect(px - 48, py - 58, 96, 24)

    this.add.text(px, py + 24, 'WORLD MAP', {
      fontSize: '10px', color: '#D4AF37', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(3)

    this.portalBounds = new Phaser.Geom.Rectangle(px - 40, py - 8, 80, 32)
  }

  // ── Player (spawns near bottom, as if they just came through the portal) ───

  createPlayer() {
    const startX = 12 * TILE + TILE / 2
    const startY = 14 * TILE + TILE / 2
    this.player = this.physics.add.sprite(startX, startY, 'player')
    this.player.setDisplaySize(48, 72)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
    this.player.body.setSize(12, 14)
    this.player.body.setOffset(2, 10)
    this.physics.add.collider(this.player, this.wallGroup, () => {
      SoundEngine.bump()
    })
  }

  // ── NPCs ───────────────────────────────────────────────────────────────────

  createNPCs() {
    const { archmage, members } = this.cfg

    const addNPC = (def, tx, ty) => {
      const sprite = this.physics.add.sprite(tx, ty, def.texture).setScale(0.65).setDepth(9)
      sprite.body.setImmovable(true)
      sprite.body.setSize(20, 22)
      sprite.body.setOffset(2, 5)
      this.physics.add.collider(this.player, sprite)
      this.npcs.push({ def, sprite })
    }

    // Archmage leader
    const ax = archmage.tileX * TILE + TILE / 2
    const ay = archmage.tileY * TILE + TILE / 2
    addNPC(archmage, ax, ay)

    // Club members
    for (const m of members) {
      const mx = m.tileX * TILE + TILE / 2
      const my = m.tileY * TILE + TILE / 2
      addNPC(m, mx, my)
    }
  }

  // ── NPC behaviors ────────────────────────────────────────────────────────────

  startNPCBehaviors() {
    // Archmage stays still — members get varied movement by index
    const members = this.npcs.filter(n => n.def !== this.cfg.archmage)
    members.forEach((npc, i) => {
      const base = { targets: npc.sprite, repeat: -1, yoyo: true }
      if (i % 3 === 0) {
        // Slow vertical patrol — wander up/down 3 tiles
        this.tweens.add({ ...base,
          y: npc.sprite.y + 3 * 32,
          duration: 3200 + i * 400,
          ease: 'Linear',
          hold: 1200,
        })
      } else if (i % 3 === 1) {
        // Side-to-side weight shift
        this.tweens.add({ ...base,
          x: npc.sprite.x + 8,
          duration: 1000 + i * 200,
          ease: 'Sine.easeInOut',
        })
      } else {
        // Gentle idle bob
        this.tweens.add({ ...base,
          y: npc.sprite.y + 5,
          duration: 700 + i * 150,
          ease: 'Sine.easeInOut',
        })
      }
    })
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  setupCamera() {
    const mapW = COLS * TILE, mapH = ROWS * TILE
    this.physics.world.setBounds(0, 0, mapW, mapH)
    this.cameras.main.setBounds(0, 0, mapW, mapH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor(0xB0986A)  // warm tan to match floor grout
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    })
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.eKey.on('down', () => this.onEPress())
    SoundEngine.startBGM('club')
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  createUI() {
    const bg = this.add.graphics().setScrollFactor(0).setDepth(20)
    bg.fillStyle(0x0A111E)
    bg.fillRect(0, 0, COLS * TILE, 32)
    bg.lineStyle(1, 0x503810, 1)
    bg.lineBetween(0, 31, COLS * TILE, 31)
    bg.lineStyle(1, 0xD4AF37, 1)
    bg.lineBetween(0, 32, COLS * TILE, 32)

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
      fontSize: '10px', color: '#101010',
      fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#F0EED8',
      padding: { x: 5, y: 2 },
    }).setDepth(30).setVisible(false)

    this._drawCompassRose()
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
    this.statsText?.setText(
      `HP: ${hp}   Gold: ${gold}   Seals: ${'★'.repeat(seals.length)}${'☆'.repeat(5 - seals.length)}`
    )
  }

  // ── FFTA-style dialog box ──────────────────────────────────────────────────

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

    // Main box — rounded cream
    bg.fillStyle(0xFEFAF0)
    bg.fillRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(3, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(1, 0xA88860, 0.3)
    bg.strokeRoundedRect(BOX_X + 5, BOX_Y + 5, BOX_W - 10, BOX_H - 10, 6)

    // Name tab above top-left
    const tabColor = npc.def.tabColor || this.cfg.palette.tabColor || 0x4878C8
    bg.fillStyle(tabColor)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
    bg.lineStyle(2, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })

    // Portrait zone LEFT
    bg.fillStyle(0xE8DFC8)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)
    bg.lineStyle(1, 0x9A8060, 0.7)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)

    const portrait = this.add.sprite(
      BOX_X + PORT_W / 2 + 8,
      BOX_Y + BOX_H / 2,
      npc.def.texture,
    ).setScale(3).setDepth(52)

    const nameText = this.add.text(BOX_X + 16, BOX_Y - 14, npc.def.name, {
      fontSize: '12px', color: '#FFFFFF',
      fontFamily: '"Arial", sans-serif', fontStyle: 'bold',
      stroke: '#2A1808', strokeThickness: 2,
    }).setDepth(53)

    const bodyText = this.add.text(TEXT_X, BOX_Y + 20, '', {
      fontSize: '13px', color: '#18100A',
      fontFamily: '"Arial", sans-serif',
      wordWrap: { width: TEXT_W },
      lineSpacing: 5,
    }).setDepth(52)

    const hint = this.add.text(BOX_X + TEXT_W + 10, BOX_Y + BOX_H - 12, '[E] ▼', {
      fontSize: '11px', color: '#806040',
      fontFamily: '"Arial", sans-serif',
    }).setOrigin(1, 1).setDepth(52)

    this.dialogState = { npc, pageIndex: 0, bg, nameText, bodyText, hint, portrait }
    this.showPage(0)
  }

  showPage(i) {
    this.dialogState.bodyText.setText(this.dialogState.npc.def.dialog[i] ?? '')
  }

  advanceDialog() {
    SoundEngine.dialogTick()
    if (!this.dialogState) return
    const { npc, pageIndex } = this.dialogState
    const next = pageIndex + 1
    if (next < npc.def.dialog.length) {
      this.dialogState.pageIndex = next
      this.showPage(next)
    } else {
      this.closeDialog()
      if (npc.def.battle) {
        this.time.delayedCall(100, () => {
          SoundEngine.stopBGM()
      this.game.events.emit('battleStart', npc.def.battle)
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
    if (this.dialogState) { this.advanceDialog(); return }
    const nearby = this.getNearby()
    if (nearby) this.openDialog(nearby)
  }

  getNearby() {
    const px = this.player.x, py = this.player.y
    for (const npc of this.npcs) {
      const dx = npc.sprite.x - px
      const dy = npc.sprite.y - py
      if (Math.sqrt(dx * dx + dy * dy) < 52) return npc
    }
    return null
  }

  // ── Update loop ────────────────────────────────────────────────────────────

  update() {
    if (!this.player) return
    this.handleMove()
    this.updatePrompt()
    this.checkPortal()
    this.updateStats()
  }

  handleMove() {
    if (this.dialogState || this.transitioning) {
      this.player.setVelocity(0, 0); return
    }
    const S = 160
    let vx = 0, vy = 0
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -S
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  S
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -S
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  S
    if (vx && vy) { vx *= 0.707; vy *= 0.707 }
    this.player.setVelocity(vx, vy)
  }

  updatePrompt() {
    const nearby = this.getNearby()
    if (nearby && !this.dialogState) {
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(
        nearby.sprite.x - this.promptLabel.width / 2,
        nearby.sprite.y - 36,
      )
    } else {
      this.promptLabel.setVisible(false)
    }
  }

  checkPortal() {
    if (this.dialogState || this.transitioning) return
    if (this.portalBounds?.contains(this.player.x, this.player.y)) {
      this.transitioning = true
      this.player.setVelocity(0, 0)
      this.cameras.main.fadeOut(500, 16, 48, 88)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundEngine.stopBGM(); this.scene.start('WorldMap')
      })
    }
  }
}

// ── Export class constructors (not instances) — Phaser instantiates them itself ─
// Each anonymous subclass locks in one club's config via its constructor.
export const clubScenes = Object.values(CONFIGS).map(cfg =>
  class extends ClubScene {
    constructor() { super(cfg) }
  }
)
