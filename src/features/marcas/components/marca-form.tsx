import { FormShell } from '@/components/shared/form-shell'
import { ProductoImageUpload } from '@/components/shared/producto-image-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Marca } from '@/types/marca'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarMarca,
    crearMarca,
    getNextOrdenMarca,
} from '../services/marca.service'

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  logo: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface MarcaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  marcaEditar?: Marca | null
  onSuccess: () => void
}

export function MarcaForm({
  open,
  onOpenChange,
  marcaEditar,
  onSuccess,
}: MarcaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const isEditing = !!marcaEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      slug: '',
      logo: '',
      orden: 0,
      estado: 'activo',
    },
  })

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
        nombre: '',
        slug: '',
        logo: '',
        orden: 0,
        estado: 'activo',
      })
      setLogoUrl('')
      return
    }

    if (open && marcaEditar) {
      setLogoUrl(marcaEditar.logo || '')
      form.reset({
        nombre: marcaEditar.nombre,
        slug: marcaEditar.slug,
        logo: marcaEditar.logo || '',
        orden: marcaEditar.orden,
        estado: marcaEditar.estado === 'eliminado' ? 'activo' : marcaEditar.estado,
      })
    } else if (open && !marcaEditar) {
      // Obtener el siguiente orden disponible automáticamente
      getNextOrdenMarca().then((nextOrden) => {
        form.reset({
          nombre: '',
          slug: '',
          logo: '',
          orden: nextOrden,
          estado: 'activo',
        })
      })
      setLogoUrl('')
    }
  }, [open, marcaEditar, form])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && marcaEditar) {
        await actualizarMarca({
          id: marcaEditar.id,
          nombre: data.nombre,
          slug: data.slug,
          logo: logoUrl,
          orden: data.orden,
          estado: data.estado,
        })
      } else {
        await crearMarca({
          nombre: data.nombre,
          slug: data.slug,
          logo: logoUrl,
          orden: data.orden,
          estado: data.estado,
        })
      }
      form.reset()
      setLogoUrl('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar la marca')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Marca' : 'Nueva Marca'}
      description={
        isEditing
          ? 'Modifica la información de la marca'
          : 'Registra una nueva marca en el sistema'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setLogoUrl('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Marca'}
    >
      <form className="space-y-4">
        {/* Upload de Logo */}
        <div className="border-b pb-4">
          <Label>Logo de la Marca</Label>
          <ProductoImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            onRemove={() => setLogoUrl('')}
            productName={form.watch('nombre')}
          />
        </div>

        {/* Nombre y Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre de la Marca *</Label>
            <Input {...form.register('nombre')} placeholder="Ej: SKF" />
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
              placeholder="skf"
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