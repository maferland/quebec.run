import { useTranslations } from 'next-intl'
import type { RefObject } from 'react'
import { Search, X } from 'lucide-react'
import { FilterButton, ModeToggle } from './explore-list'
import { WeekBar, type WeekDay } from './week-bar'

type ExploreControlsProps = {
  mode: 'runs' | 'clubs'
  setMode: (mode: 'runs' | 'clubs') => void
  runCount: number
  clubCount: number
  week: WeekDay[]
  day: number
  setDay: (day: number) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchInputRef: RefObject<HTMLInputElement | null>
  activeFilterCount: number
  onOpenFilters: () => void
}

export function ExploreControls({
  mode,
  setMode,
  runCount,
  clubCount,
  week,
  day,
  setDay,
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  activeFilterCount,
  onOpenFilters,
}: ExploreControlsProps) {
  const t = useTranslations('explore')
  return (
    <>
      <div
        className={`qr-week-slot${mode === 'clubs' ? ' is-inactive' : ''}`}
        aria-hidden={mode === 'clubs'}
        inert={mode === 'clubs'}
      >
        <WeekBar week={week} selected={day} onSelect={setDay} />
      </div>
      <div className="qr-search-toolbar">
        <div
          className={`qr-search-layer${searchOpen ? ' is-open' : ''}`}
          aria-hidden={!searchOpen}
          inert={!searchOpen}
        >
          <div className="qr-search-field">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('search_placeholder')}
            />
          </div>
          <button
            className="tap qr-round-action"
            aria-label={t('search_close')}
            onClick={() => {
              setSearchOpen(false)
              setSearchQuery('')
            }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <div
          className={`qr-toolbar-layer${searchOpen ? ' is-hidden' : ''}`}
          aria-hidden={searchOpen}
          inert={searchOpen}
        >
          <ModeToggle
            mode={mode}
            setMode={setMode}
            runCount={runCount}
            clubCount={clubCount}
          />
          <button
            className="tap qr-round-action"
            aria-label={t('search_open')}
            onClick={() => setSearchOpen(true)}
          >
            <Search size={15} aria-hidden="true" />
          </button>
          <FilterButton n={activeFilterCount} onClick={onOpenFilters} />
        </div>
      </div>
    </>
  )
}
