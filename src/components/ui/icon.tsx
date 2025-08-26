import { LucideIcon, LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Semantic icon sizes for consistent visual hierarchy
 */
export type IconSize =
  | 'xs' // 12px - very small icons, badges, indicators
  | 'sm' // 16px - inline icons, form inputs, small buttons
  | 'md' // 20px - default size, navigation, medium buttons
  | 'lg' // 24px - section headers, large buttons
  | 'xl' // 32px - page headers, hero sections
  | '2xl' // 48px - feature highlights, large displays
  | '3xl' // 64px - hero sections, major visual elements

/**
 * Semantic color variants that match Quebec.run design system
 */
export type IconColor =
  | 'current' // Inherits current text color (default)
  | 'primary' // Quebec.run primary blue
  | 'secondary' // Quebec.run secondary pink
  | 'accent' // Quebec.run accent gray
  | 'text-primary' // Main text color
  | 'text-secondary' // Secondary text color
  | 'text-tertiary' // Tertiary text color
  | 'text-inverse' // Inverse text (white)
  | 'success' // Success green
  | 'warning' // Warning orange
  | 'error' // Error red
  | 'info' // Info blue (uses primary)
  | 'muted' // Muted/disabled appearance

export type IconProps = {
  /**
   * Lucide icon component to render
   */
  icon: LucideIcon
  /**
   * Semantic size for consistent visual hierarchy
   * @default 'md'
   */
  size?: IconSize
  /**
   * Semantic color from Quebec.run design system
   * @default 'current'
   */
  color?: IconColor
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Accessibility label for screen readers
   */
  'aria-label'?: string
  /**
   * Whether icon is decorative (hidden from screen readers)
   * @default false
   */
  decorative?: boolean
} & Omit<LucideProps, 'size' | 'className'>

// Size mappings for consistent scaling
const sizeClasses = {
  xs: 'h-3 w-3', // 12px
  sm: 'h-4 w-4', // 16px
  md: 'h-5 w-5', // 20px
  lg: 'h-6 w-6', // 24px
  xl: 'h-8 w-8', // 32px
  '2xl': 'h-12 w-12', // 48px
  '3xl': 'h-16 w-16', // 64px
} as const

// Color mappings to design system
const colorClasses = {
  current: '',
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  'text-primary': 'text-text-primary',
  'text-secondary': 'text-text-secondary',
  'text-tertiary': 'text-text-tertiary',
  'text-inverse': 'text-text-inverse',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  muted: 'text-text-tertiary opacity-60',
} as const

/**
 * Icon component wrapper for consistent sizing and theming
 *
 * Provides semantic size and color options that align with Quebec.run design system.
 * Includes proper accessibility attributes and flexible styling options.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Icon icon={MapPin} />
 *
 * // With semantic sizing and colors
 * <Icon icon={Calendar} size="lg" color="primary" />
 * <Icon icon={Clock} size="sm" color="text-secondary" />
 *
 * // For hero sections
 * <Icon icon={Users} size="3xl" color="primary" aria-label="Community" />
 *
 * // Decorative icons (hidden from screen readers)
 * <Icon icon={Star} decorative />
 * ```
 */
export function Icon({
  icon: IconComponent,
  size = 'md',
  color = 'current',
  className,
  'aria-label': ariaLabel,
  decorative = false,
  ...props
}: IconProps) {
  const accessibilityProps = (() => {
    if (ariaLabel) {
      return { 'aria-label': ariaLabel }
    }
    if (decorative) {
      return { 'aria-hidden': true }
    }
    return {}
  })()

  return (
    <IconComponent
      className={cn(
        sizeClasses[size],
        colorClasses[color],
        'flex-shrink-0', // Prevent icon from shrinking in flex layouts
        className
      )}
      {...accessibilityProps}
      {...props}
    />
  )
}

/**
 * Size reference for design consistency:
 *
 * xs  (12px) - Badges, small indicators, fine details
 * sm  (16px) - Inline text, form inputs, compact buttons
 * md  (20px) - Default size, navigation, standard buttons
 * lg  (24px) - Section headers, prominent buttons
 * xl  (32px) - Page headers, feature callouts
 * 2xl (48px) - Hero sections, major features
 * 3xl (64px) - Landing pages, primary focal points
 */
