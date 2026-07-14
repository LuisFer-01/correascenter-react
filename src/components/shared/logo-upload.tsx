import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Upload, X } from 'lucide-react'
import { useState } from 'react'

interface LogoUploadProps {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
  companyName?: string
}

export function LogoUpload({
  value,
  onChange,
  onRemove,
  companyName,
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Crear nombre de archivo único
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `logos/${fileName}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos-empresas')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('logos-empresas')
        .getPublicUrl(filePath)

      onChange(data.publicUrl)
    } catch (error: any) {
      console.error('Error al subir logo:', error)
      alert(error.message || 'Error al subir el logo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 rounded-lg border bg-background">
          <AvatarImage src={value} alt={companyName || 'Logo'} className="object-contain p-2" />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl rounded-lg">
            {companyName?.charAt(0).toUpperCase() || 'E'}
          </AvatarFallback>
        </Avatar>
        
        {value && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex-1">
        <label htmlFor="logo-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            asChild
            className="cursor-pointer"
          >
            <span>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Subiendo...' : value ? 'Cambiar logo' : 'Subir logo'}
            </span>
          </Button>
        </label>
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          PNG, JPG, SVG o WEBP hasta 5MB
        </p>
      </div>
    </div>
  )
}