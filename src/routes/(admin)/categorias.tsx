import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CategoriaForm } from '@/features/categorias/components/categoria-form'
import {
  eliminarCategoria,
  getCategorias,
  restaurarCategoria,
} from '@/features/categorias/services/categoria.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Categoria } from '@/types/categoria'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Tag, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/categorias')({
  loader: async () => {
    const [categorias, empresaResult] = await Promise.all([
      getCategorias(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      categorias,
      empresa: empresaResult.data || null,
    }
  },
  component: CategoriasPage,
})

function CategoriasPage() {
  const { categorias, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [categoriaEditar, setCategoriaEditar] = useState<Categoria | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [categoriaEliminar, setCategoriaEliminar] = useState<Categoria | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar según permisos
  const filteredCategorias = categorias.filter((c: Categoria) => {
    if (c.estado === 'eliminado') {
      return showDeleted && hasPermission('categorias.view_deleted')
    }
    return true
  })

  const handleNuevaCategoria = () => {
    setCategoriaEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarCategoria = (categoria: Categoria) => {
    setCategoriaEditar(categoria)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (categoria: Categoria) => {
    setCategoriaEliminar(categoria)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!categoriaEliminar) return
    setIsDeleting(true)
    try {
      await eliminarCategoria(categoriaEliminar.id)
      setIsDeleteOpen(false)
      setCategoriaEliminar(null)
      navigate({ to: '/categorias', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la categoría')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (categoria: Categoria) => {
    try {
      await restaurarCategoria(categoria.id)
      navigate({ to: '/categorias', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar la categoría')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setCategoriaEditar(null)
    navigate({ to: '/categorias', replace: true })
  }

  const columns: ColumnDef<Categoria>[] = [
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
            <Tag className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Categoría',
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
      accessorKey: 'producto',
      header: 'Producto',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.producto?.nombre || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'uso',
      header: 'Uso',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.getValue('uso') || '—'}
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
        const categoria = row.original

        if (categoria.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(categoria)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="categorias.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarCategoria(categoria)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="categorias.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(categoria)}
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
            { label: 'Categorías' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Categorías</h2>
            <p className="text-muted-foreground">
              Gestiona las categorías asociadas a cada producto
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="categorias.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="categorias.create">
              <Button onClick={handleNuevaCategoria}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredCategorias}
          searchKey="nombre"
          searchPlaceholder="Buscar categorías..."
        />

        <CategoriaForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          categoriaEditar={categoriaEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar esta categoría?"
          description={`Se marcará como eliminada la categoría "${categoriaEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}