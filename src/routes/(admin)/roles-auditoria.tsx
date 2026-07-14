import { supabase } from '#/lib/supabase'
import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAuditoriaRoles, type AuditoriaLog } from '@/features/auditoria/services/auditoria.service'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { FileText, History, User } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  accion: z.enum(['crear', 'actualizar', 'eliminar']).optional().catch(undefined),
  page: z.number().int().positive().default(1).catch(1),
})

type SearchParams = z.infer<typeof searchSchema>

export const Route = createFileRoute('/(admin)/roles-auditoria')({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const filters = {
      accion: search.accion,
      limit: 20,
      offset: (search.page - 1) * 20,
    }

    // Obtener datos de la empresa Y auditoría en paralelo
    const [auditoriaResult, empresaResult] = await Promise.all([
      getAuditoriaRoles(filters),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])

    return {
      logs: auditoriaResult.logs,
      total: auditoriaResult.total,
      empresa: empresaResult.data || null,
    }
  },
  component: RolesAuditoriaPage,
})

function RolesAuditoriaPage() {
  const { logs, total, empresa } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [accionFilter, setAccionFilter] = useState<string>(search.accion || 'all')

  const columns: ColumnDef<AuditoriaLog>[] = [
    {
      accessorKey: 'creado_en',
      header: 'Fecha',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.getValue('creado_en')).toLocaleString('es-BO', {
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
      accessorKey: 'accion',
      header: 'Acción',
      cell: ({ row }) => {
        const accion = row.getValue('accion') as string
        const colors: Record<string, string> = {
          crear: 'bg-green-100 text-green-800',
          actualizar: 'bg-blue-100 text-blue-800',
          eliminar: 'bg-red-100 text-red-800',
        }
        const labels: Record<string, string> = {
          crear: 'Crear',
          actualizar: 'Actualizar',
          eliminar: 'Eliminar',
        }
        return (
          <Badge className={colors[accion] || 'bg-gray-100'}>
            {labels[accion] || accion}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'usuario',
      header: 'Usuario',
      cell: ({ row }) => {
        const usuario = row.original.usuario
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">
                {usuario?.nombre_completo || 'Sistema'}
              </div>
              <div className="text-xs text-muted-foreground">
                {usuario?.email || 'N/A'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'registro_id',
      header: 'Rol ID',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue('registro_id') || '-'}
        </div>
      ),
    },
    {
      id: 'cambios',
      header: 'Cambios',
      cell: ({ row }) => {
        const oldData = row.original.datos_anteriores
        const newData = row.original.datos_nuevos

        return (
          <div className="text-xs max-w-xs truncate">
            {row.original.accion === 'crear' && (
              <span className="text-green-600">
                Nombre: {newData?.nombre || '-'}
              </span>
            )}
            {row.original.accion === 'actualizar' && (
              <span className="text-blue-600">
                {oldData?.nombre || '?'} → {newData?.nombre || '?'}
              </span>
            )}
            {row.original.accion === 'eliminar' && (
              <span className="text-red-600">
                Eliminado: {oldData?.nombre || '-'}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'ip',
      header: 'IP',
      cell: ({ row }) => (
        <div className="text-xs font-mono text-muted-foreground">
          {row.original.ip_address || '-'}
        </div>
      ),
    },
    {
      id: 'detalles',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Detalles:', row.original)
          }}
        >
          <FileText className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const handleFilterChange = (value: string) => {
    setAccionFilter(value)
    navigate({
      to: '/roles-auditoria',
      search: (prev: SearchParams) => ({
        ...prev,
        accion: value === 'all' ? undefined : (value as 'crear' | 'actualizar' | 'eliminar'),
        page: 1,
      }),
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader empresa={empresa} />
      
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Breadcrumbs
          items={[
            { label: 'Gestión', href: '/roles' },
            { label: 'Auditoría de Roles' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <History className="h-7 w-7" />
              Auditoría de Roles
            </h2>
            <p className="text-muted-foreground">
              Historial de cambios en roles y permisos
            </p>
          </div>
          <Select value={accionFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="crear">Creaciones</SelectItem>
              <SelectItem value="actualizar">Modificaciones</SelectItem>
              <SelectItem value="eliminar">Eliminaciones</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          searchKey="registro_id"
          searchPlaceholder="Buscar por ID de rol..."
          pageSize={20}
        />

        <div className="text-sm text-muted-foreground text-center">
          Total de registros: {total}
        </div>
      </div>
    </div>
  )
}