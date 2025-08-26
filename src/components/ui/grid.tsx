import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/**
 * Responsive Grid System for consistent layouts across the application
 * Provides mobile-first responsive grids with Quebec.run design patterns
 */

export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12
export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type ResponsiveGridProps = {
  children: ReactNode
  cols?: {
    default?: GridColumns
    sm?: GridColumns
    md?: GridColumns
    lg?: GridColumns
    xl?: GridColumns
  }
  gap?: GridGap
  className?: string
}

export type GridItemProps = {
  children: ReactNode
  span?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  className?: string
}

// Grid column configurations
const columnVariants = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
}

const responsiveColumnVariants = {
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
    12: 'sm:grid-cols-12',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
    12: 'md:grid-cols-12',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    12: 'lg:grid-cols-12',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
    12: 'xl:grid-cols-12',
  },
}

// Grid gap configurations
const gapVariants: Record<GridGap, string> = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
}

// Grid item span configurations
const spanVariants = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
}

const responsiveSpanVariants = {
  sm: {
    1: 'sm:col-span-1',
    2: 'sm:col-span-2',
    3: 'sm:col-span-3',
    4: 'sm:col-span-4',
    5: 'sm:col-span-5',
    6: 'sm:col-span-6',
    7: 'sm:col-span-7',
    8: 'sm:col-span-8',
    9: 'sm:col-span-9',
    10: 'sm:col-span-10',
    11: 'sm:col-span-11',
    12: 'sm:col-span-12',
  },
  md: {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6',
    7: 'md:col-span-7',
    8: 'md:col-span-8',
    9: 'md:col-span-9',
    10: 'md:col-span-10',
    11: 'md:col-span-11',
    12: 'md:col-span-12',
  },
  lg: {
    1: 'lg:col-span-1',
    2: 'lg:col-span-2',
    3: 'lg:col-span-3',
    4: 'lg:col-span-4',
    5: 'lg:col-span-5',
    6: 'lg:col-span-6',
    7: 'lg:col-span-7',
    8: 'lg:col-span-8',
    9: 'lg:col-span-9',
    10: 'lg:col-span-10',
    11: 'lg:col-span-11',
    12: 'lg:col-span-12',
  },
  xl: {
    1: 'xl:col-span-1',
    2: 'xl:col-span-2',
    3: 'xl:col-span-3',
    4: 'xl:col-span-4',
    5: 'xl:col-span-5',
    6: 'xl:col-span-6',
    7: 'xl:col-span-7',
    8: 'xl:col-span-8',
    9: 'xl:col-span-9',
    10: 'xl:col-span-10',
    11: 'xl:col-span-11',
    12: 'xl:col-span-12',
  },
}

/**
 * Responsive grid container for flexible, mobile-first layouts
 *
 * @example
 * ```tsx
 * <ResponsiveGrid
 *   cols={{ default: 1, md: 2, lg: 3 }}
 *   gap="md"
 * >
 *   <EventCard event={event1} />
 *   <EventCard event={event2} />
 *   <EventCard event={event3} />
 * </ResponsiveGrid>
 * ```
 */
export function ResponsiveGrid({
  children,
  cols = { default: 1 },
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid',
    // Default columns
    cols.default && columnVariants[cols.default],
    // Responsive columns
    cols.sm && responsiveColumnVariants.sm[cols.sm],
    cols.md && responsiveColumnVariants.md[cols.md],
    cols.lg && responsiveColumnVariants.lg[cols.lg],
    cols.xl && responsiveColumnVariants.xl[cols.xl],
    // Gap
    gapVariants[gap],
    className
  )

  return <div className={gridClasses}>{children}</div>
}

/**
 * Grid item for spanning multiple columns
 *
 * @example
 * ```tsx
 * <ResponsiveGrid cols={{ default: 12 }}>
 *   <GridItem span={{ default: 12, md: 8 }}>
 *     <MainContent />
 *   </GridItem>
 *   <GridItem span={{ default: 12, md: 4 }}>
 *     <Sidebar />
 *   </GridItem>
 * </ResponsiveGrid>
 * ```
 */
export function GridItem({
  children,
  span = { default: 1 },
  className,
}: GridItemProps) {
  const itemClasses = cn(
    // Default span
    span.default && spanVariants[span.default as keyof typeof spanVariants],
    // Responsive spans
    span.sm &&
      responsiveSpanVariants.sm[
        span.sm as keyof typeof responsiveSpanVariants.sm
      ],
    span.md &&
      responsiveSpanVariants.md[
        span.md as keyof typeof responsiveSpanVariants.md
      ],
    span.lg &&
      responsiveSpanVariants.lg[
        span.lg as keyof typeof responsiveSpanVariants.lg
      ],
    span.xl &&
      responsiveSpanVariants.xl[
        span.xl as keyof typeof responsiveSpanVariants.xl
      ],
    className
  )

  return <div className={itemClasses}>{children}</div>
}

// Convenience components for common layouts

/**
 * Two-column responsive layout (mobile: 1 col, desktop: 2 cols)
 */
export function TwoColumnGrid({
  children,
  gap = 'md',
  className,
}: Omit<ResponsiveGridProps, 'cols'>) {
  return (
    <ResponsiveGrid
      cols={{ default: 1, md: 2 }}
      gap={gap}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

/**
 * Three-column responsive layout (mobile: 1 col, tablet: 2 cols, desktop: 3 cols)
 */
export function ThreeColumnGrid({
  children,
  gap = 'md',
  className,
}: Omit<ResponsiveGridProps, 'cols'>) {
  return (
    <ResponsiveGrid
      cols={{ default: 1, sm: 2, lg: 3 }}
      gap={gap}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

/**
 * Event card grid - optimized for EventCard components
 * Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
 */
export function EventGrid({
  children,
  gap = 'lg',
  className,
}: Omit<ResponsiveGridProps, 'cols'>) {
  return (
    <ResponsiveGrid
      cols={{ default: 1, md: 2, lg: 3 }}
      gap={gap}
      className={cn('w-full', className)}
    >
      {children}
    </ResponsiveGrid>
  )
}

/**
 * Club card grid - optimized for ClubCard components
 * Mobile: 1 column, Desktop: 2 columns (clubs need more space)
 */
export function ClubGrid({
  children,
  gap = 'lg',
  className,
}: Omit<ResponsiveGridProps, 'cols'>) {
  return (
    <ResponsiveGrid
      cols={{ default: 1, lg: 2 }}
      gap={gap}
      className={cn('w-full', className)}
    >
      {children}
    </ResponsiveGrid>
  )
}

/**
 * Dashboard layout with main content and sidebar
 * Mobile: stacked, Desktop: 2/3 + 1/3 layout
 */
export function DashboardGrid({
  children,
  gap = 'lg',
  className,
}: Omit<ResponsiveGridProps, 'cols'>) {
  return (
    <ResponsiveGrid
      cols={{ default: 1, lg: 12 }}
      gap={gap}
      className={cn('w-full min-h-screen', className)}
    >
      {children}
    </ResponsiveGrid>
  )
}

/**
 * Main content area in dashboard (2/3 width on desktop)
 */
export function DashboardMain({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <GridItem span={{ default: 1, lg: 8 }} className={className}>
      {children}
    </GridItem>
  )
}

/**
 * Sidebar area in dashboard (1/3 width on desktop)
 */
export function DashboardSidebar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <GridItem span={{ default: 1, lg: 4 }} className={className}>
      {children}
    </GridItem>
  )
}
