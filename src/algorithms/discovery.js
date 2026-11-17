import { getSongId } from './buildGraph.js'

function affinityFor(song, affinityBySongId) {
  const songId = getSongId(song)
  const externalAffinity = affinityBySongId instanceof Map
    ? affinityBySongId.get(songId)
    : affinityBySongId?.[songId]
  const value = externalAffinity ?? song.affinity ?? song.similarity
  return Number.isFinite(Number(value)) ? Number(value) : null
}

/**
 * Primero toma la canción más afín de cada estilo y después completa con las
 * siguientes mejores. Así la afinidad ordena, pero un solo estilo no monopoliza
 * la sección.
 */
export function selectDiscoverySongs(
  styles,
  affinityBySongId = {},
  limit = 6,
  excludedSongIds = [],
) {
  const excluded = new Set([...excludedSongIds].map(String))
  const pools = styles.map((style) => ({
    style,
    songs: style.songs
      .filter((song) => !excluded.has(getSongId(song)))
      .map((song) => ({ song, affinity: affinityFor(song, affinityBySongId) }))
      .sort((left, right) => (
        (right.affinity ?? Number.NEGATIVE_INFINITY)
        - (left.affinity ?? Number.NEGATIVE_INFINITY)
      )),
  })).filter((pool) => pool.songs.length > 0)

  pools.sort((left, right) => (
    (right.songs[0].affinity ?? Number.NEGATIVE_INFINITY)
    - (left.songs[0].affinity ?? Number.NEGATIVE_INFINITY)
  ))

  const selected = []
  let round = 0
  while (selected.length < limit) {
    let added = false
    for (const pool of pools) {
      const candidate = pool.songs[round]
      if (!candidate) continue
      selected.push({ ...candidate, style: pool.style })
      added = true
      if (selected.length === limit) break
    }
    if (!added) break
    round += 1
  }
  return selected
}
