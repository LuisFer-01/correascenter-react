export interface AtributoTecnico {
  id: number
  tipo_atributo_id: number
  nombre: string
  descripcion?: string | null
  valor_numerico?: number | null
  unidad_medida?: string | null
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  tipo_atributo?: {
    id: number
    nombre: string
    slug: string
    permite_descripcion: boolean
    permite_valor_numerico: boolean
    permite_unidad_medida: boolean
  }
  categorias?: {
    id: number
    nombre: string
    slug: string
  }[]
}

export interface CreateAtributoDTO {
  tipo_atributo_id: number
  nombre: string
  descripcion?: string
  valor_numerico?: number
  unidad_medida?: string
  orden?: number
  estado?: 'activo' | 'inactivo'
  categoria_ids?: number[]
}

export interface UpdateAtributoDTO {
  id: number
  tipo_atributo_id?: number
  nombre?: string
  descripcion?: string
  valor_numerico?: number
  unidad_medida?: string
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
  categoria_ids?: number[]
}

export interface CategoriaAtributo {
  id: number
  categoria_id: number
  atributo_id: number
  valor_personalizado?: number | null
  orden: number
  estado: 'activo' | 'inactivo'
}