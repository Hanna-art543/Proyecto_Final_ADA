import { describe, expect, it } from 'vitest'
import { UnionFind } from './unionFind.js'

describe('UnionFind', () => {
  it('une por rango y reduce el número de componentes', () => {
    const sets = new UnionFind(['a', 'b', 'c', 'd'])
    expect(sets.union('a', 'b')).toBe(true)
    expect(sets.union('c', 'd')).toBe(true)
    expect(sets.union('a', 'c')).toBe(true)
    expect(sets.union('b', 'd')).toBe(false)
    expect(sets.count).toBe(1)
    expect(sets.connected('a', 'd')).toBe(true)
  })

  it('comprime el camino durante find', () => {
    const sets = new UnionFind(['a', 'b', 'c', 'd'])
    // Se construye una cadena solo para comprobar el efecto observable de find.
    sets.parent.set('b', 'a')
    sets.parent.set('c', 'b')
    sets.parent.set('d', 'c')

    expect(sets.find('d')).toBe('a')
    expect(sets.parent.get('d')).toBe('a')
    expect(sets.parent.get('c')).toBe('a')
  })

  it('gestiona conjuntos vacíos, duplicados y elementos desconocidos', () => {
    const sets = new UnionFind()
    expect(sets.count).toBe(0)
    expect(sets.makeSet('a')).toBe(true)
    expect(sets.makeSet('a')).toBe(false)
    expect(() => sets.find('missing')).toThrow(/desconocido/i)
  })
})
