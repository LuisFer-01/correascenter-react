import { FormShell } from '@/components/shared/form-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { PasoWizard } from '@/types/pasos-wizard'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    actualizarPasoWizard,
    crearPasoWizard,
    getEmpresasActivas,
} from '../services/paso-wizard.service'

const formSchema = z.object({
    empresa_id: z.coerce.number().min(1, 'Selecciona una empresa'),
    identificador: z.string().min(2, 'El identificador es requerido'),
    titulo: z.string().min(2, 'El título es requerido'),
    descripcion: z.string().min(5, 'La descripción es requerida'),
    fuente_datos: z.string().min(2, 'La fuente de datos es requerida'),
    campo_filtro: z.string().optional(),
    orden: z.coerce.number().default(0),
    estado: z.enum(['activo', 'inactivo']),
})

type FormValues = z.infer<typeof formSchema>

interface PasoWizardFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pasoEditar?: PasoWizard | null
    onSuccess: () => void
}

export function PasoWizardForm({
    open,
    onOpenChange,
    pasoEditar,
    onSuccess,
}: PasoWizardFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([])
    const [empresasLoaded, setEmpresasLoaded] = useState(false)
    const isEditing = !!pasoEditar

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            empresa_id: 0,
            identificador: '',
            titulo: '',
            descripcion: '',
            fuente_datos: '',
            campo_filtro: '',
            orden: 0,
            estado: 'activo',
        },
    })

    // Cargar empresas solo una vez
    useEffect(() => {
        if (open && !empresasLoaded) {
            getEmpresasActivas().then((data) => {
                setEmpresas(data)
                setEmpresasLoaded(true)
            })
        }
    }, [open, empresasLoaded])

    // Resetear formulario
    useEffect(() => {
        if (!open) {
            form.reset({
                empresa_id: 0,
                identificador: '',
                titulo: '',
                descripcion: '',
                fuente_datos: '',
                campo_filtro: '',
                orden: 0,
                estado: 'activo',
            })
            return
        }

        if (open && pasoEditar) {
            form.reset({
                empresa_id: pasoEditar.empresa_id,
                identificador: pasoEditar.identificador,
                titulo: pasoEditar.titulo,
                descripcion: pasoEditar.descripcion,
                fuente_datos: pasoEditar.fuente_datos,
                campo_filtro: pasoEditar.campo_filtro || '',
                orden: pasoEditar.orden,
                estado:
                    pasoEditar.estado === 'eliminado' ? 'activo' : pasoEditar.estado,
            })
        } else if (open && empresas.length > 0 && !pasoEditar) {
            form.reset({
                empresa_id: empresas[0]?.id || 0,
                identificador: '',
                titulo: '',
                descripcion: '',
                fuente_datos: '',
                campo_filtro: '',
                orden: 0,
                estado: 'activo',
            })
        }
    }, [open, pasoEditar, form, empresas])

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true)
        try {
            if (isEditing && pasoEditar) {
                await actualizarPasoWizard({ id: pasoEditar.id, ...data })
            } else {
                await crearPasoWizard(data)
            }
            form.reset()
            onSuccess()
        } catch (error: any) {
            console.error('Error:', error)
            alert(error.message || 'Error al guardar el paso del wizard')
        } finally {
            setIsLoading(false)
        }
    }

    // Opciones predefinidas para fuente_datos
    const fuentesDatos = [
        { value: 'productos', label: 'Productos' },
        { value: 'categorias', label: 'Categorías' },
        { value: 'industrias', label: 'Industrias' },
        { value: 'servicios', label: 'Servicios' },
    ]

    return (
        <FormShell
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? 'Editar Paso del Wizard' : 'Nuevo Paso del Wizard'}
            description={
                isEditing
                    ? 'Modifica la configuración del paso'
                    : 'Configura un nuevo paso del asistente de selección'
            }
            onSubmit={form.handleSubmit(onSubmit)}
            onCancel={() => {
                form.reset()
                onOpenChange(false)
            }}
            isLoading={isLoading}
            submitLabel={isEditing ? 'Guardar Cambios' : 'Crear Paso'}
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

                {/* Identificador y Título */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Identificador Único *</Label>
                        <Input
                            {...form.register('identificador')}
                            placeholder="Ej: selector_correas"
                            className="font-mono text-sm"
                        />
                        {form.formState.errors.identificador && (
                            <span className="text-sm text-destructive">
                                {form.formState.errors.identificador.message}
                            </span>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Título del Paso *</Label>
                        <Input
                            {...form.register('titulo')}
                            placeholder="Ej: Selecciona el tipo de correa"
                        />
                        {form.formState.errors.titulo && (
                            <span className="text-sm text-destructive">
                                {form.formState.errors.titulo.message}
                            </span>
                        )}
                    </div>
                </div>

                {/* Descripción */}
                <div className="grid gap-2">
                    <Label>Descripción *</Label>
                    <Textarea
                        {...form.register('descripcion')}
                        rows={3}
                        placeholder="Describe qué debe seleccionar el usuario en este paso..."
                    />
                    {form.formState.errors.descripcion && (
                        <span className="text-sm text-destructive">
                            {form.formState.errors.descripcion.message}
                        </span>
                    )}
                </div>

                {/* Fuente de Datos y Campo Filtro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Fuente de Datos *</Label>
                        <Select
                            value={form.watch('fuente_datos')}
                            onValueChange={(val) => form.setValue('fuente_datos', val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona la tabla" />
                            </SelectTrigger>
                            <SelectContent>
                                {fuentesDatos.map((fuente) => (
                                    <SelectItem key={fuente.value} value={fuente.value}>
                                        {fuente.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.fuente_datos && (
                            <span className="text-sm text-destructive">
                                {form.formState.errors.fuente_datos.message}
                            </span>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Campo de Filtro</Label>
                        <Input
                            {...form.register('campo_filtro')}
                            placeholder="Ej: empresa_id, categoria_id"
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Campo usado para filtrar los datos (opcional)
                        </p>
                    </div>
                </div>

                {/* Orden y Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="grid gap-2">
                        <Label>Orden de visualización</Label>
                        <Input type="number" {...form.register('orden')} />
                        <p className="text-xs text-muted-foreground">
                            Los pasos se muestran en orden ascendente
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
