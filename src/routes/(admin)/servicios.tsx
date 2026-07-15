import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ServicioForm } from '@/features/servicios/components/servicio-form'
import {
  eliminarServicio,
  getServicios,
  restaurarServicio,
} from '@/features/servicios/services/servicio.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Servicio } from '@/types/servicio'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Trash2, Wrench } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/servicios')({
  loader: async () => {
    const [servicios, empresaResult] = await Promise.all([
      getServicios(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      servicios,
      empresa: empresaResult.data || null,
    }
  },
  component: ServiciosPage,
})

function ServiciosPage() {
  const { servicios, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [servicioEditar, setServicioEditar] = useState<Servicio | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [servicioEliminar, setServicioEliminar] = useState<Servicio | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  const filteredServicios = servicios.filter((s: Servicio) => {
    if (s.estado === 'eliminado') {
      return showDeleted && hasPermission('servicios.view_deleted')
    }
    return true
  })

  const handleNuevoServicio = () => {
    setServicioEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarServicio = (servicio: Servicio) => {
    setServicioEditar(servicio)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (servicio: Servicio) => {
    setServicioEliminar(servicio)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!servicioEliminar) return
    setIsDeleting(true)
    try {
      await eliminarServicio(servicioEliminar.id)
      setIsDeleteOpen(false)
      setServicioEliminar(null)
      navigate({ to: '/servicios', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el servicio')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (servicio: Servicio) => {
    try {
      await restaurarServicio(servicio.id)
      navigate({ to: '/servicios', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el servicio')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setServicioEditar(null)
    navigate({ to: '/servicios', replace: true })
  }

  const columns: ColumnDef<Servicio>[] = [
    {
      accessorKey: 'imagen',
      header: '',
      cell: ({ row }) => (
        <Avatar className="h-12 w-12 rounded-lg border bg-background">
          <AvatarImage
            src={row.original.imagen}
            alt={row.original.nombre}
            className="object-contain p-1"
          />
          <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
            <Wrench className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Servicio',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('nombre')}</div>
        </div>
      ),
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {row.getValue('descripcion') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.empresa?.nombre || '—'}</div>
      ),
    },
    {
      id: 'industrias',
      header: 'Industrias',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.original.industrias_asignadas && row.original.industrias_asignadas.length > 0 ? (
            row.original.industrias_asignadas.map((asig) => (
              <Badge key={asig.id} variant="secondary" className="text-xs">
                {asig.industria?.nombre}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Sin asignar</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'orden',
      header: 'Orden',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.getValue('orden')}
        </Badge>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.getValue('estado')} />,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const servicio = row.original

        if (servicio.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(servicio)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="servicios.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarServicio(servicio)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="servicios.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(servicio)}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </RequirePermission>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader empresa={empresa} />

      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Breadcrumbs
          items={[
            { label: 'Aplicaciones' },
            { label: 'Servicios' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Servicios</h2>
            <p className="text-muted-foreground">
              Gestiona los servicios ofrecidos por la empresa
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="servicios.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="servicios.create">
              <Button onClick={handleNuevoServicio}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Servicio
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredServicios}
          searchKey="nombre"
          searchPlaceholder="Buscar servicios..."
        />

        <ServicioForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          servicioEditar={servicioEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este servicio?"
          description={`Se marcará como eliminado el servicio "${servicioEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}