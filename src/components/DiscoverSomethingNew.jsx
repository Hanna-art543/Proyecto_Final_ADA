import { useMemo } from 'react'
import { getSongId } from '../algorithms/buildGraph.js'
import { selectDiscoverySongs } from '../algorithms/discovery.js'

const EMPTY_AFFINITIES = Object.freeze({})
const EMPTY_IDS = Object.freeze([])

/**
 * @param {{
 *   styles?: object[],
 *   affinityBySongId?: Map|object,
 *   excludedSongIds?: Iterable<string|number>,
 *   limit?: number,
 *   onSelect?: (song: object) => void
 * }} props
 */
export default function DiscoverSomethingNew({
  styles = [],
  affinityBySongId = EMPTY_AFFINITIES,
  excludedSongIds = EMPTY_IDS,
  limit = 6,
  onSelect,
}) {
  const discoveries = useMemo(() => selectDiscoverySongs(
    styles,
    affinityBySongId,
    limit,
    excludedSongIds,
  ), [affinityBySongId, excludedSongIds, limit, styles])

  return (
    <section className="discover" aria-labelledby="discover-title">
      <div className="graph-section-heading">
        <div>
          <span className="graph-eyebrow">Cruza tus fronteras musicales</span>
          <h2 id="discover-title">Descubre algo nuevo</h2>
        </div>
        <p>Selección equilibrada entre afinidad y estilos distintos.</p>
      </div>
      {discoveries.length === 0 && (
        <p className="muted">No hay canciones disponibles para descubrir.</p>
      )}
      <div className="discover__grid">
        {discoveries.map(({ song, affinity, style }) => (
          <button
            className="discover-song"
            type="button"
            key={`${style.id}-${getSongId(song)}`}
            onClick={() => onSelect?.(song)}
          >
            <span className="discover-song__style">{style.name}</span>
            <strong>{song.title ?? 'Canción sin título'}</strong>
            <small>{song.artist ?? 'Artista desconocido'}</small>
            <span className="discover-song__affinity">
              {affinity === null ? 'Afinidad por calcular' : `${Math.round(affinity * 100)}% afín`}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
