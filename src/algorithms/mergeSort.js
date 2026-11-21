/**
 * Merge sort estable, implementado desde cero. No modifica el arreglo original.
 * Tiempo O(n log n) en todos los casos, memoria extra O(n).
 * @template T
 * @param {T[]} arr
 * @param {(a: T, b: T) => number} [compare] negativo si a va antes que b
 * @returns {T[]} copia ordenada
 */
export function mergeSort(arr, compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
  if (arr.length <= 1) return arr.slice()
  const src = arr.slice()
  const tmp = new Array(src.length)
  sortRange(src, tmp, 0, src.length, compare)
  return src
}

/** Ordena src[lo, hi) usando tmp como buffer */
function sortRange(src, tmp, lo, hi, compare) {
  if (hi - lo <= 1) return
  const mid = (lo + hi) >> 1
  sortRange(src, tmp, lo, mid, compare)
  sortRange(src, tmp, mid, hi, compare)
  merge(src, tmp, lo, mid, hi, compare)
}

/** Mezcla src[lo, mid) y src[mid, hi). Con <= se mantiene la estabilidad */
function merge(src, tmp, lo, mid, hi, compare) {
  let i = lo
  let j = mid
  let k = lo
  while (i < mid && j < hi) {
    tmp[k++] = compare(src[j], src[i]) < 0 ? src[j++] : src[i++]
  }
  while (i < mid) tmp[k++] = src[i++]
  while (j < hi) tmp[k++] = src[j++]
  for (let x = lo; x < hi; x++) src[x] = tmp[x]
}

export default mergeSort