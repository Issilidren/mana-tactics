import Phaser from 'phaser'
import { SoundEngine } from '../systems/SoundEngine.js'

const TILE = 32
const COLS = 25
const ROWS = 18

// prettier-ignore
const MAP = [
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 0 top wall — solid (no exit upward)
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 1
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 2
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 3
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 4
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 5
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 6
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 7
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 8  right wall gap handled by trigger
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 9
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 10
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 11
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 12
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 13
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 14
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 15
  'WFFFFFFFFFFFFFFFFFFFFFFFFW', // 16
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 17 bottom wall — solid
]

const NPC_DEFS = [
  {
    key: 'archivist',
    texture: 'npc-librarian',
    tileX: 5, tileY: 5,
    tabColor: 0x7A5030,
    name: 'Archivist Solan',
    dialog: [
      'Ah, a student who reads. Rare, these days.',
      'These archives hold records of every duel fought in the Academy — back five hundred years.',
      'Each color has a different philosophy. White preserves order. Black pursues power. Red burns everything equally.',
      'Study them all. The Archmages test not just your deck, but your understanding.',
    ],
    battle: null,
  },
  {
    key: 'practice-vara',
    texture: 'npc-white',
    tileX: 19, tileY: 5,
    tabColor: 0x9A7830,
    name: 'Duelist Vara',
    dialog: [
      'The archives are no place for idle browsing. I train here every day.',
      'If you want to understand white mana, fight someone who uses it. En garde.',
    ],
    battle: { npcName: 'Duelist Vara', color: 'white', deckType: 'white', reward: 15 },
  },
  {
    key: 'rune-vendor',
    texture: 'npc-merchant',
    tileX: 12, tileY: 13,
    tabColor: 0xC8961E,
    name: 'Rune Merchant Osse',
    dialog: [
      'The Academy lets me set up shop in the archives. Academics are terrible with gold.',
      'I have booster packs — rarer cards pulled from the deep collection.',
      'Fifty gold. First rule of mana: always be expanding your options.',
    ],
    shop: true,
  },
]

export default class ArchivesScene extends Phaser.Scene {
  constructor() {
    super('Archives')
    this.player = null
    this.cursors = null
    this.wasd = null
    this.npcs = []
    this.dialogState = null
    this.promptLabel = null
    this.eKey = null
    this.rightPassageBounds = null
    this.statsText = null
    this.transitioning = false
  }

  create() {
    this.transitioning = false
    const walkable = this.buildWalkableMap()
    this.drawMap(walkable)
    this.createPlayer()
    this.createNPCs()
    this.setupCamera()
    this.setupInput()
    this.createUI()
    this.startNPCBehaviors()
  }

