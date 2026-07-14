import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Building2, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AdminHeaderProps {
  empresa?: {
    nombre: string
    logo?: string | null
  } | null
}

export function AdminHeader({ empresa }: AdminHeaderProps) {
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
    <header className="border-b bg-card px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Logo de la Empresa */}
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
  )
}