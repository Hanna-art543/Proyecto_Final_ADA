/**
 * Servicio de recomendaciones.
 * Las funciones puras no dependen de Supabase; recommendForUser lo carga solo cuando se usa.
 */
import { FEATURES, toVector } from '../algorithms/cosineSimilarity.js'
import { knn } from '../algorithms/knn.js'

/**
 * Peso de una interacción del usuario con una canción.
 * Ratings 1 o 2 se descartan (null).
 * w = 0.5·liked + 0.4·(rating/5) + 0.1·min(play_count, 10)/10
 * Acepta `liked` (tests) o `is_favorite` (columna de Supabase).
 */
export function interactionWeight({
  rating = null,
  liked = false,
  is_favorite = false,
  play_count = 0,
} = {}) {
  if (rating === 1 || rating === 2) return null
  const likedPart = liked || is_favorite ? 1 : 0
  const ratingPart = rating == null ? 0 : rating / 5
  const plays = play_count == null || play_count < 0 ? 0 : play_count
  const playsPart = (plays < 10 ? plays : 10) / 10
  return 0.5 * likedPart + 0.4 * ratingPart + 0.1 * playsPart
}

/**
 * Peso de las preferencias declaradas según cuántas interacciones contaron.
 * 1 sin interacciones → 0.3 con 10 o más.
 */
export function computeBeta(n) {
  const m = n < 10 ? n : 10
  return 1 - (0.7 * m) / 10
}

/**
 * Construye el vector de perfil del usuario: u = beta·p + (1 - beta)·h
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

const NEUTRAL = Object.fromEntries(FEATURES.map((f) => [f, 0.5]))

/** Preferencias completas: lo que falte (o sea null) se llena con 0.5. */
function completePreferences(prefs) {
  const out = { ...NEUTRAL }
  if (prefs) for (const f of FEATURES) if (prefs[f] != null) out[f] = prefs[f]
  return out
}

/** Canción del catálogo con sus features también como campos con nombre. */
function withNamedFeatures(song) {
  const named = Object.fromEntries(FEATURES.map((f, i) => [f, song.features?.[i]]))
  return { ...song, ...named }
}

/**
 * Top-K canciones para el usuario, con afinidad 0..1.
 * @returns {Promise<{ coldStart: boolean, items: {song: object, score: number}[] }>}
 */
export async function recommendForUser(userId, k = 20) {
  // imports dinámicos: así los tests de las funciones puras no cargan Supabase
  const [{ getCatalog }, { getPreferences }, { getInteractions }] = await Promise.all([
    import('./songService.js'),
    import('./preferenceService.js'),
    import('./interactionService.js'),
  ])

  const [catalog, preferences, interactions] = await Promise.all([
    getCatalog(),
    getPreferences(userId),
    getInteractions(userId),
  ])

  const byId = new Map(catalog.map((s) => [s.id, withNamedFeatures(s)]))
  const profile = buildUserProfile(completePreferences(preferences), interactions, (id) =>
    byId.get(id)
  )

  const rated = new Set((interactions || []).filter((i) => i.rating != null).map((i) => i.song_id))
  // si ya hay videos cargados, solo se recomienda lo que se puede reproducir
  const onlyPlayable = catalog.some((s) => s.youtube_video_id)
  const items = knn(profile, catalog, k, {
    exclude: (s) => rated.has(s.id) || (onlyPlayable && !s.youtube_video_id),
  })

  return { coldStart: !preferences && !(interactions || []).length, items }
}