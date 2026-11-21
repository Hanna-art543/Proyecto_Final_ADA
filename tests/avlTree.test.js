import { describe, it, expect } from 'vitest'
import { AVLTree } from '../src/algorithms/avlTree.js'

describe('AVLTree', () => {
  it('busca por título exacto sin importar mayúsculas ni tildes', () => {
    const t = new AVLTree()
    t.insert('Canción de Cuna', { id: 1 })
    expect(t.search('cancion de cuna')).toEqual([{ id: 1 }])
    expect(t.search('no existe')).toEqual([])
  })

  it('agrupa títulos repetidos', () => {
    const t = new AVLTree()
    t.insert('Hello', 1)
    t.insert('hello', 2)
    expect(t.search('HELLO')).toEqual([1, 2])
    expect(t.size()).toBe(2)
  })

  it('autocompleta por prefijo en orden alfabético', () => {
    const t = new AVLTree()
    for (const s of ['banana', 'band', 'apple', 'bandana', 'cherry', 'ban']) t.insert(s, s)
    expect(t.searchPrefix('ban')).toEqual(['ban', 'banana', 'band', 'bandana'])
    expect(t.searchPrefix('ban', 2)).toEqual(['ban', 'banana'])
    expect(t.searchPrefix('zzz')).toEqual([])
  })

  it('inOrder devuelve todo ordenado', () => {
    const t = new AVLTree()
    for (const s of ['d', 'b', 'a', 'c']) t.insert(s, s)
    expect(t.inOrder()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('se mantiene balanceado con claves ya ordenadas', () => {
    const t = new AVLTree()
    for (let i = 0; i < 1000; i++) t.insert(String(i).padStart(5, '0'), i)
    expect(t.size()).toBe(1000)
    expect(t.height() <= 15).toBe(true)
    expect(t.search('00500')).toEqual([500])
  })
})