import { supabase, supabaseAdmin } from '@/lib/supabase'
import type {
    CreateRegistroContenidoDTO,
    Registro,
    RegistroContenido,
    UpdateRegistroContenidoDTO,
} from '@/types/registro'

// Obtener todos los registros (tipos de secciones)
export async function getRegistros(includeDeleted: boolean = false): Promise<Registro[]> {
  let query = supabase
    .from('registros')
    .select('*')

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((r: any) => ({
    ...r,
    estado: r.estado || 'activo',
  }))
}

// Obtener contenidos de registros con relaciones
export async function getRegistroContenidos(
  includeDeleted: boolean = false
): Promise<RegistroContenido[]> {
  let query = supabase
    .from('registro_contenido')
    .select(`
      *,
      registro:registros (
        id,
        identificador,
        nombre,
        descripcion,
        orden
      ),
      empresa:empresas (
        id,
        nombre
      )
    `)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((c: any) => ({
    ...c,
    estado: c.estado || 'activo',
  }))
}

// Obtener empresas activas para el selector
export async function getEmpresasActivas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nombre')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

// Crear contenido de registro
export async function crearRegistroContenido(dto: CreateRegistroContenidoDTO) {
  const { data, error } = await supabaseAdmin
    .from('registro_contenido')
    .insert({
      empresa_id: dto.empresa_id,
      registro_id: dto.registro_id,
      titulo: dto.titulo,
      subtitulo: dto.subtitulo,
      descripcion: dto.descripcion,
      icono: dto.icono,
      stats: dto.stats,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Actualizar contenido de registro
export async function actualizarRegistroContenido(dto: UpdateRegistroContenidoDTO) {
  const updateData: any = {}

  if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
  if (dto.registro_id !== undefined) updateData.registro_id = dto.registro_id
  if (dto.titulo !== undefined) updateData.titulo = dto.titulo
  if (dto.subtitulo !== undefined) updateData.subtitulo = dto.subtitulo
  if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion
  if (dto.icono !== undefined) updateData.icono = dto.icono
  if (dto.stats !== undefined) updateData.stats = dto.stats
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
    .from('registro_contenido')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Soft delete
export async function eliminarRegistroContenido(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('registro_contenido')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Restaurar
export async function restaurarRegistroContenido(id: number) {
  const { error } = await supabaseAdmin
    .from('registro_contenido')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}