import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Contacto, EstadoContacto } from '@/types/contacto'

export async function getContactos(
  includeDeleted: boolean = false,
  filtroEstado?: EstadoContacto
): Promise<Contacto[]> {
  let query = supabase
    .from('contactos')
    .select(`
      *,
      empresa_rel:empresas (
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

  return (data || []).map((c: any) => ({
    ...c,
    empresa_rel: c.empresa_rel,
  }))
}

export async function getContactoById(id: number): Promise<Contacto | null> {
  const { data, error } = await supabase
    .from('contactos')
    .select(`
      *,
      empresa_rel:empresas (
        id,
        nombre
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    ...data,
    empresa_rel: data.empresa_rel,
  }
}

export async function marcarComoLeido(id: number) {
  const { error } = await supabaseAdmin
    .from('contactos')
    .update({ 
      estado: 'leido',
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function marcarComoRespondido(id: number) {
  const { error } = await supabaseAdmin
    .from('contactos')
    .update({ 
      estado: 'respondido',
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function archivarContacto(id: number) {
  const { error } = await supabaseAdmin
    .from('contactos')
    .update({ 
      estado: 'archivado',
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function eliminarContacto(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('contactos')
    .update({ 
      eliminado_en: now,
      actualizado_en: now
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarContacto(id: number) {
  const { error } = await supabaseAdmin
    .from('contactos')
    .update({ 
      eliminado_en: null,
      actualizado_en: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getContactosStats() {
  const { data, error } = await supabase
    .from('contactos')
    .select('estado', { count: 'exact' })
    .is('eliminado_en', null)

  if (error) throw error

  const stats = {
    nuevos: 0,
    leidos: 0,
    respondidos: 0,
    archivados: 0,
    total: data?.length || 0,
  }

  data?.forEach((c: any) => {
    if (c.estado === 'nuevo') stats.nuevos++
    if (c.estado === 'leido') stats.leidos++
    if (c.estado === 'respondido') stats.respondidos++
    if (c.estado === 'archivado') stats.archivados++
  })

  return stats
}