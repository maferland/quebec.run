import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './empty-state'
import { Calendar, Users } from 'lucide-react'

describe('EmptyState Component', () => {
  it('renders title correctly', () => {
    render(<EmptyState title="No items found" />)

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'No items found'
    )
  })

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No events"
        description="Check back later for new events"
      />
    )

    expect(screen.getByText('No events')).toBeInTheDocument()
    expect(
      screen.getByText('Check back later for new events')
    ).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<EmptyState title="No items found" />)

    const description = screen.queryByText(/check back/i)
    expect(description).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<EmptyState title="No calendar events" icon={Calendar} />)

    expect(screen.getByText('No calendar events')).toBeInTheDocument()
    // Icon should be rendered (Calendar icon from lucide-react)
    const svgElement = document.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
  })

  it('renders action element when provided', () => {
    render(
      <EmptyState
        title="No clubs found"
        action={<button>Create Club</button>}
      />
    )

    expect(screen.getByText('No clubs found')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create Club' })
    ).toBeInTheDocument()
  })

  it('renders complete empty state with all props', () => {
    const handleCreateClick = vi.fn()

    render(
      <EmptyState
        title="No running clubs found"
        description="Be the first to create a running club in your area"
        icon={Users}
        action={
          <button onClick={handleCreateClick}>Create Running Club</button>
        }
      />
    )

    expect(screen.getByText('No running clubs found')).toBeInTheDocument()
    expect(
      screen.getByText('Be the first to create a running club in your area')
    ).toBeInTheDocument()

    const createButton = screen.getByRole('button', {
      name: 'Create Running Club',
    })
    expect(createButton).toBeInTheDocument()

    createButton.click()
    expect(handleCreateClick).toHaveBeenCalledOnce()
  })

  it('handles multiple action elements', () => {
    render(
      <EmptyState
        title="No events"
        action={
          <div>
            <button>Create Event</button>
            <button>Import Events</button>
          </div>
        }
      />
    )

    expect(
      screen.getByRole('button', { name: 'Create Event' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Import Events' })
    ).toBeInTheDocument()
  })
})
