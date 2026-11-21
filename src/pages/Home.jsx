import { useEffect, useState } from 'react'
import SongCard from '../components/SongCard'
import { getCatalog } from '../services/songService'

export default function Home() {
  const [songs, setSongs] = useState([])

  useEffect(() => {
    getCatalog()
      .then((all) => setSongs(all.slice(0, 10)))
      .catch(() => {})
  }, [])

  return (
    <section className="page">
      <h1>Inicio</h1>
      <p className="muted">Canciones para empezar</p>
      <div className="song-list">
        {songs.map((s) => (
          <SongCard key={s.id} song={s} queue={songs} />
        ))}
      </div>
    </section>
  )
}