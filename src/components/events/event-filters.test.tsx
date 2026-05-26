import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { EventFilters } from './event-filters'

const mockPush = vi.fn()
let mockParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockParams,
  usePathname: () => '/en/events',
}))

const FULL_COUNTS = {
  openPace: 5,
  morning: 10,
  evening: 8,
  weekend: 4,
  social: 6,
  training: 2,
  beginner: 3,
  showPast: 0,
}

describe('EventFilters (combobox)', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams()
    vi.clearAllMocks()
  })

  it('shows the filter input with placeholder text', () => {
    render(<EventFilters />)
    expect(screen.getByPlaceholderText(/filter/i)).toBeInTheDocument()
  })

  it('does not show facet options until the input is focused', () => {
    render(<EventFilters />)
    expect(screen.queryByRole('option', { name: /open pace/i })).toBeNull()
  })

  it('opens the popover when the input is clicked', async () => {
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    expect(
      screen.getByRole('option', { name: /open pace/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /morning/i })).toBeInTheDocument()
  })

  it('toggles a facet via URL when an option is clicked', async () => {
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    await user.click(screen.getByRole('option', { name: /open pace/i }))
    expect(mockPush).toHaveBeenCalledWith('/en/events?pacePolicy=OPEN_PACE')
  })

  it('renders an active filter as an inline pill', () => {
    mockParams = new URLSearchParams({ pacePolicy: 'OPEN_PACE' })
    render(<EventFilters />)
    expect(screen.getByText(/open pace/i)).toBeInTheDocument()
  })

  it('clears all filters when the clear button is clicked', async () => {
    mockParams = new URLSearchParams({ pacePolicy: 'OPEN_PACE' })
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.click(screen.getByRole('button', { name: /^clear$/i }))
    expect(mockPush).toHaveBeenCalledWith('/en/events')
  })

  it('filters options by query when typing', async () => {
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    await user.type(screen.getByPlaceholderText(/filter/i), 'morn')
    expect(screen.getByRole('option', { name: /morning/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /evening/i })).toBeNull()
  })

  it('shows facet counts in the popover when provided', async () => {
    const user = userEvent.setup()
    render(<EventFilters facetCounts={FULL_COUNTS} />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    const morning = screen.getByRole('option', { name: /morning/i })
    expect(morning.textContent).toContain('10')
  })

  it('disables an inactive option with zero count', async () => {
    const user = userEvent.setup()
    render(<EventFilters facetCounts={{ ...FULL_COUNTS, evening: 0 }} />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    expect(screen.getByRole('option', { name: /evening/i })).toBeDisabled()
  })

  it('suppresses counts in the popover when hideCountsWhenInactive and no filters active', async () => {
    const user = userEvent.setup()
    render(<EventFilters facetCounts={FULL_COUNTS} hideCountsWhenInactive />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    const morning = screen.getByRole('option', { name: /morning/i })
    expect(morning.textContent).not.toContain('10')
  })

  it('shows counts when hideCountsWhenInactive but a filter is active', async () => {
    mockParams = new URLSearchParams({ pacePolicy: 'OPEN_PACE' })
    const user = userEvent.setup()
    render(<EventFilters facetCounts={FULL_COUNTS} hideCountsWhenInactive />)

    await user.click(screen.getByRole('textbox'))
    const morning = screen.getByRole('option', { name: /morning/i })
    expect(morning.textContent).toContain('10')
  })
})
