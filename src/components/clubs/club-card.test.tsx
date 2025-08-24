import { render, screen } from '@/lib/test-utils'
import { describe, expect, it } from 'vitest'
import { ClubCard } from './club-card'
import type { GetAllClubsReturn } from '@/lib/services/clubs'

describe('ClubCard', () => {
  const mockClub: GetAllClubsReturn = {
    id: 'club-1',
    name: 'Test Running Club',
    slug: 'test-running-club',
    description: 'A club for testing purposes',
    events: [
      {
        id: 'event-1',
        title: 'Morning Run',
        date: new Date('2025-01-20T07:00:00'),
        time: '07:00',
        distance: '5km',
        pace: '5:00/km',
      },
      {
        id: 'event-2',
        title: 'Evening Run',
        date: new Date('2025-01-21T18:00:00'),
        time: '18:00',
        distance: '10km',
        pace: '4:30/km',
      },
    ],
  }

  it('renders club information', () => {
    render(<ClubCard club={mockClub} />)

    expect(screen.getByText('Test Running Club')).toBeInTheDocument()
    expect(screen.getByText('A club for testing purposes')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // Event count
  })

  it('displays events', () => {
    render(<ClubCard club={mockClub} />)

    expect(screen.getByText('Morning Run')).toBeInTheDocument()
    expect(screen.getByText('Evening Run')).toBeInTheDocument()
    expect(screen.getByText('07:00')).toBeInTheDocument()
    expect(screen.getByText('18:00')).toBeInTheDocument()
  })

  it('shows view details link', () => {
    render(<ClubCard club={mockClub} />)
    expect(screen.getByText('View details →')).toBeInTheDocument()
  })

  it('links to correct club page', () => {
    render(<ClubCard club={mockClub} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/clubs/test-running-club')
  })

  it('does not render when club has no events', () => {
    const clubWithoutEvents: GetAllClubsReturn = {
      ...mockClub,
      events: [],
    }

    const { container } = render(<ClubCard club={clubWithoutEvents} />)
    expect(container.firstChild).toBeNull()
  })

  it('handles club without description', () => {
    const clubWithoutDescription: GetAllClubsReturn = {
      ...mockClub,
      description: null,
    }

    render(<ClubCard club={clubWithoutDescription} />)
    expect(screen.getByText('Test Running Club')).toBeInTheDocument()
    expect(
      screen.queryByText('A club for testing purposes')
    ).not.toBeInTheDocument()
  })

  it('limits events displayed to maximum', () => {
    const clubWithManyEvents: GetAllClubsReturn = {
      ...mockClub,
      events: [
        ...mockClub.events,
        {
          id: 'event-3',
          title: 'Third Run',
          date: new Date('2025-01-22T09:00:00'),
          time: '09:00',
          distance: '7km',
          pace: '5:30/km',
        },
        {
          id: 'event-4',
          title: 'Fourth Run',
          date: new Date('2025-01-23T19:00:00'),
          time: '19:00',
          distance: '12km',
          pace: '4:15/km',
        },
      ],
    }

    render(<ClubCard club={clubWithManyEvents} />)

    // Should show "+1 more this week" text when there are more than 3 events
    expect(screen.getByText('+1 more this week')).toBeInTheDocument()
  })
})
