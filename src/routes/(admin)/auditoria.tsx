import { AdminHeader } from '@/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  exportarAuditoriaCSV,
  exportarAuditoriaExcel,
  getAccionesDisponibles,
  getAuditoriaLogs,
  getTablasAfectadas,
  getUsuariosConActividad,
  type AuditoriaLog,
} from '@/features/auditoria/services/auditoria.service'
import { supabase } from '@/lib/supabase'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

const searchSchema = z.object({
  usuario_id: z.string().optional(),
  accion: z.string().optional(),
  tabla: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  page: z.number().int().positive().default(1).catch(1),
})

type SearchParams = z.infer<typeof searchSchema>

export const Route = createFileRoute('/(admin)/auditoria')({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const filters = {
      usuario_id: search.usuario_id,
      accion: search.accion,
      tabla_afectada: search.tabla,
      fecha_inicio: search.fecha_inicio,
      fecha_fin: search.fecha_fin,
      limit: 50,
      offset: (search.page - 1) * 50,
    }

    const [logsResult, usuarios, tablas, acciones, empresaResult] = await Promise.all([
      getAuditoriaLogs(filters),
      getUsuariosConActividad(),
      getTablasAfectadas(),
      getAccionesDisponibles(),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])

    return {
      logs: logsResult.logs,
      total: logsResult.total,
      usuarios,
      tablas,
      acciones,
      empresa: empresaResult.data || null,
    }
  },
  component: AuditoriaPage,
})

