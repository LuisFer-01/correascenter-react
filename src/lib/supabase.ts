import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

// Cliente normal (anon) para operaciones públicas y de usuario logueado
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
)

// Cliente de administración (service_role) para operaciones de admin
export const supabaseAdmin = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)