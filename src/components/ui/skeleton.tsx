import { cn } from '@/lib/utils'

/**
 * Skeleton loading components for smooth loading states
 * Provides consistent loading animations using Quebec.run design patterns
 */

export type SkeletonProps = {
  className?: string
  /**
   * Animation type for skeleton loading
   * @default "pulse"
   */
  animation?: 'pulse' | 'shimmer' | 'none'
  /**
   * Rounded corners variant
   * @default "md"
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export type SkeletonCardProps = {
  /**
   * Show avatar/icon area
   * @default false
   */
  showAvatar?: boolean
  /**
   * Number of text lines to show
   * @default 2
   */
  lines?: number
  /**
   * Show action buttons area
   * @default false
   */
  showActions?: boolean
  /**
   * Card variant for different contexts
   * @default "default"
   */
  variant?: 'default' | 'event' | 'club' | 'compact'
  className?: string
}

export type LoadingStateProps = {
  /**
   * Loading state text
   * @default "Loading..."
   */
  text?: string
  /**
   * Show spinner icon
   * @default true
   */
  showSpinner?: boolean
  /**
   * Size of the loading component
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export type SkeletonListProps = {
  /**
   * Number of skeleton items to render
   * @default 3
   */
  count?: number
  /**
   * Type of skeleton items
   * @default "default"
   */
  variant?: 'default' | 'event' | 'club' | 'compact'
  /**
   * Layout direction
   * @default "vertical"
   */
  direction?: 'vertical' | 'horizontal'
  className?: string
}

// Animation variants
const animationVariants = {
  pulse: 'animate-pulse',
  shimmer:
    'bg-gradient-to-r from-surface-secondary via-surface-variant to-surface-secondary bg-[length:200px_100%]',
  none: '',
}

// Rounded variants
const roundedVariants = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

// Size variants for loading states
const sizeVariants = {
  sm: {
    spinner: 'w-4 h-4',
    text: 'text-sm',
    container: 'gap-2 py-2',
  },
  md: {
    spinner: 'w-5 h-5',
    text: 'text-base',
    container: 'gap-3 py-4',
  },
  lg: {
    spinner: 'w-6 h-6',
    text: 'text-lg',
    container: 'gap-4 py-6',
  },
}

/**
 * Basic skeleton element for custom loading states
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-24" />
 * <Skeleton className="h-8 w-32" animation="shimmer" />
 * ```
 */
export function Skeleton({
  className,
  animation = 'pulse',
  rounded = 'md',
}: SkeletonProps) {
  const isShimmer = animation === 'shimmer'

  return (
    <div
      className={cn(
        !isShimmer && 'bg-surface-secondary',
        isShimmer ? animationVariants.shimmer : animationVariants[animation],
        roundedVariants[rounded],
        className
      )}
      style={isShimmer ? { animation: 'shimmer 2s infinite' } : undefined}
    />
  )
}

/**
 * Skeleton card for loading card-based content like EventCard or ClubCard
 *
 * @example
 * ```tsx
 * <SkeletonCard variant="event" showAvatar lines={3} />
 * <SkeletonCard variant="club" showActions />
 * ```
 */
