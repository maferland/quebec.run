'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'

type EventFiltersProps = {
  clubs: Array<{ id: string; name: string }>
  showDateRange?: boolean
}

export function EventFilters({
  clubs,
  showDateRange = true,
}: EventFiltersProps) {
  const t = useTranslations('events.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`?${params.toString()}`)
  }

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateUrl({ search: value || null })
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    debouncedSearch(value)
  }

  const handleClubChange = (clubId: string) => {
    updateUrl({ clubId: clubId || null })
  }

  const handleClearFilters = () => {
    router.push('/events')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <label htmlFor="event-search" className="sr-only">
          {t('searchPlaceholder')}
        </label>
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
          size={20}
        />
        <input
          id="event-search"
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Club Dropdown */}
      <div className="sm:w-64">
        <label htmlFor="club-filter" className="sr-only">
          {t('selectClub')}
        </label>
        <select
          id="club-filter"
          onChange={(e) => handleClubChange(e.target.value)}
          defaultValue={searchParams.get('clubId') ?? ''}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          aria-label={t('selectClub')}
        >
          <option value="">{t('allClubs')}</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range (conditional) */}
      {showDateRange && (
        <div className="sm:w-64">
          <span className="text-sm text-text-secondary">{t('dateRange')}</span>
          {/* Placeholder for future date range picker */}
        </div>
      )}

      {/* Clear Filters */}
      <Button
        variant="ghost"
        onClick={handleClearFilters}
        className="sm:w-auto"
        aria-label={t('clearFilters')}
      >
        <X size={18} className="mr-2" />
        {t('clearFilters')}
      </Button>
    </div>
  )
}
