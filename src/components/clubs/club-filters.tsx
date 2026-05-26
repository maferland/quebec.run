'use client'

import { Footprints, Mountain, Coffee, Dumbbell, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FacetCombobox } from '@/components/filters/facet-combobox'
import { CLUB_FACETS, type ClubFacetKey } from '@/lib/facets'
import type { ClubFacetCounts } from '@/lib/services/clubs'

const FACET_ICONS: Record<ClubFacetKey, LucideIcon> = {
  road: Footprints,
  trail: Mountain,
  social: Coffee,
  training: Dumbbell,
  beginner: Sparkles,
}

export type ClubFiltersProps = {
  facetCounts?: ClubFacetCounts
}

export function ClubFilters({ facetCounts }: ClubFiltersProps = {}) {
  return (
    <FacetCombobox
      facets={CLUB_FACETS}
      iconMap={FACET_ICONS}
      facetCounts={facetCounts}
      namespace="clubs.filters"
    />
  )
}
