import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateProductoDTO, Producto, UpdateProductoDTO } from '@/types/producto'

export async function getProductos(includeDeleted: boolean = false): Promise<Producto[]> {
  let query = supabase
    .from('productos')
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

  return (data || []).map((p: any) => ({
    ...p,
    estado: p.estado || 'activo',
  }))
}

// Obtener el máximo orden existente + 1
export async function getNextOrden(): Promise<number> {
  const { data, error } = await supabase
    .from('productos')
    .select('orden')
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

// Función para generar slug único
async function generarSlugUnico(slugBase: string): Promise<string> {
  let slug = slugBase
  let contador = 1
  
  while (true) {
    const { data } = await supabase
      .from('productos')
      .select('id')
      .eq('slug', slug)
      .single()
    
    if (!data) return slug // Slug disponible
    
    slug = `${slugBase}-${contador}`
    contador++
  }
}

export async function crearProducto(dto: CreateProductoDTO) {
  // Generar slug único
  const slugFinal = await generarSlugUnico(dto.slug)

  const { data, error } = await supabaseAdmin
    .from('productos')
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

export async function actualizarProducto(dto: UpdateProductoDTO) {
  const updateData: any = {}

  if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
  if (dto.nombre !== undefined) updateData.nombre = dto.nombre
  
  if (dto.slug !== undefined) {
    // Verificar que el slug no esté en uso por otro producto
    const { data: existe } = await supabase
      .from('productos')
      .select('id')
      .eq('slug', dto.slug)
      .neq('id', dto.id)
      .single()
    
    if (existe) {
      throw new Error(`El slug "${dto.slug}" ya está en uso por otro producto`)
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
    .from('productos')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarProducto(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('productos')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarProducto(id: number) {
  const { error } = await supabaseAdmin
    .from('productos')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}