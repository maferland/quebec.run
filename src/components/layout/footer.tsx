'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'

type LinkProps = Parameters<typeof Link>[0]
const FooterLink = (props: Omit<LinkProps, 'className'>) => {
  return (
    <Link
      className="text-text-secondary hover:text-primary transition-colors underline"
      {...props}
    />
  )
}

const LanguageToggle = () => {
  const pathname = usePathname()
  const currentLocale = useLocale()
  const t = useTranslations('footer')
  const nextLocale = currentLocale === 'en' ? 'fr' : 'en'
  console.log({ currentLocale, nextLocale, pathname })
  return (
    <div className="text-sm">
      <FooterLink href={pathname} locale={nextLocale}>
        {t(nextLocale)}
      </FooterLink>
    </div>
  )
}

export function Footer() {
  const t = useTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between items-center space-y-6 md:space-y-0">
          {/* Logo and Description - Left aligned */}
          <div className="text-center md:text-left md:flex-shrink-0">
            <div className="text-lg font-heading font-bold text-primary">
              quebec<span className="text-secondary">.run</span>
            </div>
            <p className="text-sm text-text-secondary font-body mt-1">
              {t('tagline')}
            </p>
          </div>

          {/* Right aligned content */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            {/* Navigation Links */}
            <div className="flex items-center space-x-6 text-sm">
              <FooterLink href="/clubs">{t('clubs')}</FooterLink>

              <FooterLink href="/events">{t('events')}</FooterLink>

              <FooterLink href="/calendar">{t('calendar')}</FooterLink>
            </div>

            {/* Language Toggle */}
            <LanguageToggle />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-secondary">© {year} quebec.run</p>
        </div>
      </div>
    </footer>
  )
}
