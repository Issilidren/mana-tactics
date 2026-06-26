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

// ── TRIAD ALUMNI EXCLUSIVE CARDS ─────────────────────────────────────────────
// Multi-color powerhouse cards that only the legendary alumni use.
// These represent mastery across schools — no student has cards this strong.

const TRIAD_CARDS = {
  // ── Archon Tasklet's Arsenal (Blue/Black) ────────────────────────────────
  baleful_strix: {
    id: 'triad-0001', name: 'Baleful Strix',
    type: 'creature', color: 'blue',
    mana_cost: { blue: 1, colorless: 1 },
    power: 1, toughness: 1, rarity: 'rare',
    description: 'Flying, Deathtouch. When Baleful Strix enters the battlefield, draw 1 card.',
    abilities: ['flying', 'deathtouch'],
  },
  notion_thief: {
    id: 'triad-0002', name: 'Notion Thief',
    type: 'creature', color: 'blue',
    mana_cost: { blue: 2, colorless: 2 },
    power: 3, toughness: 1, rarity: 'rare',
    description: 'Flash, Flying. When Notion Thief enters the battlefield, target player discards 1 card.',
    abilities: ['flash', 'flying'],
  },
  consuming_aberration: {
    id: 'triad-0003', name: 'Consuming Aberration',
    type: 'creature', color: 'black',
    mana_cost: { black: 2, colorless: 3 },
    power: 5, toughness: 5, rarity: 'rare',
    description: 'Trample. When Consuming Aberration enters the battlefield, mill 3 cards from opponent.',
    abilities: ['trample'],
  },
  soul_manipulation: {
    id: 'triad-0004', name: 'Soul Manipulation',
    type: 'instant', color: 'blue',
    mana_cost: { blue: 1, colorless: 2 },
    power: null, toughness: null, rarity: 'uncommon',
    description: 'Counter target spell. Discard a card from opponent\'s hand. Draw 1 card.',
    abilities: ['counter', 'draw'],
  },
  shadowmage_infiltrator: {
    id: 'triad-0005', name: 'Shadowmage Infiltrator',
    type: 'creature', color: 'black',
    mana_cost: { black: 1, colorless: 2 },
    power: 1, toughness: 3, rarity: 'rare',
    description: 'Flying. Hexproof. An unseen hand, gathering secrets.',
    abilities: ['flying', 'hexproof'],
  },

  // ── Sage Gemini's Arsenal (White/Blue/Green) ─────────────────────────────
  knight_of_autumn: {
    id: 'triad-0010', name: 'Knight of Autumn',
    type: 'creature', color: 'white',
    mana_cost: { white: 1, colorless: 2 },
    power: 4, toughness: 3, rarity: 'rare',
    description: 'Vigilance. When Knight of Autumn enters the battlefield, you gain 4 life.',
    abilities: ['vigilance'],
  },
  sphinx_of_revelation: {
    id: 'triad-0011', name: 'Sphinx of Revelation',
    type: 'creature', color: 'blue',
    mana_cost: { blue: 3, colorless: 4 },
    power: 5, toughness: 5, rarity: 'rare',
    description: 'Flying. When Sphinx of Revelation enters the battlefield, draw 3 cards and gain 3 life.',
    abilities: ['flying'],
  },
  supreme_verdict: {
    id: 'triad-0012', name: 'Supreme Verdict',
    type: 'sorcery', color: 'white',
    mana_cost: { white: 2, colorless: 2 },
    power: null, toughness: null, rarity: 'rare',
    description: 'Destroy all creatures. Cannot be countered.',
    abilities: ['destroy'],
  },
  growth_spiral: {
    id: 'triad-0013', name: 'Growth Spiral',
    type: 'instant', color: 'green',
    mana_cost: { green: 1, colorless: 1 },
    power: null, toughness: null, rarity: 'uncommon',
    description: 'Draw 1 card. Add 1 mana to your pool.',
    abilities: ['draw'],
  },
  geist_of_saint_traft: {
    id: 'triad-0014', name: 'Geist of Saint Traft',
    type: 'creature', color: 'white',
    mana_cost: { white: 1, colorless: 2 },
    power: 2, toughness: 2, rarity: 'rare',
    description: 'Hexproof. When Geist of Saint Traft enters the battlefield, create 1 4/4 creature token.',
    abilities: ['hexproof'],
  },
  coiling_oracle: {
    id: 'triad-0015', name: 'Coiling Oracle',
    type: 'creature', color: 'green',
    mana_cost: { green: 1, colorless: 1 },
    power: 1, toughness: 1, rarity: 'common',
    description: 'When Coiling Oracle enters the battlefield, draw 1 card.',
    abilities: [],
  },

  // ── Artificer Claude's Arsenal (Red/Black/Green) ─────────────────────────
  bloodbraid_elf: {
    id: 'triad-0020', name: 'Bloodbraid Elf',
    type: 'creature', color: 'red',
    mana_cost: { red: 2, colorless: 2 },
    power: 3, toughness: 2, rarity: 'uncommon',
    description: 'Haste. When Bloodbraid Elf enters the battlefield, draw 1 card.',
    abilities: ['haste'],
  },
  ashenmoor_liege: {
    id: 'triad-0021', name: 'Ashenmoor Liege',
    type: 'creature', color: 'red',
    mana_cost: { red: 2, colorless: 2 },
    power: 4, toughness: 4, rarity: 'rare',
    description: 'First Strike, Deathtouch. The flame and the void meet in this warrior.',
    abilities: ['first_strike', 'deathtouch'],
  },
  abrupt_decay: {
    id: 'triad-0022', name: 'Abrupt Decay',
    type: 'instant', color: 'black',
    mana_cost: { black: 1, colorless: 1 },
    power: null, toughness: null, rarity: 'rare',
    description: 'Destroy target creature. Cannot be countered.',
    abilities: ['destroy'],
  },
  maelstrom_pulse: {
    id: 'triad-0023', name: 'Maelstrom Pulse',
    type: 'sorcery', color: 'black',
    mana_cost: { black: 1, colorless: 2 },
    power: null, toughness: null, rarity: 'rare',
    description: 'Exile target creature. Removes it permanently.',
    abilities: ['exile'],
  },
  huntmaster_of_fells: {
    id: 'triad-0024', name: 'Huntmaster of the Fells',
    type: 'creature', color: 'green',
    mana_cost: { green: 2, colorless: 2 },
    power: 4, toughness: 4, rarity: 'rare',
    description: 'Trample. When Huntmaster of the Fells enters the battlefield, you gain 2 life and create 1 2/2 creature token.',
    abilities: ['trample'],
  },
  kolaghan_command: {
    id: 'triad-0025', name: "Kolaghan's Command",
    type: 'instant', color: 'red',
    mana_cost: { red: 1, colorless: 2 },
    power: null, toughness: null, rarity: 'rare',
    description: 'Deal 2 damage to any target. Target player discards 1 card.',
    abilities: ['damage'],
  },
}

