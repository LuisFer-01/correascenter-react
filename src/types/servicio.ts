export interface Servicio {
  id: number
  empresa_id: number
  nombre: string
  descripcion?: string | null
  imagen?: string | null
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  empresa?: { id: number; nombre: string }
  industrias_asignadas?: IndustriaAsignacion[]
}

export interface IndustriaAsignacion {
  id: number
  industria_id: number
  tipo_registro: 'categoria' | 'servicio'
  registro_id: number
  orden: number
  estado: 'activo' | 'inactivo'
  industria?: {
    id: number
    nombre: string
    slug: string
  }
}

export interface CreateServicioDTO {
  empresa_id: number
  nombre: string
  descripcion?: string
  imagen?: string
  orden?: number
  estado?: 'activo' | 'inactivo'
  industria_ids?: number[]
}

export interface UpdateServicioDTO {
  id: number
  empresa_id?: number
  nombre?: string
  descripcion?: string
  imagen?: string
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
  industria_ids?: number[]
}