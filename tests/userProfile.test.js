import { describe, it, expect } from 'vitest'
import {
  interactionWeight,
  computeBeta,
  buildUserProfile,
} from '../src/services/recommendationService.js'

// En la app, getSong será la tabla hash del Integrante 1; aquí basta un objeto
const songs = {
  s1: { energy: 0.95, danceability: 0.5, acousticness: 0.1, instrumentalness: 0.1, valence: 0.5 },
  s2: { energy: 0.05, danceability: 0.1, acousticness: 0.9, instrumentalness: 0.8, valence: 0.1 },
}
const getSong = (id) => songs[id]

const prefs = { energy: 0.3, danceability: 0.5, acousticness: 0.5, instrumentalness: 0.2, valence: 0.5 }
const prefsVector = [0.3, 0.5, 0.5, 0.2, 0.5]

describe('interactionWeight', () => {
  it('rating 1 o 2 → null', () => {
    expect(interactionWeight({ rating: 2, liked: true, play_count: 10 })).toBeNull()
    expect(interactionWeight({ rating: 1, liked: false, play_count: 0 })).toBeNull()
  })

  it('peso máximo ≈ 1', () => {
    expect(interactionWeight({ rating: 5, liked: true, play_count: 10 })).toBeCloseTo(1, 10)
    expect(interactionWeight({ rating: 5, liked: true, play_count: 99 })).toBeCloseTo(1, 10)
  })

  it('rating null cuenta como 0', () => {
    expect(interactionWeight({ rating: null, liked: true, play_count: 0 })).toBeCloseTo(0.5, 10)
  })
})

describe('computeBeta', () => {
  it('1 sin interacciones y 0.3 con 10 o más', () => {
    expect(computeBeta(0)).toBe(1)
    expect(computeBeta(10)).toBeCloseTo(0.3, 10)
    expect(computeBeta(50)).toBeCloseTo(0.3, 10)
  })
})

describe('buildUserProfile', () => {
  it('sin interacciones devuelve las preferencias (arranque en frío)', () => {
    expect(buildUserProfile(prefs, [], getSong)).toEqual(prefsVector)
  })

  it('una canción con energy alto y like sube u[energy]', () => {
    const u = buildUserProfile(prefs, [{ song_id: 's1', liked: true, rating: 5, play_count: 3 }], getSong)
    expect(u[0]).toBeGreaterThan(prefsVector[0])
    // beta(1) = 0.93 → u = 0.93·0.3 + 0.07·0.95
    expect(u[0]).toBeCloseTo(0.93 * 0.3 + 0.07 * 0.95, 10)
  })

  it('una canción con rating 1 no cambia el perfil', () => {
    const u = buildUserProfile(prefs, [{ song_id: 's2', liked: true, rating: 1, play_count: 10 }], getSong)
    expect(u).toEqual(prefsVector)
  })

  it('ignora canciones que getSong no encuentra', () => {
    const u = buildUserProfile(prefs, [{ song_id: 'no-existe', liked: true, rating: 5 }], getSong)
    expect(u).toEqual(prefsVector)
  })
})
