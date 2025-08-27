import { Link as NextIntlLink } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

export type LinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

export function Link({
  href,
  children,
  className,
  external = false,
  ...props
}: LinkProps) {
  const baseStyles =
    'text-blue-600 hover:text-blue-800 hover:underline transition-colors'

  // Auto-detect external links
  const isExternal =
    external || href.startsWith('http') || href.startsWith('https')

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseStyles, 'inline-flex items-center gap-1', className)}
        {...props}
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  return (
    <NextIntlLink href={href} className={cn(baseStyles, className)} {...props}>
      {children}
    </NextIntlLink>
  )
}
