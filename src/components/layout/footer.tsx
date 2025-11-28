'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'

export function Footer() {
  const pathname = usePathname()
  const currentLocale = useLocale()
  const year = new Date().getFullYear()
  const t = useTranslations('footer')

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
              <Link
                href="/clubs"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                {t('clubs')}
              </Link>
              <span className="text-text-secondary">•</span>
              <Link
                href="/events"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                {t('events')}
              </Link>
              <span className="text-text-secondary">•</span>
              <Link
                href="/calendar"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                {t('calendar')}
              </Link>
            </div>

            {/* Language Toggle */}
            <div className="text-sm">
              {currentLocale === 'fr' ? (
                <Link
                  href={pathname}
                  locale="en"
                  className="text-text-secondary hover:text-primary transition-colors underline"
                >
                  {t('language.english')}
                </Link>
              ) : (
                <Link
                  href={pathname}
                  locale="fr"
                  className="text-text-secondary hover:text-primary transition-colors underline"
                >
                  {t('language.french')}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-secondary">
            © {year} quebec.run
            <span className="mx-2">•</span>
            <Link
              href="/legal/terms"
              className="hover:text-primary transition-colors"
            >
              {t('terms')}
            </Link>
            <span className="mx-2">•</span>
            <Link
              href="/legal/privacy"
              className="hover:text-primary transition-colors"
            >
              {t('privacy')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
