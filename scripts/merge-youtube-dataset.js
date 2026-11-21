// Uso: node scripts/merge-youtube-dataset.js
// Cruza public/data/catalog.json con data/spotify-youtube.csv y AÑADE los
// enlaces a public/data/youtube.json (no borra los que ya tengas).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { parse } from 'csv-parse/sync'

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const firstArtist = (a) => String(a ?? '').split(/[;,&]/)[0]
const keyTA = (t, a) => `${norm(t)}|${norm(firstArtist(a))}`
const idOf = (u) => String(u ?? '').match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null

const rows = parse(readFileSync('data/spotify-youtube.csv', 'utf8'), {
  columns: true, skip_empty_lines: true, bom: true, relax_quotes: true,
})

const byTitleArtist = new Map()
const byTitle = new Map() // título -> [{id, dur}]
for (const r of rows) {
  const id = idOf(r.Url_youtube)
  if (!id) continue
  byTitleArtist.set(keyTA(r.Track, r.Artist), id)
  const t = norm(r.Track)
  if (!byTitle.has(t)) byTitle.set(t, [])
  byTitle.get(t).push({ id, dur: Number(r.Duration_ms) })
}

const catalog = JSON.parse(readFileSync('public/data/catalog.json', 'utf8'))
const OUT = 'public/data/youtube.json'
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}

let pass1 = 0, pass2 = 0
for (const s of catalog) {
  if (out[s.id]) continue // lo que ya tenías tiene prioridad
  let id = byTitleArtist.get(keyTA(s.title, s.artist))
  if (id) { out[s.id] = id; pass1++; continue }

  const cands = byTitle.get(norm(s.title))
  if (cands && cands.length === 1 && Math.abs(cands[0].dur - s.duration_ms) <= 2000) {
    out[s.id] = cands[0].id
    pass2++
  }
}

writeFileSync(OUT, JSON.stringify(out))
console.log(`Por título+artista: ${pass1} | por título+duración: ${pass2}`)
console.log(`Total en youtube.json: ${Object.keys(out).length} de ${catalog.length} canciones`)