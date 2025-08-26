import { cn } from '@/lib/utils'

export type TypographyVariant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'body'
  | 'bodyLarge'
  | 'bodySmall'
  | 'caption'
  | 'overline'

export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'muted'
  | 'inherit'

export type TypographyWeight =
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'

export type TypographyAlign = 'left' | 'center' | 'right' | 'justify'

export type TypographyProps = {
  variant?: TypographyVariant
  color?: TypographyColor
  weight?: TypographyWeight
  align?: TypographyAlign
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLElement>

// Variant configurations: element, styles, font family
const variantConfig = {
  heading1: {
    element: 'h1' as const,
    styles: 'text-4xl md:text-5xl leading-tight',
    family: 'font-heading',
  },
  heading2: {
    element: 'h2' as const,
    styles: 'text-3xl md:text-4xl leading-tight',
    family: 'font-heading',
  },
  heading3: {
    element: 'h3' as const,
    styles: 'text-2xl md:text-3xl leading-snug',
    family: 'font-heading',
  },
  heading4: {
    element: 'h4' as const,
    styles: 'text-xl md:text-2xl leading-snug',
    family: 'font-heading',
  },
  heading5: {
    element: 'h5' as const,
    styles: 'text-lg md:text-xl leading-snug',
    family: 'font-heading',
  },
  heading6: {
    element: 'h6' as const,
    styles: 'text-base md:text-lg leading-normal',
    family: 'font-heading',
  },
  body: {
    element: 'p' as const,
    styles: 'text-base leading-relaxed',
    family: 'font-body',
  },
  bodyLarge: {
    element: 'p' as const,
    styles: 'text-lg leading-relaxed',
    family: 'font-body',
  },
  bodySmall: {
    element: 'p' as const,
    styles: 'text-sm leading-relaxed',
    family: 'font-body',
  },
  caption: {
    element: 'span' as const,
    styles: 'text-xs leading-normal',
    family: 'font-body',
  },
  overline: {
    element: 'span' as const,
    styles: 'text-xs uppercase tracking-wider leading-normal',
    family: 'font-body',
  },
}

const colorVariants: Record<TypographyColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  muted: 'text-accent/70',
  inherit: 'text-inherit',
}

const weightVariants: Record<TypographyWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const alignVariants: Record<TypographyAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

export function Typography({
  variant = 'body',
  color = 'inherit',
  weight,
  align = 'left',
  as,
  className,
  children,
  ...props
}: TypographyProps) {
  const config = variantConfig[variant]
  const Component = as || config.element

  // Default weights for different variant types
  const defaultWeight =
    weight || (variant.startsWith('heading') ? 'bold' : 'normal')

  return (
    <Component
      className={cn(
        config.styles,
        config.family,
        colorVariants[color],
        weightVariants[defaultWeight],
        alignVariants[align],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

// Convenience components for common use cases
export function Heading({
  level = 1,
  ...props
}: Omit<TypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const variantMap = {
    1: 'heading1' as const,
    2: 'heading2' as const,
    3: 'heading3' as const,
    4: 'heading4' as const,
    5: 'heading5' as const,
    6: 'heading6' as const,
  }

  return <Typography variant={variantMap[level]} {...props} />
}

export function Text(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="body" {...props} />
}

export function Caption(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="caption" {...props} />
}

export function Overline(props: Omit<TypographyProps, 'variant'>) {
  return <Typography variant="overline" {...props} />
}
