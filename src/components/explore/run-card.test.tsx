import { describe, expect, it } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import type { ExploreClub } from '@/lib/services/clubs'
import type { ExploreRun } from '@/lib/services/events'
import { RunCard } from './run-card'

const club: ExploreClub = {
  id: 'club-1',
  slug: 'quebec-track-club',
  name: 'Quebec Track Club',
  type: 'TRACK',
  vibe: 'TRAINING',
  beginnerFriendly: true,
  paceMin: '4.5',
  paceMax: '6',
  description: 'Weekly social runs for all paces.',
  website: null,
  instagram: null,
  facebook: null,
  memberCount: 24,
  lat: 46.81,
  lng: -71.21,
}

const run = (over: Partial<ExploreRun> = {}): ExploreRun => ({
  id: 'run-1',
  title: 'Tuesday Intervals',
  time: '18:00',
  status: 'SCHEDULED',
  lat: 46.81,
  lng: -71.21,
  distance: '5',
  pace: null,
  isPast: false,
  address: '100 Grande Allee, Quebec, QC',
  neighborhood: 'Montcalm',
  club: {
    id: club.id,
    slug: club.slug,
    name: club.name,
    type: club.type,
    vibe: club.vibe,
    beginnerFriendly: club.beginnerFriendly,
    paceMin: club.paceMin,
    paceMax: club.paceMax,
  },
  ...over,
})

describe('RunCard pace', () => {
  it("shows the run's own pace over the club range", () => {
    render(
      <RunCard
        run={run({ pace: '6:30' })}
        selected={false}
        onSelect={() => {}}
        onOpen={() => {}}
        onIntent={() => {}}
        nowMin={0}
        day={1}
      />
    )

    expect(screen.getByText('6:30 /km')).toBeInTheDocument()
  })

  it("falls back to the club's pace range when the run has none", () => {
    render(
      <RunCard
        run={run({ pace: null })}
        selected={false}
        onSelect={() => {}}
        onOpen={() => {}}
        onIntent={() => {}}
        nowMin={0}
        day={1}
      />
    )

    expect(screen.getByText('4:30–6:00 /km')).toBeInTheDocument()
  })
})
