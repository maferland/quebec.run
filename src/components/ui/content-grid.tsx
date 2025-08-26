import { cn } from '@/lib/utils'

export type ContentGridProps = {
  children: React.ReactNode
  columns?: 'auto' | '2' | '3' | '4'
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const columnClasses = {
  auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '2': 'grid-cols-1 md:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
} as const

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
} as const

/**
 * Responsive content grid for displaying cards, items, or content blocks
 * Provides consistent responsive breakpoints and spacing
 */
export function ContentGrid({
  children,
  columns = '3',
  gap = 'md',
  className,
}: ContentGridProps) {
  return (
    <div
      className={cn('grid', columnClasses[columns], gapClasses[gap], className)}
    >
      {children}
    </div>
  )
}
