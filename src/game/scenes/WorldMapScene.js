import Phaser from 'phaser'

// Each region now navigates to its club scene (battle happens inside the club)
const REGIONS = [
  {
    key: 'white',
    sceneKey: 'ClubWhite',
    name: 'Solara Plains',
    subname: '(White)',
    color: 0xF5F0E1,
    borderColor: 0xD4AF37,
    x: 400,
    y: 90,
  },
  {
    key: 'blue',
    sceneKey: 'ClubBlue',
    name: 'Tidefall Isles',
    subname: '(Blue)',
    color: 0x1A3A5C,
    borderColor: 0x4A8AAC,
    x: 660,
    y: 240,
  },
  {
    key: 'black',
    sceneKey: 'ClubBlack',
    name: 'Shadowmere Bog',
    subname: '(Black)',
    color: 0x1C1C2E,
    borderColor: 0x9B4DBB,
    x: 580,
    y: 440,
  },
  {
    key: 'red',
    sceneKey: 'ClubRed',
    name: 'Embercrest Peaks',
    subname: '(Red)',
    color: 0x8B0000,
    borderColor: 0xFF4422,
    x: 220,
    y: 440,
  },
  {
    key: 'green',
    sceneKey: 'ClubGreen',
    name: 'Thornveil Woods',
    subname: '(Green)',
    color: 0x2E5A1E,
    borderColor: 0x4E8A3E,
    x: 140,
    y: 240,
  },
]

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMap')
  }

  create() {
    this.drawBackground()
    this.drawContinent()
    this.drawRegionPortals()
    this.drawCenterLabel()
    this.drawBackButton()
    this.drawSealsLegend()
  }

  // ─── Background ───────────────────────────────────────────────────────────

  drawBackground() {
    const g = this.add.graphics()
    // Parchment base — warm aged paper
    g.fillStyle(0xC8A870)
    g.fillRect(0, 0, 800, 600)
    // Parchment texture bands (subtle horizontal variation)
    for (let i = 0; i < 600; i += 8) {
      const alpha = 0.04 + (i % 24 === 0 ? 0.06 : 0)
      g.fillStyle(0x000000, alpha)
      g.fillRect(0, i, 800, 4)
    }
    // Age-spot splotches
    g.fillStyle(0xA07840, 0.3)
    g.fillEllipse(80, 90, 120, 80)
    g.fillEllipse(700, 500, 100, 70)
    g.fillEllipse(680, 100, 90, 60)
    g.fillEllipse(120, 490, 110, 75)
    // Vignette border — dark worn edges
    g.fillStyle(0x6A4820, 0.5)
    g.fillRect(0, 0, 800, 18)
    g.fillRect(0, 582, 800, 18)
    g.fillRect(0, 0, 18, 600)
    g.fillRect(782, 0, 18, 600)
    // Inner border lines — ink
    g.lineStyle(2, 0x5A3810, 0.8)
    g.strokeRect(18, 18, 764, 564)
    g.lineStyle(1, 0x5A3810, 0.4)
    g.strokeRect(22, 22, 756, 556)

    // Ocean fill — teal parchment water
    const og = this.add.graphics().setDepth(0)
    og.fillStyle(0x7AACB8, 0.45)
    og.fillRect(19, 19, 762, 562)

    // Title panel
    const tg = this.add.graphics().setDepth(6)
    tg.fillStyle(0x3A2008, 0.85)
    tg.fillRoundedRect(240, 12, 320, 52, 6)
    tg.lineStyle(2, 0xD4AF37, 0.9)
    tg.strokeRoundedRect(240, 12, 320, 52, 6)

    this.add.text(400, 25, 'WORLD MAP', {
      fontSize: '20px', color: '#D4AF37',
      fontFamily: 'serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(7)

    this.add.text(400, 50, 'Choose a region to challenge its Archmage', {
      fontSize: '11px', color: '#F0DFA8',
      fontFamily: 'serif',
    }).setOrigin(0.5, 0).setDepth(7)
  }

  // ─── Continent shape ──────────────────────────────────────────────────────

  drawContinent() {
    const g = this.add.graphics().setDepth(1)

    // Main landmass — warm parchment land
    g.fillStyle(0xC4A060)
    g.fillEllipse(400, 320, 520, 420)

    // Plains region — top center (white/gold)
    g.fillStyle(0xE8D890, 0.7)
    g.fillEllipse(400, 170, 200, 140)

    // Thornveil forest — left (green)
    g.fillStyle(0x5A7A3A, 0.55)
    g.fillEllipse(165, 280, 160, 120)
    g.fillEllipse(145, 310, 80, 60)

    // Tidefall isles — right (ocean blue patches)
    g.fillStyle(0x3A7A8A, 0.5)
    g.fillEllipse(645, 255, 120, 90)
    g.fillEllipse(690, 290, 60, 50)

    // Embercrest peaks — bottom left (red/brown)
    g.fillStyle(0x7A3A1A, 0.6)
    g.fillEllipse(230, 430, 150, 110)

    // Shadowmere bog — bottom right (dark purple)
    g.fillStyle(0x3A2A4A, 0.6)
    g.fillEllipse(560, 430, 150, 110)

    // Coastline border
    g.lineStyle(2, 0x8A6030, 0.6)
    g.strokeEllipse(400, 320, 520, 420)

    // Terrain detail marks
    this.drawTerrainSymbols(g)
    this.drawCompassRose(g, 680, 520)

    // Map grid lines (faint ink ruling)
    g.lineStyle(1, 0x8A6030, 0.15)
    for (let x = 40; x < 800; x += 80) g.lineBetween(x, 20, x, 580)
    for (let y = 40; y < 600; y += 80) g.lineBetween(20, y, 780, y)
  }

  drawTerrainSymbols(g) {
    // Mountain symbols near Embercrest (bottom-left)
    const mtns = [[210, 390], [240, 380], [225, 400], [255, 395]]
    for (const [mx, my] of mtns) {
      g.fillStyle(0x6A4A2A, 0.7)
      g.fillTriangle(mx, my + 14, mx - 8, my + 14, mx, my)
      g.fillStyle(0xEEEEEE, 0.5)
      g.fillTriangle(mx, my, mx + 3, my + 6, mx - 3, my + 6)
    }

    // Tree symbols near Thornveil (left)
    const trees = [[140, 250], [155, 268], [130, 270], [170, 255], [145, 285]]
    for (const [tx, ty] of trees) {
      g.fillStyle(0x3A6A2A, 0.75)
      g.fillCircle(tx, ty, 6)
      g.fillStyle(0x2A5020, 0.5)
      g.fillCircle(tx - 2, ty - 2, 4)
    }

    // Wave symbols near Tidefall (right)
    const waves = [[630, 220], [655, 230], [640, 245]]
    for (const [wx, wy] of waves) {
      g.lineStyle(1, 0x2A6A8A, 0.7)
      g.strokeEllipse(wx, wy, 16, 5)
    }

    // Marsh symbols near Shadowmere (bottom-right)
    const marsh = [[545, 400], [570, 410], [558, 420]]
    for (const [bx, by] of marsh) {
      g.fillStyle(0x4A3A5A, 0.5)
      g.fillRect(bx - 1, by - 8, 2, 10)
      g.fillRect(bx - 5, by - 5, 10, 2)
    }

    // Sun/wind lines over plains (top)
    g.lineStyle(1, 0xC8A020, 0.35)
    for (let i = 0; i < 5; i++) {
      g.lineBetween(330 + i * 18, 150, 350 + i * 18, 165)
    }
  }

  drawCompassRose(g, cx, cy) {
    // Cardinal arms
    g.fillStyle(0x5A3810, 0.8)
    const pts = [[cx, cy-20], [cx+4, cy-4], [cx+20, cy], [cx+4, cy+4], [cx, cy+20], [cx-4, cy+4], [cx-20, cy], [cx-4, cy-4]]
    g.fillTriangle(pts[0][0],pts[0][1], pts[1][0],pts[1][1], pts[7][0],pts[7][1])
    g.fillTriangle(pts[2][0],pts[2][1], pts[1][0],pts[1][1], pts[3][0],pts[3][1])
    g.fillTriangle(pts[4][0],pts[4][1], pts[3][0],pts[3][1], pts[5][0],pts[5][1])
    g.fillTriangle(pts[6][0],pts[6][1], pts[5][0],pts[5][1], pts[7][0],pts[7][1])
    // Center
    g.fillStyle(0xD4AF37, 0.9)
    g.fillCircle(cx, cy, 4)
    g.lineStyle(1, 0x5A3810, 1)
    g.strokeCircle(cx, cy, 4)
    // N label
    this.add.text(cx, cy - 26, 'N', {
      fontSize: '9px', color: '#5A3810',
      fontFamily: 'serif', fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(3)
  }

  // ─── Region portals ───────────────────────────────────────────────────────

  drawRegionPortals() {
    const seals = this.registry.get('seals') ?? []

    for (const region of REGIONS) {
      this.drawPortal(region, seals)
    }
  }

  drawPortal(region, seals) {
    const R = 36
    const { x, y, color, borderColor, name, subname, key } = region
    const hasEarned = seals.includes(key)

    // Outer glow ring
    const glow = this.add.graphics().setDepth(3)
    glow.lineStyle(6, borderColor, 0.25)
    glow.strokeCircle(x, y, R + 8)

    // Main circle
    const g = this.add.graphics().setDepth(4)
    g.fillStyle(color)
    g.fillCircle(x, y, R)
    g.lineStyle(3, borderColor, 1)
    g.strokeCircle(x, y, R)

    // Inner shimmer
    g.fillStyle(0xffffff, 0.08)
    g.fillCircle(x - 8, y - 8, R * 0.5)

    // Region name label
    this.add.text(x, y + R + 8, name, {
      fontSize: '12px',
      color: '#F5F0E1',
      fontFamily: 'serif',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(5)

    this.add.text(x, y + R + 22, subname, {
      fontSize: '10px',
      color: '#D4AF37',
      fontFamily: 'serif',
    }).setOrigin(0.5, 0).setDepth(5)

    // Seal indicator
    if (hasEarned) {
      this.add.text(x + R - 4, y - R + 4, '★', {
        fontSize: '16px',
        color: '#D4AF37',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(6)
    }

    // "Enter" label inside circle
    this.add.text(x, y, 'Enter', {
      fontSize: '11px',
      color: '#F5F0E1',
      fontFamily: 'serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(6)

    // Hit zone — interactive circle (use a transparent rect over the circle)
    const hitZone = this.add.zone(x, y, R * 2 + 8, R * 2 + 8).setDepth(7)
    hitZone.setInteractive({ cursor: 'pointer' })

    hitZone.on('pointerover', () => {
      glow.clear()
      glow.lineStyle(8, borderColor, 0.6)
      glow.strokeCircle(x, y, R + 8)
    })

    hitZone.on('pointerout', () => {
      glow.clear()
      glow.lineStyle(6, borderColor, 0.25)
      glow.strokeCircle(x, y, R + 8)
    })

    hitZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 10, 30, 55)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(region.sceneKey)
      })
    })
  }

  // ─── Center label ─────────────────────────────────────────────────────────

  drawCenterLabel() {
    // Academy emblem
    const g = this.add.graphics().setDepth(3)
    g.fillStyle(0xD4AF37, 0.15)
    g.fillCircle(400, 300, 28)
    g.lineStyle(2, 0xD4AF37, 0.6)
    g.strokeCircle(400, 300, 28)

    this.add.text(400, 291, 'Mana', {
      fontSize: '11px',
      color: '#D4AF37',
      fontFamily: 'serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(6)

    this.add.text(400, 307, 'Academy', {
      fontSize: '11px',
      color: '#D4AF37',
      fontFamily: 'serif',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(6)
  }

  // ─── Back button ──────────────────────────────────────────────────────────

  drawBackButton() {
    const bx = 60
    const by = 30

    const g = this.add.graphics().setDepth(10)
    g.fillStyle(0x2a1f0e, 0.9)
    g.fillRoundedRect(bx - 44, by - 14, 88, 28, 6)
    g.lineStyle(2, 0xD4AF37, 1)
    g.strokeRoundedRect(bx - 44, by - 14, 88, 28, 6)

    const label = this.add.text(bx, by, '< Back to Hub', {
      fontSize: '12px',
      color: '#D4AF37',
      fontFamily: 'serif',
    }).setOrigin(0.5, 0.5).setDepth(11)

    const btn = this.add.zone(bx, by, 88, 28).setDepth(12)
    btn.setInteractive({ cursor: 'pointer' })

    btn.on('pointerover', () => label.setColor('#FFFFFF'))
    btn.on('pointerout', () => label.setColor('#D4AF37'))
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 26, 18, 8)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Hub')
      })
    })
  }

  // ─── Seals legend ─────────────────────────────────────────────────────────

  drawSealsLegend() {
    const seals = this.registry.get('seals') ?? []

    this.add.text(760, 570, `Seals: ${seals.length}/5`, {
      fontSize: '12px',
      color: '#D4AF37',
      fontFamily: 'serif',
    }).setOrigin(1, 1).setDepth(10)
  }
}
