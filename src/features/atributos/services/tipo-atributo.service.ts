import { supabase, supabaseAdmin } from '@/lib/supabase'
import type {
    CreateTipoAtributoDTO,
    TipoAtributo,
    UpdateTipoAtributoDTO,
} from '@/types/tipo-atributo'

export async function getTiposAtributo(includeDeleted: boolean = false): Promise<TipoAtributo[]> {
  let query = supabase
    .from('tipo_atributo')
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
  }))
}

// Generar slug único
async function generarSlugUnico(slugBase: string): Promise<string> {
  let slug = slugBase
  let contador = 1

  while (true) {
    const { data } = await supabase
      .from('tipo_atributo')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) return slug
    slug = `${slugBase}-${contador}`
    contador++
  }
}

// Obtener siguiente orden
export async function getNextOrdenTipoAtributo(): Promise<number> {
  const { data, error } = await supabase
    .from('tipo_atributo')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function crearTipoAtributo(dto: CreateTipoAtributoDTO) {
  const slugFinal = await generarSlugUnico(dto.slug)

  const { data, error } = await supabaseAdmin
    .from('tipo_atributo')
    .insert({
      nombre: dto.nombre,
      slug: slugFinal,
      descripcion: dto.descripcion,
      permite_descripcion: dto.permite_descripcion ?? false,
      permite_valor_numerico: dto.permite_valor_numerico ?? false,
      permite_unidad_medida: dto.permite_unidad_medida ?? false,
      icono: dto.icono,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarTipoAtributo(dto: UpdateTipoAtributoDTO) {
  const updateData: any = {}

  if (dto.nombre !== undefined) updateData.nombre = dto.nombre

  if (dto.slug !== undefined) {
    const { data: existe } = await supabase
      .from('tipo_atributo')
      .select('id')
      .eq('slug', dto.slug)
      .neq('id', dto.id)
      .single()

    if (existe) {
      throw new Error(`El slug "${dto.slug}" ya está en uso`)
    }
    updateData.slug = dto.slug
  }

  if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion
  if (dto.permite_descripcion !== undefined) updateData.permite_descripcion = dto.permite_descripcion
  if (dto.permite_valor_numerico !== undefined) updateData.permite_valor_numerico = dto.permite_valor_numerico
  if (dto.permite_unidad_medida !== undefined) updateData.permite_unidad_medida = dto.permite_unidad_medida
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
    .from('tipo_atributo')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarTipoAtributo(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('tipo_atributo')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarTipoAtributo(id: number) {
  const { error } = await supabaseAdmin
    .from('tipo_atributo')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}