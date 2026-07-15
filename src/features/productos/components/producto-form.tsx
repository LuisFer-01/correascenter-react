import { FormShell } from '@/components/shared/form-shell'
import { ProductoImageUpload } from '@/components/shared/producto-image-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Producto } from '@/types/producto'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarProducto,
    crearProducto,
    getEmpresasActivas,
    getMarcasActivas,
    getNextOrden,
} from '../services/producto.service'

const formSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  imagen: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
  marca_ids: z.array(z.number()).default([]),
})

type FormValues = z.infer<typeof formSchema>

interface ProductoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productoEditar?: Producto | null
  onSuccess: () => void
}

export function ProductoForm({
  open,
  onOpenChange,
  productoEditar,
  onSuccess,
}: ProductoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const [marcasDisponibles, setMarcasDisponibles] = useState<{ id: number; nombre: string; slug: string }[]>([])
  const [marcasLoaded, setMarcasLoaded] = useState(false)
  const [imagenUrl, setImagenUrl] = useState<string>('')
  const isEditing = !!productoEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: 0,
      nombre: '',
      slug: '',
      imagen: '',
      orden: 0,
      estado: 'activo',
      marca_ids: [],
    },
  })

  // Cargar empresas y marcas solo una vez
  useEffect(() => {
    if (open && !empresasLoaded) {
      getEmpresasActivas().then((data) => {
        setEmpresas(data)
        setEmpresasLoaded(true)
      })
    }
    if (open && !marcasLoaded) {
      getMarcasActivas().then((data) => {
        setMarcasDisponibles(data)
        setMarcasLoaded(true)
      })
    }
  }, [open, empresasLoaded, marcasLoaded])

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
        empresa_id: 0,
        nombre: '',
        slug: '',
        imagen: '',
        orden: 0,
        estado: 'activo',
        marca_ids: [],
      })
      setImagenUrl('')
      return
    }

    if (open && productoEditar) {
      setImagenUrl(productoEditar.imagen || '')
      form.reset({
        empresa_id: productoEditar.empresa_id,
        nombre: productoEditar.nombre,
        slug: productoEditar.slug,
        imagen: productoEditar.imagen || '',
        orden: productoEditar.orden,
        estado: productoEditar.estado === 'eliminado' ? 'activo' : productoEditar.estado,
        marca_ids: productoEditar.marcas?.map((m) => m.id) || [],
      })
    } else if (open && empresas.length > 0 && !productoEditar) {
      getNextOrden().then((nextOrden) => {
        form.reset({
          empresa_id: empresas[0]?.id || 0,
          nombre: '',
          slug: '',
          imagen: '',
          orden: nextOrden,
          estado: 'activo',
          marca_ids: [],
        })
      })
      setImagenUrl('')
    }
  }, [open, productoEditar, form, empresas])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && productoEditar) {
        await actualizarProducto({
          id: productoEditar.id,
          empresa_id: data.empresa_id,
          nombre: data.nombre,
          slug: data.slug,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
          marca_ids: data.marca_ids,
        })
      } else {
        await crearProducto({
          empresa_id: data.empresa_id,
          nombre: data.nombre,
          slug: data.slug,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
          marca_ids: data.marca_ids,
        })
      }
      form.reset()
      setImagenUrl('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el producto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      description={
        isEditing
          ? 'Modifica la información del producto'
          : 'Registra un nuevo producto en el catálogo'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setImagenUrl('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Producto'}
    >
      <form className="space-y-4">
        {/* Upload de Imagen */}
        <div className="border-b pb-4">
          <Label>Imagen del Producto</Label>
          <ProductoImageUpload
            value={imagenUrl}
            onChange={setImagenUrl}
            onRemove={() => setImagenUrl('')}
            productName={form.watch('nombre')}
          />
        </div>

        {/* Empresa */}
        <div className="grid gap-2">
          <Label>Empresa *</Label>
          <Select
            value={form.watch('empresa_id').toString()}
            onValueChange={(val) => form.setValue('empresa_id', Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((emp) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.empresa_id && (
            <span className="text-sm text-destructive">
              {form.formState.errors.empresa_id.message}
            </span>
          )}
        </div>

        {/* Nombre y Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre del Producto *</Label>
            <Input {...form.register('nombre')} placeholder="Ej: Correa en V A-50" />
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
              placeholder="correa-en-v-a-50"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {isEditing 
                ? 'Identificador único en la URL' 
                : 'Se genera automáticamente desde el nombre'}
            </p>
            {form.formState.errors.slug && (
              <span className="text-sm text-destructive">
                {form.formState.errors.slug.message}
              </span>
            )}
          </div>
        </div>

        {/* Marcas Asociadas */}
        <div className="grid gap-2">
          <Label>Marcas Asociadas</Label>
          <div className="space-y-2 border rounded-md p-3 bg-muted/20 max-h-40 overflow-y-auto">
            {marcasDisponibles.map((marca) => (
              <div key={marca.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`marca-${marca.id}`}
                  checked={form.watch('marca_ids').includes(marca.id)}
                  onCheckedChange={(checked) => {
                    const current = form.getValues('marca_ids')
                    if (checked) {
                      form.setValue('marca_ids', [...current, marca.id])
                    } else {
                      form.setValue('marca_ids', current.filter((id) => id !== marca.id))
                    }
                  }}
                />
                <Label htmlFor={`marca-${marca.id}`} className="text-sm font-normal cursor-pointer flex-1">
                  {marca.nombre}
                </Label>
              </div>
            ))}
            {marcasDisponibles.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay marcas activas disponibles.</p>
            )}
          </div>
        </div>

        {/* Orden y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="grid gap-2">
            <Label>Orden de visualización</Label>
            <Input type="number" {...form.register('orden')} />
            <p className="text-xs text-muted-foreground">
              Los productos se muestran en orden ascendente
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