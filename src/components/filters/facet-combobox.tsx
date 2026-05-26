'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ListFilter, X, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FacetDef } from '@/lib/facets'

export type FacetComboboxProps<TKey extends string, TParam extends string> = {
  facets: readonly FacetDef<TKey, TParam>[]
  iconMap: Record<TKey, LucideIcon>
  facetCounts?: Record<TKey, number>
  /** next-intl namespace exposing searchLabel / clearFilters / comboboxPlaceholder / facets.{key} / noMatches */
  namespace: string
  /** Suppress count badges in the popover until at least one filter is active. */
  hideCountsWhenInactive?: boolean
}

export function FacetCombobox<TKey extends string, TParam extends string>({
  facets,
  iconMap,
  facetCounts,
  namespace,
  hideCountsWhenInactive = false,
}: FacetComboboxProps<TKey, TParam>) {
  const t = useTranslations(namespace)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const isFacetActive = (facet: FacetDef<TKey, TParam>) =>
    searchParams.get(facet.param) === facet.value

  const setParam = (param: TParam, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(param, value)
    else params.delete(param)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const toggleFacet = (facet: FacetDef<TKey, TParam>) => {
    setParam(facet.param, isFacetActive(facet) ? '' : facet.value)
  }

  const clearAll = () => {
    router.push(pathname)
    setQuery('')
  }

  const activeFacets = facets.filter((f) => isFacetActive(f))
  const showCounts = !hideCountsWhenInactive || activeFacets.length > 0

  const lowerQuery = query.trim().toLowerCase()
  const labelFor = (facet: FacetDef<TKey, TParam>): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (t as any)(`facets.${facet.key}`)
  }
  const visibleFacets = lowerQuery
    ? facets.filter((f) => labelFor(f).toLowerCase().includes(lowerQuery))
    : facets

  return (
    <div ref={containerRef} className="relative mb-6">
      <div
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-4 md:p-6 focus-within:border-primary/60 transition-colors"
        onClick={() => {
          inputRef.current?.focus()
          setOpen(true)
        }}
      >
        <ListFilter
          aria-hidden="true"
          className="h-5 w-5 text-text-secondary"
        />

        {activeFacets.map((facet) => {
          const Icon = iconMap[facet.key] as LucideIcon
          return (
            <span
              key={facet.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {labelFor(facet)}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFacet(facet)
                }}
                aria-label={`Remove ${labelFor(facet)}`}
                className="-mr-1 ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/15"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </span>
          )
        })}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          aria-label={t('searchLabel')}
          placeholder={
            activeFacets.length === 0 ? t('comboboxPlaceholder') : ''
          }
          className="min-w-[6rem] flex-1 bg-transparent text-base text-text-primary placeholder:text-text-secondary focus:outline-none"
        />

        {activeFacets.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              clearAll()
            }}
            aria-label={t('clearFilters')}
            className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-variant"
          >
            {t('clearFilters')}
          </button>
        )}
      </div>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface p-3 shadow-lg"
        >
          {visibleFacets.length === 0 && (
            <div className="px-3 py-2 text-sm text-text-secondary">
              {t('noMatches')}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {visibleFacets.map((facet) => {
              const active = isFacetActive(facet)
              const Icon = iconMap[facet.key] as LucideIcon
              const count = facetCounts?.[facet.key]
              const disabled = count === 0 && !active
              return (
                <button
                  key={facet.key}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={disabled}
                  onClick={() => {
                    toggleFacet(facet)
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                  className={
                    active
                      ? 'inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary'
                      : disabled
                        ? 'inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-surface-variant px-3 py-1.5 text-sm text-text-secondary line-through decoration-text-tertiary/50'
                        : 'inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-primary hover:border-primary/40 hover:bg-primary/5'
                  }
                >
                  {active && (
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {labelFor(facet)}
                  {count !== undefined && showCounts && (
                    <span className="ml-0.5 text-xs text-text-secondary">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
