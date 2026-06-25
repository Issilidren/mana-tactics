-- =============================================================
-- Mana Tactics — seed.sql
-- Run this AFTER schema.sql.
-- Fixed UUIDs make this idempotent — safe to re-run.
-- =============================================================

INSERT INTO public.cards (id, name, type, color, mana_cost, power, toughness, rarity, description)
VALUES

  -- WHITE
  (
    '00000001-0000-0000-0000-000000000001',
    'Serra Angel',
    'creature', 'white',
    '{"white": 2, "colorless": 3}',
    4, 4, 'rare',
    'Flying, Vigilance'
  ),
  (
    '00000001-0000-0000-0000-000000000002',
    'Archangel',
    'creature', 'white',
    '{"white": 2, "colorless": 5}',
    5, 5, 'uncommon',
    'Flying, Vigilance'
  ),
  (
    '00000001-0000-0000-0000-000000000003',
    'White Knight',
    'creature', 'white',
    '{"white": 2}',
    2, 2, 'uncommon',
    'First Strike, Protection from black'
  ),

  -- BLUE
  (
    '00000001-0000-0000-0000-000000000004',
    'Air Elemental',
    'creature', 'blue',
    '{"blue": 2, "colorless": 3}',
    4, 4, 'uncommon',
    'Flying'
  ),
  (
    '00000001-0000-0000-0000-000000000005',
    'Counterspell',
    'spell', 'blue',
    '{"blue": 2}',
    NULL, NULL, 'common',
    'Counter target spell'
  ),
  (
    '00000001-0000-0000-0000-000000000006',
    'Brainstorm',
    'spell', 'blue',
    '{"blue": 1}',
    NULL, NULL, 'common',
    'Draw 3 cards, then put 2 back'
  ),

  -- BLACK
  (
    '00000001-0000-0000-0000-000000000007',
    'Sengir Vampire',
    'creature', 'black',
    '{"black": 2, "colorless": 3}',
    4, 4, 'uncommon',
    'Flying. Gets +1/+1 whenever a creature it damages dies'
  ),
  (
    '00000001-0000-0000-0000-000000000008',
    'Dark Ritual',
    'spell', 'black',
    '{"black": 1}',
    NULL, NULL, 'common',
    'Add 3 black mana'
  ),
  (
    '00000001-0000-0000-0000-000000000009',
    'Terror',
    'spell', 'black',
    '{"black": 1, "colorless": 1}',
    NULL, NULL, 'common',
    'Destroy target non-black, non-artifact creature'
  ),

  -- RED
  (
    '00000001-0000-0000-0000-000000000010',
    'Shivan Dragon',
    'creature', 'red',
    '{"red": 2, "colorless": 4}',
    5, 5, 'rare',
    'Flying. Firebreathing: R: +1/+0 until end of turn'
  ),
  (
    '00000001-0000-0000-0000-000000000011',
    'Lightning Bolt',
    'spell', 'red',
    '{"red": 1}',
    NULL, NULL, 'common',
    'Deal 3 damage to any target'
  ),
  (
    '00000001-0000-0000-0000-000000000012',
    'Goblin Guide',
    'creature', 'red',
    '{"red": 1}',
    2, 2, 'rare',
    'Haste. Whenever Goblin Guide attacks, opponent reveals the top card of their library'
  ),

  -- GREEN
  (
    '00000001-0000-0000-0000-000000000013',
    'Force of Nature',
    'creature', 'green',
    '{"green": 4, "colorless": 4}',
    8, 8, 'rare',
    'Trample. Upkeep: deal 8 damage to you if you don''t pay GGGG'
  ),
  (
    '00000001-0000-0000-0000-000000000014',
    'Llanowar Elves',
    'creature', 'green',
    '{"green": 1}',
    1, 1, 'common',
    'Tap: Add G'
  ),
  (
    '00000001-0000-0000-0000-000000000015',
    'Giant Growth',
    'spell', 'green',
    '{"green": 1}',
    NULL, NULL, 'common',
    'Target creature gets +3/+3 until end of turn'
  ),

  -- BASIC LANDS
  (
    '00000001-0000-0000-0000-000000000016',
    'Plains',
    'land', 'white',
    NULL,
    NULL, NULL, 'common',
    'Tap: Add W'
  ),
  (
    '00000001-0000-0000-0000-000000000017',
    'Island',
    'land', 'blue',
    NULL,
    NULL, NULL, 'common',
    'Tap: Add U'
  ),
  (
    '00000001-0000-0000-0000-000000000018',
    'Swamp',
    'land', 'black',
    NULL,
    NULL, NULL, 'common',
    'Tap: Add B'
  ),
  (
    '00000001-0000-0000-0000-000000000019',
    'Mountain',
    'land', 'red',
    NULL,
    NULL, NULL, 'common',
    'Tap: Add R'
  ),
  (
    '00000001-0000-0000-0000-000000000020',
    'Forest',
    'land', 'green',
    NULL,
    NULL, NULL, 'common',
    'Tap: Add G'
  )

ON CONFLICT (id) DO NOTHING;