// Helper: build deck entry with quantity
function qty(cardKey, count, pool = CARDS) {
  const card = pool[cardKey]
  if (!card) throw new Error(`Missing card: ${cardKey}`)
  return { ...card, quantity: count }
}

function triadQty(key, count) { return qty(key, count, TRIAD_CARDS) }

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

  // ── TRIAD ALUMNI DECKS ──────────────────────────────────────────────────
  // These represent the apex of card mastery in Mana Academy.
  // Multi-color. Synergistic. Ruthless but fair.
  // Designed to test everything the player has learned.

  // ── Archon Tasklet: Blue/Black Control ──────────────────────────────────
  // Philosophy: The Guaranteed Answer. Never runs out of resources.
  // Draws cards relentlessly, counters your best plays, removes your
  // threats, and wins through evasive creatures you can't block.
  // If you don't apply pressure fast, Tasklet buries you in card advantage.
  'triad-tasklet': {
    color: 'blue',
    cards: [
      // Card draw engine — always has more cards than you
      triadQty('baleful_strix', 4),       // 1/1 flying deathtouch + draw on ETB
      triadQty('soul_manipulation', 3),   // counter + discard + draw
      qty('brainstorm', 3),               // draw 3
      // Evasive finishers — hexproof and flying, hard to interact with
      triadQty('shadowmage_infiltrator', 2), // 1/3 flying hexproof
      triadQty('notion_thief', 2),           // 3/1 flash flying + forces discard
      qty('air_elemental', 2),               // 4/4 flying closer
      // Removal — answers to everything you play
      qty('terror', 3),                    // destroy target creature
      triadQty('consuming_aberration', 2), // 5/5 trample + mills 3 on ETB
      // Mana acceleration
      qty('dark_ritual', 3),               // fast mana = early threats
      // Counterspells for the critical moment
      qty('counterspell', 2),              // pure denial
    ],
  },

  // ── Sage Gemini: White/Blue/Green Value ─────────────────────────────────
  // Philosophy: The Anomaly. Outvalues you on every axis.
  // Gains life so you can't race. Draws cards so you can't outgrind.
  // Ramps mana so you can't outpace. Resets the board when behind.
  // You need to find the gap between their answers — there aren't many.
  'triad-gemini': {
    color: 'white',
    cards: [
      // Value creatures — each one replaces itself or generates advantage
      triadQty('knight_of_autumn', 3),     // 4/3 vigilance + gain 4 life on ETB
      triadQty('coiling_oracle', 3),       // 1/1 draw on ETB — cheap value
      triadQty('geist_of_saint_traft', 2), // 2/2 hexproof + creates 4/4 token
      // Finisher — the research payoff
      triadQty('sphinx_of_revelation', 2), // 5/5 flying + draw 3 + gain 3 life
      qty('serra_angel', 2),               // 4/4 flying vigilance
      // Card draw + ramp engine
      triadQty('growth_spiral', 3),        // draw + mana ramp
      qty('llanowar_elves', 3),            // early ramp
      // The reset button — board wipe when falling behind
      triadQty('supreme_verdict', 2),      // destroy ALL creatures
      // Combat tricks
      qty('giant_growth', 2),              // +3/+3 surprise
      // Cheap early defense
      qty('white_knight', 2),              // first strike blocker
    ],
  },

  // ── Artificer Claude: Red/Black/Green Toolbox ──────────────────────────
  // Philosophy: The Craftsman. Has the right tool for every situation.
  // Removal that can't be stopped. Creatures that hit hard and fast.
  // Combat tricks that flip trades. Big finishers that end games.
  // Try to predict what Claude has — you'll be wrong.
  'triad-claude': {
    color: 'red',
    cards: [
      // Early aggression — force the player to react
      triadQty('bloodbraid_elf', 3),       // 3/2 haste + draws a card
      qty('goblin_guide', 3),              // 2/2 haste — turn 1 pressure
      // Mid-game dominance — trade up on everything
      triadQty('ashenmoor_liege', 2),      // 4/4 first strike + deathtouch
      triadQty('huntmaster_of_fells', 2),  // 4/4 trample + heal + token
      // Unconditional removal — answers anything
      triadQty('abrupt_decay', 3),         // 2-mana destroy — can't be countered
      triadQty('maelstrom_pulse', 2),      // exile — permanently removes threats
      triadQty('kolaghan_command', 2),     // 2 damage + force discard
      qty('lightning_bolt', 3),            // 3 damage — kills creatures or player
      // Finisher
      qty('force_of_nature', 2),           // 8/8 trample — game over
      // Mana acceleration
      qty('llanowar_elves', 2),            // ramp into big plays early
    ],
  },
}

export { CARD_IDS, CARDS, TRIAD_CARDS }
