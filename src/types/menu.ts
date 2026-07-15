export interface Menu {
  id: number
  empresa_id: number
  grupo: string
  tipo_registro: 'producto' | 'industria' | 'servicio'
  registro_id: number
  ruta: string
  icono?: string | null
  mostrar: boolean
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  empresa?: { id: number; nombre: string }
  menu_items?: MenuItem[]
}

export interface MenuItem {
  id: number
  menu_id: number
  ruta: string
  orden: number
  estado: 'activo' | 'inactivo' | 'eliminado'
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
}

export interface CreateMenuDTO {
  empresa_id: number
  grupo: string
  tipo_registro: 'producto' | 'industria' | 'servicio'
  registro_id: number
  ruta: string
  icono?: string
  mostrar?: boolean
  orden?: number
  estado?: 'activo' | 'inactivo'
}

export interface UpdateMenuDTO {
  id: number
  empresa_id?: number
  grupo?: string
  tipo_registro?: 'producto' | 'industria' | 'servicio'
  registro_id?: number
  ruta?: string
  icono?: string
  mostrar?: boolean
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
}

export interface CreateMenuItemDTO {
  menu_id: number
  ruta: string
  orden?: number
  estado?: 'activo' | 'inactivo'
}

export interface UpdateMenuItemDTO {
  id: number
  menu_id?: number
  ruta?: string
  orden?: number
  estado?: 'activo' | 'inactivo' | 'eliminado'
}