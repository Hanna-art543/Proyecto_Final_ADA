import { describe, expect, it } from 'vitest'
import { Graph } from './graph.js'
import { kruskal } from './kruskal.js'

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
})
