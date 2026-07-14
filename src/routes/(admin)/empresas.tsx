import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EmpresaForm } from '@/features/empresas/components/empresa-form'
import {
  eliminarEmpresa,
  getEmpresas,
} from '@/features/empresas/services/empresa.service'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/types/empresa'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Building2, Moon, Pencil, Plus, Sun, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/empresas')({
  loader: async () => {
    const empresas = await getEmpresas(true)
    const empresasresult = await Promise.all([supabase.from('empresas').select('id, nombre, logo').eq('estado', 'activo').limit(1).single()])
    return { empresas, empresa: empresasresult.data || null }
  },
  component: EmpresasPage,
})

function EmpresasPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { empresa } = Route.useLoaderData()
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  const { empresas } = Route.useLoaderData()
  const navigate = useNavigate()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [empresaEditar, setEmpresaEditar] = useState<Empresa | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [empresaEliminar, setEmpresaEliminar] = useState<Empresa | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
            {row.original.nombre.charAt(0).toUpperCase()}
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
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditarEmpresa(empresa)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleEliminarClick(empresa)}
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header del Admin */}
      <header className="border-b bg-card px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Logo de la Empresa */}
          <div className="flex items-center gap-3">
            {empresa?.logo ? (
              <Avatar className="h-10 w-10 rounded-lg border">
                <AvatarImage
                  src={empresa.logo}
                  alt={empresa.nombre}
                  className="object-contain p-1"
                />
                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-10 w-10 rounded-lg border bg-primary">
                <AvatarFallback className="text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {empresa?.nombre || 'Correas Center'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Panel de Administración
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle Dark Mode */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Info */}
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
          </div>
        </div>
      </header>
      <div className="max-w-1xl mx-10 space-y-2">
        <Breadcrumbs items={[{ label: 'Gestión' }, { label: 'Empresas' }]} />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Empresas</h2>
            <p className="text-muted-foreground">
              Gestiona las empresas del sistema y sus logos corporativos.
            </p>
          </div>
          <Button onClick={handleNuevaEmpresa}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={empresas}
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
