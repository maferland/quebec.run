import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { DetailOverlay } from './detail-panel'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn() }),
}))

afterEach(() => {
  vi.restoreAllMocks()
  replace.mockClear()
})

it('keeps a failed run route open and retries its request', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  vi.spyOn(global, 'fetch')
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'run-1',
          title: 'Tuesday Intervals',
          time: '18:00',
          date: '2026-07-21T22:00:00.000Z',
          status: 'SCHEDULED',
          club: { id: 'club-1', slug: 'track', name: 'Track Club' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

  render(
    <DetailOverlay
      overlay={{
        kind: 'run',
        id: 'run-1',
        enter: true,
        exiting: false,
        closeMode: 'route',
      }}
      onClose={onClose}
    />
  )

  expect(
    await screen.findByRole('heading', { name: 'Could not load the run' })
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Back' }))
  expect(onClose).toHaveBeenCalled()

  await user.click(screen.getByRole('button', { name: 'Retry' }))

  expect(
    await screen.findByRole('heading', { name: 'Tuesday Intervals' })
  ).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledTimes(2)
})

it('keeps a failed club route open and retries its request', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  vi.spyOn(global, 'fetch')
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'club-2',
          slug: 'trail-club',
          name: 'Trail Club',
          type: null,
          vibe: null,
          beginnerFriendly: false,
          paceMin: null,
          paceMax: null,
          description: null,
          instagram: null,
          website: null,
          schedule: [],
          upcomingRuns: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

  render(
    <DetailOverlay
      overlay={{
        kind: 'club',
        slug: 'trail-club',
        enter: true,
        exiting: false,
        closeMode: 'route',
      }}
      onClose={onClose}
    />
  )

  expect(
    await screen.findByRole('heading', { name: 'Could not load the club' })
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Back' }))
  expect(onClose).toHaveBeenCalled()

  await user.click(screen.getByRole('button', { name: 'Retry' }))
  expect(
    await screen.findByRole('heading', { name: 'Trail Club' })
  ).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledTimes(2)
})

it("reads the run's own pace as a pace, not a distance", async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        kind: 'one-off',
        id: 'run-1',
        title: 'Special Edition',
        description: null,
        time: '18:00',
        date: '2026-08-06T04:00:00.000Z',
        status: 'SCHEDULED',
        distance: null,
        pace: '6:30',
        club: { id: 'club-1', slug: 'track', name: 'Track Club' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  )

  render(
    <DetailOverlay
      overlay={{
        kind: 'run',
        id: 'run-1',
        enter: true,
        exiting: false,
        closeMode: 'route',
      }}
      onClose={vi.fn()}
    />
  )

  expect(
    await screen.findByRole('heading', { name: 'Special Edition' })
  ).toBeInTheDocument()
  expect(screen.getByText('6:30')).toBeInTheDocument()
  expect(screen.queryByText('6:30 km')).not.toBeInTheDocument()
})

it('keeps a failed place route open and retries its request', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  const place = {
    clubSlug: 'fauxmouvement',
    clubName: 'Faux Mouvement',
    clubDescription: 'A trail crew that meets twice a week.',
    heading: 'Faux Mouvement',
    schedule: 'Every Tuesday at 18:00',
    address: '123 Rue Principale',
    neighborhood: 'Limoilou',
    lat: 46.8,
    lng: -71.2,
    slots: [
      {
        id: 'slot-1',
        title: 'Faux Mouvement',
        schedule: 'Every Tuesday at 18:00',
        distance: '5',
        pace: null,
        pacePolicy: null,
      },
      {
        id: 'slot-2',
        title: 'Faux Mouvement',
        schedule: 'Every Thursday at 18:00',
        distance: null,
        pace: '6:00',
        pacePolicy: 'OPEN_PACE',
      },
    ],
    upcoming: [{ slug: 'mardi', date: '2026-08-11', label: '11 aug.' }],
    otherPlaces: [{ slug: 'jeudi', label: 'Jeudi' }],
  }

  vi.spyOn(global, 'fetch')
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify(place), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

  render(
    <DetailOverlay
      overlay={{
        kind: 'place',
        clubSlug: 'fauxmouvement',
        placeSlug: 'mardi',
        enter: true,
        exiting: false,
        closeMode: 'route',
      }}
      onClose={onClose}
    />
  )

  expect(
    await screen.findByRole('heading', { name: 'Could not load the club' })
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Back' }))
  expect(onClose).toHaveBeenCalled()

  await user.click(screen.getByRole('button', { name: 'Retry' }))
  expect(
    await screen.findByRole('heading', { name: 'Faux Mouvement' })
  ).toBeInTheDocument()
  expect(fetch).toHaveBeenCalledTimes(2)

  expect(screen.getByText('Every Thursday at 18:00')).toBeInTheDocument()
  expect(screen.getByText('123 Rue Principale')).toBeInTheDocument()
  expect(screen.getByText('11 aug.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Jeudi' }))
})

it.each([
  { kind: 'one-off', shown: true },
  { kind: 'recurring', shown: false },
])(
  'shows the run description for a $kind run: $shown',
  async ({ kind, shown }) => {
    const description = 'Limonade Sunrise launch — wear yellow or orange.'
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          kind,
          id: 'run-1',
          title: 'Special Edition',
          description,
          time: '18:00',
          date: '2026-08-06T04:00:00.000Z',
          status: 'SCHEDULED',
          recurringSlug: kind === 'recurring' ? 'thursday' : undefined,
          club: { id: 'club-1', slug: 'track', name: 'Track Club' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    render(
      <DetailOverlay
        overlay={{
          kind: 'run',
          id: 'run-1',
          enter: true,
          exiting: false,
          closeMode: 'route',
        }}
        onClose={vi.fn()}
      />
    )

    expect(
      await screen.findByRole('heading', { name: 'Special Edition' })
    ).toBeInTheDocument()
    if (shown) {
      expect(screen.getByText(description)).toBeInTheDocument()
      expect(screen.getByText('About this run')).toBeInTheDocument()
    } else {
      expect(screen.queryByText(description)).not.toBeInTheDocument()
    }
  }
)
