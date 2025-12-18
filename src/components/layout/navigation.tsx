'use client'

import { NavigationLinks } from '@/components/layout/navigation-links'
import { UserDropdown } from '@/components/ui/user-dropdown'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

export function Navigation() {
  const { data: session } = useSession()
  const t = useTranslations('navigation')

  return (
    <div className="flex items-center space-x-6 md:space-x-8">
      <div className="hidden sm:flex items-center space-x-4 md:space-x-6">
        <NavigationLinks variant="desktop" />
      </div>

      {session && (
        <div className="hidden sm:block">
          <UserDropdown
            userName={session.user?.name || t('user')}
            userEmail={session.user?.email || undefined}
          />
        </div>
      )}

      <MobileMenu />
    </div>
  )
}
