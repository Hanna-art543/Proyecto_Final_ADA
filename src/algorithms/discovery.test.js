import { describe, expect, it } from 'vitest'
import { selectDiscoverySongs } from './discovery.js'

function style(id, songs) {
  return { id, name: id, songs }
}

describe('selectDiscoverySongs', () => {
  it('prioriza afinidad sin repetir estilo antes de tiempo', () => {
    const styles = [
      style('rock', [{ id: 1 }, { id: 2 }]),
      style('jazz', [{ id: 3 }, { id: 4 }]),
      style('folk', [{ id: 5 }]),
    ]
    const affinity = { 1: 0.7, 2: 0.9, 3: 0.8, 4: 0.1, 5: 0.6 }
    const result = selectDiscoverySongs(styles, affinity, 4)

    expect(result.slice(0, 3).map(({ style: item }) => item.id)).toEqual([
      'rock',
      'jazz',
      'folk',
    ])
    expect(result.map(({ song }) => song.id)).toEqual([2, 3, 5, 1])
  })

  it('respeta exclusiones y catálogos vacíos', () => {
    const styles = [style('rock', [{ id: 'a' }, { id: 'b' }])]
    expect(selectDiscoverySongs(styles, {}, 3, ['a']).map(({ song }) => song.id)).toEqual(['b'])
    expect(selectDiscoverySongs([], {}, 3)).toEqual([])
  })
})
