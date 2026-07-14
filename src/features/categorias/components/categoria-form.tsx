import { FormShell } from '@/components/shared/form-shell'
import { ProductoImageUpload } from '@/components/shared/producto-image-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Categoria } from '@/types/categoria'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarCategoria,
    crearCategoria,
    getNextOrdenCategoria,
    getProductosActivos,
} from '../services/categoria.service'

const formSchema = z.object({
  producto_id: z.coerce.number().min(1, 'Selecciona un producto'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  descripcion: z.string().optional(),
  descripcion_corta: z.string().optional(),
  uso: z.string().optional(),
  imagen: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface CategoriaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoriaEditar?: Categoria | null
  onSuccess: () => void
}

export function CategoriaForm({
  open,
  onOpenChange,
  categoriaEditar,
  onSuccess,
}: CategoriaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [productos, setProductos] = useState<{ id: number; nombre: string }[]>([])
  const [productosLoaded, setProductosLoaded] = useState(false)
  const [imagenUrl, setImagenUrl] = useState<string>('')
  const isEditing = !!categoriaEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      producto_id: 0,
      nombre: '',
      slug: '',
      descripcion: '',
      descripcion_corta: '',
      uso: '',
      imagen: '',
      orden: 0,
      estado: 'activo',
    },
  })

  // Cargar productos solo una vez
  useEffect(() => {
    if (open && !productosLoaded) {
      getProductosActivos().then((data) => {
        setProductos(data)
        setProductosLoaded(true)
      })
    }
  }, [open, productosLoaded])

  // Auto-generar slug desde el nombre (solo en creación)
  const nombreWatch = form.watch('nombre')
  useEffect(() => {
    if (!isEditing && nombreWatch) {
      const slug = nombreWatch
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      form.setValue('slug', slug)
    }
  }, [nombreWatch, isEditing, form])

  // Resetear formulario
  useEffect(() => {
    if (!open) {
      form.reset({
        producto_id: 0,
        nombre: '',
        slug: '',
        descripcion: '',
        descripcion_corta: '',
        uso: '',
        imagen: '',
        orden: 0,
        estado: 'activo',
      })
      setImagenUrl('')
      return
    }

    if (open && categoriaEditar) {
      setImagenUrl(categoriaEditar.imagen || '')
      form.reset({
        producto_id: categoriaEditar.producto_id,
        nombre: categoriaEditar.nombre,
        slug: categoriaEditar.slug,
        descripcion: categoriaEditar.descripcion || '',
        descripcion_corta: categoriaEditar.descripcion_corta || '',
        uso: categoriaEditar.uso || '',
        imagen: categoriaEditar.imagen || '',
        orden: categoriaEditar.orden,
        estado: categoriaEditar.estado === 'eliminado' ? 'activo' : categoriaEditar.estado,
      })
    } else if (open && productos.length > 0 && !categoriaEditar) {
      // Obtener el siguiente orden disponible automáticamente
      getNextOrdenCategoria().then((nextOrden) => {
        form.reset({
          producto_id: productos[0]?.id || 0,
          nombre: '',
          slug: '',
          descripcion: '',
          descripcion_corta: '',
          uso: '',
          imagen: '',
          orden: nextOrden,
          estado: 'activo',
        })
      })
      setImagenUrl('')
    }
  }, [open, categoriaEditar, form, productos])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && categoriaEditar) {
        await actualizarCategoria({
          id: categoriaEditar.id,
          producto_id: data.producto_id,
          nombre: data.nombre,
          slug: data.slug,
          descripcion: data.descripcion,
          descripcion_corta: data.descripcion_corta,
          uso: data.uso,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
        })
      } else {
        await crearCategoria({
          producto_id: data.producto_id,
          nombre: data.nombre,
          slug: data.slug,
          descripcion: data.descripcion,
          descripcion_corta: data.descripcion_corta,
          uso: data.uso,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
        })
      }
      form.reset()
      setImagenUrl('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar la categoría')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
      description={
        isEditing
          ? 'Modifica la información de la categoría'
          : 'Registra una nueva categoría para un producto'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setImagenUrl('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
    >
      <form className="space-y-4">
        {/* Upload de Imagen */}
        <div className="border-b pb-4">
          <Label>Imagen de la Categoría</Label>
          <ProductoImageUpload
            value={imagenUrl}
            onChange={setImagenUrl}
            onRemove={() => setImagenUrl('')}
            productName={form.watch('nombre')}
          />
        </div>

        {/* Producto */}
        <div className="grid gap-2">
          <Label>Producto Asociado *</Label>
          <Select
            value={form.watch('producto_id').toString()}
            onValueChange={(val) => form.setValue('producto_id', Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un producto" />
            </SelectTrigger>
            <SelectContent>
              {productos.map((prod) => (
                <SelectItem key={prod.id} value={prod.id.toString()}>
                  {prod.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.producto_id && (
            <span className="text-sm text-destructive">
              {form.formState.errors.producto_id.message}
            </span>
          )}
        </div>

        {/* Nombre y Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre de la Categoría *</Label>
            <Input {...form.register('nombre')} placeholder="Ej: Correas en V" />
            {form.formState.errors.nombre && (
              <span className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Slug (URL amigable) *</Label>
            <Input
              {...form.register('slug')}
              placeholder="correas-en-v"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {isEditing ? 'Identificador único en la URL' : 'Se genera automáticamente'}
            </p>
            {form.formState.errors.slug && (
              <span className="text-sm text-destructive">
                {form.formState.errors.slug.message}
              </span>
            )}
          </div>
        </div>

        {/* Descripción Corta y Uso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Descripción Corta</Label>
            <Input {...form.register('descripcion_corta')} placeholder="Resumen breve" />
          </div>
          <div className="grid gap-2">
            <Label>Uso / Aplicación</Label>
            <Input {...form.register('uso')} placeholder="Ej: Industrial, Automotriz" />
          </div>
        </div>

        {/* Descripción Larga */}
        <div className="grid gap-2">
          <Label>Descripción Completa</Label>
          <Textarea {...form.register('descripcion')} rows={4} placeholder="Descripción detallada de la categoría..." />
        </div>

        {/* Orden y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="grid gap-2">
            <Label>Orden de visualización</Label>
            <Input type="number" {...form.register('orden')} />
            <p className="text-xs text-muted-foreground">
              Se autocompleta con el siguiente disponible
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select
              value={form.watch('estado')}
              onValueChange={(val: any) => form.setValue('estado', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </FormShell>
  )
}