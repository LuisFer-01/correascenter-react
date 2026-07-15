import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateFooterDTO, Footer, UpdateFooterDTO } from '@/types/footer'

export async function getFooters(includeDeleted: boolean = false): Promise<Footer[]> {
  let query = supabase
    .from('footers')
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

  query = query.order('tipo', { ascending: true }).order('orden', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((f: any) => ({
    ...f,
    estado: f.estado || 'activo',
  }))
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

// Obtener el siguiente registro_id disponible según tipo_registro
export async function getNextRegistroId(tipoRegistro: 'producto' | 'industria' | 'servicio'): Promise<number> {
  const tablaMap = {
    producto: 'productos',
    industria: 'industrias',
    servicio: 'servicios',
  }

  const tabla = tablaMap[tipoRegistro]

  const { data, error } = await supabase
    .from(tabla)
    .select('id')
    .eq('estado', 'activo')
    .order('id', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return data.id + 1
}

// Obtener el siguiente orden disponible según tipo
export async function getNextOrdenFooter(tipo: 'producto' | 'industria' | 'servicio' | 'red_social'): Promise<number> {
  const { data, error } = await supabase
    .from('footers')
    .select('orden')
    .eq('tipo', tipo)
    .eq('estado', 'activo')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function crearFooter(dto: CreateFooterDTO) {
  const { data, error } = await supabaseAdmin
    .from('footers')
    .insert({
      empresa_id: dto.empresa_id,
      tipo: dto.tipo,
      tipo_registro: dto.tipo_registro,
      registro_id: dto.registro_id,
      titulo: dto.titulo,
      url: dto.url,
      icono: dto.icono,
      orden: dto.orden ?? 0,
      mostrar: dto.mostrar ?? true,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarFooter(dto: UpdateFooterDTO) {
  const updateData: any = {}

  if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
  if (dto.tipo !== undefined) updateData.tipo = dto.tipo
  if (dto.tipo_registro !== undefined) updateData.tipo_registro = dto.tipo_registro
  if (dto.registro_id !== undefined) updateData.registro_id = dto.registro_id
  if (dto.titulo !== undefined) updateData.titulo = dto.titulo
  if (dto.url !== undefined) updateData.url = dto.url
  if (dto.icono !== undefined) updateData.icono = dto.icono
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
    .from('footers')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarFooter(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('footers')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarFooter(id: number) {
  const { error } = await supabaseAdmin
    .from('footers')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}