import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ContenidoSeccionForm } from '@/features/contenidos/components/contenido-seccion-form'
import {
  eliminarContenidoSeccion,
  getContenidoSeccion,
  restaurarContenidoSeccion,
} from '@/features/contenidos/services/contenido-seccion.service'
// ✅ CORRECCIÓN: Importar getTiposSeccion desde su servicio correcto
import { getTiposSeccion } from '@/features/contenidos/services/tipo-seccion.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { ContenidoSeccion } from '@/types/contenido'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Image, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/secciones')({
  loader: async () => {
    const [contenidos, tipos, empresaResult] = await Promise.all([
      getContenidoSeccion(true),
      getTiposSeccion(), // ✅ Ahora usa la función del servicio correcto
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      contenidos,
      tipos,
      empresa: empresaResult.data || null,
    }
  },
  component: SeccionesPage,
})

function SeccionesPage() {
  const { contenidos, tipos, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [contenidoEditar, setContenidoEditar] = useState<ContenidoSeccion | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [contenidoEliminar, setContenidoEliminar] = useState<ContenidoSeccion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  const filteredContenidos = contenidos.filter((c: ContenidoSeccion) => {
    if (c.estado === 'eliminado') {
      return showDeleted && hasPermission('contenido.view_deleted')
    }
    return true
  })

  const handleNuevoContenido = () => {
    setContenidoEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarContenido = (contenido: ContenidoSeccion) => {
    setContenidoEditar(contenido)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (contenido: ContenidoSeccion) => {
    setContenidoEliminar(contenido)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!contenidoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarContenidoSeccion(contenidoEliminar.id)
      setIsDeleteOpen(false)
      setContenidoEliminar(null)
      navigate({ to: '/secciones', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el contenido')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (contenido: ContenidoSeccion) => {
    try {
      await restaurarContenidoSeccion(contenido.id)
      navigate({ to: '/secciones', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el contenido')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setContenidoEditar(null)
    navigate({ to: '/secciones', replace: true })
  }

  const columns: ColumnDef<ContenidoSeccion>[] = [
    {
      accessorKey: 'imagen',
      header: '',
      cell: ({ row }) => (
        <Avatar className="h-12 w-12 rounded-lg border bg-background">
          <AvatarImage
            src={row.original.imagen}
            alt={row.original.titulo || 'Imagen'}
            className="object-contain p-1"
          />
          <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
            <Image className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'titulo',
      header: 'Contenido',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('titulo') || 'Sin título'}</div>
          {row.original.subtitulo && (
            <div className="text-xs text-muted-foreground">{row.original.subtitulo}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'tipo_seccion',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.original.tipo_seccion?.nombre || '—'}
        </Badge>
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
      id: 'metadata',
      header: 'Metadata',
      cell: ({ row }) => {
        const metadata = row.original.metadata || {}
        const entries = Object.entries(metadata)
        if (entries.length === 0) return <span className="text-sm text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {entries.slice(0, 3).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="font-mono text-xs">
                {key}: {String(value).slice(0, 15)}
              </Badge>
            ))}
            {entries.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{entries.length - 3}
              </Badge>
            )}
          </div>
        )
      },
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
            <RequirePermission permission="contenido.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarContenido(contenido)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="contenido.delete">
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

      <div className="max-w-10xl mx-auto space-y-6 p-6">
        <Breadcrumbs
          items={[
            { label: 'Contenido Web' },
            { label: 'Secciones' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Secciones (Heroes, Diferenciales, etc.)</h2>
            <p className="text-muted-foreground">
              Gestiona el contenido de las secciones del sitio
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="contenido.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="contenido.create">
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
          searchPlaceholder="Buscar contenido..."
        />

        <ContenidoSeccionForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          tiposSeccion={tipos}
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