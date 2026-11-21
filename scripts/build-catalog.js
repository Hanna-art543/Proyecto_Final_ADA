// Genera public/data/catalog.json leyendo la tabla songs de Supabase (ids reales).
// Uso:  node --env-file=.env scripts/build-catalog.js          (solo canciones con video)
//       node --env-file=.env scripts/build-catalog.js --all    (todas, sin filtrar)
// Variables en .env: VITE_SUPABASE_URL (o SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY.
// ⚠ La service_role solo se usa aquí, en tu máquina. Nunca en el frontend.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL (o SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })
const PAGE = 1000
const MIN_PLAYABLE = 50 // igual que songService.js
const keepAll = process.argv.includes('--all')

// El orden de features es el mismo que usa seed-songs.js
const SELECT =
  'id, external_id, title, artist, duration_ms, youtube_video_id, danceability, energy, valence, acousticness, instrumentalness, genres(name)'

let catalog = []
for (let from = 0; ; from += PAGE) {
  const { data, error } = await supabase
    .from('songs')
    .select(SELECT)
    .order('id', { ascending: true })
    .range(from, from + PAGE - 1)
  if (error) {
    console.error('Error leyendo songs:', error.message)
    process.exit(1)
  }
  for (const s of data) {
    catalog.push({
      id: s.id,
      title: s.title,
      artist: s.artist,
      genre: s.genres?.name ?? null,
      duration_ms: s.duration_ms,
      youtube_video_id: s.youtube_video_id ?? null,
      features: [s.danceability, s.energy, s.valence, s.acousticness, s.instrumentalness],
    })
  }
  if (data.length < PAGE) break
}

if (catalog.length === 0) {
  console.error('La tabla songs está vacía. Primero ejecuta: npm run seed -- data/dataset.csv')
  process.exit(1)
}

const total = catalog.length
const playable = catalog.filter((s) => s.youtube_video_id)
if (!keepAll && playable.length >= MIN_PLAYABLE) catalog = playable

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'catalog.json'), JSON.stringify(catalog))
console.log(
  `catalog.json listo: ${catalog.length} canciones (${playable.length} con video, ${total} en la base)`
)