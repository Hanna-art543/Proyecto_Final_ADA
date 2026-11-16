/**
 * Grafo ponderado no dirigido implementado con listas de adyacencia.
 *
 * Los identificadores pueden ser strings o números. Cada arista se almacena en
 * ambas listas, pero `getEdges` la devuelve una sola vez. Si una arista vuelve a
 * agregarse, conservamos el menor peso: esto evita duplicados cuando dos
 * canciones se eligen mutuamente como vecinas.
 */
export class Graph {
  constructor() {
    this.adjacency = new Map()
    this.vertexData = new Map()
    this.edges = new Map()
  }

  addVertex(id, data = id) {
    if (id === undefined || id === null) {
      throw new TypeError('El identificador del vértice es obligatorio')
    }

    if (!this.adjacency.has(id)) this.adjacency.set(id, new Map())
    this.vertexData.set(id, data)
    return this
  }

  hasVertex(id) {
    return this.adjacency.has(id)
  }

  getVertexData(id) {
    return this.vertexData.get(id)
  }

  addEdge(source, target, weight) {
    if (source === target) return false
    if (!Number.isFinite(weight) || weight < 0) {
      throw new TypeError('El peso de una arista debe ser un número finito no negativo')
    }

    if (!this.hasVertex(source)) this.addVertex(source)
    if (!this.hasVertex(target)) this.addVertex(target)

    const key = this.#edgeKey(source, target)
    const current = this.edges.get(key)
    if (current && current.weight <= weight) return false

    const edge = { source, target, weight }
    this.edges.set(key, edge)
    this.adjacency.get(source).set(target, weight)
    this.adjacency.get(target).set(source, weight)
    return !current
  }

  getNeighbors(id) {
    const neighbors = this.adjacency.get(id)
    if (!neighbors) return []
    return [...neighbors].map(([vertex, weight]) => ({ vertex, weight }))
  }

  getVertices() {
    return [...this.adjacency.keys()]
  }

  getEdges() {
    return [...this.edges.values()]
  }

  get vertexCount() {
    return this.adjacency.size
  }

  get edgeCount() {
    return this.edges.size
  }

  #edgeKey(source, target) {
    // No se concatena directamente: JSON mantiene separados tipo y valor.
    const a = JSON.stringify([typeof source, source])
    const b = JSON.stringify([typeof target, target])
    return a < b ? `${a}|${b}` : `${b}|${a}`
  }
}

export default Graph
