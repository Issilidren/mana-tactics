// AI deck definitions for NPC battles
// UUIDs match the fixed IDs in seed.sql

const CARD_IDS = {
  serra_angel:     '00000001-0000-0000-0000-000000000001',
  archangel:       '00000001-0000-0000-0000-000000000002',
  white_knight:    '00000001-0000-0000-0000-000000000003',
  air_elemental:   '00000001-0000-0000-0000-000000000004',
  counterspell:    '00000001-0000-0000-0000-000000000005',
  brainstorm:      '00000001-0000-0000-0000-000000000006',
  sengir_vampire:  '00000001-0000-0000-0000-000000000007',
  dark_ritual:     '00000001-0000-0000-0000-000000000008',
  terror:          '00000001-0000-0000-0000-000000000009',
  shivan_dragon:   '00000001-0000-0000-0000-000000000010',
  lightning_bolt:  '00000001-0000-0000-0000-000000000011',
  goblin_guide:    '00000001-0000-0000-0000-000000000012',
  force_of_nature: '00000001-0000-0000-0000-000000000013',
  llanowar_elves:  '00000001-0000-0000-0000-000000000014',
  giant_growth:    '00000001-0000-0000-0000-000000000015',
}

// Full card objects with all fields needed by CardEngine
const CARDS = {
  serra_angel: {
    id: CARD_IDS.serra_angel,
    name: 'Serra Angel',
    type: 'creature',
    color: 'white',
    mana_cost: { white: 3, colorless: 2 },
    power: 4,
    toughness: 4,
    rarity: 'uncommon',
    description: 'Flying, Vigilance. Serra Angel watches over all.',
    abilities: ['flying', 'vigilance'],
  },
  archangel: {
    id: CARD_IDS.archangel,
    name: 'Archangel',
    type: 'creature',
    color: 'white',
    mana_cost: { white: 4, colorless: 3 },
    power: 5,
    toughness: 5,
    rarity: 'rare',
    description: 'Flying, Vigilance. Gain 2 life when this enters the battlefield.',
    abilities: ['flying', 'vigilance', 'lifegain_enter'],
  },
  white_knight: {
    id: CARD_IDS.white_knight,
    name: 'White Knight',
    type: 'creature',
    color: 'white',
    mana_cost: { white: 2 },
    power: 2,
    toughness: 2,
    rarity: 'common',
    description: 'First strike, Protection from black.',
    abilities: ['first_strike'],
  },
  air_elemental: {
    id: CARD_IDS.air_elemental,
    name: 'Air Elemental',
    type: 'creature',
    color: 'blue',
    mana_cost: { blue: 2, colorless: 3 },
    power: 4,
    toughness: 4,
    rarity: 'uncommon',
    description: 'Flying. An elemental of pure wind and sky.',
    abilities: ['flying'],
  },
  counterspell: {
    id: CARD_IDS.counterspell,
    name: 'Counterspell',
    type: 'instant',
    color: 'blue',
    mana_cost: { blue: 2 },
    power: null,
    toughness: null,
    rarity: 'common',
    description: 'Counter target spell. Discard a card from opponent\'s hand.',
    abilities: ['counter'],
  },
  brainstorm: {
    id: CARD_IDS.brainstorm,
    name: 'Brainstorm',
    type: 'instant',
    color: 'blue',
    mana_cost: { blue: 1 },
    power: null,
    toughness: null,
    rarity: 'common',
    description: 'Draw 3 cards.',
    abilities: ['draw'],
  },
  sengir_vampire: {
    id: CARD_IDS.sengir_vampire,
    name: 'Sengir Vampire',
    type: 'creature',
    color: 'black',
    mana_cost: { black: 2, colorless: 3 },
    power: 4,
    toughness: 4,
    rarity: 'uncommon',
    description: 'Flying. Whenever a creature dealt damage by Sengir Vampire dies, put a +1/+1 counter on it.',
    abilities: ['flying'],
  },
  dark_ritual: {
    id: CARD_IDS.dark_ritual,
    name: 'Dark Ritual',
    type: 'instant',
    color: 'black',
    mana_cost: { black: 1 },
    power: null,
    toughness: null,
    rarity: 'common',
    description: 'Add 3 mana to your pool.',
    abilities: ['mana_burst'],
  },
  terror: {
    id: CARD_IDS.terror,
    name: 'Terror',
    type: 'instant',
    color: 'black',
    mana_cost: { black: 1, colorless: 1 },
    power: null,
    toughness: null,
    rarity: 'common',
    description: 'Destroy target creature.',
    abilities: ['destroy'],
  },
  shivan_dragon: {
    id: CARD_IDS.shivan_dragon,
    name: 'Shivan Dragon',
    type: 'creature',
    color: 'red',
    mana_cost: { red: 2, colorless: 4 },
    power: 5,
    toughness: 5,
    rarity: 'rare',
    description: 'Flying. The lord of the Shivan wastes.',
    abilities: ['flying'],
  },
  lightning_bolt: {
    id: CARD_IDS.lightning_bolt,
    name: 'Lightning Bolt',
    type: 'instant',
    color: 'red',
    mana_cost: { red: 1 },
    power: null,
    toughness: null,
    rarity: 'common',
    description: 'Deal 3 damage to any target.',
    abilities: ['damage'],
  },
  goblin_guide: {
    id: CARD_IDS.goblin_guide,
    name: 'Goblin Guide',
    type: 'creature',
    color: 'red',
    mana_cost: { red: 1 },
    power: 2,
    toughness: 2,
    rarity: 'rare',
    description: 'Haste. A goblin that leads the charge.',
    abilities: ['haste'],
  },
  force_of_nature: {
    id: CARD_IDS.force_of_nature,
    name: 'Force of Nature',
    type: 'creature',
    color: 'green',
    mana_cost: { green: 4, colorless: 4 },
    power: 8,
    toughness: 8,
    rarity: 'rare',
    description: 'Trample. An unstoppable force of the wild.',
    abilities: ['trample'],
  },
  llanowar_elves: {
    id: CARD_IDS.llanowar_elves,
    name: 'Llanowar Elves',
    type: 'creature',
    color: 'green',
    mana_cost: { green: 1 },
    power: 1,
    toughness: 1,
    rarity: 'common',
    description: 'Add 1 green mana to your pool each turn.',
    abilities: ['mana_dork'],
  },
  giant_growth: {
    id: CARD_IDS.giant_growth,
    name: 'Giant Growth',
    type: 'instant',
    color: 'green',
    mana_cost: { green: 1 },
    power: null,
    toughness: null,
    rarity: 'common',
    description: 'Target creature gets +3/+3 until end of turn.',
    abilities: ['pump'],
  },
}

