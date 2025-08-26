import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { ClubCard } from './club-card'
import type { GetAllClubsReturn } from '@/lib/services/clubs'

// Mock complete club data structure
const mockClubWithEvents: GetAllClubsReturn = {
  id: 'club-1',
  name: 'Quebec Running Club',
  slug: 'quebec-running-club',
  description:
    'Premier running club in Quebec City for runners of all levels. Join us for weekly runs and training sessions.',
  events: [
    {
      id: 'event-1',
      title: 'Morning 5K Run',
      date: new Date('2025-09-04T06:00:00-04:00'),
      time: '06:00',
      distance: '5K',
      pace: '5:30 /km',
    },
    {
      id: 'event-2',
      title: 'Trail Running Adventure',
      date: new Date('2025-09-05T18:30:00-04:00'),
      time: '18:30',
      distance: '8K',
      pace: '6:00 /km',
    },
    {
      id: 'event-3',
      title: 'Speed Training Session',
      date: new Date('2025-09-06T07:00:00-04:00'),
      time: '07:00',
      distance: '3K',
      pace: '4:30 /km',
    },
  ],
}

const mockClubWithManyEvents: GetAllClubsReturn = {
  ...mockClubWithEvents,
  events: [
    ...mockClubWithEvents.events,
    {
      id: 'event-4',
      title: 'Long Distance Run',
      date: new Date('2025-09-07T08:00:00-04:00'),
      time: '08:00',
      distance: '15K',
      pace: '5:00 /km',
    },
    {
      id: 'event-5',
      title: 'Recovery Run',
      date: new Date('2025-09-08T06:30:00-04:00'),
      time: '06:30',
      distance: '4K',
      pace: '6:30 /km',
    },
  ],
}

