import { AdminHeader } from '#/components/layout/admin-header'
import { supabase } from '#/lib/supabase'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { DataTable } from '@/components/shared/data-table'
import { DeleteConfirmation } from '@/components/shared/delete-confirmation'
import { RequirePermission } from '@/components/shared/require-permission'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UsuarioForm } from '@/features/usuarios/components/usuario-form'
import {
  eliminarUsuario,
  getRolesDisponibles,
  getUsuarios,
  restaurarUsuario
} from '@/features/usuarios/services/usuario.service'
import { usePermissions } from '@/hooks/usePermissions'
import type { UserProfile } from '@/types/usuario'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/usuarios')({
  loader: async () => {
    const [usuarios, roles, empresaResult] = await Promise.all([
      getUsuarios(true), // Incluir eliminados
      getRolesDisponibles(),
      supabase
        .from('empresas')
        .select('id, nombre, logo')
        .eq('estado', 'activo')
        .limit(1)
        .single(),
    ])
    return { usuarios, roles, // Datos de la empresa (SIEMPRE incluir)
      empresa: empresaResult.data || null, }
  },
  component: UsuariosPage,
})

function UsuariosPage() {
  const { usuarios, roles, empresa} = Route.useLoaderData()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [usuarioEditar, setUsuarioEditar] = useState<UserProfile | null>(null)
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [usuarioEliminar, setUsuarioEliminar] = useState<UserProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [showDeleted, setShowDeleted] = useState(false)

  // Filtrar usuarios según permisos
  const filteredUsers = usuarios.filter(u => {
    if (u.estado === 'eliminado') {
      // Solo mostrar eliminados si tiene el permiso
      return showDeleted && hasPermission('usuarios.view_deleted')
    }
    return true
  })

  const handleNuevoUsuario = () => {
    setUsuarioEditar(null)
    setIsFormOpen(true)
  }

  const handleEditarUsuario = (usuario: UserProfile) => {
    setUsuarioEditar(usuario)
    setIsFormOpen(true)
  }

  const handleEliminarClick = (usuario: UserProfile) => {
    setUsuarioEliminar(usuario)
    setIsDeleteOpen(true)
  }

  const handleEliminarConfirm = async () => {
    if (!usuarioEliminar) return
    setIsDeleting(true)
    try {
      await eliminarUsuario(usuarioEliminar.id)
      setIsDeleteOpen(false)
      setUsuarioEliminar(null)
      navigate({ to: '/usuarios', replace: true })
    } catch (error: any) {
      console.error('Error al eliminar:', error)
      alert(error.message || 'Error al eliminar el usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestaurar = async (usuario: UserProfile) => {
    try {
      await restaurarUsuario(usuario.id)
      navigate({ to: '/usuarios', replace: true })
    } catch (error: any) {
      alert(error.message || 'Error al restaurar el usuario')
    }
  }

  const handleSuccess = () => {
    setIsFormOpen(false)
    setUsuarioEditar(null)
    navigate({ to: '/usuarios', replace: true })
  }

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'avatar_url',
      header: '',
      cell: ({ row }) => (
        <Avatar className="h-10 w-10">
          <AvatarImage src={row.original.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {row.original.nombre_completo?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'nombre_completo',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('nombre_completo')}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
          {row.original.telefono && (
            <div className="text-xs text-muted-foreground">{row.original.telefono}</div>
          )}
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
      cell: ({ row }) => {
        const usuario = row.original
        
        if (usuario.estado === 'eliminado') {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestaurar(usuario)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <RequirePermission permission="usuarios.update">
              <Button variant="ghost" size="icon" onClick={() => handleEditarUsuario(usuario)} title="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
            </RequirePermission>
            
            <RequirePermission permission="usuarios.delete">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive" 
                onClick={() => handleEliminarClick(usuario)} 
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
            { label: 'Gestión' },
            { label: 'Usuarios y Roles' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Usuarios y Roles</h2>
            <p className="text-muted-foreground">
              Gestiona los usuarios del sistema y sus permisos de acceso.
            </p>
          </div>
          <div className="flex gap-2">
            {/* Botón para ver eliminados - Solo si tiene permiso */}
            <RequirePermission permission="usuarios.view_deleted">
              <Button 
                variant={showDeleted ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showDeleted ? 'Ocultar Eliminados' : 'Ver Eliminados'}
              </Button>
            </RequirePermission>
            
            <RequirePermission permission="usuarios.create">
              <Button onClick={handleNuevoUsuario}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </RequirePermission>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          searchKey="nombre_completo"
          searchPlaceholder="Buscar por nombre, email o teléfono..."
        />

        <UsuarioForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          rolesDisponibles={roles}
          usuarioEditar={usuarioEditar}
          onSuccess={handleSuccess}
        />

        <DeleteConfirmation
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleEliminarConfirm}
          title="¿Eliminar este usuario?"
          description={`Se marcará como eliminado a "${usuarioEliminar?.nombre_completo}". El registro se mantendrá en la base de datos para auditoría.`}
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}