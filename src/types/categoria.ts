export interface Categoria {
    id: number
    producto_id: number
    nombre: string
    slug: string
    imagen?: string | null
    descripcion?: string | null
    descripcion_corta?: string | null
    uso?: string | null
    orden: number
    estado: 'activo' | 'inactivo' | 'eliminado'
    eliminado_en?: string | null
    creado_en: string
    actualizado_en: string
    producto?: { id: number; nombre: string }
}

export interface CreateCategoriaDTO {
    producto_id: number
    nombre: string
    slug: string
    imagen?: string
    descripcion?: string
    descripcion_corta?: string
    uso?: string
    orden?: number
    estado?: 'activo' | 'inactivo'
}

export interface UpdateCategoriaDTO {
    id: number
    producto_id?: number
    nombre?: string
    slug?: string
    imagen?: string
    descripcion?: string
    descripcion_corta?: string
    uso?: string
    orden?: number
    estado?: 'activo' | 'inactivo' | 'eliminado'
}