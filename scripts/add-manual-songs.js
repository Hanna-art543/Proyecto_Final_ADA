// Uso: node --env-file=.env scripts/add-manual-songs.js [data/new-songs.csv]
// Inserta canciones escritas a mano. No borra ni modifica las existentes.
import { readFileSync } from 'node:fs'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

const FILE = process.argv[2] ?? 'data/new-songs.csv'
const rows = parse(readFileSync(FILE, 'utf8'), {
  columns: true, skip_empty_lines: true, bom: true, trim: true,
  delimiter: [',', ';'],
})

const ytId = (u) => String(u ?? '').match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1]
  ?? (/^[A-Za-z0-9_-]{11}$/.test(String(u ?? '').trim()) ? String(u).trim() : null)
const f01 = (v) => {
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null
}

// géneros: se crean los que falten
const genreNames = [...new Set(rows.map((r) => r.genre).filter(Boolean))]
if (genreNames.length) {
  const g = await supabase.from('genres').upsert(genreNames.map((name) => ({ name })), { onConflict: 'name', ignoreDuplicates: true })
  if (g.error) { console.error('Error en genres:', g.error.message); process.exit(1) }
}
const { data: gs } = await supabase.from('genres').select('id, name')
const genreId = new Map(gs.map((x) => [x.name, x.id]))

const records = []
rows.forEach((r, i) => {
  const line = i + 2
  const feats = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness'].map((c) => f01(r[c]))
  if (!r.title || !r.artist) return console.warn(`Fila ${line}: falta título o artista, se omite`)
  if (feats.includes(null)) return console.warn(`Fila ${line} (${r.title}): las 5 características deben estar entre 0 y 1, se omite`)
  const vid = ytId(r.youtube_url)
  if (!vid) console.warn(`Fila ${line} (${r.title}): enlace de YouTube no válido; se agrega sin video`)
  records.push({
    external_id: r.external_id || `manual-${Date.now()}-${i}`,
    title: r.title,
    artist: r.artist,
    genre_id: genreId.get(r.genre) ?? null,
    duration_ms: Number(r.duration_ms) || null,
    youtube_video_id: vid,
    danceability: feats[0], energy: feats[1], valence: feats[2], acousticness: feats[3], instrumentalness: feats[4],
  })
})

if (!records.length) { console.log('Nada que insertar.'); process.exit(0) }
const { error } = await supabase.from('songs').insert(records)
if (error) { console.error('Error insertando:', error.message); process.exit(1) }
console.log(`${records.length} canciones agregadas.`)