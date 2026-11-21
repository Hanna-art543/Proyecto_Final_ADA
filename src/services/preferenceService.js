import { supabase } from '../lib/supabase.js'

export async function getPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data // null si aún no declaró preferencias
}

export async function savePreferences(userId, prefs) {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...prefs })
  if (error) throw error
}