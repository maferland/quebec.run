import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import {
  Location,
  LocationCard,
  LocationInline,
  LocationCompact,
} from './location'

const sampleAddress = '250 3e Rue, Québec, QC G1L 2B3'
const longAddress = '2000 Boulevard de Montmorency, Québec, QC G1J 5E7, Canada'

describe('Location Component', () => {
  it('renders address correctly', () => {
    render(<Location address={sampleAddress} />)
    expect(screen.getByText(sampleAddress)).toBeInTheDocument()
  })

  it('applies default props correctly', () => {
    const { container } = render(<Location address={sampleAddress} />)

    // Should render with default variant styles
    expect(container.querySelector('.bg-gray-50')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument() // MapPin icon should be present
    expect(screen.getByText('Location')).toBeInTheDocument() // Label should be present
  })

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      const { container } = render(
        <Location address={sampleAddress} variant="default" />
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass(
        'flex',
        'items-start',
        'gap-3',
        'p-4',
        'bg-gray-50'
      )
      expect(screen.getByText('Location')).toBeInTheDocument()
    })

    it('renders card variant correctly', () => {
      const { container } = render(
        <Location address={sampleAddress} variant="card" />
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass(
        'flex',
        'items-center',
        'gap-3',
        'p-3',
        'bg-gray-50'
      )
      expect(screen.getByText('Location')).toBeInTheDocument()
    })

    it('renders inline variant correctly', () => {
      const { container } = render(
        <Location address={sampleAddress} variant="inline" />
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('flex', 'items-center', 'gap-2')
      expect(containerDiv).not.toHaveClass('bg-gray-50') // Inline doesn't have background
      expect(screen.queryByText('Location')).not.toBeInTheDocument() // Inline variant has no label
    })

    it('renders compact variant correctly', () => {
      const { container } = render(
        <Location address={sampleAddress} variant="compact" />
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass(
        'flex',
        'items-center',
        'gap-3',
        'p-3',
        'bg-gray-50'
      )
      expect(screen.queryByText('Location')).not.toBeInTheDocument() // Compact variant has no label
    })
  })

  describe('Icon visibility', () => {
    it('shows icon by default', () => {
      const { container } = render(<Location address={sampleAddress} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('hides icon when showIcon is false', () => {
      const { container } = render(
        <Location address={sampleAddress} showIcon={false} />
      )
      expect(container.querySelector('svg')).not.toBeInTheDocument()
    })

    it('places icon correctly for inline variant', () => {
      const { container } = render(
        <Location address={sampleAddress} variant="inline" showIcon={true} />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
      // For inline variant, icon should be a direct child of container
      expect(icon?.parentElement).toEqual(container.firstChild)
    })
  })

  describe('Truncation', () => {
    it('applies truncate class when truncate is true', () => {
      render(<Location address={longAddress} truncate={true} />)
      const addressElement = screen.getByText(longAddress)
      expect(addressElement).toHaveClass('truncate')
    })

    it('does not apply truncate class when truncate is false', () => {
      render(<Location address={longAddress} truncate={false} />)
      const addressElement = screen.getByText(longAddress)
      expect(addressElement).not.toHaveClass('truncate')
    })

    it('adds title attribute when truncating', () => {
      render(<Location address={longAddress} truncate={true} />)
      const addressElement = screen.getByText(longAddress)
      expect(addressElement).toHaveAttribute('title', longAddress)
    })

    it('does not add title attribute when not truncating', () => {
      render(<Location address={longAddress} truncate={false} />)
      const addressElement = screen.getByText(longAddress)
      expect(addressElement).not.toHaveAttribute('title')
    })
  })

  describe('Compact variant', () => {
    it('hides label when using compact variant', () => {
      render(<Location address={sampleAddress} variant="compact" />)
      expect(screen.queryByText('Location')).not.toBeInTheDocument()
    })

    it('shows label when using default variant', () => {
      render(<Location address={sampleAddress} variant="default" />)
      expect(screen.getByText('Location')).toBeInTheDocument()
    })

    it('inline variant never shows label', () => {
      render(<Location address={sampleAddress} variant="inline" />)
      expect(screen.queryByText('Location')).not.toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <Location address={sampleAddress} className="custom-location-class" />
      )

      expect(container.firstChild).toHaveClass('custom-location-class')
      expect(container.firstChild).toHaveClass('flex', 'items-start') // Should still have variant classes
    })
  })

  describe('Accessibility', () => {
    it('provides address as text content', () => {
      render(<Location address={sampleAddress} />)
      expect(screen.getByText(sampleAddress)).toBeInTheDocument()
    })

    it('provides full address in title when truncated', () => {
      render(<Location address={longAddress} truncate={true} />)
      const addressElement = screen.getByText(longAddress)
      expect(addressElement).toHaveAttribute('title', longAddress)
    })
  })
})

describe('Convenience Components', () => {
  describe('LocationCard', () => {
    it('renders with card variant and truncation enabled by default', () => {
      const { container } = render(<LocationCard address={longAddress} />)

      // Should have card variant styling
      expect(container.firstChild).toHaveClass(
        'flex',
        'items-center',
        'gap-3',
        'p-3'
      )

      // Should be truncated by default
      const addressElement = screen.getByText(longAddress)
      expect(addressElement).toHaveClass('truncate')
      expect(addressElement).toHaveAttribute('title', longAddress)
    })

    it('can override truncate prop', () => {
      render(<LocationCard address={longAddress} truncate={false} />)

      const addressElement = screen.getByText(longAddress)
      expect(addressElement).not.toHaveClass('truncate')
      expect(addressElement).not.toHaveAttribute('title')
    })
  })

  describe('LocationInline', () => {
    it('renders with inline variant and truncation enabled', () => {
      const { container } = render(<LocationInline address={sampleAddress} />)

      // Should have inline variant styling
      expect(container.firstChild).toHaveClass('flex', 'items-center', 'gap-2')
      expect(container.firstChild).not.toHaveClass('bg-gray-50')

      // Should be truncated
      const addressElement = screen.getByText(sampleAddress)
      expect(addressElement).toHaveClass('truncate')

      // Should show icon by default
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('can hide icon', () => {
      const { container } = render(
        <LocationInline address={sampleAddress} showIcon={false} />
      )

      expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
  })

  describe('LocationCompact', () => {
    it('renders with card variant, compact mode, and truncation', () => {
      const { container } = render(<LocationCompact address={sampleAddress} />)

      // Should have card variant styling
      expect(container.firstChild).toHaveClass(
        'flex',
        'items-center',
        'gap-3',
        'p-3'
      )

      // Should be compact (no label)
      expect(screen.queryByText('Location')).not.toBeInTheDocument()

      // Should be truncated
      const addressElement = screen.getByText(sampleAddress)
      expect(addressElement).toHaveClass('truncate')
    })
  })
})

describe('Real-world usage patterns', () => {
  it('renders like EventCard location section', () => {
    render(<LocationCard address="250 3e Rue, Québec, QC G1L 2B3" />)

    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(
      screen.getByText('250 3e Rue, Québec, QC G1L 2B3')
    ).toBeInTheDocument()

    // Should have appropriate styling for event card
    const locationLabel = screen.getByText('Location')
    expect(locationLabel).toHaveClass('font-medium', 'text-primary')
  })

  it('renders like ClubCard inline location', () => {
    const { container } = render(<LocationInline address="Quebec City" />)

    expect(screen.getByText('Quebec City')).toBeInTheDocument()
    expect(screen.queryByText('Location')).not.toBeInTheDocument()

    // Should show icon
    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('handles long addresses appropriately', () => {
    render(
      <LocationCard address="2000 Boulevard de Montmorency, Québec, QC G1J 5E7, Canada" />
    )

    const addressElement = screen.getByText(
      '2000 Boulevard de Montmorency, Québec, QC G1J 5E7, Canada'
    )
    expect(addressElement).toHaveClass('truncate')
    expect(addressElement).toHaveAttribute(
      'title',
      '2000 Boulevard de Montmorency, Québec, QC G1J 5E7, Canada'
    )
  })
})
