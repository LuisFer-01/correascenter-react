export interface Producto {
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
}

export interface CreateProductoDTO {
  empresa_id: number
  nombre: string
  slug: string
  imagen?: string
  orden?: number
  estado?: 'activo' | 'inactivo'
}

export interface UpdateProductoDTO {
  id: number
  empresa_id?: number
  nombre?: string
  slug?: string
  imagen?: string
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
}