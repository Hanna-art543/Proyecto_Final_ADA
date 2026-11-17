import { describe, it, expect } from 'vitest'
import { MinHeap } from '../src/algorithms/heap.js'

/** Vacía el heap y devuelve los elementos en el orden en que salen */
function drain(heap) {
  const out = []
  while (!heap.isEmpty()) out.push(heap.pop())
  return out
}

describe('MinHeap', () => {
  it('devuelve los elementos en orden ascendente al vaciarlo', () => {
    const h = new MinHeap()
    for (const x of [5, 3, 8, 1, 9, 2, 7]) h.push(x)
    expect(h.size()).toBe(7)
    expect(drain(h)).toEqual([1, 2, 3, 5, 7, 8, 9])
  })

  it('pop y peek con heap vacío devuelven undefined', () => {
    const h = new MinHeap()
    expect(h.isEmpty()).toBe(true)
    expect(h.size()).toBe(0)
    expect(h.peek()).toBeUndefined()
    expect(h.pop()).toBeUndefined()
  })

  it('acepta un comparador por campo {score}', () => {
    const h = new MinHeap((a, b) => a.score - b.score)
    h.push({ id: 'a', score: 0.7 })
    h.push({ id: 'b', score: 0.2 })
    h.push({ id: 'c', score: 0.9 })
    h.push({ id: 'd', score: 0.5 })
    expect(h.peek().id).toBe('b')
    expect(drain(h).map((x) => x.id)).toEqual(['b', 'd', 'a', 'c'])
  })

  it('heap acotado K=3 conserva los 3 mayores con replaceTop', () => {
    const K = 3
    const h = new MinHeap()
    for (const x of [4, 10, 1, 7, 3, 9, 2]) {
      if (h.size() < K) h.push(x)
      else if (x > h.peek()) h.replaceTop(x)
    }
    expect(h.size()).toBe(K)
    expect(drain(h)).toEqual([7, 9, 10])
  })

  it('replaceTop devuelve la raíz anterior', () => {
    const h = new MinHeap()
    h.push(2)
    h.push(5)
    expect(h.replaceTop(8)).toBe(2)
    expect(h.peek()).toBe(5)
  })

  it('maneja duplicados', () => {
    const h = new MinHeap()
    for (const x of [3, 1, 3, 2, 1, 3]) h.push(x)
    expect(drain(h)).toEqual([1, 1, 2, 3, 3, 3])
  })
})
