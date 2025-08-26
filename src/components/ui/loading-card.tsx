import { cn } from '@/lib/utils'

/**
 * Base loading card container
 */
export function LoadingCard({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-sm border animate-pulse',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Individual loading elements - composable building blocks
 */
export const LoadingElements = {
  Line: ({
    width = 'full',
    height = 'h-4',
    className,
  }: {
    width?: 'full' | '3/4' | '1/2' | '1/3' | '1/4' | string
    height?: string
    className?: string
  }) => {
    const widthClass =
      width === 'full'
        ? 'w-full'
        : width === '3/4'
          ? 'w-3/4'
          : width === '1/2'
            ? 'w-1/2'
            : width === '1/3'
              ? 'w-1/3'
              : width === '1/4'
                ? 'w-1/4'
                : width

    return (
      <div
        className={cn('bg-gray-200 rounded', height, widthClass, className)}
      />
    )
  },

  Circle: ({
    size = 'h-10 w-10',
    className,
  }: {
    size?: string
    className?: string
  }) => <div className={cn('bg-gray-200 rounded-full', size, className)} />,

  Block: ({ className }: { className?: string }) => (
    <div className={cn('bg-gray-100 rounded-xl h-16', className)} />
  ),

  Badge: ({ className }: { className?: string }) => (
    <div className={cn('bg-gray-200 rounded w-16 h-5', className)} />
  ),
}

/**
 * Pre-composed common patterns
 */
export function ClubLoadingCard() {
  return (
    <LoadingCard>
      <div className="flex items-start gap-3 mb-4">
        <LoadingElements.Circle />
        <div className="flex-1 space-y-2">
          <LoadingElements.Line height="h-5" />
          <LoadingElements.Line width="1/3" height="h-3" />
        </div>
        <LoadingElements.Badge className="w-8 h-6 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <LoadingElements.Line height="h-3" />
        <LoadingElements.Line width="3/4" height="h-3" />
      </div>
      <div className="space-y-3">
        <LoadingElements.Block />
        <LoadingElements.Block />
      </div>
    </LoadingCard>
  )
}

export function EventLoadingCard() {
  return (
    <LoadingCard>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 space-y-2">
          <LoadingElements.Line height="h-5" />
          <LoadingElements.Line width="1/4" height="h-3" />
        </div>
        <LoadingElements.Badge />
      </div>
      <div className="flex gap-2 mb-4">
        <LoadingElements.Badge className="w-12" />
        <LoadingElements.Badge />
      </div>
      <LoadingElements.Line height="h-3" />
    </LoadingCard>
  )
}

/**
 * Grid of loading cards
 */
export function LoadingGrid({
  count = 6,
  children,
  className,
}: {
  count?: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  )
}
