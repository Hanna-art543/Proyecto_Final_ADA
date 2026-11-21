import { usePlayer } from '../hooks/usePlayer'
import { useInteractions } from '../hooks/useInteractions'

/** 215000 -> "3:35" */
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

/**
 * Tarjeta de canción: escuchar, calificar (1-5) y favorito.
 * affinity va de 0 a 1 y se muestra como porcentaje.
 * queue es la lista de la pantalla: al terminar la canción suena la siguiente.
 */
export default function SongCard({ song, affinity, queue, children }) {
  const { play, current } = usePlayer()
  const { byId, rate, toggleFavorite } = useInteractions()
  if (!song) return null

  const mine = byId[song.id]
  const rating = mine?.rating ?? 0
  const isFav = mine?.is_favorite ?? false
  const isPlaying = current?.id === song.id
  const pct =
    typeof affinity === 'number' && Number.isFinite(affinity)
      ? Math.round(Math.max(0, Math.min(1, affinity)) * 100)
      : null
  const meta = [song.genre, formatDuration(song.duration_ms)].filter(Boolean).join(' · ')

  return (
    <article className={`song-card${isPlaying ? ' is-playing' : ''}`}>
      <div className="song-card-info">
        <h3 className="song-card-title" title={song.title}>
          {song.title}
        </h3>
        <p className="song-card-artist">{song.artist}</p>
        {meta && <p className="song-card-meta">{meta}</p>}
      </div>
      {pct !== null && <span className="song-card-affinity">{pct}% afinidad</span>}

      <div className="song-card-rating" role="group" aria-label="Calificar">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`star${n <= rating ? ' is-on' : ''}`}
            onClick={() => rate(song.id, n)}
            aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        ))}
        <button
          type="button"
          className={`fav${isFav ? ' is-on' : ''}`}
          onClick={() => toggleFavorite(song.id)}
          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={isFav}
        >
          {isFav ? '♥' : '♡'}
        </button>
      </div>

      <div className="song-card-actions">
        <button
          type="button"
          className="song-card-play"
          onClick={() => play(song, queue)}
          aria-label={`Escuchar ${song.title}`}
        >
          {isPlaying ? 'Sonando' : 'Escuchar'}
        </button>
        {children}
      </div>
    </article>
  )
}