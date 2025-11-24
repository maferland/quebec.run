'use client'

import { MobileMenu } from '@/components/ui/mobile-menu'
import { DesktopNavigation } from '@/components/layout/desktop-navigation'
import { MapPin } from 'lucide-react'
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

          <div className="flex items-center space-x-4">
            <DesktopNavigation />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
