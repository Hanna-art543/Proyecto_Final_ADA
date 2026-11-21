import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { recommendForUser } from '../services/recommendationService'

export function useRecommendations(k = 20) {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', items: [], coldStart: false, error: '' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setState((s) => ({ ...s, status: 'loading' }))
    recommendForUser(user.id, k)
      .then((r) => !cancelled && setState({ status: 'ready', error: '', ...r }))
      .catch((e) => !cancelled && setState((s) => ({ ...s, status: 'error', error: e.message })))
    return () => {
      cancelled = true
    }
  }, [user, k, tick])

  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { ...state, reload }
}