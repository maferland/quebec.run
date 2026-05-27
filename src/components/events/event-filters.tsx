'use client'

import {
  Users,
  Sunrise,
  Sunset,
  CalendarRange,
  Coffee,
  Dumbbell,
  Sparkles,
  Eye,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FacetCombobox } from '@/components/filters/facet-combobox'
import type { FacetCounts } from '@/lib/services/events'
import {
  EVENT_FACETS,
  type EventFacetDef,
  type EventFacetKey,
} from '@/lib/facets'

const FACET_ICONS: Record<EventFacetKey, LucideIcon> = {
  openPace: Users,
  morning: Sunrise,
  evening: Sunset,
  weekend: CalendarRange,
  social: Coffee,
  training: Dumbbell,
  beginner: Sparkles,
  showPast: Eye,
}

export type EventFiltersProps = {
  facetCounts?: FacetCounts
  hideCountsWhenInactive?: boolean
  /** Override the facet list (default: EVENT_FACETS). */
  facets?: readonly EventFacetDef[]
}

export function EventFilters({
  facetCounts,
  hideCountsWhenInactive,
  facets = EVENT_FACETS,
}: EventFiltersProps = {}) {
  const t = useTranslations('events.filters.facets')
  return (
    <FacetCombobox
      facets={facets}
      iconMap={FACET_ICONS}
      facetCounts={facetCounts}
      namespace="events.filters"
      getLabel={(key) => t(key)}
      hideCountsWhenInactive={hideCountsWhenInactive}
    />
  )
}
