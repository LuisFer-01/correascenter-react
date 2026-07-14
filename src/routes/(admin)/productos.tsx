import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductoForm } from '@/features/productos/components/producto-form'
import {
  eliminarProducto,
  getProductos,
  restaurarProducto,
} from '@/features/productos/services/producto.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Producto } from '@/types/producto'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Package, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/productos')({
  loader: async () => {
    const [productos, empresaResult] = await Promise.all([
      getProductos(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      productos,
      empresa: empresaResult.data || null,
    }
  },
  component: ProductosPage,
})

function ProductosPage() {
  const { productos, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar según permisos
  const filteredProductos = productos.filter((p: Producto) => {
    if (p.estado === 'eliminado') {
      return showDeleted && hasPermission('productos.view_deleted')
    }
    return true
  })

  const handleNuevoProducto = () => {
    setProductoEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarProducto = (producto: Producto) => {
    setProductoEditar(producto)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (producto: Producto) => {
    setProductoEliminar(producto)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!productoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarProducto(productoEliminar.id)
      setIsDeleteOpen(false)
      setProductoEliminar(null)
      navigate({ to: '/productos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el producto')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (producto: Producto) => {
    try {
      await restaurarProducto(producto.id)
      navigate({ to: '/productos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el producto')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setProductoEditar(null)
    navigate({ to: '/productos', replace: true })
  }

  const columns: ColumnDef<Producto>[] = [
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
            <Package className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Producto',
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
      accessorKey: 'empresa',
      header: 'Empresa',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.empresa?.nombre || '—'}</div>
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
        const producto = row.original

        if (producto.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(producto)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="productos.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarProducto(producto)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="productos.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(producto)}
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
            { label: 'Productos' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
            <p className="text-muted-foreground">
              Gestiona el catálogo de productos del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="productos.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="productos.create">
              <Button onClick={handleNuevoProducto}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredProductos}
          searchKey="nombre"
          searchPlaceholder="Buscar productos..."
        />

        <ProductoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          productoEditar={productoEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este producto?"
          description={`Se marcará como eliminado el producto "${productoEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}