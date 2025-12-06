import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import AdminEventsPage from './page'
import { getAllEventsForAdmin } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'
import { getServerSession } from 'next-auth'

vi.mock('@/lib/services/events')
vi.mock('@/lib/services/clubs')
vi.mock('next-auth')
vi.mock('next-intl/server', () => ({
  getTranslations: () => (key: string) => key,
}))
vi.mock('@/components/events/event-filters', () => ({
  EventFilters: ({
    clubs,
    showDateRange,
  }: {
    clubs: Array<{ id: string; name: string }>
    showDateRange?: boolean
  }) => (
    <div data-testid="event-filters">
      <select role="combobox" aria-label="Filter by club">
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
      {showDateRange && <div>Date Range Picker</div>}
    </div>
  ),
}))
vi.mock('@/components/admin/delete-event-button', () => ({
  DeleteEventButton: () => <button>Delete</button>,
}))

describe('AdminEventsPage', () => {
  const mockSession = {
    user: { id: 'user1', email: 'admin@test.com', isAdmin: true },
  }

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
      title: 'Past Event',
      date: new Date('2020-01-01'),
      time: '10:00',
      address: 'Old Location',
      description: null,
      club: { name: 'Montreal Runners', slug: 'montreal' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(getAllClubs).mockResolvedValue(mockClubs)
  })

  it('passes searchParams to getAllEventsForAdmin', async () => {
    vi.mocked(getAllEventsForAdmin).mockResolvedValue(mockEvents)

    const searchParams = { search: 'past', clubId: 'club1' }
    await AdminEventsPage({ searchParams: Promise.resolve(searchParams) })

    expect(getAllEventsForAdmin).toHaveBeenCalledWith({
      user: mockSession.user,
      data: searchParams,
    })
  })

  it('renders EventFilters without date range', async () => {
    vi.mocked(getAllEventsForAdmin).mockResolvedValue(mockEvents)

    const Component = await AdminEventsPage({
      searchParams: Promise.resolve({}),
    })
    render(Component)

    expect(screen.queryByText('Date Range Picker')).not.toBeInTheDocument()
  })

  it('renders past events for admin', async () => {
    vi.mocked(getAllEventsForAdmin).mockResolvedValue(mockEvents)

    const Component = await AdminEventsPage({
      searchParams: Promise.resolve({}),
    })
    render(Component)

    expect(screen.getByText('Past Event')).toBeInTheDocument()
  })
})
