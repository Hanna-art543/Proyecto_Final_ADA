import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

import { clusterSongs, fetchGraphSongs, resolveRelatedSongs } from './graphService.js'

function song(id, offset = 0) {
  return {
    id,
    external_id: `external-${id}`,
    title: `Song ${id}`,
    artist: 'Artist',
    energy: 0.2 + offset,
    danceability: 0.3 + offset,
    acousticness: 0.4 + offset,
    instrumentalness: 0.5 + offset,
    valence: 0.6 + offset,
  }
}

describe('fetchGraphSongs', () => {
  it('pagina el catálogo completo más allá de 1 000 canciones', async () => {
    const catalog = Array.from({ length: 2005 }, (_, index) => song(index))
    const ranges = []
    const query = {
      select: () => query,
      order: () => query,
      range: (start, end) => {
        ranges.push([start, end])
        return Promise.resolve({ data: catalog.slice(start, end + 1), error: null })
      },
    }
    const client = { from: vi.fn(() => query) }

    const result = await fetchGraphSongs(client)
    expect(result).toHaveLength(2005)
    expect(ranges).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
    expect(client.from).toHaveBeenCalledWith('songs')
  })
})

describe('clusterSongs', () => {
  it('no pierde canciones al formar K estilos', () => {
    const songs = [song(1, 0), song(2, 0.05), song(3, 0.1), song(4, 0.15)]
    const neighborData = [
      { songId: 'external-1', neighbors: [{ songId: 'external-2', distance: 0.1 }] },
      { songId: 'external-2', neighbors: [{ songId: 'external-1', distance: 0.1 }] },
      { songId: 'external-3', neighbors: [{ songId: 'external-4', distance: 0.1 }] },
      { songId: 'external-4', neighbors: [{ songId: 'external-3', distance: 0.1 }] },
    ]

    const result = clusterSongs(songs, neighborData, 2)
    const clusteredIds = result.styles.flatMap((style) => style.songs.map((item) => item.external_id))
    expect(result.kruskalResult.reachedTarget).toBe(true)
    expect(clusteredIds.sort()).toEqual(songs.map((item) => item.external_id).sort())
    expect(new Set(clusteredIds).size).toBe(songs.length)
  })

  it('mantiene catálogos vacíos y valida K', () => {
    expect(clusterSongs([], [], 1).styles).toEqual([])
    expect(() => clusterSongs([song(1)], [], 0)).toThrow(/entero positivo/i)
  })
})

describe('resolveRelatedSongs', () => {
  it('une por external_id y descarta vecinos ausentes del catálogo', () => {
    const songs = [song(1), song(2)]
    const neighbors = [{
      songId: 'external-1',
      neighbors: [
        { songId: 'external-2', similarity: 0.9, distance: 0.1 },
        { songId: 'external-missing', similarity: 0.8, distance: 0.2 },
      ],
    }]
    const result = resolveRelatedSongs('external-1', songs, neighbors)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ external_id: 'external-2', similarity: 0.9 })
  })
})
