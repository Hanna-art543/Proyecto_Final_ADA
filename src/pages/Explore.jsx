import { useEffect, useState } from 'react'
import SearchBar from '../components/SearchBar'
import SongCard from '../components/SongCard'
import { getCatalog, searchSongs } from '../services/songService'

const INITIAL_COUNT = 20
const SEARCH_LIMIT = 30

export default function Explore() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [songs, setSongs] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  // espera 200 ms después de la última tecla
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    const request = debounced
      ? searchSongs(debounced, SEARCH_LIMIT)
      : getCatalog().then((all) => all.slice(0, INITIAL_COUNT))

    request
      .then((result) => {
        if (cancelled) return
        setSongs(result)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [debounced, retry])

  return (
    <section>
      <h1>Explorar</h1>
      <SearchBar value={query} onChange={setQuery} suggestions={debounced ? songs.slice(0, 6) : []} />

      {status === 'loading' && <p className="muted">Buscando…</p>}

      {status === 'error' && (
        <div className="empty-state">
          <p>No pudimos cargar el catálogo de canciones.</p>
          <p className="muted">Detalle: {error}</p>
          <button type="button" className="btn" onClick={() => setRetry((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && songs.length === 0 && (
        <div className="empty-state">
          <p>No encontramos resultados para «{debounced}».</p>
          <p className="muted">Prueba con otra parte del título o con el nombre del artista.</p>
        </div>
      )}

      {status === 'ready' && songs.length > 0 && (
        <>
          <p className="muted">
            {debounced
              ? `${songs.length} resultado${songs.length === 1 ? '' : 's'} para «${debounced}»`
              : 'Canciones para empezar'}
          </p>
          <div className="song-list">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} queue={songs} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}