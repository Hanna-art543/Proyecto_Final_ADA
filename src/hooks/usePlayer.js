import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react'

const PlayerContext = createContext({
  current: null,
  queue: [],
  play: () => {},
  next: () => {},
  prev: () => {},
  stop: () => {},
  hasNext: false,
  hasPrev: false,
})

// la cola salta las canciones que no tienen video
const playable = (s) => Boolean(s?.youtube_video_id)

export function PlayerProvider({ children }) {
  const [state, setState] = useState({ queue: [], index: -1 })

  /** play(song) suena una sola; play(song, lista) suena esa lista desde esa canción. */
  const play = useCallback((song, list) => {
    const queue = Array.isArray(list) && list.length ? list : [song]
    const index = Math.max(0, queue.findIndex((s) => s.id === song.id))
    setState({ queue, index })
  }, [])

  const next = useCallback(() => {
    setState((s) => {
      for (let i = s.index + 1; i < s.queue.length; i++) {
        if (playable(s.queue[i])) return { ...s, index: i }
      }
      return s
    })
  }, [])

  const prev = useCallback(() => {
    setState((s) => {
      for (let i = s.index - 1; i >= 0; i--) {
        if (playable(s.queue[i])) return { ...s, index: i }
      }
      return s
    })
  }, [])

  const stop = useCallback(() => setState({ queue: [], index: -1 }), [])

  const value = useMemo(() => {
    const { queue, index } = state
    return {
      current: queue[index] ?? null,
      queue,
      play,
      next,
      prev,
      stop,
      hasNext: queue.slice(index + 1).some(playable),
      hasPrev: queue.slice(0, Math.max(0, index)).some(playable),
    }
  }, [state, play, next, prev, stop])

  return createElement(PlayerContext.Provider, { value }, children)
}

export function usePlayer() {
  return useContext(PlayerContext)
}