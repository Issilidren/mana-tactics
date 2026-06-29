import Phaser from 'phaser'
import { TILE } from '../systems/IsoEngine.js'
import { SoundEngine } from '../systems/SoundEngine.js'

// ── Tile aliases ──────────────────────────────────────────────────────────────
const S  = TILE.STONE, WL = TILE.WALL,  CP = TILE.CARPET
const BK = TILE.BOOKSHELF, TB = TILE.TABLE, DR = TILE.DOOR

// ── Shared club room layout — 16 cols × 12 rows ───────────────────────────────
// prettier-ignore
const CLUB_MAP = [
  [WL,WL,WL,WL,WL,WL,WL,WL,WL,WL,WL,WL,WL,WL,WL,WL], // 0  top wall
  [WL,BK, S, S, S, S, S, S, S, S, S, S, S, S,BK,WL], // 1  bookshelves flanking
  [WL, S,CP,CP,CP,CP,CP,CP,CP,CP,CP,CP,CP,CP, S,WL], // 2  archmage podium carpet
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL], // 3
  [WL, S, S,TB, S, S, S, S, S, S, S, S,TB, S, S,WL], // 4  study tables
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL], // 5
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL], // 6
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL], // 7
  [WL, S, S,TB, S, S, S, S, S, S, S, S,TB, S, S,WL], // 8  study tables
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL], // 9
  [WL, S, S, S, S, S, S, S, S, S, S, S, S, S, S,WL], // 10
  [WL,WL,WL,WL,WL,WL,WL,DR,DR,WL,WL,WL,WL,WL,WL,WL], // 11 bottom wall + exit
]
const CLUB_COLS = CLUB_MAP[0].length  // 16
const CLUB_ROWS = CLUB_MAP.length     // 12

// ── Club configs ─────────────────────────────────────────────────────────────

