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
  const baseStyles = 'rounded-xl border hover:shadow-md transition-all'

  const variantStyles = {
    default: 'p-4 bg-white',
    accent: 'p-6 bg-gray-50 border-l-4 border-l-blue-500',
    interactive:
      'group p-4 bg-white hover:bg-gray-50 hover:shadow-lg cursor-pointer',
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
