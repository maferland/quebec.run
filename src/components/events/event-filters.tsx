'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const SEARCH_DEBOUNCE_MS = 300

type FacetKey = 'openPace'

const FACETS: { key: FacetKey; param: string; value: string }[] = [
  { key: 'openPace', param: 'pacePolicy', value: 'OPEN_PACE' },
]

export function EventFilters() {
  const t = useTranslations('events.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialSearch = searchParams.get('search') ?? ''
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

  const isFacetActive = (facet: (typeof FACETS)[number]) =>
    searchParams.get(facet.param) === facet.value

  const toggleFacet = (facet: (typeof FACETS)[number]) => {
    updateParams({ [facet.param]: isFacetActive(facet) ? '' : facet.value })
  }

  const hasFilters =
    Boolean(initialSearch) || FACETS.some((f) => isFacetActive(f))

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="relative">
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

      <div className="flex flex-wrap items-center gap-2">
        {FACETS.map((facet) => {
          const active = isFacetActive(facet)
          return (
            <button
              key={facet.key}
              type="button"
              onClick={() => toggleFacet(facet)}
              aria-pressed={active}
              className={
                active
                  ? 'rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-white'
                  : 'rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-primary hover:border-primary/40 hover:bg-primary/5'
              }
            >
              {t(`facets.${facet.key}`)}
            </button>
          )
        })}

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-variant"
            aria-label={t('clearFilters')}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            {t('clearFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
