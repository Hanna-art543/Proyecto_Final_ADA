import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { useInteractions } from '../hooks/useInteractions'

let apiPromise
function loadYT() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve(window.YT)
      }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    })
  }
  return apiPromise
}

function fmt(sec) {
  if (!Number.isFinite(sec)) return '0:00'
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function SongPlayer() {
  const { current, stop, next, prev, hasNext, hasPrev } = usePlayer()
  const { registerPlay } = useInteractions()
  const countedRef = useRef(null)
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const nextRef = useRef(next)
  const hasNextRef = useRef(hasNext)
  nextRef.current = next
  hasNextRef.current = hasNext

  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [mode, setMode] = useState('mini') // 'mini' | 'large' | 'hidden'

  const videoId = current?.youtube_video_id ?? null

  // cada canción distinta que empieza a sonar suma una reproducción
  useEffect(() => {
    if (!current?.id || countedRef.current === current.id) return
    countedRef.current = current.id
    registerPlay(current.id)
  }, [current?.id, registerPlay])

  // crea o actualiza el reproductor cuando cambia la canción
  useEffect(() => {
    if (!videoId) {
      playerRef.current?.pauseVideo?.()
      setPlaying(false)
      return
    }
    let cancelled = false
    loadYT().then((YT) => {
      if (cancelled) return
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId)
        return
      }
      const el = document.createElement('div')
      hostRef.current.appendChild(el)
      playerRef.current = new YT.Player(el, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => {
            setPlaying(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.ENDED) {
              nextRef.current()
              // última de la cola: evita los videos sugeridos de YouTube
              if (!hasNextRef.current) e.target.stopVideo()
            }
          },
          // video borrado o que no permite embeberse: pasa a la siguiente
          onError: () => nextRef.current(),
        },
      })
    })
    return () => {
      cancelled = true
    }
  }, [videoId])

  // progreso
  useEffect(() => {
    const t = setInterval(() => {
      const p = playerRef.current
      if (!p?.getCurrentTime) return
      setTime(p.getCurrentTime())
      setDuration(p.getDuration())
    }, 500)
    return () => clearInterval(t)
  }, [])

  function toggle() {
    const p = playerRef.current
    if (!p) return
    playing ? p.pauseVideo() : p.playVideo()
  }

  function seek(e) {
    const v = Number(e.target.value)
    setTime(v)
    playerRef.current?.seekTo(v, true)
  }

  function close() {
    playerRef.current?.pauseVideo?.()
    stop()
  }

  return (
    <aside className="song-player" aria-label="Reproductor" hidden={!current}>
      {current && (
        <>
          <div className="song-player-info">
            <div>
              <strong>{current.title}</strong>
              <span>{current.artist}</span>
            </div>
          </div>

          {videoId ? (
            <div className="song-player-controls">
              <button type="button" className="btn" onClick={prev} disabled={!hasPrev} aria-label="Anterior">
                ⏮
              </button>
              <button type="button" className="song-player-toggle" onClick={toggle} aria-label="Reproducir o pausar">
                {playing ? '⏸' : '▶'}
              </button>
              <button type="button" className="btn" onClick={next} disabled={!hasNext} aria-label="Siguiente">
                ⏭
              </button>
              <span>{fmt(time)}</span>
              <input type="range" min="0" max={duration || 1} step="1" value={time} onChange={seek} />
              <span>{fmt(duration)}</span>
              <button
                type="button"
                className="btn"
                onClick={() => setMode((m) => (m === 'large' ? 'mini' : 'large'))}
              >
                {mode === 'large' ? 'Reducir' : 'Pantalla grande'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setMode((m) => (m === 'hidden' ? 'mini' : 'hidden'))}
              >
                {mode === 'hidden' ? 'Ver video' : 'Ocultar'}
              </button>
            </div>
          ) : (
            <div className="song-player-controls">
              <span className="muted">Esta canción aún no tiene video.</span>
              <button type="button" className="btn" onClick={next} disabled={!hasNext}>
                ⏭ Siguiente
              </button>
            </div>
          )}

          <button type="button" className="song-player-close" onClick={close} aria-label="Cerrar">
            ✕
          </button>
        </>
      )}
      {/* el contenedor siempre existe para que el reproductor no se destruya */}
      <div ref={hostRef} className={`song-player-video is-${videoId ? mode : 'hidden'}`} />
    </aside>
  )
}