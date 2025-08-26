import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

/**
 * Consistent empty state component for when no content is available
 * Provides unified styling and structure across the app
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="h-12 w-12 text-text-tertiary" />
        </div>
      )}
      <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-text-secondary font-body mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}
