import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { ClubDetailPanel, type ClubDetailData } from './club-detail'
import { RunDetailPanel, type RunDetailData } from './run-detail'

it('opens the related club from a native button', async () => {
  const user = userEvent.setup()
  const onOpenClub = vi.fn()
  const run: RunDetailData = {
    id: 'run-1',
    title: 'Tuesday Intervals',
    description: null,
    time: '18:00',
    date: '2026-07-22T22:00:00.000Z',
    isPast: false,
    status: 'SCHEDULED',
    distance: null,
    pace: null,
    pacePolicy: null,
    address: null,
    placeName: null,
    lat: null,
    lng: null,
    club: {
      id: 'club-1',
      slug: 'track-club',
      name: 'Track Club',
      description: null,
      type: null,
      vibe: null,
      beginnerFriendly: false,
      paceMin: null,
      paceMax: null,
    },
  }

  render(
    <RunDetailPanel
      run={run}
      onBack={vi.fn()}
      onOpenClub={onOpenClub}
      locale="en"
    />
  )

  await user.click(screen.getByRole('button', { name: /Track Club/ }))
  expect(onOpenClub).toHaveBeenCalledWith('track-club')
})

it('opens an upcoming run from a native button', async () => {
  const user = userEvent.setup()
  const onOpenRun = vi.fn()
  const club: ClubDetailData = {
    id: 'club-1',
    slug: 'track-club',
    name: 'Track Club',
    type: null,
    vibe: null,
    beginnerFriendly: false,
    paceMin: null,
    paceMax: null,
    description: null,
    instagram: null,
    website: null,
    schedule: [],
    upcomingRuns: [
      {
        id: 'run-1',
        date: '2026-07-22T22:00:00.000Z',
        time: '18:00',
        title: 'Tempo Run',
        status: 'SCHEDULED',
        distance: null,
        type: null,
      },
    ],
  }

  render(<ClubDetailPanel club={club} onBack={vi.fn()} onOpenRun={onOpenRun} />)

  await user.click(screen.getByRole('button', { name: /Tempo Run/ }))
  expect(onOpenRun).toHaveBeenCalledWith('run-1')
})
