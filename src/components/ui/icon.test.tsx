import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { MapPin, Calendar, Users } from 'lucide-react'
import { Icon } from './icon'

describe('Icon Component', () => {
  describe('Basic Rendering', () => {
    it('renders icon component correctly', () => {
      render(<Icon icon={MapPin} aria-label="Location" />)

      const icon = screen.getByLabelText('Location')
      expect(icon).toBeInTheDocument()
      expect(icon.tagName).toBe('svg')
    })

    it('renders different icon types correctly', () => {
      const { rerender } = render(<Icon icon={MapPin} aria-label="Map Pin" />)
      expect(screen.getByLabelText('Map Pin')).toBeInTheDocument()

      rerender(<Icon icon={Calendar} aria-label="Calendar" />)
      expect(screen.getByLabelText('Calendar')).toBeInTheDocument()

      rerender(<Icon icon={Users} aria-label="Users" />)
      expect(screen.getByLabelText('Users')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('applies default medium size', () => {
      render(<Icon icon={MapPin} data-testid="default-icon" />)

      const icon = screen.getByTestId('default-icon')
      expect(icon).toHaveClass('h-5', 'w-5')
    })

    it('applies different size variants correctly', () => {
      const sizes = [
        { size: 'xs' as const, classes: ['h-3', 'w-3'] },
        { size: 'sm' as const, classes: ['h-4', 'w-4'] },
        { size: 'md' as const, classes: ['h-5', 'w-5'] },
        { size: 'lg' as const, classes: ['h-6', 'w-6'] },
        { size: 'xl' as const, classes: ['h-8', 'w-8'] },
        { size: '2xl' as const, classes: ['h-12', 'w-12'] },
        { size: '3xl' as const, classes: ['h-16', 'w-16'] },
      ]

      sizes.forEach(({ size, classes }) => {
        render(<Icon icon={MapPin} size={size} data-testid={`icon-${size}`} />)
        const icon = screen.getByTestId(`icon-${size}`)
        expect(icon).toHaveClass(...classes)
      })
    })
  })

  describe('Color Variants', () => {
    it('applies default current color (no additional classes)', () => {
      render(<Icon icon={MapPin} data-testid="current-color" />)

      const icon = screen.getByTestId('current-color')
      // Should not have specific color classes when using 'current'
      expect(icon).not.toHaveClass('text-primary')
      expect(icon).not.toHaveClass('text-secondary')
    })

    it('applies Quebec.run brand colors correctly', () => {
      const brandColors = [
        { color: 'primary' as const, class: 'text-primary' },
        { color: 'secondary' as const, class: 'text-secondary' },
        { color: 'accent' as const, class: 'text-accent' },
      ]

      brandColors.forEach(({ color, class: expectedClass }) => {
        render(
          <Icon icon={MapPin} color={color} data-testid={`icon-${color}`} />
        )
        const icon = screen.getByTestId(`icon-${color}`)
        expect(icon).toHaveClass(expectedClass)
      })
    })

    it('applies semantic text colors correctly', () => {
      const textColors = [
        { color: 'text-primary' as const, class: 'text-text-primary' },
        { color: 'text-secondary' as const, class: 'text-text-secondary' },
        { color: 'text-tertiary' as const, class: 'text-text-tertiary' },
        { color: 'text-inverse' as const, class: 'text-text-inverse' },
      ]

      textColors.forEach(({ color, class: expectedClass }) => {
        render(
          <Icon icon={MapPin} color={color} data-testid={`icon-${color}`} />
        )
        const icon = screen.getByTestId(`icon-${color}`)
        expect(icon).toHaveClass(expectedClass)
      })
    })

    it('applies status colors correctly', () => {
      const statusColors = [
        { color: 'success' as const, class: 'text-success' },
        { color: 'warning' as const, class: 'text-warning' },
        { color: 'error' as const, class: 'text-error' },
        { color: 'info' as const, class: 'text-info' },
      ]

      statusColors.forEach(({ color, class: expectedClass }) => {
        render(
          <Icon icon={MapPin} color={color} data-testid={`icon-${color}`} />
        )
        const icon = screen.getByTestId(`icon-${color}`)
        expect(icon).toHaveClass(expectedClass)
      })
    })

    it('applies muted color with opacity correctly', () => {
      render(<Icon icon={MapPin} color="muted" data-testid="muted-icon" />)

      const icon = screen.getByTestId('muted-icon')
      expect(icon).toHaveClass('text-text-tertiary', 'opacity-60')
    })
  })

  describe('Common Utility Classes', () => {
    it('always applies flex-shrink-0 class', () => {
      render(<Icon icon={MapPin} data-testid="shrink-test" />)

      const icon = screen.getByTestId('shrink-test')
      expect(icon).toHaveClass('flex-shrink-0')
    })

    it('accepts custom className prop', () => {
      render(
        <Icon
          icon={MapPin}
          className="custom-class"
          data-testid="custom-class-test"
        />
      )

      const icon = screen.getByTestId('custom-class-test')
      expect(icon).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('supports aria-label for accessibility', () => {
      render(<Icon icon={MapPin} aria-label="Current location" />)

      const icon = screen.getByLabelText('Current location')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-label', 'Current location')
    })

    it('supports decorative icons with aria-hidden', () => {
      render(<Icon icon={MapPin} decorative data-testid="decorative-icon" />)

      const icon = screen.getByTestId('decorative-icon')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(icon).not.toHaveAttribute('aria-label')
    })

    it('does not apply aria-hidden when aria-label is provided', () => {
      render(
        <Icon
          icon={MapPin}
          aria-label="Location"
          decorative
          data-testid="labeled-icon"
        />
      )

      const icon = screen.getByTestId('labeled-icon')
      expect(icon).toHaveAttribute('aria-label', 'Location')
      expect(icon).not.toHaveAttribute('aria-hidden')
    })
  })

  describe('Props Forwarding', () => {
    it('forwards additional lucide props correctly', () => {
      render(<Icon icon={MapPin} strokeWidth={3} data-testid="stroke-test" />)

      const icon = screen.getByTestId('stroke-test')
      expect(icon).toHaveAttribute('stroke-width', '3')
    })

    it('excludes size prop from being passed to lucide component', () => {
      render(<Icon icon={MapPin} size="lg" data-testid="size-exclusion-test" />)

      const icon = screen.getByTestId('size-exclusion-test')
      // Should not have the size prop passed through to the SVG
      expect(icon).not.toHaveAttribute('size')
      // But should have the correct classes
      expect(icon).toHaveClass('h-6', 'w-6')
    })
  })

  describe('Combined Properties', () => {
    it('applies both size and color correctly', () => {
      render(
        <Icon
          icon={MapPin}
          size="xl"
          color="primary"
          data-testid="size-color-combo"
        />
      )

      const icon = screen.getByTestId('size-color-combo')
      expect(icon).toHaveClass('h-8', 'w-8', 'text-primary')
    })

    it('combines all properties with custom className', () => {
      render(
        <Icon
          icon={MapPin}
          size="lg"
          color="secondary"
          className="custom-styling"
          aria-label="Custom icon"
          data-testid="full-combo-test"
        />
      )

      const icon = screen.getByTestId('full-combo-test')
      expect(icon).toHaveClass(
        'h-6',
        'w-6',
        'text-secondary',
        'flex-shrink-0',
        'custom-styling'
      )
      expect(icon).toHaveAttribute('aria-label', 'Custom icon')
    })
  })
})
