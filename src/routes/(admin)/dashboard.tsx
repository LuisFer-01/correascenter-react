import { AdminHeader } from '#/components/layout/admin-header'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  AlertCircle,
  FileText,
  Mail,
  Package,
  Users,
  Wrench,
  Zap
} from 'lucide-react'

export const Route = createFileRoute('/(admin)/dashboard')({
  loader: async () => {
    // Obtener conteos reales de la base de datos
    const [
      usuariosResult,
      productosResult,
      categoriasResult,
      serviciosResult,
      contactosResult,
      suscriptoresResult,
      empresaResult,
    ] = await Promise.all([
      supabase.from('perfiles').select('id', { count: 'exact', head: true }).neq('estado', 'eliminado'),
      supabase.from('productos').select('id', { count: 'exact', head: true }),
      supabase.from('categorias').select('id', { count: 'exact', head: true }),
      supabase.from('servicios').select('id', { count: 'exact', head: true }),
      supabase.from('contactos').select('id', { count: 'exact', head: true }),
      supabase.from('suscriptores').select('id', { count: 'exact', head: true }),
      supabase.from('empresas').select('id, nombre, logo').eq('estado', 'activo').limit(1).single(),
    ])

    return {
      stats: {
        usuarios: usuariosResult.count || 0,
        productos: productosResult.count || 0,
        categorias: categoriasResult.count || 0,
        servicios: serviciosResult.count || 0,
        contactos: contactosResult.count || 0,
        suscriptores: suscriptoresResult.count || 0,
      },
      empresa: empresaResult.data || null
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { stats, empresa } = Route.useLoaderData()
  const router = useRouter()

  const statsCards = [
    {
      title: 'Usuarios Activos',
      value: stats.usuarios,
      icon: Users,
      description: 'Usuarios registrados en el sistema',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Productos',
      value: stats.productos,
      icon: Package,
      description: 'Productos en el catálogo',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Categorías',
      value: stats.categorias,
      icon: FileText,
      description: 'Categorías de productos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Servicios',
      value: stats.servicios,
      icon: Wrench,
      description: 'Servicios disponibles',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Contactos',
      value: stats.contactos,
      icon: Mail,
      description: 'Mensajes de contacto',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Suscriptores',
      value: stats.suscriptores,
      icon: Zap,
      description: 'Suscriptores al newsletter',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]

  const quickAccess = [
    { title: 'Gestionar Usuarios', href: '/usuarios', icon: Users },
    { title: 'Ver Productos', href: '/productos', icon: Package },
    { title: 'Contactos', href: '/contactos', icon: Mail },
    { title: 'Auditoría', href: '/auditoria', icon: AlertCircle },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header del Admin */}
      <AdminHeader empresa={empresa} />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 md:p-8 bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Inicio' },
              { label: 'Dashboard' },
            ]}
          />

          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              ¡Bienvenido al Panel de Administración!
            </h2>
            <p className="text-muted-foreground mt-2">
              Resumen general del sistema Correas Center
            </p>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statsCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Accesos rápidos */}
          <Card>
            <CardHeader>
              <CardTitle>Accesos Rápidos</CardTitle>
              <CardDescription>
                Módulos más utilizados del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickAccess.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.href}
                      variant="outline"
                      className="flex flex-col items-start gap-3 p-4 h-auto hover:bg-muted/50 transition-colors justify-start"
                      onClick={() => router.navigate({ to: item.href })}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{item.title}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}