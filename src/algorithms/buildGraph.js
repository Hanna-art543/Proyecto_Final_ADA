import { Graph } from './graph.js'

export const MUSIC_FEATURES = [
  'energy',
  'danceability',
  'acousticness',
  'instrumentalness',
  'valence',
]

const FEATURE_CENTER = 0.5

export function getSongId(song) {
  const id = song?.external_id ?? song?.externalId ?? song?.id
  return id === undefined || id === null ? null : String(id)
}

export function hasMusicFeatures(song) {
  return MUSIC_FEATURES.every((feature) => {
    const rawValue = song?.[feature]
    if (rawValue === null || rawValue === undefined || rawValue === '') return false
    const value = Number(rawValue)
    return Number.isFinite(value) && value >= 0 && value <= 1
  })
}

function toCenteredVector(song) {
  if (!hasMusicFeatures(song)) return null
  const values = MUSIC_FEATURES.map((feature) => Number(song[feature]) - FEATURE_CENTER)
  const squaredMagnitude = values.reduce((sum, value) => sum + (value * value), 0)
  return { values, magnitude: Math.sqrt(squaredMagnitude) }
}

function vectorSimilarity(left, right) {
  if (left.magnitude === 0 || right.magnitude === 0) {
    return left.magnitude === right.magnitude ? 1 : 0
  }
  let dotProduct = 0
  for (let index = 0; index < left.values.length; index += 1) {
    dotProduct += left.values[index] * right.values[index]
  }
  return Math.max(-1, Math.min(1, dotProduct / (left.magnitude * right.magnitude)))
}

/**
 * Coseno centrado en 0.5, punto medio de las características normalizadas.
 * Retorna un valor en [-1, 1]. Dos vectores neutros idénticos tienen 1; un
 * vector neutro frente a otro no neutro se considera sin afinidad (0).
 */
export function centeredCosineSimilarity(leftSong, rightSong) {
  const left = toCenteredVector(leftSong)
  const right = toCenteredVector(rightSong)
  return left && right ? vectorSimilarity(left, right) : null
}

function compareNeighbors(left, right) {
  if (left.similarity !== right.similarity) return right.similarity - left.similarity
  return left.songId.localeCompare(right.songId)
}

/** Inserta un candidato manteniendo solo los K mejores, sin ordenar N elementos. */
function keepNearest(list, songId, similarity, neighborCount) {
  const last = list[list.length - 1]
  if (
    list.length === neighborCount
    && (similarity < last.similarity
      || (similarity === last.similarity && songId.localeCompare(last.songId) >= 0))
  ) return

  const candidate = { songId, similarity, distance: 1 - similarity }
  let index = 0
  while (index < list.length && compareNeighbors(list[index], candidate) <= 0) index += 1
  list.splice(index, 0, candidate)
  if (list.length > neighborCount) list.pop()
}

/**
 * Calcula los K vecinos más cercanos para cada canción. Cada par se evalúa
 * una sola vez y alimenta las listas de ambos extremos.
 */
export function calculateNearestNeighbors(songs, neighborCount = 5) {
  if (!Array.isArray(songs)) throw new TypeError('songs debe ser un arreglo')
  if (!Number.isInteger(neighborCount) || neighborCount < 0) {
    throw new RangeError('neighborCount debe ser un entero no negativo')
  }

  const validSongs = []
  const seen = new Set()
  for (const song of songs) {
    const songId = getSongId(song)
    if (songId === null || seen.has(songId) || !hasMusicFeatures(song)) continue
    seen.add(songId)
    const vector = toCenteredVector(song)
    validSongs.push({ songId, vector })
  }

  const result = new Map(validSongs.map(({ songId }) => [songId, []]))
  if (neighborCount === 0) return result

  for (let leftIndex = 0; leftIndex < validSongs.length; leftIndex += 1) {
    const left = validSongs[leftIndex]
    for (let rightIndex = leftIndex + 1; rightIndex < validSongs.length; rightIndex += 1) {
      const right = validSongs[rightIndex]
      const similarity = vectorSimilarity(left.vector, right.vector)

      keepNearest(result.get(left.songId), right.songId, similarity, neighborCount)
      keepNearest(result.get(right.songId), left.songId, similarity, neighborCount)
    }
  }

  return result
}

export function serializeNeighbors(neighborMap) {
  return [...neighborMap].map(([songId, neighbors]) => ({
    songId,
    neighbors: neighbors.map((neighbor) => ({
      ...neighbor,
      similarity: Number(neighbor.similarity.toFixed(8)),
      distance: Number(neighbor.distance.toFixed(8)),
    })),
  }))
}

export function normalizeNeighborIndex(data) {
  if (data instanceof Map) return data
  const entries = Array.isArray(data) ? data : data?.songs ?? []
  const index = new Map()

  for (const entry of entries) {
    const songId = entry?.songId === undefined ? null : String(entry.songId)
    if (songId === null || !Array.isArray(entry.neighbors)) continue
    index.set(
      songId,
      entry.neighbors
        .filter((neighbor) => neighbor?.songId !== undefined)
        .map((neighbor) => ({
          songId: String(neighbor.songId),
          similarity: Number(neighbor.similarity),
          distance: Number.isFinite(Number(neighbor.distance))
            ? Number(neighbor.distance)
            : 1 - Number(neighbor.similarity),
        }))
        .filter((neighbor) => Number.isFinite(neighbor.distance) && neighbor.distance >= 0),
    )
  }

  return index
}

export function graphFromNeighbors(songs, neighborData) {
  const graph = new Graph()
  const songsById = new Map()

  for (const song of songs) {
    const songId = getSongId(song)
    if (songId === null || songsById.has(songId)) continue
    songsById.set(songId, song)
    graph.addVertex(songId, song)
  }

  const neighborIndex = neighborData instanceof Map
    ? neighborData
    : normalizeNeighborIndex(neighborData)

  for (const [songId, neighbors] of neighborIndex) {
    if (!songsById.has(songId)) continue
    for (const neighbor of neighbors) {
      if (!songsById.has(neighbor.songId)) continue
      graph.addEdge(songId, neighbor.songId, neighbor.distance)
    }
  }

  return graph
}

export function buildNearestNeighborGraph(songs, neighborCount = 5) {
  const neighbors = calculateNearestNeighbors(songs, neighborCount)
  return {
    graph: graphFromNeighbors(songs, neighbors),
    neighbors,
  }
}
