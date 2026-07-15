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
    archivarContacto,
    eliminarContacto,
    getContactos,
    getContactosStats,
    marcarComoLeido,
    marcarComoRespondido,
    restaurarContacto,
} from '@/features/contactos/services/contacto.service'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { Contacto, EstadoContacto } from '@/types/contacto'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
    Archive,
    CheckCircle2,
    Eye,
    Mail,
    MessageSquare,
    Phone,
    RotateCcw,
    Trash2,
    User,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/contactos')({
  loader: async () => {
    const [contactos, stats, empresaResult] = await Promise.all([
      getContactos(false),
      getContactosStats(),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return {
      contactos,
      stats,
      empresa: empresaResult.data || null,
    }
  },
  component: ContactosPage,
})

function ContactosPage() {
  const { contactos, stats, empresa } = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()

  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [showDeleted, setShowDeleted] = useState(false)
  const [contactoEliminar, setContactoEliminar] = useState<Contacto | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredContactos = contactos.filter((c: Contacto) => {
    if (filtroEstado !== 'todos' && c.estado !== filtroEstado) {
      return false
    }
    return true
  })

  const handleMarcarLeido = async (id: number) => {
    try {
      await marcarComoLeido(id)
      navigate({ to: '/contactos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al marcar como leído')
    }
  }

  const handleMarcarRespondido = async (id: number) => {
    try {
      await marcarComoRespondido(id)
      navigate({ to: '/contactos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al marcar como respondido')
    }
  }

  const handleArchivar = async (id: number) => {
    try {
      await archivarContacto(id)
      navigate({ to: '/contactos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al archivar el contacto')
    }
  }

  const handleEliminarClick = (contacto: Contacto) => {
    setContactoEliminar(contacto)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!contactoEliminar) return
    setIsDeleting(true)
    try {
      await eliminarContacto(contactoEliminar.id)
      setIsDeleteOpen(false)
      setContactoEliminar(null)
      navigate({ to: '/contactos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el contacto')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (id: number) => {
    try {
      await restaurarContacto(id)
      navigate({ to: '/contactos', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el contacto')
    }
  }

  const getEstadoColor = (estado: EstadoContacto) => {
    const colors = {
      nuevo: 'bg-blue-100 text-blue-800 border-blue-200',
      leido: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      respondido: 'bg-green-100 text-green-800 border-green-200',
      archivado: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[estado] || colors.nuevo
  }

  const getEstadoLabel = (estado: EstadoContacto) => {
    const labels = {
      nuevo: 'Nuevo',
      leido: 'Leído',
      respondido: 'Respondido',
      archivado: 'Archivado',
    }
    return labels[estado] || estado
  }

  const columns: ColumnDef<Contacto>[] = [
    {
      accessorKey: 'nombre',
      header: 'Contacto',
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {row.getValue('nombre')}
          </div>
          {row.original.empresa && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {row.original.empresa}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          {row.getValue('email')}
        </div>
      ),
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {row.getValue('telefono')}
        </div>
      ),
    },
    {
      accessorKey: 'mensaje',
      header: 'Mensaje',
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4 inline mr-1" />
          {row.getValue('mensaje')}
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={getEstadoColor(row.getValue('estado') as EstadoContacto)}
        >
          {getEstadoLabel(row.getValue('estado') as EstadoContacto)}
        </Badge>
      ),
    },
    {
      accessorKey: 'creado_en',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('creado_en')).toLocaleDateString('es-BO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const contacto = row.original

        if (contacto.eliminado_en) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestaurar(contacto.id)}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-1">
            {contacto.estado === 'nuevo' && (
              <RequirePermission permission="contactos.manage">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMarcarLeido(contacto.id)}
                  title="Marcar como leído"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </RequirePermission>
            )}
            {contacto.estado !== 'respondido' && contacto.estado !== 'archivado' && (
              <RequirePermission permission="contactos.manage">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMarcarRespondido(contacto.id)}
                  title="Marcar como respondido"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </RequirePermission>
            )}
            {contacto.estado !== 'archivado' && (
              <RequirePermission permission="contactos.manage">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleArchivar(contacto.id)}
                  title="Archivar"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </RequirePermission>
            )}
            <RequirePermission permission="contactos.delete">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => handleEliminarClick(contacto)}
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
            { label: 'Contactos' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bandeja de Entrada</h2>
            <p className="text-muted-foreground">
              Gestiona los mensajes de contacto recibidos
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nuevos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.nuevos}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leídos</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.leidos}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Respondidos</p>
                <p className="text-2xl font-bold text-green-600">{stats.respondidos}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="nuevo">Nuevos</SelectItem>
                <SelectItem value="leido">Leídos</SelectItem>
                <SelectItem value="respondido">Respondidos</SelectItem>
                <SelectItem value="archivado">Archivados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
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
          data={filteredContactos}
          searchKey="nombre"
          searchPlaceholder="Buscar por nombre, email o teléfono..."
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este contacto?"
          description={`Se eliminará permanentemente el contacto de "${contactoEliminar?.nombre}".`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}