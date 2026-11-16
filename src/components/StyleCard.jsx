const FEATURE_LABELS = {
  energy: 'Energía',
  danceability: 'Bailable',
  acousticness: 'Acústico',
  instrumentalness: 'Instrumental',
  valence: 'Positividad',
}

function strongestFeatures(centroid = {}) {
  return Object.entries(centroid)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
}

/**
 * @param {{
 *   style: {id: string, name: string, songCount: number, centroid: object, songs: object[]},
 *   active?: boolean,
 *   onSelect?: (style: object) => void
 * }} props
 */
export default function StyleCard({ style, active = false, onSelect }) {
  if (!style) return null

  return (
    <article className={`style-card${active ? ' style-card--active' : ''}`}>
      <button
        className="style-card__button"
        type="button"
        aria-pressed={active}
        onClick={() => onSelect?.(style)}
      >
        <span className="style-card__eyebrow">
          {style.songCount} {style.songCount === 1 ? 'canción' : 'canciones'}
        </span>
        <strong className="style-card__title">{style.name}</strong>
        <span className="style-card__features">
          {strongestFeatures(style.centroid).map(([feature, value]) => (
            <span className="style-card__chip" key={feature}>
              {FEATURE_LABELS[feature] ?? feature} {Math.round(value * 100)}%
            </span>
          ))}
        </span>
        <span className="style-card__sample">
          {style.songs.slice(0, 3).map((song) => song.title).filter(Boolean).join(' · ')}
        </span>
      </button>
    </article>
  )
}
