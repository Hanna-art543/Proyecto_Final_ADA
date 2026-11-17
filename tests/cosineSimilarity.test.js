import { describe, it, expect } from 'vitest'
import {
  FEATURES,
  toVector,
  dot,
  norm,
  cosine,
  meanVector,
  subtract,
  centeredCosine,
  toAffinityPercent,
} from '../src/algorithms/cosineSimilarity.js'

const rock = [0.9, 0.5, 0.1, 0.1, 0.5]
const electro = [0.8, 0.9, 0.05, 0.7, 0.6]
const acoustic = [0.2, 0.3, 0.9, 0.2, 0.4]
const mean = meanVector([rock, electro, acoustic])

describe('operaciones básicas', () => {
  it('dot, norm y subtract', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
    expect(norm([3, 4])).toBe(5)
    expect(subtract([1, 2], [0.5, 3])).toEqual([0.5, -1])
  })

  it('meanVector promedia por dimensión', () => {
    const m = meanVector([[0, 0, 0, 0, 0], [1, 2, 3, 4, 5]])
    expect(m).toEqual([0.5, 1, 1.5, 2, 2.5])
  })
})

describe('cosine', () => {
  it('vectores iguales = 1', () => {
    expect(cosine(rock, rock)).toBeCloseTo(1, 10)
  })

  it('ortogonales = 0', () => {
    expect(cosine([1, 0, 0, 0, 0], [0, 1, 0, 0, 0])).toBe(0)
  })

  it('opuestos = -1', () => {
    expect(cosine([1, 2, 3, 0, 0], [-1, -2, -3, 0, 0])).toBeCloseTo(-1, 10)
  })

  it('vector nulo = 0 (nunca NaN)', () => {
    const r = cosine([0, 0, 0, 0, 0], rock)
    expect(r).toBe(0)
    expect(Number.isNaN(r)).toBe(false)
  })
})

describe('centeredCosine', () => {
  it('el coseno normal es alto aunque los estilos sean distintos', () => {
    expect(cosine(rock, acoustic)).toBeGreaterThan(0.4)
  })

  it('al centrar, rock y acoustic quedan opuestos', () => {
    expect(centeredCosine(rock, acoustic, mean)).toBeLessThan(0)
  })

  it('una canción consigo misma ≈ 1', () => {
    expect(centeredCosine(rock, rock, mean)).toBeCloseTo(1, 10)
  })
})

describe('toVector', () => {
  it('respeta el orden de FEATURES', () => {
    expect(FEATURES).toEqual(['energy', 'danceability', 'acousticness', 'instrumentalness', 'valence'])
    const row = {
      valence: 0.5,
      id: 'x',
      instrumentalness: 0.4,
      energy: 0.1,
      acousticness: 0.3,
      danceability: 0.2,
    }
    expect(toVector(row)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5])
  })

  it('convierte null y campos faltantes en 0', () => {
    expect(toVector({ energy: null, danceability: 0.7 })).toEqual([0, 0.7, 0, 0, 0])
  })
})

describe('toAffinityPercent', () => {
  it('1 → 100, 0 → 50, -1 → 0', () => {
    expect(toAffinityPercent(1)).toBe(100)
    expect(toAffinityPercent(0)).toBe(50)
    expect(toAffinityPercent(-1)).toBe(0)
  })
})
