import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { UsuarioForm } from '@/features/usuarios/components/usuario-form'
import { getRolesDisponibles, getUsuarios } from '@/features/usuarios/services/usuario.service'
import type { UserProfile } from '@/types/usuario'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/dashboard')({
  loader: async () => {
    const [usuarios, roles] = await Promise.all([
      getUsuarios(),
      getRolesDisponibles(),
    ])
    return { usuarios, roles }
  },
  component: UsuariosPage,
})

function UsuariosPage() {
  const { usuarios, roles } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'nombre_completo',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('nombre_completo')}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <span
              key={role.id}
              className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              {role.nombre}
            </span>
          ))}
        </div>
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
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Aquí abriríamos el formulario en modo edición
            console.log('Editar', row.original.id)
          }}
        >
          Editar
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuarios y Roles</h2>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema y sus permisos de acceso.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={usuarios}
        searchKey="nombre_completo"
        searchPlaceholder="Buscar por nombre o email..."
      />

      <UsuarioForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rolesDisponibles={roles}
        onSuccess={() => {
          setIsFormOpen(false)
          navigate({ to: '/usuarios', replace: true }) // Recarga la ruta
        }}
      />
    </div>
  )
}