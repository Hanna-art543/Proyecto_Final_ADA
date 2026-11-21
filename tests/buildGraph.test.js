import { describe, expect, it } from 'vitest'
import {
  MUSIC_FEATURES,
  buildNearestNeighborGraph,
  calculateCatalogFeatureMeans,
  calculateNearestNeighbors,
  centeredCosineSimilarity,
  graphFromNeighbors,
} from './buildGraph.js'

function song(id, values) {
  return Object.fromEntries([
    ['external_id', id],
    ...MUSIC_FEATURES.map((feature, index) => [feature, values[index]]),
  ])
}

const high = song('high', [0.9, 0.8, 0.7, 0.9, 0.8])
const close = song('close', [0.8, 0.7, 0.7, 0.8, 0.7])
const opposite = song('opposite', [0.1, 0.2, 0.3, 0.1, 0.2])

describe('centeredCosineSimilarity', () => {
  it('centra cada característica en su promedio real del catálogo', () => {
    const catalog = [
      song('left', [0.5, 0.8, 0.6, 0.4, 0.7]),
      song('right', [0.6, 0.9, 0.7, 0.5, 0.8]),
      song('third', [0.1, 0.4, 0.2, 0, 0.3]),
    ]
    const featureMeans = calculateCatalogFeatureMeans(catalog)

    expect(featureMeans.energy).toBeCloseTo(0.4)
    expect(featureMeans.danceability).toBeCloseTo(0.7)
    expect(featureMeans.acousticness).toBeCloseTo(0.5)
    expect(featureMeans.instrumentalness).toBeCloseTo(0.3)
    expect(featureMeans.valence).toBeCloseTo(0.6)
    // Los desplazamientos de left y right respecto de la media son paralelos.
    expect(centeredCosineSimilarity(catalog[0], catalog[1], featureMeans)).toBeCloseTo(1)
  })

  it('detecta un centro fijo o medias ausentes', () => {
    const catalog = [high, close, opposite]
    const featureMeans = calculateCatalogFeatureMeans(catalog)
    expect(featureMeans.energy).toBeCloseTo(0.6)
    expect(featureMeans.danceability).toBeCloseTo(0.5666666667)
    expect(() => centeredCosineSimilarity(high, close)).toThrow(/medias reales/i)
  })

  it('controla vectores neutros y datos inválidos', () => {
    const catalog = [high, close, opposite]
    const featureMeans = calculateCatalogFeatureMeans(catalog)
    const center = song('center', MUSIC_FEATURES.map((feature) => featureMeans[feature]))
    expect(centeredCosineSimilarity(center, center, featureMeans)).toBe(1)
    expect(centeredCosineSimilarity(center, high, featureMeans)).toBe(0)
    expect(centeredCosineSimilarity(high, { ...close, energy: 2 }, featureMeans)).toBeNull()
    expect(calculateCatalogFeatureMeans([])).toBeNull()
  })
})

describe('calculateNearestNeighbors', () => {
  it('elige el vecino más cercano y nunca la propia canción', () => {
    const neighbors = calculateNearestNeighbors([high, opposite, close], 1)
    expect(neighbors.get('high')[0].songId).toBe('close')
    expect(neighbors.get('close')[0].songId).toBe('high')
    expect(neighbors.get('high')[0].distance).toBeLessThan(0.05)
    expect(neighbors.get('high').some(({ songId }) => songId === 'high')).toBe(false)
  })

  it('calcula hasta cinco vecinos y maneja catálogos vacíos', () => {
    const songs = Array.from({ length: 8 }, (_, index) => song(
      String(index),
      MUSIC_FEATURES.map((_, feature) => ((index + feature + 1) % 10) / 10),
    ))
    const neighbors = calculateNearestNeighbors(songs)
    expect(neighbors.size).toBe(8)
    expect([...neighbors.values()].every((items) => items.length === 5)).toBe(true)
    expect(calculateNearestNeighbors([]).size).toBe(0)
  })

  it('omite IDs repetidos y canciones con características inválidas', () => {
    const invalid = { ...close, external_id: 'invalid', valence: null }
    const neighbors = calculateNearestNeighbors([high, high, invalid], 5)
    expect([...neighbors.keys()]).toEqual(['high'])
    expect(neighbors.get('high')).toEqual([])
  })
})

describe('construcción del grafo', () => {
  it('crea un grafo no dirigido sin duplicar vecinos mutuos', () => {
    const { graph, neighbors } = buildNearestNeighborGraph([high, close, opposite], 1)
    expect(neighbors.size).toBe(3)
    expect(graph.vertexCount).toBe(3)
    expect(graph.edgeCount).toBeLessThanOrEqual(3)

    for (const edge of graph.getEdges()) {
      expect(graph.getNeighbors(edge.target)).toContainEqual({
        vertex: edge.source,
        weight: edge.weight,
      })
    }
  })

  it('ignora referencias del JSON que no existen en el catálogo', () => {
    const graph = graphFromNeighbors([high], [{
      songId: 'high',
      neighbors: [{ songId: 'missing', similarity: 1, distance: 0 }],
    }])
    expect(graph.vertexCount).toBe(1)
    expect(graph.edgeCount).toBe(0)
  })
})
