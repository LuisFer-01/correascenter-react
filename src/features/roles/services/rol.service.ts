import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateRolDTO, Permiso, PermisosAgrupados, Rol, UpdateRolDTO } from '@/types/rol'

// Obtener todos los roles (incluyendo eliminados si se especifica)
export async function getRoles(includeDeleted: boolean = false): Promise<Rol[]> {
  let query = supabase
    .from('roles')
    .select(`
      id,
      nombre,
      slug,
      descripcion,
      es_sistema,
      estado,
      eliminado_en,
      rol_permiso (
        permiso_id,
        permisos (
          id,
          nombre,
          slug,
          grupo,
          descripcion,
          estado
        )
      )
    `)

  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('nombre', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener roles:', error)
    throw error
  }

  return (data || []).map((rol: any) => ({
    id: rol.id,
    nombre: rol.nombre,
    slug: rol.slug,
    descripcion: rol.descripcion,
    es_sistema: rol.es_sistema,
    estado: rol.estado || 'activo',
    eliminado_en: rol.eliminado_en,
    permisos: rol.rol_permiso?.map((rp: any) => rp.permisos).filter(Boolean) || [],
  }))
}

// Obtener todos los permisos disponibles agrupados por grupo
export async function getPermisosAgrupados(): Promise<PermisosAgrupados> {
  const { data, error } = await supabase
    .from('permisos')
    .select('id, nombre, slug, grupo, descripcion, estado')
    .eq('estado', 'activo')
    .order('grupo', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) throw error

  // Agrupar permisos por grupo
  const agrupados: PermisosAgrupados = {}
  ;(data || []).forEach((permiso: Permiso) => {
    if (!agrupados[permiso.grupo]) {
      agrupados[permiso.grupo] = []
    }
    agrupados[permiso.grupo].push(permiso)
  })

  return agrupados
}

// Crear un nuevo rol
export async function crearRol(dto: CreateRolDTO) {
  // 1. Insertar el rol
  const { data: rolData, error: rolError } = await supabaseAdmin
    .from('roles')
    .insert({
      nombre: dto.nombre,
      slug: dto.slug,
      descripcion: dto.descripcion,
      es_sistema: false,
      estado: 'activo',
    })
    .select()
    .single()

  if (rolError) throw new Error(rolError.message)

  // 2. Asignar permisos
  if (dto.permiso_ids.length > 0) {
    const permisosToInsert = dto.permiso_ids.map((permisoId) => ({
      rol_id: rolData.id,
      permiso_id: permisoId,
    }))

    const { error: permError } = await supabaseAdmin
      .from('rol_permiso')
      .insert(permisosToInsert)

    if (permError) throw new Error(permError.message)
  }

  return rolData
}

// Actualizar un rol existente
export async function actualizarRol(dto: UpdateRolDTO) {
  // 1. Actualizar datos del rol
  const { error: rolError } = await supabaseAdmin
    .from('roles')
    .update({
      nombre: dto.nombre,
      slug: dto.slug,
      descripcion: dto.descripcion,
    })
    .eq('id', dto.id)

  if (rolError) throw new Error(rolError.message)

  // 2. Reemplazar permisos (borrar antiguos e insertar nuevos)
  const { error: deleteError } = await supabaseAdmin
    .from('rol_permiso')
    .delete()
    .eq('rol_id', dto.id)

  if (deleteError) throw new Error(deleteError.message)

  if (dto.permiso_ids.length > 0) {
    const permisosToInsert = dto.permiso_ids.map((permisoId) => ({
      rol_id: dto.id,
      permiso_id: permisoId,
    }))

    const { error: insertError } = await supabaseAdmin
      .from('rol_permiso')
      .insert(permisosToInsert)

    if (insertError) throw new Error(insertError.message)
  }
}

// Soft delete de un rol
export async function eliminarRol(id: number) {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('roles')
    .update({
      estado: 'eliminado',
      eliminado_en: now,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Obtener un rol por ID
export async function getRolById(id: number): Promise<Rol | null> {
  const { data, error } = await supabase
    .from('roles')
    .select(`
      id,
      nombre,
      slug,
      descripcion,
      es_sistema,
      estado,
      eliminado_en,
      rol_permiso (
        permiso_id,
        permisos (
          id,
          nombre,
          slug,
          grupo,
          descripcion,
          estado
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    nombre: data.nombre,
    slug: data.slug,
    descripcion: data.descripcion,
    es_sistema: data.es_sistema,
    estado: data.estado || 'activo',
    eliminado_en: data.eliminado_en,
    permisos: data.rol_permiso?.map((rp: any) => rp.permisos).filter(Boolean) || [],
  }
}

// Traducir nombres de grupos al español
export function traducirGrupo(grupo: string): string {
  const traducciones: Record<string, string> = {
    dashboard: 'Dashboard',
    empresa: 'Empresa',
    sucursales: 'Sucursales',
    productos: 'Productos',
    categorias: 'Categorías',
    marcas: 'Marcas',
    atributos: 'Atributos',
    industrias: 'Industrias',
    servicios: 'Servicios',
    contenido: 'Contenido',
    menus: 'Menús',
    footers: 'Footers',
    registros: 'Registros',
    wizard: 'Wizard',
    contactos: 'Contactos',
    suscriptores: 'Suscriptores',
    usuarios: 'Usuarios',
    roles: 'Roles y Permisos',
    auditoria: 'Auditoría',
  }

  return traducciones[grupo] || grupo
}