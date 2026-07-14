import { supabase } from '@/lib/supabase'

export interface AuditoriaLog {
  id: number
  usuario_id: string | null
  accion: string
  tabla_afectada: string
  registro_id: string | null
  datos_anteriores: any | null
  datos_nuevos: any | null
  ip_address: string | null
  user_agent: string | null
  metadata: any
  creado_en: string
  usuario?: {
    nombre_completo: string
    email: string
  }
}

export interface AuditoriaFilters {
  tabla?: string
  accion?: string
  usuario_id?: string
  fecha_inicio?: string
  fecha_fin?: string
  limit?: number
  offset?: number
}

export async function getAuditoriaRoles(
  filters: AuditoriaFilters = {}
): Promise<{ logs: AuditoriaLog[]; total: number }> {
  let query = supabase
    .from('auditoria')
    .select(`
      *,
      usuario:perfiles (
        nombre_completo,
        email
      )
    `, { count: 'exact' })
    .in('tabla_afectada', ['roles', 'rol_permiso'])
    .order('creado_en', { ascending: false })

  // Aplicar filtros
  if (filters.accion && filters.accion !== 'all') {
    query = query.eq('accion', filters.accion)
  }

  if (filters.usuario_id) {
    query = query.eq('usuario_id', filters.usuario_id)
  }

  if (filters.fecha_inicio) {
    query = query.gte('creado_en', filters.fecha_inicio)
  }

  if (filters.fecha_fin) {
    query = query.lte('creado_en', filters.fecha_fin)
  }

  // Paginación
  const limit = filters.limit || 50
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error al obtener auditoría:', error)
    throw error
  }

  return {
    logs: (data || []).map((log: any) => ({
      id: log.id,
      usuario_id: log.usuario_id,
      accion: log.accion,
      tabla_afectada: log.tabla_afectada,
      registro_id: log.registro_id,
      datos_anteriores: log.datos_anteriores,
      datos_nuevos: log.datos_nuevos,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      metadata: log.metadata,
      creado_en: log.creado_en,
      usuario: log.usuario,
    })),
    total: count || 0,
  }
}