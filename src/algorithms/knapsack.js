/**
 * Mochila 0/1 por programación dinámica. O(n·W) tiempo y espacio.
 * Para playlists: peso = minutos enteros, valor = afinidad (o puntaje).
 * Recupera las canciones elegidas recorriendo la tabla hacia atrás.
 *
 * @template T
 * @param {T[]} items
 * @param {number} capacity capacidad entera (p. ej. 30 minutos)
 * @param {(item: T) => number} [getWeight] debe dar un entero >= 0
 * @param {(item: T) => number} [getValue]
 * @returns {{value: number, totalWeight: number, indices: number[], items: T[]}}
 */
export function knapsack(items, capacity, getWeight = (i) => i.weight, getValue = (i) => i.value) {
  if (!Number.isInteger(capacity) || capacity < 0) {
    throw new RangeError('capacity debe ser un entero >= 0')
  }
  const n = items.length
  const w = items.map(getWeight)
  const v = items.map(getValue)
  for (const x of w) {
    if (!Number.isInteger(x) || x < 0) throw new RangeError('los pesos deben ser enteros >= 0')
  }

  // dp[i][c] = mejor valor usando los primeros i ítems con capacidad c
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let c = 0; c <= capacity; c++) {
      dp[i][c] = dp[i - 1][c]
      if (w[i - 1] <= c) {
        const take = dp[i - 1][c - w[i - 1]] + v[i - 1]
        if (take > dp[i][c]) dp[i][c] = take
      }
    }
  }

  // recuperar hacia atrás
  const indices = []
  let c = capacity
  let totalWeight = 0
  for (let i = n; i >= 1; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      indices.push(i - 1)
      c -= w[i - 1]
      totalWeight += w[i - 1]
    }
  }
  indices.reverse()
  return { value: dp[n][capacity], totalWeight, indices, items: indices.map((i) => items[i]) }
}

export default knapsack