export type EstadoSuscriptor = 'activo' | 'inactivo' | 'eliminado'

export interface Suscriptor {
  id: number
  email: string
  nombre?: string | null
  estado: EstadoSuscriptor
  email_verificado_en?: string | null
  eliminado_en?: string | null
  creado_en: string
  actualizado_en: string
  empresa_id: number
  empresa?: { id: number; nombre: string }
}

export interface CreateSuscriptorDTO {
  email: string
  nombre?: string
  empresa_id: number
  estado?: EstadoSuscriptor
}

export interface UpdateSuscriptorDTO {
  id: number
  email?: string
  nombre?: string
  estado?: EstadoSuscriptor
}