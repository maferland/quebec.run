import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import type { ExploreClub } from '@/lib/services/clubs'
import type { ExploreRun } from '@/lib/services/events'
import { ClubCard } from './club-card'
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

const run: ExploreRun = {
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
}

describe.each([
  { key: '{Enter}', label: 'Enter' },
  { key: '[Space]', label: 'Space' },
])('card keyboard activation with $label', ({ key }) => {
  it('opens a focused club card', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<ClubCard club={club} onOpen={onOpen} onIntent={vi.fn()} />)

    await user.tab()
    expect(
      screen.getByRole('button', { name: /Quebec Track Club/ })
    ).toHaveFocus()
    await user.keyboard(key)

    expect(onOpen).toHaveBeenCalled()
  })

  it('selects a focused run card', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <RunCard
        run={run}
        selected={false}
        onSelect={onSelect}
        onOpen={vi.fn()}
        onIntent={vi.fn()}
        nowMin={0}
        day={1}
      />
    )

    await user.tab()
    expect(
      screen.getByRole('button', { name: /Tuesday Intervals/ })
    ).toHaveFocus()
    await user.keyboard(key)

    expect(onSelect).toHaveBeenCalled()
  })
})

it('tabs from an expanded run summary to its details action', async () => {
  const user = userEvent.setup()
  render(
    <RunCard
      run={run}
      selected
      onSelect={vi.fn()}
      onOpen={vi.fn()}
      onIntent={vi.fn()}
      nowMin={0}
      day={1}
    />
  )

  await user.tab()
  expect(
    screen.getByRole('button', { name: /Tuesday Intervals/ })
  ).toHaveFocus()
  await user.tab()

  expect(screen.getByRole('button', { name: /Details/ })).toHaveFocus()
})

it('keeps the collapsed run action out of the tab order', () => {
  const { rerender } = render(
    <RunCard
      run={run}
      selected={false}
      onSelect={vi.fn()}
      onOpen={vi.fn()}
      onIntent={vi.fn()}
      nowMin={0}
      day={1}
    />
  )
  const detailsAction = screen.getByRole('button', {
    name: /Details/,
    hidden: true,
  })

  expect(detailsAction).toHaveAttribute('tabindex', '-1')

  rerender(
    <RunCard
      run={run}
      selected
      onSelect={vi.fn()}
      onOpen={vi.fn()}
      onIntent={vi.fn()}
      nowMin={0}
      day={1}
    />
  )

  expect(screen.getByRole('button', { name: /Details/ })).toBe(detailsAction)
  expect(detailsAction).toHaveAttribute('tabindex', '0')
})
