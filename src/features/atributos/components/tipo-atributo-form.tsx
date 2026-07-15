import { FormShell } from '@/components/shared/form-shell'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { TipoAtributo } from '@/types/tipo-atributo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarTipoAtributo,
    crearTipoAtributo,
    getNextOrdenTipoAtributo,
} from '../services/tipo-atributo.service'

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, guiones y guiones bajos'),
  descripcion: z.string().optional(),
  permite_descripcion: z.boolean().default(false),
  permite_valor_numerico: z.boolean().default(false),
  permite_unidad_medida: z.boolean().default(false),
  icono: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface TipoAtributoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoEditar?: TipoAtributo | null
  onSuccess: () => void
}

export function TipoAtributoForm({
  open,
  onOpenChange,
  tipoEditar,
  onSuccess,
}: TipoAtributoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!tipoEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      slug: '',
      descripcion: '',
      permite_descripcion: false,
      permite_valor_numerico: false,
      permite_unidad_medida: false,
      icono: '',
      orden: 0,
      estado: 'activo',
    },
  })

  // Auto-generar slug desde el nombre
  const nombreWatch = form.watch('nombre')
  useEffect(() => {
    if (!isEditing && nombreWatch) {
      const slug = nombreWatch
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      form.setValue('slug', slug)
    }
  }, [nombreWatch, isEditing, form])

  // Resetear formulario
  useEffect(() => {
    if (!open) {
      form.reset({
        nombre: '',
        slug: '',
        descripcion: '',
        permite_descripcion: false,
        permite_valor_numerico: false,
        permite_unidad_medida: false,
        icono: '',
        orden: 0,
        estado: 'activo',
      })
      return
    }

    if (open && tipoEditar) {
      form.reset({
        nombre: tipoEditar.nombre,
        slug: tipoEditar.slug,
        descripcion: tipoEditar.descripcion || '',
        permite_descripcion: tipoEditar.permite_descripcion,
        permite_valor_numerico: tipoEditar.permite_valor_numerico,
        permite_unidad_medida: tipoEditar.permite_unidad_medida,
        icono: tipoEditar.icono || '',
        orden: tipoEditar.orden,
        estado: tipoEditar.estado === 'eliminado' ? 'activo' : tipoEditar.estado,
      })
    } else if (open && !tipoEditar) {
      getNextOrdenTipoAtributo().then((nextOrden) => {
        form.reset({
          nombre: '',
          slug: '',
          descripcion: '',
          permite_descripcion: false,
          permite_valor_numerico: false,
          permite_unidad_medida: false,
          icono: '',
          orden: nextOrden,
          estado: 'activo',
        })
      })
    }
  }, [open, tipoEditar, form])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && tipoEditar) {
        await actualizarTipoAtributo({
          id: tipoEditar.id,
          ...data,
        })
      } else {
        await crearTipoAtributo(data)
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el tipo de atributo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Tipo de Atributo' : 'Nuevo Tipo de Atributo'}
      description={
        isEditing
          ? 'Modifica la configuración del tipo de atributo'
          : 'Define un nuevo tipo de atributo técnico (ej: Características, Medidas)'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Tipo'}
    >
      <form className="space-y-4">
        {/* Nombre y Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre del Tipo *</Label>
            <Input {...form.register('nombre')} placeholder="Ej: Características Técnicas" />
            {form.formState.errors.nombre && (
              <span className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Slug (identificador) *</Label>
            <Input
              {...form.register('slug')}
              placeholder="caracteristicas_tecnicas"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {isEditing ? 'Identificador único' : 'Se genera automáticamente'}
            </p>
            {form.formState.errors.slug && (
              <span className="text-sm text-destructive">
                {form.formState.errors.slug.message}
              </span>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div className="grid gap-2">
          <Label>Descripción</Label>
          <Textarea {...form.register('descripcion')} rows={3} placeholder="Describe este tipo de atributo..." />
        </div>

        {/* Icono */}
        <div className="grid gap-2">
          <Label>Icono (nombre de Lucide)</Label>
          <Input {...form.register('icono')} placeholder="Ej: Wrench, Ruler, ListChecks" className="font-mono text-sm" />
          <p className="text-xs text-muted-foreground">
            Nombre del icono de Lucide React (opcional)
          </p>
        </div>

        {/* Opciones de comportamiento */}
        <div className="border rounded-md p-4 space-y-3">
          <Label className="text-sm font-semibold">Configuración del Tipo</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permite_descripcion"
                checked={form.watch('permite_descripcion')}
                onCheckedChange={(checked) => form.setValue('permite_descripcion', checked === true)}
              />
              <Label htmlFor="permite_descripcion" className="text-sm font-normal cursor-pointer">
                Permite descripción
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permite_valor_numerico"
                checked={form.watch('permite_valor_numerico')}
                onCheckedChange={(checked) => form.setValue('permite_valor_numerico', checked === true)}
              />
              <Label htmlFor="permite_valor_numerico" className="text-sm font-normal cursor-pointer">
                Permite valor numérico
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permite_unidad_medida"
                checked={form.watch('permite_unidad_medida')}
                onCheckedChange={(checked) => form.setValue('permite_unidad_medida', checked === true)}
              />
              <Label htmlFor="permite_unidad_medida" className="text-sm font-normal cursor-pointer">
                Permite unidad de medida
              </Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Estas opciones definen qué campos estarán disponibles al crear atributos de este tipo.
          </p>
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