describe('ClubCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders club name correctly', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(
        screen.getByRole('heading', { name: 'Quebec Running Club' })
      ).toBeInTheDocument()
    })

    it('renders as a clickable link to club details', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/clubs/quebec-running-club')
      expect(link).toHaveClass('block', 'no-underline', 'hover:no-underline')
    })

    it('applies correct card styling with Quebec.run branding', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const card = screen.getByTestId('club-card')
      expect(card).toHaveClass(
        'rounded-xl',
        'border',
        'group',
        'p-4',
        'bg-white',
        'hover:shadow-primary/5',
        'border-l-4',
        'border-primary',
        'hover:shadow-lg',
        'transition-all',
        'duration-200'
      )
    })

    it('displays club icon with proper styling', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const iconContainer = container.querySelector(
        '.p-2.bg-primary\\/10.rounded-lg'
      )
      expect(iconContainer).toBeInTheDocument()

      const usersIcon = iconContainer?.querySelector('svg')
      expect(usersIcon).toHaveClass('h-5', 'w-5', 'text-primary')
    })
  })

  describe('Club Information Display', () => {
    it('displays club description when provided', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(
        screen.getByText(/Premier running club in Quebec City/)
      ).toBeInTheDocument()
    })

    it('hides description when null', () => {
      const clubWithoutDescription = {
        ...mockClubWithEvents,
        description: null,
      }

      render(<ClubCard club={clubWithoutDescription} />)

      expect(
        screen.queryByText(/Premier running club in Quebec City/)
      ).not.toBeInTheDocument()
    })

    it('applies proper text styling to description', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const description = screen.getByText(
        /Premier running club in Quebec City/
      )
      expect(description).toHaveClass(
        'text-accent',
        'font-body',
        'text-sm',
        'mb-4',
        'line-clamp-2',
        'leading-relaxed'
      )
    })

    it('displays location as Quebec City', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('Quebec City')).toBeInTheDocument()
    })

    it('uses LocationInline component for location display', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const locationComponent = container.querySelector(
        '.flex.items-center.gap-2'
      )
      expect(locationComponent).toBeInTheDocument()
      expect(locationComponent).toHaveClass('text-sm')
    })
  })

  describe('Event Count Display', () => {
    it('displays correct event count in badge', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('applies correct styling to event count badge', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const eventBadge = screen.getByText('3').closest('div')
      expect(eventBadge).toHaveClass(
        'flex',
        'items-center',
        'gap-1',
        'px-3',
        'py-1',
        'bg-secondary/10',
        'text-secondary',
        'rounded-full',
        'text-sm',
        'font-medium'
      )
    })

    it('displays calendar icon in event count badge', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const badge = screen.getByText('3').closest('div')
      const calendarIcon = badge?.querySelector('svg')
      expect(calendarIcon).toHaveClass('h-3', 'w-3')
    })

    it('updates count based on number of events', () => {
      render(<ClubCard club={mockClubWithManyEvents} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('Events List Display', () => {
    it('displays up to 3 events', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('Morning 5K Run')).toBeInTheDocument()
      expect(screen.getByText('Trail Running Adventure')).toBeInTheDocument()
      expect(screen.getByText('Speed Training Session')).toBeInTheDocument()
    })

    it('limits display to 3 events when more are available', () => {
      render(<ClubCard club={mockClubWithManyEvents} />)

      // Should show first 3 events
      expect(screen.getByText('Morning 5K Run')).toBeInTheDocument()
      expect(screen.getByText('Trail Running Adventure')).toBeInTheDocument()
      expect(screen.getByText('Speed Training Session')).toBeInTheDocument()

      // Should not show 4th and 5th events
      expect(screen.queryByText('Long Distance Run')).not.toBeInTheDocument()
      expect(screen.queryByText('Recovery Run')).not.toBeInTheDocument()
    })

    it('shows "more events" indicator when events exceed limit', () => {
      render(<ClubCard club={mockClubWithManyEvents} />)

      expect(screen.getByText('+2 more events this week')).toBeInTheDocument()
    })

    it('applies correct styling to event items', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const eventItem = container.querySelector('.p-3.bg-gray-50.rounded-xl')
      expect(eventItem).toHaveClass(
        'border',
        'border-gray-100',
        'hover:border-primary/20',
        'transition-colors'
      )
    })

    it('displays event times with time tags', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const timeTag = screen.getByText('06:00').closest('span')
      expect(timeTag).toHaveClass(
        'inline-flex',
        'items-center',
        'font-medium',
        'rounded-md',
        'border',
        'whitespace-nowrap',
        'px-1.5',
        'py-0.5',
        'gap-1',
        'text-xs'
      )
    })

    it('displays event dates in French Canadian format', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      // Should display French date format
      const dateElements = screen.getAllByText(/jeu|ven|sam/i)
      expect(dateElements.length).toBeGreaterThan(0)
    })

    it('displays distance and pace tags when available', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('5K')).toBeInTheDocument()
      expect(screen.getByText('5:30 /km')).toBeInTheDocument()
      expect(screen.getByText('8K')).toBeInTheDocument()
      expect(screen.getByText('6:00 /km')).toBeInTheDocument()
    })

    it('hides distance/pace tags when not available', () => {
      const clubWithMinimalEvents = {
        ...mockClubWithEvents,
        events: [
          {
            id: 'event-minimal',
            title: 'Minimal Event',
            date: new Date('2025-09-04T06:00:00-04:00'),
            time: '06:00',
            distance: null,
            pace: null,
          },
        ],
      }

      render(<ClubCard club={clubWithMinimalEvents} />)

      expect(screen.getByText('Minimal Event')).toBeInTheDocument()
      expect(screen.getByText('06:00')).toBeInTheDocument()
      // Distance and pace should not be displayed
    })
  })

  describe('Footer Display', () => {
    it('displays event count summary in footer', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('3 upcoming events')).toBeInTheDocument()
    })

    it('displays call-to-action text', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('View Club →')).toBeInTheDocument()
    })

    it('applies correct styling to footer', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const footer = container.querySelector('.border-t.border-gray-100')
      expect(footer).toHaveClass(
        'flex',
        'items-center',
        'justify-between',
        'pt-4'
      )
    })

    it('includes calendar icon in event count summary', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const eventSummary = screen.getByText('3 upcoming events').closest('div')
      const calendarIcon = eventSummary?.querySelector('svg')
      expect(calendarIcon).toHaveClass('h-3', 'w-3')
    })

    it('applies hover effect styling to call-to-action', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const callToAction = screen.getByText('View Club →')
      expect(callToAction).toHaveClass(
        'text-sm',
        'text-primary',
        'group-hover:text-primary/80',
        'font-medium',
        'font-body'
      )
    })
  })

  describe('Conditional Rendering', () => {
    it('renders nothing when club has no events', () => {
      const clubWithoutEvents = {
        ...mockClubWithEvents,
        events: [],
      }

      const { container } = render(<ClubCard club={clubWithoutEvents} />)

      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when events is null', () => {
      const clubWithNullEvents = {
        ...mockClubWithEvents,
        events: null,
      }

      const { container } = render(<ClubCard club={clubWithNullEvents} />)

      expect(container.firstChild).toBeNull()
    })

    it('renders when club has exactly one event', () => {
      const clubWithOneEvent = {
        ...mockClubWithEvents,
        events: [mockClubWithEvents.events[0]],
      }

      render(<ClubCard club={clubWithOneEvent} />)

      expect(screen.getByText('Quebec Running Club')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('1 upcoming events')).toBeInTheDocument()
    })
  })

  describe('Typography and Styling', () => {
    it('applies Quebec.run brand typography to club name', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const clubName = screen.getByRole('heading', {
        name: 'Quebec Running Club',
      })
      expect(clubName).toHaveClass(
        'text-xl',
        'font-heading',
        'font-bold',
        'text-primary',
        'group-hover:text-primary/80',
        'transition-colors'
      )
    })

    it('applies consistent spacing between sections', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const eventsSection = container.querySelector('.space-y-3.mb-4')
      expect(eventsSection).toBeInTheDocument()

      const header = container.querySelector('.mb-4')
      expect(header).toBeInTheDocument()
    })

    it('uses proper heading hierarchy', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const heading = screen.getByRole('heading', {
        name: 'Quebec Running Club',
      })
      expect(heading.tagName).toBe('H2')
    })
  })

  describe('Accessibility', () => {
    it('provides accessible link with descriptive text', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('Quebec Running Club')
    })

    it('uses semantic HTML elements', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('provides proper testid for testing', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByTestId('club-card')).toBeInTheDocument()
    })

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const icons = container.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Interactive States', () => {
    it('applies hover effects through CSS classes', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const card = screen.getByTestId('club-card')
      expect(card).toHaveClass(
        'hover:shadow-lg',
        'hover:shadow-primary/5',
        'hover:-translate-y-1',
        'hover:border-primary/20'
      )
    })

    it('maintains keyboard accessibility', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const link = screen.getByRole('link')
      expect(link).toBeVisible()
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })

    it('applies transition effects to interactive elements', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const eventItem = container.querySelector('.transition-colors')
      expect(eventItem).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles club with long description gracefully', () => {
      const clubWithLongDescription = {
        ...mockClubWithEvents,
        description:
          'This is a very long description that should be clamped to two lines maximum to maintain proper card layout and visual hierarchy throughout the application interface design.',
      }

      render(<ClubCard club={clubWithLongDescription} />)

      const description = screen.getByText(/This is a very long description/)
      expect(description).toHaveClass('line-clamp-2')
    })

    it('handles special characters in club data', () => {
      const clubWithSpecialChars = {
        ...mockClubWithEvents,
        name: 'Club de Course Québécois',
        description: 'Joignez-vous à nous pour des courses à Québec!',
        events: [
          {
            id: 'event-french',
            title: 'Course matinale à Québec',
            date: new Date('2025-09-04T06:00:00-04:00'),
            time: '06:00',
            distance: '5,5 km',
            pace: '4\'30" /km',
          },
        ],
      }

      render(<ClubCard club={clubWithSpecialChars} />)

      expect(
        screen.getByRole('heading', { name: 'Club de Course Québécois' })
      ).toBeInTheDocument()
      expect(
        screen.getByText('Joignez-vous à nous pour des courses à Québec!')
      ).toBeInTheDocument()
      expect(screen.getByText('Course matinale à Québec')).toBeInTheDocument()
    })

    it('handles events with missing optional fields', () => {
      const clubWithMinimalEvents = {
        ...mockClubWithEvents,
        events: [
          {
            id: 'minimal-event',
            title: 'Minimal Event Data',
            date: new Date('2025-09-04T06:00:00-04:00'),
            time: '06:00',
            distance: null,
            pace: null,
          },
        ],
      }

      render(<ClubCard club={clubWithMinimalEvents} />)

      expect(screen.getByText('Minimal Event Data')).toBeInTheDocument()
      expect(screen.getByText('06:00')).toBeInTheDocument()
      expect(screen.getByText('1 upcoming events')).toBeInTheDocument()
    })

    it('handles very long event titles', () => {
      const clubWithLongEventTitle = {
        ...mockClubWithEvents,
        events: [
          {
            id: 'long-title-event',
            title:
              'Very Long Event Title That Should Be Clamped to Two Lines Maximum for Better Layout Consistency',
            date: new Date('2025-09-04T06:00:00-04:00'),
            time: '06:00',
            distance: '5K',
            pace: '5:30 /km',
          },
        ],
      }

      render(<ClubCard club={clubWithLongEventTitle} />)

      const eventTitle = screen.getByText(/Very Long Event Title/)
      expect(eventTitle).toHaveClass('line-clamp-2')
    })
  })

  describe('Real-World Integration', () => {
    it('matches ClubCardSkeleton structure for loading states', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      // Should have similar structure to skeleton
      expect(screen.getByTestId('club-card')).toHaveClass('border-l-4')

      // Check header structure
      const clubNameContainer = screen.getByText(
        'Quebec Running Club'
      ).parentElement
      expect(clubNameContainer?.parentElement).toHaveClass(
        'flex',
        'items-start',
        'gap-3'
      )

      // Check event count badge structure
      expect(screen.getByText('3').closest('div')).toHaveClass(
        'flex',
        'items-center'
      )
    })

    it('integrates properly with Quebec.run design system', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      // Should use brand colors consistently
      const card = screen.getByTestId('club-card')
      expect(card).toHaveClass('border-primary')

      const clubName = screen.getByRole('heading')
      expect(clubName).toHaveClass('text-primary')

      const callToAction = screen.getByText('View Club →')
      expect(callToAction).toHaveClass('text-primary')
    })
  })
})
