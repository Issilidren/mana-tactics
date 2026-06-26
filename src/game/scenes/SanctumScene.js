import Phaser from 'phaser'
import { SoundEngine } from '../systems/SoundEngine.js'

const TILE = 32
const COLS = 25
const ROWS = 18

// Oracle Vault — sealed inner sanctum above the Hub.
// Accessible only after collecting all 5 Archmage Seals.
// Three legendary champions wait here for a final invitation duel.
// prettier-ignore
const MAP = [
  'WWWWWWWWWWWWWWWWWWWWWWWWW', // 0 top wall — sealed
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
  'WWWWWWWWWWWFFFWWWWWWWWWWW', // 17 — gap at cols 11-13 (exit back to Hub)
]

const NPC_DEFS = [
  {
    key: 'tasklet',
    texture: 'npc-tasklet',
    tileX: 6, tileY: 8,
    tabColor: 0x1A9060,
    name: 'Archon Tasklet',
    dialog: [
      'So... you have gathered all five seals.',
      'I have watched you from the beginning. Every stumble. Every comeback.',
      'The Academy tests knowledge. I test will. En garde — give me everything you have left.',
    ],
    battle: { npcName: 'Instructor Tasklet', color: 'blue', deckType: 'blue', reward: 100, difficulty: 'hard' },
  },
  {
    key: 'gemini',
    texture: 'npc-gemini',
    tileX: 12, tileY: 5,
    tabColor: 0x4444BB,
    name: 'Sage Gemini',
    dialog: [
      'Five seals. I have researched every student who achieved this.',
      'You are, statistically, an anomaly.',
      'I accept your presence here as a data point worth... exploring. Shall we?',
    ],
    battle: { npcName: 'Arcanist Gemini', color: 'white', deckType: 'white', reward: 100, difficulty: 'hard' },
  },
  {
    key: 'claude',
    texture: 'npc-claude',
    tileX: 18, tileY: 8,
    tabColor: 0xCC6010,
    name: 'Artificer Claude',
    dialog: [
      'I have been hoping you would make it here.',
      'There is much I could say about your journey. But words are better earned through action.',
      'One final duel — not to judge you, but to celebrate how far you have come.',
    ],
    battle: { npcName: 'Scholar Claude', color: 'green', deckType: 'green', reward: 100, difficulty: 'hard' },
  },
]

export default class SanctumScene extends Phaser.Scene {
  constructor() {
    super('Sanctum')
    this.player       = null
    this.cursors      = null
    this.wasd         = null
    this.npcs         = []
    this.dialogState  = null
    this.promptLabel  = null
    this.eKey         = null
    this.exitBounds   = null
    this.statsText    = null
    this.transitioning = false
  }

  create() {
    this.transitioning = false
    this.drawMap()
    this.drawVaultDecor()
    this.createPlayer()
    this.createNPCs()
    this.setupCamera()
    this.setupInput()
    this.createUI()
    this.startNPCBehaviors()
    this.cameras.main.fadeIn(600, 4, 2, 8)
  }

  // ── Map ───────────────────────────────────────────────────────────────────

