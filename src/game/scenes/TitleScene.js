import Phaser from 'phaser'

const COLORS = [
  { hex: 0xF5F0E1, label: '⚪' },
  { hex: 0x1A3A5C, label: '🔵' },
  { hex: 0x1C1C2E, label: '⚫' },
  { hex: 0x8B0000, label: '🔴' },
  { hex: 0x2E5A1E, label: '🟢' },
]

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title')
  }

  create() {
    const W = 800, H = 600
    this.cameras.main.setBackgroundColor(0x080510)
    this.cameras.main.fadeIn(1200, 8, 5, 16)

    this.drawStars(W, H)
    this.drawNebula(W, H)
    this.drawTitlePanel(W, H)
    this.drawColorOrbs(W, H)
    this.drawPressAnyKey(W, H)
    this.setupInput()
  }

  drawStars(W, H) {
    const g = this.add.graphics()
    // Use deterministic positions so they look intentional
    const positions = [
      [42,18],[170,55],[310,22],[480,38],[620,14],[750,60],
      [90,100],[240,88],[390,110],[550,75],[710,95],[780,130],
      [30,180],[160,155],[320,200],[500,165],[670,188],[760,210],
      [80,260],[220,280],[400,245],[560,270],[700,255],[790,290],
      [50,340],[190,360],[370,330],[530,350],[690,335],[770,370],
      [110,420],[270,440],[440,410],[600,430],[740,415],
      [60,490],[200,510],[370,480],[530,500],[690,485],[760,520],
      [130,560],[290,575],[460,555],[620,570],[750,560],
    ]
    for (const [x, y] of positions) {
      const bright = ((x * 7 + y * 13) % 3)
      const alpha = bright === 0 ? 0.9 : bright === 1 ? 0.55 : 0.3
      const size  = bright === 0 ? 1.5 : 1
      g.fillStyle(0xFFFFFF, alpha)
      g.fillCircle(x, y, size)
    }
  }

  drawNebula(W, H) {
    const g = this.add.graphics().setDepth(0)
    // Soft color washes behind the title
    g.fillStyle(0x1A0A2E, 0.6)
    g.fillEllipse(W / 2, H / 2 - 20, 560, 300)
    g.fillStyle(0x0A1828, 0.4)
    g.fillEllipse(W / 2 + 60, H / 2 + 40, 400, 200)
    g.fillStyle(0x200A18, 0.3)
    g.fillEllipse(W / 2 - 80, H / 2 + 30, 360, 180)
  }

  drawTitlePanel(W, H) {
    const cx = W / 2
    const panelY = H / 2 - 80

    // Outer glow ring
    const glow = this.add.graphics().setDepth(1)
    glow.lineStyle(20, 0xD4AF37, 0.06)
    glow.strokeRoundedRect(cx - 280, panelY - 70, 560, 180, 16)
    glow.lineStyle(8, 0xD4AF37, 0.12)
    glow.strokeRoundedRect(cx - 280, panelY - 70, 560, 180, 16)

    // Panel background
    const bg = this.add.graphics().setDepth(2)
    bg.fillStyle(0x0D0818, 0.88)
    bg.fillRoundedRect(cx - 276, panelY - 66, 552, 172, 14)
    bg.lineStyle(2, 0xD4AF37, 0.7)
    bg.strokeRoundedRect(cx - 276, panelY - 66, 552, 172, 14)
    bg.lineStyle(1, 0xD4AF37, 0.25)
    bg.strokeRoundedRect(cx - 270, panelY - 60, 540, 160, 12)

    // Corner ornaments
    const orn = this.add.graphics().setDepth(3)
    orn.fillStyle(0xD4AF37, 0.8)
    for (const [ox, oy] of [
      [cx - 276, panelY - 66],
      [cx + 276, panelY - 66],
      [cx - 276, panelY + 106],
      [cx + 276, panelY + 106],
    ]) {
      orn.fillCircle(ox, oy, 5)
    }

    // "MANA TACTICS" title
    this.add.text(cx, panelY - 20, 'MANA TACTICS', {
      fontSize: '52px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#D4AF37',
      stroke: '#3A1A00',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 8, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(4)

    // Divider line
    const div = this.add.graphics().setDepth(4)
    div.lineStyle(1, 0xD4AF37, 0.5)
    div.lineBetween(cx - 180, panelY + 22, cx + 180, panelY + 22)
    div.fillStyle(0xD4AF37, 0.8)
    div.fillCircle(cx, panelY + 22, 3)

    // Subtitle
    this.add.text(cx, panelY + 46, "A Planeswalker's Journey", {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      color: '#C8A878',
    }).setOrigin(0.5, 0.5).setDepth(4)
  }

  drawColorOrbs(W, H) {
    const cy = H / 2 + 110
    const spacing = 72
    const startX = W / 2 - spacing * 2

    const names = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest']
    const colors = [0xF0E8C8, 0x2266AA, 0x3A2A5A, 0xAA2200, 0x226622]
    const borders = [0xD4C060, 0x4488CC, 0x8844CC, 0xDD4422, 0x44AA44]

    for (let i = 0; i < 5; i++) {
      const x = startX + i * spacing
      const g = this.add.graphics().setDepth(3)

      // Outer glow
      g.fillStyle(borders[i], 0.15)
      g.fillCircle(x, cy, 26)

      // Main orb
      g.fillStyle(colors[i])
      g.fillCircle(x, cy, 20)
      g.lineStyle(2, borders[i], 0.9)
      g.strokeCircle(x, cy, 20)

      // Inner shimmer
      g.fillStyle(0xFFFFFF, 0.12)
      g.fillCircle(x - 5, cy - 5, 10)

      this.add.text(x, cy + 32, names[i], {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#A89070',
      }).setOrigin(0.5, 0).setDepth(4)
    }
  }

  drawPressAnyKey(W, H) {
    this.pressText = this.add.text(W / 2, H - 60, 'PRESS ANY KEY TO BEGIN', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#D4AF37',
      letterSpacing: 3,
    }).setOrigin(0.5, 0.5).setDepth(5)

    this.tweens.add({
      targets: this.pressText,
      alpha: { from: 1, to: 0.2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Version / credit
    this.add.text(W - 10, H - 10, 'v0.1', {
      fontSize: '9px', fontFamily: 'monospace', color: '#4A3A28',
    }).setOrigin(1, 1).setDepth(5)
  }

  setupInput() {
    this.input.once('pointerdown', () => this.leave())
    this.input.keyboard.once('keydown', () => this.leave())
  }

  leave() {
    const hasStarter = localStorage.getItem('mt_starter')
    const nextScene  = hasStarter ? 'Hub' : 'StarterPick'
    this.cameras.main.fadeOut(600, 8, 5, 16)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(nextScene)
    })
  }
}
