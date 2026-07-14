export interface Registro {
  id: number
  identificador: string
  nombre: string
  descripcion: string | null
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
}

export interface RegistroContenido {
  id: number
  empresa_id: number
  registro_id: number
  titulo: string | null
  subtitulo: string | null
  descripcion: string | null
  icono: string | null
  stats: string | null
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  // Campos relacionados (no en BD)
  registro?: Registro
  empresa?: { id: number; nombre: string }
}

export interface CreateRegistroContenidoDTO {
  empresa_id: number
  registro_id: number
  titulo?: string
  subtitulo?: string
  descripcion?: string
  icono?: string
  stats?: string
  orden?: number
  estado?: 'activo' | 'inactivo'
}

export interface UpdateRegistroContenidoDTO {
  id: number
  empresa_id?: number
  registro_id?: number
  titulo?: string
  subtitulo?: string
  descripcion?: string
  icono?: string
  stats?: string
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
}