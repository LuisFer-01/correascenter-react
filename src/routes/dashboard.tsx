import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '../components/ui/button'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/dashboard')({
  // Esta función se ejecuta ANTES de renderizar la ruta
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // Si no hay sesión, redirigir al login
      throw new Error('Redirect to /login') // TanStack Router maneja esto, o podemos usar redirect()
    }
  },
  component: Dashboard,
})

// Función auxiliar para redirección segura en TanStack Router
import { redirect } from '@tanstack/react-router'

export const RouteProtected = createFileRoute('/dashboard')({

  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header del Admin */}
      <header className="border-b bg-card px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-foreground">Panel de Administración</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">¡Bienvenido, {user?.user_metadata?.nombre_completo || 'Administrador'}!</h2>
            <p className="text-muted-foreground mt-2">
              El sistema está listo. Aquí comenzarás a construir los módulos de gestión.
            </p>
          </div>

          {/* Tarjetas de ejemplo para el dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Productos</h3>
              <p className="text-sm text-muted-foreground">Gestión de catálogo y categorías.</p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Usuarios y Roles</h3>
              <p className="text-sm text-muted-foreground">Administración de permisos y accesos.</p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-2">Contenido Web</h3>
              <p className="text-sm text-muted-foreground">Menús, footers y secciones públicas.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}