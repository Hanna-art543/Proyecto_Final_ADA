import { supabase } from '../lib/supabase'
 
/**
 * Registra un usuario. El username viaja en los metadatos para que el
 * trigger de auth.users (schema.sql, E1) lo use al crear la fila en profiles.
 * @returns {Promise<{user: object|null, session: object|null}>}
 */
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (error) throw error
  return data
}
 
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
 
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
 
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
 
/** Escucha login/logout. Devuelve una función para cancelar la suscripción. */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
