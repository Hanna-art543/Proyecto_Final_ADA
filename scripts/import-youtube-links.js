// Uso: node scripts/import-youtube-links.js
// Lee data/youtube-links.csv y genera public/data/youtube.json
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'csv-parse/sync'

const rows = parse(readFileSync('data/youtube-links.csv', 'utf8'), {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  delimiter: [',', ';'], // Excel en español suele guardar con ;
})

const idOf = (url) => {
  const u = String(url ?? '').trim()
  const m = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  if (m) return m[1]
  return /^[A-Za-z0-9_-]{11}$/.test(u) ? u : null
}

const out = {}
let skipped = 0
for (const r of rows) {
  // acepta el enlace en youtube_url o, si lo pegaste ahí, en buscar_en_youtube
  const candidates = [r.youtube_url, r.buscar_en_youtube].filter(
    (u) => u && u.trim() && !u.includes('/results')
  )
  let id = null
  for (const c of candidates) {
    id = idOf(c)
    if (id) break
  }
  if (id) out[r.id] = id
  else if (candidates.length) {
    skipped++
    console.warn(`Enlace no válido en la fila id=${r.id}: ${candidates[0]}`)
  }
}
writeFileSync('public/data/youtube.json', JSON.stringify(out))
console.log(`youtube.json listo: ${Object.keys(out).length} videos (${skipped} enlaces inválidos)`)