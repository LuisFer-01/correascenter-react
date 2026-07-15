import { FormShell } from '@/components/shared/form-shell'
import { SeccionImageUpload } from '@/components/shared/seccion-image-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ContenidoSeccion, TipoSeccion } from '@/types/contenido'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarContenidoSeccion,
    crearContenidoSeccion,
    getEmpresasActivas,
    getNextOrdenContenido,
} from '../services/contenido-seccion.service'

// Schema base sin campos dinámicos
const baseSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  tipo_seccion_id: z.coerce.number().min(1, 'Selecciona un tipo de sección'),
  titulo: z.string().optional(),
  subtitulo: z.string().optional(),
  descripcion: z.string().optional(),
  icono: z.string().optional(),
  imagen: z.string().optional(),
  orden: z.coerce.number().default(0),
  mostrar: z.boolean().default(true),
  estado: z.enum(['activo', 'inactivo']),
})

type BaseFormValues = z.infer<typeof baseSchema>

interface ContenidoSeccionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tiposSeccion: TipoSeccion[]
  contenidoEditar?: ContenidoSeccion | null
  onSuccess: () => void
}

export function ContenidoSeccionForm({
  open,
  onOpenChange,
  tiposSeccion,
  contenidoEditar,
  onSuccess,
}: ContenidoSeccionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const [imagenUrl, setImagenUrl] = useState<string>('')
  const [camposDinamicos, setCamposDinamicos] = useState<Record<string, string>>({})
  const isEditing = !!contenidoEditar

  const form = useForm<BaseFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      empresa_id: 0,
      tipo_seccion_id: 0,
      titulo: '',
      subtitulo: '',
      descripcion: '',
      icono: '',
      imagen: '',
      orden: 0,
      mostrar: true,
      estado: 'activo',
    },
  })

  useEffect(() => {
    if (open && !empresasLoaded) {
      getEmpresasActivas().then((data) => {
        setEmpresas(data)
        setEmpresasLoaded(true)
      })
    }
  }, [open, empresasLoaded])

  // Observar tipo de sección seleccionado para obtener campos dinámicos
  const tipoSeccionIdWatch = form.watch('tipo_seccion_id')
  const tipoSeleccionado = tiposSeccion.find(t => t.id === tipoSeccionIdWatch)

  useEffect(() => {
    if (!open) {
      form.reset({
        empresa_id: 0,
        tipo_seccion_id: 0,
        titulo: '',
        subtitulo: '',
        descripcion: '',
        icono: '',
        imagen: '',
        orden: 0,
        mostrar: true,
        estado: 'activo',
      })
      setImagenUrl('')
      setCamposDinamicos({})
      return
    }

    if (open && contenidoEditar) {
      setImagenUrl(contenidoEditar.imagen || '')
      form.reset({
        empresa_id: contenidoEditar.empresa_id,
        tipo_seccion_id: contenidoEditar.tipo_seccion_id,
        titulo: contenidoEditar.titulo || '',
        subtitulo: contenidoEditar.subtitulo || '',
        descripcion: contenidoEditar.descripcion || '',
        icono: contenidoEditar.icono || '',
        imagen: contenidoEditar.imagen || '',
        orden: contenidoEditar.orden,
        mostrar: contenidoEditar.mostrar,
        estado: contenidoEditar.estado === 'eliminado' ? 'activo' : contenidoEditar.estado,
      })
      // Cargar metadata existente
      if (contenidoEditar.metadata) {
        const campos: Record<string, string> = {}
        Object.entries(contenidoEditar.metadata).forEach(([key, value]) => {
          campos[key] = typeof value === 'string' ? value : String(value)
        })
        setCamposDinamicos(campos)
      }
    } else if (open && empresas.length > 0 && !contenidoEditar) {
      getNextOrdenContenido(tiposSeccion[0]?.id || 0).then((nextOrden) => {
        form.reset({
          empresa_id: empresas[0]?.id || 0,
          tipo_seccion_id: tiposSeccion[0]?.id || 0,
          titulo: '',
          subtitulo: '',
          descripcion: '',
          icono: '',
          imagen: '',
          orden: nextOrden,
          mostrar: true,
          estado: 'activo',
        })
      })
      setImagenUrl('')
      setCamposDinamicos({})
    }
  }, [open, contenidoEditar, form, empresas, tiposSeccion])

  const handleCampoDinamicoChange = (campo: string, valor: string) => {
    setCamposDinamicos(prev => ({ ...prev, [campo]: valor }))
  }

  const onSubmit = async (data: BaseFormValues) => {
    setIsLoading(true)
    try {
      // Construir metadata desde campos dinámicos
      const metadata: Record<string, any> = {}
      Object.entries(camposDinamicos).forEach(([key, value]) => {
        if (value.trim()) {
          metadata[key] = value
        }
      })

      if (isEditing && contenidoEditar) {
        await actualizarContenidoSeccion({
          id: contenidoEditar.id,
          empresa_id: data.empresa_id,
          tipo_seccion_id: data.tipo_seccion_id,
          titulo: data.titulo,
          subtitulo: data.subtitulo,
          descripcion: data.descripcion,
          icono: data.icono,
          imagen: imagenUrl,
          metadata,
          orden: data.orden,
          mostrar: data.mostrar,
          estado: data.estado,
        })
      } else {
        await crearContenidoSeccion({
          empresa_id: data.empresa_id,
          tipo_seccion_id: data.tipo_seccion_id,
          titulo: data.titulo,
          subtitulo: data.subtitulo,
          descripcion: data.descripcion,
          icono: data.icono,
          imagen: imagenUrl,
          metadata,
          orden: data.orden,
          mostrar: data.mostrar,
          estado: data.estado,
        })
      }
      form.reset()
      setImagenUrl('')
      setCamposDinamicos({})
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
          ? 'Modifica el contenido de la sección'
          : 'Agrega contenido a una sección del sitio'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setImagenUrl('')
        setCamposDinamicos({})
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
        </div>

        {/* Tipo de Sección */}
        <div className="grid gap-2">
          <Label>Tipo de Sección *</Label>
          <Select
            value={form.watch('tipo_seccion_id').toString()}
            onValueChange={(val) => form.setValue('tipo_seccion_id', Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposSeccion.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                  {tipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tipoSeleccionado && (
            <p className="text-xs text-muted-foreground">
              Campos dinámicos: {tipoSeleccionado.campos_metadata.join(', ') || 'ninguno'}
            </p>
          )}
        </div>

        {/* Upload de Imagen */}
        <div className="border-b pb-4">
          <Label>Imagen</Label>
          <SeccionImageUpload
            value={imagenUrl}
            onChange={setImagenUrl}
            onRemove={() => setImagenUrl('')}
            label="Sección"
          />
        </div>

        {/* Título y Subtítulo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input {...form.register('titulo')} placeholder="Título principal" />
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

        {/* Icono */}
        <div className="grid gap-2">
          <Label>Icono (Lucide)</Label>
          <Input {...form.register('icono')} placeholder="Ej: CheckCircle2, Award" className="font-mono text-sm" />
        </div>

        {/* Campos Dinámicos según tipo de sección */}
        {tipoSeleccionado && tipoSeleccionado.campos_metadata.length > 0 && (
          <div className="border rounded-md p-4 space-y-3">
            <Label className="text-sm font-semibold">Campos Dinámicos</Label>
            <p className="text-xs text-muted-foreground">
              Completa los campos específicos para este tipo de sección
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tipoSeleccionado.campos_metadata.map((campo) => (
                <div key={campo} className="grid gap-1">
                  <Label className="text-xs font-mono">{campo}</Label>
                  <Input
                    value={camposDinamicos[campo] || ''}
                    onChange={(e) => handleCampoDinamicoChange(campo, e.target.value)}
                    placeholder={`Valor de ${campo}`}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mostrar, Orden y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="mostrar"
              checked={form.watch('mostrar')}
              onCheckedChange={(checked) => form.setValue('mostrar', checked === true)}
            />
            <Label htmlFor="mostrar" className="cursor-pointer text-sm">
              Mostrar en sitio
            </Label>
          </div>
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