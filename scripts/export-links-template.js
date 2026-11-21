// Uso: node scripts/export-links-template.js [cantidad]
// Crea data/youtube-links.csv para llenar en Excel / LibreOffice.
import { readFileSync, writeFileSync } from 'node:fs'

const N = Number(process.argv[2] ?? 100)
const catalog = JSON.parse(readFileSync('public/data/catalog.json', 'utf8'))
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

const rows = ['id,title,artist,buscar_en_youtube,youtube_url']
for (const s of catalog.slice(0, N)) {
  const q = encodeURIComponent(`${s.title} ${String(s.artist).split(/[;,]/)[0]}`)
  rows.push(
    [s.id, esc(s.title), esc(s.artist), `https://www.youtube.com/results?search_query=${q}`, ''].join(',')
  )
}
writeFileSync('data/youtube-links.csv', '\uFEFF' + rows.join('\n'))
console.log(`data/youtube-links.csv creado con ${Math.min(N, catalog.length)} canciones`)