import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RegistroContenidoForm } from '@/features/registros/components/registro-contenido-form'
import {
  eliminarRegistroContenido,
  getRegistroContenidos,
  getRegistros,
  restaurarRegistroContenido,
} from '@/features/registros/services/registro.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { RegistroContenido } from '@/types/registro'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Trash2, Type } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/registros')({
  loader: async () => {
    const [contenidos, registros, empresaResult] = await Promise.all([
      getRegistroContenidos(true),
      getRegistros(),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      contenidos,
      registros,
      empresa: empresaResult.data || null,
    }
  },
  component: RegistrosPage,
})

function RegistrosPage() {
  const { contenidos, registros, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [contenidoEditar, setContenidoEditar] = useState<RegistroContenido | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [contenidoEliminar, setContenidoEliminar] = useState<RegistroContenido | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar según permisos
  const filteredContenidos = contenidos.filter((c: RegistroContenido) => {
    if (c.estado === 'eliminado') {
      return showDeleted && hasPermission('registros.view_deleted')
    }
    return true
  })

  const handleNuevoContenido = () => {
    setContenidoEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarContenido = (contenido: RegistroContenido) => {
    setContenidoEditar(contenido)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (contenido: RegistroContenido) => {
    setContenidoEliminar(contenido)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!contenidoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarRegistroContenido(contenidoEliminar.id)
      setIsDeleteOpen(false)
      setContenidoEliminar(null)
      navigate({ to: '/registros', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el contenido')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (contenido: RegistroContenido) => {
    try {
      await restaurarRegistroContenido(contenido.id)
      navigate({ to: '/registros', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el contenido')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setContenidoEditar(null)
    navigate({ to: '/registros', replace: true })
  }

  const columns: ColumnDef<RegistroContenido>[] = [
    {
      accessorKey: 'registro',
      header: 'Sección',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            {row.original.registro?.nombre || '—'}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.registro?.identificador}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'titulo',
      header: 'Título',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('titulo') || '—'}</div>
          {row.original.subtitulo && (
            <div className="text-xs text-muted-foreground">{row.original.subtitulo}</div>
          )}
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
      accessorKey: 'icono',
      header: 'Icono',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.getValue('icono') || '—'}
        </Badge>
      ),
    },
    {
      accessorKey: 'stats',
      header: 'Stats',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.getValue('stats') || '—'}
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
        const contenido = row.original

        if (contenido.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(contenido)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="registros.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarContenido(contenido)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="registros.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(contenido)}
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
            { label: 'Catálogo Base' },
            { label: 'Registros (About)' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Registros / About</h2>
            <p className="text-muted-foreground">
              Gestiona el contenido de las secciones del "Sobre Nosotros"
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="registros.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="registros.create">
              <Button onClick={handleNuevoContenido}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Contenido
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredContenidos}
          searchKey="titulo"
          searchPlaceholder="Buscar por título, sección o empresa..."
        />

        <RegistroContenidoForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          registros={registros}
          contenidoEditar={contenidoEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este contenido?"
          description={`Se marcará como eliminado el contenido "${contenidoEliminar?.titulo || 'sin título'}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}