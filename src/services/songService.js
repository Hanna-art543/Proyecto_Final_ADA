import { HashTable } from '../algorithms/hashTable.js'
import { AVLTree } from '../algorithms/avlTree.js'

/**
 * @typedef {Object} Song
 * @property {number} id
 * @property {string} title
 * @property {string} artist
 * @property {string|null} genre
 * @property {number} duration_ms
 * @property {string|null} youtube_video_id
 * @property {number[]} features [danceability, energy, valence, acousticness, instrumentalness]
 */

// Si hay al menos este número de canciones con video, el catálogo de la app
// son solo las reproducibles. Si hay menos, se usa todo el catálogo.
const MIN_PLAYABLE = 50

const normalize = (s) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/** @type {Promise<Song[]> | null} */
let catalogPromise = null
/** @type {HashTable<Song> | null} */
let byId = null
/** @type {AVLTree<Song> | null} */
let byTitle = null


/**
 * Carga el catálogo estático (una sola vez, sin paginar ni consultar Supabase).
 * Devuelve solo las canciones con video cuando hay suficientes.
 * @returns {Promise<Song[]>}
 */
export function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch('/data/catalog.json')
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`)
        return res.json()
      })
    .then((all) => {
      const playable = all.filter((s) => s.youtube_video_id)
      const songs = playable.length >= MIN_PLAYABLE ? playable : all

      byId = new HashTable()
      byTitle = new AVLTree()
      for (const s of songs) {
        byId.set(s.id, s)
        byTitle.insert(normalize(s.title), s)
      }
      return songs
    })
      .catch((err) => {
        catalogPromise = null // permite reintentar
        throw err
      })
  }
  return catalogPromise
}

/**
 * @param {number|string} id
 * @returns {Promise<Song | undefined>} undefined si la canción no está en el catálogo
 */
export async function getSongById(id) {
  await getCatalog()
  return byId.get(id)
}

/** Autocompletado por prefijo de título (AVL), sin tildes ni mayúsculas. */
export async function searchByTitle(prefix, limit = 10) {
  await getCatalog()
  const p = normalize(prefix)
  if (!p) return []
  return byTitle.searchPrefix(p, limit)
}

/** Prefijo de título (AVL) primero; luego coincidencias en título o artista. */
export async function searchSongs(text, limit = 30) {
  const all = await getCatalog()
  const q = normalize(text)
  if (!q) return []
  const found = [...(await searchByTitle(q, limit))]
  if (found.length >= limit) return found
  const seen = new Set(found.map((s) => s.id))
  for (const s of all) {
    if (found.length >= limit) break
    if (seen.has(s.id)) continue
    if (normalize(s.title).includes(q) || normalize(s.artist).includes(q)) found.push(s)
  }
  return found
}