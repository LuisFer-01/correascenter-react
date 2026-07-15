import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { EstadoSuscriptor, Suscriptor } from '@/types/suscriptor'

export async function getSuscriptores(
  includeDeleted: boolean = false,
  filtroEstado?: EstadoSuscriptor
): Promise<Suscriptor[]> {
  let query = supabase
    .from('suscriptores')
    .select(`
      *,
      empresa:empresas (
        id,
        nombre
      )
    `)

  if (!includeDeleted) {
    query = query.is('eliminado_en', null)
  }

  if (filtroEstado) {
    query = query.eq('estado', filtroEstado)
  }

  query = query.order('creado_en', { ascending: false })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((s: any) => ({
    ...s,
    empresa: s.empresa,
  }))
}

export async function getSuscriptorById(id: number): Promise<Suscriptor | null> {
  const { data, error } = await supabase
    .from('suscriptores')
    .select(`
      *,
      empresa:empresas (
        id,
        nombre
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    ...data,
    empresa: data.empresa,
  }
}

export async function activarSuscriptor(id: number) {
  const { error } = await supabaseAdmin
    .from('suscriptores')
    .update({ 
      estado: 'activo',
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function desactivarSuscriptor(id: number) {
  const { error } = await supabaseAdmin
    .from('suscriptores')
    .update({ 
      estado: 'inactivo',
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function verificarEmail(id: number) {
  const { error } = await supabaseAdmin
    .from('suscriptores')
    .update({ 
      email_verificado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function eliminarSuscriptor(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('suscriptores')
    .update({ 
      estado: 'eliminado',
      eliminado_en: now,
      actualizado_en: now
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarSuscriptor(id: number) {
  const { error } = await supabaseAdmin
    .from('suscriptores')
    .update({ 
      estado: 'activo',
      eliminado_en: null,
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Función para exportar a CSV
export async function exportarSuscriptoresCSV(filtroEstado?: EstadoSuscriptor): Promise<Blob> {
  const suscriptores = await getSuscriptores(false, filtroEstado)
  
  const headers = ['ID', 'Email', 'Nombre', 'Estado', 'Email Verificado', 'Fecha Registro', 'Empresa']
  
  const rows = suscriptores.map(s => [
    s.id,
    s.email,
    s.nombre || '',
    s.estado,
    s.email_verificado_en ? new Date(s.email_verificado_en).toLocaleDateString('es-BO') : 'No',
    new Date(s.creado_en).toLocaleDateString('es-BO'),
    s.empresa?.nombre || '',
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escapar comillas y envolver en comillas si contiene comas
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
  ].join('\n')
  
  return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
}

export async function getSuscriptoresStats() {
  const { data, error } = await supabase
    .from('suscriptores')
    .select('estado, email_verificado_en', { count: 'exact' })
    .is('eliminado_en', null)

  if (error) throw error

  const stats = {
    activos: 0,
    inactivos: 0,
    verificados: 0,
    noVerificados: 0,
    total: data?.length || 0,
  }

  data?.forEach((s: any) => {
    if (s.estado === 'activo') stats.activos++
    if (s.estado === 'inactivo') stats.inactivos++
    if (s.email_verificado_en) stats.verificados++
    else stats.noVerificados++
  })

  return stats
}