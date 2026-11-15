import { createClient } from '@supabase/supabase-js'
 
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
 
if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa tu .env (o las variables de Netlify).'
  )
}
 
// Solo la clave anon va en el frontend. La service_role NUNCA.
export const supabase = createClient(url, anonKey)
