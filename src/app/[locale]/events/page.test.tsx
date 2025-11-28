import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import EventsPage from './page'
import { getAllEvents } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'

vi.mock('@/lib/services/events')
vi.mock('@/lib/services/clubs')
vi.mock('next-intl/server', () => ({
  getTranslations: () => (key: string) => key,
}))
vi.mock('@/components/events/event-filters', () => ({
  EventFilters: ({ clubs }: { clubs: Array<{ id: string; name: string }> }) => (
    <div data-testid="event-filters">
      <select role="combobox" aria-label="Filter by club">
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </div>
  ),
}))

describe('EventsPage', () => {
  const mockClubs = [
    {
      id: 'club1',
      name: 'Montreal Runners',
      slug: 'montreal',
      description: null,
      events: [],
    },
    {
      id: 'club2',
      name: 'Quebec Joggers',
      slug: 'quebec',
      description: null,
      events: [],
    },
  ]

  const mockEvents = [
    {
      id: 'event1',
      title: 'Morning Run',
      date: new Date('2025-12-15'),
      time: '08:00',
      address: 'Montreal',
      distance: null,
      pace: null,
      club: {
        name: 'Montreal Runners',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAllClubs).mockResolvedValue(mockClubs)
  })

  it('passes searchParams to getAllEvents', async () => {
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents)

    const searchParams = { search: 'montreal', clubId: 'club1' }
    await EventsPage({ searchParams })

    expect(getAllEvents).toHaveBeenCalledWith({ data: searchParams })
  })

  it('renders EventFilters with clubs', async () => {
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents)

    const Component = await EventsPage({ searchParams: {} })
    render(Component)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders events when results exist', async () => {
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents)

    const Component = await EventsPage({ searchParams: {} })
    render(Component)

    expect(screen.getByText('Morning Run')).toBeInTheDocument()
  })

  it('renders empty state when no events', async () => {
    vi.mocked(getAllEvents).mockResolvedValue([])

    const Component = await EventsPage({ searchParams: {} })
    render(Component)

    expect(screen.getByText('empty.noResults')).toBeInTheDocument()
  })
})
