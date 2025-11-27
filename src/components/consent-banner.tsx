'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

type ConsentBannerProps = {
  onAccept: () => void
}

export function ConsentBanner({ onAccept }: ConsentBannerProps) {
  const t = useTranslations('consent.banner')

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-secondary text-center sm:text-left">
            {t.rich('message', {
              termsLink: (chunks) => (
                <Link
                  href="/legal/terms"
                  className="text-primary hover:underline font-medium"
                >
                  {chunks}
                </Link>
              ),
              privacyLink: (chunks) => (
                <Link
                  href="/legal/privacy"
                  className="text-primary hover:underline font-medium"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>

          <button
            onClick={onAccept}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap font-medium"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
