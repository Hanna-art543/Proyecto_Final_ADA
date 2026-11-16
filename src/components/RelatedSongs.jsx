import { useEffect, useMemo, useState } from 'react'
import { getRelatedSongs, resolveRelatedSongs } from '../services/graphService'

export default function RelatedSongs({
  songId,
  songs = [],
  neighborData = null,
  limit = 5,
  onSelect,
}) {
  const [request, setRequest] = useState({ songId: null, related: [], error: null })
  const normalizedSongId = songId === undefined || songId === null ? null : String(songId)
  const localRelated = useMemo(() => (
    neighborData && normalizedSongId !== null
      ? resolveRelatedSongs(normalizedSongId, songs, neighborData, limit)
      : null
  ), [limit, neighborData, normalizedSongId, songs])

  useEffect(() => {
    let active = true
    if (normalizedSongId === null || neighborData) return () => { active = false }

    getRelatedSongs(normalizedSongId, { songs: songs.length ? songs : null, limit })
      .then((result) => {
        if (active) setRequest({ songId: normalizedSongId, related: result, error: null })
      })
      .catch((loadError) => {
        if (active) setRequest({ songId: normalizedSongId, related: [], error: loadError })
      })
    return () => { active = false }
  }, [limit, neighborData, normalizedSongId, songs])

  const related = localRelated ?? (request.songId === normalizedSongId ? request.related : [])
  const error = localRelated ? null : request.songId === normalizedSongId ? request.error : null
  const loading = normalizedSongId !== null
    && !neighborData
    && request.songId !== normalizedSongId

  return (
    <section className="related-songs" aria-labelledby="related-songs-title">
      <div className="graph-section-heading">
        <div>
          <span className="graph-eyebrow">Afinidad sonora</span>
          <h2 id="related-songs-title">Canciones relacionadas</h2>
        </div>
      </div>

      {loading && <p className="muted">Buscando canciones cercanas…</p>}
      {error && <p className="error">{error.message}</p>}
      {!loading && !error && related.length === 0 && (
        <p className="muted">No hay vecinos calculados para esta canción.</p>
      )}

      <div className="related-songs__list">
        {related.map((song) => (
          <button
            className="related-song"
            type="button"
            key={song.songId}
            onClick={() => onSelect?.(song)}
          >
            <span className="related-song__identity">
              <strong>{song.title ?? 'Canción sin título'}</strong>
              <small>{song.artist ?? 'Artista desconocido'}</small>
            </span>
            <span className="related-song__score">
              {Number.isFinite(song.similarity)
                ? `${Math.round(((song.similarity + 1) / 2) * 100)}% afín`
                : '—'}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
