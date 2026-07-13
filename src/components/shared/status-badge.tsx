import { Badge } from '@/components/ui/badge'
import { Archive, CheckCircle2, XCircle } from 'lucide-react'

type StatusType = 'activo' | 'inactivo' | 'eliminado'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig = {
  activo: {
    label: 'Activo',
    icon: CheckCircle2,
    variant: 'default' as const,
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
  },
  inactivo: {
    label: 'Inactivo',
    icon: XCircle,
    variant: 'secondary' as const,
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200',
  },
  eliminado: {
    label: 'Eliminado',
    icon: Archive,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={`gap-1.5 font-medium ${config.className} ${className || ''}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}