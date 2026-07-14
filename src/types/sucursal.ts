export interface Sucursal {
  id: number
  empresa_id: number
  nombre: string
  direccion: string
  telefono: string
  email?: string | null
  horarios?: string | null
  mapa_incrustado?: string | null
  latitud?: number | null
  longitud?: number | null
  es_principal: boolean
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
}

export interface CreateSucursalDTO {
  empresa_id: number
  nombre: string
  direccion: string
  telefono: string
  email?: string
  horarios?: string
  mapa_incrustado?: string
  latitud?: number
  longitud?: number
  es_principal: boolean
  orden: number
  estado?: 'activo' | 'inactivo'
}

export interface UpdateSucursalDTO {
  id: number
  empresa_id?: number
  nombre?: string
  direccion?: string
  telefono?: string
  email?: string
  horarios?: string
  mapa_incrustado?: string
  latitud?: number
  longitud?: number
  es_principal?: boolean
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
}