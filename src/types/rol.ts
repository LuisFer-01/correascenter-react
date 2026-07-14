export interface Permiso {
  id: number
  nombre: string
  slug: string
  grupo: string
  descripcion: string | null
  estado: 'activo' | 'inactivo'
}

export interface Rol {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  es_sistema: boolean
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  permisos: Permiso[]
}

export interface CreateRolDTO {
  nombre: string
  slug: string
  descripcion?: string
  permiso_ids: number[]
}

export interface UpdateRolDTO {
  id: number
  nombre: string
  slug: string
  descripcion?: string
  permiso_ids: number[]
}

export interface PermisosAgrupados {
  [grupo: string]: Permiso[]
}