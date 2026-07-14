import { AdminHeader } from '#/components/layout/admin-header'
import { supabase } from '#/lib/supabase'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { RolForm } from '@/features/roles/components/rol-form'
import {
  eliminarRol,
  getPermisosAgrupados,
  getRoles,
} from '@/features/roles/services/rol.service'
import { usePermissions } from '@/hooks/usePermissions'
import type { Rol } from '@/types/rol'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, Shield, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/roles')({
  loader: async () => {
    const [roles, permisosAgrupados, empresaResult] = await Promise.all([
      getRoles(true),
      getPermisosAgrupados(),
      // Datos de la empresa (SIEMPRE incluir esto)
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return { roles, permisosAgrupados, empresa: empresaResult.data || null, }
  },
  component: RolesPage,
})

function RolesPage() {
  const { roles, permisosAgrupados, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [rolEditar, setRolEditar] = useState<Rol | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [rolEliminar, setRolEliminar] = useState<Rol | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  const filteredRoles = roles.filter((r) => {
    if (r.estado === 'eliminado') {
      return showDeleted && hasPermission('roles.manage')
    }
    return true
  })

  const handleNuevoRol = () => {
    setRolEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarRol = (rol: Rol) => {
    setRolEditar(rol)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (rol: Rol) => {
    setRolEliminar(rol)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!rolEliminar) return
    setIsDeleting(true)
    try {
      await eliminarRol(rolEliminar.id)
      setIsDeleteOpen(false)
      setRolEliminar(null)
      navigate({ to: '/roles', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el rol')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setRolEditar(null)
    navigate({ to: '/roles', replace: true })
  }

  const columns: ColumnDef<Rol>[] = [
    {
      accessorKey: 'nombre',
      header: 'Rol',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="font-medium">{row.getValue('nombre')}</div>
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            {row.original.slug}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-muted-foreground">
          {row.getValue('descripcion') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'permisos',
      header: 'Permisos',
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="font-medium">{row.original.permisos.length}</span>
          <span className="text-muted-foreground"> permisos asignados</span>
        </div>
      ),
    },
    {
      accessorKey: 'es_sistema',
      header: 'Tipo',
      cell: ({ row }) => (
        <div>
          {row.original.es_sistema ? (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              Sistema
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
              Personalizado
            </span>
          )}
        </div>
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
        const rol = row.original

        if (rol.estado === 'eliminado') {
          return null
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="roles.manage">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarRol(rol)}
                title="Editar"
                disabled={rol.es_sistema && !hasPermission('roles.manage')}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="roles.manage">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(rol)}
                title={rol.es_sistema ? 'No se puede eliminar roles de sistema' : 'Eliminar'}
                disabled={rol.es_sistema}
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
            { label: 'Gestión' },
            { label: 'Roles y Permisos' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Roles y Permisos</h2>
            <p className="text-muted-foreground">
              Gestiona los roles del sistema y sus permisos de acceso.
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="roles.manage">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="roles.manage">
              <Button onClick={handleNuevoRol}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Rol
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRoles}
          searchKey="nombre"
          searchPlaceholder="Buscar por nombre o slug..."
        />

        <RolForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          permisosAgrupados={permisosAgrupados}
          rolEditar={rolEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este rol?"
          description={`Se marcará como eliminado el rol "${rolEliminar?.nombre}". Los usuarios asignados a este rol perderán sus permisos.`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}