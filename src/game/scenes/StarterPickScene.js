import Phaser from 'phaser'

const DECKS = [
  {
    color: 'white',
    name: "Dawn's Shield",
    star: 'Serra Angel',
    tag: 'Protect. Heal. Endure.',
    desc: 'Flying angels and\nlifegain spells.',
    bg: 0xD4C060,  border: 0x8B7A30,
    text: 0x1A1000, panel: 0xF5EFD0,
  },
  {
    color: 'blue',
    name: "Mind's Reach",
    star: 'Air Elemental',
    tag: 'Draw. Control. Counter.',
    desc: 'Card advantage and\nevasive creatures.',
    bg: 0x2255AA,  border: 0x113377,
    text: 0xEEF4FF, panel: 0x0D1F3A,
  },
  {
    color: 'black',
    name: "Shadow's Grasp",
    star: 'Sengir Vampire',
    tag: 'Destroy. Drain. Dominate.',
    desc: 'Removal spells and\ngrowing predators.',
    bg: 0x6633AA,  border: 0x3A1A6A,
    text: 0xEEE8FF, panel: 0x1A0A2A,
  },
  {
    color: 'red',
    name: "Flame's Fury",
    star: 'Shivan Dragon',
    tag: 'Fast. Fierce. Final.',
    desc: 'Direct damage and\naggressive creatures.',
    bg: 0xCC3311,  border: 0x7A1500,
    text: 0xFFF0EE, panel: 0x2A0A04,
  },
  {
    color: 'green',
    name: "Wild's Call",
    star: 'Force of Nature',
    tag: 'Ramp. Grow. Overwhelm.',
    desc: 'Massive creatures and\nmana acceleration.',
    bg: 0x228822,  border: 0x0A5A0A,
    text: 0xF0FFF0, panel: 0x061A06,
  },
]

const PANEL_W  = 130
const PANEL_H  = 220
const SPACING  = 14
const TOTAL_W  = PANEL_W * 5 + SPACING * 4
const START_X  = (800 - TOTAL_W) / 2
const PANEL_Y  = 240

export default class StarterPickScene extends Phaser.Scene {
  constructor() {
    super('StarterPick')
    this.chosen = null
    this.panels = []
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0D0818)
    this.cameras.main.fadeIn(800, 13, 8, 24)

