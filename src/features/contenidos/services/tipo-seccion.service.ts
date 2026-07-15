import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateTipoSeccionDTO, TipoSeccion, UpdateTipoSeccionDTO } from '@/types/contenido'

export async function getTiposSeccion(includeDeleted: boolean = false): Promise<TipoSeccion[]> {
  let query = supabase
    .from('tipo_seccion')
    .select('*')

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true }).order('nombre', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((t: any) => ({
    ...t,
    estado: t.estado || 'activo',
    campos_metadata: t.campos_metadata || [],
  }))
}

export async function getNextOrdenTipoSeccion(): Promise<number> {
  const { data, error } = await supabase
    .from('tipo_seccion')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function crearTipoSeccion(dto: CreateTipoSeccionDTO) {
  const { data, error } = await supabaseAdmin
    .from('tipo_seccion')
    .insert({
      nombre: dto.nombre,
      slug: dto.slug,
      descripcion: dto.descripcion,
      campos_metadata: dto.campos_metadata,
      icono: dto.icono,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarTipoSeccion(dto: UpdateTipoSeccionDTO) {
  const updateData: any = {}

  if (dto.nombre !== undefined) updateData.nombre = dto.nombre
  if (dto.slug !== undefined) updateData.slug = dto.slug
  if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion
  if (dto.campos_metadata !== undefined) updateData.campos_metadata = dto.campos_metadata
  if (dto.icono !== undefined) updateData.icono = dto.icono
  if (dto.orden !== undefined) updateData.orden = dto.orden

  if (dto.estado !== undefined) {
    updateData.estado = dto.estado
    if (dto.estado === 'eliminado') {
      updateData.eliminado_en = new Date().toISOString()
    } else if (dto.estado === 'activo' || dto.estado === 'inactivo') {
      updateData.eliminado_en = null
    }
  }

  const { data, error } = await supabaseAdmin
    .from('tipo_seccion')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarTipoSeccion(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('tipo_seccion')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarTipoSeccion(id: number) {
  const { error } = await supabaseAdmin
    .from('tipo_seccion')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}