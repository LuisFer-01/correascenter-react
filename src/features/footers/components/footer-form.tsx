import { FormShell } from '@/components/shared/form-shell'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Footer } from '@/types/footer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarFooter,
    crearFooter,
    getEmpresasActivas,
    getNextOrdenFooter,
    getNextRegistroId,
} from '../services/footer.service'

const formSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  tipo: z.enum(['producto', 'industria', 'servicio', 'red_social']),
  tipo_registro: z.enum(['producto', 'industria', 'servicio']).optional().nullable(),
  registro_id: z.coerce.number().min(1, 'Selecciona un registro').optional().nullable(),
  titulo: z.string().optional(),
  url: z.string().optional(),
  icono: z.string().optional(),
  orden: z.coerce.number().default(0),
  mostrar: z.boolean().default(true),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface FooterFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  footerEditar?: Footer | null
  onSuccess: () => void
}

export function FooterForm({
  open,
  onOpenChange,
  footerEditar,
  onSuccess,
}: FooterFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const isEditing = !!footerEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: 0,
      tipo: 'producto',
      tipo_registro: null,
      registro_id: null,
      titulo: '',
      url: '',
      icono: '',
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

  // Observar cambios en tipo y tipo_registro para actualizar registro_id y orden
  const tipoWatch = form.watch('tipo')
  const tipoRegistroWatch = form.watch('tipo_registro')

  useEffect(() => {
    if (isEditing) return // No actualizar automáticamente en edición

    // Si es red_social, limpiar tipo_registro y registro_id
    if (tipoWatch === 'red_social') {
      form.setValue('tipo_registro', null)
      form.setValue('registro_id', null)
      getNextOrdenFooter('red_social').then((nextOrden) => {
        form.setValue('orden', nextOrden)
      })
      return
    }

    // Si hay tipo_registro seleccionado, actualizar registro_id
    if (tipoRegistroWatch) {
      getNextRegistroId(tipoRegistroWatch).then((nextId) => {
        form.setValue('registro_id', nextId)
      })
      // Actualizar orden según tipo
      getNextOrdenFooter(tipoWatch).then((nextOrden) => {
        form.setValue('orden', nextOrden)
      })
    } else {
      // Si no hay tipo_registro pero sí tipo, actualizar orden
      getNextOrdenFooter(tipoWatch).then((nextOrden) => {
        form.setValue('orden', nextOrden)
      })
    }
  }, [tipoWatch, tipoRegistroWatch, form, isEditing])

  useEffect(() => {
    if (!open) {
      form.reset({
        empresa_id: 0,
        tipo: 'producto',
        tipo_registro: null,
        registro_id: null,
        titulo: '',
        url: '',
        icono: '',
        orden: 0,
        mostrar: true,
        estado: 'activo',
      })
      return
    }

    if (open && footerEditar) {
      form.reset({
        empresa_id: footerEditar.empresa_id,
        tipo: footerEditar.tipo,
        tipo_registro: footerEditar.tipo_registro,
        registro_id: footerEditar.registro_id,
        titulo: footerEditar.titulo || '',
        url: footerEditar.url || '',
        icono: footerEditar.icono || '',
        orden: footerEditar.orden,
        mostrar: footerEditar.mostrar,
        estado: footerEditar.estado === 'eliminado' ? 'activo' : footerEditar.estado,
      })
    } else if (open && empresas.length > 0 && !footerEditar) {
      getNextOrdenFooter('producto').then((nextOrden) => {
        form.reset({
          empresa_id: empresas[0]?.id || 0,
          tipo: 'producto',
          tipo_registro: 'producto',
          registro_id: 1,
          titulo: '',
          url: '',
          icono: '',
          orden: nextOrden,
          mostrar: true,
          estado: 'activo',
        })
      })
    }
  }, [open, footerEditar, form, empresas])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && footerEditar) {
        await actualizarFooter({
          id: footerEditar.id,
          ...data,
        })
      } else {
        await crearFooter(data)
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el footer')
    } finally {
      setIsLoading(false)
    }
  }

  const esRedSocial = tipoWatch === 'red_social'

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Footer' : 'Nuevo Footer'}
      description={
        isEditing
          ? 'Modifica el elemento del footer'
          : 'Agrega un nuevo elemento al footer del sitio'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Footer'}
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

        {/* Tipo y Tipo de Registro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Tipo *</Label>
            <Select
              value={form.watch('tipo')}
              onValueChange={(val: any) => form.setValue('tipo', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="industria">Industria</SelectItem>
                <SelectItem value="servicio">Servicio</SelectItem>
                <SelectItem value="red_social">Red Social</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Tipo de Registro</Label>
            <Select
              value={form.watch('tipo_registro') || ''}
              onValueChange={(val: any) => form.setValue('tipo_registro', val || null)}
              disabled={esRedSocial}
            >
              <SelectTrigger>
                <SelectValue placeholder={esRedSocial ? 'No aplica' : 'Selecciona un tipo'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="industria">Industria</SelectItem>
                <SelectItem value="servicio">Servicio</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {esRedSocial ? 'No disponible para redes sociales' : 'Se autocompleta según el tipo'}
            </p>
          </div>
        </div>

        {/* Registro ID y Orden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>ID del Registro</Label>
            <Input
              type="number"
              {...form.register('registro_id', { valueAsNumber: true })}
              placeholder="Ej: 1"
              disabled={esRedSocial}
            />
            <p className="text-xs text-muted-foreground">
              {esRedSocial ? 'No aplica' : 'Se autocompleta con el siguiente disponible'}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Orden</Label>
            <Input type="number" {...form.register('orden')} />
            <p className="text-xs text-muted-foreground">
              Se autocompleta con el siguiente disponible según el tipo
            </p>
          </div>
        </div>

        {/* Título y URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input {...form.register('titulo')} placeholder="Ej: Facebook" />
          </div>
          <div className="grid gap-2">
            <Label>URL</Label>
            <Input {...form.register('url')} placeholder="https://..." />
          </div>
        </div>

        {/* Icono */}
        <div className="grid gap-2">
          <Label>Icono (Lucide)</Label>
          <Input {...form.register('icono')} placeholder="Ej: Facebook, Instagram, Twitter" />
          <p className="text-xs text-muted-foreground">
            Nombre del icono de Lucide React (opcional)
          </p>
        </div>

        {/* Mostrar y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="mostrar"
              checked={form.watch('mostrar')}
              onCheckedChange={(checked) => form.setValue('mostrar', checked === true)}
            />
            <Label htmlFor="mostrar" className="cursor-pointer">
              Mostrar en footer
            </Label>
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