  buildWalkableMap() {
    const grid = []
    for (let r = 0; r < ROWS; r++) {
      grid[r] = []
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = (MAP[r]?.[c] ?? 'W') !== 'W'
      }
    }
    return grid
  }

  drawMap(walkable) {
    this.wallGroup = this.physics.add.staticGroup()

    const bg = this.add.image(400, 300, 'archives-bg').setDisplaySize(800, 600).setDepth(0)

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!walkable[r][c]) {
          // Skip right wall rows 8-10 — passage to Hub (no physics wall there)
          if (c === COLS - 1 && r >= 8 && r <= 10) continue
          const x = c * TILE + TILE / 2
          const y = r * TILE + TILE / 2
          const wall = this.wallGroup.create(x, y, 'tile-wall')
          wall.setAlpha(0)
          wall.setOrigin(0.5, 0.5)
          wall.refreshBody()
        }
      }
    }

    // Right passage trigger — exit to Hub (rows 8-10, right edge)
    this.rightPassageBounds = new Phaser.Geom.Rectangle(750, 262, 50, 80)
  }

  createPlayer() {
    // Spawn on right side — player entered from Hub's left passage
    const startX = (COLS - 3) * TILE + TILE / 2   // col 22 center
    const startY = 9 * TILE + TILE / 2             // row 9 center
    this.player = this.physics.add.sprite(startX, startY, 'player')
    this.player.setScale(72 / this.player.height)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
    this.player.body.setSize(12, 14)
    this.player.body.setOffset(2, 10)
    this.physics.add.collider(this.player, this.wallGroup, () => {
      SoundEngine.bump()
    })
  }

  createNPCs() {
    this.npcs = []
    for (const def of NPC_DEFS) {
      const x = def.tileX * TILE + TILE / 2
      const y = def.tileY * TILE + TILE / 2
      const sprite = this.physics.add.sprite(x, y, def.texture).setDepth(9)
      sprite.setScale(64 / sprite.height)
      sprite.body.setImmovable(true)
      sprite.body.setSize(20, 22)
      sprite.body.setOffset(2, 5)
      this.physics.add.collider(this.player, sprite)
      this.npcs.push({ def, sprite })
    }
  }

  startNPCBehaviors() {
    for (const npc of this.npcs) {
      if (npc.def.key === 'archivist') {
        this.tweens.add({ targets: npc.sprite, y: npc.sprite.y + 3, duration: 1200,
          ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
      } else if (npc.def.key === 'rune-vendor') {
        this.tweens.add({ targets: npc.sprite, x: npc.sprite.x + 5, duration: 1600,
          ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
      }
    }
  }

  setupCamera() {
    const mapW = COLS * TILE
    const mapH = ROWS * TILE
    this.physics.world.setBounds(0, 0, mapW, mapH)
    this.cameras.main.setBounds(0, 0, mapW, mapH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor(0x3A1E0A)
  }

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
    SoundEngine.startBGM('archives')
  }

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

    // Scene label — repositioned below expanded bar
    this.add.text(COLS * TILE / 2, 12, '— THE ARCHIVES —', {
      fontSize: '11px', color: '#C8961E', fontFamily: 'Courier New, monospace',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(22)

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
    const gold = this.registry.get('gold') ?? 0
    const seals = this.registry.get('seals') ?? []
    const hp = this.registry.get('hp') ?? 10
    const hpFull = Math.min(hp, 5)
    const hpEmpty = Math.max(0, 5 - hpFull)
    this.statsText.setText(
      `${'❤'.repeat(hpFull)}${'♡'.repeat(hpEmpty)}  ◆ ${gold}  ${'★'.repeat(seals.length)}${'☆'.repeat(5 - seals.length)}`
    )
  }

  openDialog(npc) {
    if (this.dialogState) return

    const camX = this.cameras.main.scrollX
    const camY = this.cameras.main.scrollY
    const BOX_X = camX + 20
    const BOX_Y = camY + 414
    const BOX_W = COLS * TILE - 40
    const BOX_H = 150
    const PORT_W = 70

    const bg = this.add.graphics().setDepth(50)
    bg.fillStyle(0xFEFAF0)
    bg.fillRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(3, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(1, 0xA88860, 0.3)
    bg.strokeRoundedRect(BOX_X + 5, BOX_Y + 5, BOX_W - 10, BOX_H - 10, 6)

    const tabColor = npc.def.tabColor || 0x4878C8
    bg.fillStyle(tabColor)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
    bg.lineStyle(2, 0x2A1808, 1)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })

    bg.fillStyle(0xE8DFC8)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)
    bg.lineStyle(1, 0x9A8060, 0.7)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)

    const portrait = this.add.sprite(
      BOX_X + PORT_W / 2 + 8, BOX_Y + BOX_H / 2, npc.def.texture
    ).setDepth(52)
    portrait.setScale(56 / portrait.width)

    const nameText = this.add.text(BOX_X + 16, BOX_Y - 14, npc.def.name, {
      fontSize: '12px', color: '#FFFFFF', fontFamily: '"Arial", sans-serif',
      fontStyle: 'bold', stroke: '#2A1808', strokeThickness: 2,
    }).setDepth(53)

    const bodyText = this.add.text(BOX_X + PORT_W + 22, BOX_Y + 20, '', {
      fontSize: '13px', color: '#18100A', fontFamily: '"Arial", sans-serif',
      wordWrap: { width: BOX_W - PORT_W - 30 }, lineSpacing: 5,
    }).setDepth(52)

    const hint = this.add.text(BOX_X + BOX_W - 20, BOX_Y + BOX_H - 12, '[E] ▼', {
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
        this.time.delayedCall(100, () => {
          this.game.events.emit('battleStart', npc.def.battle)
        })
      } else if (npc.def.shop) {
        this.time.delayedCall(100, () => {
          this.game.events.emit('shopOpen')
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

  onEPress() {
    if (this.dialogState) { this.advanceDialog(); return }
    const nearby = this.getNearbyNPC()
    if (nearby) this.openDialog(nearby)
  }

  getNearbyNPC() {
    const px = this.player.x, py = this.player.y
    for (const npc of this.npcs) {
      const dx = npc.sprite.x - px, dy = npc.sprite.y - py
      if (Math.sqrt(dx*dx + dy*dy) < 52) return npc
    }
    return null
  }

  update() {
    if (!this.player) return
    this.handleMovement()
    this.updateNPCPrompts()
    this.checkRightPassage()
    this.updateStats()
  }

  handleMovement() {
    if (this.dialogState || this.transitioning) {
      this.player.setVelocity(0, 0); return
    }
    const SPEED = 160
    let vx = 0, vy = 0
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -SPEED
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx = SPEED
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -SPEED
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy = SPEED
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707 }
    this.player.setVelocity(vx, vy)
    if (vx < 0) this.player.setFlipX(true)
    else if (vx > 0) this.player.setFlipX(false)
  }

  updateNPCPrompts() {
    const nearby = this.getNearbyNPC()
    if (nearby && !this.dialogState) {
      const label = nearby.def.battle ? '[E] Duel' : nearby.def.shop ? '[E] Shop' : '[E] Talk'
      this.promptLabel.setText(label)
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(
        nearby.sprite.x - this.promptLabel.width / 2,
        nearby.sprite.y - 36,
      )
    } else if (this.rightPassageBounds?.contains(this.player.x, this.player.y) && !this.dialogState) {
      this.promptLabel.setText('[→] Hub')
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(W - 60, 9 * TILE + 16)
    } else {
      this.promptLabel.setVisible(false)
    }
  }

  checkRightPassage() {
    if (this.dialogState || this.transitioning) return
    const rb = this.rightPassageBounds
    if (rb && rb.contains(this.player.x, this.player.y)) {
      this.transitioning = true
      this.player.setVelocity(0, 0)
      this.cameras.main.fadeOut(400, 16, 48, 88)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundEngine.stopBGM(); this.scene.start('Hub')
      })
    }
  }
}

// Standalone scene export (registered in index.js)
export { ArchivesScene }