const CONFIGS = {

  // ── WHITE: Solara Plains Club ──────────────────────────────────────────────
  ClubWhite: {
    key: 'ClubWhite',
    name: 'SOLARA PLAINS CLUB',
    palette: { tabColor: 0xA08020 },
    isoOverrides: {
      [TILE.STONE]:  { top: 0xF0EBD8, left: 0xDAD4C0, right: 0xC4BEAA, outline: 0xA8A294, height: 4, walkable: true },
      [TILE.WALL]:   { top: 0xE8E0C8, left: 0xC8C0A8, right: 0xB0A890, outline: 0x989080, height: 28, walkable: false },
      [TILE.CARPET]: { top: 0xD4B440, left: 0xB89428, right: 0xA08018, outline: 0x8B6C04, height: 2, walkable: true },
    },
    archmage: {
      texture: 'npc-white', name: 'Archmage Solara', col: 7, row: 2,
      tabColor: 0xA08020,
      dialog: [
        'Welcome to the Solara Plains Club, challenger.',
        'White magic heals, protects, and lifts armies of angels above the fray.',
        'I am Archmage Solara. Earn the Solara Seal — if you can.',
      ],
      battle: { npcName: 'Archmage Solara', color: 'white', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-fire-student',  col: 4,  row: 5,  name: 'Paladin Lyra',
        dialog: ['Flying angels are the pride of Solara. Have you faced one yet?'] },
      { texture: 'npc-water-student', col: 11, row: 5,  name: 'Cleric Cael',
        dialog: ['Lifelink means every attack also heals you. Pure white strategy.'] },
      { texture: 'npc-earth-student', col: 4,  row: 8,  name: 'Knight Varis',
        dialog: ['First strike is powerful. Hit them before they can hit back!'] },
      { texture: 'npc-shadow-student',col: 11, row: 8,  name: 'Warden Sire',
        dialog: ['Vigilance lets us attack AND defend. No rest for white mages.'] },
      { texture: 'npc-wind-student',  col: 7,  row: 10, name: 'Visitor Thane',
        dialog: ['I came from the Thornveil Woods to study white magic. Fascinating protection spells...'] },
    ],
  },

  // ── BLUE: Tidefall Isles Club ──────────────────────────────────────────────
  ClubBlue: {
    key: 'ClubBlue',
    name: 'TIDEFALL ISLES CLUB',
    palette: { tabColor: 0x1A4A90 },
    isoOverrides: {
      [TILE.STONE]:  { top: 0xC0CCDE, left: 0xA0ACCA, right: 0x8090B4, outline: 0x60749A, height: 4, walkable: true },
      [TILE.WALL]:   { top: 0x4C5E90, left: 0x2C3E70, right: 0x1C2E60, outline: 0x0C1E50, height: 28, walkable: false },
      [TILE.CARPET]: { top: 0x2255AA, left: 0x113377, right: 0x081E58, outline: 0x040F38, height: 2, walkable: true },
    },
    archmage: {
      texture: 'npc-blue', name: 'Archmage Tidefall', col: 7, row: 2,
      tabColor: 0x1A4A90,
      dialog: [
        'The Tidefall Isles Club. Knowledge is the ultimate weapon.',
        'Card draw. Counter-spells. Control. We do not rush — we dominate.',
        'I am Archmage Tidefall. Your deck is an open book to me.',
      ],
      battle: { npcName: 'Archmage Tidefall', color: 'blue', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-fire-student',  col: 4,  row: 5,  name: 'Scholar Wavren',
        dialog: ['Card advantage wins games. The more you draw, the more options you have.'] },
      { texture: 'npc-water-student', col: 11, row: 5,  name: 'Scholar Tide',
        dialog: ['Flying creatures cross the isles where no others can follow.'] },
      { texture: 'npc-shadow-student',col: 4,  row: 8,  name: 'Archivist Brin',
        dialog: ['These tomes hold every counter-spell ever devised. Quite the collection.'] },
      { texture: 'npc-wind-student',  col: 11, row: 8,  name: 'Mage Frost',
        dialog: ['The Archmage once countered seven spells in a single turn. Seven!'] },
      { texture: 'npc-earth-student', col: 5,  row: 10, name: 'Apprentice Rill',
        dialog: ['I am still learning. But blue magic rewards patience above all else.'] },
      { texture: 'npc-fire-student',  col: 10, row: 10, name: 'Visitor Zel',
        dialog: ['I came to study their card draw. Red mages never draw quite enough...'] },
    ],
  },

  // ── BLACK: Shadowmere Bog Club ─────────────────────────────────────────────
  ClubBlack: {
    key: 'ClubBlack',
    name: 'SHADOWMERE BOG CLUB',
    palette: { tabColor: 0x4A1880 },
    isoOverrides: {
      [TILE.STONE]:  { top: 0x2A2038, left: 0x1E1628, right: 0x14101C, outline: 0x0A080E, height: 4, walkable: true },
      [TILE.WALL]:   { top: 0x3C2458, left: 0x280E3C, right: 0x180828, outline: 0x0A0418, height: 28, walkable: false },
      [TILE.CARPET]: { top: 0x7744BB, left: 0x5525A0, right: 0x3A0A90, outline: 0x280080, height: 2, walkable: true },
    },
    archmage: {
      texture: 'npc-black', name: 'Archmage Shadowmere', col: 7, row: 2,
      tabColor: 0x4A1880,
      dialog: [
        '...',
        'Shadowmere Bog. Where every creature ends up eventually.',
        'Power demands sacrifice. Are you willing to pay?',
      ],
      battle: { npcName: 'Archmage Shadowmere', color: 'black', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-shadow-student',col: 4,  row: 6,  name: 'Shade Morven',
        dialog: ['Every creature dies eventually. We just... accelerate the process.'] },
      { texture: 'npc-wind-student',  col: 11, row: 6,  name: 'Shade Nyxe',
        dialog: ['Power comes at a price. We are always willing to pay it.'] },
      { texture: 'npc-fire-student',  col: 4,  row: 9,  name: 'Shade Corvin',
        dialog: ['The strongest spells require sacrifice. Is that so different from anything else?'] },
      { texture: 'npc-water-student', col: 11, row: 9,  name: 'Shade Vex',
        dialog: ['Deathtouch. Any creature we touch dies. Think about that.'] },
    ],
  },

  // ── RED: Embercrest Peaks Club ─────────────────────────────────────────────
  ClubRed: {
    key: 'ClubRed',
    name: 'EMBERCREST PEAKS CLUB',
    palette: { tabColor: 0xA01800 },
    isoOverrides: {
      [TILE.STONE]:  { top: 0xECC8A8, left: 0xCCA888, right: 0xB08868, outline: 0x946848, height: 4, walkable: true },
      [TILE.WALL]:   { top: 0x804020, left: 0x602010, right: 0x480800, outline: 0x300400, height: 28, walkable: false },
      [TILE.CARPET]: { top: 0xCC3311, left: 0xAA1100, right: 0x880800, outline: 0x660000, height: 2, walkable: true },
    },
    archmage: {
      texture: 'npc-red', name: 'Archmage Embercrest', col: 7, row: 2,
      tabColor: 0xA01800,
      dialog: [
        'EMBERCREST PEAKS! We do not wait — we STRIKE!',
        'Haste. Direct damage. First strike. Speed wins everything.',
        'Challenge me RIGHT NOW! I have been waiting!',
      ],
      battle: { npcName: 'Archmage Embercrest', color: 'red', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-fire-student',  col: 4,  row: 5,  name: 'Knight Blazer',
        dialog: ['ATTACK! ALWAYS ATTACK! Defense is for cowards!'] },
      { texture: 'npc-wind-student',  col: 11, row: 5,  name: 'Knight Cinder',
        dialog: ['Lightning Bolt can win games before they even start. Watch!'] },
      { texture: 'npc-water-student', col: 5,  row: 7,  name: 'Fighter Sear',
        dialog: ['Speed beats everything. By the time they react, we have already won!'] },
      { texture: 'npc-earth-student', col: 10, row: 7,  name: 'Fighter Torch',
        dialog: ['Haste creatures! Play them on your turn, swing immediately!'] },
      { texture: 'npc-fire-student',  col: 4,  row: 10, name: 'Warrior Fenn',
        dialog: ['The Archmage burned through a 20-health opponent in TWO turns. Two!'] },
      { texture: 'npc-shadow-student',col: 11, row: 10, name: 'Warrior Ash',
        dialog: ['Direct damage to the face. Ignore their creatures. Go for the win!'] },
    ],
  },

  // ── GREEN: Thornveil Woods Club ────────────────────────────────────────────
  ClubGreen: {
    key: 'ClubGreen',
    name: 'THORNVEIL WOODS CLUB',
    palette: { tabColor: 0x186018 },
    isoOverrides: {
      [TILE.STONE]:  { top: 0xB8D898, left: 0x98B878, right: 0x7A9860, outline: 0x5C7848, height: 4, walkable: true },
      [TILE.WALL]:   { top: 0x5A4020, left: 0x3A2810, right: 0x2A1808, outline: 0x180800, height: 28, walkable: false },
      [TILE.CARPET]: { top: 0x2A8A22, left: 0x186A12, right: 0x0A580A, outline: 0x044004, height: 2, walkable: true },
    },
    archmage: {
      texture: 'npc-green', name: 'Archmage Thornveil', col: 7, row: 2,
      tabColor: 0x186018,
      dialog: [
        'Thornveil Woods Club. The ancient forest welcomes all travelers.',
        'More mana, more creatures, more power. Nature does not rush — it overwhelms.',
        'Let the wilds decide our contest, challenger.',
      ],
      battle: { npcName: 'Archmage Thornveil', color: 'green', deckType: 'archmage', reward: 100, archmage: true },
    },
    members: [
      { texture: 'npc-earth-student', col: 4,  row: 5,  name: 'Ranger Vine',
        dialog: ['Size matters in the woods. My 8/8 trampler proves it every time.'] },
      { texture: 'npc-wind-student',  col: 11, row: 5,  name: 'Ranger Moss',
        dialog: ['More lands means more mana means bigger creatures. Simple forest math.'] },
      { texture: 'npc-fire-student',  col: 4,  row: 8,  name: 'Druid Bark',
        dialog: ['Reach lets our creatures swat those pesky flyers right out of the sky.'] },
      { texture: 'npc-water-student', col: 11, row: 8,  name: 'Druid Fern',
        dialog: ['The ancient forests grant strength beyond any other guild. Feel it?'] },
      { texture: 'npc-earth-student', col: 4,  row: 10, name: 'Scout Twig',
        dialog: ['I patrol the border between the woods and the portal.'] },
      { texture: 'npc-shadow-student',col: 11, row: 10, name: 'Scout Root',
        dialog: ['Trample through everything. Leave nothing standing in your path!'] },
    ],
  },
}

