import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { createFileRoute } from '@tanstack/react-router'
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
    ] = await Promise.all([
      supabase.from('perfiles').select('id', { count: 'exact', head: true }).neq('estado', 'eliminado'),
      supabase.from('productos').select('id', { count: 'exact', head: true }),
      supabase.from('categorias').select('id', { count: 'exact', head: true }),
      supabase.from('servicios').select('id', { count: 'exact', head: true }),
      supabase.from('contactos').select('id', { count: 'exact', head: true }),
      supabase.from('suscriptores').select('id', { count: 'exact', head: true }),
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
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { stats } = Route.useLoaderData()

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

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Inicio' },
          { label: 'Dashboard' },
        ]}
      />

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Panel de Administración
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
            {[
              { title: 'Gestionar Usuarios', href: '/usuarios', icon: Users },
              { title: 'Ver Productos', href: '/productos', icon: Package },
              { title: 'Contactos', href: '/contactos', icon: Mail },
              { title: 'Auditoría', href: '/auditoria', icon: AlertCircle },
            ].map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.title}</span>
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}