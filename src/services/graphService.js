import { supabase } from '../lib/supabase'
import {
  MUSIC_FEATURES,
  buildNearestNeighborGraph,
  getSongId,
  graphFromNeighbors,
  normalizeNeighborIndex,
} from '../algorithms/buildGraph.js'
import { kruskal } from '../algorithms/kruskal.js'

const SONG_COLUMNS = [
  'id',
  'external_id',
  'title',
  'artist',
  'genre_id',
  'energy',
  'danceability',
  'acousticness',
  'instrumentalness',
  'valence',
  'genre:genres(name)',
].join(',')

let neighborDataPromise = null

export async function fetchGraphSongs(client = supabase) {
  const pageSize = 1000
  const songs = []

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await client
      .from('songs')
      .select(SONG_COLUMNS)
      .order('id')
      .range(start, start + pageSize - 1)
    if (error) throw error
    const page = data ?? []
    songs.push(...page)
    if (page.length < pageSize) break
  }
  return songs
}

export async function loadNeighborData(fetcher = fetch) {
  if (!neighborDataPromise) {
    neighborDataPromise = fetcher('/data/neighbors.json').then(async (response) => {
      if (!response.ok) throw new Error(`No se pudo cargar neighbors.json (${response.status})`)
      return response.json()
    }).catch((error) => {
      neighborDataPromise = null
      throw error
    })
  }
  return neighborDataPromise
}

export function clearNeighborCache() {
  neighborDataPromise = null
}

function genreName(song) {
  if (typeof song.genre === 'string') return song.genre
  if (Array.isArray(song.genre)) return song.genre[0]?.name ?? null
  return song.genre?.name ?? null
}

function summarizeStyle(songs, index) {
  const genreFrequency = new Map()
  for (const song of songs) {
    const genre = genreName(song)
    if (genre) genreFrequency.set(genre, (genreFrequency.get(genre) ?? 0) + 1)
  }

  let dominantGenre = null
  let dominantCount = 0
  for (const [genre, count] of genreFrequency) {
    if (count > dominantCount) {
      dominantGenre = genre
      dominantCount = count
    }
  }

  const centroid = Object.fromEntries(MUSIC_FEATURES.map((feature) => {
    const values = songs.map((song) => Number(song[feature])).filter(Number.isFinite)
    const average = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0
    return [feature, average]
  }))

  return {
    id: `style-${index + 1}`,
    name: dominantGenre ? `Estilo ${index + 1}: ${dominantGenre}` : `Estilo ${index + 1}`,
    dominantGenre,
    centroid,
    songs,
    songCount: songs.length,
  }
}

export function clusterSongs(songs, neighborData, targetComponents = 6) {
  if (!Array.isArray(songs)) throw new TypeError('songs debe ser un arreglo')
  if (!Number.isInteger(targetComponents) || targetComponents < 1) {
    throw new RangeError('targetComponents debe ser un entero positivo')
  }
  if (songs.length === 0) {
    return { graph: graphFromNeighbors([], []), styles: [], kruskalResult: null }
  }

  const neighborIndex = normalizeNeighborIndex(neighborData)
  const graph = neighborIndex.size > 0
    ? graphFromNeighbors(songs, neighborIndex)
    : buildNearestNeighborGraph(songs, 5).graph
  const componentTarget = Math.max(1, Math.min(targetComponents, graph.vertexCount))
  const kruskalResult = kruskal(graph, componentTarget)
  const songsById = new Map(songs.map((song) => [getSongId(song), song]))
  const styles = kruskalResult.components
    .map((component) => component.map((id) => songsById.get(String(id))).filter(Boolean))
    .filter((component) => component.length > 0)
    .sort((left, right) => right.length - left.length)
    .map(summarizeStyle)

  return { graph, styles, kruskalResult, neighborIndex }
}

export async function getGraphData({
  targetComponents = 6,
  client = supabase,
  fetcher = fetch,
} = {}) {
  const [songs, neighborData] = await Promise.all([
    fetchGraphSongs(client),
    loadNeighborData(fetcher).catch(() => []),
  ])
  return { songs, ...clusterSongs(songs, neighborData, targetComponents) }
}

export function resolveRelatedSongs(songId, songs, neighborData, limit = 5) {
  const normalizedId = String(songId)
  const songsById = new Map(songs.map((song) => [getSongId(song), song]))
  const neighbors = normalizeNeighborIndex(neighborData).get(normalizedId) ?? []
  return neighbors.slice(0, limit).map((neighbor) => {
    const song = songsById.get(neighbor.songId)
    return song ? {
      ...song,
      songId: neighbor.songId,
      similarity: neighbor.similarity,
      distance: neighbor.distance,
    } : null
  }).filter(Boolean)
}

export async function getRelatedSongs(songId, {
  songs = null,
  limit = 5,
  client = supabase,
  fetcher = fetch,
} = {}) {
  const [catalog, neighborData] = await Promise.all([
    songs ? Promise.resolve(songs) : fetchGraphSongs(client),
    loadNeighborData(fetcher),
  ])
  return resolveRelatedSongs(songId, catalog, neighborData, limit)
}
