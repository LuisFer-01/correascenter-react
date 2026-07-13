import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'

export function usePermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPermissions([])
      setLoading(false)
      return
    }

    const loadPermissions = async () => {
      try {
        // Consulta CORRECTA a la tabla perfiles con sus relaciones
        const { data, error } = await supabase
          .from('perfiles')
          .select(`
            id,
            email,
            estado,
            usuario_rol (
              rol_id,
              roles (
                id,
                nombre,
                slug,
                rol_permiso (
                  permiso_id,
                  permisos (
                    id,
                    nombre,
                    slug
                  )
                )
              )
            )
          `)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error cargando permisos:', error)
          setPermissions([])
          setLoading(false)
          return
        }

        // Extraer todos los permisos de los roles del usuario
        const allPermissions = new Set<string>()
        
        data?.usuario_rol?.forEach((ur: any) => {
          ur.roles?.rol_permiso?.forEach((rp: any) => {
            if (rp.permisos?.slug) {
              allPermissions.add(rp.permisos.slug)
            }
          })
        })

        setPermissions(Array.from(allPermissions))
      } catch (error) {
        console.error('Error loading permissions:', error)
        setPermissions([])
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [user])

  const hasPermission = (permission: string) => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissionList: string[]) => {
    return permissionList.some(p => permissions.includes(p))
  }

  return { permissions, loading, hasPermission, hasAnyPermission }
}