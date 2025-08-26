import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { Clock, MapPin } from 'lucide-react'
import { Tag } from './tag'

describe('Tag Component', () => {
  it('renders children correctly', () => {
    render(<Tag>Test content</Tag>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies default props correctly', () => {
    const { container } = render(<Tag>Default tag</Tag>)
    const tag = container.firstChild as HTMLElement

    // Should have default size (sm) classes
    expect(tag).toHaveClass('px-2', 'py-1', 'text-xs')
    // Should have default color scheme (gray)
    expect(tag).toHaveClass('bg-white', 'border-gray-200', 'text-accent')
  })

  describe('Legacy variant support', () => {
    it('maps legacy variants to correct color schemes', () => {
      const { container: dateContainer } = render(
        <Tag variant="date">Date</Tag>
      )
      const { container: distanceContainer } = render(
        <Tag variant="distance">Distance</Tag>
      )
      const { container: paceContainer } = render(
        <Tag variant="pace">Pace</Tag>
      )
      const { container: timeContainer } = render(
        <Tag variant="time">Time</Tag>
      )

      expect(dateContainer.firstChild).toHaveClass(
        'bg-white',
        'border-gray-200'
      ) // gray
      expect(distanceContainer.firstChild).toHaveClass(
        'bg-primary/10',
        'text-primary'
      ) // primary
      expect(paceContainer.firstChild).toHaveClass(
        'bg-accent/10',
        'text-accent'
      ) // accent
      expect(timeContainer.firstChild).toHaveClass(
        'bg-secondary/10',
        'text-secondary'
      ) // secondary
    })
  })

  describe('Color schemes', () => {
    it('applies color schemes correctly', () => {
      const { container: primaryContainer } = render(
        <Tag colorScheme="primary">Primary</Tag>
      )
      const { container: secondaryContainer } = render(
        <Tag colorScheme="secondary">Secondary</Tag>
      )
      const { container: accentContainer } = render(
        <Tag colorScheme="accent">Accent</Tag>
      )

      expect(primaryContainer.firstChild).toHaveClass(
        'bg-primary/10',
        'text-primary',
        'border-primary/20'
      )
      expect(secondaryContainer.firstChild).toHaveClass(
        'bg-secondary/10',
        'text-secondary',
        'border-secondary/20'
      )
      expect(accentContainer.firstChild).toHaveClass(
        'bg-accent/10',
        'text-accent',
        'border-accent/20'
      )
    })

    it('colorScheme prop overrides variant mapping', () => {
      const { container } = render(
        <Tag variant="distance" colorScheme="secondary">
          Override test
        </Tag>
      )

      // Should use secondary colors, not primary (which distance variant normally maps to)
      expect(container.firstChild).toHaveClass(
        'bg-secondary/10',
        'text-secondary',
        'border-secondary/20'
      )
    })
  })

  describe('Sizes', () => {
    it('applies size variants correctly', () => {
      const { container: xsContainer } = render(<Tag size="xs">XS</Tag>)
      const { container: smContainer } = render(<Tag size="sm">SM</Tag>)
      const { container: mdContainer } = render(<Tag size="md">MD</Tag>)
      const { container: lgContainer } = render(<Tag size="lg">LG</Tag>)

      expect(xsContainer.firstChild).toHaveClass('px-1.5', 'py-0.5', 'text-xs')
      expect(smContainer.firstChild).toHaveClass('px-2', 'py-1', 'text-xs')
      expect(mdContainer.firstChild).toHaveClass('px-3', 'py-1.5', 'text-sm')
      expect(lgContainer.firstChild).toHaveClass('px-4', 'py-2', 'text-base')
    })
  })

  describe('Icons', () => {
    it('renders icon when provided', () => {
      const { container } = render(<Tag icon={Clock}>With icon</Tag>)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('flex-shrink-0')
    })

    it('does not render icon when not provided', () => {
      const { container } = render(<Tag>Without icon</Tag>)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })

    it('applies size-appropriate icon size', () => {
      const { container: xsContainer } = render(
        <Tag size="xs" icon={Clock}>
          XS icon
        </Tag>
      )
      const { container: lgContainer } = render(
        <Tag size="lg" icon={Clock}>
          LG icon
        </Tag>
      )

      const xsIcon = xsContainer.querySelector('svg')
      const lgIcon = lgContainer.querySelector('svg')

      expect(xsIcon).toHaveAttribute('width', '10')
      expect(xsIcon).toHaveAttribute('height', '10')
      expect(lgIcon).toHaveAttribute('width', '16')
      expect(lgIcon).toHaveAttribute('height', '16')
    })

    it('uses custom icon size when provided', () => {
      const { container } = render(
        <Tag icon={Clock} iconSize={24}>
          Custom icon size
        </Tag>
      )

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '24')
      expect(svg).toHaveAttribute('height', '24')
    })
  })

  describe('Custom className', () => {
    it('merges custom className with default classes', () => {
      const { container } = render(
        <Tag className="custom-class">Custom styling</Tag>
      )

      const tag = container.firstChild as HTMLElement
      expect(tag).toHaveClass('custom-class')
      expect(tag).toHaveClass('inline-flex', 'items-center') // default classes should still be present
    })
  })

  describe('Accessibility', () => {
    it('renders as a span element', () => {
      const { container } = render(<Tag>Accessibility test</Tag>)
      expect(container.firstChild?.nodeName).toBe('SPAN')
    })

    it('has proper ARIA structure with icon and text', () => {
      render(<Tag icon={MapPin}>Location tag</Tag>)

      expect(screen.getByText('Location tag')).toBeInTheDocument()
      // Icon should be properly nested within the tag
      const tag = screen.getByText('Location tag')
      const svg = tag.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Real-world usage patterns', () => {
    it('renders datetime tag like in EventCard', () => {
      const { container } = render(
        <Tag variant="datetime" icon={Clock} size="xs">
          Wed, Sep 4 • 06:00
        </Tag>
      )

      const tag = container.firstChild as HTMLElement
      expect(tag).toHaveClass('bg-secondary/10', 'text-secondary') // datetime maps to secondary
      expect(tag).toHaveClass('px-1.5', 'py-0.5', 'text-xs') // xs size
      expect(tag.querySelector('svg')).toBeInTheDocument() // Clock icon
      expect(screen.getByText('Wed, Sep 4 • 06:00')).toBeInTheDocument()
    })

    it('renders distance and pace tags', () => {
      render(
        <>
          <Tag variant="distance" size="xs">
            5-8 km
          </Tag>
          <Tag variant="pace" size="xs">
            Rythme modéré
          </Tag>
        </>
      )

      expect(screen.getByText('5-8 km')).toBeInTheDocument()
      expect(screen.getByText('Rythme modéré')).toBeInTheDocument()
    })
  })
})
