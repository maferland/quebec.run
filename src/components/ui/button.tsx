import { cn } from '@/lib/utils'

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'outline-primary'
    | 'outline-accent'
    | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

function filterClassName<T extends Record<string, unknown>>(
  props: T
): Omit<T, 'className'> {
  const { className, ...rest } = props as T & { className?: unknown }
  void className // Explicitly mark as intentionally unused
  return rest as Omit<T, 'className'>
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 disabled:bg-disabled disabled:text-disabled-text'

  const variants = {
    primary:
      'bg-primary text-text-inverse hover:bg-primary/90 focus:ring-focus border border-primary',
    secondary:
      'bg-secondary text-text-inverse hover:bg-secondary/90 focus:ring-focus border border-secondary',
    outline:
      'border border-border bg-surface text-text-primary hover:bg-hover hover:border-border-secondary focus:ring-focus',
    'outline-primary':
      'border border-primary bg-surface text-primary hover:bg-primary/5 hover:border-primary/80 focus:ring-focus',
    'outline-accent':
      'border border-accent bg-surface text-accent hover:bg-accent/5 hover:border-accent/80 focus:ring-focus',
    destructive:
      'border border-red-200 bg-surface text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  // Filter out className to ensure it cannot be applied even if TypeScript is bypassed
  const buttonProps = filterClassName(
    props as ButtonProps & { className?: string }
  )

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size])}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
