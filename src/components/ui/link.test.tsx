import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { Link } from './link'

describe('Link', () => {
  it('renders internal link correctly', () => {
    render(<Link href="/clubs">View Clubs</Link>)

    const link = screen.getByRole('link', { name: 'View Clubs' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/clubs')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  it('renders external link with icon when external prop is true', () => {
    render(
      <Link href="https://example.com" external>
        External Site
      </Link>
    )

    const link = screen.getByRole('link', { name: /external site/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    // Check for external link icon
    const icon = link.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('auto-detects external links from HTTPS URL', () => {
    render(<Link href="https://auto-external.com">Auto External</Link>)

    const link = screen.getByRole('link', { name: /auto external/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    // Check for external link icon
    const icon = link.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('auto-detects external links from HTTP URL', () => {
    render(<Link href="http://insecure.com">HTTP Link</Link>)

    const link = screen.getByRole('link', { name: /http link/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies custom className while preserving base styles', () => {
    render(
      <Link href="/test" className="custom-class">
        Test Link
      </Link>
    )

    const link = screen.getByRole('link', { name: 'Test Link' })
    expect(link).toHaveClass('custom-class')
    expect(link).toHaveClass('text-blue-600') // base styles should still be applied
  })

  it('applies inline-flex class to external links for icon alignment', () => {
    render(<Link href="https://example.com">External Link</Link>)

    const link = screen.getByRole('link', { name: /external link/i })
    expect(link).toHaveClass('inline-flex', 'items-center', 'gap-1')
  })

  it('passes through additional props', () => {
    render(
      <Link href="/test" data-testid="custom-link">
        Test Link
      </Link>
    )

    const link = screen.getByTestId('custom-link')
    expect(link).toBeInTheDocument()
  })
})
