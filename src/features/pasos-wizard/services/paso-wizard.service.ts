import { supabase, supabaseAdmin } from '@/lib/supabase'
import type {
    CreatePasoWizardDTO,
    PasoWizard,
    UpdatePasoWizardDTO,
} from '@/types/pasos-wizard'

export async function getPasosWizard(
    includeDeleted: boolean = false,
): Promise<PasoWizard[]> {
    let query = supabase.from('pasos_wizard').select(`
      *,
      empresa:empresas (
        id,
        nombre
      )
    `)

    if (!includeDeleted) {
        query = query.neq('estado', 'eliminado')
    }

    query = query
        .order('orden', { ascending: true })
        .order('creado_en', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((p: any) => ({
        ...p,
        estado: p.estado || 'activo',
    }))
}

export async function getEmpresasActivas() {
    const { data, error } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('estado', 'activo')
        .order('nombre', { ascending: true })

    if (error) throw error
    return data || []
}

export async function crearPasoWizard(dto: CreatePasoWizardDTO) {
    const { data, error } = await supabaseAdmin
        .from('pasos_wizard')
        .insert({
            empresa_id: dto.empresa_id,
            identificador: dto.identificador,
            titulo: dto.titulo,
            descripcion: dto.descripcion,
            fuente_datos: dto.fuente_datos,
            campo_filtro: dto.campo_filtro,
            orden: dto.orden ?? 0,
            estado: dto.estado || 'activo',
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function actualizarPasoWizard(dto: UpdatePasoWizardDTO) {
    const updateData: any = {}

    if (dto.empresa_id !== undefined) updateData.empresa_id = dto.empresa_id
    if (dto.identificador !== undefined)
        updateData.identificador = dto.identificador
    if (dto.titulo !== undefined) updateData.titulo = dto.titulo
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion
    if (dto.fuente_datos !== undefined) updateData.fuente_datos = dto.fuente_datos
    if (dto.campo_filtro !== undefined) updateData.campo_filtro = dto.campo_filtro
    if (dto.orden !== undefined) updateData.orden = dto.orden

    if (dto.estado !== undefined) {
        updateData.estado = dto.estado
        if (dto.estado === 'eliminado') {
            updateData.eliminado_en = new Date().toISOString()
        } else if (dto.estado === 'activo' || dto.estado === 'inactivo') {
            updateData.eliminado_en = null
        }
    }

    const { data, error } = await supabaseAdmin
        .from('pasos_wizard')
        .update(updateData)
        .eq('id', dto.id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function eliminarPasoWizard(id: number) {
    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
        .from('pasos_wizard')
        .update({ estado: 'eliminado', eliminado_en: now })
        .eq('id', id)

    if (error) throw new Error(error.message)
}

export async function restaurarPasoWizard(id: number) {
    const { error } = await supabaseAdmin
        .from('pasos_wizard')
        .update({ estado: 'activo', eliminado_en: null })
        .eq('id', id)

    if (error) throw new Error(error.message)
}
