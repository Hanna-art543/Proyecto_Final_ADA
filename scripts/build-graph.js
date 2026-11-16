import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MUSIC_FEATURES,
  calculateNearestNeighbors,
  serializeNeighbors,
} from '../src/algorithms/buildGraph.js'

/* global process */

const DEFAULT_OUTPUT = 'public/data/neighbors.json'
const DEFAULT_NEIGHBORS = 5

function parseArguments(argv) {
  const options = {
    input: null,
    output: DEFAULT_OUTPUT,
    neighborCount: DEFAULT_NEIGHBORS,
    maxPerGenre: 100,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--input') options.input = argv[++index]
    else if (value === '--output') options.output = argv[++index]
    else if (value === '--neighbors') options.neighborCount = Number(argv[++index])
    else if (value === '--max-per-genre') options.maxPerGenre = Number(argv[++index])
    else if (!value.startsWith('--') && !options.input) options.input = value
    else throw new Error(`Argumento desconocido: ${value}`)
  }

  if (!Number.isInteger(options.neighborCount) || options.neighborCount < 0) {
    throw new Error('--neighbors debe ser un entero no negativo')
  }
  if (!Number.isInteger(options.maxPerGenre) || options.maxPerGenre < 1) {
    throw new Error('--max-per-genre debe ser un entero positivo')
  }
  return options
}

/** Parser CSV pequeño con soporte para comillas, comas y saltos escapados. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }
  if (rows.length === 0) return []

  const headers = rows[0]
  return rows.slice(1).map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? '']),
  ))
}

function normalizeSong(row) {
  const song = {
    id: row.id,
    external_id: row.external_id ?? row.track_id,
    title: row.title ?? row.track_name,
    artist: row.artist ?? row.artists,
    genre: row.genre ?? row.track_genre,
  }

  for (const feature of MUSIC_FEATURES) {
    const value = row[feature]
    song[feature] = value === null || value === undefined || value === ''
      ? Number.NaN
      : Number(value)
  }
  return song
}

export function cleanCatalog(rows, maxPerGenre = 100) {
  const songs = []
  const seen = new Set()
  const genreCounts = new Map()

  for (const row of rows) {
    const song = normalizeSong(row)
    const id = song.external_id ?? song.id
    const genre = song.genre ?? '__sin_genero__'
    const validFeatures = MUSIC_FEATURES.every((feature) => (
      Number.isFinite(song[feature]) && song[feature] >= 0 && song[feature] <= 1
    ))
    if (id === undefined || id === null || seen.has(String(id)) || !validFeatures) continue
    if ((genreCounts.get(genre) ?? 0) >= maxPerGenre) continue

    seen.add(String(id))
    genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    songs.push(song)
  }
  return songs
}

async function loadFromFile(filePath, maxPerGenre) {
  const content = await fs.readFile(filePath, 'utf8')
  const extension = path.extname(filePath).toLowerCase()
  const rows = extension === '.json' ? JSON.parse(content) : parseCsv(content)
  const catalog = Array.isArray(rows) ? rows : rows.songs
  if (!Array.isArray(catalog)) throw new Error('El archivo debe contener un arreglo de canciones')
  return cleanCatalog(catalog, maxPerGenre)
}

async function loadFromSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
    ?? process.env.VITE_SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Falta una entrada o las variables SUPABASE_URL/VITE_SUPABASE_URL y una clave de Supabase.',
    )
  }

  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(url, key)
  const pageSize = 1000
  const songs = []

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await client
      .from('songs')
      .select('id,external_id,title,artist,genre_id,energy,danceability,acousticness,instrumentalness,valence')
      .order('id')
      .range(start, start + pageSize - 1)
    if (error) throw error
    songs.push(...data)
    if (data.length < pageSize) break
  }
  return songs
}

export async function generateNeighbors({
  input = null,
  output = DEFAULT_OUTPUT,
  neighborCount = DEFAULT_NEIGHBORS,
  maxPerGenre = 100,
} = {}) {
  const songs = input
    ? await loadFromFile(input, maxPerGenre)
    : await loadFromSupabase()
  const neighbors = calculateNearestNeighbors(songs, neighborCount)
  const document = {
    version: 1,
    generatedAt: new Date().toISOString(),
    features: MUSIC_FEATURES,
    neighborCount,
    songs: serializeNeighbors(neighbors),
  }

  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.writeFile(output, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
  return { songCount: songs.length, output }
}

const isMain = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  try {
    const result = await generateNeighbors(parseArguments(process.argv.slice(2)))
    console.log(`Vecinos calculados para ${result.songCount} canciones en ${result.output}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
