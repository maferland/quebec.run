import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { EventCard } from './event-card'
import type { GetAllEventsReturn } from '@/lib/services/events'

// Mock event data structure matching service return type
const mockEventWithClub: GetAllEventsReturn = {
  id: 'event-1',
  title: 'Morning 5K Run',
  address: '250 3e Rue, Québec, QC G1L 2B3',
  date: new Date('2025-09-04T06:00:00-04:00'),
  time: '06:00',
  distance: '5K',
  pace: '5:30 /km',
  club: {
    name: 'Quebec Running Club',
  },
}

describe('EventCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders event title correctly', () => {
      render(<EventCard event={mockEventWithClub} />)

      expect(
        screen.getByRole('heading', { name: 'Morning 5K Run' })
      ).toBeInTheDocument()
    })

    it('renders as a clickable link to event details', () => {
      render(<EventCard event={mockEventWithClub} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/events/event-1')
      expect(link).toBeVisible()
    })

    it('displays as a structured card with proper content', () => {
      const { container } = render(<EventCard event={mockEventWithClub} />)

      const card = container.querySelector('article')
      expect(card).toBeVisible()
      expect(card).toContainElement(
        screen.getByRole('heading', { name: 'Morning 5K Run' })
      )
      expect(card).toContainElement(screen.getByText(/Thu, Sep 4/))
    })
  })

  describe('Date and Time Display', () => {
    it('renders date in correct format with clock icon', () => {
      render(<EventCard event={mockEventWithClub} />)

      // Should display formatted date
      expect(screen.getByText(/Thu, Sep 4/)).toBeInTheDocument()
      expect(screen.getByText(/06:00/)).toBeInTheDocument()

      // Should have clock icon
      const clockIcon =
        document.querySelector('[data-icon="clock"]') ||
        document.querySelector('svg')
      expect(clockIcon).toBeInTheDocument()
    })

    it('formats different dates correctly', () => {
      const eventWithDifferentDate = {
        ...mockEventWithClub,
        date: new Date('2025-12-25T18:30:00-05:00'),
        time: '18:30',
      }

      render(<EventCard event={eventWithDifferentDate} />)

      expect(screen.getByText(/Thu, Dec 25/)).toBeInTheDocument()
      expect(screen.getByText(/18:30/)).toBeInTheDocument()
    })

    it('displays datetime information clearly', () => {
      render(<EventCard event={mockEventWithClub} />)

      const datetimeTag = screen.getByText(/Thu, Sep 4/)
      expect(datetimeTag).toBeVisible()
      expect(datetimeTag).toHaveTextContent('Thu, Sep 4')
    })
  })

  describe('Event Details Tags', () => {
    it('displays distance information when provided', () => {
      render(<EventCard event={mockEventWithClub} />)

      const distanceTag = screen.getByText('5K')
      expect(distanceTag).toBeVisible()
      expect(distanceTag).toHaveTextContent('5K')
    })

    it('displays pace information when provided', () => {
      render(<EventCard event={mockEventWithClub} />)

      const paceTag = screen.getByText('5:30 /km')
      expect(paceTag).toBeVisible()
      expect(paceTag).toHaveTextContent('5:30 /km')
    })

    it('hides distance tag when distance is null', () => {
      const eventWithoutDistance = {
        ...mockEventWithClub,
        distance: null,
      }

      render(<EventCard event={eventWithoutDistance} />)

      expect(screen.queryByText('5K')).not.toBeInTheDocument()
    })

    it('hides pace tag when pace is null', () => {
      const eventWithoutPace = {
        ...mockEventWithClub,
        pace: null,
      }

      render(<EventCard event={eventWithoutPace} />)

      expect(screen.queryByText('5:30 /km')).not.toBeInTheDocument()
    })

    it('handles both distance and pace being null', () => {
      const minimalEvent = {
        ...mockEventWithClub,
        distance: null,
        pace: null,
      }

      render(<EventCard event={minimalEvent} />)

      // Should still display basic event information
      expect(
        screen.getByRole('heading', { name: 'Morning 5K Run' })
      ).toBeVisible()
      expect(screen.getByText(/Thu, Sep 4/)).toBeVisible()
      expect(screen.queryByText('5K')).not.toBeInTheDocument()
      expect(screen.queryByText('5:30 /km')).not.toBeInTheDocument()
    })

    it('displays tags with proper content', () => {
      render(<EventCard event={mockEventWithClub} />)

      const distanceTag = screen.getByText('5K')
      const paceTag = screen.getByText('5:30 /km')

      expect(distanceTag).toBeVisible()
      expect(paceTag).toBeVisible()
    })
  })

  describe('Location Display', () => {
    it('displays location when address is provided', () => {
      render(<EventCard event={mockEventWithClub} />)

      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(
        screen.getByText('250 3e Rue, Québec, QC G1L 2B3')
      ).toBeInTheDocument()

      // Should have map pin icon
      const mapIcon = document.querySelector('svg')
      expect(mapIcon).toBeInTheDocument()
    })

    it('hides location when address is null', () => {
      const eventWithoutAddress = {
        ...mockEventWithClub,
        address: null,
      }

      render(<EventCard event={eventWithoutAddress} />)

      expect(screen.queryByText('Location')).not.toBeInTheDocument()
      expect(
        screen.queryByText('250 3e Rue, Québec, QC G1L 2B3')
      ).not.toBeInTheDocument()
    })

    it('handles missing address gracefully', () => {
      const eventWithoutAddress = {
        ...mockEventWithClub,
        address: null,
      }

      render(<EventCard event={eventWithoutAddress} />)

      // Should still display event details without location
      expect(
        screen.getByRole('heading', { name: 'Morning 5K Run' })
      ).toBeVisible()
      expect(screen.queryByText('Location')).not.toBeInTheDocument()
    })

    it('displays location information clearly', () => {
      render(<EventCard event={mockEventWithClub} />)

      expect(screen.getByText('Location')).toBeVisible()
      expect(screen.getByText('250 3e Rue, Québec, QC G1L 2B3')).toBeVisible()
    })
  })

  describe('Club Name Display', () => {
    it('shows club name when showClubName is true', () => {
      render(<EventCard event={mockEventWithClub} showClubName={true} />)

      expect(screen.getByText('Quebec Running Club')).toBeInTheDocument()
    })

    it('hides club name by default (showClubName false)', () => {
      render(<EventCard event={mockEventWithClub} />)

      expect(screen.queryByText('Quebec Running Club')).not.toBeInTheDocument()
    })

    it('hides club name when showClubName is explicitly false', () => {
      render(<EventCard event={mockEventWithClub} showClubName={false} />)

      expect(screen.queryByText('Quebec Running Club')).not.toBeInTheDocument()
    })

    it('handles club name display correctly when showClubName is false', () => {
      render(<EventCard event={mockEventWithClub} showClubName={false} />)

      // Should not display club name when showClubName is false
      expect(screen.queryByText('Quebec Running Club')).not.toBeInTheDocument()
    })

    it('displays club name when enabled', () => {
      render(<EventCard event={mockEventWithClub} showClubName={true} />)

      const clubName = screen.getByText('Quebec Running Club')
      expect(clubName).toBeVisible()
      expect(clubName).toHaveTextContent('Quebec Running Club')
    })
  })

  describe('Layout and Structure', () => {
    it('displays header content properly', () => {
      render(<EventCard event={mockEventWithClub} />)

      expect(
        screen.getByRole('heading', { name: 'Morning 5K Run' })
      ).toBeVisible()
      expect(screen.getByText(/Thu, Sep 4/)).toBeVisible()
    })

    it('maintains proper content structure', () => {
      render(<EventCard event={mockEventWithClub} />)

      const heading = screen.getByRole('heading', { name: 'Morning 5K Run' })
      const location = screen.getByText('Location')
      const address = screen.getByText('250 3e Rue, Québec, QC G1L 2B3')

      expect(heading).toBeInTheDocument()
      expect(location).toBeInTheDocument()
      expect(address).toBeInTheDocument()
    })

    it('positions location information appropriately', () => {
      render(<EventCard event={mockEventWithClub} />)

      const locationText = screen.getByText('Location')
      const addressText = screen.getByText('250 3e Rue, Québec, QC G1L 2B3')
      expect(locationText).toBeVisible()
      expect(addressText).toBeVisible()
    })

    it('organizes content elements properly', () => {
      render(<EventCard event={mockEventWithClub} />)

      const title = screen.getByRole('heading', { name: 'Morning 5K Run' })
      const distance = screen.getByText('5K')
      const pace = screen.getByText('5:30 /km')

      expect(title).toBeVisible()
      expect(distance).toBeVisible()
      expect(pace).toBeVisible()
    })
  })

  describe('Accessibility', () => {
    it('provides proper heading structure', () => {
      render(<EventCard event={mockEventWithClub} />)

      const heading = screen.getByRole('heading', { name: 'Morning 5K Run' })
      expect(heading.tagName).toBe('H3')
    })

    it('provides accessible link text through context', () => {
      render(<EventCard event={mockEventWithClub} />)

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()

      // Link should contain the event title for screen readers
      expect(link).toHaveTextContent('Morning 5K Run')
    })

    it('uses semantic HTML elements', () => {
      const { container } = render(<EventCard event={mockEventWithClub} />)

      // Should use article for the card content
      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    it('provides proper icon accessibility', () => {
      render(<EventCard event={mockEventWithClub} />)

      // Icons should be hidden from screen readers (aria-hidden)
      const icons = document.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Typography and Styling', () => {
    it('displays title as proper heading', () => {
      render(<EventCard event={mockEventWithClub} />)

      const title = screen.getByRole('heading', { name: 'Morning 5K Run' })
      expect(title).toBeVisible()
      expect(title.tagName).toBe('H3')
      expect(title).toHaveTextContent('Morning 5K Run')
    })

    it('maintains logical content flow', () => {
      render(<EventCard event={mockEventWithClub} />)

      const title = screen.getByRole('heading', { name: 'Morning 5K Run' })
      const datetime = screen.getByText(/Thu, Sep 4/)
      const distance = screen.getByText('5K')
      const location = screen.getByText('Location')

      expect(title).toBeInTheDocument()
      expect(datetime).toBeInTheDocument()
      expect(distance).toBeInTheDocument()
      expect(location).toBeInTheDocument()
    })

    it('handles long titles appropriately', () => {
      const eventWithLongTitle = {
        ...mockEventWithClub,
        title:
          'Very Long Event Title That Should Be Clamped to Two Lines Maximum for Better Layout',
      }

      render(<EventCard event={eventWithLongTitle} />)

      const title = screen.getByRole('heading')
      expect(title).toBeVisible()
      expect(title.textContent).toContain('Very Long Event Title')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles minimal event data gracefully', () => {
      const minimalEvent: GetAllEventsReturn = {
        id: 'minimal-event',
        title: 'Minimal Event',
        address: null,
        date: new Date('2025-09-04T06:00:00'),
        time: '06:00',
        distance: null,
        pace: null,
        club: {
          name: 'Test Club',
        },
      }

      render(<EventCard event={minimalEvent} />)

      // Should still render title and date
      expect(
        screen.getByRole('heading', { name: 'Minimal Event' })
      ).toBeInTheDocument()
      expect(screen.getByText(/Thu, Sep 4/)).toBeInTheDocument()
      expect(screen.getByText(/06:00/)).toBeInTheDocument()

      // Should not crash with missing optional fields
      expect(screen.queryByText('Location')).not.toBeInTheDocument()
    })

    it('handles special characters in event data', () => {
      const eventWithSpecialChars = {
        ...mockEventWithClub,
        title: 'Course matinale à Québec - 5km!',
        address: 'Château Frontenac, 1 Rue des Carrières, Québec, QC',
        distance: '5,5 km',
        pace: '4\'30" /km',
      }

      render(<EventCard event={eventWithSpecialChars} />)

      expect(
        screen.getByRole('heading', { name: 'Course matinale à Québec - 5km!' })
      ).toBeInTheDocument()
      expect(
        screen.getByText('Château Frontenac, 1 Rue des Carrières, Québec, QC')
      ).toBeInTheDocument()
      expect(screen.getByText('5,5 km')).toBeInTheDocument()
      expect(screen.getByText('4\'30" /km')).toBeInTheDocument()
    })

    it('handles very long address gracefully', () => {
      const eventWithLongAddress = {
        ...mockEventWithClub,
        address:
          'Very Long Address That Should Be Truncated Because It Exceeds The Available Space In The Card Layout And Should Not Break The Design',
      }

      render(<EventCard event={eventWithLongAddress} />)

      const addressElement = screen.getByText(eventWithLongAddress.address)
      expect(addressElement).toBeVisible()
      expect(addressElement).toHaveAttribute(
        'title',
        eventWithLongAddress.address
      )
    })
  })

  describe('Interactive States', () => {
    it('maintains accessibility for interactive states', () => {
      render(<EventCard event={mockEventWithClub} />)

      const link = screen.getByRole('link')
      expect(link).toBeVisible()
      expect(link).not.toHaveAttribute('tabindex', '-1')
      link.focus()
      expect(link).toHaveFocus()
    })

    it('maintains keyboard accessibility', () => {
      render(<EventCard event={mockEventWithClub} />)

      const link = screen.getByRole('link')
      expect(link).toBeVisible()
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })
  })
})
