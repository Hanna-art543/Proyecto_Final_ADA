import { describe, expect, it } from 'vitest'
import { Graph } from './graph.js'
import { kruskal } from './kruskal.js'
import { UnionFind } from './unionFind.js'

function fixtureGraph() {
  const graph = new Graph()
  graph.addEdge('a', 'b', 1)
  graph.addEdge('b', 'c', 2)
  graph.addEdge('c', 'd', 3)
  graph.addEdge('a', 'd', 10)
  graph.addEdge('a', 'c', 8)
  return graph
}

describe('kruskal', () => {
  it('se detiene exactamente al alcanzar K componentes', () => {
    const result = kruskal(fixtureGraph(), 2)

    expect(result.componentCount).toBe(2)
    expect(result.edges).toHaveLength(2)
    expect(result.edges.map((edge) => edge.weight)).toEqual([1, 2])
    expect(result.totalWeight).toBe(3)
    expect(result.reachedTarget).toBe(true)
  })

  it('crea el árbol de expansión mínimo cuando K es 1', () => {
    const result = kruskal(fixtureGraph(), 1)
    expect(result.edges.map((edge) => edge.weight)).toEqual([1, 2, 3])
    expect(result.totalWeight).toBe(6)
    expect(result.componentCount).toBe(1)

    const cycleCheck = new UnionFind(['a', 'b', 'c', 'd'])
    expect(result.edges.every((edge) => cycleCheck.union(edge.source, edge.target))).toBe(true)
    expect(result.edges).toHaveLength(4 - result.componentCount)
  })

  it('informa cuando un grafo desconectado no puede alcanzar K', () => {
    const graph = new Graph()
    graph.addEdge('a', 'b', 1)
    graph.addVertex('c')

    const result = kruskal(graph, 1)
    expect(result.componentCount).toBe(2)
    expect(result.reachedTarget).toBe(false)
  })

  it('resuelve un grafo vacío y valida K', () => {
    const empty = kruskal(new Graph(), 1)
    expect(empty.components).toEqual([])
    expect(empty.componentCount).toBe(0)
    expect(() => kruskal(new Graph(), 0)).toThrow(/K/)
  })

  it('es determinista aunque cambie el orden de inserción y haya empates', () => {
    const first = new Graph()
    first.addEdge('d', 'c', 1)
    first.addEdge('b', 'd', 1)
    first.addEdge('a', 'c', 1)
    first.addEdge('a', 'b', 1)

    const second = new Graph()
    second.addEdge('b', 'a', 1)
    second.addEdge('c', 'a', 1)
    second.addEdge('d', 'b', 1)
    second.addEdge('c', 'd', 1)

    expect(kruskal(first, 1).edges).toEqual(kruskal(second, 1).edges)
    expect(kruskal(first, 2).components).toEqual(kruskal(second, 2).components)
  })

  it('conserva catálogos pequeños cuando K supera el número de vértices', () => {
    const graph = new Graph()
    graph.addVertex('only')
    const result = kruskal(graph, 10)
    expect(result.components).toEqual([['only']])
    expect(result.componentCount).toBe(1)
    expect(result.reachedTarget).toBe(true)
  })
})
