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

/** @type {Promise<Song[]> | null} */
let catalogPromise = null
/** @type {HashTable<Song> | null} */
let byId = null
/** @type {AVLTree<Song> | null} */
let byTitle = null

/**
 * Carga el catálogo estático (una sola vez, sin paginar ni consultar Supabase).
 * @returns {Promise<Song[]>}
 */
export function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch('/data/catalog.json')
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el catálogo (${res.status})`)
        return res.json()
      })
      .then((songs) => {
        byId = new HashTable()
        byTitle = new AVLTree()
        for (const s of songs) {
          byId.set(s.id, s)
          byTitle.insert(s.title, s)
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
 * @returns {Promise<Song | undefined>}
 */
export async function getSongById(id) {
  await getCatalog()
  return byId.get(id)
}

/**
 * Autocompletado por prefijo de título (AVL).
 * @param {string} prefix
 * @param {number} [limit]
 * @returns {Promise<Song[]>}
 */
export async function searchByTitle(prefix, limit = 10) {
  await getCatalog()
  if (!prefix.trim()) return []
  return byTitle.searchPrefix(prefix, limit)
}