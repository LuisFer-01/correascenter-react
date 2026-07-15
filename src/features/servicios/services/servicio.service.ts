import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateServicioDTO, Servicio, UpdateServicioDTO } from '@/types/servicio'

export async function getServicios(includeDeleted: boolean = false): Promise<Servicio[]> {
  let query = supabase
    .from('servicios')
    .select(`
      *,
      empresa:empresas (
        id,
        nombre
      )
    `)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true }).order('nombre', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  // Cargar asignaciones de industrias por separado para evitar errores de relación
  const servicios = (data || []).map((s: any) => ({
    ...s,
    estado: s.estado || 'activo',
  }))

  // Si hay servicios, cargar sus asignaciones de industrias
  if (servicios.length > 0) {
    const servicioIds = servicios.map(s => s.id)
    
    const { data: asignacionesData, error: asignacionesError } = await supabase
      .from('industria_asignacion')
      .select(`
        *,
        industria:industrias (
          id,
          nombre,
          slug
        )
      `)
      .in('registro_id', servicioIds)
      .eq('tipo_registro', 'servicio')
      .eq('estado', 'activo')
      .order('orden', { ascending: true })

    if (asignacionesError) {
      console.error('Error cargando asignaciones de industrias:', asignacionesError)
      return servicios
    }

    // Asignar las industrias a cada servicio
    return servicios.map(servicio => ({
      ...servicio,
      industrias_asignadas: asignacionesData
        .filter(a => a.registro_id === servicio.id)
        .map(asig => ({
          ...asig,
          industria: asig.industria,
        }))
    }))
  }

  return servicios
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

export async function getIndustriasActivas() {
  const { data, error } = await supabase
    .from('industrias')
    .select('id, nombre, slug')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getNextOrdenServicio(): Promise<number> {
  const { data, error } = await supabase
    .from('servicios')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function crearServicio(dto: CreateServicioDTO) {
  const { data: servicioData, error: servicioError } = await supabaseAdmin
    .from('servicios')
    .insert({
      empresa_id: dto.empresa_id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      imagen: dto.imagen,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (servicioError) throw new Error(servicioError.message)

  // Crear asignaciones a industrias
  if (dto.industria_ids && dto.industria_ids.length > 0) {
    const asignaciones = dto.industria_ids.map((industriaId, index) => ({
      industria_id: industriaId,
      tipo_registro: 'servicio',
      registro_id: servicioData.id,
      orden: index,
      estado: 'activo',
    }))

    const { error: asignacionError } = await supabaseAdmin
      .from('industria_asignacion')
      .insert(asignaciones)

    if (asignacionError) throw new Error(asignacionError.message)
  }

  return servicioData
}

export async function actualizarServicio(dto: UpdateServicioDTO) {
  const updateData: any = {}

  if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
  if (dto.nombre !== undefined) updateData.nombre = dto.nombre
  if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion
  if (dto.imagen !== undefined) updateData.imagen = dto.imagen
  if (dto.orden !== undefined) updateData.orden = dto.orden

  if (dto.estado !== undefined) {
    updateData.estado = dto.estado
    if (dto.estado === 'eliminado') {
      updateData.eliminado_en = new Date().toISOString()
    } else if (dto.estado === 'activo' || dto.estado === 'inactivo') {
      updateData.eliminado_en = null
    }
  }

  const { data: servicioData, error: servicioError } = await supabaseAdmin
    .from('servicios')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (servicioError) throw new Error(servicioError.message)

  // Actualizar asignaciones a industrias
  if (dto.industria_ids !== undefined) {
    // Borrar asignaciones antiguas
    const { error: deleteError } = await supabaseAdmin
      .from('industria_asignacion')
      .delete()
      .eq('registro_id', dto.id)
      .eq('tipo_registro', 'servicio')

    if (deleteError) throw new Error(deleteError.message)

    // Crear nuevas asignaciones
    if (dto.industria_ids.length > 0) {
      const asignaciones = dto.industria_ids.map((industriaId, index) => ({
        industria_id: industriaId,
        tipo_registro: 'servicio',
        registro_id: dto.id,
        orden: index,
        estado: 'activo',
      }))

      const { error: insertError } = await supabaseAdmin
        .from('industria_asignacion')
        .insert(asignaciones)

      if (insertError) throw new Error(insertError.message)
    }
  }

  return servicioData
}

export async function eliminarServicio(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('servicios')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarServicio(id: number) {
  const { error } = await supabaseAdmin
    .from('servicios')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}