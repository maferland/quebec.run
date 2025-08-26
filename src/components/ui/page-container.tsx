import { cn } from '@/lib/utils'

export type PageContainerProps = {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-screen-xl',
  full: 'max-w-none',
} as const

/**
 * Standard page container with consistent responsive padding and max-width
 * Provides the common container pattern used across all pages
 */
export function PageContainer({
  children,
  size = 'lg',
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'container mx-auto px-4 py-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  )
}
