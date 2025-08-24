import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { EventCard } from './event-card'

const mockEvent = {
  id: 'event-1',
  title: '6AM Club Limoilou',
  description: 'Course matinale dans le quartier Limoilou',
  address: '250 3e Rue, Québec, QC G1L 2B3',
  date: new Date('2025-01-24T06:00:00'),
  time: '06:00',
  distance: '5-8 km',
  pace: 'Rythme modéré',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  clubId: 'club-1',
}

describe('EventCard', () => {
  it('renders event information correctly', () => {
    render(<EventCard event={mockEvent} />)

    expect(
      screen.getByRole('heading', { name: '6AM Club Limoilou' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Course matinale dans le quartier Limoilou')
    ).toBeInTheDocument()
    expect(screen.getByText('06:00')).toBeInTheDocument()
    expect(screen.getByText('5-8 km')).toBeInTheDocument()
    expect(screen.getByText('Rythme modéré')).toBeInTheDocument()
  })

  it('displays location when address is provided', () => {
    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(
      screen.getByText('250 3e Rue, Québec, QC G1L 2B3')
    ).toBeInTheDocument()
  })

  it('hides location when address is not provided', () => {
    const eventWithoutAddress = { ...mockEvent, address: null }
    render(<EventCard event={eventWithoutAddress} />)

    expect(screen.queryByText('Location')).not.toBeInTheDocument()
  })

  it('shows club name when showClubName is true', () => {
    const eventWithClub = {
      ...mockEvent,
      club: {
        id: 'club-1',
        name: '6AM Club',
      },
    }
    render(<EventCard event={eventWithClub} showClubName={true} />)

    expect(screen.getByText('6AM Club')).toBeInTheDocument()
  })

  it('hides club name by default', () => {
    const eventWithClub = {
      ...mockEvent,
      club: {
        id: 'club-1',
        name: '6AM Club',
      },
    }
    render(<EventCard event={eventWithClub} />)

    expect(screen.queryByText('6AM Club')).not.toBeInTheDocument()
  })

  it('handles missing optional fields gracefully', () => {
    const minimalEvent = {
      ...mockEvent,
      description: null,
      address: null,
      distance: null,
      pace: null,
    }
    render(<EventCard event={minimalEvent} />)

    expect(
      screen.getByRole('heading', { name: '6AM Club Limoilou' })
    ).toBeInTheDocument()
    expect(screen.getByText('06:00')).toBeInTheDocument()
    expect(screen.queryByText('Location')).not.toBeInTheDocument()
  })

  it('renders date in correct format', () => {
    render(<EventCard event={mockEvent} />)

    // Should render in French Canadian format
    expect(screen.getByText(/vendredi.*janvier/i)).toBeInTheDocument()
  })
})
