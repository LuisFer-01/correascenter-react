import { supabase, supabaseAdmin } from '@/lib/supabase'
import type {
    CreateMenuDTO,
    CreateMenuItemDTO,
    Menu,
    MenuItem,
    UpdateMenuDTO,
    UpdateMenuItemDTO,
} from '@/types/menu'

export async function getMenus(includeDeleted: boolean = false): Promise<Menu[]> {
  let query = supabase
    .from('menus')
    .select(`
      *,
      empresa:empresas (
        id,
        nombre
      ),
      menu_item (
        id,
        ruta,
        orden,
        estado,
        eliminado_en,
        creado_en,
        actualizado_en
      )
    `)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true }).order('grupo', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((m: any) => ({
    ...m,
    estado: m.estado || 'activo',
    menu_items: m.menu_item?.filter((mi: any) => mi.estado !== 'eliminado') || [],
  }))
}

export async function getMenuItems(menuId: number, includeDeleted: boolean = false): Promise<MenuItem[]> {
  let query = supabase
    .from('menu_item')
    .select('*')
    .eq('menu_id', menuId)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('orden', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((mi: any) => ({
    ...mi,
    estado: mi.estado || 'activo',
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

export async function getNextOrdenMenu(): Promise<number> {
  const { data, error } = await supabase
    .from('menus')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

export async function getNextOrdenMenuItem(menuId: number): Promise<number> {
  const { data, error } = await supabase
    .from('menu_item')
    .select('orden')
    .eq('menu_id', menuId)
    .order('orden', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return 1
  return (data.orden || 0) + 1
}

// NUEVA FUNCIÓN: Obtener el siguiente ID disponible según el tipo de registro
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

export async function crearMenu(dto: CreateMenuDTO) {
  const { data, error } = await supabaseAdmin
    .from('menus')
    .insert({
      empresa_id: dto.empresa_id,
      grupo: dto.grupo,
      tipo_registro: dto.tipo_registro,
      registro_id: dto.registro_id,
      ruta: dto.ruta,
      icono: dto.icono,
      mostrar: dto.mostrar ?? true,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarMenu(dto: UpdateMenuDTO) {
  const updateData: any = {}

  if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
  if (dto.grupo !== undefined) updateData.grupo = dto.grupo
  if (dto.tipo_registro !== undefined) updateData.tipo_registro = dto.tipo_registro
  if (dto.registro_id !== undefined) updateData.registro_id = dto.registro_id
  if (dto.ruta !== undefined) updateData.ruta = dto.ruta
  if (dto.icono !== undefined) updateData.icono = dto.icono
  if (dto.mostrar !== undefined) updateData.mostrar = dto.mostrar
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
    .from('menus')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarMenu(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('menus')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarMenu(id: number) {
  const { error } = await supabaseAdmin
    .from('menus')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Funciones para Menu Item
export async function crearMenuItem(dto: CreateMenuItemDTO) {
  const { data, error } = await supabaseAdmin
    .from('menu_item')
    .insert({
      menu_id: dto.menu_id,
      ruta: dto.ruta,
      orden: dto.orden ?? 0,
      estado: dto.estado || 'activo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function actualizarMenuItem(dto: UpdateMenuItemDTO) {
  const updateData: any = {}

  if (dto.menu_id !== undefined) updateData.menu_id = dto.menu_id
  if (dto.ruta !== undefined) updateData.ruta = dto.ruta
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
    .from('menu_item')
    .update(updateData)
    .eq('id', dto.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function eliminarMenuItem(id: number) {
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('menu_item')
    .update({ estado: 'eliminado', eliminado_en: now })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function restaurarMenuItem(id: number) {
  const { error } = await supabaseAdmin
    .from('menu_item')
    .update({ estado: 'activo', eliminado_en: null })
    .eq('id', id)

  if (error) throw new Error(error.message)
}