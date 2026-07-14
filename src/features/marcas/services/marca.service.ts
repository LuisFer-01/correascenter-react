import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateMarcaDTO, Marca, UpdateMarcaDTO } from '@/types/marca'

export async function getMarcas(includeDeleted: boolean = false): Promise<Marca[]> {
  let query = supabase
    .from('marcas')
    .select('*')

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true }).order('nombre', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((m: any) => ({
    ...m,
    estado: m.estado || 'activo',
  }))
}

// Generar slug único
async function generarSlugUnico(slugBase: string): Promise<string> {
  let slug = slugBase
  let contador = 1

  while (true) {
    const { data } = await supabase
      .from('marcas')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) return slug
    slug = `${slugBase}-${contador}`
    contador++
  }
}

// Obtener siguiente orden disponible
export async function getNextOrdenMarca(): Promise<number> {
  const { data, error } = await supabase
    .from('marcas')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function crearMarca(dto: CreateMarcaDTO) {
  const slugFinal = await generarSlugUnico(dto.slug)

  const { data, error } = await supabaseAdmin
    .from('marcas')
    .insert({
      nombre: dto.nombre,
      slug: slugFinal,
      logo: dto.logo,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarMarca(dto: UpdateMarcaDTO) {
  const updateData: any = {}

  if (dto.nombre !== undefined) updateData.nombre = dto.nombre

  if (dto.slug !== undefined) {
    const { data: existe } = await supabase
      .from('marcas')
      .select('id')
      .eq('slug', dto.slug)
      .neq('id', dto.id)
      .single()

    if (existe) {
      throw new Error(`El slug "${dto.slug}" ya está en uso por otra marca`)
    }
    updateData.slug = dto.slug
  }

  if (dto.logo !== undefined) updateData.logo = dto.logo
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
    .from('marcas')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarMarca(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('marcas')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarMarca(id: number) {
  const { error } = await supabaseAdmin
    .from('marcas')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}