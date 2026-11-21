import { Graph } from './graph.js'
import { UnionFind } from './unionFind.js'

function identifierKey(value) {
  return JSON.stringify([typeof value, value])
}

function compareIdentifiers(left, right) {
  return identifierKey(left).localeCompare(identifierKey(right))
}

function canonicalEdge(edge) {
  return compareIdentifiers(edge.source, edge.target) <= 0
    ? { ...edge }
    : { source: edge.target, target: edge.source, weight: edge.weight }
}

function compareEdges(left, right) {
  if (left.weight !== right.weight) return left.weight - right.weight
  const sourceComparison = compareIdentifiers(left.source, right.source)
  return sourceComparison || compareIdentifiers(left.target, right.target)
}

/** Merge sort propio y estable para no delegar el algoritmo a una librería. */
function mergeSortEdges(edges) {
  if (edges.length < 2) return edges.slice()
  const middle = Math.floor(edges.length / 2)
  const left = mergeSortEdges(edges.slice(0, middle))
  const right = mergeSortEdges(edges.slice(middle))
  const result = []
  let leftIndex = 0
  let rightIndex = 0

  while (leftIndex < left.length && rightIndex < right.length) {
    if (compareEdges(left[leftIndex], right[rightIndex]) <= 0) {
      result.push(left[leftIndex++])
    } else {
      result.push(right[rightIndex++])
    }
  }

  return result.concat(left.slice(leftIndex), right.slice(rightIndex))
}

/**
 * Variante de Kruskal que se detiene cuando quedan `targetComponents`.
 * Si el grafo es desconectado puede no ser posible alcanzar K; en ese caso se
 * devuelve el bosque posible y `reachedTarget: false`.
 */
export function kruskal(graph, targetComponents = 1) {
  if (!(graph instanceof Graph)) {
    throw new TypeError('kruskal espera una instancia de Graph')
  }
  if (!Number.isInteger(targetComponents) || targetComponents < 1) {
    throw new RangeError('K debe ser un entero mayor o igual que 1')
  }

  const vertices = graph.getVertices().sort(compareIdentifiers)
  const forest = new Graph()
  for (const vertex of vertices) forest.addVertex(vertex, graph.getVertexData(vertex))

  if (vertices.length === 0) {
    return {
      forest,
      edges: [],
      components: [],
      componentCount: 0,
      totalWeight: 0,
      reachedTarget: true,
    }
  }

  const requestedComponents = Math.min(targetComponents, vertices.length)
  const unionFind = new UnionFind(vertices)
  const selectedEdges = []
  let totalWeight = 0

  const orderedEdges = mergeSortEdges(graph.getEdges().map(canonicalEdge))
  for (const edge of orderedEdges) {
    if (unionFind.count <= requestedComponents) break
    if (!unionFind.union(edge.source, edge.target)) continue

    forest.addEdge(edge.source, edge.target, edge.weight)
    selectedEdges.push(edge)
    totalWeight += edge.weight
  }

  const components = [...unionFind.groups().values()]
    .map((component) => component.sort(compareIdentifiers))
    .sort((left, right) => compareIdentifiers(left[0], right[0]))
  return {
    forest,
    edges: selectedEdges,
    components,
    componentCount: components.length,
    totalWeight,
    reachedTarget: components.length === requestedComponents,
  }
}

export default kruskal
