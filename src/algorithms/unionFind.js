/**
 * Estructura disjoint-set (Union-Find) con compresión de caminos y unión
 * por rango. Funciona con cualquier identificador válido como clave de Map.
 */
export class UnionFind {
  constructor(elements = []) {
    this.parent = new Map()
    this.rank = new Map()
    this.count = 0
    for (const element of elements) this.makeSet(element)
  }

  makeSet(element) {
    if (this.parent.has(element)) return false
    this.parent.set(element, element)
    this.rank.set(element, 0)
    this.count += 1
    return true
  }

  find(element) {
    if (!this.parent.has(element)) {
      throw new Error(`Elemento desconocido en UnionFind: ${String(element)}`)
    }

    const parent = this.parent.get(element)
    if (parent !== element) {
      // La asignación aplana el árbol para futuras consultas.
      this.parent.set(element, this.find(parent))
    }
    return this.parent.get(element)
  }

  union(left, right) {
    const leftRoot = this.find(left)
    const rightRoot = this.find(right)
    if (leftRoot === rightRoot) return false

    const leftRank = this.rank.get(leftRoot)
    const rightRank = this.rank.get(rightRoot)

    if (leftRank < rightRank) {
      this.parent.set(leftRoot, rightRoot)
    } else if (leftRank > rightRank) {
      this.parent.set(rightRoot, leftRoot)
    } else {
      this.parent.set(rightRoot, leftRoot)
      this.rank.set(leftRoot, leftRank + 1)
    }

    this.count -= 1
    return true
  }

  connected(left, right) {
    return this.find(left) === this.find(right)
  }

  groups() {
    const groups = new Map()
    for (const element of this.parent.keys()) {
      const root = this.find(element)
      if (!groups.has(root)) groups.set(root, [])
      groups.get(root).push(element)
    }
    return groups
  }
}

export default UnionFind
