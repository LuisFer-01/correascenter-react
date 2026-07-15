import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AtributoForm } from '@/features/atributos/components/atributo-form'
import {
  eliminarAtributo,
  getAtributos,
  restaurarAtributo,
} from '@/features/atributos/services/atributo.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { AtributoTecnico } from '@/types/atributo'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/atributos')({
  loader: async () => {
    const [atributos, empresaResult] = await Promise.all([
      getAtributos(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      atributos,
      empresa: empresaResult.data || null,
    }
  },
  component: AtributosPage,
})

function AtributosPage() {
  const { atributos, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [atributoEditar, setAtributoEditar] = useState<AtributoTecnico | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [atributoEliminar, setAtributoEliminar] = useState<AtributoTecnico | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar según permisos
  const filteredAtributos = atributos.filter((a: AtributoTecnico) => {
    if (a.estado === 'eliminado') {
      return showDeleted && hasPermission('atributos.view_deleted')
    }
    return true
  })

  const handleNuevoAtributo = () => {
    setAtributoEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarAtributo = (atributo: AtributoTecnico) => {
    setAtributoEditar(atributo)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (atributo: AtributoTecnico) => {
    setAtributoEliminar(atributo)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!atributoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarAtributo(atributoEliminar.id)
      setIsDeleteOpen(false)
      setAtributoEliminar(null)
      navigate({ to: '/atributos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el atributo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (atributo: AtributoTecnico) => {
    try {
      await restaurarAtributo(atributo.id)
      navigate({ to: '/atributos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el atributo')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setAtributoEditar(null)
    navigate({ to: '/atributos', replace: true })
  }

  const columns: ColumnDef<AtributoTecnico>[] = [
    {
      accessorKey: 'nombre',
      header: 'Atributo',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {row.getValue('nombre')}
          </div>
          {row.original.tipo_atributo && (
            <div className="text-xs text-muted-foreground">
              Tipo: {row.original.tipo_atributo.nombre}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'tipo_atributo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.tipo_atributo?.nombre || '—'}
        </Badge>
      ),
    },
    {
      id: 'categorias',
      header: 'Categorías',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.original.categorias && row.original.categorias.length > 0 ? (
            row.original.categorias.map((categoria) => (
              <Badge key={categoria.id} variant="secondary" className="text-xs">
                {categoria.nombre}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Sin asignar</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'valor_numerico',
      header: 'Valor',
      cell: ({ row }) => {
        const valor = row.getValue('valor_numerico') as number | null
        const unidad = row.original.unidad_medida
        if (!valor) return <span className="text-muted-foreground">—</span>
        return (
          <div className="font-mono text-sm">
            {valor} {unidad && <span className="text-muted-foreground">{unidad}</span>}
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
        const atributo = row.original

        if (atributo.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(atributo)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="atributos.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarAtributo(atributo)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="atributos.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(atributo)}
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
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Atributos Técnicos</h2>
            <p className="text-muted-foreground">
              Gestiona los atributos técnicos de productos (características, medidas, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="atributos.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="atributos.create">
              <Button onClick={handleNuevoAtributo}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Atributo
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredAtributos}
          searchKey="nombre"
          searchPlaceholder="Buscar atributos técnicos..."
        />

        <AtributoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          atributoEditar={atributoEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este atributo?"
          description={`Se marcará como eliminado el atributo "${atributoEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}