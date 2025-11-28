import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { EventMap } from './event-map'

describe('EventMap', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Test Event 1',
      date: new Date('2025-12-01'),
      time: '18:00',
      address: 'Quebec City',
      latitude: 46.8139,
      longitude: -71.208,
      clubId: 'club1',
      club: { id: 'club1', name: 'Test Club', slug: 'test-club' },
    },
    {
      id: '2',
      title: 'Test Event 2',
      date: new Date('2025-12-02'),
      time: '19:00',
      address: 'Montreal',
      latitude: 45.5017,
      longitude: -73.5673,
      clubId: 'club1',
      club: { id: 'club1', name: 'Test Club', slug: 'test-club' },
    },
  ]

  test('renders map container', () => {
    render(<EventMap events={mockEvents} />)
    const mapContainer = screen.getByRole('application', {
      name: /interactive event map/i,
    })
    expect(mapContainer).toBeInTheDocument()
  })

  test('shows empty state when no events have coordinates', () => {
    const eventsWithoutCoords = [
      {
        id: '3',
        title: 'No Coords Event',
        date: new Date('2025-12-01'),
        time: '18:00',
        address: null,
        latitude: null,
        longitude: null,
        clubId: 'club1',
        club: { id: 'club1', name: 'Test Club', slug: 'test-club' },
      },
    ]

    render(<EventMap events={eventsWithoutCoords} />)
    expect(
      screen.getByText(
        /events will appear on the map once addresses are geocoded/i
      )
    ).toBeInTheDocument()
  })
})
