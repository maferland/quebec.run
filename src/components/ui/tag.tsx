import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export type TagVariant =
  | 'date'
  | 'distance'
  | 'pace'
  | 'time'
  | 'datetime'
  | 'training'
  | 'social'
  | 'outline'
  | 'primary'

export type TagColorScheme =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'gray'

export type TagSize = 'xs' | 'sm' | 'md' | 'lg'

export type TagProps = {
  children: React.ReactNode
  variant?: TagVariant
  colorScheme?: TagColorScheme
  size?: TagSize
  icon?: LucideIcon
  iconSize?: number
  className?: string
}

// Color scheme variants using quebec.run brand colors
const colorSchemeVariants: Record<TagColorScheme, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  gray: 'bg-white border-gray-200 text-accent',
}

// Legacy variant support (will be deprecated)
const tagVariants: Record<TagVariant, TagColorScheme> = {
  date: 'gray',
  distance: 'primary',
  pace: 'accent',
  time: 'secondary',
  datetime: 'secondary',
  training: 'primary',
  social: 'secondary',
  outline: 'gray',
  primary: 'primary',
}

const sizeVariants: Record<
  TagSize,
  { container: string; icon: number; text: string }
> = {
  xs: { container: 'px-1.5 py-0.5 gap-1', icon: 10, text: 'text-xs' },
  sm: { container: 'px-2 py-1 gap-1', icon: 12, text: 'text-xs' },
  md: { container: 'px-3 py-1.5 gap-1.5', icon: 14, text: 'text-sm' },
  lg: { container: 'px-4 py-2 gap-2', icon: 16, text: 'text-base' },
}

export function Tag({
  children,
  variant,
  colorScheme,
  size = 'sm',
  icon: Icon,
  iconSize,
  className,
}: TagProps) {
  // Determine color scheme: explicit colorScheme prop takes precedence over variant mapping
  const finalColorScheme =
    colorScheme || (variant ? tagVariants[variant] : 'gray')
  const sizeConfig = sizeVariants[size]
  const finalIconSize = iconSize || sizeConfig.icon

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-md border whitespace-nowrap',
        sizeConfig.container,
        sizeConfig.text,
        colorSchemeVariants[finalColorScheme],
        className
      )}
    >
      {Icon && <Icon size={finalIconSize} className="flex-shrink-0" />}
      {children}
    </span>
  )
}
