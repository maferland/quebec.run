import { cn } from '@/lib/utils'

export type PageTitleProps = {
  children: React.ReactNode
  className?: string
}

/**
 * Standard page title for Quebec.run pages
 * Replaces repeated "text-3xl font-heading font-bold text-primary mb-8" pattern
 */
export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1
      className={cn(
        'text-3xl font-heading font-bold text-primary mb-8',
        className
      )}
    >
      {children}
    </h1>
  )
}
