import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EmpresaForm } from '@/features/empresas/components/empresa-form'
import {
  eliminarEmpresa,
  getEmpresas,
  restaurarEmpresa,
} from '@/features/empresas/services/empresa.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/types/empresa'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Building2, Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/empresas')({
  loader: async () => {
    const [empresas, empresaResult] = await Promise.all([
      getEmpresas(true), // Incluir eliminados
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      empresas,
      empresa: empresaResult.data || null,
    }
  },
  component: EmpresasPage,
})

function EmpresasPage() {
  const { empresas, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [empresaEditar, setEmpresaEditar] = useState<Empresa | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [empresaEliminar, setEmpresaEliminar] = useState<Empresa | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar empresas según permisos
  const filteredEmpresas = empresas.filter((e: Empresa) => {
    if (e.estado === 'eliminado') {
      // Solo mostrar eliminados si tiene el permiso
      return showDeleted && hasPermission('empresas.view_deleted')
    }
    return true
  })

  const handleNuevaEmpresa = () => {
    setEmpresaEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarEmpresa = (empresa: Empresa) => {
    setEmpresaEditar(empresa)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (empresa: Empresa) => {
    setEmpresaEliminar(empresa)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!empresaEliminar) return
    setIsDeleting(true)
    try {
      await eliminarEmpresa(empresaEliminar.id)
      setIsDeleteOpen(false)
      setEmpresaEliminar(null)
      navigate({ to: '/empresas', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la empresa')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (empresa: Empresa) => {
    try {
      await restaurarEmpresa(empresa.id)
      navigate({ to: '/empresas', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar la empresa')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setEmpresaEditar(null)
    navigate({ to: '/empresas', replace: true })
  }

  const columns: ColumnDef<Empresa>[] = [
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
            <Building2 className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('nombre')}</div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.getValue('estado')} />,
    },
    {
      accessorKey: 'creado_en',
      header: 'Creado',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('creado_en')).toLocaleDateString('es-BO')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const empresa = row.original
        
        if (empresa.estado === 'eliminado') {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestaurar(empresa)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            {/* Usar el slug correcto: empresa.update (sin 's') */}
            <RequirePermission permission="empresa.update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditarEmpresa(empresa)}
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>
            
            {/* Usar el slug correcto: empresa.delete (sin 's') */}
            <RequirePermission permission="empresa.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(empresa)}
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
      {/* Header SIEMPRE con los datos de la empresa */}
      <AdminHeader empresa={empresa} />
      
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Breadcrumbs
          items={[
            { label: 'Catálogo Base' },
            { label: 'Empresas' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Empresas</h2>
            <p className="text-muted-foreground">
              Gestiona las empresas del sistema y sus logos corporativos.
            </p>
          </div>
          <div className="flex gap-2">
            {/* Botón para ver eliminados - Solo si tiene permiso */}
            <RequirePermission permission="empresas.view_deleted">
              <Button
                variant={showDeleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminadas' : 'Ver Eliminadas'}
              </Button>
            </RequirePermission>

            {/* Usar el slug correcto: empresa.create (sin 's') */}
            <RequirePermission permission="empresa.create">
              <Button onClick={handleNuevaEmpresa}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Empresa
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredEmpresas}
          searchKey="nombre"
          searchPlaceholder="Buscar empresas..."
        />

        <EmpresaForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          empresaEditar={empresaEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar esta empresa?"
          description={`Se marcará como eliminada la empresa "${empresaEliminar?.nombre}". El registro se mantendrá en la base de datos para auditoría.`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}