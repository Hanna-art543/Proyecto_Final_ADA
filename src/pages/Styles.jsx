import { useMemo, useState } from 'react'
import DiscoverSomethingNew from '../components/DiscoverSomethingNew'
import RelatedSongs from '../components/RelatedSongs'
import StyleCard from '../components/StyleCard'
import { getSongId } from '../algorithms/buildGraph.js'
import { useGraph } from '../hooks/useGraph'
import '../styles/styles.css'

export default function Styles() {
  const [targetComponents, setTargetComponents] = useState(6)
  const [selectedStyleId, setSelectedStyleId] = useState(null)
  const [selectedSongId, setSelectedSongId] = useState(null)
  const { songs, styles, neighborIndex, loading, error, kruskalResult, reload } = useGraph({
    targetComponents,
  })

  const selectedStyle = useMemo(
    () => styles.find((style) => style.id === selectedStyleId) ?? styles[0],
    [selectedStyleId, styles],
  )
  const effectiveSongId = selectedSongId
    ?? (selectedStyle?.songs[0] ? getSongId(selectedStyle.songs[0]) : null)

  return (
    <section className="page styles-page">
      <header className="styles-hero">
        <div>
          <span className="graph-eyebrow">Mapa musical · Kruskal</span>
          <h1>Explora tus estilos</h1>
          <p>
            Agrupamos canciones por sus cinco rasgos sonoros y mostramos las
            conexiones más cercanas sin repetir aristas.
          </p>
        </div>
        <label className="styles-control">
          <span>Número de estilos</span>
          <select
            value={targetComponents}
            onChange={(event) => setTargetComponents(Number(event.target.value))}
          >
            {[3, 4, 6, 8, 10].map((count) => (
              <option value={count} key={count}>{count}</option>
            ))}
          </select>
        </label>
      </header>

      {loading && <p className="styles-state muted">Calculando el mapa de estilos…</p>}
      {error && (
        <div className="styles-state">
          <p className="error">{error.message}</p>
          <button type="button" onClick={() => reload({ refresh: true })}>Reintentar</button>
        </div>
      )}

      {!loading && !error && styles.length === 0 && (
        <p className="styles-state muted">El catálogo todavía no contiene canciones para agrupar.</p>
      )}

      {!loading && !error && styles.length > 0 && (
        <>
          {!kruskalResult?.reachedTarget && (
            <p className="styles-notice">
              El grafo tiene zonas desconectadas; se encontraron {styles.length} estilos posibles.
            </p>
          )}
          <div className="styles-grid">
            {styles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                active={style.id === selectedStyle?.id}
                onSelect={(nextStyle) => {
                  setSelectedStyleId(nextStyle.id)
                  setSelectedSongId(nextStyle.songs[0] ? getSongId(nextStyle.songs[0]) : null)
                }}
              />
            ))}
          </div>

          {selectedStyle && (
            <section className="style-detail" aria-labelledby="style-detail-title">
              <div className="graph-section-heading">
                <div>
                  <span className="graph-eyebrow">Dentro del grupo</span>
                  <h2 id="style-detail-title">{selectedStyle.name}</h2>
                </div>
                <p>Elige una canción para recorrer sus cinco vecinos más cercanos.</p>
              </div>
              <div className="style-detail__songs">
                {selectedStyle.songs.slice(0, 12).map((song) => {
                  const songId = getSongId(song)
                  return (
                    <button
                      className={songId === effectiveSongId ? 'is-active' : ''}
                      type="button"
                      key={songId}
                      onClick={() => setSelectedSongId(songId)}
                    >
                      <strong>{song.title}</strong>
                      <small>{song.artist}</small>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <RelatedSongs
            songId={effectiveSongId}
            songs={songs}
            neighborData={neighborIndex}
            onSelect={(song) => setSelectedSongId(getSongId(song))}
          />
          <DiscoverSomethingNew styles={styles} />
        </>
      )}
    </section>
  )
}
