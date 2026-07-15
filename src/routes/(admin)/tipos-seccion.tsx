import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TipoSeccionForm } from '@/features/contenidos/components/tipo-seccion-form'
import {
  eliminarTipoSeccion,
  getTiposSeccion,
  restaurarTipoSeccion,
} from '@/features/contenidos/services/tipo-seccion.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { TipoSeccion } from '@/types/contenido'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Trash2, Type } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/tipos-seccion')({
  loader: async () => {
    const [tipos, empresaResult] = await Promise.all([
      getTiposSeccion(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      tipos,
      empresa: empresaResult.data || null,
    }
  },
  component: TiposSeccionPage,
})

function TiposSeccionPage() {
  const { tipos, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [tipoEditar, setTipoEditar] = useState<TipoSeccion | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [tipoEliminar, setTipoEliminar] = useState<TipoSeccion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  const filteredTipos = tipos.filter((t: TipoSeccion) => {
    if (t.estado === 'eliminado') {
      return showDeleted && hasPermission('tipo_seccion.view_deleted')
    }
    return true
  })

  const handleNuevoTipo = () => {
    setTipoEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarTipo = (tipo: TipoSeccion) => {
    setTipoEditar(tipo)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (tipo: TipoSeccion) => {
    setTipoEliminar(tipo)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!tipoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarTipoSeccion(tipoEliminar.id)
      setIsDeleteOpen(false)
      setTipoEliminar(null)
      navigate({ to: '/tipos-seccion', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el tipo de sección')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (tipo: TipoSeccion) => {
    try {
      await restaurarTipoSeccion(tipo.id)
      navigate({ to: '/tipos-seccion', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el tipo de sección')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setTipoEditar(null)
    navigate({ to: '/tipos-seccion', replace: true })
  }

  const columns: ColumnDef<TipoSeccion>[] = [
    {
      accessorKey: 'nombre',
      header: 'Tipo de Sección',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            {row.getValue('nombre')}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.slug}
          </div>
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
      id: 'campos_metadata',
      header: 'Campos Dinámicos',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.original.campos_metadata && row.original.campos_metadata.length > 0 ? (
            row.original.campos_metadata.map((campo) => (
              <Badge key={campo} variant="outline" className="font-mono text-xs">
                {campo}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Sin campos</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'icono',
      header: 'Icono',
      cell: ({ row }) => (
        <div className="text-sm font-mono">
          {row.getValue('icono') || '—'}
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
        const tipo = row.original

        if (tipo.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(tipo)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="tipo_seccion.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarTipo(tipo)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="tipo_seccion.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(tipo)}
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
            { label: 'Contenido Web' },
            { label: 'Tipos de Sección' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tipos de Sección</h2>
            <p className="text-muted-foreground">
              Define los tipos de secciones del sitio (Hero, Diferencial, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="tipo_seccion.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="tipo_seccion.create">
              <Button onClick={handleNuevoTipo}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Tipo
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredTipos}
          searchKey="nombre"
          searchPlaceholder="Buscar tipos de sección..."
        />

        <TipoSeccionForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          tipoEditar={tipoEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este tipo de sección?"
          description={`Se marcará como eliminado el tipo "${tipoEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}