function AuditoriaPage() {
  const { logs, total, usuarios, tablas, acciones, empresa } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [usuarioFilter, setUsuarioFilter] = useState<string>(search.usuario_id || 'all')
  const [accionFilter, setAccionFilter] = useState<string>(search.accion || 'all')
  const [tablaFilter, setTablaFilter] = useState<string>(search.tabla || 'all')
  const [fechaInicio, setFechaInicio] = useState<string>(search.fecha_inicio || '')
  const [fechaFin, setFechaFin] = useState<string>(search.fecha_fin || '')

  const handleFilterChange = (key: string, value: string) => {
    const newSearch: SearchParams = {
      ...search,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }

    if (key === 'usuario_id') setUsuarioFilter(value)
    if (key === 'accion') setAccionFilter(value)
    if (key === 'tabla') setTablaFilter(value)
    if (key === 'fecha_inicio') setFechaInicio(value)
    if (key === 'fecha_fin') setFechaFin(value)

    navigate({
      to: '/auditoria',
      search: newSearch,
    })
  }

  const handleClearFilters = () => {
    setUsuarioFilter('all')
    setAccionFilter('all')
    setTablaFilter('all')
    setFechaInicio('')
    setFechaFin('')
    navigate({
      to: '/auditoria',
      search: {
        usuario_id: undefined,
        accion: undefined,
        tabla: undefined,
        fecha_inicio: undefined,
        fecha_fin: undefined,
        page: 1,
      },
    })
  }

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/auditoria',
      search: {
        ...search,
        page: newPage,
      },
    })
  }

  const handleViewDetail = (log: AuditoriaLog) => {
    setSelectedLog(log)
    setIsDetailOpen(true)
  }

  // Función de exportación
  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true)
    try {
      const filters = {
        usuario_id: usuarioFilter !== 'all' ? usuarioFilter : undefined,
        accion: accionFilter !== 'all' ? accionFilter : undefined,
        tabla_afectada: tablaFilter !== 'all' ? tablaFilter : undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      }

      const blob = format === 'csv' 
        ? await exportarAuditoriaCSV(filters)
        : await exportarAuditoriaExcel(filters)

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const timestamp = new Date().toISOString().split('T')[0]
      link.download = `auditoria_${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error al exportar:', error)
      alert(error.message || 'Error al exportar los datos')
    } finally {
      setIsExporting(false)
    }
  }

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'crear': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'actualizar': return <Activity className="h-4 w-4 text-blue-600" />
      case 'eliminar': return <Trash2 className="h-4 w-4 text-red-600" />
      case 'login': return <User className="h-4 w-4 text-purple-600" />
      case 'logout': return <X className="h-4 w-4 text-gray-600" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getAccionColor = (accion: string) => {
    const colors: Record<string, string> = {
      crear: 'bg-green-100 text-green-800 border-green-200',
      actualizar: 'bg-blue-100 text-blue-800 border-blue-200',
      eliminar: 'bg-red-100 text-red-800 border-red-200',
      login: 'bg-purple-100 text-purple-800 border-purple-200',
      logout: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[accion] || 'bg-gray-100 text-gray-800'
  }

  const columns: ColumnDef<AuditoriaLog>[] = [
    {
      accessorKey: 'creado_en',
      header: 'Fecha/Hora',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {new Date(row.getValue('creado_en')).toLocaleString('es-BO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'accion',
      header: 'Acción',
      cell: ({ row }) => {
        const accion = row.getValue('accion') as string
        return (
          <Badge variant="outline" className={getAccionColor(accion)}>
            <div className="flex items-center gap-1">
              {getAccionIcon(accion)}
              <span className="capitalize">{accion}</span>
            </div>
          </Badge>
        )
      },
    },
    {
      accessorKey: 'usuario',
      header: 'Usuario',
      cell: ({ row }) => {
        const usuario = row.original.usuario
        if (!usuario) {
          return (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Sistema
              </div>
            </div>
          )
        }
        return (
          <div className="text-sm">
            <div className="font-medium">{usuario.nombre_completo}</div>
            <div className="text-xs text-muted-foreground">{usuario.email}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'tabla_afectada',
      header: 'Tabla',
      cell: ({ row }) => (
        <div className="text-sm font-mono">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-muted-foreground" />
            {row.getValue('tabla_afectada')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'registro_id',
      header: 'Registro ID',
      cell: ({ row }) => (
        <div className="text-sm font-mono text-muted-foreground">
          {row.getValue('registro_id') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'ip_address',
      header: 'IP',
      cell: ({ row }) => (
        <div className="text-xs font-mono text-muted-foreground">
          {row.getValue('ip_address') || '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetail(row.original)}
        >
          <FileText className="h-4 w-4" />
          <span className="sr-only">Ver detalles</span>
        </Button>
      ),
    },
  ]

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader empresa={empresa} />

      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <Breadcrumbs
          items={[
            { label: 'Gestión' },
            { label: 'Auditoría' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-7 w-7" />
              Auditoría del Sistema
            </h2>
            <p className="text-muted-foreground">
              Historial completo de acciones y cambios en el sistema
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="island-shell rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Filtros</h3>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Select value={usuarioFilter} onValueChange={(v) => handleFilterChange('usuario_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {usuarios.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Acción</Label>
              <Select value={accionFilter} onValueChange={(v) => handleFilterChange('accion', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {acciones.map((accion) => (
                    <SelectItem key={accion} value={accion}>
                      {accion.charAt(0).toUpperCase() + accion.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tabla</Label>
              <Select value={tablaFilter} onValueChange={(v) => handleFilterChange('tabla', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las tablas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tablas</SelectItem>
                  {tablas.map((tabla) => (
                    <SelectItem key={tabla} value={tabla}>
                      {tabla}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats y Exportación */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">{usuarios.length}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tablas Afectadas</p>
                <p className="text-2xl font-bold">{tablas.length}</p>
              </div>
              <Database className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acciones</p>
                <p className="text-2xl font-bold">{acciones.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Botón de Exportación */}
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar Registros'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar como Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabla */}
        <DataTable
          columns={columns}
          data={logs}
          searchKey="tabla_afectada"
          searchPlaceholder="Buscar por tabla..."
          pageSize={50}
        />

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(search.page - 1)}
              disabled={search.page <= 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {search.page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(search.page + 1)}
              disabled={search.page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* Sheet de Detalles */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <SheetContent className="max-w-3xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Detalles del Log</SheetTitle>
              <SheetDescription>
                Información completa de la acción registrada
              </SheetDescription>
            </SheetHeader>
            {selectedLog && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Información Básica</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Acción:</span>
                      <Badge variant="outline" className="ml-2 capitalize">
                        {selectedLog.accion}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tabla:</span>
                      <span className="ml-2 font-mono">{selectedLog.tabla_afectada}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registro ID:</span>
                      <span className="ml-2 font-mono">{selectedLog.registro_id || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="ml-2">
                        {new Date(selectedLog.creado_en).toLocaleString('es-BO')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedLog.usuario && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Usuario</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="ml-2">{selectedLog.usuario.nombre_completo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{selectedLog.usuario.email}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium">Información de Conexión</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">IP:</span>
                      <span className="ml-2 font-mono">{selectedLog.ip_address || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User Agent:</span>
                      <div className="ml-2 text-xs text-muted-foreground break-all">
                        {selectedLog.user_agent || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLog.datos_anteriores && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      Datos Anteriores
                    </h4>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
                      {JSON.stringify(selectedLog.datos_anteriores, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.datos_nuevos && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Datos Nuevos
                    </h4>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
                      {JSON.stringify(selectedLog.datos_nuevos, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Metadata Adicional</h4>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}