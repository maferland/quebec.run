'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const locales = [
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
] as const

export function LanguageSwitcher() {
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return

    // Remove the current locale from the pathname
    const segments = pathname.split('/').filter(Boolean)
    const pathWithoutLocale = segments.slice(1).join('/') // Remove first segment (locale)
    const newPath = `/${newLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ''}`

    router.push(newPath)
  }

  return (
    <div className="relative inline-flex items-center">
      <Globe size={16} className="text-text-secondary mr-2" />
      <div className="flex rounded-md border border-border bg-surface overflow-hidden">
        {locales.map((locale) => {
          const isActive = locale.code === currentLocale
          return (
            <button
              key={locale.code}
              onClick={() => handleLocaleChange(locale.code)}
              className={cn(
                'px-2 py-1 text-xs font-medium transition-all duration-200',
                'hover:bg-hover focus:outline-none focus:ring-1 focus:ring-focus',
                isActive
                  ? 'bg-primary text-text-inverse'
                  : 'text-text-secondary hover:text-text-primary'
              )}
              aria-label={`Switch to ${locale.label}`}
            >
              <span className="flex items-center space-x-1">
                <span role="img" aria-hidden="true">
                  {locale.flag}
                </span>
                <span>{locale.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
