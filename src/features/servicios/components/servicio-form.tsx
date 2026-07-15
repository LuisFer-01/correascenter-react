import { FormShell } from '@/components/shared/form-shell'
import { ServicioImageUpload } from '@/components/shared/servicio-image-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Servicio } from '@/types/servicio'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Factory } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarServicio,
    crearServicio,
    getEmpresasActivas,
    getIndustriasActivas,
    getNextOrdenServicio,
} from '../services/servicio.service'

const formSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  imagen: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
  industria_ids: z.array(z.number()).default([]),
})

type FormValues = z.infer<typeof formSchema>

interface ServicioFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servicioEditar?: Servicio | null
  onSuccess: () => void
}

export function ServicioForm({
  open,
  onOpenChange,
  servicioEditar,
  onSuccess,
}: ServicioFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [industrias, setIndustrias] = useState<{ id: number; nombre: string; slug: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const [industriasLoaded, setIndustriasLoaded] = useState(false)
  const [imagenUrl, setImagenUrl] = useState<string>('')
  const [industriasOpen, setIndustriasOpen] = useState(false)
  const isEditing = !!servicioEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: 0,
      nombre: '',
      descripcion: '',
      imagen: '',
      orden: 0,
      estado: 'activo',
      industria_ids: [],
    },
  })

  useEffect(() => {
    if (open && !empresasLoaded) {
      getEmpresasActivas().then((data) => {
        setEmpresas(data)
        setEmpresasLoaded(true)
      })
    }
    if (open && !industriasLoaded) {
      getIndustriasActivas().then((data) => {
        setIndustrias(data)
        setIndustriasLoaded(true)
      })
    }
  }, [open, empresasLoaded, industriasLoaded])

  useEffect(() => {
    if (!open) {
      form.reset({
        empresa_id: 0,
        nombre: '',
        descripcion: '',
        imagen: '',
        orden: 0,
        estado: 'activo',
        industria_ids: [],
      })
      setImagenUrl('')
      setIndustriasOpen(false)
      return
    }

    if (open && servicioEditar) {
      setImagenUrl(servicioEditar.imagen || '')
      const industriaIds = servicioEditar.industrias_asignadas?.map(a => a.industria_id) || []
      
      form.reset({
        empresa_id: servicioEditar.empresa_id,
        nombre: servicioEditar.nombre,
        descripcion: servicioEditar.descripcion || '',
        imagen: servicioEditar.imagen || '',
        orden: servicioEditar.orden,
        estado: servicioEditar.estado === 'eliminado' ? 'activo' : servicioEditar.estado,
        industria_ids: industriaIds,
      })
      setIndustriasOpen(industriaIds.length > 0)
    } else if (open && empresas.length > 0 && !servicioEditar) {
      getNextOrdenServicio().then((nextOrden) => {
        form.reset({
          empresa_id: empresas[0]?.id || 0,
          nombre: '',
          descripcion: '',
          imagen: '',
          orden: nextOrden,
          estado: 'activo',
          industria_ids: [],
        })
      })
      setImagenUrl('')
    }
  }, [open, servicioEditar, form, empresas])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && servicioEditar) {
        await actualizarServicio({
          id: servicioEditar.id,
          empresa_id: data.empresa_id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
          industria_ids: data.industria_ids,
        })
      } else {
        await crearServicio({
          empresa_id: data.empresa_id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
          industria_ids: data.industria_ids,
        })
      }
      form.reset()
      setImagenUrl('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el servicio')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleIndustria = (industriaId: number) => {
    const current = form.getValues('industria_ids')
    if (current.includes(industriaId)) {
      form.setValue('industria_ids', current.filter(id => id !== industriaId))
    } else {
      form.setValue('industria_ids', [...current, industriaId])
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
      description={
        isEditing
          ? 'Modifica la información del servicio'
          : 'Registra un nuevo servicio para la empresa'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setImagenUrl('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Servicio'}
    >
      <form className="space-y-4">
        {/* Upload de Imagen */}
        <div className="border-b pb-4">
          <Label>Imagen del Servicio</Label>
          <ServicioImageUpload
            value={imagenUrl}
            onChange={setImagenUrl}
            onRemove={() => setImagenUrl('')}
            serviceName={form.watch('nombre')}
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

        {/* Nombre */}
        <div className="grid gap-2">
          <Label>Nombre del Servicio *</Label>
          <Input {...form.register('nombre')} placeholder="Ej: Fabricación de Sellos SKF" />
          {form.formState.errors.nombre && (
            <span className="text-sm text-destructive">
              {form.formState.errors.nombre.message}
            </span>
          )}
        </div>

        {/* Descripción */}
        <div className="grid gap-2">
          <Label>Descripción</Label>
          <Textarea {...form.register('descripcion')} rows={4} placeholder="Describe el servicio..." />
        </div>

        {/* Industrias Asignadas - Expandible */}
        <Collapsible open={industriasOpen} onOpenChange={setIndustriasOpen} className="border rounded-lg">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium cursor-pointer">
                  Industrias Asignadas ({form.watch('industria_ids').length})
                </Label>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${industriasOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {industrias.map((industria) => (
                <div key={industria.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`industria-${industria.id}`}
                    checked={form.watch('industria_ids').includes(industria.id)}
                    onCheckedChange={() => toggleIndustria(industria.id)}
                  />
                  <Label htmlFor={`industria-${industria.id}`} className="text-sm font-normal cursor-pointer flex-1">
                    {industria.nombre}
                  </Label>
                </div>
              ))}
              {industrias.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No hay industrias disponibles</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

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