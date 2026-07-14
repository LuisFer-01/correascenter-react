import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SucursalForm } from '@/features/sucursales/components/sucursal-form'
import {
  eliminarSucursal,
  getSucursales,
  restaurarSucursal,
} from '@/features/sucursales/services/sucursal.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Sucursal } from '@/types/sucursal'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, MapPin, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/sucursales')({
  loader: async () => {
    const [sucursales, empresaResult] = await Promise.all([
      getSucursales(true), // Incluir eliminados
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return { 
      sucursales, 
      empresa: empresaResult.data || null,
    }
  },
  component: SucursalesPage,
})

function SucursalesPage() {
  const { sucursales, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [sucursalEditar, setSucursalEditar] = useState<Sucursal | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [sucursalEliminar, setSucursalEliminar] = useState<Sucursal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar sucursales según permisos
  const filteredSucursales = sucursales.filter((s: Sucursal) => {
    if (s.estado === 'eliminado') {
      // Solo mostrar eliminados si tiene el permiso
      return showDeleted && hasPermission('sucursales.view_deleted')
    }
    return true
  })

  const handleNuevaSucursal = () => {
    setSucursalEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarSucursal = (sucursal: Sucursal) => {
    setSucursalEditar(sucursal)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (sucursal: Sucursal) => {
    setSucursalEliminar(sucursal)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!sucursalEliminar) return
    setIsDeleting(true)
    try {
      await eliminarSucursal(sucursalEliminar.id)
      setIsDeleteOpen(false)
      setSucursalEliminar(null)
      navigate({ to: '/sucursales', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la sucursal')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (sucursal: Sucursal) => {
    try {
      await restaurarSucursal(sucursal.id)
      navigate({ to: '/sucursales', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar la sucursal')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setSucursalEditar(null)
    navigate({ to: '/sucursales', replace: true })
  }

  const columns: ColumnDef<Sucursal>[] = [
    {
      accessorKey: 'nombre',
      header: 'Sucursal',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {row.original.nombre}
            {row.original.es_principal && (
              <Badge variant="default" className="bg-primary text-primary-foreground text-[10px]">
                Principal
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" /> {row.original.direccion}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
      cell: ({ row }) => <div className="text-sm">{row.getValue('telefono')}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue('email') || '-'}</div>,
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
        const sucursal = row.original
        
        if (sucursal.estado === 'eliminado') {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestaurar(sucursal)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="sucursales.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarSucursal(sucursal)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>
            
            <RequirePermission permission="sucursales.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(sucursal)}
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
      {/* Header SIEMPRE con los datos de la empresa */}
      <AdminHeader empresa={empresa} />
      
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Breadcrumbs
          items={[
            { label: 'Catálogo Base' },
            { label: 'Sucursales' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sucursales</h2>
            <p className="text-muted-foreground">
              Gestiona las sedes, direcciones y datos de contacto.
            </p>
          </div>
          <div className="flex gap-2">
            {/* Botón para ver eliminados - Solo si tiene permiso */}
            <RequirePermission permission="sucursales.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminadas' : 'Ver Eliminadas'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="sucursales.create">
              <Button onClick={handleNuevaSucursal}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Sucursal
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredSucursales}
          searchKey="nombre"
          searchPlaceholder="Buscar sucursales..."
        />

        <SucursalForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          sucursalEditar={sucursalEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar esta sucursal?"
          description={`Se marcará como eliminada la sucursal "${sucursalEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}