// ── ClubScene base class ───────────────────────────────────────────────────────

class ClubScene extends Phaser.Scene {
  constructor(cfg) {
    super(cfg.key)
    this.cfg          = cfg
    this.playerSprite = null
    this.playerGrid   = null
    this.isMoving     = false
    this.transitioning= false
    this.npcs         = []
    this.dialogState  = null
    this.promptLabel  = null
    this.statsText    = null
    this.cursors      = null
    this.wasd         = null
    this.eKey         = null
  }

  init() {
    this.playerGrid   = { col: 7, row: 9 }
    this.isMoving     = false
    this.transitioning= false
    this.dialogState  = null
    this.npcs         = []
  }

  create() {
    const sw = this.scale.width, sh = this.scale.height
    // Flat grid — 50×50 tiles fill the screen exactly (800/16 × 600/12)
    this.TW = Math.floor(sw / CLUB_COLS)
    this.TH = Math.floor(sh / CLUB_ROWS)

    const bgKey = 'club-' + this.cfg.key.replace('Club', '').toLowerCase() + '-bg'
    this.add.image(sw / 2, sh / 2, bgKey).setDisplaySize(sw, sh).setDepth(-2)

    this._addClubLabel()
    this.createPlayer()
    this.createNPCs()
    this.startNPCBehaviors()
    this.setupCamera()
    this.setupInput()
    this.createUI()
  }

