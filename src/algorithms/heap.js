/**
 * Min-heap binario sobre un arreglo, implementado desde cero.
 * Estructura compartida: la usan knn.js y heapSort.js.
 * @template T
 */
export class MinHeap {
  /** @type {T[]} */
  #data = []
  /** @type {(a: T, b: T) => number} */
  #compare

  /**
   * @param {(a: T, b: T) => number} [compare] negativo si a va antes que b
   */
  constructor(compare = (a, b) => a - b) {
    this.#compare = compare
  }

  /** @returns {number} cantidad de elementos */
  size() {
    return this.#data.length
  }

  /** @returns {boolean} */
  isEmpty() {
    return this.#data.length === 0
  }

  /** @returns {T | undefined} la raíz sin sacarla */
  peek() {
    return this.#data[0]
  }

  /**
   * Inserta un elemento. O(log n)
   * @param {T} x
   */
  push(x) {
    this.#data.push(x)
    this.#siftUp(this.#data.length - 1)
  }

  /**
   * Saca y devuelve la raíz. O(log n)
   * @returns {T | undefined} undefined si está vacío
   */
  pop() {
    const n = this.#data.length
    if (n === 0) return undefined
    const top = this.#data[0]
    const last = this.#data.pop()
    if (n > 1) {
      this.#data[0] = last
      this.#siftDown(0)
    }
    return top
  }

  /**
   * Reemplaza la raíz y reordena hacia abajo (para K-NN acotado). O(log n)
   * Si el heap está vacío, solo inserta x.
   * @param {T} x
   * @returns {T | undefined} la raíz anterior
   */
  replaceTop(x) {
    if (this.#data.length === 0) {
      this.#data.push(x)
      return undefined
    }
    const top = this.#data[0]
    this.#data[0] = x
    this.#siftDown(0)
    return top
  }

  /** Intercambia dos posiciones del arreglo */
  #swap(i, j) {
    const tmp = this.#data[i]
    this.#data[i] = this.#data[j]
    this.#data[j] = tmp
  }

  /** Sube el elemento en i mientras sea menor que su padre */
  #siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.#compare(this.#data[i], this.#data[parent]) >= 0) break
      this.#swap(i, parent)
      i = parent
    }
  }

  /** Baja el elemento en i mientras algún hijo sea menor */
  #siftDown(i) {
    const n = this.#data.length
    for (;;) {
      const left = 2 * i + 1
      const right = left + 1
      let smallest = i
      if (left < n && this.#compare(this.#data[left], this.#data[smallest]) < 0) smallest = left
      if (right < n && this.#compare(this.#data[right], this.#data[smallest]) < 0) smallest = right
      if (smallest === i) break
      this.#swap(i, smallest)
      i = smallest
    }
  }
}
