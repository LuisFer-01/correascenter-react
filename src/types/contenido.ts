export interface TipoSeccion {
  id: number
  nombre: string
  slug: string
  descripcion?: string | null
  campos_metadata: string[] // JSONB array
  icono?: string | null
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
}

export interface ContenidoSeccion {
  id: number
  empresa_id: number
  tipo_seccion_id: number
  titulo?: string | null
  subtitulo?: string | null
  descripcion?: string | null
  icono?: string | null
  imagen?: string | null
  metadata: Record<string, any> // JSONB
  orden: number
  mostrar: boolean
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  empresa?: { id: number; nombre: string }
  tipo_seccion?: TipoSeccion
}

export interface CreateTipoSeccionDTO {
  nombre: string
  slug: string
  descripcion?: string
  campos_metadata: string[]
  icono?: string
  orden?: number
  estado?: 'activo' | 'inactivo'
}

export interface UpdateTipoSeccionDTO {
  id: number
  nombre?: string
  slug?: string
  descripcion?: string
  campos_metadata?: string[]
  icono?: string
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
}

export interface CreateContenidoSeccionDTO {
  empresa_id: number
  tipo_seccion_id: number
  titulo?: string
  subtitulo?: string
  descripcion?: string
  icono?: string
  imagen?: string
  metadata?: Record<string, any>
  orden?: number
  mostrar?: boolean
  estado?: 'activo' | 'inactivo'
}

export interface UpdateContenidoSeccionDTO {
  id: number
  empresa_id?: number
  tipo_seccion_id?: number
  titulo?: string
  subtitulo?: string
  descripcion?: string
  icono?: string
  imagen?: string
  metadata?: Record<string, any>
  orden?: number
  mostrar?: boolean
  estado?: 'activo' | 'inactivo' | 'eliminado'
}