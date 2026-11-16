import { useCallback, useEffect, useState } from 'react'
import { clearNeighborCache, getGraphData } from '../services/graphService'

export function useGraph({ targetComponents = 6 } = {}) {
  const [data, setData] = useState({
    songs: [],
    styles: [],
    graph: null,
    kruskalResult: null,
    neighborIndex: new Map(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadedTarget, setLoadedTarget] = useState(null)

  const load = useCallback(async ({ refresh = false } = {}) => {
    setLoading(true)
    setError(null)
    if (refresh) clearNeighborCache()
    try {
      setData(await getGraphData({ targetComponents }))
      setLoadedTarget(targetComponents)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [targetComponents])

  useEffect(() => {
    let active = true
    getGraphData({ targetComponents })
      .then((result) => {
        if (active) {
          setData(result)
          setLoadedTarget(targetComponents)
          setError(null)
        }
      })
      .catch((loadError) => {
        if (active) {
          setLoadedTarget(targetComponents)
          setError(loadError)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [targetComponents])

  return {
    ...data,
    loading: loading || loadedTarget !== targetComponents,
    error: loadedTarget === targetComponents ? error : null,
    reload: load,
  }
}

export default useGraph
