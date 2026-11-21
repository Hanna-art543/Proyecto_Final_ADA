import { describe, it, expect } from 'vitest'
import { knn } from '../src/algorithms/knn.js'

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)
const songs = [
  { id: 'A', features: [1, 0] },
  { id: 'B', features: [0, 1] },
  { id: 'C', features: [0.9, 0.1] },
  { id: 'D', features: [0.5, 0.5] },
]
const ids = (r) => r.map((x) => x.song.id)

describe('knn', () => {
  it('devuelve las K mejores de mayor a menor', () => {
    const r = knn([1, 0], songs, 2, { similarity: dot })
    expect(ids(r)).toEqual(['A', 'C'])
    expect(r[0].score).toBe(1)
  })

  it('k mayor que el catálogo devuelve todo ordenado', () => {
    expect(ids(knn([1, 0], songs, 10, { similarity: dot }))).toEqual(['A', 'C', 'D', 'B'])
  })

  it('k <= 0 devuelve vacío', () => {
    expect(knn([1, 0], songs, 0, { similarity: dot })).toEqual([])
  })

  it('exclude salta canciones ya calificadas', () => {
    const r = knn([1, 0], songs, 2, { similarity: dot, exclude: (s) => s.id === 'A' })
    expect(ids(r)).toEqual(['C', 'D'])
  })

  it('empates: gana el que aparece primero', () => {
    const tied = [
      { id: 'X', features: [1, 0] },
      { id: 'Y', features: [1, 0] },
      { id: 'Z', features: [1, 0] },
    ]
    expect(ids(knn([1, 0], tied, 2, { similarity: dot }))).toEqual(['X', 'Y'])
  })
})