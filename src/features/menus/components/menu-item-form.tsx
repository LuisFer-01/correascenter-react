import { FormShell } from '@/components/shared/form-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarMenuItem,
    crearMenuItem,
    getNextOrdenMenuItem,
} from '../services/menu.service'

const formSchema = z.object({
  menu_id: z.coerce.number().min(1, 'Selecciona un menú'),
  ruta: z.string().min(2, 'La ruta es requerida'),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface MenuItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuId: number
  menuItemEditar?: { id: number; ruta: string; orden: number; estado: string } | null
  onSuccess: () => void
}

export function MenuItemForm({
  open,
  onOpenChange,
  menuId,
  menuItemEditar,
  onSuccess,
}: MenuItemFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!menuItemEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      menu_id: menuId,
      ruta: '',
      orden: 0,
      estado: 'activo',
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        menu_id: menuId,
        ruta: '',
        orden: 0,
        estado: 'activo',
      })
      return
    }

    if (open && menuItemEditar) {
      form.reset({
        menu_id: menuId,
        ruta: menuItemEditar.ruta,
        orden: menuItemEditar.orden,
        estado: menuItemEditar.estado === 'eliminado' ? 'activo' : menuItemEditar.estado,
      })
    } else if (open && !menuItemEditar) {
      getNextOrdenMenuItem(menuId).then((nextOrden) => {
        form.reset({
          menu_id: menuId,
          ruta: '',
          orden: nextOrden,
          estado: 'activo',
        })
      })
    }
  }, [open, menuItemEditar, menuId, form])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && menuItemEditar) {
        await actualizarMenuItem({
          id: menuItemEditar.id,
          ...data,
        })
      } else {
        await crearMenuItem({
          menu_id: menuId,
          ruta: data.ruta,
          orden: data.orden,
          estado: data.estado,
        })
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el item del menú')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
      description={
        isEditing
          ? 'Modifica la subcategoría del menú'
          : 'Agrega una subcategoría al menú principal'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Agregar Subcategoría'}
    >
      <form className="space-y-4">
        <div className="grid gap-2">
          <Label>Ruta *</Label>
          <Input {...form.register('ruta')} placeholder="Ej: /products/correas/correas-lisas" />
          {form.formState.errors.ruta && (
            <span className="text-sm text-destructive">
              {form.formState.errors.ruta.message}
            </span>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Orden</Label>
          <Input type="number" {...form.register('orden')} />
        </div>

        <div className="grid gap-2">
          <Label>Estado</Label>
          <select
            {...form.register('estado')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </form>
    </FormShell>
  )
}