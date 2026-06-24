import Phaser from 'phaser'
import { SoundEngine } from '../systems/SoundEngine.js'

// Building positions in worldmap-bg.png (matched to Python generator output)
const REGIONS = [
  {
    key: 'white',
    sceneKey: 'ClubWhite',
    name: 'Solara Plains',
    sub: 'Mana Academy',
    x: 382, y: 180,
    glow: 0xF0D050,
    border: 0xD4AF37,
  },
  {
    key: 'blue',
    sceneKey: 'ClubBlue',
    name: 'Tidefall Isles',
    sub: "Scholar's Library",
    x: 522, y: 236,
    glow: 0x4488EE,
    border: 0x2266CC,
  },
  {
    key: 'black',
    sceneKey: 'ClubBlack',
    name: 'Shadowmere Bog',
    sub: 'Shadow Tower',
    x: 472, y: 422,
    glow: 0xBB66FF,
    border: 0x8833CC,
  },
  {
    key: 'red',
    sceneKey: 'ClubRed',
    name: 'Embercrest Peaks',
    sub: 'The Forge',
    x: 232, y: 418,
    glow: 0xFF5533,
    border: 0xCC2200,
  },
  {
    key: 'green',
    sceneKey: 'ClubGreen',
    name: 'Thornveil Woods',
    sub: 'Forest Shrine',
    x: 165, y: 268,
    glow: 0x44DD44,
    border: 0x228833,
  },
]

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMap')
  }

  preload() {
    this.load.image('worldmap-bg', 'assets/worldmap-bg.png')
  }

  create() {
    // Background image — replaces all Phaser graphics drawing
    this.add.image(0, 0, 'worldmap-bg').setOrigin(0, 0).setDepth(0)

    this.drawTitlePanel()
    this.drawRegionMarkers()
    this.drawBackButton()
    this.drawSealsLegend()
    this.drawMerchant()
  }

  // ── Title panel ─────────────────────────────────────────────────────────────
  drawTitlePanel() {
    const g = this.add.graphics().setDepth(6)
    g.fillStyle(0x0A0E1A, 0.88)
    g.fillRoundedRect(228, 10, 344, 52, 6)
    g.lineStyle(2, 0xD4AF37, 0.95)
    g.strokeRoundedRect(228, 10, 344, 52, 6)

    this.add.text(400, 22, 'WORLD MAP', {
      fontSize: '20px', color: '#D4AF37',
      fontFamily: 'serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(7)

    this.add.text(400, 46, 'Choose a region to challenge its Archmage', {
      fontSize: '11px', color: '#E8D898',
      fontFamily: 'serif',
    }).setOrigin(0.5, 0).setDepth(7)
  }

  // ── Region markers — glowing labels that sit over each building ─────────────
  drawRegionMarkers() {
    const seals = this.registry.get('seals') ?? []
    for (let i = 0; i < REGIONS.length; i++) {
      const region   = REGIONS[i]
      const hasEarned = seals.includes(region.key)
      const isLocked  = i > 0 && !seals.includes(REGIONS[i - 1].key)
      this.drawMarker(region, hasEarned, isLocked)
    }
  }

  drawMarker(region, hasEarned, isLocked = false) {
    const { x, y, name, sub, glow, border } = region

    // Pulse glow ring behind the marker dot
    const glowRing = this.add.graphics().setDepth(4)
    const drawGlow = (alpha) => {
      glowRing.clear()
      glowRing.lineStyle(8, glow, alpha)
      glowRing.strokeCircle(x, y, 14)
      glowRing.lineStyle(4, glow, alpha * 0.5)
      glowRing.strokeCircle(x, y, 20)
    }
    drawGlow(0.35)

    // Marker dot
    const dot = this.add.graphics().setDepth(5)
    dot.fillStyle(0x0A0E1A, 0.92)
    dot.fillCircle(x, y, 11)
    dot.lineStyle(2, border, 1)
    dot.strokeCircle(x, y, 11)
    dot.fillStyle(glow, 1)
    dot.fillCircle(x, y, 5)

    // Name banner (floats above marker dot)
    const bannerG = this.add.graphics().setDepth(5)
    const bw = 140, bh = 34, bx = x - bw / 2, by = y - 56
    bannerG.fillStyle(0x06090F, 0.88)
    bannerG.fillRoundedRect(bx, by, bw, bh, 4)
    bannerG.lineStyle(1, border, 0.9)
    bannerG.strokeRoundedRect(bx, by, bw, bh, 4)

    // Connector line from banner to dot
    bannerG.lineStyle(1, border, 0.55)
    bannerG.lineBetween(x, by + bh, x, y - 12)

    this.add.text(x, by + 8, name, {
      fontSize: '11px', color: '#F0E8C8',
      fontFamily: 'serif', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(6)

    this.add.text(x, by + 20, sub, {
      fontSize: '9px', color: '#A09060',
      fontFamily: 'serif', fontStyle: 'italic',
    }).setOrigin(0.5, 0).setDepth(6)

    // Seal star badge
    if (hasEarned) {
      this.add.text(x + 12, y - 12, '★', {
        fontSize: '14px', color: '#D4AF37',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(7)
    }

    // Lock badge for inaccessible regions
    if (isLocked) {
      this.add.text(x - 12, y - 12, '🔒', {
        fontSize: '14px',
      }).setOrigin(0.5, 0.5).setDepth(7)
    }

    // Invisible hit zone
    const hit = this.add.zone(x, y, 160, 70).setDepth(8)
    hit.setInteractive({ cursor: 'pointer' })

    hit.on('pointerover', () => {
      drawGlow(0.75)
      dot.clear()
      dot.fillStyle(0x0A0E1A, 0.92)
      dot.fillCircle(x, y, 13)
      dot.lineStyle(3, glow, 1)
      dot.strokeCircle(x, y, 13)
      dot.fillStyle(0xFFFFFF, 1)
      dot.fillCircle(x, y, 6)
    })

    hit.on('pointerout', () => {
      drawGlow(0.35)
      dot.clear()
      dot.fillStyle(0x0A0E1A, 0.92)
      dot.fillCircle(x, y, 11)
      dot.lineStyle(2, border, 1)
      dot.strokeCircle(x, y, 11)
      dot.fillStyle(glow, 1)
      dot.fillCircle(x, y, 5)
    })

    hit.on('pointerdown', () => {
      const currentSeals = this.registry.get('seals') ?? []
      const regionIdx    = REGIONS.findIndex(r => r.key === region.key)
      const neededColor  = regionIdx > 0 ? REGIONS[regionIdx - 1].key : null
      if (neededColor && !currentSeals.includes(neededColor)) {
        this.showLockMessage(neededColor)
        return
      }
      this.cameras.main.fadeOut(400, 10, 30, 55)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(region.sceneKey)
      })
    })
  }

  // ── Back button ──────────────────────────────────────────────────────────────
  drawBackButton() {
    const bx = 60, by = 30
    const g = this.add.graphics().setDepth(10)
    g.fillStyle(0x06090F, 0.92)
    g.fillRoundedRect(bx - 46, by - 14, 92, 28, 6)
    g.lineStyle(2, 0xD4AF37, 1)
    g.strokeRoundedRect(bx - 46, by - 14, 92, 28, 6)

    const label = this.add.text(bx, by, '< Back to Hub', {
      fontSize: '12px', color: '#D4AF37', fontFamily: 'serif',
    }).setOrigin(0.5, 0.5).setDepth(11)

    const btn = this.add.zone(bx, by, 92, 28).setDepth(12)
    btn.setInteractive({ cursor: 'pointer' })
    btn.on('pointerover', () => label.setColor('#FFFFFF'))
    btn.on('pointerout',  () => label.setColor('#D4AF37'))
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 26, 18, 8)
      this.cameras.main.once('camerafadeoutcomplete', () => { SoundEngine.stopBGM(); this.scene.start('Hub') })
    })
  }

  // ── Lock message helper ──────────────────────────────────────────────────────
  showLockMessage(neededColor) {
    if (this._lockMsg) return
    const msg = this.add.text(400, 300,
      `Earn the ${neededColor.toUpperCase()} seal first!`,
      { fontSize: '18px', color: '#FF4444', fontFamily: 'serif',
        backgroundColor: '#000000BB', padding: { x: 14, y: 8 },
        stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5).setDepth(100)
    this._lockMsg = msg
    this.time.delayedCall(2200, () => { msg.destroy(); this._lockMsg = null })
  }

  // ── Seals legend ─────────────────────────────────────────────────────────────
  drawSealsLegend() {
    const seals = this.registry.get('seals') ?? []
    this.add.text(760, 575, `Seals: ${seals.length}/5`, {
      fontSize: '12px', color: '#D4AF37', fontFamily: 'serif',
    }).setOrigin(1, 1).setDepth(10)
  }

  // ── Wandering Merchant ────────────────────────────────────────────────────────
  drawMerchant() {
    const mx = 330, my = 490
    const gold = this.registry.get('gold') ?? 0

    const g = this.add.graphics().setDepth(6)
    const draw = (hover) => {
      g.clear()
      g.fillStyle(hover ? 0x1A2812 : 0x08100A, hover ? 0.96 : 0.88)
      g.fillRoundedRect(mx - 64, my - 26, 128, 52, 6)
      g.lineStyle(2, hover ? 0xD4AF37 : 0xC8961E, hover ? 1 : 0.85)
      g.strokeRoundedRect(mx - 64, my - 26, 128, 52, 6)
    }
    draw(false)

    this.add.text(mx, my - 14, '🛒 Merchant Voss', {
      fontSize: '11px', color: '#D4AF37', fontFamily: 'serif', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(7)

    this.add.text(mx, my + 2, 'Booster Pack — 50g', {
      fontSize: '9px', color: '#A09060', fontFamily: 'serif',
    }).setOrigin(0.5, 0).setDepth(7)

    const btn = this.add.zone(mx, my, 128, 52).setDepth(8)
    btn.setInteractive({ cursor: 'pointer' })
    btn.on('pointerover', () => draw(true))
    btn.on('pointerout',  () => draw(false))
    btn.on('pointerdown', () => {
      this.game.events.emit('shopOpen')
    })
  }
}
