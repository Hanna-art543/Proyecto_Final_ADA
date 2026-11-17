/**
 * Similitud coseno (normal y centrada) sobre vectores de features de audio.
 * Lógica pura: sin React ni Supabase.
 */

/** Orden fijo de las dimensiones de cada vector */
export const FEATURES = ['energy', 'danceability', 'acousticness', 'instrumentalness', 'valence']

/**
 * Convierte una fila de songs o user_preferences en un vector de 5 dimensiones.
 * Valores null, undefined o no numéricos se toman como 0.
 * @param {Record<string, any>} obj
 * @returns {number[]}
 */
export function toVector(obj) {
  const v = new Array(FEATURES.length)
  for (let i = 0; i < FEATURES.length; i++) {
    const x = obj == null ? null : obj[FEATURES[i]]
    const num = x == null ? 0 : Number(x)
    v[i] = Number.isFinite(num) ? num : 0
  }
  return v
}

/**
 * Producto punto.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function dot(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/**
 * Norma euclidiana.
 * @param {number[]} a
 * @returns {number}
 */
export function norm(a) {
  return Math.sqrt(dot(a, a))
}

/**
 * Similitud coseno en [-1, 1]. Devuelve 0 si alguna norma es 0 (nunca NaN).
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function cosine(a, b) {
  const na = norm(a)
  const nb = norm(b)
  if (na === 0 || nb === 0) return 0
  const c = dot(a, b) / (na * nb)
  // Recorta errores de redondeo fuera de [-1, 1]
  if (c > 1) return 1
  if (c < -1) return -1
  return c
}

/**
 * Promedio por dimensión de una lista de vectores (media del catálogo).
 * @param {number[][]} vectors
 * @returns {number[]} vector de ceros si la lista está vacía
 */
export function meanVector(vectors) {
  const mean = new Array(FEATURES.length).fill(0)
  if (!vectors || vectors.length === 0) return mean
  for (let k = 0; k < vectors.length; k++) {
    for (let i = 0; i < mean.length; i++) mean[i] += vectors[k][i]
  }
  for (let i = 0; i < mean.length; i++) mean[i] /= vectors.length
  return mean
}

/**
 * Resta componente a componente: a - b.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
export function subtract(a, b) {
  const r = new Array(a.length)
  for (let i = 0; i < a.length; i++) r[i] = a[i] - b[i]
  return r
}

/**
 * Coseno después de restar la media del catálogo a ambos vectores.
 * Como las features siempre son positivas, el coseno normal casi siempre sale alto;
 * al centrar, canciones de estilos opuestos pueden dar valores negativos.
 * @param {number[]} a
 * @param {number[]} b
 * @param {number[]} mean
 * @returns {number}
 */
export function centeredCosine(a, b, mean) {
  return cosine(subtract(a, mean), subtract(b, mean))
}

/**
 * Convierte un puntaje en [-1, 1] a porcentaje de afinidad 0..100, redondeado.
 * @param {number} score
 * @returns {number}
 */
export function toAffinityPercent(score) {
  let s = score
  if (s > 1) s = 1
  if (s < -1) s = -1
  return Math.round(((s + 1) / 2) * 100)
}
