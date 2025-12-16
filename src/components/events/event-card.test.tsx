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
  latitude: 46.8139,
  longitude: -71.208,
  club: {
    id: 'club-1',
    name: 'Quebec Running Club',
    slug: 'quebec-running-club',
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
      expect(link).toHaveClass('block', 'h-full')
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

    it('uses datetime tag variant for date/time display', () => {
      render(<EventCard event={mockEventWithClub} />)

      const datetimeTag = screen.getByText(/Thu, Sep 4/).closest('span')
      expect(datetimeTag).toHaveClass(
        'bg-secondary/10',
        'text-secondary',
        'border-secondary/20'
      )
    })
  })

  describe('Event Details Tags', () => {
    it('displays distance tag when distance is provided', () => {
      render(<EventCard event={mockEventWithClub} />)

      const distanceTag = screen.getByText('5K')
      expect(distanceTag).toBeInTheDocument()
      expect(distanceTag.closest('span')).toHaveClass(
        'bg-primary/10',
        'text-primary',
        'border-primary/20'
      )
    })

    it('displays pace tag when pace is provided', () => {
      render(<EventCard event={mockEventWithClub} />)

      const paceTag = screen.getByText('5:30 /km')
      expect(paceTag).toBeInTheDocument()
      expect(paceTag.closest('span')).toHaveClass(
        'bg-accent/10',
        'text-accent',
        'border-accent/20'
      )
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

      // Tags section should still exist but be empty
      const tagsSection = document.querySelector(
        '.flex.items-center.gap-2.flex-wrap'
      )
      expect(tagsSection).toBeInTheDocument()
      expect(tagsSection?.children).toHaveLength(0)
    })

    it('applies correct tag sizes (xs)', () => {
      render(<EventCard event={mockEventWithClub} />)

      const distanceTag = screen.getByText('5K').closest('span')
      const paceTag = screen.getByText('5:30 /km').closest('span')

      // xs size classes
      expect(distanceTag).toHaveClass('px-1.5', 'py-0.5', 'text-xs')
      expect(paceTag).toHaveClass('px-1.5', 'py-0.5', 'text-xs')
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

    it('maintains layout height when address is null', () => {
      const eventWithoutAddress = {
        ...mockEventWithClub,
        address: null,
      }

      const { container } = render(<EventCard event={eventWithoutAddress} />)

      // Should have a spacer div with h-16 class
      const spacer = container.querySelector('.h-16')
      expect(spacer).toBeInTheDocument()
    })

    it('uses LocationCard component for address display', () => {
      render(<EventCard event={mockEventWithClub} />)

      const locationContainer = screen
        .getByText('Location')
        .closest('div')?.parentElement
      expect(locationContainer).toHaveClass(
        'flex',
        'items-center',
        'gap-3',
        'p-3',
        'bg-gray-50',
        'rounded-lg',
        'border',
        'border-gray-100'
      )
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

    it('applies correct styling to club name', () => {
      render(<EventCard event={mockEventWithClub} showClubName={true} />)

      const clubName = screen.getByText('Quebec Running Club')
      expect(clubName).toHaveClass('text-xs', 'text-accent', 'font-body')
    })
  })

  describe('Layout and Structure', () => {
    it('maintains fixed header height', () => {
      const { container } = render(<EventCard event={mockEventWithClub} />)

      const header = container.querySelector('.h-16')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('mb-3')
    })

    it('uses flex layout for responsive design', () => {
      const { container } = render(<EventCard event={mockEventWithClub} />)

      const flexContainer = container.querySelector('.flex-1.flex.flex-col')
      expect(flexContainer).toBeInTheDocument()
    })

    it('positions location at bottom with mt-auto', () => {
      const { container } = render(<EventCard event={mockEventWithClub} />)

      const locationContainer = container.querySelector('.mt-auto')
      expect(locationContainer).toBeInTheDocument()
    })

    it('applies correct gap spacing between elements', () => {
      const { container } = render(<EventCard event={mockEventWithClub} />)

      const headerFlex = container.querySelector('.flex.items-start.gap-3')
      expect(headerFlex).toBeInTheDocument()

      const tagsFlex = container.querySelector('.flex.items-center.gap-2')
      expect(tagsFlex).toBeInTheDocument()
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
      render(<EventCard event={mockEventWithClub} />)

      // Should use article for the card content
      const article = screen.getByRole('article')
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
    it('applies Quebec.run brand typography to title', () => {
      render(<EventCard event={mockEventWithClub} />)

      const title = screen.getByRole('heading', { name: 'Morning 5K Run' })
      expect(title).toHaveClass(
        'text-lg',
        'font-heading',
        'font-bold',
        'text-primary',
        'mb-2',
        'line-clamp-2',
        'leading-tight'
      )
    })

    it('applies consistent spacing between sections', () => {
      const { container } = render(<EventCard event={mockEventWithClub} />)

      const tagsSection = container.querySelector('.mb-4.pt-2')
      expect(tagsSection).toBeInTheDocument()
    })

    it('handles long titles with line clamping', () => {
      const eventWithLongTitle = {
        ...mockEventWithClub,
        title:
          'Very Long Event Title That Should Be Clamped to Two Lines Maximum for Better Layout',
      }

      render(<EventCard event={eventWithLongTitle} />)

      const title = screen.getByRole('heading')
      expect(title).toHaveClass('line-clamp-2')
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
        latitude: null,
        longitude: null,
        club: {
          id: 'club-1',
          name: 'Test Club',
          slug: 'test-club',
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

    it('handles very long address with truncation', () => {
      const eventWithLongAddress = {
        ...mockEventWithClub,
        address:
          'Very Long Address That Should Be Truncated Because It Exceeds The Available Space In The Card Layout And Should Not Break The Design',
      }

      render(<EventCard event={eventWithLongAddress} />)

      const addressElement = screen.getByText(eventWithLongAddress.address)
      expect(addressElement).toHaveClass('truncate')
      expect(addressElement).toHaveAttribute(
        'title',
        eventWithLongAddress.address
      )
    })
  })

  describe('Interactive States', () => {
    it('renders as interactive card', () => {
      render(<EventCard event={mockEventWithClub} />)

      // Card should be clickable via wrapping link
      const link = screen.getByRole('link', {
        name: new RegExp(mockEventWithClub.title),
      })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', `/events/${mockEventWithClub.id}`)
    })

    it('maintains keyboard accessibility', () => {
      render(<EventCard event={mockEventWithClub} />)

      const link = screen.getByRole('link')
      expect(link).toBeVisible()
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })
  })
})
