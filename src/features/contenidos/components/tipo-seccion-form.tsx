import { FormShell } from '@/components/shared/form-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { TipoSeccion } from '@/types/contenido'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarTipoSeccion,
    crearTipoSeccion,
    getNextOrdenTipoSeccion,
} from '../services/tipo-seccion.service'

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  descripcion: z.string().optional(),
  campos_metadata: z.array(z.string()).default([]),
  icono: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface TipoSeccionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoEditar?: TipoSeccion | null
  onSuccess: () => void
}

export function TipoSeccionForm({
  open,
  onOpenChange,
  tipoEditar,
  onSuccess,
}: TipoSeccionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [nuevoCampo, setNuevoCampo] = useState('')
  const isEditing = !!tipoEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      slug: '',
      descripcion: '',
      campos_metadata: [],
      icono: '',
      orden: 0,
      estado: 'activo',
    },
  })

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

  useEffect(() => {
    if (!open) {
      form.reset({
        nombre: '',
        slug: '',
        descripcion: '',
        campos_metadata: [],
        icono: '',
        orden: 0,
        estado: 'activo',
      })
      setNuevoCampo('')
      return
    }

    if (open && tipoEditar) {
      form.reset({
        nombre: tipoEditar.nombre,
        slug: tipoEditar.slug,
        descripcion: tipoEditar.descripcion || '',
        campos_metadata: tipoEditar.campos_metadata || [],
        icono: tipoEditar.icono || '',
        orden: tipoEditar.orden,
        estado: tipoEditar.estado === 'eliminado' ? 'activo' : tipoEditar.estado,
      })
    } else if (open && !tipoEditar) {
      getNextOrdenTipoSeccion().then((nextOrden) => {
        form.reset({
          nombre: '',
          slug: '',
          descripcion: '',
          campos_metadata: [],
          icono: '',
          orden: nextOrden,
          estado: 'activo',
        })
      })
    }
  }, [open, tipoEditar, form])

  const agregarCampo = () => {
    if (!nuevoCampo.trim()) return
    const current = form.getValues('campos_metadata')
    if (current.includes(nuevoCampo.trim())) {
      alert('Este campo ya existe')
      return
    }
    form.setValue('campos_metadata', [...current, nuevoCampo.trim()])
    setNuevoCampo('')
  }

  const eliminarCampo = (campo: string) => {
    const current = form.getValues('campos_metadata')
    form.setValue('campos_metadata', current.filter(c => c !== campo))
  }

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && tipoEditar) {
        await actualizarTipoSeccion({
          id: tipoEditar.id,
          ...data,
        })
      } else {
        await crearTipoSeccion(data)
      }
      form.reset()
      setNuevoCampo('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el tipo de sección')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Tipo de Sección' : 'Nuevo Tipo de Sección'}
      description={
        isEditing
          ? 'Modifica el tipo de sección'
          : 'Define un nuevo tipo de sección (Hero, Diferencial, etc.)'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setNuevoCampo('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Tipo'}
    >
      <form className="space-y-4">
        {/* Nombre y Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre *</Label>
            <Input {...form.register('nombre')} placeholder="Ej: Hero, Diferencial" />
            {form.formState.errors.nombre && (
              <span className="text-sm text-destructive">{form.formState.errors.nombre.message}</span>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Slug *</Label>
            <Input
              {...form.register('slug')}
              placeholder="hero"
              className="font-mono text-sm"
            />
            {form.formState.errors.slug && (
              <span className="text-sm text-destructive">{form.formState.errors.slug.message}</span>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div className="grid gap-2">
          <Label>Descripción</Label>
          <Textarea {...form.register('descripcion')} rows={2} placeholder="Describe este tipo de sección..." />
        </div>

        {/* Icono */}
        <div className="grid gap-2">
          <Label>Icono (Lucide)</Label>
          <Input {...form.register('icono')} placeholder="Ej: Image, Award, CheckCircle2" className="font-mono text-sm" />
        </div>

        {/* Campos Metadata Dinámicos */}
        <div className="border rounded-md p-4 space-y-3">
          <Label className="text-sm font-semibold">Campos Dinámicos (metadata)</Label>
          <p className="text-xs text-muted-foreground">
            Define los campos JSONB que tendrá el contenido de este tipo. Ej: badge_text, cta_primary_text, subtitulo, stats
          </p>
          
          <div className="flex gap-2">
            <Input
              value={nuevoCampo}
              onChange={(e) => setNuevoCampo(e.target.value)}
              placeholder="nombre_del_campo"
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregarCampo()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={agregarCampo}>
              Agregar
            </Button>
          </div>

          {form.watch('campos_metadata').length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.watch('campos_metadata').map((campo) => (
                <Badge key={campo} variant="secondary" className="font-mono text-xs gap-1">
                  {campo}
                  <button
                    type="button"
                    onClick={() => eliminarCampo(campo)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Orden y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="grid gap-2">
            <Label>Orden</Label>
            <Input type="number" {...form.register('orden')} />
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