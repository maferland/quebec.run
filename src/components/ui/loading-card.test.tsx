import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  LoadingCard,
  LoadingElements,
  ClubLoadingCard,
  EventLoadingCard,
  LoadingGrid,
} from './loading-card'

describe('LoadingCard Component', () => {
  it('renders empty loading card', () => {
    const { container } = render(<LoadingCard />)

    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('class')
  })

  it('renders children when provided', () => {
    render(
      <LoadingCard>
        <div>Custom loading content</div>
      </LoadingCard>
    )

    expect(screen.getByText('Custom loading content')).toBeInTheDocument()
  })
})

describe('LoadingElements', () => {
  it('renders Line element', () => {
    const { container } = render(<LoadingElements.Line />)

    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders Circle element', () => {
    const { container } = render(<LoadingElements.Circle />)

    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders Block element', () => {
    const { container } = render(<LoadingElements.Block />)

    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders Badge element', () => {
    const { container } = render(<LoadingElements.Badge />)

    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('ClubLoadingCard Component', () => {
  it('renders club loading pattern', () => {
    const { container } = render(<ClubLoadingCard />)

    // Should render a loading card with multiple loading elements
    expect(container.firstChild).toBeInTheDocument()

    // Should have multiple loading elements (circles, lines, blocks)
    const loadingElements = container.querySelectorAll('div[class*="bg-gray"]')
    expect(loadingElements.length).toBeGreaterThan(3) // Multiple skeleton elements
  })
})

describe('EventLoadingCard Component', () => {
  it('renders event loading pattern', () => {
    const { container } = render(<EventLoadingCard />)

    // Should render a loading card with event-specific pattern
    expect(container.firstChild).toBeInTheDocument()

    // Should have multiple loading elements for event layout
    const loadingElements = container.querySelectorAll('div[class*="bg-gray"]')
    expect(loadingElements.length).toBeGreaterThan(2) // Multiple skeleton elements
  })
})

describe('LoadingGrid Component', () => {
  it('renders default number of loading items', () => {
    render(
      <LoadingGrid>
        <div data-testid="loading-item">Loading...</div>
      </LoadingGrid>
    )

    // Default count is 6
    const loadingItems = screen.getAllByTestId('loading-item')
    expect(loadingItems).toHaveLength(6)
  })

  it('renders custom number of loading items', () => {
    render(
      <LoadingGrid count={3}>
        <div data-testid="loading-item">Loading...</div>
      </LoadingGrid>
    )

    const loadingItems = screen.getAllByTestId('loading-item')
    expect(loadingItems).toHaveLength(3)
  })

  it('renders different children for each item', () => {
    let renderCount = 0
    const TestChild = () => {
      renderCount++
      return <div data-testid={`item-${renderCount}`}>Item {renderCount}</div>
    }

    render(
      <LoadingGrid count={2}>
        <TestChild />
      </LoadingGrid>
    )

    expect(screen.getByTestId('item-1')).toBeInTheDocument()
    expect(screen.getByTestId('item-2')).toBeInTheDocument()
    expect(renderCount).toBe(2)
  })

  it('works with complex children', () => {
    render(
      <LoadingGrid count={2}>
        <ClubLoadingCard />
      </LoadingGrid>
    )

    const loadingCards = document.querySelectorAll(
      'div[class*="animate-pulse"]'
    )
    expect(loadingCards.length).toBeGreaterThanOrEqual(2) // At least 2 loading cards
  })
})
