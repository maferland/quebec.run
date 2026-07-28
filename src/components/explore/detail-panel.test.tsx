import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { ClubDetailOverlay, RunDetailOverlay } from './detail-panel'

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

  render(<RunDetailOverlay id="run-1" onClose={onClose} />)

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

  render(<ClubDetailOverlay slug="trail-club" onClose={onClose} />)

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
