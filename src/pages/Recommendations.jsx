import { Link } from 'react-router-dom'
import SongCard from '../components/SongCard'
import { useRecommendations } from '../hooks/useRecommendations'

export default function Recommendations() {
  const { status, items, coldStart, error, reload } = useRecommendations(20)
  const queue = items.map((i) => i.song)

  return (
    <section className="page">
      <h1>Para ti</h1>
      <p className="muted">Canciones parecidas a tu gusto, con su porcentaje de afinidad.</p>

      {coldStart && (
        <p className="muted">
          Aún no conocemos tus gustos. <Link to="/profile">Cuéntanos qué te gusta</Link> o califica
          algunas canciones en <Link to="/explore">Explorar</Link> para afinar los resultados.
        </p>
      )}

      {status === 'loading' && <p className="muted">Calculando tus recomendaciones…</p>}

      {status === 'error' && (
        <div className="empty-state">
          <p>No pudimos calcular tus recomendaciones.</p>
          <p className="muted">Detalle: {error}</p>
          <button type="button" className="btn" onClick={reload}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="song-list">
          {items.map(({ song, score }) => (
            <SongCard key={song.id} song={song} affinity={score} queue={queue} />
          ))}
        </div>
      )}
    </section>
  )
}