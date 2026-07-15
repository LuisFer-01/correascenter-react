import { supabase } from '@/lib/supabase'

export interface AuditoriaLog {
  id: number
  usuario_id: string | null
  usuario?: {
    nombre_completo: string
    email: string
  }
  accion: string
  tabla_afectada: string
  registro_id: string | null
  datos_anteriores: any | null
  datos_nuevos: any | null
  ip_address: string | null
  user_agent: string | null
  metadata: any
  creado_en: string
}

export interface AuditoriaFilters {
  usuario_id?: string
  accion?: string
  tabla_afectada?: string
  fecha_inicio?: string
  fecha_fin?: string
  limit?: number
  offset?: number
}

// Función base para obtener logs (sin paginación para exportación)
async function getAuditoriaLogsForExport(
  filters: AuditoriaFilters = {}
): Promise<AuditoriaLog[]> {
  let query = supabase
    .from('auditoria')
    .select(`
      *,
      usuario:perfiles (
        nombre_completo,
        email
      )
    `)
    .order('creado_en', { ascending: false })

  if (filters.usuario_id) {
    query = query.eq('usuario_id', filters.usuario_id)
  }

  if (filters.accion && filters.accion !== 'all') {
    query = query.eq('accion', filters.accion)
  }

  if (filters.tabla_afectada && filters.tabla_afectada !== 'all') {
    query = query.eq('tabla_afectada', filters.tabla_afectada)
  }

  if (filters.fecha_inicio) {
    query = query.gte('creado_en', filters.fecha_inicio)
  }

  if (filters.fecha_fin) {
    query = query.lte('creado_en', filters.fecha_fin)
  }

  // Sin límite para exportación completa
  const { data, error } = await query

  if (error) {
    console.error('Error al obtener auditoría:', error)
    throw error
  }

  return (data || []).map((log: any) => ({
    id: log.id,
    usuario_id: log.usuario_id,
    usuario: log.usuario,
    accion: log.accion,
    tabla_afectada: log.tabla_afectada,
    registro_id: log.registro_id,
    datos_anteriores: log.datos_anteriores,
    datos_nuevos: log.datos_nuevos,
    ip_address: log.ip_address,
    user_agent: log.user_agent,
    metadata: log.metadata,
    creado_en: log.creado_en,
  }))
}

// Función pública con paginación (para la tabla)
export async function getAuditoriaLogs(
  filters: AuditoriaFilters = {}
): Promise<{ logs: AuditoriaLog[]; total: number }> {
  const limit = filters.limit || 50
  const offset = filters.offset || 0

  // Primero obtenemos el total
  let countQuery = supabase
    .from('auditoria')
    .select('*', { count: 'exact', head: true })

  if (filters.usuario_id) countQuery = countQuery.eq('usuario_id', filters.usuario_id)
  if (filters.accion && filters.accion !== 'all') countQuery = countQuery.eq('accion', filters.accion)
  if (filters.tabla_afectada && filters.tabla_afectada !== 'all') countQuery = countQuery.eq('tabla_afectada', filters.tabla_afectada)
  if (filters.fecha_inicio) countQuery = countQuery.gte('creado_en', filters.fecha_inicio)
  if (filters.fecha_fin) countQuery = countQuery.lte('creado_en', filters.fecha_fin)

  const { count, error: countError } = await countQuery
  if (countError) throw countError

  // Luego obtenemos los datos paginados
  const logs = await getAuditoriaLogsForExport({
    ...filters,
    limit,
    offset,
  })

  // Aplicar paginación manualmente
  const paginatedLogs = logs.slice(offset, offset + limit)

  return {
    logs: paginatedLogs,
    total: count || 0,
  }
}

// Alias para mantener compatibilidad
export async function getAuditoriaRoles(
  filters: AuditoriaFilters = {}
): Promise<{ logs: AuditoriaLog[]; total: number }> {
  return getAuditoriaLogs({
    ...filters,
    tabla_afectada: filters.tabla_afectada || 'roles',
  })
}

