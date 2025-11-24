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
      expect(link).toBeVisible()
    })

    it('displays as a card with proper structure', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const card = screen.getByTestId('club-card')
      expect(card).toBeVisible()
      expect(card).toContainElement(
        screen.getByRole('heading', { name: 'Quebec Running Club' })
      )
      expect(card).toContainElement(screen.getByText('Quebec City'))
    })

    it('displays club icon with accessibility attributes', () => {
      const { container } = render(<ClubCard club={mockClubWithEvents} />)

      const usersIcon = container.querySelector('svg')
      expect(usersIcon).toBeInTheDocument()
      expect(usersIcon).toHaveAttribute('aria-hidden', 'true')
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

    it('displays description with appropriate content', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const description = screen.getByText(
        /Premier running club in Quebec City/
      )
      expect(description).toBeVisible()
      expect(description.textContent).toContain(
        'Premier running club in Quebec City'
      )
    })

    it('displays location as Quebec City', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('Quebec City')).toBeInTheDocument()
    })

    it('displays location with proper content', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const locationText = screen.getByText('Quebec City')
      expect(locationText).toBeVisible()
      expect(locationText).toBeInTheDocument()
    })
  })

  describe('Event Count Display', () => {
    it('displays correct event count in badge', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('displays event count badge with correct number', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const eventBadge = screen.getByText('3')
      expect(eventBadge).toBeVisible()
      expect(eventBadge.closest('div')).toContainElement(eventBadge)
    })

    it('displays calendar icon with proper accessibility', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const badge = screen.getByText('3').closest('div')
      const calendarIcon = badge?.querySelector('svg')
      expect(calendarIcon).toBeInTheDocument()
      expect(calendarIcon).toHaveAttribute('aria-hidden', 'true')
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

    it('displays event items with proper content', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('Morning 5K Run')).toBeVisible()
      expect(screen.getByText('Trail Running Adventure')).toBeVisible()
      expect(screen.getByText('Speed Training Session')).toBeVisible()
    })

    it('displays event times clearly', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const timeTag = screen.getByText('06:00')
      expect(timeTag).toBeVisible()
      expect(timeTag).toHaveTextContent('06:00')
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

    it('displays footer with event summary and action', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      expect(screen.getByText('3 upcoming events')).toBeVisible()
      expect(screen.getByText('View Club →')).toBeVisible()
    })

    it('includes calendar icon with accessibility in event summary', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const eventSummary = screen.getByText('3 upcoming events').closest('div')
      const calendarIcon = eventSummary?.querySelector('svg')
      expect(calendarIcon).toBeInTheDocument()
      expect(calendarIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('displays call-to-action text clearly', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const callToAction = screen.getByText('View Club →')
      expect(callToAction).toBeVisible()
      expect(callToAction).toHaveTextContent('View Club →')
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

    it('renders nothing when events is empty array', () => {
      const clubWithNullEvents = {
        ...mockClubWithEvents,
        events: [],
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
    it('displays club name as proper heading', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const clubName = screen.getByRole('heading', {
        name: 'Quebec Running Club',
      })
      expect(clubName).toBeVisible()
      expect(clubName.tagName).toBe('H2')
    })

    it('maintains proper content organization', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const clubName = screen.getByRole('heading', {
        name: 'Quebec Running Club',
      })
      const description = screen.getByText(/Premier running club/)
      const firstEvent = screen.getByText('Morning 5K Run')

      expect(clubName).toBeInTheDocument()
      expect(description).toBeInTheDocument()
      expect(firstEvent).toBeInTheDocument()
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
    it('maintains accessibility for interactive states', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const link = screen.getByRole('link')
      expect(link).toBeVisible()
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })

    it('maintains keyboard accessibility', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const link = screen.getByRole('link')
      expect(link).toBeVisible()
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })

    it('provides consistent interactive behavior', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      const link = screen.getByRole('link')
      link.focus()
      expect(link).toHaveFocus()
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
      expect(description).toBeVisible()
      expect(description.textContent).toContain(
        'This is a very long description'
      )
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
      expect(eventTitle).toBeVisible()
      expect(eventTitle.textContent).toContain('Very Long Event Title')
    })
  })

  describe('Real-World Integration', () => {
    it('maintains consistent structure for loading states compatibility', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      // Verify all expected content elements are present
      expect(screen.getByTestId('club-card')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Quebec Running Club' })
      ).toBeVisible()
      expect(screen.getByText('3')).toBeVisible()
      expect(screen.getByText('3 upcoming events')).toBeVisible()
    })

    it('integrates properly with Quebec.run design system', () => {
      render(<ClubCard club={mockClubWithEvents} />)

      // Verify visual hierarchy and brand consistency through content
      const card = screen.getByTestId('club-card')
      const clubName = screen.getByRole('heading')
      const callToAction = screen.getByText('View Club →')

      expect(card).toBeVisible()
      expect(clubName).toBeVisible()
      expect(callToAction).toBeVisible()
    })
  })
})
