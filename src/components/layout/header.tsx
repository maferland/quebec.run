'use client'

import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { UserDropdown } from '@/components/ui/user-dropdown'
import { Calendar, MapPin, Users } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const QuebecRunLogo = ({ t }: { t: (key: string) => string }) => (
  <div className="flex items-center space-x-3">
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm">
      <MapPin size={18} className="text-text-inverse" />
    </div>
    <div>
      <div className="text-xl font-heading font-bold text-primary leading-tight">
        quebec<span className="text-secondary">.run</span>
      </div>
      <div className="text-xs text-text-secondary font-body opacity-75 -mt-0.5">
        {t('logoTagline')}
      </div>
    </div>
  </div>
)

export function Header() {
  const { data: session, status } = useSession()
  const t = useTranslations('navigation')

  return (
    <header className="bg-surface shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <QuebecRunLogo t={t} />
          </Link>

          <div className="flex items-center space-x-6 md:space-x-8">
            <nav className="hidden sm:flex items-center space-x-4 md:space-x-6">
              <NavLink href="/clubs">
                <Users size={18} />
                <span className="hidden md:inline">{t('clubs')}</span>
              </NavLink>
              <NavLink href="/events">
                <Calendar size={18} />
                <span className="hidden md:inline">{t('events')}</span>
              </NavLink>
              {session?.user?.isStaff && (
                <NavLink href="/admin">
                  <span>{t('admin')}</span>
                </NavLink>
              )}
            </nav>

            <div className="flex items-center space-x-3">
              {status === 'loading' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-9 bg-surface-secondary rounded-md animate-pulse" />
                </div>
              ) : session ? (
                <UserDropdown
                  userName={session.user?.name || t('user')}
                  userEmail={session.user?.email || undefined}
                />
              ) : (
                <Button
                  size="sm"
                  onClick={() => signIn()}
                  variant="outline-primary"
                >
                  {t('signIn')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
