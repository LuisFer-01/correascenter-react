import { FormShell } from '@/components/shared/form-shell'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Menu } from '@/types/menu'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarMenu,
    crearMenu,
    getEmpresasActivas,
    getNextOrdenMenu,
    getNextRegistroId,
} from '../services/menu.service'

const formSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  grupo: z.string().min(2, 'El nombre del grupo es requerido'),
  tipo_registro: z.enum(['producto', 'industria', 'servicio']),
  registro_id: z.coerce.number().min(1, 'Selecciona un registro'),
  ruta: z.string().min(2, 'La ruta es requerida'),
  icono: z.string().optional(),
  mostrar: z.boolean().default(true),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface MenuFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuEditar?: Menu | null
  onSuccess: () => void
}

export function MenuForm({
  open,
  onOpenChange,
  menuEditar,
  onSuccess,
}: MenuFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const isEditing = !!menuEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: 0,
      grupo: '',
      tipo_registro: 'producto',
      registro_id: 0,
      ruta: '',
      icono: '',
      mostrar: true,
      orden: 0,
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

  // NUEVO: Actualizar registro_id automáticamente al cambiar tipo_registro (solo en creación)
  const tipoRegistroWatch = form.watch('tipo_registro')
  useEffect(() => {
    if (!isEditing && tipoRegistroWatch) {
      getNextRegistroId(tipoRegistroWatch).then((nextId) => {
        form.setValue('registro_id', nextId)
      })
    }
  }, [tipoRegistroWatch, isEditing, form])

  useEffect(() => {
    if (!open) {
      form.reset({
        empresa_id: 0,
        grupo: '',
        tipo_registro: 'producto',
        registro_id: 0,
        ruta: '',
        icono: '',
        mostrar: true,
        orden: 0,
        estado: 'activo',
      })
      return
    }

    if (open && menuEditar) {
      form.reset({
        empresa_id: menuEditar.empresa_id,
        grupo: menuEditar.grupo,
        tipo_registro: menuEditar.tipo_registro,
        registro_id: menuEditar.registro_id,
        ruta: menuEditar.ruta,
        icono: menuEditar.icono || '',
        mostrar: menuEditar.mostrar,
        orden: menuEditar.orden,
        estado: menuEditar.estado === 'eliminado' ? 'activo' : menuEditar.estado,
      })
    } else if (open && empresas.length > 0 && !menuEditar) {
      getNextOrdenMenu().then((nextOrden) => {
        // Obtener el siguiente ID del tipo de registro por defecto (producto)
        getNextRegistroId('producto').then((nextId) => {
          form.reset({
            empresa_id: empresas[0]?.id || 0,
            grupo: '',
            tipo_registro: 'producto',
            registro_id: nextId,
            ruta: '',
            icono: '',
            mostrar: true,
            orden: nextOrden,
            estado: 'activo',
          })
        })
      })
    }
  }, [open, menuEditar, form, empresas])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && menuEditar) {
        await actualizarMenu({
          id: menuEditar.id,
          ...data,
        })
      } else {
        await crearMenu(data)
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el menú')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Menú' : 'Nuevo Menú'}
      description={
        isEditing
          ? 'Modifica la configuración del menú principal'
          : 'Registra un nuevo menú principal para la navegación'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Menú'}
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

        {/* Grupo y Tipo de Registro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre del Grupo *</Label>
            <Input {...form.register('grupo')} placeholder="Ej: Producto, Aplicacion" />
            {form.formState.errors.grupo && (
              <span className="text-sm text-destructive">
                {form.formState.errors.grupo.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Tipo de Registro *</Label>
            <Select
              value={form.watch('tipo_registro')}
              onValueChange={(val: any) => form.setValue('tipo_registro', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="producto">Producto</SelectItem>
                <SelectItem value="industria">Industria</SelectItem>
                <SelectItem value="servicio">Servicio</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.tipo_registro && (
              <span className="text-sm text-destructive">
                {form.formState.errors.tipo_registro.message}
              </span>
            )}
          </div>
        </div>

        {/* Registro ID y Ruta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>ID del Registro *</Label>
            <Input
              type="number"
              {...form.register('registro_id', { valueAsNumber: true })}
              placeholder="Ej: 1"
            />
            {form.formState.errors.registro_id && (
              <span className="text-sm text-destructive">
                {form.formState.errors.registro_id.message}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              Se autocompleta según el tipo de registro seleccionado
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Ruta *</Label>
            <Input {...form.register('ruta')} placeholder="Ej: /products/correas" />
            {form.formState.errors.ruta && (
              <span className="text-sm text-destructive">
                {form.formState.errors.ruta.message}
              </span>
            )}
          </div>
        </div>

        {/* Icono */}
        <div className="grid gap-2">
          <Label>Icono (Lucide)</Label>
          <Input {...form.register('icono')} placeholder="Ej: Box, Factory, Wrench" />
          <p className="text-xs text-muted-foreground">
            Nombre del icono de Lucide React (opcional)
          </p>
        </div>

        {/* Mostrar y Orden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="mostrar"
              checked={form.watch('mostrar')}
              onCheckedChange={(checked) => form.setValue('mostrar', checked === true)}
            />
            <Label htmlFor="mostrar" className="cursor-pointer">
              Mostrar en navegación
            </Label>
          </div>
          <div className="grid gap-2">
            <Label>Orden de visualización</Label>
            <Input type="number" {...form.register('orden')} />
          </div>
        </div>

        {/* Estado */}
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
      </form>
    </FormShell>
  )
}