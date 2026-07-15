import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MenuForm } from '@/features/menus/components/menu-form'
import { MenuItemForm } from '@/features/menus/components/menu-item-form'
import {
    eliminarMenu,
    eliminarMenuItem,
    getMenus,
    restaurarMenu,
} from '@/features/menus/services/menu.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Menu } from '@/types/menu'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, FileText, FolderOpen, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/menus')({
  loader: async () => {
    const [menus, empresaResult] = await Promise.all([
      getMenus(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      menus,
      empresa: empresaResult.data || null,
    }
  },
  component: MenusPage,
})

function MenusPage() {
  const { menus, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false)
  const [isMenuItemFormOpen, setIsMenuItemFormOpen] = useState(false)
  const [menuEditar, setMenuEditar] = useState<Menu | null>(null)
  const [menuItemSelected, setMenuItemSelected] = useState<number | null>(null)
  const [menuItemEditar, setMenuItemEditar] = useState<any>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [menuEliminar, setMenuEliminar] = useState<Menu | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  const filteredMenus = menus.filter((m: Menu) => {
    if (m.estado === 'eliminado') {
      return showDeleted && hasPermission('menus.view_deleted')
    }
    return true
  })

  const handleNuevoMenu = () => {
    setMenuEditar(null)
    setIsMenuFormOpen(true)
  }

  const handleEditarMenu = (menu: Menu) => {
    setMenuEditar(menu)
    setIsMenuFormOpen(true)
  }

  const handleAgregarItem = (menuId: number) => {
    setMenuItemSelected(menuId)
    setMenuItemEditar(null)
    setIsMenuItemFormOpen(true)
  }

  const handleEditarItem = (menuId: number, item: any) => {
    setMenuItemSelected(menuId)
    setMenuItemEditar(item)
    setIsMenuItemFormOpen(true)
  }

  const handleEliminarClick = (menu: Menu) => {
    setMenuEliminar(menu)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!menuEliminar) return
    setIsDeleting(true)
    try {
      await eliminarMenu(menuEliminar.id)
      setIsDeleteOpen(false)
      setMenuEliminar(null)
      navigate({ to: '/menus', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el menú')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEliminarItem = async (menuId: number, itemId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta subcategoría?')) return
    try {
      await eliminarMenuItem(itemId)
      navigate({ to: '/menus', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la subcategoría')
    }
  }

  const handleRestaurar = async (menu: Menu) => {
    try {
      await restaurarMenu(menu.id)
      navigate({ to: '/menus', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el menú')
    }
  }

  const handleSuccess = () => {
    setIsMenuFormOpen(false)
    setIsMenuItemFormOpen(false)
    setMenuEditar(null)
    setMenuItemEditar(null)
    setMenuItemSelected(null)
    navigate({ to: '/menus', replace: true })
  }

  const columns: ColumnDef<Menu>[] = [
    {
      accessorKey: 'grupo',
      header: 'Menú Principal',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {row.original.tipo_registro === 'producto' && <FolderOpen className="h-4 w-4 text-muted-foreground" />}
            {row.original.tipo_registro === 'industria' && <FileText className="h-4 w-4 text-muted-foreground" />}
            {row.original.tipo_registro === 'servicio' && <FileText className="h-4 w-4 text-muted-foreground" />}
            {row.getValue('grupo')}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.ruta}
          </div>
        </div>
      ),
    },
    {
      id: 'tipo_registro',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.tipo_registro}
        </Badge>
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
      id: 'menu_items',
      header: 'Subcategorías',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.original.menu_items && row.original.menu_items.length > 0 ? (
            row.original.menu_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground truncate flex-1">{item.ruta}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleEditarItem(row.original.id, item)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive"
                    onClick={() => handleEliminarItem(row.original.id, item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Sin subcategorías</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs mt-1"
            onClick={() => handleAgregarItem(row.original.id)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar
          </Button>
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
        const menu = row.original

        if (menu.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(menu)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="menus.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarMenu(menu)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="menus.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(menu)}
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
            { label: 'Menús' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Menús de Navegación</h2>
            <p className="text-muted-foreground">
              Gestiona los menús principales y sus subcategorías
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="menus.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="menus.create">
              <Button onClick={handleNuevoMenu}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Menú
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMenus}
          searchKey="grupo"
          searchPlaceholder="Buscar menús..."
        />

        <MenuForm
          open={isMenuFormOpen}
          onOpenChange={setIsMenuFormOpen}
          menuEditar={menuEditar}
          onSuccess={handleSuccess}
        />

        {menuItemSelected && (
          <MenuItemForm
            open={isMenuItemFormOpen}
            onOpenChange={setIsMenuItemFormOpen}
            menuId={menuItemSelected}
            menuItemEditar={menuItemEditar}
            onSuccess={handleSuccess}
          />
        )}

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este menú?"
          description={`Se marcará como eliminado el menú "${menuEliminar?.grupo}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}