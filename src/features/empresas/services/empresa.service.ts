import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateEmpresaDTO, Empresa, UpdateEmpresaDTO } from '@/types/empresa'

export async function getEmpresas(includeDeleted: boolean = false): Promise<Empresa[]> {
  let query = supabase
    .from('empresas')
    .select('*')

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('nombre', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener empresas:', error)
    throw error
  }

  return (data || []).map((empresa: any) => ({
    id: empresa.id,
    nombre: empresa.nombre,
    logo: empresa.logo,
    estado: empresa.estado || 'activo',
    eliminado_en: empresa.eliminado_en,
    creado_en: empresa.creado_en,
    actualizado_en: empresa.actualizado_en,
  }))
}

export async function crearEmpresa(dto: CreateEmpresaDTO) {
  const { data, error } = await supabaseAdmin
    .from('empresas')
    .insert({
      nombre: dto.nombre,
      logo: dto.logo,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function actualizarEmpresa(dto: UpdateEmpresaDTO) {
  const updateData: any = {}
  
  if (dto.nombre !== undefined) updateData.nombre = dto.nombre
  if (dto.logo !== undefined) updateData.logo = dto.logo
  if (dto.estado !== undefined) {
    updateData.estado = dto.estado
    if (dto.estado === 'eliminado') {
      updateData.eliminado_en = new Date().toISOString()
    } else if (dto.estado === 'activo' || dto.estado === 'inactivo') {
      updateData.eliminado_en = null
    }
  }

  const { data, error } = await supabaseAdmin
    .from('empresas')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function eliminarEmpresa(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('empresas')
    .update({ 
      estado: 'eliminado',
      eliminado_en: now 
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarEmpresa(id: number) {
  const { error } = await supabaseAdmin
    .from('empresas')
    .update({ 
      estado: 'activo',
      eliminado_en: null 
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getEmpresaById(id: number): Promise<Empresa | null> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    nombre: data.nombre,
    logo: data.logo,
    estado: data.estado || 'activo',
    eliminado_en: data.eliminado_en,
    creado_en: data.creado_en,
    actualizado_en: data.actualizado_en,
  }
}