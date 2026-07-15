import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IndustriaForm } from '@/features/industrias/components/industria-form'
import {
  eliminarIndustria,
  getIndustrias,
  restaurarIndustria,
} from '@/features/industrias/services/industria.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Industria } from '@/types/industria'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Factory, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/industrias')({
  loader: async () => {
    const [industrias, empresaResult] = await Promise.all([
      getIndustrias(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      industrias,
      empresa: empresaResult.data || null,
    }
  },
  component: IndustriasPage,
})

function IndustriasPage() {
  const { industrias, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [industriaEditar, setIndustriaEditar] = useState<Industria | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [industriaEliminar, setIndustriaEliminar] = useState<Industria | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  const filteredIndustrias = industrias.filter((i: Industria) => {
    if (i.estado === 'eliminado') {
      return showDeleted && hasPermission('industrias.view_deleted')
    }
    return true
  })

  const handleNuevaIndustria = () => {
    setIndustriaEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarIndustria = (industria: Industria) => {
    setIndustriaEditar(industria)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (industria: Industria) => {
    setIndustriaEliminar(industria)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!industriaEliminar) return
    setIsDeleting(true)
    try {
      await eliminarIndustria(industriaEliminar.id)
      setIsDeleteOpen(false)
      setIndustriaEliminar(null)
      navigate({ to: '/industrias', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la industria')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (industria: Industria) => {
    try {
      await restaurarIndustria(industria.id)
      navigate({ to: '/industrias', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar la industria')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setIndustriaEditar(null)
    navigate({ to: '/industrias', replace: true })
  }

  const columns: ColumnDef<Industria>[] = [
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
            <Factory className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Industria/Aplicación',
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
      id: 'asignaciones',
      header: 'Asignaciones',
      cell: ({ row }) => {
        const asignaciones = row.original.asignaciones || []
        const categorias = asignaciones.filter(a => a.tipo_registro === 'categoria')
        const servicios = asignaciones.filter(a => a.tipo_registro === 'servicio')
        
        return (
          <div className="flex flex-col gap-1">
            {categorias.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categorias.map((asig) => (
                  <Badge key={asig.id} variant="secondary" className="text-xs">
                    {asig.categoria?.nombre}
                  </Badge>
                ))}
              </div>
            )}
            {servicios.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {servicios.map((asig) => (
                  <Badge key={asig.id} variant="outline" className="text-xs">
                    {asig.servicio?.nombre}
                  </Badge>
                ))}
              </div>
            )}
            {asignaciones.length === 0 && (
              <span className="text-sm text-muted-foreground">Sin asignar</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.empresa?.nombre || '—'}</div>
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
        const industria = row.original

        if (industria.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(industria)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="industrias.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarIndustria(industria)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="industrias.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(industria)}
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
            { label: 'Aplicaciones' },
            { label: 'Industrias' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Industrias / Aplicaciones</h2>
            <p className="text-muted-foreground">
              Gestiona las industrias y campos de aplicación de los productos
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="industrias.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="industrias.create">
              <Button onClick={handleNuevaIndustria}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Industria
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredIndustrias}
          searchKey="nombre"
          searchPlaceholder="Buscar industrias..."
        />

        <IndustriaForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          industriaEditar={industriaEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar esta industria?"
          description={`Se marcará como eliminada la industria "${industriaEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}