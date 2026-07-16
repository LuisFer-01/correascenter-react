import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from '@tanstack/react-router'
import { Building2, LogOut, Moon, Sun, User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AdminHeaderProps {
  empresa?: {
    nombre: string
    logo?: string | null
  } | null
}

// Componente seguro para el toggle del sidebar
function SafeSidebarTrigger() {
  try {
    const { isMobile } = useSidebar()
    return (
      <SidebarTrigger className="-ml-1" />
    )
  } catch {
    // No está dentro de SidebarProvider, no renderizar
    return null
  }
}

export function AdminHeader({ empresa }: AdminHeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

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

  const handleLogout = async () => {
    await signOut()
    router.navigate({ to: '/login' })
    window.location.href = '/login'
  }

  return (
    <header className="border-b bg-card px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Toggle del Sidebar - Solo si está dentro de SidebarProvider */}
        <SafeSidebarTrigger />

        {/* Logo de la Empresa */}
        <div className="flex items-center gap-3">
          {empresa?.logo ? (
            <Avatar className="h-20 w-20 rounded-lg border">
              <AvatarImage src={empresa.logo} alt={empresa.nombre} className="object-contain p-1" />
              <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                <Building2 className="h-20 w-20" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-20 w-20 rounded-lg border bg-primary">
              <AvatarFallback className="text-primary-foreground">
                <Building2 className="h-20 w-20" />
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

        {/* Perfil de Usuario con Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.nombre_completo || 'Usuario'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}