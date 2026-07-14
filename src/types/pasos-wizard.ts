export interface PasoWizard {
    id: number
    empresa_id: number
    identificador: string
    titulo: string
    descripcion: string
    fuente_datos: string
    campo_filtro: string | null
    orden: number
    estado: 'activo' | 'inactivo' | 'eliminado'
    eliminado_en?: string | null
    creado_en: string
    actualizado_en: string
    empresa?: { id: number; nombre: string }
}

export interface CreatePasoWizardDTO {
    empresa_id: number
    identificador: string
    titulo: string
    descripcion: string
    fuente_datos: string
    campo_filtro?: string
    orden?: number
    estado?: 'activo' | 'inactivo'
}

export interface UpdatePasoWizardDTO {
    id: number
    empresa_id?: number
    identificador?: string
    titulo?: string
    descripcion?: string
    fuente_datos?: string
    campo_filtro?: string
    orden?: number
    estado?: 'activo' | 'inactivo' | 'eliminado'
}