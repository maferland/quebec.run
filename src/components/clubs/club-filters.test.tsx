import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { ClubFilters } from './club-filters'

const mockPush = vi.fn()
let mockParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockParams,
  usePathname: () => '/en/clubs',
}))

const FULL_COUNTS = {
  road: 8,
  trail: 2,
  social: 5,
  training: 1,
  beginner: 3,
}

describe('ClubFilters (combobox)', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams()
    vi.clearAllMocks()
  })

  it('shows the filter input with placeholder text', () => {
    render(<ClubFilters />)
    expect(screen.getByPlaceholderText(/filter/i)).toBeInTheDocument()
  })

  it('opens the popover with all five club facets when input is clicked', async () => {
    const user = userEvent.setup()
    render(<ClubFilters />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    expect(screen.getByRole('option', { name: /^road/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^trail/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^social/i })).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /^training/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /beginner-friendly/i })
    ).toBeInTheDocument()
  })

  it('toggles a facet via URL when an option is clicked', async () => {
    const user = userEvent.setup()
    render(<ClubFilters />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    await user.click(screen.getByRole('option', { name: /^road/i }))
    expect(mockPush).toHaveBeenCalledWith('/en/clubs?type=ROAD')
  })

  it('renders an active facet as an inline pill', () => {
    mockParams = new URLSearchParams({ type: 'ROAD' })
    render(<ClubFilters />)
    expect(screen.getByText(/^road/i)).toBeInTheDocument()
  })

  it('shows counts in popover when facetCounts provided', async () => {
    const user = userEvent.setup()
    render(<ClubFilters facetCounts={FULL_COUNTS} />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    const road = screen.getByRole('option', { name: /^road/i })
    expect(road.textContent).toContain('8')
  })

  it('disables an inactive option with zero count', async () => {
    const user = userEvent.setup()
    render(<ClubFilters facetCounts={{ ...FULL_COUNTS, trail: 0 }} />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    expect(screen.getByRole('option', { name: /^trail/i })).toBeDisabled()
  })

  it('filters options by typed query', async () => {
    const user = userEvent.setup()
    render(<ClubFilters />)

    await user.click(screen.getByPlaceholderText(/filter/i))
    await user.type(screen.getByPlaceholderText(/filter/i), 'social')
    expect(screen.getByRole('option', { name: /^social/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /^road/i })).toBeNull()
  })
})
