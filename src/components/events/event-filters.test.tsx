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

const CLUBS = [
  { slug: 'fauxmouvement', name: 'Faux Mouvement' },
  { slug: 'kogi', name: 'Kogi' },
]

describe('EventFilters', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams()
    vi.clearAllMocks()
  })

  it('renders search input, club select, and pace toggle', () => {
    render(<EventFilters clubs={CLUBS} />)
    expect(screen.getByLabelText(/search events/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/filter by club/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText(/pace-flexible only/i)).toBeInTheDocument()
  })

  it('lists each club as an option', () => {
    render(<EventFilters clubs={CLUBS} />)
    const select = screen.getByLabelText(/filter by club/i)
    expect(select).toHaveTextContent('Faux Mouvement')
    expect(select).toHaveTextContent('Kogi')
  })

  it('debounces search input before pushing URL', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={CLUBS} />)

    await user.type(screen.getByLabelText(/search events/i), 'run')
    expect(mockPush).not.toHaveBeenCalled()

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/en/events?search=run')
    )
  })

  it('updates URL immediately when club is selected', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={CLUBS} />)

    await user.selectOptions(
      screen.getByLabelText(/filter by club/i),
      'fauxmouvement'
    )
    expect(mockPush).toHaveBeenCalledWith('/en/events?clubSlug=fauxmouvement')
  })

  it('toggles pacePolicy=OPEN_PACE when checkbox checked', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={CLUBS} />)

    await user.click(screen.getByRole('checkbox'))
    expect(mockPush).toHaveBeenCalledWith('/en/events?pacePolicy=OPEN_PACE')
  })

  it('removes pacePolicy param when checkbox unchecked', async () => {
    mockParams = new URLSearchParams({ pacePolicy: 'OPEN_PACE' })
    const user = userEvent.setup()
    render(<EventFilters clubs={CLUBS} />)

    await user.click(screen.getByRole('checkbox'))
    expect(mockPush).toHaveBeenCalledWith('/en/events')
  })

  it('shows clear button only when a filter is active', () => {
    const { rerender } = render(<EventFilters clubs={CLUBS} />)
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull()

    mockParams = new URLSearchParams({ search: 'run' })
    rerender(<EventFilters clubs={CLUBS} />)
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('clear button resets to base path', async () => {
    mockParams = new URLSearchParams({
      search: 'run',
      clubSlug: 'kogi',
      pacePolicy: 'OPEN_PACE',
    })
    const user = userEvent.setup()
    render(<EventFilters clubs={CLUBS} />)

    await user.click(screen.getByRole('button', { name: /clear/i }))
    expect(mockPush).toHaveBeenCalledWith('/en/events')
  })

  it('hydrates search input from URL', () => {
    mockParams = new URLSearchParams({ search: 'morning' })
    render(<EventFilters clubs={CLUBS} />)
    expect(screen.getByLabelText(/search events/i)).toHaveValue('morning')
  })

  it('marks the active club option', () => {
    mockParams = new URLSearchParams({ clubSlug: 'kogi' })
    render(<EventFilters clubs={CLUBS} />)
    expect(screen.getByLabelText(/filter by club/i)).toHaveValue('kogi')
  })
})
