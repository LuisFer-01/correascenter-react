import { FormShell } from '@/components/shared/form-shell'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import type { PermisosAgrupados, Rol } from '@/types/rol'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { actualizarRol, crearRol, traducirGrupo } from '../services/rol.service'

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9_-]+$/, 'Solo minúsculas, números, guiones y guiones bajos'),
  descripcion: z.string().optional(),
  permiso_ids: z.array(z.number()),
})

type FormValues = z.infer<typeof formSchema>

interface RolFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permisosAgrupados: PermisosAgrupados
  rolEditar?: Rol | null
  onSuccess: () => void
}

export function RolForm({
  open,
  onOpenChange,
  permisosAgrupados,
  rolEditar,
  onSuccess,
}: RolFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!rolEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      slug: '',
      descripcion: '',
      permiso_ids: [],
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

  // Cargar datos al editar
  useEffect(() => {
    if (rolEditar && open) {
      form.reset({
        nombre: rolEditar.nombre,
        slug: rolEditar.slug,
        descripcion: rolEditar.descripcion || '',
        permiso_ids: rolEditar.permisos.map((p) => p.id),
      })
    } else if (!open) {
      form.reset({
        nombre: '',
        slug: '',
        descripcion: '',
        permiso_ids: [],
      })
    }
  }, [rolEditar, open, form])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && rolEditar) {
        await actualizarRol({
          id: rolEditar.id,
          nombre: data.nombre,
          slug: data.slug,
          descripcion: data.descripcion,
          permiso_ids: data.permiso_ids,
        })
      } else {
        await crearRol({
          nombre: data.nombre,
          slug: data.slug,
          descripcion: data.descripcion,
          permiso_ids: data.permiso_ids,
        })
      }
      form.reset()
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el rol')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle todos los permisos de un grupo
  const toggleGrupo = (grupo: string) => {
    const permisosDelGrupo = permisosAgrupados[grupo] || []
    const currentIds = form.getValues('permiso_ids')
    const grupoIds = permisosDelGrupo.map((p) => p.id)
    const todosSeleccionados = grupoIds.every((id) => currentIds.includes(id))

    if (todosSeleccionados) {
      form.setValue(
        'permiso_ids',
        currentIds.filter((id) => !grupoIds.includes(id))
      )
    } else {
      const nuevos = [...new Set([...currentIds, ...grupoIds])]
      form.setValue('permiso_ids', nuevos)
    }
  }

  const togglePermiso = (permisoId: number) => {
    const current = form.getValues('permiso_ids')
    if (current.includes(permisoId)) {
      form.setValue('permiso_ids', current.filter((id) => id !== permisoId))
    } else {
      form.setValue('permiso_ids', [...current, permisoId])
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}
      description={
        isEditing
          ? 'Modifica la información y permisos del rol'
          : 'Define un nuevo rol con sus permisos de acceso'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Rol'}
    >
      <form id="rol-form" className="space-y-4">
        {/* Nombre */}
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre del Rol *</Label>
          <Input
            id="nombre"
            {...form.register('nombre')}
            placeholder="Ej: Administrador de Ventas"
          />
          {form.formState.errors.nombre && (
            <span className="text-sm text-destructive">
              {form.formState.errors.nombre.message}
            </span>
          )}
        </div>

        {/* Slug */}
        <div className="grid gap-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            {...form.register('slug')}
            placeholder="admin_ventas"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Identificador único en minúsculas (se genera automáticamente)
          </p>
          {form.formState.errors.slug && (
            <span className="text-sm text-destructive">
              {form.formState.errors.slug.message}
            </span>
          )}
        </div>

        {/* Descripción */}
        <div className="grid gap-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            {...form.register('descripcion')}
            placeholder="Describe las responsabilidades de este rol..."
            rows={3}
          />
        </div>

        {/* Permisos agrupados */}
        <div className="grid gap-2">
          <Label>Permisos del Rol</Label>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-4">
              {Object.entries(permisosAgrupados).map(([grupo, permisos]) => {
                const currentIds = form.watch('permiso_ids')
                const grupoIds = permisos.map((p) => p.id)
                const seleccionados = grupoIds.filter((id) =>
                  currentIds.includes(id)
                ).length
                const todosSeleccionados = seleccionados === grupoIds.length

                return (
                  <div key={grupo} className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`grupo-${grupo}`}
                          checked={todosSeleccionados}
                          onCheckedChange={() => toggleGrupo(grupo)}
                        />
                        <Label
                          htmlFor={`grupo-${grupo}`}
                          className="font-semibold cursor-pointer"
                        >
                          {traducirGrupo(grupo)}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          ({seleccionados}/{grupoIds.length})
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                      {permisos.map((permiso) => (
                        <div
                          key={permiso.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`permiso-${permiso.id}`}
                            checked={currentIds.includes(permiso.id)}
                            onCheckedChange={() => togglePermiso(permiso.id)}
                          />
                          <Label
                            htmlFor={`permiso-${permiso.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                            title={permiso.descripcion || ''}
                          >
                            {permiso.nombre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          {form.formState.errors.permiso_ids && (
            <span className="text-sm text-destructive">
              {form.formState.errors.permiso_ids.message}
            </span>
          )}
        </div>
      </form>
    </FormShell>
  )
}