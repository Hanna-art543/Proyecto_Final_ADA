/**
 * Servicio de recomendaciones.
 * Por ahora solo funciones puras (todavía no importa supabase).
 */
import { FEATURES, toVector } from '../algorithms/cosineSimilarity.js'

/**
 * Peso de una interacción del usuario con una canción.
 * Ratings 1 o 2 se descartan (null).
 * w = 0.5·liked + 0.4·(rating/5) + 0.1·min(play_count, 10)/10
 * @param {{ rating?: number | null, liked?: boolean | null, play_count?: number | null }} interaction
 * @returns {number | null}
 */
export function interactionWeight({ rating = null, liked = false, play_count = 0 } = {}) {
  if (rating === 1 || rating === 2) return null
  const likedPart = liked ? 1 : 0
  const ratingPart = rating == null ? 0 : rating / 5
  const plays = play_count == null || play_count < 0 ? 0 : play_count
  const playsPart = (plays < 10 ? plays : 10) / 10
  return 0.5 * likedPart + 0.4 * ratingPart + 0.1 * playsPart
}

/**
 * Peso de las preferencias declaradas según cuántas interacciones contaron.
 * 1 sin interacciones → 0.3 con 10 o más.
 * @param {number} n
 * @returns {number}
 */
export function computeBeta(n) {
  const m = n < 10 ? n : 10
  return 1 - (0.7 * m) / 10
}

/**
 * Construye el vector de perfil del usuario: u = beta·p + (1 - beta)·h
 * @param {Record<string, any>} preferences fila de user_preferences
 * @param {Array<{ song_id: any, rating?: number | null, liked?: boolean | null, play_count?: number | null }>} interactions
 * @param {(id: any) => (Record<string, any> | null | undefined)} getSong búsqueda en la tabla hash del Integrante 1
 * @returns {number[]}
 */
export function buildUserProfile(preferences, interactions, getSong) {
  const p = toVector(preferences)
  const dims = FEATURES.length
  const h = new Array(dims).fill(0)
  let totalWeight = 0
  let n = 0

  const list = interactions || []
  for (let k = 0; k < list.length; k++) {
    const it = list[k]
    const w = interactionWeight(it)
    if (w == null || w === 0) continue
    const song = getSong(it.song_id)
    if (!song) continue
    const v = toVector(song)
    for (let i = 0; i < dims; i++) h[i] += w * v[i]
    totalWeight += w
    n++
  }

  // Arranque en frío: solo las preferencias declaradas
  if (totalWeight === 0) return p

  for (let i = 0; i < dims; i++) h[i] /= totalWeight
  const beta = computeBeta(n)
  const u = new Array(dims)
  for (let i = 0; i < dims; i++) u[i] = beta * p[i] + (1 - beta) * h[i]
  return u
}
