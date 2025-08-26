import { cn } from '@/lib/utils'

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'outline-primary'
    | 'outline-accent'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  // Remove className from props if it somehow gets passed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { className: _, ...buttonProps } = props
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
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size])}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