// Helper: build deck entry with quantity
function qty(cardKey, count) {
  return { ...CARDS[cardKey], quantity: count }
}

export const AI_DECKS = {
  // Tutorial deck — very simple cards that demonstrate all core mechanics:
  // lands for mana, a 1/1, a first-strike creature, a haste creature, a pump
  // spell, and a direct-damage spell.  Intentionally easy.
  starter: {
    color: 'colorless',
    cards: [
      qty('white_knight', 4),
      qty('llanowar_elves', 4),
      qty('giant_growth', 4),
      qty('goblin_guide', 4),
    ],
  },

  // Starter deck — cheap creatures for early NPC fights
  colorless: {
    color: 'colorless',
    cards: [
      qty('white_knight', 4),
      qty('goblin_guide', 4),
      qty('llanowar_elves', 4),
      qty('lightning_bolt', 4),
      qty('giant_growth', 4),
    ],
  },

  // White — lifegain, flyers, protection
  white: {
    color: 'white',
    cards: [
      qty('white_knight', 4),
      qty('serra_angel', 4),
      qty('archangel', 2),
      qty('giant_growth', 4),  // pump spells double as combat tricks
      qty('lightning_bolt', 2), // splash red for removal
      qty('llanowar_elves', 4),
    ],
  },

  // Blue — card draw, counterspells, flyers
  blue: {
    color: 'blue',
    cards: [
      qty('air_elemental', 4),
      qty('counterspell', 4),
      qty('brainstorm', 4),
      qty('white_knight', 4), // cheap blockers
      qty('goblin_guide', 4),
    ],
  },

  // Black — removal, vampires, dark rituals
  black: {
    color: 'black',
    cards: [
      qty('sengir_vampire', 4),
      qty('dark_ritual', 4),
      qty('terror', 4),
      qty('goblin_guide', 4),  // cheap early aggro
      qty('lightning_bolt', 4),
    ],
  },

  // Red — aggro, direct damage, haste
  red: {
    color: 'red',
    cards: [
      qty('goblin_guide', 4),
      qty('lightning_bolt', 4),
      qty('shivan_dragon', 2),
      qty('white_knight', 4), // blockers
      qty('giant_growth', 4),
      qty('llanowar_elves', 2),
    ],
  },

  // Green — big creatures, mana ramp
  green: {
    color: 'green',
    cards: [
      qty('llanowar_elves', 4),
      qty('giant_growth', 4),
      qty('force_of_nature', 2),
      qty('serra_angel', 4), // flyers for reach
      qty('white_knight', 4),
      qty('goblin_guide', 2),
    ],
  },

  // Archmage — powerful balanced deck for final boss
  archmage: {
    color: 'blue',
    cards: [
      qty('air_elemental', 3),
      qty('counterspell', 3),
      qty('brainstorm', 3),
      qty('sengir_vampire', 3),
      qty('terror', 2),
      qty('shivan_dragon', 2),
      qty('lightning_bolt', 2),
      qty('force_of_nature', 2),
    ],
  },
}

export { CARD_IDS, CARDS }
