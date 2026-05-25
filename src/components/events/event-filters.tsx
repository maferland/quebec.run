'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const SEARCH_DEBOUNCE_MS = 300

export type EventFiltersProps = {
  clubs: { slug: string; name: string }[]
}

export function EventFilters({ clubs }: EventFiltersProps) {
  const t = useTranslations('events.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialSearch = searchParams.get('search') ?? ''
  const clubSlug = searchParams.get('clubSlug') ?? ''
  const pacePolicy = searchParams.get('pacePolicy') ?? ''

  const [search, setSearch] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearch(searchParams.get('search') ?? '')
  }, [searchParams])

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams)
    for (const [key, val] of Object.entries(updates)) {
      if (val) params.set(key, val)
      else params.delete(key)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const onSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value.trim() })
    }, SEARCH_DEBOUNCE_MS)
  }

  const hasFilters = Boolean(initialSearch || clubSlug || pacePolicy)

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
        />
        <Input
          type="search"
          aria-label={t('searchLabel')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9"
        />
      </div>

      <select
        aria-label={t('clubLabel')}
        value={clubSlug}
        onChange={(e) => updateParams({ clubSlug: e.target.value })}
        className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        <option value="">{t('allClubs')}</option>
        {clubs.map((club) => (
          <option key={club.slug} value={club.slug}>
            {club.name}
          </option>
        ))}
      </select>

      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text-primary hover:bg-surface-variant has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
        <input
          type="checkbox"
          checked={pacePolicy === 'OPEN_PACE'}
          onChange={(e) =>
            updateParams({ pacePolicy: e.target.checked ? 'OPEN_PACE' : '' })
          }
          className="h-4 w-4 accent-primary"
        />
        {t('openPaceOnly')}
      </label>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => router.push(pathname)}
          aria-label={t('clearFilters')}
        >
          <X className="h-4 w-4" />
          {t('clearFilters')}
        </Button>
      )}
    </div>
  )
}
