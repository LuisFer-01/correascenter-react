import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateSucursalDTO, Sucursal, UpdateSucursalDTO } from '@/types/sucursal'

export async function getSucursales(includeDeleted: boolean = false): Promise<Sucursal[]> {
  let query = supabase
    .from('sucursales')
    .select('*')

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true }).order('nombre', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((s: any) => ({
    ...s,
    estado: s.estado || 'activo',
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

export async function crearSucursal(dto: CreateSucursalDTO) {
  const { data, error } = await supabaseAdmin
    .from('sucursales')
    .insert({
      ...dto,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarSucursal(dto: UpdateSucursalDTO) {
  const updateData: any = {}
  
  if (dto.nombre !== undefined) updateData.nombre = dto.nombre
  if (dto.direccion !== undefined) updateData.direccion = dto.direccion
  if (dto.telefono !== undefined) updateData.telefono = dto.telefono
  if (dto.email !== undefined) updateData.email = dto.email
  if (dto.horarios !== undefined) updateData.horarios = dto.horarios
  if (dto.mapa_incrustado !== undefined) updateData.mapa_incrustado = dto.mapa_incrustado
  if (dto.latitud !== undefined) updateData.latitud = dto.latitud
  if (dto.longitud !== undefined) updateData.longitud = dto.longitud
  if (dto.es_principal !== undefined) updateData.es_principal = dto.es_principal
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
    .from('sucursales')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarSucursal(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('sucursales')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}