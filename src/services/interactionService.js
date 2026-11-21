import { supabase } from '../lib/supabase.js'

/** Todas las interacciones del usuario. */
export async function getInteractions(userId) {
  const { data, error } = await supabase
    .from('song_interactions')
    .select('song_id, rating, is_favorite, play_count')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

/** Crea o actualiza la fila (user_id, song_id) mezclando lo que ya tenía. */
async function upsertInteraction(userId, songId, patch) {
  const { data: prev, error: e1 } = await supabase
    .from('song_interactions')
    .select('rating, is_favorite, play_count')
    .eq('user_id', userId)
    .eq('song_id', songId)
    .maybeSingle()
  if (e1) throw e1

  const row = {
    user_id: userId,
    song_id: songId,
    rating: prev?.rating ?? null,
    is_favorite: prev?.is_favorite ?? false,
    play_count: prev?.play_count ?? 0,
    ...patch,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase
    .from('song_interactions')
    .upsert(row, { onConflict: 'user_id,song_id' })
  if (error) throw error
  return { song_id: songId, rating: row.rating, is_favorite: row.is_favorite, play_count: row.play_count }
}

export const rateSong = (userId, songId, rating) => upsertInteraction(userId, songId, { rating })
export const setFavorite = (userId, songId, is_favorite) =>
  upsertInteraction(userId, songId, { is_favorite })

/** Suma una reproducción. */
export async function addPlay(userId, songId, current = 0) {
  return upsertInteraction(userId, songId, { play_count: current + 1 })
}