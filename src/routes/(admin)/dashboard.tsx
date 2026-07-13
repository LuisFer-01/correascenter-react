import { FormShell } from '@/components/shared/form-shell'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/(admin)/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    estado: 'activo' as 'activo' | 'inactivo',
  })

  const handleOpenModal = () => {
    setFormData({ nombre: '', email: '', estado: 'activo' })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    // Simular llamada API
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Datos guardados:', formData)
    setIsLoading(false)
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setFormData({ nombre: '', email: '', estado: 'activo' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          ¡Bienvenido, {user?.user_metadata?.nombre_completo || 'Administrador'}!
        </h2>
        <p className="text-muted-foreground mt-2">
          Aquí tienes un resumen general del sistema. Selecciona un módulo del menú lateral para comenzar.
        </p>
      </div>

      {/* Botón para abrir el modal */}
      <div className="flex gap-4">
        <Button onClick={handleOpenModal}>
          Agregar Registro
        </Button>
      </div>

      {/* Ejemplo de StatusBadge */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Prueba de StatusBadge</h3>
        <div className="flex gap-3">
          <StatusBadge status="activo" />
          <StatusBadge status="inactivo" />
        </div>
      </div>

      {/* FormShell Modal */}
      <FormShell
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Agregar Nuevo Registro"
        description="Completa la información del nuevo registro"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        submitLabel="Guardar Registro"
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Ingresa el nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Estado</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.estado === 'activo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData({ ...formData, estado: 'activo' })}
              >
                Activo
              </Button>
              <Button
                type="button"
                variant={formData.estado === 'inactivo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData({ ...formData, estado: 'inactivo' })}
              >
                Inactivo
              </Button>
            </div>
          </div>
        </div>
      </FormShell>
    </div>
  )
}