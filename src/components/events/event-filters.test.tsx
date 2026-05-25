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
})
