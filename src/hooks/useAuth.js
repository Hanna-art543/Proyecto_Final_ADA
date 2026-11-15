import { createContext, createElement, useContext, useEffect, useState } from 'react'
import { getSession, onAuthChange } from '../services/authService'
 
const AuthContext = createContext({ user: null, loading: true })
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    getSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setLoading(false))
    return onAuthChange((session) => setUser(session?.user ?? null))
  }, [])
 
  return createElement(AuthContext.Provider, { value: { user, loading } }, children)
}
 
export function useAuth() {
  return useContext(AuthContext)
}
