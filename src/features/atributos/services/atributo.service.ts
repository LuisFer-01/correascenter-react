import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { AtributoTecnico, CreateAtributoDTO, UpdateAtributoDTO } from '@/types/atributo'

export async function getAtributos(includeDeleted: boolean = false): Promise<AtributoTecnico[]> {
  let query = supabase
    .from('atributos_tecnico')
    .select(`
      *,
      tipo_atributo:tipo_atributo (
        id,
        nombre,
        slug,
        permite_descripcion,
        permite_valor_numerico,
        permite_unidad_medida
      )
    `)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true }).order('nombre', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((a: any) => ({
    ...a,
    estado: a.estado || 'activo',
  }))
}

export async function getTiposAtributoActivos() {
  const { data, error } = await supabase
    .from('tipo_atributo')
    .select('id, nombre, slug, permite_descripcion, permite_valor_numerico, permite_unidad_medida')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getNextOrdenAtributo(): Promise<number> {
  const { data, error } = await supabase
    .from('atributos_tecnico')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function crearAtributo(dto: CreateAtributoDTO) {
  // Obtener el tipo de atributo para validar campos permitidos
  const { data: tipoAtributo, error: tipoError } = await supabase
    .from('tipo_atributo')
    .select('permite_descripcion, permite_valor_numerico, permite_unidad_medida')
    .eq('id', dto.tipo_atributo_id)
    .single()

  if (tipoError || !tipoAtributo) {
    throw new Error('Tipo de atributo no encontrado')
  }

  // Construir datos a insertar solo con campos permitidos
  const insertData: any = {
    tipo_atributo_id: dto.tipo_atributo_id,
    nombre: dto.nombre,
    orden: dto.orden ?? 0,
    estado: dto.estado || 'activo',
  }

  // Solo agregar campos si el tipo lo permite
  if (tipoAtributo.permite_descripcion) {
    insertData.descripcion = dto.descripcion || null
  } else {
    insertData.descripcion = null
  }

  if (tipoAtributo.permite_valor_numerico) {
    insertData.valor_numerico = dto.valor_numerico ?? null
  } else {
    insertData.valor_numerico = null
  }

  if (tipoAtributo.permite_unidad_medida) {
    insertData.unidad_medida = dto.unidad_medida || null
  } else {
    insertData.unidad_medida = null
  }

  const { data, error } = await supabaseAdmin
    .from('atributos_tecnico')
    .insert(insertData)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarAtributo(dto: UpdateAtributoDTO) {
  // Obtener el tipo de atributo
  const { data: tipoAtributo, error: tipoError } = await supabase
    .from('tipo_atributo')
    .select('permite_descripcion, permite_valor_numerico, permite_unidad_medida')
    .eq('id', dto.tipo_atributo_id || (await getAtributoById(dto.id))?.tipo_atributo_id)
    .single()

  if (tipoError || !tipoAtributo) {
    throw new Error('Tipo de atributo no encontrado')
  }

  const updateData: any = {}

  if (dto.tipo_atributo_id !== undefined) updateData.tipo_atributo_id = dto.tipo_atributo_id
  if (dto.nombre !== undefined) updateData.nombre = dto.nombre
  if (dto.orden !== undefined) updateData.orden = dto.orden

  // Solo actualizar campos permitidos
  if (tipoAtributo.permite_descripcion) {
    if (dto.descripcion !== undefined) {
      updateData.descripcion = dto.descripcion || null
    }
  } else {
    updateData.descripcion = null
  }

  if (tipoAtributo.permite_valor_numerico) {
    updateData.valor_numerico = dto.valor_numerico ?? null
  } else {
    updateData.valor_numerico = null
  }

  if (tipoAtributo.permite_unidad_medida) {
    updateData.unidad_medida = dto.unidad_medida || null
  } else {
    updateData.unidad_medida = null
  }

  if (dto.estado !== undefined) {
    updateData.estado = dto.estado
    if (dto.estado === 'eliminado') {
      updateData.eliminado_en = new Date().toISOString()
    } else if (dto.estado === 'activo' || dto.estado === 'inactivo') {
      updateData.eliminado_en = null
    }
  }

  const { data, error } = await supabaseAdmin
    .from('atributos_tecnico')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarAtributo(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('atributos_tecnico')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarAtributo(id: number) {
  const { error } = await supabaseAdmin
    .from('atributos_tecnico')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}