import { Link } from '@/i18n/navigation'
import { NavLink } from '@/components/ui/nav-link'
import { Icon } from '@/components/ui/icon'
import { Calendar, Users, Settings } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

type NavigationLinksProps = {
  variant: 'desktop' | 'mobile'
  onLinkClick?: () => void
}

const isActiveRoute = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

export function NavigationLinks({
  variant,
  onLinkClick,
}: NavigationLinksProps) {
  const { data: session } = useSession()
  const t = useTranslations('navigation')
  const pathname = usePathname()

  // /events and /calendar are permanent redirects to the explore shell, so the
  // nav points at what they land on.
  const links = [
    {
      href: '/',
      icon: Calendar,
      label: t('explore'),
    },
    {
      href: '/clubs',
      icon: Users,
      label: t('clubs'),
    },
  ]

  if (variant === 'desktop') {
    return (
      <nav className="flex items-center space-x-4 md:space-x-6">
        {links.map(({ href, icon: IconComponent, label }) => (
          <NavLink
            key={href}
            href={href}
            isActive={isActiveRoute(pathname, href)}
          >
            <IconComponent size={18} />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, icon: IconComponent, label }) => {
        const active = isActiveRoute(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl font-body text-base transition-colors',
              active
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-text-primary hover:bg-surface-variant active:bg-surface-variant'
            )}
          >
            <Icon icon={IconComponent} size="md" decorative />
            <span>{label}</span>
          </Link>
        )
      })}
      {session?.user?.isStaff && (
        <Link
          href="/admin"
          onClick={onLinkClick}
          aria-current={isActiveRoute(pathname, '/admin') ? 'page' : undefined}
          className={cn(
            'mt-2 pt-3 flex items-center gap-3 px-4 py-3 rounded-xl font-body text-base transition-colors border-t border-border rounded-t-none',
            isActiveRoute(pathname, '/admin')
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-text-primary hover:bg-surface-variant active:bg-surface-variant'
          )}
        >
          <Icon icon={Settings} size="md" decorative />
          <span>{t('admin')}</span>
        </Link>
      )}
    </nav>
  )
}
