import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  activarSuscriptor,
  desactivarSuscriptor,
  eliminarSuscriptor,
  exportarSuscriptoresCSV,
  getSuscriptores,
  getSuscriptoresStats,
  restaurarSuscriptor,
  verificarEmail,
} from '@/features/suscriptores/services/suscriptor.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { EstadoSuscriptor, Suscriptor } from '@/types/suscriptor'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Download, Eye, Mail, RotateCcw, Trash2, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/suscriptores')({
  loader: async () => {
    const [suscriptores, stats, empresaResult] = await Promise.all([
      getSuscriptores(false),
      getSuscriptoresStats(),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      suscriptores,
      stats,
      empresa: empresaResult.data || null,
    }
  },
  component: SuscriptoresPage,
})

function SuscriptoresPage() {
  const { suscriptores, stats, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [showDeleted, setShowDeleted] = useState(false)
  const [suscriptorEliminar, setSuscriptorEliminar] = useState<Suscriptor | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredSuscriptores = suscriptores.filter((s: Suscriptor) => {
    if (filtroEstado !== 'todos' && s.estado !== filtroEstado) {
      return false
    }
    return true
  })

  const handleActivar = async (id: number) => {
    try {
      await activarSuscriptor(id)
      navigate({ to: '/suscriptores', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al activar el suscriptor')
    }
  }

  const handleDesactivar = async (id: number) => {
    try {
      await desactivarSuscriptor(id)
      navigate({ to: '/suscriptores', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al desactivar el suscriptor')
    }
  }

  const handleVerificarEmail = async (id: number) => {
    try {
      await verificarEmail(id)
      navigate({ to: '/suscriptores', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al verificar el email')
    }
  }

  const handleEliminarClick = (suscriptor: Suscriptor) => {
    setSuscriptorEliminar(suscriptor)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!suscriptorEliminar) return
    setIsDeleting(true)
    try {
      await eliminarSuscriptor(suscriptorEliminar.id)
      setIsDeleteOpen(false)
      setSuscriptorEliminar(null)
      navigate({ to: '/suscriptores', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el suscriptor')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (id: number) => {
    try {
      await restaurarSuscriptor(id)
      navigate({ to: '/suscriptores', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el suscriptor')
    }
  }

  const handleExportarCSV = async () => {
    try {
      const estado = filtroEstado === 'todos' ? undefined : (filtroEstado as EstadoSuscriptor)
      const blob = await exportarSuscriptoresCSV(estado)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `suscriptores_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || 'Error al exportar CSV')
    }
  }

  const getEstadoColor = (estado: EstadoSuscriptor) => {
    const colors = {
      activo: 'bg-green-100 text-green-800 border-green-200',
      inactivo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      eliminado: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[estado] || colors.activo
  }

  const getEstadoLabel = (estado: EstadoSuscriptor) => {
    const labels = {
      activo: 'Activo',
      inactivo: 'Inactivo',
      eliminado: 'Eliminado',
    }
    return labels[estado] || estado
  }

  const columns: ColumnDef<Suscriptor>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {row.getValue('email')}
          </div>
          {row.original.nombre && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {row.original.nombre}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.empresa?.nombre || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={getEstadoColor(row.getValue('estado') as EstadoSuscriptor)}
        >
          {getEstadoLabel(row.getValue('estado') as EstadoSuscriptor)}
        </Badge>
      ),
    },
    {
      id: 'email_verificado',
      header: 'Email Verificado',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.email_verificado_en ? (
            <>
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                {new Date(row.original.email_verificado_en).toLocaleDateString('es-BO')}
              </span>
            </>
          ) : (
            <>
              <UserX className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">No verificado</span>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'creado_en',
      header: 'Fecha Registro',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('creado_en')).toLocaleDateString('es-BO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const suscriptor = row.original

        if (suscriptor.eliminado_en) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestaurar(suscriptor.id)}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-1">
            {suscriptor.estado === 'activo' ? (
              <RequirePermission permission="suscriptores.manage">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDesactivar(suscriptor.id)}
                  title="Desactivar"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </RequirePermission>
            ) : (
              <RequirePermission permission="suscriptores.manage">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleActivar(suscriptor.id)}
                  title="Activar"
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              </RequirePermission>
            )}
            {!suscriptor.email_verificado_en && (
              <RequirePermission permission="suscriptores.manage">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVerificarEmail(suscriptor.id)}
                  title="Verificar Email"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </RequirePermission>
            )}
            <RequirePermission permission="suscriptores.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(suscriptor)}
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
            { label: 'Gestión' },
            { label: 'Suscriptores' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Suscriptores</h2>
            <p className="text-muted-foreground">
              Gestiona la lista de suscriptores al newsletter
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactivos</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inactivos}</p>
              </div>
              <UserX className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails Verificados</p>
                <p className="text-2xl font-bold text-blue-600">{stats.verificados}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportarCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              variant={showDeleted ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showDeleted ? 'Ocultar Archivados' : 'Ver Archivados'}
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredSuscriptores}
          searchKey="email"
          searchPlaceholder="Buscar por email o nombre..."
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este suscriptor?"
          description={`Se eliminará permanentemente al suscriptor "${suscriptorEliminar?.email}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}