export function SkeletonCard({
  showAvatar = false,
  lines = 2,
  showActions = false,
  variant = 'default',
  className,
}: SkeletonCardProps) {
  const isEvent = variant === 'event'
  const isClub = variant === 'club'
  const isCompact = variant === 'compact'

  return (
    <div
      className={cn(
        'p-6 bg-surface border border-border rounded-xl',
        isCompact && 'p-4',
        className
      )}
      role="status"
      aria-label="Loading content..."
    >
      {/* Header with optional avatar */}
      <div className={cn('flex items-start gap-3 mb-4', isCompact && 'mb-3')}>
        {showAvatar && (
          <Skeleton
            className={cn(
              'flex-shrink-0',
              isEvent ? 'w-10 h-10' : 'w-12 h-12',
              isCompact ? 'w-8 h-8' : undefined
            )}
            rounded={isEvent ? 'md' : 'full'}
          />
        )}

        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <Skeleton className={cn('h-5 w-3/4', isCompact && 'h-4 w-2/3')} />

          {/* Event-specific datetime tag */}
          {isEvent && <Skeleton className="h-6 w-32" rounded="md" />}

          {/* Club-specific location */}
          {isClub && <Skeleton className="h-4 w-24" />}
        </div>

        {/* Event time badge */}
        {isEvent && <Skeleton className="h-6 w-16" rounded="md" />}

        {/* Club event count */}
        {isClub && <Skeleton className="h-8 w-8" rounded="full" />}
      </div>

      {/* Content lines */}
      {!isCompact && (
        <div className="space-y-2 mb-4">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton
              key={i}
              className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
            />
          ))}
        </div>
      )}

      {/* Event tags */}
      {isEvent && (
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-5 w-12" rounded="md" />
          <Skeleton className="h-5 w-16" rounded="md" />
        </div>
      )}

      {/* Club events preview */}
      {isClub && !isCompact && (
        <div className="space-y-3 mb-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="p-3 bg-surface-variant rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <Skeleton className="h-4 w-4 flex-shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-14" rounded="md" />
              </div>
              <div className="flex gap-2 ml-6">
                <Skeleton className="h-4 w-16" rounded="sm" />
                <Skeleton className="h-4 w-12" rounded="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Location section for events */}
      {isEvent && (
        <div className="mt-auto">
          <div className="p-3 bg-surface-variant rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      )}
    </div>
  )
}

/**
 * Loading state component with spinner and text
 *
 * @example
 * ```tsx
 * <LoadingState text="Loading events..." size="lg" />
 * <LoadingState showSpinner={false} text="Processing..." />
 * ```
 */
export function LoadingState({
  text = 'Loading...',
  showSpinner = true,
  size = 'md',
  className,
}: LoadingStateProps) {
  const config = sizeVariants[size]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        config.container,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {showSpinner && (
        <div
          className={cn(
            'border-2 border-border border-t-primary rounded-full animate-spin',
            config.spinner
          )}
          aria-hidden="true"
        />
      )}
      <p className={cn('text-text-secondary font-medium', config.text)}>
        {text}
      </p>
    </div>
  )
}

/**
 * List of skeleton cards for loading multiple items
 *
 * @example
 * ```tsx
 * <SkeletonList count={6} variant="event" />
 * <SkeletonList count={4} variant="club" direction="horizontal" />
 * ```
 */
export function SkeletonList({
  count = 3,
  variant = 'default',
  direction = 'vertical',
  className,
}: SkeletonListProps) {
  const isHorizontal = direction === 'horizontal'

  return (
    <div
      className={cn(
        'space-y-6',
        isHorizontal && 'flex gap-6 space-y-0 overflow-x-auto',
        className
      )}
      role="status"
      aria-label={`Loading ${count} items...`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(isHorizontal && 'flex-shrink-0 w-80')}>
          <SkeletonCard
            variant={variant}
            showAvatar={variant !== 'compact'}
            lines={variant === 'compact' ? 1 : 2}
            showActions={variant === 'club'}
          />
        </div>
      ))}
    </div>
  )
}

// Convenience components for specific use cases

/**
 * Event card skeleton - matches EventCard layout exactly
 */
export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonCard
      variant="event"
      showAvatar={false}
      lines={1}
      showActions={false}
      className={className}
    />
  )
}

/**
 * Club card skeleton - matches ClubCard layout exactly
 */
export function ClubCardSkeleton({ className }: { className?: string }) {
  return (
    <SkeletonCard
      variant="club"
      showAvatar={true}
      lines={2}
      showActions={true}
      className={cn('border-l-4 border-l-border', className)}
    />
  )
}

/**
 * Page loading component for full-page loading states
 */
export function PageLoading({
  title = 'Loading page...',
  className,
}: {
  title?: string
  className?: string
}) {
  return (
    <div className={cn('min-h-96 flex items-center justify-center', className)}>
      <LoadingState text={title} size="lg" />
    </div>
  )
}

/**
 * Section loading component for partial page loading
 */
export function SectionLoading({
  title = 'Loading...',
  className,
}: {
  title?: string
  className?: string
}) {
  return (
    <div className={cn('py-12 flex items-center justify-center', className)}>
      <LoadingState text={title} size="md" />
    </div>
  )
}
