import { describe, it, expect } from 'vitest'
import { knapsack } from '../src/algorithms/knapsack.js'

describe('knapsack 0/1', () => {
  const items = [
    { name: 'a', weight: 1, value: 1 },
    { name: 'b', weight: 3, value: 4 },
    { name: 'c', weight: 4, value: 5 },
    { name: 'd', weight: 5, value: 7 },
  ]

  it('da el óptimo (el goloso por valor/peso daría 8)', () => {
    const r = knapsack(items, 7)
    expect(r.value).toBe(9)
    expect(r.items.map((i) => i.name)).toEqual(['b', 'c'])
    expect(r.totalWeight).toBe(7)
  })

  it('capacidad 0 no elige nada', () => {
    const r = knapsack(items, 0)
    expect(r.value).toBe(0)
    expect(r.items).toEqual([])
  })

  it('nunca pasa de la capacidad', () => {
    expect(knapsack(items, 6).totalWeight <= 6).toBe(true)
  })

  it('acepta funciones de peso y valor propias (minutos y afinidad)', () => {
    const songs = [
      { dur: 3, aff: 0.9 },
      { dur: 4, aff: 0.8 },
      { dur: 2, aff: 0.5 },
    ]
    const r = knapsack(songs, 5, (s) => s.dur, (s) => s.aff)
    expect(r.indices).toEqual([0, 2])
  })

  it('rechaza pesos no enteros', () => {
    let error = null
    try {
      knapsack([{ weight: 1.5, value: 1 }], 5)
    } catch (e) {
      error = e
    }
    expect(error instanceof RangeError).toBe(true)
  })
})