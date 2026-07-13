import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

// Crear cliente de Supabase
export const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
)

// Tipo para el usuario autenticado (EXPORTADO CORRECTAMENTE)
export type User = NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>>['data']['user']

// Helper para obtener la sesión actual
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Helper para obtener el usuario actual
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}