export async function getUsuariosConActividad() {
  const { data, error } = await supabase
    .from('auditoria')
    .select(`
      usuario_id,
      usuario:perfiles (
        id,
        nombre_completo,
        email
      )
    `)
    .not('usuario_id', 'is', null)
    .order('creado_en', { ascending: false })

  if (error) throw error

  const uniqueUsers = new Map()
  data?.forEach((item: any) => {
    if (item.usuario && !uniqueUsers.has(item.usuario_id)) {
      uniqueUsers.set(item.usuario_id, {
        id: item.usuario.id,
        nombre_completo: item.usuario.nombre_completo,
        email: item.usuario.email,
      })
    }
  })

  return Array.from(uniqueUsers.values())
}

export async function getTablasAfectadas() {
  const { data, error } = await supabase
    .from('auditoria')
    .select('tabla_afectada')
    .order('creado_en', { ascending: false })

  if (error) throw error

  const uniqueTables = new Set(data?.map(item => item.tabla_afectada) || [])
  return Array.from(uniqueTables).sort()
}

export async function getAccionesDisponibles() {
  const { data, error } = await supabase
    .from('auditoria')
    .select('accion')
    .order('creado_en', { ascending: false })

  if (error) throw error

  const uniqueActions = new Set(data?.map(item => item.accion) || [])
  return Array.from(uniqueActions).sort()
}

// ============================================================================
// FUNCIONES DE EXPORTACIÓN
// ============================================================================

// Transformar logs a formato plano para exportación
function transformarLogsParaExportar(logs: AuditoriaLog[]) {
  return logs.map(log => ({
    'ID': log.id,
    'Fecha/Hora': new Date(log.creado_en).toLocaleString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    'Acción': log.accion,
    'Usuario': log.usuario?.nombre_completo || 'Sistema',
    'Email Usuario': log.usuario?.email || '',
    'Tabla Afectada': log.tabla_afectada,
    'Registro ID': log.registro_id || '',
    'IP': log.ip_address || '',
    'User Agent': log.user_agent || '',
    'Datos Anteriores': log.datos_anteriores ? JSON.stringify(log.datos_anteriores, null, 2) : '',
    'Datos Nuevos': log.datos_nuevos ? JSON.stringify(log.datos_nuevos, null, 2) : '',
    'Metadata': log.metadata && Object.keys(log.metadata).length > 0 
      ? JSON.stringify(log.metadata) 
      : '',
  }))
}

// Exportar a CSV
export async function exportarAuditoriaCSV(filters: AuditoriaFilters = {}): Promise<Blob> {
  const logs = await getAuditoriaLogsForExport(filters)
  const datos = transformarLogsParaExportar(logs)

  const headers = Object.keys(datos[0] || {})
  
  const csvRows = [
    headers.join(','),
    ...datos.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        const stringValue = String(value ?? '')
        // Escapar comillas y envolver en comillas si contiene caracteres especiales
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ]

  const csvContent = '\uFEFF' + csvRows.join('\n')
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

// Exportar a Excel
export async function exportarAuditoriaExcel(filters: AuditoriaFilters = {}): Promise<Blob> {
  const logs = await getAuditoriaLogsForExport(filters)
  const datos = transformarLogsParaExportar(logs)

  // Importar xlsx dinámicamente
  const XLSX = await import('xlsx')
  
  const worksheet = XLSX.utils.json_to_sheet(datos)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoría')

  // Ajustar anchos de columna
  worksheet['!cols'] = [
    { wch: 6 },   // ID
    { wch: 20 },  // Fecha/Hora
    { wch: 12 },  // Acción
    { wch: 25 },  // Usuario
    { wch: 30 },  // Email
    { wch: 20 },  // Tabla
    { wch: 15 },  // Registro ID
    { wch: 15 },  // IP
    { wch: 40 },  // User Agent
    { wch: 50 },  // Datos Anteriores
    { wch: 50 },  // Datos Nuevos
    { wch: 40 },  // Metadata
  ]

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}