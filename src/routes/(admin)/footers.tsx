import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FooterForm } from '@/features/footers/components/footer-form'
import {
  eliminarFooter,
  getFooters,
  restaurarFooter,
} from '@/features/footers/services/footer.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Footer } from '@/types/footer'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/footers')({
  loader: async () => {
    const [footers, empresaResult] = await Promise.all([
      getFooters(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      footers,
      empresa: empresaResult.data || null,
    }
  },
  component: FootersPage,
})

function FootersPage() {
  const { footers, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [footerEditar, setFooterEditar] = useState<Footer | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [footerEliminar, setFooterEliminar] = useState<Footer | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  const filteredFooters = footers.filter((f: Footer) => {
    if (f.estado === 'eliminado') {
      return showDeleted && hasPermission('footers.view_deleted')
    }
    return true
  })

  const handleNuevoFooter = () => {
    setFooterEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarFooter = (footer: Footer) => {
    setFooterEditar(footer)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (footer: Footer) => {
    setFooterEliminar(footer)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!footerEliminar) return
    setIsDeleting(true)
    try {
      await eliminarFooter(footerEliminar.id)
      setIsDeleteOpen(false)
      setFooterEliminar(null)
      navigate({ to: '/footers', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el footer')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (footer: Footer) => {
    try {
      await restaurarFooter(footer.id)
      navigate({ to: '/footers', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el footer')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setFooterEditar(null)
    navigate({ to: '/footers', replace: true })
  }

  const columns: ColumnDef<Footer>[] = [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.getValue('tipo') as string
        const colors: Record<string, string> = {
          producto: 'bg-blue-100 text-blue-800',
          industria: 'bg-green-100 text-green-800',
          servicio: 'bg-orange-100 text-orange-800',
          red_social: 'bg-purple-100 text-purple-800',
        }
        return (
          <Badge className={colors[tipo] || 'bg-gray-100'}>
            {tipo === 'red_social' ? 'Red Social' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'tipo_registro',
      header: 'Tipo Registro',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue('tipo_registro') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'registro_id',
      header: 'Registro ID',
      cell: ({ row }) => (
        <div className="text-sm font-mono">
          {row.getValue('registro_id') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'titulo',
      header: 'Título',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue('titulo') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {row.getValue('url') || '—'}
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
      accessorKey: 'mostrar',
      header: 'Mostrar',
      cell: ({ row }) => (
        <Badge variant={row.getValue('mostrar') ? 'default' : 'secondary'}>
          {row.getValue('mostrar') ? 'Sí' : 'No'}
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
        const footer = row.original

        if (footer.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(footer)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="footers.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarFooter(footer)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="footers.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(footer)}
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
            { label: 'Footers' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Footers</h2>
            <p className="text-muted-foreground">
              Gestiona los elementos del pie de página del sitio
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="footers.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="footers.create">
              <Button onClick={handleNuevoFooter}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Footer
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredFooters}
          searchKey="titulo"
          searchPlaceholder="Buscar footers..."
        />

        <FooterForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          footerEditar={footerEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este footer?"
          description={`Se marcará como eliminado el footer "${footerEliminar?.titulo || 'sin título'}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}