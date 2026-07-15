export interface Footer {
  id: number
  empresa_id: number
  tipo: 'producto' | 'industria' | 'servicio' | 'red_social'
  tipo_registro?: 'producto' | 'industria' | 'servicio' | null
  registro_id?: number | null
  titulo?: string | null
  url?: string | null
  icono?: string | null
  orden: number
  mostrar: boolean
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  empresa?: { id: number; nombre: string }
}

export interface CreateFooterDTO {
  empresa_id: number
  tipo: 'producto' | 'industria' | 'servicio' | 'red_social'
  tipo_registro?: 'producto' | 'industria' | 'servicio' | null
  registro_id?: number | null
  titulo?: string
  url?: string
  icono?: string
  orden?: number
  mostrar?: boolean
  estado?: 'activo' | 'inactivo'
}

export interface UpdateFooterDTO {
  id: number
  empresa_id?: number
  tipo?: 'producto' | 'industria' | 'servicio' | 'red_social'
  tipo_registro?: 'producto' | 'industria' | 'servicio' | null
  registro_id?: number | null
  titulo?: string
  url?: string
  icono?: string
  orden?: number
  mostrar?: boolean
  estado?: 'activo' | 'inactivo' | 'eliminado'
}