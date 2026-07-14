import { FormShell } from '@/components/shared/form-shell'
import { LogoUpload } from '@/components/shared/logo-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Empresa } from '@/types/empresa'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { actualizarEmpresa, crearEmpresa } from '../services/empresa.service'

const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre es requerido'),
  estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface EmpresaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresaEditar?: Empresa | null
  onSuccess: () => void
}

export function EmpresaForm({
  open,
  onOpenChange,
  empresaEditar,
  onSuccess,
}: EmpresaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const isEditing = !!empresaEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      estado: 'activo',
    },
  })

  useEffect(() => {
    if (empresaEditar && open) {
      setLogoUrl(empresaEditar.logo || '')
      form.reset({
        nombre: empresaEditar.nombre,
        estado: empresaEditar.estado === 'eliminado' ? 'activo' : empresaEditar.estado,
      })
    } else if (!open) {
      form.reset({
        nombre: '',
        estado: 'activo',
      })
      setLogoUrl('')
    }
  }, [empresaEditar, open, form])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && empresaEditar) {
        await actualizarEmpresa({
          id: empresaEditar.id,
          nombre: data.nombre,
          logo: logoUrl,
          estado: data.estado,
        })
      } else {
        await crearEmpresa({
          nombre: data.nombre,
          logo: logoUrl,
          estado: data.estado,
        })
      }
      form.reset()
      setLogoUrl('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar la empresa')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Empresa' : 'Crear Nueva Empresa'}
      description={
        isEditing
          ? 'Modifica la información de la empresa'
          : 'Registra una nueva empresa en el sistema'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setLogoUrl('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Empresa'}
    >
      <form id="empresa-form" className="space-y-4">
        {/* Upload de Logo */}
        <div className="border-b pb-4">
          <Label>Logo de la Empresa</Label>
          <LogoUpload
            value={logoUrl}
            onChange={setLogoUrl}
            onRemove={() => setLogoUrl('')}
            companyName={form.watch('nombre')}
          />
        </div>

        {/* Nombre */}
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre de la Empresa *</Label>
          <Input
            id="nombre"
            {...form.register('nombre')}
            placeholder="Ej: Centro Correas"
          />
          {form.formState.errors.nombre && (
            <span className="text-sm text-destructive">
              {form.formState.errors.nombre.message}
            </span>
          )}
        </div>

        {/* Estado */}
        <div className="grid gap-2">
          <Label>Estado</Label>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estado-activo"
                checked={form.watch('estado') === 'activo'}
                onCheckedChange={() => form.setValue('estado', 'activo')}
              />
              <Label htmlFor="estado-activo" className="text-sm font-normal cursor-pointer">
                Activo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estado-inactivo"
                checked={form.watch('estado') === 'inactivo'}
                onCheckedChange={() => form.setValue('estado', 'inactivo')}
              />
              <Label htmlFor="estado-inactivo" className="text-sm font-normal cursor-pointer">
                Inactivo
              </Label>
            </div>
          </div>
        </div>
      </form>
    </FormShell>
  )
}