export interface Industria {
  id: number
  empresa_id: number
  nombre: string
  slug: string
  imagen?: string | null
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  empresa?: { id: number; nombre: string }
  asignaciones?: IndustriaAsignacion[]
}

export interface CreateIndustriaDTO {
  empresa_id: number
  nombre: string
  slug: string
  imagen?: string
  orden?: number
  estado?: 'activo' | 'inactivo'
  categoria_ids?: number[]
  servicio_ids?: number[]
}

export interface UpdateIndustriaDTO {
  id: number
  empresa_id?: number
  nombre?: string
  slug?: string
  imagen?: string
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
  categoria_ids?: number[]
  servicio_ids?: number[]
}

export interface IndustriaAsignacion {
  id: number
  industria_id: number
  tipo_registro: 'categoria' | 'servicio'
  registro_id: number
  orden: number
  estado: 'activo' | 'inactivo'
  creado_en: string
  actualizado_en: string
  categoria?: {
    id: number
    nombre: string
    slug: string
  }
  servicio?: {
    id: number
    nombre: string
    descripcion?: string
  }
}