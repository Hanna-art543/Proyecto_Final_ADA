import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import * as svc from '../services/interactionService'

const Ctx = createContext({
  byId: {},
  rate: () => {},
  toggleFavorite: () => {},
  registerPlay: () => {},
})

export function InteractionsProvider({ children }) {
  const { user } = useAuth()
  const [byId, setById] = useState({})

  useEffect(() => {
    if (!user) {
      setById({})
      return
    }
    let cancelled = false
    svc
      .getInteractions(user.id)
      .then((rows) => {
        if (!cancelled) setById(Object.fromEntries(rows.map((r) => [r.song_id, r])))
      })
      .catch((e) => console.error('interacciones:', e.message))
    return () => {
      cancelled = true
    }
  }, [user])

  const merge = useCallback((row) => setById((m) => ({ ...m, [row.song_id]: row })), [])

  const rate = useCallback(
    async (songId, rating) => {
      if (!user) return
      try { merge(await svc.rateSong(user.id, songId, rating)) } catch (e) { console.error(e.message) }
    },
    [user, merge]
  )

  const toggleFavorite = useCallback(
    async (songId) => {
      if (!user) return
      const now = byId[songId]?.is_favorite ?? false
      try { merge(await svc.setFavorite(user.id, songId, !now)) } catch (e) { console.error(e.message) }
    },
    [user, byId, merge]
  )

  const registerPlay = useCallback(
    async (songId) => {
      if (!user) return
      try { merge(await svc.addPlay(user.id, songId, byId[songId]?.play_count ?? 0)) } catch (e) { console.error(e.message) }
    },
    [user, byId, merge]
  )

  const value = useMemo(() => ({ byId, rate, toggleFavorite, registerPlay }), [byId, rate, toggleFavorite, registerPlay])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useInteractions() {
  return useContext(Ctx)
}