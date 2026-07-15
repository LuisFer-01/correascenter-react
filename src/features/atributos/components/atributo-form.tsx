import { FormShell } from '@/components/shared/form-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { AtributoTecnico } from '@/types/atributo'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarAtributo,
    crearAtributo,
    getNextOrdenAtributo,
    getTiposAtributoActivos,
} from '../services/atributo.service'

const formSchema = z.object({
  tipo_atributo_id: z.coerce.number().min(1, 'Selecciona un tipo de atributo'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  valor_numerico: z.coerce.number().optional(),
  unidad_medida: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface AtributoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atributoEditar?: AtributoTecnico | null
  onSuccess: () => void
}

export function AtributoForm({
  open,
  onOpenChange,
  atributoEditar,
  onSuccess,
}: AtributoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [tipos, setTipos] = useState<any[]>([])
  const [tiposLoaded, setTiposLoaded] = useState(false)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<any>(null)
  const isEditing = !!atributoEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_atributo_id: 0,
      nombre: '',
      descripcion: '',
      valor_numerico: undefined,
      unidad_medida: '',
      orden: 0,
      estado: 'activo',
    },
  })

  // Cargar tipos de atributo
  useEffect(() => {
    if (open && !tiposLoaded) {
      getTiposAtributoActivos().then((data) => {
        setTipos(data)
        setTiposLoaded(true)
      })
    }
  }, [open, tiposLoaded])

  // Actualizar tipo seleccionado cuando cambia
  const tipoIdWatch = form.watch('tipo_atributo_id')
  useEffect(() => {
    if (tipoIdWatch > 0) {
      const tipo = tipos.find((t) => t.id === tipoIdWatch)
      setTipoSeleccionado(tipo || null)
    } else {
      setTipoSeleccionado(null)
    }
  }, [tipoIdWatch, tipos])

  // Resetear formulario
  useEffect(() => {
    if (!open) {
      form.reset({
        tipo_atributo_id: 0,
        nombre: '',
        descripcion: '',
        valor_numerico: undefined,
        unidad_medida: '',
        orden: 0,
        estado: 'activo',
      })
      setTipoSeleccionado(null)
      return
    }

    if (open && atributoEditar) {
      form.reset({
        tipo_atributo_id: atributoEditar.tipo_atributo_id,
        nombre: atributoEditar.nombre,
        descripcion: atributoEditar.descripcion || '',
        valor_numerico: atributoEditar.valor_numerico || undefined,
        unidad_medida: atributoEditar.unidad_medida || '',
        orden: atributoEditar.orden,
        estado: atributoEditar.estado === 'eliminado' ? 'activo' : atributoEditar.estado,
      })
      const tipo = tipos.find((t) => t.id === atributoEditar.tipo_atributo_id)
      setTipoSeleccionado(tipo || null)
    } else if (open && tipos.length > 0 && !atributoEditar) {
      getNextOrdenAtributo().then((nextOrden) => {
        form.reset({
          tipo_atributo_id: tipos[0]?.id || 0,
          nombre: '',
          descripcion: '',
          valor_numerico: undefined,
          unidad_medida: '',
          orden: nextOrden,
          estado: 'activo',
        })
        setTipoSeleccionado(tipos[0] || null)
      })
    }
  }, [open, atributoEditar, form, tipos])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && atributoEditar) {
        await actualizarAtributo({
          id: atributoEditar.id,
          ...data,
        })
      } else {
        await crearAtributo(data)
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el atributo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Atributo Técnico' : 'Nuevo Atributo Técnico'}
      description={
        isEditing
          ? 'Modifica la información del atributo'
          : 'Registra un nuevo atributo técnico'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setTipoSeleccionado(null)
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Atributo'}
    >
      <form className="space-y-4">
        {/* Tipo de Atributo */}
        <div className="grid gap-2">
          <Label>Tipo de Atributo *</Label>
          <Select
            value={form.watch('tipo_atributo_id').toString()}
            onValueChange={(val) => form.setValue('tipo_atributo_id', Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                  {tipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.tipo_atributo_id && (
            <span className="text-sm text-destructive">
              {form.formState.errors.tipo_atributo_id.message}
            </span>
          )}
          {tipoSeleccionado && (
            <p className="text-xs text-muted-foreground">
              Este tipo permite: 
              {tipoSeleccionado.permite_descripcion && ' Descripción'}
              {tipoSeleccionado.permite_valor_numerico && ' Valor numérico'}
              {tipoSeleccionado.permite_unidad_medida && ' Unidad de medida'}
            </p>
          )}
        </div>

        {/* Nombre */}
        <div className="grid gap-2">
          <Label>Nombre del Atributo *</Label>
          <Input {...form.register('nombre')} placeholder="Ej: Diámetro exterior" />
          {form.formState.errors.nombre && (
            <span className="text-sm text-destructive">
              {form.formState.errors.nombre.message}
            </span>
          )}
        </div>

        {/* Descripción (condicional) */}
        {tipoSeleccionado?.permite_descripcion && (
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Textarea {...form.register('descripcion')} rows={3} placeholder="Descripción del atributo..." />
          </div>
        )}

        {/* Valor Numérico y Unidad de Medida (condicionales) */}
        {(tipoSeleccionado?.permite_valor_numerico || tipoSeleccionado?.permite_unidad_medida) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tipoSeleccionado?.permite_valor_numerico && (
              <div className="grid gap-2">
                <Label>Valor Numérico</Label>
                <Input
                  type="number"
                  step="any"
                  {...form.register('valor_numerico', { valueAsNumber: true })}
                  placeholder="Ej: 150.5"
                />
              </div>
            )}
            {tipoSeleccionado?.permite_unidad_medida && (
              <div className="grid gap-2">
                <Label>Unidad de Medida</Label>
                <Input {...form.register('unidad_medida')} placeholder="Ej: mm, kg, m²" />
              </div>
            )}
          </div>
        )}

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