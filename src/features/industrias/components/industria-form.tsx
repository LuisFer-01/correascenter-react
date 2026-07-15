import { FormShell } from '@/components/shared/form-shell'
import { IndustriaImageUpload } from '@/components/shared/industria-image-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Industria } from '@/types/industria'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Package, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarIndustria,
    crearIndustria,
    getCategoriasActivas,
    getEmpresasActivas,
    getNextOrdenIndustria,
    getServiciosActivos,
} from '../services/industria.service'

const formSchema = z.object({
  empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  slug: z.string().min(2, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  imagen: z.string().optional(),
  orden: z.coerce.number().default(0),
  estado: z.enum(['activo', 'inactivo']),
  categoria_ids: z.array(z.number()).default([]),
  servicio_ids: z.array(z.number()).default([]),
})

type FormValues = z.infer<typeof formSchema>

interface IndustriaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  industriaEditar?: Industria | null
  onSuccess: () => void
}

export function IndustriaForm({
  open,
  onOpenChange,
  industriaEditar,
  onSuccess,
}: IndustriaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
  const [categorias, setCategorias] = useState<{ id: number; nombre: string; slug: string }[]>([])
  const [servicios, setServicios] = useState<{ id: number; nombre: string; descripcion?: string }[]>([])
  const [empresasLoaded, setEmpresasLoaded] = useState(false)
  const [categoriasLoaded, setCategoriasLoaded] = useState(false)
  const [serviciosLoaded, setServiciosLoaded] = useState(false)
  const [imagenUrl, setImagenUrl] = useState<string>('')
  const [categoriasOpen, setCategoriasOpen] = useState(false)
  const [serviciosOpen, setServiciosOpen] = useState(false)
  const isEditing = !!industriaEditar

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa_id: 0,
      nombre: '',
      slug: '',
      imagen: '',
      orden: 0,
      estado: 'activo',
      categoria_ids: [],
      servicio_ids: [],
    },
  })

  useEffect(() => {
    if (open && !empresasLoaded) {
      getEmpresasActivas().then((data) => {
        setEmpresas(data)
        setEmpresasLoaded(true)
      })
    }
    if (open && !categoriasLoaded) {
      getCategoriasActivas().then((data) => {
        setCategorias(data)
        setCategoriasLoaded(true)
      })
    }
    if (open && !serviciosLoaded) {
      getServiciosActivos().then((data) => {
        setServicios(data)
        setServiciosLoaded(true)
      })
    }
  }, [open, empresasLoaded, categoriasLoaded, serviciosLoaded])

  const nombreWatch = form.watch('nombre')
  useEffect(() => {
    if (!isEditing && nombreWatch) {
      const slug = nombreWatch
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      form.setValue('slug', slug)
    }
  }, [nombreWatch, isEditing, form])

  useEffect(() => {
    if (!open) {
      form.reset({
        empresa_id: 0,
        nombre: '',
        slug: '',
        imagen: '',
        orden: 0,
        estado: 'activo',
        categoria_ids: [],
        servicio_ids: [],
      })
      setImagenUrl('')
      setCategoriasOpen(false)
      setServiciosOpen(false)
      return
    }

    if (open && industriaEditar) {
      setImagenUrl(industriaEditar.imagen || '')
      
      // Extraer IDs de categorías y servicios de las asignaciones
      const categoriaIds = industriaEditar.asignaciones
        ?.filter(a => a.tipo_registro === 'categoria')
        .map(a => a.registro_id) || []
      
      const servicioIds = industriaEditar.asignaciones
        ?.filter(a => a.tipo_registro === 'servicio')
        .map(a => a.registro_id) || []
      
      form.reset({
        empresa_id: industriaEditar.empresa_id,
        nombre: industriaEditar.nombre,
        slug: industriaEditar.slug,
        imagen: industriaEditar.imagen || '',
        orden: industriaEditar.orden,
        estado: industriaEditar.estado === 'eliminado' ? 'activo' : industriaEditar.estado,
        categoria_ids: categoriaIds,
        servicio_ids: servicioIds,
      })
      
      // Abrir las secciones si hay asignaciones
      setCategoriasOpen(categoriaIds.length > 0)
      setServiciosOpen(servicioIds.length > 0)
    } else if (open && empresas.length > 0 && !industriaEditar) {
      getNextOrdenIndustria().then((nextOrden) => {
        form.reset({
          empresa_id: empresas[0]?.id || 0,
          nombre: '',
          slug: '',
          imagen: '',
          orden: nextOrden,
          estado: 'activo',
          categoria_ids: [],
          servicio_ids: [],
        })
      })
      setImagenUrl('')
    }
  }, [open, industriaEditar, form, empresas])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && industriaEditar) {
        await actualizarIndustria({
          id: industriaEditar.id,
          empresa_id: data.empresa_id,
          nombre: data.nombre,
          slug: data.slug,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
        })
        
        // Aquí podrías agregar lógica para actualizar asignaciones si es necesario
        // Por ahora solo actualizamos la industria
      } else {
        await crearIndustria({
          empresa_id: data.empresa_id,
          nombre: data.nombre,
          slug: data.slug,
          imagen: imagenUrl,
          orden: data.orden,
          estado: data.estado,
        })
      }
      form.reset()
      setImagenUrl('')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar la industria')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategoria = (categoriaId: number) => {
    const current = form.getValues('categoria_ids')
    if (current.includes(categoriaId)) {
      form.setValue('categoria_ids', current.filter(id => id !== categoriaId))
    } else {
      form.setValue('categoria_ids', [...current, categoriaId])
    }
  }

  const toggleServicio = (servicioId: number) => {
    const current = form.getValues('servicio_ids')
    if (current.includes(servicioId)) {
      form.setValue('servicio_ids', current.filter(id => id !== servicioId))
    } else {
      form.setValue('servicio_ids', [...current, servicioId])
    }
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Industria/Aplicación' : 'Nueva Industria/Aplicación'}
      description={
        isEditing
          ? 'Modifica la información de la industria o aplicación'
          : 'Registra una nueva industria o campo de aplicación'
      }
      onSubmit={form.handleSubmit(onSubmit)}
      onCancel={() => {
        form.reset()
        setImagenUrl('')
        onOpenChange(false)
      }}
      isLoading={isLoading}
      submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Industria'}
    >
      <form className="space-y-4">
        <div className="border-b pb-4">
          <Label>Imagen de la Industria</Label>
          <IndustriaImageUpload
            value={imagenUrl}
            onChange={setImagenUrl}
            onRemove={() => setImagenUrl('')}
            industriaName={form.watch('nombre')}
          />
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nombre de la Industria *</Label>
            <Input {...form.register('nombre')} placeholder="Ej: Minería" />
            {form.formState.errors.nombre && (
              <span className="text-sm text-destructive">
                {form.formState.errors.nombre.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Slug (URL amigable) *</Label>
            <Input
              {...form.register('slug')}
              placeholder="mineria"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {isEditing ? 'Identificador único en la URL' : 'Se genera automáticamente'}
            </p>
            {form.formState.errors.slug && (
              <span className="text-sm text-destructive">
                {form.formState.errors.slug.message}
              </span>
            )}
          </div>
        </div>

        {/* Sección de Categorías - Expandible */}
        <Collapsible open={categoriasOpen} onOpenChange={setCategoriasOpen} className="border rounded-lg">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium cursor-pointer">
                  Categorías Asignadas ({form.watch('categoria_ids').length})
                </Label>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${categoriasOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categorias.map((categoria) => (
                <div key={categoria.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`categoria-${categoria.id}`}
                    checked={form.watch('categoria_ids').includes(categoria.id)}
                    onCheckedChange={() => toggleCategoria(categoria.id)}
                  />
                  <Label htmlFor={`categoria-${categoria.id}`} className="text-sm font-normal cursor-pointer flex-1">
                    {categoria.nombre}
                  </Label>
                </div>
              ))}
              {categorias.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No hay categorías disponibles</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Sección de Servicios - Expandible */}
        <Collapsible open={serviciosOpen} onOpenChange={setServiciosOpen} className="border rounded-lg">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium cursor-pointer">
                  Servicios Asignados ({form.watch('servicio_ids').length})
                </Label>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${serviciosOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {servicios.map((servicio) => (
                <div key={servicio.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`servicio-${servicio.id}`}
                    checked={form.watch('servicio_ids').includes(servicio.id)}
                    onCheckedChange={() => toggleServicio(servicio.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`servicio-${servicio.id}`} className="text-sm font-normal cursor-pointer">
                      {servicio.nombre}
                    </Label>
                    {servicio.descripcion && (
                      <p className="text-xs text-muted-foreground mt-0.5">{servicio.descripcion}</p>
                    )}
                  </div>
                </div>
              ))}
              {servicios.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No hay servicios disponibles</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

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