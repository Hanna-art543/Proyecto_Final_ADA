// Uso: node --env-file=.env scripts/sync-youtube-to-db.js
// Guarda youtube_video_id en la tabla songs usando data/spotify-youtube.csv
// (y, si existe, los enlaces manuales de public/data/youtube.json).
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const keyTA = (t, a) => {
  const nt = norm(t)
  const na = norm(String(a ?? '').split(/[;,&]/)[0])
  return nt && na ? `${nt}|${na}` : null
}
const ytId = (u) => String(u ?? '').match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null

// 1. enlaces de Kaggle (por ID de Spotify y por título+artista)
const byUri = new Map()
const byKey = new Map()
const rows = parse(readFileSync('data/spotify-youtube.csv', 'utf8'), {
  columns: true, skip_empty_lines: true, bom: true, relax_quotes: true,
})
for (const r of rows) {
  const vid = ytId(r.Url_youtube)
  if (!vid) continue
  const uri = String(r.Uri ?? '').replace('spotify:track:', '')
  if (uri && !byUri.has(uri)) byUri.set(uri, vid)
  const k = keyTA(r.Track, r.Artist)
  if (k && !byKey.has(k)) byKey.set(k, vid)
}

// 2. enlaces manuales (opcional)
const manualPath = 'public/data/youtube.json'
const manual = existsSync(manualPath) ? JSON.parse(readFileSync(manualPath, 'utf8')) : {}

// 3. canciones de la base
const songs = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('songs')
    .select('id, external_id, title, artist, youtube_video_id')
    .order('id', { ascending: true })
    .range(from, from + 999)
  if (error) {
    console.error('Error leyendo songs:', error.message)
    console.error('¿Ya creaste la columna? alter table public.songs add column youtube_video_id text;')
    process.exit(1)
  }
  songs.push(...data)
  if (data.length < 1000) break
}

// 4. decidir qué enlace va a cada canción que aún no tiene
let porManual = 0, porId = 0, porTitulo = 0
const updates = []
for (const s of songs) {
  if (s.youtube_video_id) continue
  let vid = manual[s.id]
  if (vid) porManual++
  else if ((vid = byUri.get(s.external_id))) porId++
  else {
    const k = keyTA(s.title, s.artist)
    if (k && (vid = byKey.get(k))) porTitulo++
  }
  if (vid) updates.push({ id: s.id, vid })
}
console.log(`Canciones en la base: ${songs.length}`)
console.log(`Enlaces nuevos: ${updates.length} (manual ${porManual}, ID exacto ${porId}, título+artista ${porTitulo})`)

// 5. guardar en la base, en tandas
for (let i = 0; i < updates.length; i += 25) {
  const batch = updates.slice(i, i + 25)
  const results = await Promise.all(
    batch.map((u) => supabase.from('songs').update({ youtube_video_id: u.vid }).eq('id', u.id))
  )
  const failed = results.find((r) => r.error)
  if (failed) { console.error('\nError actualizando:', failed.error.message); process.exit(1) }
  process.stdout.write(`\r  guardados ${Math.min(i + 25, updates.length)}/${updates.length}`)
}
if (updates.length) console.log()

const total = songs.filter((s) => s.youtube_video_id).length + updates.length
console.log(`Total con enlace en la base: ${total}`)