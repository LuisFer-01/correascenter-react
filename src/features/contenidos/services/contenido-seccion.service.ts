import { supabase, supabaseAdmin } from '@/lib/supabase'
import type {
    ContenidoSeccion,
    CreateContenidoSeccionDTO,
    UpdateContenidoSeccionDTO,
} from '@/types/contenido'

export async function getContenidoSeccion(includeDeleted: boolean = false): Promise<ContenidoSeccion[]> {
  let query = supabase
    .from('contenido_seccion')
    .select(`
      *,
      empresa:empresas (
        id,
        nombre
      ),
      tipo_seccion:tipo_seccion (
        id,
        nombre,
        slug,
        campos_metadata,
        icono
      )
    `)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true }).order('titulo', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((c: any) => ({
    ...c,
    estado: c.estado || 'activo',
    metadata: c.metadata || {},
  }))
}

export async function getContenidoByTipoSeccion(
  tipoSeccionSlug: string,
  empresaId: number,
  includeDeleted: boolean = false
): Promise<ContenidoSeccion[]> {
  let query = supabase
    .from('contenido_seccion')
    .select(`
      *,
      empresa:empresas (
        id,
        nombre
      ),
      tipo_seccion:tipo_seccion (
        id,
        nombre,
        slug,
        campos_metadata,
        icono
      )
    `)
    .eq('tipo_seccion.slug', tipoSeccionSlug)
    .eq('empresa_id', empresaId)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.eq('mostrar', true).order('orden', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((c: any) => ({
    ...c,
    estado: c.estado || 'activo',
    metadata: c.metadata || {},
  }))
}

export async function getNextOrdenContenido(tipoSeccionId: number): Promise<number> {
  const { data, error } = await supabase
    .from('contenido_seccion')
    .select('orden')
    .eq('tipo_seccion_id', tipoSeccionId)
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function getEmpresasActivas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nombre')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function crearContenidoSeccion(dto: CreateContenidoSeccionDTO) {
  const { data, error } = await supabaseAdmin
    .from('contenido_seccion')
    .insert({
      empresa_id: dto.empresa_id,
      tipo_seccion_id: dto.tipo_seccion_id,
      titulo: dto.titulo,
      subtitulo: dto.subtitulo,
      descripcion: dto.descripcion,
      icono: dto.icono,
      imagen: dto.imagen,
      metadata: dto.metadata || {},
      orden: dto.orden ?? 0,
      mostrar: dto.mostrar ?? true,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarContenidoSeccion(dto: UpdateContenidoSeccionDTO) {
  const updateData: any = {}

  if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
  if (dto.tipo_seccion_id !== undefined) updateData.tipo_seccion_id = dto.tipo_seccion_id
  if (dto.titulo !== undefined) updateData.titulo = dto.titulo
  if (dto.subtitulo !== undefined) updateData.subtitulo = dto.subtitulo
  if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion
  if (dto.icono !== undefined) updateData.icono = dto.icono
  if (dto.imagen !== undefined) updateData.imagen = dto.imagen
  if (dto.metadata !== undefined) updateData.metadata = dto.metadata
  if (dto.orden !== undefined) updateData.orden = dto.orden
  if (dto.mostrar !== undefined) updateData.mostrar = dto.mostrar

  if (dto.estado !== undefined) {
    updateData.estado = dto.estado
    if (dto.estado === 'eliminado') {
      updateData.eliminado_en = new Date().toISOString()
    } else if (dto.estado === 'activo' || dto.estado === 'inactivo') {
      updateData.eliminado_en = null
    }
  }

  const { data, error } = await supabaseAdmin
    .from('contenido_seccion')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarContenidoSeccion(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('contenido_seccion')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarContenidoSeccion(id: number) {
  const { error } = await supabaseAdmin
    .from('contenido_seccion')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}