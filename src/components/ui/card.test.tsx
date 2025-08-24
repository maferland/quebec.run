import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './card'

describe('Card', () => {
  it('renders with default variant', () => {
    render(<Card>Test content</Card>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders as different HTML elements', () => {
    const { rerender } = render(
      <Card data-testid="test-card">Default content</Card>
    )
    expect(screen.getByTestId('test-card').tagName).toBe('SECTION')

    rerender(
      <Card as="article" data-testid="test-card">
        Article content
      </Card>
    )
    expect(screen.getByTestId('test-card').tagName).toBe('ARTICLE')
  })

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Card variant="accent">Accent card</Card>)
    expect(screen.getByText('Accent card')).toHaveClass(
      'border-l-4',
      'border-l-blue-500'
    )

    rerender(<Card variant="interactive">Interactive card</Card>)
    expect(screen.getByText('Interactive card')).toHaveClass('cursor-pointer')
  })

  it('merges custom className with default styles', () => {
    render(<Card className="custom-class">Custom styled</Card>)
    const card = screen.getByText('Custom styled')
    expect(card).toHaveClass('custom-class', 'bg-white', 'rounded-xl')
  })

  it('forwards additional props', () => {
    render(<Card data-testid="test-card">Test</Card>)
    expect(screen.getByTestId('test-card')).toBeInTheDocument()
  })
})
