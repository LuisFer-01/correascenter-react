import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { Categoria, CreateCategoriaDTO, UpdateCategoriaDTO } from '@/types/categoria'

export async function getCategorias(includeDeleted: boolean = false): Promise<Categoria[]> {
    let query = supabase
        .from('categorias')
        .select(`
      *,
      producto:productos (
        id,
        nombre
      )
    `)

    if (!includeDeleted) {
        query = query.neq('estado', 'eliminado')
    }

    query = query.order('orden', { ascending: true }).order('nombre', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((c: any) => ({
        ...c,
        estado: c.estado || 'activo',
    }))
}

export async function getProductosActivos() {
    const { data, error } = await supabase
        .from('productos')
        .select('id, nombre')
        .eq('estado', 'activo')
        .order('nombre', { ascending: true })

    if (error) throw error
    return data || []
}

// Generar slug único
async function generarSlugUnico(slugBase: string): Promise<string> {
    let slug = slugBase
    let contador = 1

    while (true) {
        const { data } = await supabase
            .from('categorias')
            .select('id')
            .eq('slug', slug)
            .single()

        if (!data) return slug
        slug = `${slugBase}-${contador}`
        contador++
    }
}

// Obtener siguiente orden
export async function getNextOrdenCategoria(): Promise<number> {
    const { data, error } = await supabase
        .from('categorias')
        .select('orden')
        .order('orden', { ascending: false })
        .limit(1)
        .single()

    if (error || !data) return 1
    return (data.orden || 0) + 1
}

export async function crearCategoria(dto: CreateCategoriaDTO) {
    const slugFinal = await generarSlugUnico(dto.slug)

    const { data, error } = await supabaseAdmin
        .from('categorias')
        .insert({
            producto_id: dto.producto_id,
            nombre: dto.nombre,
            slug: slugFinal,
            imagen: dto.imagen,
            descripcion: dto.descripcion,
            descripcion_corta: dto.descripcion_corta,
            uso: dto.uso,
            orden: dto.orden ?? 0,
            estado: dto.estado || 'activo',
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function actualizarCategoria(dto: UpdateCategoriaDTO) {
    const updateData: any = {}

    if (dto.producto_id !== undefined) updateData.producto_id = dto.producto_id
    if (dto.nombre !== undefined) updateData.nombre = dto.nombre

    if (dto.slug !== undefined) {
        const { data: existe } = await supabase
            .from('categorias')
            .select('id')
            .eq('slug', dto.slug)
            .neq('id', dto.id)
            .single()

        if (existe) {
            throw new Error(`El slug "${dto.slug}" ya está en uso por otra categoría`)
        }
        updateData.slug = dto.slug
    }

    if (dto.imagen !== undefined) updateData.imagen = dto.imagen
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion
    if (dto.descripcion_corta !== undefined) updateData.descripcion_corta = dto.descripcion_corta
    if (dto.uso !== undefined) updateData.uso = dto.uso
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
        .from('categorias')
        .update(updateData)
        .eq('id', dto.id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function eliminarCategoria(id: number) {
    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
        .from('categorias')
        .update({ estado: 'eliminado', eliminado_en: now })
        .eq('id', id)

    if (error) throw new Error(error.message)
}

export async function restaurarCategoria(id: number) {
    const { error } = await supabaseAdmin
        .from('categorias')
        .update({ estado: 'activo', eliminado_en: null })
        .eq('id', id)

    if (error) throw new Error(error.message)
}