  drawMap() {
    this.add.image(400, 300, 'oracle-vault-bg').setDisplaySize(800, 600).setDepth(0)

    this.wallGroup = this.physics.add.staticGroup()
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if ((MAP[r]?.[c] ?? 'W') !== 'W') continue
        // Skip the bottom-center exit gap (cols 11-13, row 17)
        if (r === ROWS - 1 && c >= 11 && c <= 13) continue
        const x = c * TILE + TILE / 2
        const y = r * TILE + TILE / 2
        const wall = this.wallGroup.create(x, y, null)
        wall.body.setSize(TILE, TILE)
        wall.setVisible(false)
      }
    }

    // Exit trigger at bottom-center gap (back to Hub)
    this.exitBounds = new Phaser.Geom.Rectangle(344, 17 * TILE, 96, TILE + 8)

    // "← HUB" label above exit
    this.add.text(400, 17 * TILE - 2, '↓ HUB', {
      fontSize: '10px', color: '#D4AF37',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(3)
  }

  // ── Vault decorations (drawn over the background) ─────────────────────────

  drawVaultDecor() {
    const g = this.add.graphics().setDepth(2)

    // Central seal mosaic on floor — gold ring with 5 star points
    const cx = 12 * TILE + TILE / 2   // 400
    const cy = 11 * TILE + TILE / 2   // 368

    g.fillStyle(0x000000, 0.22)
    g.fillEllipse(cx + 3, cy + 3, 88, 24)

    g.lineStyle(2, 0xD4AF37, 0.7)
    g.strokeCircle(cx, cy, 42)
    g.lineStyle(1, 0xA88860, 0.4)
    g.strokeCircle(cx, cy, 36)

    g.fillStyle(0xD4AF37, 0.2)
    g.fillCircle(cx, cy, 36)

    // 5-point star (each point corresponds to a seal)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2
      const ox = cx + Math.cos(a) * 34
      const oy = cy + Math.sin(a) * 34
      g.fillStyle(0xFFD700, 0.85)
      g.fillCircle(ox, oy, 5)
    }

    g.fillStyle(0xFFD700, 0.5)
    g.fillCircle(cx, cy, 10)

    // Three NPC drop shadows — painted before NPCs are created
    for (const def of NPC_DEFS) {
      const nx = def.tileX * TILE + TILE / 2
      const ny = def.tileY * TILE + TILE / 2 + 32  // foot position
      g.fillStyle(0x000000, 0.35)
      g.fillEllipse(nx, ny, 36, 10)
    }
  }

  // ── Player ────────────────────────────────────────────────────────────────

  createPlayer() {
    // Player enters from Hub via the top passage — spawns near bottom
    const startX = 12 * TILE + TILE / 2   // col 12 center = 400
    const startY = 15 * TILE + TILE / 2   // row 15 = 496
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

  // ── NPCs ──────────────────────────────────────────────────────────────────

  createNPCs() {
    this.npcs = []
    for (const def of NPC_DEFS) {
      const x = def.tileX * TILE + TILE / 2
      const y = def.tileY * TILE + TILE / 2
      const sprite = this.physics.add.sprite(x, y, def.texture)
      sprite.setScale(64 / sprite.height)
      sprite.setDepth(9)
      sprite.setImmovable(true)
      sprite.body.moves = false
      sprite.body.setSize(20, 22)
      sprite.body.setOffset(2, 5)
      this.physics.add.collider(this.player, sprite)
      this.npcs.push({ def, sprite })
    }
  }

  startNPCBehaviors() {
    for (const npc of this.npcs) {
      if (npc.def.key === 'gemini') {
        // Center NPC — gentle hover bob
        this.tweens.add({
          targets: npc.sprite, y: npc.sprite.y - 5,
          duration: 1800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      } else if (npc.def.key === 'tasklet') {
        this.tweens.add({
          targets: npc.sprite, x: npc.sprite.x + 4,
          duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      } else if (npc.def.key === 'claude') {
        this.tweens.add({
          targets: npc.sprite, x: npc.sprite.x - 4,
          duration: 1600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
        })
      }
    }
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  setupCamera() {
    const mapW = COLS * TILE
    const mapH = ROWS * TILE
    this.physics.world.setBounds(0, 0, mapW, mapH)
    this.cameras.main.setBounds(0, 0, mapW, mapH)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBackgroundColor(0x04020E)
  }

  // ── Input ─────────────────────────────────────────────────────────────────

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
    SoundEngine.startBGM('archives')  // use archives BGM until sanctum track added
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  createUI() {
    const barBg = this.add.graphics().setScrollFactor(0).setDepth(20)
    barBg.fillStyle(0x04020E)
    barBg.fillRect(0, 0, COLS * TILE, 32)
    barBg.lineStyle(1, 0x301840, 1)
    barBg.lineBetween(0, 31, COLS * TILE, 31)
    barBg.lineStyle(1, 0xD4AF37, 1)
    barBg.lineBetween(0, 32, COLS * TILE, 32)

    const tokenBg = this.add.graphics().setScrollFactor(0).setDepth(21)
    tokenBg.fillStyle(0x04020E)
    tokenBg.fillRect(4, 4, 210, 24)
    tokenBg.lineStyle(1, 0xD4AF37, 0.7)
    tokenBg.strokeRect(4, 4, 210, 24)

    this.statsText = this.add.text(10, 8, '', {
      fontSize: '11px', color: '#F0EED8', fontFamily: 'Courier New, monospace',
    }).setScrollFactor(0).setDepth(22)

    this.updateStats()

    this.promptLabel = this.add.text(0, 0, '[E] Duel', {
      fontSize: '10px', color: '#101010', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#F0EED8', padding: { x: 5, y: 2 },
    }).setDepth(30).setVisible(false)

    this.add.text(COLS * TILE / 2, 12, '— ORACLE SANCTUM —', {
      fontSize: '11px', color: '#D4AF37', fontFamily: 'Courier New, monospace',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(22)

    this._drawCompassRose()
  }

  _drawCompassRose() {
    const CR = this.add.graphics().setScrollFactor(0).setDepth(28)
    const crx = 24, cry = 552, R = 18
    CR.fillStyle(0x04020E, 0.9)
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
    const hpEmpty = Math.max(0, 5 - hpFull)
    this.statsText.setText(
      `${'❤'.repeat(hpFull)}${'♡'.repeat(hpEmpty)}  ◆ ${gold}  ${'★'.repeat(seals.length)}${'☆'.repeat(5 - seals.length)}`
    )
  }

  // ── Dialog ────────────────────────────────────────────────────────────────

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
    bg.fillStyle(0x0A0420)
    bg.fillRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(3, 0xD4AF37, 1)
    bg.strokeRoundedRect(BOX_X, BOX_Y, BOX_W, BOX_H, 8)
    bg.lineStyle(1, 0x7050A8, 0.5)
    bg.strokeRoundedRect(BOX_X + 5, BOX_Y + 5, BOX_W - 10, BOX_H - 10, 6)

    const tabColor = npc.def.tabColor || 0x4878C8
    bg.fillStyle(tabColor)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })
    bg.lineStyle(2, 0xD4AF37, 1)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y - 22, 160, 26, { tl: 6, tr: 6, bl: 0, br: 0 })

    bg.fillStyle(0x0C0828)
    bg.fillRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)
    bg.lineStyle(1, 0xD4AF37, 0.5)
    bg.strokeRoundedRect(BOX_X + 8, BOX_Y + 8, PORT_W, BOX_H - 16, 6)

    const portrait = this.add.sprite(
      BOX_X + PORT_W / 2 + 8, BOX_Y + BOX_H / 2, npc.def.texture
    ).setDepth(52)
    portrait.setScale(56 / portrait.width)

    const nameText = this.add.text(BOX_X + 16, BOX_Y - 14, npc.def.name, {
      fontSize: '12px', color: '#FFE87A', fontFamily: '"Arial", sans-serif',
      fontStyle: 'bold', stroke: '#04020E', strokeThickness: 2,
    }).setDepth(53)

    const bodyText = this.add.text(BOX_X + PORT_W + 22, BOX_Y + 20, '', {
      fontSize: '13px', color: '#E8E0F4', fontFamily: '"Arial", sans-serif',
      wordWrap: { width: BOX_W - PORT_W - 30 }, lineSpacing: 5,
    }).setDepth(52)

    const hint = this.add.text(BOX_X + BOX_W - 20, BOX_Y + BOX_H - 12, '[E] ▼', {
      fontSize: '11px', color: '#D4AF37', fontFamily: '"Arial", sans-serif',
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
      }
    }
  }

  closeDialog() {
    if (!this.dialogState) return
    const { bg, nameText, bodyText, hint, portrait } = this.dialogState
    bg.destroy(); nameText.destroy(); bodyText.destroy(); hint.destroy(); portrait.destroy()
    this.dialogState = null
  }

  // ── Input handler ─────────────────────────────────────────────────────────

  onEPress() {
    if (this.dialogState) { this.advanceDialog(); return }
    const nearby = this.getNearbyNPC()
    if (nearby) this.openDialog(nearby)
  }

  getNearbyNPC() {
    const px = this.player.x, py = this.player.y
    for (const npc of this.npcs) {
      const dx = npc.sprite.x - px, dy = npc.sprite.y - py
      if (Math.sqrt(dx * dx + dy * dy) < 52) return npc
    }
    return null
  }

  // ── Update ────────────────────────────────────────────────────────────────

  update() {
    if (!this.player) return
    this.handleMovement()
    this.updateNPCPrompts()
    this.checkExit()
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
      this.promptLabel.setText('[E] Duel')
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(
        nearby.sprite.x - this.promptLabel.width / 2,
        nearby.sprite.y - 36,
      )
    } else if (this.exitBounds?.contains(this.player.x, this.player.y) && !this.dialogState) {
      this.promptLabel.setText('[↓] Hub')
      this.promptLabel.setVisible(true)
      this.promptLabel.setPosition(
        400 - this.promptLabel.width / 2,
        17 * TILE - 16,
      )
    } else {
      this.promptLabel.setVisible(false)
    }
  }

  checkExit() {
    if (this.dialogState || this.transitioning) return
    const eb = this.exitBounds
    if (eb && eb.contains(this.player.x, this.player.y)) {
      this.transitioning = true
      this.player.setVelocity(0, 0)
      this.cameras.main.fadeOut(400, 4, 2, 8)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        SoundEngine.stopBGM()
        this.scene.start('Hub')
      })
    }
  }
}
