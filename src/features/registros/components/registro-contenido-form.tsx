import { FormShell } from '@/components/shared/form-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Registro, RegistroContenido } from '@/types/registro'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarRegistroContenido,
    crearRegistroContenido,
    getEmpresasActivas,
} from '../services/registro.service'

const formSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  registro_id: z.coerce.number().min(1, 'Selecciona un tipo de registro'),
  titulo: z.string().optional(),
  subtitulo: z.string().optional(),
  descripcion: z.string().optional(),
  icono: z.string().optional(),
  stats: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface RegistroContenidoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registros: Registro[]
  contenidoEditar?: RegistroContenido | null
  onSuccess: () => void
}

export function RegistroContenidoForm({
  open,
  onOpenChange,
  registros,
  contenidoEditar,
  onSuccess,
}: RegistroContenidoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const isEditing = !!contenidoEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: 0,
      registro_id: 0,
      titulo: '',
      subtitulo: '',
      descripcion: '',
      icono: '',
      stats: '',
      orden: 0,
      estado: 'activo',
    },
  })

  // Cargar empresas solo una vez
  useEffect(() => {
    if (open && !empresasLoaded) {
      getEmpresasActivas().then((data) => {
        setEmpresas(data)
        setEmpresasLoaded(true)
      })
    }
  }, [open, empresasLoaded])

  // Resetear formulario
  useEffect(() => {
    if (!open) {
      form.reset({
        empresa_id: 0,
        registro_id: 0,
        titulo: '',
        subtitulo: '',
        descripcion: '',
        icono: '',
        stats: '',
        orden: 0,
        estado: 'activo',
      })
      return
    }

    if (open && contenidoEditar) {
      form.reset({
        empresa_id: contenidoEditar.empresa_id,
        registro_id: contenidoEditar.registro_id,
        titulo: contenidoEditar.titulo || '',
        subtitulo: contenidoEditar.subtitulo || '',
        descripcion: contenidoEditar.descripcion || '',
        icono: contenidoEditar.icono || '',
        stats: contenidoEditar.stats || '',
        orden: contenidoEditar.orden,
        estado: contenidoEditar.estado === 'eliminado' ? 'activo' : contenidoEditar.estado,
      })
    } else if (open && empresas.length > 0 && !contenidoEditar) {
      form.reset({
        empresa_id: empresas[0]?.id || 0,
        registro_id: registros[0]?.id || 0,
        titulo: '',
        subtitulo: '',
        descripcion: '',
        icono: '',
        stats: '',
        orden: 0,
        estado: 'activo',
      })
    }
  }, [open, contenidoEditar, form, empresas, registros])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && contenidoEditar) {
        await actualizarRegistroContenido({ id: contenidoEditar.id, ...data })
      } else {
        await crearRegistroContenido(data)
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el contenido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Contenido' : 'Nuevo Contenido'}
      description={
        isEditing
          ? 'Modifica el contenido de esta sección'
          : 'Agrega contenido a una sección del About'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Contenido'}
    >
      <form className="space-y-4">
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

        {/* Tipo de Registro */}
        <div className="grid gap-2">
          <Label>Tipo de Sección *</Label>
          <Select
            value={form.watch('registro_id').toString()}
            onValueChange={(val) => form.setValue('registro_id', Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              {registros.map((reg) => (
                <SelectItem key={reg.id} value={reg.id.toString()}>
                  {reg.nombre} ({reg.identificador})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.registro_id && (
            <span className="text-sm text-destructive">
              {form.formState.errors.registro_id.message}
            </span>
          )}
        </div>

        {/* Título y Subtítulo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input {...form.register('titulo')} placeholder="Título de la sección" />
          </div>
          <div className="grid gap-2">
            <Label>Subtítulo</Label>
            <Input {...form.register('subtitulo')} placeholder="Subtítulo" />
          </div>
        </div>

        {/* Descripción */}
        <div className="grid gap-2">
          <Label>Descripción</Label>
          <Textarea {...form.register('descripcion')} rows={3} placeholder="Descripción del contenido..." />
        </div>

        {/* Icono y Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Icono (nombre/clase)</Label>
            <Input {...form.register('icono')} placeholder="Ej: CheckCircle2" />
          </div>
          <div className="grid gap-2">
            <Label>Stats (texto destacado)</Label>
            <Input {...form.register('stats')} placeholder="Ej: +25 Años" />
          </div>
        </div>

        {/* Orden y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="grid gap-2">
            <Label>Orden de visualización</Label>
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