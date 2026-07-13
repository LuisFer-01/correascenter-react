export interface Role {
  id: number
  nombre: string
  slug: string
}

export interface UserProfile {
  id: string // UUID de auth.users
  email: string
  nombre_completo: string
  telefono?: string | null
  avatar_url?: string | null
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  roles: Role[]
}

export interface CreateUserDTO {
  email: string
  password: string
  nombre_completo: string
  telefono?: string
  avatar_url?: string
  estado: 'activo' | 'inactivo'
  role_ids: number[]
}

export interface UpdateUserDTO {
  id: string
  email: string
  nombre_completo: string
  telefono?: string
  avatar_url?: string
  estado: 'activo' | 'inactivo' | 'eliminado'
  role_ids: number[]
}