    this.drawBackground()
    this.drawLibrarian()
    this.drawDecks()
  }

  drawBackground() {
    const g = this.add.graphics()
    g.fillStyle(0x0D0818)
    g.fillRect(0, 0, 800, 600)

    // Subtle star scatter
    g.fillStyle(0xFFFFFF, 0.3)
    const pts = [[80,40],[200,20],[420,55],[600,30],[720,70],[150,550],[350,570],[550,545],[700,560]]
    for (const [x, y] of pts) g.fillCircle(x, y, 1)
  }

  drawLibrarian() {
    // Header panel
    const hg = this.add.graphics().setDepth(2)
    hg.fillStyle(0x100820, 0.95)
    hg.fillRoundedRect(80, 24, 640, 170, 10)
    hg.lineStyle(2, 0xD4AF37, 0.7)
    hg.strokeRoundedRect(80, 24, 640, 170, 10)

    // Librarian sprite placeholder (pink square — real sprite is npc-librarian)
    const portrait = this.add.graphics().setDepth(3)
    portrait.fillStyle(0x2A1A3A)
    portrait.fillRoundedRect(100, 44, 72, 72, 6)
    portrait.lineStyle(2, 0xCC44AA, 0.8)
    portrait.strokeRoundedRect(100, 44, 72, 72, 6)

    // Use actual librarian sprite if loaded
    if (this.textures.exists('npc-librarian')) {
      this.add.image(136, 80, 'npc-librarian').setScale(2.5).setDepth(4)
    } else {
      this.add.text(136, 80, '📚', { fontSize: '28px' }).setOrigin(0.5).setDepth(4)
    }

    // Name tab
    const ntg = this.add.graphics().setDepth(3)
    ntg.fillStyle(0xCC44AA)
    ntg.fillRoundedRect(100, 122, 72, 18, { tl: 0, tr: 0, bl: 4, br: 4 })
    this.add.text(136, 131, 'Librarian Mira', {
      fontSize: '8px', fontFamily: 'monospace',
      color: '#FFFFFF', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4)

    // Dialog text
    this.add.text(190, 46, 'Grand Librarian Mira', {
      fontSize: '13px', fontFamily: 'Georgia, serif',
      fontStyle: 'bold', color: '#D4AF37',
    }).setDepth(3)

    this.add.text(190, 68,
      'Welcome to the Mana Academy, Initiate!\n' +
      'Every great Planeswalker begins with a single color.\n' +
      'Which path calls to you?',
      {
        fontSize: '13px', fontFamily: 'Georgia, serif',
        color: '#F0E8D0', lineSpacing: 6,
        wordWrap: { width: 520 },
      }
    ).setDepth(3)

    this.add.text(190, 158, '▼ Choose your starter deck below', {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#A89070', fontStyle: 'italic',
    }).setDepth(3)
  }

  drawDecks() {
    this.add.text(400, PANEL_Y - 26, 'SELECT YOUR PATH', {
      fontSize: '11px', fontFamily: 'monospace',
      color: '#A89070', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(2)

    for (let i = 0; i < DECKS.length; i++) {
      const deck = DECKS[i]
      const x = START_X + i * (PANEL_W + SPACING)
      this.makePanel(deck, x, PANEL_Y, i)
    }

    // Confirm button — hidden until a deck is picked
    this.confirmBtn = this.createConfirmButton()
  }

  makePanel(deck, x, y, idx) {
    const g = this.add.graphics().setDepth(3)

    // Shadow
    g.fillStyle(0x000000, 0.4)
    g.fillRoundedRect(x + 4, y + 4, PANEL_W, PANEL_H, 8)

    // Panel body
    g.fillStyle(deck.panel)
    g.fillRoundedRect(x, y, PANEL_W, PANEL_H, 8)
    g.lineStyle(2, deck.border, 0.9)
    g.strokeRoundedRect(x, y, PANEL_W, PANEL_H, 8)

    // Color header strip
    g.fillStyle(deck.bg)
    g.fillRoundedRect(x, y, PANEL_W, 44, { tl: 8, tr: 8, bl: 0, br: 0 })

    // Deck name
    this.add.text(x + PANEL_W / 2, y + 14, deck.name, {
      fontSize: '11px', fontFamily: 'Georgia, serif',
      fontStyle: 'bold', color: `#${deck.text.toString(16).padStart(6,'0')}`,
      wordWrap: { width: PANEL_W - 10 }, align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(4)

    // Star card
    this.add.text(x + PANEL_W / 2, y + 60, '★', {
      fontSize: '18px', color: '#D4AF37',
    }).setOrigin(0.5).setDepth(4)

    this.add.text(x + PANEL_W / 2, y + 82, deck.star, {
      fontSize: '9px', fontFamily: 'Georgia, serif',
      fontStyle: 'italic', color: '#C8A878',
      wordWrap: { width: PANEL_W - 10 }, align: 'center',
    }).setOrigin(0.5, 0).setDepth(4)

    // Divider
    const dg = this.add.graphics().setDepth(4)
    dg.lineStyle(1, deck.border, 0.4)
    dg.lineBetween(x + 12, y + 112, x + PANEL_W - 12, y + 112)

    // Tag line
    this.add.text(x + PANEL_W / 2, y + 124, deck.tag, {
      fontSize: '8px', fontFamily: 'monospace',
      color: '#A89070', fontStyle: 'italic',
      wordWrap: { width: PANEL_W - 10 }, align: 'center',
    }).setOrigin(0.5, 0).setDepth(4)

    // Description
    this.add.text(x + PANEL_W / 2, y + 155, deck.desc, {
      fontSize: '9px', fontFamily: 'Georgia, serif',
      color: '#907860', lineSpacing: 4,
      wordWrap: { width: PANEL_W - 10 }, align: 'center',
    }).setOrigin(0.5, 0).setDepth(4)

    // Hit zone
    const zone = this.add.zone(x + PANEL_W / 2, y + PANEL_H / 2, PANEL_W, PANEL_H)
      .setDepth(5)
      .setInteractive({ cursor: 'pointer' })

    zone.on('pointerover', () => {
      g.clear()
      g.fillStyle(0x000000, 0.4)
      g.fillRoundedRect(x + 4, y + 4, PANEL_W, PANEL_H, 8)
      g.fillStyle(deck.panel)
      g.fillRoundedRect(x, y - 6, PANEL_W, PANEL_H, 8)
      g.lineStyle(3, deck.bg, 1)
      g.strokeRoundedRect(x, y - 6, PANEL_W, PANEL_H, 8)
      g.fillStyle(deck.bg)
      g.fillRoundedRect(x, y - 6, PANEL_W, 44, { tl: 8, tr: 8, bl: 0, br: 0 })
    })

    zone.on('pointerout', () => {
      if (this.chosen === idx) return
      g.clear()
      g.fillStyle(0x000000, 0.4)
      g.fillRoundedRect(x + 4, y + 4, PANEL_W, PANEL_H, 8)
      g.fillStyle(deck.panel)
      g.fillRoundedRect(x, y, PANEL_W, PANEL_H, 8)
      g.lineStyle(2, deck.border, 0.9)
      g.strokeRoundedRect(x, y, PANEL_W, PANEL_H, 8)
      g.fillStyle(deck.bg)
      g.fillRoundedRect(x, y, PANEL_W, 44, { tl: 8, tr: 8, bl: 0, br: 0 })
    })

    zone.on('pointerdown', () => {
      this.chosen = idx
      this.confirmBtn.setVisible(true)
      this.game.events.emit('starterPicked', { ...DECKS[idx], index: idx })
    })

    this.panels.push({ g, deck, x, y })
  }

  createConfirmButton() {
    const cx = 400, cy = 510
    const bg = this.add.graphics().setDepth(8)
    bg.fillStyle(0xD4AF37, 0.12)
    bg.fillRoundedRect(cx - 100, cy - 18, 200, 36, 8)
    bg.lineStyle(2, 0xD4AF37, 0.9)
    bg.strokeRoundedRect(cx - 100, cy - 18, 200, 36, 8)

    const label = this.add.text(cx, cy, 'BEGIN YOUR JOURNEY  ►', {
      fontSize: '12px', fontFamily: 'monospace',
      color: '#D4AF37', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9)

    const zone = this.add.zone(cx, cy, 200, 36).setDepth(10).setInteractive({ cursor: 'pointer' })
    zone.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(0xD4AF37, 0.25)
      bg.fillRoundedRect(cx - 100, cy - 18, 200, 36, 8)
      bg.lineStyle(2, 0xD4AF37, 1)
      bg.strokeRoundedRect(cx - 100, cy - 18, 200, 36, 8)
    })
    zone.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(0xD4AF37, 0.12)
      bg.fillRoundedRect(cx - 100, cy - 18, 200, 36, 8)
      bg.lineStyle(2, 0xD4AF37, 0.9)
      bg.strokeRoundedRect(cx - 100, cy - 18, 200, 36, 8)
    })
    zone.on('pointerdown', () => this.confirm())

    const group = { setVisible: (v) => { bg.setVisible(v); label.setVisible(v); zone.setVisible(v) } }
    group.setVisible(false)
    return group
  }

  confirm() {
    if (this.chosen === null) return
    const deck = DECKS[this.chosen]
    localStorage.setItem('mt_starter', deck.color)

    this.cameras.main.fadeOut(700, 13, 8, 24)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Hub')
    })
  }
}
