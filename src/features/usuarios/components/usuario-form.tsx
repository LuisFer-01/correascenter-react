import { FormShell } from '@/components/shared/form-shell'
import { ImageUpload } from '@/components/shared/image-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Role, UserProfile } from '@/types/usuario'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { actualizarUsuario, crearUsuario } from '../services/usuario.service'

const formSchema = z.object({
  nombre_completo: z.string().min(2, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  telefono: z.string().optional(),
  estado: z.enum(['activo', 'inactivo']),
  role_ids: z.array(z.number()).min(1, 'Debes seleccionar al menos un rol'),
})

type FormValues = z.infer<typeof formSchema>

interface UsuarioFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rolesDisponibles: Role[]
  usuarioEditar?: UserProfile | null
  onSuccess: () => void
}

export function UsuarioForm({
  open,
  onOpenChange,
  rolesDisponibles,
  usuarioEditar,
  onSuccess
}: UsuarioFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const isEditing = !!usuarioEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_completo: '',
      email: '',
      password: '',
      telefono: '',
      estado: 'activo',
      role_ids: [],
    },
  })

  useEffect(() => {
    if (usuarioEditar && open) {
      setAvatarUrl(usuarioEditar.avatar_url || '')
      const nombreReal = usuarioEditar.nombre_completo !== 'Sin Nombre para Mostrar'
        ? usuarioEditar.nombre_completo
        : ''
      const emailReal = usuarioEditar.email !== 'Sin email'
        ? usuarioEditar.email
        : ''

      form.reset({
        nombre_completo: nombreReal,
        email: emailReal,
        password: '',
        telefono: usuarioEditar.telefono || '',
        estado: usuarioEditar.estado === 'eliminado' ? 'activo' : usuarioEditar.estado,
        role_ids: usuarioEditar.roles.map(r => r.id),
      })
    } else if (!open) {
      form.reset({
        nombre_completo: '',
        email: '',
        password: '',
        telefono: '',
        estado: 'activo',
        role_ids: [],
      })
      setAvatarUrl('')
    }
  }, [usuarioEditar, open, form])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && usuarioEditar) {
        await actualizarUsuario({
          id: usuarioEditar.id,
          nombre_completo: data.nombre_completo,
          email: data.email,
          telefono: data.telefono,
          avatar_url: avatarUrl,
          estado: data.estado,
          role_ids: data.role_ids,
        })
      } else {
        if (!data.password) {
          form.setError('password', { message: 'La contraseña es requerida para crear un usuario' })
          setIsLoading(false)
          return
        }
        await crearUsuario({
          nombre_completo: data.nombre_completo,
          email: data.email,
          password: data.password,
          telefono: data.telefono,
          avatar_url: avatarUrl,
          estado: data.estado,
          role_ids: data.role_ids,
        })
      }
      form.reset()
      setAvatarUrl('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
      description={isEditing
        ? 'Modifica la información del usuario'
        : 'Completa la información para registrar un nuevo usuario en el sistema.'}
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setAvatarUrl('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
    >
      <form id="usuario-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Upload de Avatar */}
        <div className="border-b pb-4">
          <Label>Avatar del Usuario</Label>
          <ImageUpload
            value={avatarUrl}
            onChange={setAvatarUrl}
            onRemove={() => setAvatarUrl('')}
            userName={form.watch('nombre_completo')}
            userEmail={form.watch('email')}
          />
        </div>

        {/* Nombre Completo */}
        <div className="grid gap-2">
          <Label htmlFor="nombre_completo">Display Name *</Label>
          <Input id="nombre_completo" {...form.register('nombre_completo')} placeholder="Ej: Juan Pérez" />
          {form.formState.errors.nombre_completo && (
            <span className="text-sm text-destructive">{form.formState.errors.nombre_completo.message}</span>
          )}
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input id="email" type="email" {...form.register('email')} placeholder="usuario@correascenter.com" />
          {form.formState.errors.email && (
            <span className="text-sm text-destructive">{form.formState.errors.email.message}</span>
          )}
        </div>

        {/* Teléfono */}
        <div className="grid gap-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...form.register('telefono')} placeholder="+591 7 1234567" />
        </div>

        {/* Password (solo en creación) */}
        {!isEditing && (
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña Temporal *</Label>
            <Input id="password" type="password" {...form.register('password')} placeholder="Mínimo 6 caracteres" />
            {form.formState.errors.password && (
              <span className="text-sm text-destructive">{form.formState.errors.password.message}</span>
            )}
          </div>
        )}

        {/* Estado */}
        <div className="grid gap-2">
          <Label>Estado del Usuario</Label>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estado-activo"
                checked={form.watch('estado') === 'activo'}
                onCheckedChange={() => form.setValue('estado', 'activo')}
              />
              <Label htmlFor="estado-activo" className="text-sm font-normal cursor-pointer">Activo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estado-inactivo"
                checked={form.watch('estado') === 'inactivo'}
                onCheckedChange={() => form.setValue('estado', 'inactivo')}
              />
              <Label htmlFor="estado-inactivo" className="text-sm font-normal cursor-pointer">Inactivo</Label>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="grid gap-2">
          <Label>Asignar Roles *</Label>
          <div className="space-y-2 border rounded-md p-3 bg-muted/20">
            {rolesDisponibles.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={form.watch('role_ids').includes(role.id)}
                  onCheckedChange={(checked) => {
                    const current = form.getValues('role_ids')
                    if (checked) {
                      form.setValue('role_ids', [...current, role.id])
                    } else {
                      form.setValue('role_ids', current.filter((id) => id !== role.id))
                    }
                  }}
                />
                <Label htmlFor={`role-${role.id}`} className="text-sm font-normal cursor-pointer">{role.nombre}</Label>
              </div>
            ))}
            {form.formState.errors.role_ids && (
              <span className="text-sm text-destructive">{form.formState.errors.role_ids.message}</span>
            )}
          </div>
        </div>
      </form>
    </FormShell>
  )
}