import { describe, expect, it } from 'vitest'
import { cleanCatalog, parseCsv } from './build-graph.js'

function row(id, genre = 'rock') {
  return {
    track_id: id,
    track_name: `Song ${id}`,
    artists: 'Artist',
    track_genre: genre,
    energy: '0.7',
    danceability: '0.6',
    acousticness: '0.2',
    instrumentalness: '0.1',
    valence: '0.8',
  }
}

describe('build-graph catalog input', () => {
  it('conserva track_id como external_id y respeta el límite por género', () => {
    const catalog = cleanCatalog([row('spotify-a'), row('spotify-b'), row('spotify-c', 'jazz')], 1)
    expect(catalog.map((song) => song.external_id)).toEqual(['spotify-a', 'spotify-c'])
  })

  it('admite exportaciones JSON de Supabase agrupadas por genre_id', () => {
    const first = { ...row('a'), track_genre: undefined, genre_id: 1 }
    const second = { ...row('b'), track_genre: undefined, genre_id: 2 }
    expect(cleanCatalog([first, second], 1)).toHaveLength(2)
  })

  it('descarta filas que el seed de Supabase tampoco cargaría', () => {
    expect(cleanCatalog([
      row('valid'),
      { ...row(''), track_name: '' },
      { ...row('invalid-feature'), energy: '' },
    ])).toHaveLength(1)
  })

  it('analiza campos CSV entre comillas', () => {
    const parsed = parseCsv('track_id,track_name,artists\n1,"Song, Remix","A ""Band"""\n')
    expect(parsed).toEqual([{ track_id: '1', track_name: 'Song, Remix', artists: 'A "Band"' }])
  })
})
