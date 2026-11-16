import { describe, expect, it } from 'vitest'
import { Graph } from './graph.js'

describe('Graph', () => {
  it('mantiene una lista de adyacencia no dirigida', () => {
    const graph = new Graph()
    graph.addVertex('a', { title: 'A' })
    graph.addEdge('a', 'b', 0.25)

    expect(graph.getNeighbors('a')).toEqual([{ vertex: 'b', weight: 0.25 }])
    expect(graph.getNeighbors('b')).toEqual([{ vertex: 'a', weight: 0.25 }])
    expect(graph.getVertexData('a')).toEqual({ title: 'A' })
  })

  it('evita aristas duplicadas y conserva el menor peso', () => {
    const graph = new Graph()
    expect(graph.addEdge('a', 'b', 0.8)).toBe(true)
    expect(graph.addEdge('b', 'a', 0.9)).toBe(false)
    expect(graph.addEdge('b', 'a', 0.2)).toBe(false)

    expect(graph.edgeCount).toBe(1)
    expect(graph.getEdges()[0].weight).toBe(0.2)
    expect(graph.getNeighbors('a')[0].weight).toBe(0.2)
  })

  it('ignora bucles y rechaza pesos inválidos', () => {
    const graph = new Graph()
    expect(graph.addEdge('a', 'a', 0)).toBe(false)
    expect(graph.edgeCount).toBe(0)
    expect(() => graph.addEdge('a', 'b', -1)).toThrow(/peso/i)
    expect(() => graph.addEdge('a', 'b', Number.NaN)).toThrow(/peso/i)
  })
})
