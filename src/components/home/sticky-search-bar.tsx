'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

type StickySearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function StickySearchBar({
  value,
  onChange,
  placeholder,
  className,
}: StickySearchBarProps) {
  const t = useTranslations('home.search')
  const isSearching = value.length > 0

  return (
    <div
      className={cn(
        'py-12 bg-white',
        isSearching &&
          'sticky top-20 z-40 bg-white/95 backdrop-blur-sm shadow-sm',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {!isSearching && (
            <h2 className="text-3xl font-heading font-bold text-primary text-center mb-8">
              {t('title')}
            </h2>
          )}
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent"
                  size={20}
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder || t('placeholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-body bg-white"
                />
              </div>
              <Link href="/events">
                <Button variant="secondary">{t('browseAll')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
