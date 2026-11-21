import { MinHeap } from './heap.js'
import { cosine } from './cosineSimilarity.js'

/** Similitud por defecto: coseno (la función `cosine` de cosineSimilarity.js). */
function defaultSimilarity(a, b) {
  return cosine(a, b)
}

/** Vector de 5 características de una canción. */
function defaultVector(song) {
  return song.features ?? song.vector
}

/**
 * K-NN con min-heap acotado de tamaño K: O(n·d + n log K).
 * La raíz del heap es la peor de las K mejores; si entra una mejor, la reemplaza.
 * Desempate determinista: a igual puntaje gana la canción que aparece primero.
 *
 * @template S
 * @param {number[]} profile vector del perfil del usuario
 * @param {S[]} songs catálogo
 * @param {number} k cuántas devolver
 * @param {{
 *   similarity?: (a: number[], b: number[]) => number,
 *   vectorOf?: (song: S) => number[],
 *   exclude?: (song: S) => boolean
 * }} [opts] exclude sirve para saltar canciones ya calificadas
 * @returns {{song: S, score: number}[]} de mayor a menor puntaje
 */
export function knn(profile, songs, k, opts = {}) {
  const { similarity = defaultSimilarity, vectorOf = defaultVector, exclude } = opts
  if (!(k > 0)) return []

  // más chico = peor. A igual puntaje es peor el de índice mayor.
  const heap = new MinHeap((a, b) => a.score - b.score || b.idx - a.idx)

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i]
    if (exclude && exclude(song)) continue
    const score = similarity(profile, vectorOf(song))
    if (Number.isNaN(score)) continue
    const entry = { song, score, idx: i }
    if (heap.size() < k) heap.push(entry)
    else if (score > heap.peek().score) heap.replaceTop(entry)
  }

  const out = []
  while (!heap.isEmpty()) out.push(heap.pop())
  out.reverse()
  return out.map(({ song, score }) => ({ song, score }))
}

export default knn