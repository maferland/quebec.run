import { NavLink } from '@/components/ui/nav-link'
import { Icon } from '@/components/ui/icon'
import { Calendar, CalendarDays, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

type NavigationLinksProps = {
  variant: 'desktop' | 'mobile'
  onLinkClick?: () => void
}

export function NavigationLinks({
  variant,
  onLinkClick,
}: NavigationLinksProps) {
  const { data: session } = useSession()
  const t = useTranslations('navigation')
  const pathname = usePathname()

  const links = [
    {
      href: '/clubs',
      icon: Users,
      label: t('clubs'),
    },
    {
      href: '/events',
      icon: Calendar,
      label: t('events'),
    },
    {
      href: '/calendar',
      icon: CalendarDays,
      label: t('calendar'),
    },
  ]

  if (variant === 'desktop') {
    return (
      <nav className="flex items-center space-x-4 md:space-x-6">
        {links.map(({ href, icon: IconComponent, label }) => (
          <NavLink key={href} href={href} isActive={pathname.endsWith(href)}>
            <IconComponent size={18} />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex flex-col space-y-3">
      {links.map(({ href, icon: IconComponent, label }) => (
        <div key={href} onClick={onLinkClick}>
          <NavLink href={href} isActive={pathname.endsWith(href)}>
            <Icon icon={IconComponent} size="sm" />
            <span>{label}</span>
          </NavLink>
        </div>
      ))}
      {session?.user?.isStaff && (
        <div onClick={onLinkClick}>
          <NavLink href="/admin">
            <span>{t('admin')}</span>
          </NavLink>
        </div>
      )}
    </nav>
  )
}
