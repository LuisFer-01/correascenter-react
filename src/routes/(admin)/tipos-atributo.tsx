import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TipoAtributoForm } from '@/features/atributos/components/tipo-atributo-form'
import {
  eliminarTipoAtributo,
  getTiposAtributo,
  restaurarTipoAtributo,
} from '@/features/atributos/services/tipo-atributo.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { TipoAtributo } from '@/types/tipo-atributo'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/tipos-atributo')({
  loader: async () => {
    const [tipos, empresaResult] = await Promise.all([
      getTiposAtributo(true),
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
  component: TiposAtributoPage,
})

function TiposAtributoPage() {
  const { tipos, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [tipoEditar, setTipoEditar] = useState<TipoAtributo | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [tipoEliminar, setTipoEliminar] = useState<TipoAtributo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar según permisos
  const filteredTipos = tipos.filter((t: TipoAtributo) => {
    if (t.estado === 'eliminado') {
      return showDeleted && hasPermission('tipos_atributo.view_deleted')
    }
    return true
  })

  const handleNuevoTipo = () => {
    setTipoEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarTipo = (tipo: TipoAtributo) => {
    setTipoEditar(tipo)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (tipo: TipoAtributo) => {
    setTipoEliminar(tipo)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!tipoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarTipoAtributo(tipoEliminar.id)
      setIsDeleteOpen(false)
      setTipoEliminar(null)
      navigate({ to: '/tipos-atributo', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el tipo de atributo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (tipo: TipoAtributo) => {
    try {
      await restaurarTipoAtributo(tipo.id)
      navigate({ to: '/tipos-atributo', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el tipo de atributo')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setTipoEditar(null)
    navigate({ to: '/tipos-atributo', replace: true })
  }

  const columns: ColumnDef<TipoAtributo>[] = [
    {
      accessorKey: 'nombre',
      header: 'Tipo de Atributo',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
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
      id: 'opciones',
      header: 'Opciones',
      cell: ({ row }) => {
        const tipo = row.original
        return (
          <div className="flex flex-wrap gap-1">
            {tipo.permite_descripcion && (
              <Badge variant="outline" className="text-xs">Descripción</Badge>
            )}
            {tipo.permite_valor_numerico && (
              <Badge variant="outline" className="text-xs">Numérico</Badge>
            )}
            {tipo.permite_unidad_medida && (
              <Badge variant="outline" className="text-xs">Unidad</Badge>
            )}
          </div>
        )
      },
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
            <RequirePermission permission="tipos_atributo.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarTipo(tipo)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="tipos_atributo.delete">
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
            { label: 'Catálogo' },
            { label: 'Atributos Técnicos' },
            { label: 'Tipos de Atributo' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tipos de Atributo</h2>
            <p className="text-muted-foreground">
              Define los tipos de atributos técnicos (características, medidas, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="tipos_atributo.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="tipos_atributo.create">
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
          searchPlaceholder="Buscar tipos de atributo..."
        />

        <TipoAtributoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          tipoEditar={tipoEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este tipo de atributo?"
          description={`Se marcará como eliminado el tipo "${tipoEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}