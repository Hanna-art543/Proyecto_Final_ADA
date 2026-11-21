/**
 * Tabla hash con encadenamiento y redimensionado automático, desde cero.
 * Las claves se convierten con String(), así que 1 y "1" son la misma clave.
 * @template V
 */
export class HashTable {
  /** @type {Array<Array<[string, V]>>} */
  #buckets
  #size = 0
  #capacity

  /** @param {number} [capacity] cantidad inicial de cubetas */
  constructor(capacity = 16) {
    this.#capacity = Math.max(4, capacity)
    this.#buckets = this.#makeBuckets(this.#capacity)
  }

  #makeBuckets(n) {
    return Array.from({ length: n }, () => [])
  }

  /** Hash djb2 sobre la clave convertida a texto */
  #hash(key, capacity = this.#capacity) {
    const s = String(key)
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
    return h % capacity
  }

  #resize() {
    const newCap = this.#capacity * 2
    const next = this.#makeBuckets(newCap)
    for (const bucket of this.#buckets) {
      for (const entry of bucket) next[this.#hash(entry[0], newCap)].push(entry)
    }
    this.#buckets = next
    this.#capacity = newCap
  }

  /** @returns {number} cantidad de pares guardados */
  size() {
    return this.#size
  }

  /**
   * Inserta o actualiza. O(1) promedio
   * @param {string|number} key
   * @param {V} value
   */
  set(key, value) {
    const k = String(key)
    const bucket = this.#buckets[this.#hash(k)]
    for (const entry of bucket) {
      if (entry[0] === k) {
        entry[1] = value
        return
      }
    }
    bucket.push([k, value])
    this.#size++
    if (this.#size / this.#capacity > 0.75) this.#resize()
  }

  /**
   * @param {string|number} key
   * @returns {V | undefined}
   */
  get(key) {
    const k = String(key)
    for (const entry of this.#buckets[this.#hash(k)]) {
      if (entry[0] === k) return entry[1]
    }
    return undefined
  }

  /** @param {string|number} key @returns {boolean} */
  has(key) {
    const k = String(key)
    return this.#buckets[this.#hash(k)].some((e) => e[0] === k)
  }

  /**
   * @param {string|number} key
   * @returns {boolean} true si existía
   */
  delete(key) {
    const k = String(key)
    const bucket = this.#buckets[this.#hash(k)]
    const i = bucket.findIndex((e) => e[0] === k)
    if (i === -1) return false
    bucket.splice(i, 1)
    this.#size--
    return true
  }

  /** @returns {string[]} */
  keys() {
    return this.entries().map((e) => e[0])
  }

  /** @returns {V[]} */
  values() {
    return this.entries().map((e) => e[1])
  }

  /** @returns {Array<[string, V]>} */
  entries() {
    const out = []
    for (const bucket of this.#buckets) {
      for (const [k, v] of bucket) out.push([k, v])
    }
    return out
  }
}

export default HashTable