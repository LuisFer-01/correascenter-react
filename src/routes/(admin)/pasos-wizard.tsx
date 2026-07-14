import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PasoWizardForm } from '@/features/pasos-wizard/components/paso-wizard-form'
import {
  eliminarPasoWizard,
  getPasosWizard,
  restaurarPasoWizard,
} from '@/features/pasos-wizard/services/paso-wizard.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { PasoWizard } from '@/types/pasos-wizard'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Trash2, Wand2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/pasos-wizard')({
  loader: async () => {
    const [pasos, empresaResult] = await Promise.all([
      getPasosWizard(true),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      pasos,
      empresa: empresaResult.data || null,
    }
  },
  component: PasosWizardPage,
})

function PasosWizardPage() {
  const { pasos, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pasoEditar, setPasoEditar] = useState<PasoWizard | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [pasoEliminar, setPasoEliminar] = useState<PasoWizard | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar según permisos
  const filteredPasos = pasos.filter((p: PasoWizard) => {
    if (p.estado === 'eliminado') {
      return showDeleted && hasPermission('wizard.view_deleted')
    }
    return true
  })

  const handleNuevoPaso = () => {
    setPasoEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarPaso = (paso: PasoWizard) => {
    setPasoEditar(paso)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (paso: PasoWizard) => {
    setPasoEliminar(paso)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!pasoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarPasoWizard(pasoEliminar.id)
      setIsDeleteOpen(false)
      setPasoEliminar(null)
      navigate({ to: '/pasos-wizard', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el paso')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (paso: PasoWizard) => {
    try {
      await restaurarPasoWizard(paso.id)
      navigate({ to: '/pasos-wizard', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el paso')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setPasoEditar(null)
    navigate({ to: '/pasos-wizard', replace: true })
  }

  const columns: ColumnDef<PasoWizard>[] = [
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
      accessorKey: 'titulo',
      header: 'Paso',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-muted-foreground" />
            {row.getValue('titulo')}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {row.original.identificador}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'fuente_datos',
      header: 'Fuente',
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {row.getValue('fuente_datos')}
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
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.getValue('estado')} />,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const paso = row.original

        if (paso.estado === 'eliminado') {
          return (
            <Button variant="outline" size="sm" onClick={() => handleRestaurar(paso)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="wizard.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarPaso(paso)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>

            <RequirePermission permission="wizard.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(paso)}
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
            { label: 'Pasos Wizard' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Pasos del Wizard</h2>
            <p className="text-muted-foreground">
              Configura los pasos del asistente de selección para clientes
            </p>
          </div>
          <div className="flex gap-2">
            <RequirePermission permission="wizard.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>

            <RequirePermission permission="wizard.create">
              <Button onClick={handleNuevoPaso}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Paso
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredPasos}
          searchKey="titulo"
          searchPlaceholder="Buscar pasos del wizard..."
        />

        <PasoWizardForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          pasoEditar={pasoEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este paso del wizard?"
          description={`Se marcará como eliminado el paso "${pasoEliminar?.titulo}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}