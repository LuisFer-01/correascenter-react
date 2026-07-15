import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from '@tanstack/react-router'
import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
} from 'lucide-react'

interface AppSidebarProps {
  empresa?: { nombre: string; logo: string | null }
}

const navMain = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Catálogo',
    icon: Package,
    items: [
      { title: 'Productos', url: '/productos' },
      { title: 'Categorías', url: '/categorias' },
      { title: 'Marcas', url: '/marcas' },
      { title: "Tipos de Atributo", url: "/tipos-atributo" },
      { title: 'Atributos Técnicos', url: '/atributos' },
    ],
  },
  {
    title: 'Aplicaciones',
    icon: Building2,
    items: [
      { title: "Industrias", url: "/industrias" },
      { title: "Servicios", url: "/servicios" },
    ],
  },
  {
    title: 'Contenido Web',
    icon: FileText,
    items: [
      { title: 'Registros (About)', url: '/registros' },
      { title: 'Menús', url: '/menus' },
      { title: 'Secciones (Heroes, etc.)', url: '/secciones' },
      { title: 'Footers', url: '/footers' },
      { title: 'Wizard', url: '/pasos-wizard' },
    ],
  },
  {
    title: 'Gestión',
    icon: Users,
    items: [
      { title: 'Empresas', url: '/empresas' },
      { title: 'Sucursales', url: '/sucursales' },
      { title: 'Usuarios y Roles', url: '/usuarios' },
      { title: 'Roles y Permisos', url: '/roles' },
      { title: 'Auditoría de Roles', url: '/roles-auditoria' },
      { title: 'Contactos', url: '/contactos' },
      { title: 'Suscriptores', url: '/suscriptores' },
      { title: 'Auditoría', url: '/auditoria' },
    ],
  },
]

interface AppSidebarProps {
  empresa?: { nombre: string; logo: string | null }
}

export function AppSidebar({ empresa }: AppSidebarProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.navigate({ to: '/login' })
    window.location.href = '/login'
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary flex items-center gap-2">
            {empresa?.logo && (
              <img
                src={empresa.logo}
                alt="Logo"
                className="h-6 w-6 object-contain"
              />
            )}
            <span className="truncate">
              {empresa?.nombre || 'Correas Center'}
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.user_metadata?.nombre_completo || 'Usuario'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.user_metadata?.nombre_completo || 'Usuario'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
