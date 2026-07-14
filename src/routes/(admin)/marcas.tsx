import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarcaForm } from '@/features/marcas/components/marca-form'
import {
  eliminarMarca,
  getMarcas,
  restaurarMarca,
} from '@/features/marcas/services/marca.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Marca } from '@/types/marca'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/marcas')({
  loader: async () => {
    const [marcas, empresaResult] = await Promise.all([
      getMarcas(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      marcas,
      empresa: empresaResult.data || null,
    }
  },
  component: MarcasPage,
})

function MarcasPage() {
  const { marcas, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [marcaEditar, setMarcaEditar] = useState<Marca | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [marcaEliminar, setMarcaEliminar] = useState<Marca | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar según permisos
  const filteredMarcas = marcas.filter((m: Marca) => {
    if (m.estado === 'eliminado') {
      return showDeleted && hasPermission('marcas.view_deleted')
    }
    return true
  })

  const handleNuevaMarca = () => {
    setMarcaEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarMarca = (marca: Marca) => {
    setMarcaEditar(marca)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (marca: Marca) => {
    setMarcaEliminar(marca)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!marcaEliminar) return
    setIsDeleting(true)
    try {
      await eliminarMarca(marcaEliminar.id)
      setIsDeleteOpen(false)
      setMarcaEliminar(null)
      navigate({ to: '/marcas', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la marca')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (marca: Marca) => {
    try {
      await restaurarMarca(marca.id)
      navigate({ to: '/marcas', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar la marca')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setMarcaEditar(null)
    navigate({ to: '/marcas', replace: true })
  }

  const columns: ColumnDef<Marca>[] = [
    {
      accessorKey: 'logo',
      header: '',
      cell: ({ row }) => (
        <Avatar className="h-12 w-12 rounded-lg border bg-background">
          <AvatarImage
            src={row.original.logo}
            alt={row.original.nombre}
            className="object-contain p-1"
          />
          <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
            <Tag className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Marca',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('nombre')}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.slug}
          </div>
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
        const marca = row.original

        if (marca.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(marca)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="marcas.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarMarca(marca)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="marcas.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(marca)}
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
            { label: 'Marcas' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Marcas</h2>
            <p className="text-muted-foreground">
              Gestiona las marcas asociadas a los productos
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="marcas.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="marcas.create">
              <Button onClick={handleNuevaMarca}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Marca
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMarcas}
          searchKey="nombre"
          searchPlaceholder="Buscar marcas..."
        />

        <MarcaForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          marcaEditar={marcaEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar esta marca?"
          description={`Se marcará como eliminada la marca "${marcaEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}