  // ── Club name label (top-center, world space) ──────────────────────────────

  _g2s(col, row) { return { x: col * this.TW + this.TW / 2, y: row * this.TH + this.TH / 2 } }
  _depth(row)    { return row * this.TH }
  _walkable(col, row) {
    if (col < 0 || row < 0 || col >= CLUB_COLS || row >= CLUB_ROWS) return false
    return (CLUB_MAP[row]?.[col] ?? WL) !== WL
  }
  _tileAt(col, row) { return CLUB_MAP[row]?.[col] ?? WL }

  _addClubLabel() {
    const pos = this._g2s(7, 0)
    this.add.text(pos.x, pos.y - 20, this.cfg.name, {
      fontSize: '10px', color: '#D4AF37', fontFamily: 'Courier New, monospace',
      stroke: '#000000', strokeThickness: 2, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(200)
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  createPlayer() {
    const pos = this._g2s(this.playerGrid.col, this.playerGrid.row)
    this.playerSprite = this.add.sprite(pos.x, pos.y, 'player').setOrigin(0.5, 1)
    const psrc = this.textures.get('player').getSourceImage()
    if (psrc && psrc.height > 0) this.playerSprite.setDisplaySize(psrc.width * 64 / psrc.height, 64)
    this.playerSprite.setDepth(this._depth(this.playerGrid.row) + 1)
  }

  // ── NPCs ───────────────────────────────────────────────────────────────────

  createNPCs() {
    const { archmage, members } = this.cfg
    this.npcs = []

    const addNPC = def => {
      const pos = this._g2s(def.col, def.row)
      const sprite = this.add.sprite(pos.x, pos.y, def.texture).setOrigin(0.5, 1)
      const src = this.textures.get(def.texture).getSourceImage()
      if (src && src.height > 0) sprite.setDisplaySize(src.width * 64 / src.height, 64)
      sprite.setDepth(this._depth(def.row) + 1)
      this.npcs.push({ def, sprite })
    }

    addNPC(archmage)
    for (const m of members) addNPC(m)
  }

  startNPCBehaviors() {
    const members = this.npcs.slice(1)  // skip archmage
    members.forEach((npc, i) => {
      const base = { targets: npc.sprite, repeat: -1, yoyo: true }
      if (i % 3 === 0) {
        this.tweens.add({ ...base, y: npc.sprite.y - 5, duration: 3200 + i * 400, ease: 'Linear' })
      } else if (i % 3 === 1) {
        this.tweens.add({ ...base, x: npc.sprite.x + 4, duration: 1000 + i * 200, ease: 'Sine.easeInOut' })
      } else {
        this.tweens.add({ ...base, y: npc.sprite.y + 4, duration: 700 + i * 150, ease: 'Sine.easeInOut' })
      }
    })
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  setupCamera() {
    const sw = this.scale.width, sh = this.scale.height
    this.cameras.main.setBounds(0, 0, sw, sh)
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor(0x0E0A08)
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  setupInput() {
    this.input.keyboard.disableGlobalCapture()
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
    this.statsText?.setText(`${hearts}  ◆ ${gold}  ${sealStr}`)
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
    const tabColor = npc.def.tabColor || this.cfg.palette.tabColor || 0x4878C8
    bg.fillStyle(tabColor)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
    bg.lineStyle(2, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
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

  // ── Input handlers ─────────────────────────────────────────────────────────

  onEPress() {
    if (this.dialogState) { this.advanceDialog(); return }
    const nearby = this.getNearby()
    if (nearby) this.openDialog(nearby)
  }

  isNPCAt(col, row) {
    return this.npcs.some(n => n.def.col === col && n.def.row === row)
  }

  getNearby() {
    const { col: pc, row: pr } = this.playerGrid
    for (const npc of this.npcs) {
      const dc = Math.abs(npc.def.col - pc)
      const dr = Math.abs(npc.def.row - pr)
      if (dc <= 1 && dr <= 1 && (dc + dr) > 0) return npc
    }
    return null
  }

  // ── Movement ───────────────────────────────────────────────────────────────

  movePlayer(newCol, newRow) {
    this.isMoving = true
    this.playerGrid.col = newCol
    this.playerGrid.row = newRow
    const pos = this._g2s(newCol, newRow)
    const newDepth = this._depth(newRow) + 1
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

  checkPortal(col, row) {
    if (this.transitioning || this.dialogState) return
    if (this._tileAt(col, row) !== TILE.DOOR) return
    this.transitioning = true
    SoundEngine.sceneTransition()
    this.cameras.main.fadeOut(400, 16, 48, 88)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      SoundEngine.stopBGM()
      this.scene.start('WorldMap')
    })
  }

  updatePrompt() {
    const nearby = this.getNearby()
    if (nearby && !this.dialogState) {
      const label = nearby.def.battle ? '[E] Duel' : '[E] Talk'
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
        if (this._walkable(nc, nr) && !this.isNPCAt(nc, nr)) {
          this.movePlayer(nc, nr)
        } else {
          SoundEngine.bump()
        }
      }
    }

    this.updatePrompt()
    this.updateStats()
  }
}

// ── Export: one subclass per club, same pattern as before ─────────────────────
export const clubScenes = Object.values(CONFIGS).map(cfg =>
  class extends ClubScene {
    constructor() { super(cfg) }
  }
)
