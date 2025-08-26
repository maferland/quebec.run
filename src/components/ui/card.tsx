import { cn } from '@/lib/utils'

export type CardVariant = 'default' | 'accent' | 'interactive'

export type CardProps = {
  variant?: CardVariant
  className?: string
  children: React.ReactNode
  as?: 'div' | 'section' | 'article'
} & React.HTMLAttributes<HTMLElement>

export function Card({
  variant = 'default',
  className,
  children,
  as = 'section',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl border transition-all duration-200'

  const variantStyles = {
    default: 'p-4 bg-surface border-border hover:shadow-md',
    accent:
      'p-6 bg-surface-variant border-l-4 border-l-primary hover:shadow-md hover:border-l-primary/80',
    interactive:
      'group p-4 bg-surface border-border hover:bg-surface/90 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 cursor-pointer',
  }

  const Component = as

  return (
    <Component
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Component>
  )
}
