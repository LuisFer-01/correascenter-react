import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  userName?: string
  userEmail?: string
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  userName, 
  userEmail 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Crear URL temporal para preview
      const url = URL.createObjectURL(file)
      
      // Aquí deberías subir la imagen a tu backend o storage
      // Por ahora, usamos la URL temporal
      // En producción, subirías a: /api/upload/avatar
      onChange(url)
      
      // Simular upload (en producción, aquí harías el fetch a tu API)
      // const formData = new FormData()
      // formData.append('avatar', file)
      // const response = await fetch('/api/upload/avatar', {
      //   method: 'POST',
      //   body: formData,
      // })
      // const data = await response.json()
      // onChange(data.url)
      
    } catch (error) {
      console.error('Error al subir imagen:', error)
      alert('Error al subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={value} alt="Avatar" />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {value && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir avatar'}
      </Button>
    </div>
  )
}