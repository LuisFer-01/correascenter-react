import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Upload, X } from 'lucide-react'
import { useState } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
  userName?: string
  userEmail?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  userName,
  userEmail,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB')
      return
    }

    setIsUploading(true)

    try {
      // Crear nombre de archivo único
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      onChange(data.publicUrl)
    } catch (error: any) {
      console.error('Error al subir imagen:', error)
      alert(error.message || 'Error al subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={value} alt={userName || 'Avatar'} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {userName?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase() || 'U'}
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
        <label htmlFor="avatar-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            asChild
            className="cursor-pointer"
          >
            <span>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
            </span>
          </Button>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          PNG, JPG o GIF hasta 2MB
        </p>
      </div>
    </div>
  )
}