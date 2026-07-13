import { supabase } from './supabase'

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('empresas').select('*').limit(1)
    
    if (error) {
      console.error(' Error conectando a Supabase:', error)
      return false
    }
    
    console.log('✅ Conexión exitosa a Supabase')
    console.log('📊 Datos de prueba:', data)
    return true
  } catch (err) {
    console.error('❌ Error inesperado:', err)
    return false
  }
}