import { describe, it, expect } from 'vitest'
import { HashTable } from '../src/algorithms/hashTable.js'

describe('HashTable', () => {
  it('guarda, lee y actualiza', () => {
    const h = new HashTable()
    h.set('a', 1)
    h.set('b', 2)
    h.set('a', 10)
    expect(h.get('a')).toBe(10)
    expect(h.get('b')).toBe(2)
    expect(h.size()).toBe(2)
  })

  it('devuelve undefined si no existe', () => {
    expect(new HashTable().get('x')).toBeUndefined()
  })

  it('has y delete', () => {
    const h = new HashTable()
    h.set('k', 1)
    expect(h.has('k')).toBe(true)
    expect(h.delete('k')).toBe(true)
    expect(h.delete('k')).toBe(false)
    expect(h.has('k')).toBe(false)
    expect(h.size()).toBe(0)
  })

  it('soporta muchos elementos (redimensiona)', () => {
    const h = new HashTable(4)
    for (let i = 0; i < 1000; i++) h.set(`song${i}`, i)
    expect(h.size()).toBe(1000)
    for (let i = 0; i < 1000; i++) expect(h.get(`song${i}`)).toBe(i)
  })

  it('keys, values y entries', () => {
    const h = new HashTable()
    h.set('a', 1)
    h.set('b', 2)
    expect(h.keys().sort()).toEqual(['a', 'b'])
    expect(h.values().sort()).toEqual([1, 2])
    expect(h.entries().length).toBe(2)
  })
})