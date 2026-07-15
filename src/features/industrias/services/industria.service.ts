import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateIndustriaDTO, Industria, UpdateIndustriaDTO } from '@/types/industria'

export async function getIndustrias(includeDeleted: boolean = false): Promise<Industria[]> {
  let query = supabase
    .from('industrias')
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

  // Cargar asignaciones para cada industria
  const industrias = (data || []).map((i: any) => ({
    ...i,
    estado: i.estado || 'activo',
  }))

  // Si hay industrias, cargar sus asignaciones
  if (industrias.length > 0) {
    const industriaIds = industrias.map(i => i.id)
    
    const { data: asignacionesData, error: asignacionesError } = await supabase
      .from('industria_asignacion')
      .select('*')
      .in('industria_id', industriaIds)
      .eq('estado', 'activo')
      .order('orden', { ascending: true })

    if (asignacionesError) {
      console.error('Error cargando asignaciones:', asignacionesError)
      return industrias
    }

    // Cargar categorías y servicios por separado para evitar errores de relación
    const categoriaIds = asignacionesData
      .filter(a => a.tipo_registro === 'categoria')
      .map(a => a.registro_id)
    
    const servicioIds = asignacionesData
      .filter(a => a.tipo_registro === 'servicio')
      .map(a => a.registro_id)

    let categoriasMap = new Map()
    let serviciosMap = new Map()

    if (categoriaIds.length > 0) {
      const { data: catsData } = await supabase
        .from('categorias')
        .select('id, nombre, slug')
        .in('id', categoriaIds)
      
      catsData?.forEach(cat => categoriasMap.set(cat.id, cat))
    }

    if (servicioIds.length > 0) {
      const { data: servData } = await supabase
        .from('servicios')
        .select('id, nombre, descripcion')
        .in('id', servicioIds)
      
      servData?.forEach(serv => serviciosMap.set(serv.id, serv))
    }

    // Asignar las relaciones a cada industria
    return industrias.map(industria => ({
      ...industria,
      asignaciones: asignacionesData
        .filter(a => a.industria_id === industria.id)
        .map(asig => ({
          ...asig,
          categoria: asig.tipo_registro === 'categoria' ? categoriasMap.get(asig.registro_id) : null,
          servicio: asig.tipo_registro === 'servicio' ? serviciosMap.get(asig.registro_id) : null,
        }))
    }))
  }

  return industrias
}

export async function getIndustriaWithAsignaciones(id: number): Promise<Industria | null> {
  const { data, error } = await supabase
    .from('industrias')
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

  const industria: Industria = {
    ...data,
    estado: data.estado || 'activo',
    asignaciones: [],
  }

  // Cargar asignaciones
  const { data: asignacionesData, error: asignacionesError } = await supabase
    .from('industria_asignacion')
    .select('*')
    .eq('industria_id', id)
    .eq('estado', 'activo')
    .order('orden', { ascending: true })

  if (asignacionesError) {
    console.error('Error cargando asignaciones:', asignacionesError)
    return industria
  }

  // Cargar categorías y servicios
  const categoriaIds = asignacionesData
    .filter(a => a.tipo_registro === 'categoria')
    .map(a => a.registro_id)
  
  const servicioIds = asignacionesData
    .filter(a => a.tipo_registro === 'servicio')
    .map(a => a.registro_id)

  let categoriasMap = new Map()
  let serviciosMap = new Map()

  if (categoriaIds.length > 0) {
    const { data: catsData } = await supabase
      .from('categorias')
      .select('id, nombre, slug')
      .in('id', categoriaIds)
    
    catsData?.forEach(cat => categoriasMap.set(cat.id, cat))
  }

  if (servicioIds.length > 0) {
    const { data: servData } = await supabase
      .from('servicios')
      .select('id, nombre, descripcion')
      .in('id', servicioIds)
    
    servData?.forEach(serv => serviciosMap.set(serv.id, serv))
  }

  industria.asignaciones = asignacionesData.map(asig => ({
    ...asig,
    categoria: asig.tipo_registro === 'categoria' ? categoriasMap.get(asig.registro_id) : null,
    servicio: asig.tipo_registro === 'servicio' ? serviciosMap.get(asig.registro_id) : null,
  }))

  return industria
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

export async function getCategoriasActivas() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, slug')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getServiciosActivos() {
  const { data, error } = await supabase
    .from('servicios')
    .select('id, nombre, descripcion')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getNextOrdenIndustria(): Promise<number> {
  const { data, error } = await supabase
    .from('industrias')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

// Obtener el próximo orden disponible para asignaciones
export async function getNextOrdenAsignacion(industriaId: number): Promise<number> {
  const { data, error } = await supabase
    .from('industria_asignacion')
    .select('orden')
    .eq('industria_id', industriaId)
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 0
  return (data.orden || 0) + 1
}

async function generarSlugUnico(slugBase: string): Promise<string> {
  let slug = slugBase
  let contador = 1

  while (true) {
    const { data } = await supabase
      .from('industrias')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) return slug
    slug = `${slugBase}-${contador}`
    contador++
  }
}

export async function crearIndustria(dto: CreateIndustriaDTO) {
  const slugFinal = await generarSlugUnico(dto.slug)

  const { data, error } = await supabaseAdmin
    .from('industrias')
    .insert({
      empresa_id: dto.empresa_id,
      nombre: dto.nombre,
      slug: slugFinal,
      imagen: dto.imagen,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarIndustria(dto: UpdateIndustriaDTO) {
  const updateData: any = {}

  if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
  if (dto.nombre !== undefined) updateData.nombre = dto.nombre
  
  if (dto.slug !== undefined) {
    const { data: existe } = await supabase
      .from('industrias')
      .select('id')
      .eq('slug', dto.slug)
      .neq('id', dto.id)
      .single()

    if (existe) {
      throw new Error(`El slug "${dto.slug}" ya está en uso por otra industria`)
    }
    updateData.slug = dto.slug
  }
  
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

  const { data, error } = await supabaseAdmin
    .from('industrias')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarIndustria(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('industrias')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarIndustria(id: number) {
  const { error } = await supabaseAdmin
    .from('industrias')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Funciones para gestionar asignaciones
export async function crearAsignacion(industriaId: number, tipoRegistro: 'categoria' | 'servicio', registroId: number) {
  const nextOrden = await getNextOrdenAsignacion(industriaId)
  
  const { data, error } = await supabaseAdmin
    .from('industria_asignacion')
    .insert({
      industria_id: industriaId,
      tipo_registro: tipoRegistro,
      registro_id: registroId,
      orden: nextOrden,
      estado: 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarAsignacion(industriaId: number, asignacionId: number) {
  const { error } = await supabaseAdmin
    .from('industria_asignacion')
    .delete()
    .eq('id', asignacionId)
    .eq('industria_id', industriaId)

  if (error) throw new Error(error.message)
}