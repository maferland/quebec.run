import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { EventFilters } from './event-filters'

const mockPush = vi.fn()
let mockParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockParams,
  usePathname: () => '/en/events',
}))

describe('EventFilters', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams()
    vi.clearAllMocks()
  })

  it('renders the search input and pace facet chip', () => {
    render(<EventFilters />)
    expect(screen.getByLabelText(/search events/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /every pace welcome/i })
    ).toBeInTheDocument()
  })

  it('debounces search input before pushing URL', async () => {
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.type(screen.getByLabelText(/search events/i), 'run')
    expect(mockPush).not.toHaveBeenCalled()

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/en/events?search=run')
    )
  })

  it('activates the open-pace facet on click', async () => {
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.click(
      screen.getByRole('button', { name: /every pace welcome/i })
    )
    expect(mockPush).toHaveBeenCalledWith('/en/events?pacePolicy=OPEN_PACE')
  })

  it('deactivates the open-pace facet when toggled off', async () => {
    mockParams = new URLSearchParams({ pacePolicy: 'OPEN_PACE' })
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.click(
      screen.getByRole('button', { name: /every pace welcome/i })
    )
    expect(mockPush).toHaveBeenCalledWith('/en/events')
  })

  it('reflects active state via aria-pressed', () => {
    mockParams = new URLSearchParams({ pacePolicy: 'OPEN_PACE' })
    render(<EventFilters />)

    expect(
      screen.getByRole('button', { name: /every pace welcome/i })
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows clear button only when a filter is active', () => {
    const { rerender } = render(<EventFilters />)
    expect(screen.queryByRole('button', { name: /^clear$/i })).toBeNull()

    mockParams = new URLSearchParams({ search: 'run' })
    rerender(<EventFilters />)
    expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument()
  })

  it('clear button resets to base path', async () => {
    mockParams = new URLSearchParams({
      search: 'run',
      pacePolicy: 'OPEN_PACE',
    })
    const user = userEvent.setup()
    render(<EventFilters />)

    await user.click(screen.getByRole('button', { name: /^clear$/i }))
    expect(mockPush).toHaveBeenCalledWith('/en/events')
  })

  it('hydrates search input from URL', () => {
    mockParams = new URLSearchParams({ search: 'morning' })
    render(<EventFilters />)
    expect(screen.getByLabelText(/search events/i)).toHaveValue('morning')
  })

  it('renders facet counts next to each chip when provided', () => {
    render(
      <EventFilters
        facetCounts={{ openPace: 2, morning: 20, evening: 11, weekend: 3 }}
      />
    )
    expect(
      screen.getByRole('button', { name: /every pace welcome.*2/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /morning.*20/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /weekend.*3/i })
    ).toBeInTheDocument()
  })

  it('disables an inactive chip with zero count', () => {
    render(
      <EventFilters
        facetCounts={{ openPace: 0, morning: 5, evening: 0, weekend: 3 }}
      />
    )
    expect(
      screen.getByRole('button', { name: /every pace welcome.*0/i })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: /evening.*0/i })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /morning.*5/i })
    ).not.toBeDisabled()
  })

  it('does not disable an active chip even if its count is zero', () => {
    mockParams = new URLSearchParams({ weekend: '1' })
    render(
      <EventFilters
        facetCounts={{ openPace: 0, morning: 0, evening: 0, weekend: 0 }}
      />
    )
    const weekendChip = screen.getByRole('button', { name: /weekend.*0/i })
    expect(weekendChip).not.toBeDisabled()
    // Active chip never picks up the disabled styling
    expect(weekendChip).not.toHaveClass('cursor-not-allowed')
    expect(weekendChip).not.toHaveClass('line-through')
  })

  it('renders chips without counts or disabled state when facetCounts is undefined', () => {
    render(<EventFilters />)
    const openPace = screen.getByRole('button', { name: /every pace welcome/i })
    expect(openPace).not.toBeDisabled()
    // No trailing number after the label
    expect(openPace.textContent?.trim()).toBe('Every pace welcome')
  })
})
