import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

export type LocationProps = {
  address: string
  showIcon?: boolean
  truncate?: boolean
  compact?: boolean
  variant?: 'default' | 'card' | 'inline'
  className?: string
}

const variantStyles = {
  default: {
    container:
      'flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100',
    icon: 'h-5 w-5 text-primary mt-0.5 flex-shrink-0',
    labelContainer: 'min-w-0',
    label:
      'font-medium text-primary font-body text-sm mb-1 flex items-center gap-1',
    address: 'text-accent font-body text-sm',
  },
  card: {
    container:
      'flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100',
    icon: 'h-4 w-4 text-primary flex-shrink-0',
    labelContainer: 'min-w-0',
    label:
      'font-medium text-primary font-body text-sm mb-1 flex items-center gap-1',
    address: 'text-accent font-body text-sm',
  },
  inline: {
    container: 'flex items-center gap-2',
    icon: 'h-4 w-4 text-primary flex-shrink-0',
    labelContainer: 'min-w-0 flex items-center gap-2',
    label: 'font-medium text-primary font-body text-sm',
    address: 'text-accent font-body text-sm',
  },
}

export function Location({
  address,
  showIcon = true,
  truncate = false,
  compact = false,
  variant = 'default',
  className,
}: LocationProps) {
  const styles = variantStyles[variant]

  // For compact mode, don't show the "Location" label
  const showLabel = !compact && variant !== 'inline'

  return (
    <div className={cn(styles.container, className)}>
      {showIcon && variant === 'inline' && <MapPin className={styles.icon} />}

      <div className={styles.labelContainer}>
        {showLabel && (
          <p className={styles.label}>
            {showIcon && variant !== 'inline' && (
              <MapPin className="h-4 w-4 flex-shrink-0" />
            )}
            Location
          </p>
        )}
        <p
          className={cn(styles.address, truncate && 'truncate')}
          title={truncate ? address : undefined}
        >
          {address}
        </p>
      </div>
    </div>
  )
}

// Convenience components for common use cases
export function LocationCard({
  address,
  truncate = true,
  className,
}: Pick<LocationProps, 'address' | 'truncate' | 'className'>) {
  return (
    <Location
      address={address}
      variant="card"
      truncate={truncate}
      className={className}
    />
  )
}

export function LocationInline({
  address,
  showIcon = true,
  className,
}: Pick<LocationProps, 'address' | 'showIcon' | 'className'>) {
  return (
    <Location
      address={address}
      variant="inline"
      showIcon={showIcon}
      truncate={true}
      className={className}
    />
  )
}

export function LocationCompact({
  address,
  className,
}: Pick<LocationProps, 'address' | 'className'>) {
  return (
    <Location
      address={address}
      variant="card"
      compact={true}
      truncate={true}
      className={className}
    />
  )
}
