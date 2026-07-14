import { AppSidebar } from '@/components/layout/app-sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { supabase } from '@/lib/supabase'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Building2, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/(admin)/_layout')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const { data: empresaData } = await supabase
      .from('empresas')
      .select('id, nombre, logo')
      .eq('estado', 'activo')
      .limit(1)
      .single()

    return {
      empresa: empresaData || null,
    }
  },
  component: LayoutComponent,
})

function LayoutComponent() {
  const { empresa } = Route.useLoaderData()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

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

  return (
    <SidebarProvider>
      <AppSidebar empresa={empresa} />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Header Centralizado - Visible en TODAS las páginas */}
        <header className="border-b bg-card px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {empresa?.logo ? (
                <Avatar className="h-10 w-10 rounded-lg border">
                  <AvatarImage src={empresa.logo} alt={empresa.nombre} className="object-contain p-1" />
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
                <p className="text-xs text-muted-foreground">Panel de Administración</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
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

            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}