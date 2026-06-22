/**
 * Fetches real MTG cards from the Scryfall API and outputs
 * a ready-to-paste SQL file at scripts/cards-from-scryfall.sql
 *
 * Usage: node scripts/seed-scryfall.mjs
 */

import axios from 'axios'
import { writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

const CARDS_PER_COLOR = 60   // 60 × 5 colors = 300 cards
const COLORLESS_COUNT = 20   // artifact/colorless cards

const COLOR_MAP = { W: 'white', U: 'blue', B: 'black', R: 'red', G: 'green' }

const COLORS = [
  { code: 'w', name: 'white' },
  { code: 'u', name: 'blue' },
  { code: 'b', name: 'black' },
  { code: 'r', name: 'red' },
  { code: 'g', name: 'green' },
]

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function mapType(typeLine) {
  const t = typeLine.toLowerCase()
  if (t.includes('creature'))    return 'creature'
  if (t.includes('enchantment')) return 'enchantment'
  if (t.includes('artifact'))    return 'artifact'
  if (t.includes('instant') || t.includes('sorcery')) return 'spell'
  return null
}

function parseManaCost(str) {
  if (!str) return {}
  const result = {}
  const tokens = str.match(/\{[^}]+\}/g) || []
  for (const token of tokens) {
    const inner = token.slice(1, -1)
    if (COLOR_MAP[inner]) {
      result[COLOR_MAP[inner]] = (result[COLOR_MAP[inner]] || 0) + 1
    } else if (/^\d+$/.test(inner)) {
      result.colorless = (result.colorless || 0) + parseInt(inner)
    }
    // skip X, hybrid, phyrexian — treat as 0
  }
  return result
}

function parsePT(val) {
  if (val === null || val === undefined) return null
  const n = parseInt(val)
  return isNaN(n) ? null : n
}

function escSql(str) {
  if (str === null || str === undefined) return 'NULL'
  return `'${String(str).replace(/'/g, "''")}'`
}

function jsonSql(obj) {
  if (!obj || Object.keys(obj).length === 0) return 'NULL'
  return `'${JSON.stringify(obj)}'::jsonb`
}

async function fetchPage(url) {
  await sleep(110) // respect Scryfall's recommended 100ms between requests
  const res = await axios.get(url)
  return res.data
}

async function fetchCardsForColor(colorCode, limit) {
  const query = [
    `c:${colorCode}`,
    `-c:m`,          // single color only
    `game:paper`,
    `lang:en`,
    `(t:creature or t:instant or t:sorcery or t:enchantment or t:artifact)`,
    `-t:token`,
    `-t:land`,
    `order:edhrec`,  // sort by popularity
  ].join(' ')

  const collected = []
  let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`

  while (url && collected.length < limit) {
    const page = await fetchPage(url)
    for (const card of page.data) {
      if (collected.length >= limit) break
      const type = mapType(card.type_line)
      if (!type) continue
      // skip multi-faced (DFC) cards for simplicity
      if (card.card_faces) continue
      collected.push(card)
    }
    url = page.has_more && collected.length < limit ? page.next_page : null
  }

  return collected
}

async function fetchColorlessArtifacts(limit) {
  const query = `c:colorless t:artifact -t:token game:paper lang:en order:edhrec`
  const collected = []
  let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`

  while (url && collected.length < limit) {
    const page = await fetchPage(url)
    for (const card of page.data) {
      if (collected.length >= limit) break
      if (card.card_faces) continue
      collected.push(card)
    }
    url = page.has_more && collected.length < limit ? page.next_page : null
  }
  return collected
}

function toRow(card, colorName) {
  const type      = mapType(card.type_line)
  const manaCost  = parseManaCost(card.mana_cost)
  const power     = type === 'creature' ? parsePT(card.power)     : null
  const toughness = type === 'creature' ? parsePT(card.toughness) : null
  const rarity    = ['common','uncommon','rare','mythic'].includes(card.rarity) ? card.rarity : 'common'
  const desc      = card.oracle_text ? card.oracle_text.replace(/\n/g, ' ') : ''

  return {
    id:          randomUUID(),
    name:        card.name,
    type,
    color:       colorName,
    mana_cost:   manaCost,
    power,
    toughness,
    rarity,
    description: desc,
  }
}

function rowToSql(r) {
  return [
    `  (`,
    `    ${escSql(r.id)},`,
    `    ${escSql(r.name)},`,
    `    ${escSql(r.type)},`,
    `    ${escSql(r.color)},`,
    `    ${jsonSql(r.mana_cost)},`,
    `    ${r.power     === null ? 'NULL' : r.power},`,
    `    ${r.toughness === null ? 'NULL' : r.toughness},`,
    `    ${escSql(r.rarity)},`,
    `    ${escSql(r.description)}`,
    `  )`,
  ].join('\n')
}

async function main() {
  const allRows = []

  for (const { code, name } of COLORS) {
    process.stderr.write(`Fetching ${name} cards...\n`)
    const cards = await fetchCardsForColor(code, CARDS_PER_COLOR)
    process.stderr.write(`  Got ${cards.length}\n`)
    for (const card of cards) {
      allRows.push(toRow(card, name))
    }
  }

  process.stderr.write(`Fetching colorless artifacts...\n`)
  const artifacts = await fetchColorlessArtifacts(COLORLESS_COUNT)
  process.stderr.write(`  Got ${artifacts.length}\n`)
  for (const card of artifacts) {
    allRows.push(toRow(card, 'colorless'))
  }

  // Deduplicate by name (Scryfall can return reprints)
  const seen = new Set()
  const deduped = allRows.filter(r => {
    if (seen.has(r.name)) return false
    seen.add(r.name)
    return true
  })

  process.stderr.write(`Total unique cards: ${deduped.length}\n`)

  // Build SQL — chunked into 50-row inserts to stay under editor limits
  const CHUNK = 50
  const chunks = []
  for (let i = 0; i < deduped.length; i += CHUNK) {
    chunks.push(deduped.slice(i, i + CHUNK))
  }

  const sql = [
    '-- Mana Tactics — Scryfall card seed',
    `-- ${deduped.length} cards fetched from api.scryfall.com`,
    '-- Safe to re-run (ON CONFLICT DO NOTHING)',
    '',
    ...chunks.map(chunk => [
      'INSERT INTO public.cards (id, name, type, color, mana_cost, power, toughness, rarity, description)',
      'VALUES',
      chunk.map(rowToSql).join(',\n'),
      'ON CONFLICT (id) DO NOTHING;',
      '',
    ].join('\n')),
  ].join('\n')

  const outPath = 'scripts/cards-from-scryfall.sql'
  writeFileSync(outPath, sql, 'utf8')
  process.stderr.write(`\nSQL written to ${outPath}\n`)
  process.stderr.write(`Paste that file's contents into Supabase SQL editor and run it.\n`)
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`)
  process.exit(1)
})
