'use client'

import Link from 'next/link'
import { LogIn, LogOut, Shield, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

type ExploreTopBarProps = {
  desktop: boolean
  locale: string
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
  onLocaleChange: (locale: 'fr' | 'en') => void
  tr: (key: string) => string
}

export function ExploreTopBar({
  desktop,
  locale,
  theme,
  onThemeChange,
  onLocaleChange,
  tr,
}: ExploreTopBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: desktop ? '18px 22px' : '16px',
        pointerEvents: 'none',
      }}
    >
      <Link href={`/${locale}`} className="qr-brand-pill">
        <span className="qr-brand-mark" aria-hidden="true">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-ink)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="14" cy="5" r="1.8" fill="currentColor" stroke="none" />
            <path d="M6 21l3-5 3 1 1-4-4-2 1-3 4 2 2 3" />
          </svg>
        </span>
        <span className="qr-brand-name">
          quebec<span style={{ color: 'var(--accent)' }}>.run</span>
        </span>
      </Link>

      <div className="qr-top-actions">
        {desktop ? (
          <div className="qr-pill-control">
            {(['dark', 'light'] as const).map((value) => (
              <button
                key={value}
                aria-label={
                  value === 'dark' ? tr('theme_dark') : tr('theme_light')
                }
                onClick={() => onThemeChange(value)}
                className={theme === value ? 'is-active' : undefined}
              >
                <ThemeIcon theme={value} />
              </button>
            ))}
          </div>
        ) : (
          <button
            className="qr-account-button"
            aria-label={theme === 'dark' ? tr('theme_light') : tr('theme_dark')}
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          >
            <ThemeIcon theme={theme === 'dark' ? 'light' : 'dark'} />
          </button>
        )}
        {desktop ? (
          <div className="qr-pill-control qr-locale-control">
            {(['fr', 'en'] as const).map((value) => (
              <button
                key={value}
                aria-label={value === 'fr' ? 'Français' : 'English'}
                onClick={() => onLocaleChange(value)}
                className={locale === value ? 'is-active' : undefined}
              >
                {value}
              </button>
            ))}
          </div>
        ) : (
          <button
            className="qr-account-button qr-mobile-locale"
            aria-label={locale === 'fr' ? 'English' : 'Français'}
            onClick={() => onLocaleChange(locale === 'fr' ? 'en' : 'fr')}
          >
            {locale === 'fr' ? 'EN' : 'FR'}
          </button>
        )}
        <ExploreAccountMenu locale={locale} />
      </div>
    </div>
  )
}

function ThemeIcon({ theme }: { theme: 'dark' | 'light' }) {
  return theme === 'dark' ? (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function ExploreAccountMenu({ locale }: { locale: string }) {
  const { data: session, status } = useSession()
  const t = useTranslations('navigation')

  if (status === 'loading') {
    return <span className="qr-account-button skel" aria-hidden="true" />
  }

  if (!session) {
    return (
      <Link
        href={`/${locale}/auth/signin`}
        className="qr-account-button"
        aria-label={t('signIn')}
        title={t('signIn')}
      >
        <LogIn size={17} />
      </Link>
    )
  }

  return (
    <details className="qr-account-menu">
      <summary
        className="qr-account-button"
        aria-label={session.user?.name ?? t('user')}
        title={session.user?.name ?? t('user')}
      >
        <User size={17} />
      </summary>
      <div className="qr-account-popover">
        <span className="qr-account-name">
          {session.user?.name ?? t('user')}
        </span>
        {session.user?.isStaff && (
          <Link href={`/${locale}/admin`}>
            <Shield size={15} />
            {t('admin')}
          </Link>
        )}
        <button type="button" onClick={() => signOut()}>
          <LogOut size={15} />
          {t('signOut')}
        </button>
      </div>
    </details>
  )
}
