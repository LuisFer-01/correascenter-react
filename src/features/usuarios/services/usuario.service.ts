import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { CreateUserDTO, Role, UpdateUserDTO, UserProfile } from '@/types/usuario'

export async function getUsuarios(includeDeleted: boolean = false): Promise<UserProfile[]> {
  let query = supabase
    .from('perfiles')
    .select(`
      id,
      nombre_completo,
      email,
      telefono,
      avatar_url,
      estado,
      eliminado_en,
      usuario_rol (
        roles (
          id,
          nombre,
          slug
        )
      )
    `)

  // Si no es admin, no mostrar eliminados
  if (!includeDeleted) {
    query = query.neq('estado', 'eliminado')
  }

  query = query.order('creado_en', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener usuarios:', error)
    throw error
  }

  return (data || []).map((perfil: any) => ({
    id: perfil.id,
    email: perfil.email || 'Sin email',
    nombre_completo: perfil.nombre_completo || 'Sin Nombre para Mostrar',
    telefono: perfil.telefono,
    avatar_url: perfil.avatar_url,
    estado: perfil.estado || 'activo',
    eliminado_en: perfil.eliminado_en,
    roles: perfil.usuario_rol?.map((ur: any) => ur.roles).filter(Boolean) || [],
  }))
}

export async function getRolesDisponibles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('id, nombre, slug')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data || []
}

export async function crearUsuario(dto: CreateUserDTO) {
  // 1. Crear usuario en Auth con metadata
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: dto.email,
    password: dto.password,
    email_confirm: true,
    user_metadata: { 
      nombre_completo: dto.nombre_completo,
      telefono: dto.telefono,
      avatar_url: dto.avatar_url,
    }
  })

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Error al crear usuario en Auth')
  }

  // 2. Insertar/Actualizar el perfil en la tabla perfiles
  const { error: profileError } = await supabaseAdmin
    .from('perfiles')
    .upsert({ 
      id: authData.user.id,
      nombre_completo: dto.nombre_completo,
      email: dto.email,
      telefono: dto.telefono,
      avatar_url: dto.avatar_url,
      estado: dto.estado 
    })

  if (profileError) throw new Error(profileError.message)

  // 3. Asignar roles
  if (dto.role_ids.length > 0) {
    const rolesToInsert = dto.role_ids.map((roleId) => ({
      usuario_id: authData.user.id,
      rol_id: roleId,
    }))

    const { error: roleError } = await supabaseAdmin
      .from('usuario_rol')
      .insert(rolesToInsert)

    if (roleError) throw new Error(roleError.message)
  }

  return authData.user
}

export async function actualizarUsuario(dto: UpdateUserDTO) {
  // 1. Actualizar usuario en Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    dto.id,
    {
      email: dto.email,
      user_metadata: {
        nombre_completo: dto.nombre_completo,
        telefono: dto.telefono,
        avatar_url: dto.avatar_url,
      }
    }
  )

  if (authError) {
    throw new Error(`Error actualizando auth: ${authError.message}`)
  }

  // 2. Preparar datos de actualización
  const updateData: any = { 
    nombre_completo: dto.nombre_completo,
    email: dto.email,
    telefono: dto.telefono,
    avatar_url: dto.avatar_url,
    estado: dto.estado,
  }

  // Si se está eliminando, registrar la fecha
  if (dto.estado === 'eliminado') {
    updateData.eliminado_en = new Date().toISOString()
  } else if (dto.estado === 'activo' || dto.estado === 'inactivo') {
    // Si se restaura, limpiar la fecha de eliminación
    updateData.eliminado_en = null
  }

  // 3. Actualizar perfil
  const { error: profileError } = await supabaseAdmin
    .from('perfiles')
    .update(updateData)
    .eq('id', dto.id)

  if (profileError) throw new Error(profileError.message)

  // 4. Reemplazar roles (solo si no está eliminado)
  if (dto.estado !== 'eliminado') {
    // Borrar roles antiguos
    const { error: deleteError } = await supabaseAdmin
      .from('usuario_rol')
      .delete()
      .eq('usuario_id', dto.id)

    if (deleteError) throw new Error(deleteError.message)

    // Insertar nuevos roles
    if (dto.role_ids.length > 0) {
      const rolesToInsert = dto.role_ids.map((roleId) => ({
        usuario_id: dto.id,
        rol_id: roleId,
      }))

      const { error: insertError } = await supabaseAdmin
        .from('usuario_rol')
        .insert(rolesToInsert)

      if (insertError) throw new Error(insertError.message)
    }
  }
}

// Soft Delete - Solo cambia estado
export async function eliminarUsuario(id: string) {
  const now = new Date().toISOString()
  
  const { error } = await supabaseAdmin
    .from('perfiles')
    .update({ 
      estado: 'eliminado',
      eliminado_en: now 
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Restaurar usuario
export async function restaurarUsuario(id: string) {
  const { error } = await supabaseAdmin
    .from('perfiles')
    .update({ 
      estado: 'activo',
      eliminado_en: null 
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function getUsuarioById(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select(`
      id,
      nombre_completo,
      email,
      telefono,
      avatar_url,
      estado,
      eliminado_en,
      usuario_rol (
        roles (
          id,
          nombre,
          slug
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    email: data.email || 'Sin email',
    nombre_completo: data.nombre_completo || 'Sin Nombre para Mostrar',
    telefono: data.telefono,
    avatar_url: data.avatar_url,
    estado: data.estado || 'activo',
    eliminado_en: data.eliminado_en,
    roles: data.usuario_rol?.map((ur: any) => ur.roles).filter(Boolean) || [],
  }
}

// Verificar si el usuario es Super Admin
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('usuario_rol')
    .select('roles(slug)')
    .eq('usuario_id', userId)
    .eq('roles.slug', 'super_admin')
    .single()

  return !!data
}