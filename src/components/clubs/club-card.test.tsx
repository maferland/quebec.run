import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { ClubCard } from './club-card'
import type { GetAllClubsReturn } from '@/lib/services/clubs'

const mockClubWithRecurring: GetAllClubsReturn = {
  id: 'club-1',
  name: 'Quebec Running Club',
  slug: 'quebec-running-club',
  description:
    'Premier running club in Quebec City for runners of all levels. Join us for weekly runs and training sessions.',
  stravaSlug: null,
  _count: { recurringEvents: 3 },
}

const mockClubNoRecurring: GetAllClubsReturn = {
  ...mockClubWithRecurring,
  _count: { recurringEvents: 0 },
}

describe('ClubCard Component', () => {
  describe('Basic Rendering', () => {
    it('renders club name correctly', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(
        screen.getByRole('heading', { name: 'Quebec Running Club' })
      ).toBeInTheDocument()
    })

    it('renders as a clickable link to club details', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/clubs/quebec-running-club')
      expect(link).toHaveClass('block', 'no-underline', 'hover:no-underline')
    })

    it('displays club icon with proper styling', () => {
      const { container } = render(<ClubCard club={mockClubWithRecurring} />)

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
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(
        screen.getByText(/Premier running club in Quebec City/)
      ).toBeInTheDocument()
    })

    it('hides description when null', () => {
      const clubWithoutDescription = {
        ...mockClubWithRecurring,
        description: null,
      }

      render(<ClubCard club={clubWithoutDescription} />)

      expect(
        screen.queryByText(/Premier running club in Quebec City/)
      ).not.toBeInTheDocument()
    })

    it('displays location as Quebec City', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(screen.getByText('Quebec City')).toBeInTheDocument()
    })

    it('uses LocationInline component for location display', () => {
      const { container } = render(<ClubCard club={mockClubWithRecurring} />)

      const locationComponent = container.querySelector(
        '.flex.items-center.gap-2'
      )
      expect(locationComponent).toBeInTheDocument()
      expect(locationComponent).toHaveClass('text-sm')
    })
  })

  describe('Recurring Event Count Display', () => {
    it('displays correct recurring event count in badge', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('applies correct styling to count badge', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

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

    it('displays calendar icon in count badge', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const badge = screen.getByText('3').closest('div')
      const calendarIcon = badge?.querySelector('svg')
      expect(calendarIcon).toHaveClass('h-3', 'w-3')
    })

    it('updates count based on number of recurring events', () => {
      const club = { ...mockClubWithRecurring, _count: { recurringEvents: 5 } }
      render(<ClubCard club={club} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('Footer Display', () => {
    it('displays recurring event count summary in footer', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(screen.getByText('3 active series')).toBeInTheDocument()
    })

    it('displays call-to-action text', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(screen.getByText('View Club →')).toBeInTheDocument()
    })

    it('includes calendar icon in count summary', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const eventSummary = screen.getByText('3 active series').closest('div')
      const calendarIcon = eventSummary?.querySelector('svg')
      expect(calendarIcon).toHaveClass('h-3', 'w-3')
    })

    it('applies hover effect styling to call-to-action', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

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
    it('renders club card when club has no recurring events', () => {
      render(<ClubCard club={mockClubNoRecurring} />)

      expect(
        screen.getByRole('heading', { name: 'Quebec Running Club' })
      ).toBeInTheDocument()
      expect(screen.getByTestId('club-card')).toBeInTheDocument()
      expect(screen.getByText('View Club →')).toBeInTheDocument()
    })

    it('hides count badge when club has no recurring events', () => {
      render(<ClubCard club={mockClubNoRecurring} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
      expect(screen.queryByText(/active series/)).not.toBeInTheDocument()
    })

    it('renders when club has exactly one recurring event', () => {
      const club = { ...mockClubWithRecurring, _count: { recurringEvents: 1 } }
      render(<ClubCard club={club} />)

      expect(screen.getByText('Quebec Running Club')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('1 active series')).toBeInTheDocument()
    })
  })

  describe('Typography and Styling', () => {
    it('applies Quebec.run brand typography to club name', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const clubName = screen.getByRole('heading', {
        name: 'Quebec Running Club',
      })
      expect(clubName).toHaveClass(
        'text-xl',
        'font-heading',
        'font-bold',
        'text-primary',
        'hover:underline',
        'transition-colors'
      )
    })

    it('uses proper heading hierarchy', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const heading = screen.getByRole('heading', {
        name: 'Quebec Running Club',
      })
      expect(heading.tagName).toBe('H2')
    })
  })

  describe('Accessibility', () => {
    it('provides accessible link with descriptive text', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const link = screen.getByRole('link')
      expect(link).toHaveTextContent('Quebec Running Club')
    })

    it('uses semantic HTML elements', () => {
      const { container } = render(<ClubCard club={mockClubWithRecurring} />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('provides proper testid for testing', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(screen.getByTestId('club-card')).toBeInTheDocument()
    })

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<ClubCard club={mockClubWithRecurring} />)

      const icons = container.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Interactive States', () => {
    it('applies hover effects through CSS classes', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const card = screen.getByTestId('club-card')
      expect(card).toHaveClass(
        'hover:shadow-lg',
        'hover:shadow-primary/5',
        'hover:-translate-y-1',
        'hover:border-primary/20'
      )
    })

    it('maintains keyboard accessibility', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const link = screen.getByRole('link')
      expect(link).toBeVisible()
      expect(link).not.toHaveAttribute('tabindex', '-1')
    })

    it('applies transition effects to interactive elements', () => {
      const { container } = render(<ClubCard club={mockClubWithRecurring} />)

      const eventItem = container.querySelector('.transition-colors')
      expect(eventItem).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles club with long description gracefully', () => {
      const clubWithLongDescription = {
        ...mockClubWithRecurring,
        description:
          'This is a very long description that should be clamped to two lines maximum to maintain proper card layout and visual hierarchy throughout the application interface design.',
      }

      render(<ClubCard club={clubWithLongDescription} />)

      const description = screen.getByText(/This is a very long description/)
      expect(description).toHaveClass('line-clamp-2')
    })

    it('handles special characters in club data', () => {
      const clubWithSpecialChars = {
        ...mockClubWithRecurring,
        name: 'Club de Course Québécois',
        description: 'Joignez-vous à nous pour des courses à Québec!',
      }

      render(<ClubCard club={clubWithSpecialChars} />)

      expect(
        screen.getByRole('heading', { name: 'Club de Course Québécois' })
      ).toBeInTheDocument()
      expect(
        screen.getByText('Joignez-vous à nous pour des courses à Québec!')
      ).toBeInTheDocument()
    })
  })

  describe('Visual Affordances', () => {
    it('renders title with hover underline affordance', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const title = screen.getByRole('heading', {
        name: mockClubWithRecurring.name,
      })
      expect(title).toHaveClass('hover:underline')
    })
  })

  describe('Real-World Integration', () => {
    it('matches ClubCardSkeleton structure for loading states', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      expect(screen.getByTestId('club-card')).toHaveClass('border-l-4')

      const clubNameContainer = screen.getByText(
        'Quebec Running Club'
      ).parentElement
      expect(clubNameContainer?.parentElement).toHaveClass(
        'flex',
        'items-start',
        'gap-3'
      )

      expect(screen.getByText('3').closest('div')).toHaveClass(
        'flex',
        'items-center'
      )
    })

    it('integrates properly with Quebec.run design system', () => {
      render(<ClubCard club={mockClubWithRecurring} />)

      const card = screen.getByTestId('club-card')
      expect(card).toHaveClass('border-primary')

      const clubName = screen.getByRole('heading')
      expect(clubName).toHaveClass('text-primary')

      const callToAction = screen.getByText('View Club →')
      expect(callToAction).toHaveClass('text-primary')
    })
  })
})
