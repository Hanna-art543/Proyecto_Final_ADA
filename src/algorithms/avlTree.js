/**
 * Normaliza un título para comparar: minúsculas y sin tildes.
 * @param {string} s
 * @returns {string}
 */
export function normalize(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

class Node {
  constructor(key, value) {
    this.key = key
    /** @type {any[]} canciones con este mismo título */
    this.values = [value]
    this.left = null
    this.right = null
    this.height = 1
  }
}

const h = (n) => (n ? n.height : 0)
const update = (n) => {
  n.height = 1 + Math.max(h(n.left), h(n.right))
}
const balanceFactor = (n) => h(n.left) - h(n.right)

function rotateRight(y) {
  const x = y.left
  y.left = x.right
  x.right = y
  update(y)
  update(x)
  return x
}

function rotateLeft(x) {
  const y = x.right
  x.right = y.left
  y.left = x
  update(x)
  update(y)
  return y
}

function rebalance(n) {
  update(n)
  const bf = balanceFactor(n)
  if (bf > 1) {
    if (balanceFactor(n.left) < 0) n.left = rotateLeft(n.left)
    return rotateRight(n)
  }
  if (bf < -1) {
    if (balanceFactor(n.right) > 0) n.right = rotateRight(n.right)
    return rotateLeft(n)
  }
  return n
}

/**
 * Árbol AVL por título (autocompletado y búsqueda exacta), desde cero.
 * Insertar y buscar: O(log n). Prefijo: O(log n + m), m = resultados.
 * @template T
 */
export class AVLTree {
  #root = null
  #count = 0

  /** @returns {number} cantidad de valores guardados */
  size() {
    return this.#count
  }

  /** @returns {number} altura del árbol (para pruebas) */
  height() {
    return h(this.#root)
  }

  /**
   * Inserta un valor bajo un título. Títulos repetidos se agrupan.
   * @param {string} title
   * @param {T} value
   */
  insert(title, value) {
    this.#root = this.#insert(this.#root, normalize(title), value)
    this.#count++
  }

  #insert(node, key, value) {
    if (!node) return new Node(key, value)
    if (key < node.key) node.left = this.#insert(node.left, key, value)
    else if (key > node.key) node.right = this.#insert(node.right, key, value)
    else {
      node.values.push(value)
      return node
    }
    return rebalance(node)
  }

  /**
   * Búsqueda exacta por título.
   * @param {string} title
   * @returns {T[]}
   */
  search(title) {
    const key = normalize(title)
    let n = this.#root
    while (n) {
      if (key === n.key) return n.values.slice()
      n = key < n.key ? n.left : n.right
    }
    return []
  }

  /**
   * Autocompletado: valores cuyo título empieza con el prefijo, en orden alfabético.
   * @param {string} prefix
   * @param {number} [limit]
   * @returns {T[]}
   */
  searchPrefix(prefix, limit = 10) {
    const p = normalize(prefix)
    const out = []
    this.#prefix(this.#root, p, limit, out)
    return out
  }

  #prefix(node, p, limit, out) {
    if (!node || out.length >= limit) return
    const kp = node.key.slice(0, p.length)
    if (p < kp) {
      this.#prefix(node.left, p, limit, out)
    } else if (p > kp) {
      this.#prefix(node.right, p, limit, out)
    } else {
      this.#prefix(node.left, p, limit, out)
      for (const v of node.values) {
        if (out.length >= limit) return
        out.push(v)
      }
      this.#prefix(node.right, p, limit, out)
    }
  }

  /** @returns {T[]} todos los valores ordenados por título */
  inOrder() {
    const out = []
    const walk = (n) => {
      if (!n) return
      walk(n.left)
      for (const v of n.values) out.push(v)
      walk(n.right)
    }
    walk(this.#root)
    return out
  }
}

export default AVLTree