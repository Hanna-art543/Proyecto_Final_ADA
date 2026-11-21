// Uso: node --env-file=.env scripts/add-songs-with-genre.js [máximo]   (por defecto 5000)
// Agrega a Supabase canciones de data/dataset.csv (con género) que además tengan
// enlace de YouTube en data/spotify-youtube.csv (cruce exacto por ID de Spotify).
// No borra ni modifica las canciones existentes. Se puede repetir sin duplicar.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

const MAX = Number(process.argv[2] ?? 5000)
const DATASET = 'data/dataset.csv'
const KAGGLE = 'data/spotify-youtube.csv'
const OUT = 'public/data/youtube.json'

// nombres de columnas de dataset.csv (los mismos que usa seed-songs.js)
const COL = {
  external_id: 'track_id',
  title: 'track_name',
  artist: 'artists',
  genre: 'track_genre',
  duration: 'duration_ms',
}

const ytId = (u) => String(u ?? '').match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null
const clamp01 = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null
}
const readCsv = (file) =>
  parse(readFileSync(file, 'utf8'), { columns: true, skip_empty_lines: true, bom: true, relax_quotes: true })

async function fetchAllSongs() {
  const all = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('songs')
      .select('id, external_id')
      .order('id', { ascending: true })
      .range(from, from + 999)
    if (error) { console.error('Error leyendo songs:', error.message); process.exit(1) }
    all.push(...data)
    if (data.length < 1000) break
  }
  return all
}

// 1. enlaces de Kaggle por ID de Spotify
const kaggle = new Map()
for (const r of readCsv(KAGGLE)) {
  const id = String(r.Uri ?? '').replace('spotify:track:', '')
  const vid = ytId(r.Url_youtube)
  if (id && vid && !kaggle.has(id)) kaggle.set(id, vid)
}
console.log(`Enlaces en Kaggle: ${kaggle.size}`)

// 2. lo que ya hay en la base
const existing = await fetchAllSongs()
const existingExt = new Set(existing.map((s) => s.external_id))

// 3. candidatas: están en dataset.csv (con género), no en la base, y tienen enlace
const rows = readCsv(DATASET)
if (!rows[0] || !(COL.external_id in rows[0])) {
  console.error('No encuentro las columnas esperadas. Las de tu CSV son:', Object.keys(rows[0] ?? {}).join(', '))
  process.exit(1)
}
const byGenre = new Map()
const seen = new Set()
for (const r of rows) {
  const ext = r[COL.external_id]
  if (!ext || seen.has(ext) || existingExt.has(ext) || !kaggle.has(ext)) continue
  seen.add(ext)
  const genre = String(r[COL.genre] ?? '').trim()
  const f = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness'].map((c) => clamp01(r[c]))
  if (!genre || !r[COL.title] || !r[COL.artist] || f.includes(null)) continue
  if (!byGenre.has(genre)) byGenre.set(genre, [])
  byGenre.get(genre).push({
    external_id: ext,
    title: r[COL.title].trim(),
    artist: r[COL.artist].trim(),
    genre,
    duration_ms: Math.round(Number(r[COL.duration])) || null,
    danceability: f[0], energy: f[1], valence: f[2], acousticness: f[3], instrumentalness: f[4],
  })
}
const available = [...byGenre.values()].reduce((n, q) => n + q.length, 0)
console.log(`Canciones nuevas con género y enlace disponibles: ${available} (${byGenre.size} géneros)`)

// 4. elegir repartiendo entre géneros
const picked = []
const queues = [...byGenre.values()]
for (let i = 0; picked.length < MAX; i++) {
  let any = false
  for (const q of queues) {
    if (i < q.length && picked.length < MAX) { picked.push(q[i]); any = true }
  }
  if (!any) break
}
console.log(`Se van a insertar: ${picked.length}`)

// 5. géneros (se crean los que falten) y canciones
if (picked.length) {
  const names = [...new Set(picked.map((p) => p.genre))]
  const g = await supabase.from('genres').upsert(names.map((name) => ({ name })), { onConflict: 'name', ignoreDuplicates: true })
  if (g.error) { console.error('Error en genres:', g.error.message); process.exit(1) }
  const { data: gs, error: ge } = await supabase.from('genres').select('id, name')
  if (ge) { console.error(ge.message); process.exit(1) }
  const genreId = new Map(gs.map((x) => [x.name, x.id]))

  const records = picked.map(({ genre, ...s }) => ({ ...s, genre_id: genreId.get(genre) ?? null }))
  for (let i = 0; i < records.length; i += 500) {
    const { error } = await supabase
      .from('songs')
      .upsert(records.slice(i, i + 500), { onConflict: 'external_id', ignoreDuplicates: true })
    if (error) { console.error('\nError insertando:', error.message); process.exit(1) }
    process.stdout.write(`\r  insertadas ${Math.min(i + 500, records.length)}/${records.length}`)
  }
  console.log()
}

// 6. youtube.json: lo que ya tenías + enlaces exactos por ID de Spotify (existentes y nuevas)
const yt = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
const before = Object.keys(yt).length
for (const s of await fetchAllSongs()) {
  if (!yt[s.id] && kaggle.has(s.external_id)) yt[s.id] = kaggle.get(s.external_id)
}
mkdirSync('public/data', { recursive: true })
writeFileSync(OUT, JSON.stringify(yt))
console.log(`youtube.json: ${before} → ${Object.keys(yt).length} videos`)