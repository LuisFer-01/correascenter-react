import { FormShell } from '@/components/shared/form-shell'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Sucursal } from '@/types/sucursal'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { actualizarSucursal, crearSucursal, getEmpresasActivas } from '../services/sucursal.service'

// Función auxiliar para extraer coordenadas del enlace de Google Maps
const extractCoordinatesFromMapUrl = (url: string) => {
  // Busca !3d seguido de números (latitud) y !2d seguido de números (longitud)
  const latMatch = url.match(/!3d(-?\d+\.\d+)/)
  const lngMatch = url.match(/!2d(-?\d+\.\d+)/)
  
  if (latMatch && lngMatch) {
    return {
      latitud: parseFloat(latMatch[1]),
      longitud: parseFloat(lngMatch[1]),
    }
  }
  return null
}

const formSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  direccion: z.string().min(5, 'La dirección es requerida'),
  telefono: z.string().min(6, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  horarios: z.string().optional(),
  mapa_incrustado: z.string().optional(),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  es_principal: z.boolean().default(false),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface SucursalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalEditar?: Sucursal | null
  onSuccess: () => void
}

export function SucursalForm({ open, onOpenChange, sucursalEditar, onSuccess }: SucursalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const isEditing = !!sucursalEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: 0,
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      horarios: '',
      mapa_incrustado: '',
      latitud: undefined,
      longitud: undefined,
      es_principal: false,
      orden: 0,
      estado: 'activo',
    },
  })

  // Cargar empresas solo una vez cuando se abre el modal
  useEffect(() => {
    if (open && !empresasLoaded) {
      getEmpresasActivas().then((data) => {
        setEmpresas(data)
        setEmpresasLoaded(true)
      })
    }
  }, [open, empresasLoaded])

  // Resetear formulario solo cuando cambie open o sucursalEditar
  useEffect(() => {
    if (!open) {
      form.reset({
        empresa_id: 0,
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        horarios: '',
        mapa_incrustado: '',
        latitud: undefined,
        longitud: undefined,
        es_principal: false,
        orden: 0,
        estado: 'activo',
      })
      return
    }

    if (open && sucursalEditar) {
      form.reset({
        empresa_id: sucursalEditar.empresa_id,
        nombre: sucursalEditar.nombre,
        direccion: sucursalEditar.direccion,
        telefono: sucursalEditar.telefono,
        email: sucursalEditar.email || '',
        horarios: sucursalEditar.horarios || '',
        mapa_incrustado: sucursalEditar.mapa_incrustado || '',
        latitud: sucursalEditar.latitud || undefined,
        longitud: sucursalEditar.longitud || undefined,
        es_principal: sucursalEditar.es_principal,
        orden: sucursalEditar.orden,
        estado: sucursalEditar.estado === 'eliminado' ? 'activo' : sucursalEditar.estado,
      })
    } else if (open && empresas.length > 0 && !sucursalEditar) {
      form.reset({
        empresa_id: empresas[0]?.id || 0,
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        horarios: '',
        mapa_incrustado: '',
        latitud: undefined,
        longitud: undefined,
        es_principal: false,
        orden: 0,
        estado: 'activo',
      })
    }
  }, [open, sucursalEditar, form, empresas])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && sucursalEditar) {
        await actualizarSucursal({ id: sucursalEditar.id, ...data })
      } else {
        await crearSucursal(data)
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar la sucursal')
    } finally {
      setIsLoading(false)
    }
  }

  // Combinamos el onChange nativo de react-hook-form con nuestra lógica personalizada
  const { onChange: onMapChange, ...mapaIncrustadoProps } = form.register('mapa_incrustado')

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}
      description={isEditing ? 'Modifica los datos de la sucursal' : 'Registra una nueva sede o sucursal'}
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => { form.reset(); onOpenChange(false) }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Sucursal'}
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
                <SelectItem key={emp.id} value={emp.id.toString()}>{emp.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.empresa_id && (
            <span className="text-sm text-destructive">{form.formState.errors.empresa_id.message}</span>
          )}
        </div>

        {/* Nombre y Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre de la Sucursal *</Label>
            <Input {...form.register('nombre')} placeholder="Ej: Sede Central La Paz" />
            {form.formState.errors.nombre && (
              <span className="text-sm text-destructive">{form.formState.errors.nombre.message}</span>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Teléfono *</Label>
            <Input {...form.register('telefono')} placeholder="+591 2 2222222" />
            {form.formState.errors.telefono && (
              <span className="text-sm text-destructive">{form.formState.errors.telefono.message}</span>
            )}
          </div>
        </div>

        {/* Dirección y Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Dirección *</Label>
            <Input {...form.register('direccion')} placeholder="Av. Principal #123" />
            {form.formState.errors.direccion && (
              <span className="text-sm text-destructive">{form.formState.errors.direccion.message}</span>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Email de Contacto</Label>
            <Input {...form.register('email')} type="email" placeholder="sucursal@empresa.com" />
            {form.formState.errors.email && (
              <span className="text-sm text-destructive">{form.formState.errors.email.message}</span>
            )}
          </div>
        </div>

        {/* Coordenadas (Editables por si el usuario necesita ajustarlas manualmente) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Latitud</Label>
            <Input 
              type="number" 
              step="any" 
              {...form.register('latitud', { valueAsNumber: true })} 
              placeholder="-16.5000" 
            />
          </div>
          <div className="grid gap-2">
            <Label>Longitud</Label>
            <Input 
              type="number" 
              step="any" 
              {...form.register('longitud', { valueAsNumber: true })} 
              placeholder="-68.1193" 
            />
          </div>
        </div>

        {/* Horarios y Mapa */}
        <div className="grid gap-2">
          <Label>Horarios de Atención</Label>
          <Input {...form.register('horarios')} placeholder="Lun-Vie: 8:00 - 18:00, Sab: 8:00 - 13:00" />
        </div>
        
        <div className="grid gap-2">
          <Label>Mapa Incrustado (iframe de Google Maps)</Label>
          <Textarea 
            {...mapaIncrustadoProps}
            rows={3} 
            placeholder="Pega aquí el enlace del iframe de Google Maps..." 
            onChange={(e) => {
              // 1. Ejecutamos el onChange original de react-hook-form
              onMapChange(e)
              
              // 2. Intentamos extraer coordenadas
              const coords = extractCoordinatesFromMapUrl(e.target.value)
              if (coords) {
                form.setValue('latitud', coords.latitud)
                form.setValue('longitud', coords.longitud)
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            💡 Al pegar un enlace de Google Maps, la latitud y longitud se completarán automáticamente.
          </p>
        </div>

        {/* Configuración */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="es_principal"
              checked={form.watch('es_principal')}
              onCheckedChange={(checked) => form.setValue('es_principal', checked === true)}
            />
            <Label htmlFor="es_principal" className="cursor-pointer">Es Sede Principal</Label>
          </div>
          <div className="grid gap-2">
            <Label>Orden de visualización</Label>
            <Input type="number" {...form.register('orden')} />
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select value={form.watch('estado')} onValueChange={(val: any) => form.setValue('estado', val)}>
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