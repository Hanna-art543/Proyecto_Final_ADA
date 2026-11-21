// Uso: node --env-file=.env scripts/fetch-youtube-ids.js [cantidad]
// Cuota gratis: ~100 búsquedas por día. Se puede repetir: salta las ya buscadas.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const key = process.env.YOUTUBE_API_KEY
if (!key) {
  console.error('Falta YOUTUBE_API_KEY en .env')
  process.exit(1)
}

const LIMIT = Number(process.argv[2] ?? 90)
const OUT = 'public/data/youtube.json'
const catalog = JSON.parse(readFileSync('public/data/catalog.json', 'utf8'))
const ids = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}

let done = 0
for (const s of catalog) {
  if (ids[s.id] !== undefined) continue
  if (done >= LIMIT) break
  const q = encodeURIComponent(`${s.title} ${s.artist.split(/[;,]/)[0]}`)
  const url =
    'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video' +
    `&videoEmbeddable=true&maxResults=1&q=${q}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('Error', res.status, (await res.text()).slice(0, 300))
    break // normalmente: cuota agotada o clave mal puesta
  }
  const data = await res.json()
  ids[s.id] = data.items?.[0]?.id?.videoId ?? null
  done++
}

writeFileSync(OUT, JSON.stringify(ids))
console.log(`${done} canciones nuevas. Total guardado: ${Object.keys(ids).length}`)