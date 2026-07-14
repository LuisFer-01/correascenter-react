export interface Empresa {
  id: number
  nombre: string
  logo?: string | null
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
}

export interface CreateEmpresaDTO {
  nombre: string
  logo?: string
  estado?: 'activo' | 'inactivo'
}

export interface UpdateEmpresaDTO {
  id: number
  nombre?: string
  logo?: string
  estado?: 'activo' | 'inactivo' | 'eliminado'
}