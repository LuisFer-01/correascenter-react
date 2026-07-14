export interface Marca {
    id: number
    nombre: string
    slug: string
    logo?: string | null
    orden: number
    estado: 'activo' | 'inactivo' | 'eliminado'
    eliminado_en?: string | null
    creado_en: string
    actualizado_en: string
}

export interface CreateMarcaDTO {
    nombre: string
    slug: string
    logo?: string
    orden?: number
    estado?: 'activo' | 'inactivo'
}

export interface UpdateMarcaDTO {
    id: number
    nombre?: string
    slug?: string
    logo?: string
    orden?: number
    estado?: 'activo' | 'inactivo' | 'eliminado'
}