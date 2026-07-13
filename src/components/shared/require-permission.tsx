import { usePermissions } from '@/hooks/usePermissions'

interface RequirePermissionProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RequirePermission({ 
  permission, 
  children, 
  fallback = null 
}: RequirePermissionProps) {
  const { hasPermission, loading } = usePermissions()

  if (loading) {
    return null // O un skeleton si prefieres
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}