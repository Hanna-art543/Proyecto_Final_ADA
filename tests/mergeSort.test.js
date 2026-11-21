import { describe, it, expect } from 'vitest'
import { mergeSort } from '../src/algorithms/mergeSort.js'

describe('mergeSort', () => {
  it('ordena números por defecto', () => {
    expect(mergeSort([5, 3, 8, 1, 9, 2, 7])).toEqual([1, 2, 3, 5, 7, 8, 9])
  })

  it('maneja vacío y un solo elemento', () => {
    expect(mergeSort([])).toEqual([])
    expect(mergeSort([4])).toEqual([4])
  })

  it('no modifica el arreglo original', () => {
    const a = [3, 1, 2]
    mergeSort(a)
    expect(a).toEqual([3, 1, 2])
  })

  it('acepta comparador (descendente)', () => {
    expect(mergeSort([1, 3, 2], (a, b) => b - a)).toEqual([3, 2, 1])
  })

  it('es estable con claves repetidas', () => {
    const songs = [
      { id: 'a', r: 4 },
      { id: 'b', r: 5 },
      { id: 'c', r: 4 },
      { id: 'd', r: 5 },
    ]
    const out = mergeSort(songs, (x, y) => y.r - x.r)
    expect(out.map((s) => s.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('ordena texto y arreglos grandes', () => {
    expect(mergeSort(['b', 'c', 'a'])).toEqual(['a', 'b', 'c'])
    const big = Array.from({ length: 5000 }, (_, i) => (i * 7919) % 5003)
    expect(mergeSort(big)).toEqual([...big].sort((a, b) => a - b))
  })
})