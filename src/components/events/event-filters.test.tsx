import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EventFilters } from './event-filters'
import { useRouter, useSearchParams } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) =>
    `${namespace}.${key}`,
}))

describe('EventFilters', () => {
  const mockPush = vi.fn()
  const mockSearchParams = new URLSearchParams()

  const clubs = [
    { id: 'club1', name: 'Montreal Runners' },
    { id: 'club2', name: 'Quebec Joggers' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as ReturnType<
      typeof useRouter
    >)
    vi.mocked(useSearchParams).mockReturnValue(
      mockSearchParams as ReturnType<typeof useSearchParams>
    )
  })

  it('renders search input', () => {
    render(<EventFilters clubs={clubs} />)
    expect(
      screen.getByPlaceholderText('events.filters.searchPlaceholder')
    ).toBeInTheDocument()
  })

  it('renders club dropdown with all clubs', () => {
    render(<EventFilters clubs={clubs} />)
    const select = screen.getByRole('combobox', {
      name: /events.filters.selectClub/i,
    })
    expect(select).toBeInTheDocument()
  })

  it('renders date range picker when showDateRange is true', () => {
    render(<EventFilters clubs={clubs} showDateRange={true} />)
    expect(screen.getByText('events.filters.dateRange')).toBeInTheDocument()
  })

  it('does not render date range picker when showDateRange is false', () => {
    render(<EventFilters clubs={clubs} showDateRange={false} />)
    expect(
      screen.queryByText('events.filters.dateRange')
    ).not.toBeInTheDocument()
  })

  it('updates URL with search term after debounce', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const input = screen.getByPlaceholderText(
      'events.filters.searchPlaceholder'
    )
    await user.type(input, 'montreal')

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('?search=montreal')
      },
      { timeout: 500 }
    )
  })

  it('updates URL immediately when club selected', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const select = screen.getByRole('combobox', {
      name: /events.filters.selectClub/i,
    })
    await user.selectOptions(select, 'club1')

    expect(mockPush).toHaveBeenCalledWith('?clubId=club1')
  })

  it('preserves existing params when adding new filter', async () => {
    mockSearchParams.set('search', 'existing')
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const select = screen.getByRole('combobox', {
      name: /events.filters.selectClub/i,
    })
    await user.selectOptions(select, 'club1')

    expect(mockPush).toHaveBeenCalledWith('?search=existing&clubId=club1')
  })

  it('removes param from URL when cleared', async () => {
    mockSearchParams.set('search', 'montreal')
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const input = screen.getByPlaceholderText(
      'events.filters.searchPlaceholder'
    )
    await user.clear(input)

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('?')
      },
      { timeout: 500 }
    )
  })

  it('initializes search input from URL params', () => {
    mockSearchParams.set('search', 'quebec')
    render(<EventFilters clubs={clubs} />)

    const input = screen.getByPlaceholderText(
      'events.filters.searchPlaceholder'
    ) as HTMLInputElement
    expect(input.value).toBe('quebec')
  })

  it('clears all filters when clear button clicked', async () => {
    mockSearchParams.set('search', 'montreal')
    mockSearchParams.set('clubId', 'club1')
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const clearButton = screen.getByRole('button', {
      name: /events.filters.clearFilters/i,
    })
    await user.click(clearButton)

    expect(mockPush).toHaveBeenCalledWith('/events')
  })

  it('is keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    // Tab to search input
    await user.tab()
    expect(
      screen.getByPlaceholderText('events.filters.searchPlaceholder')
    ).toHaveFocus()

    // Tab to club dropdown
    await user.tab()
    expect(
      screen.getByRole('combobox', { name: /events.filters.selectClub/i })
    ).toHaveFocus()
  })

  it('has accessible labels for screen readers', () => {
    render(<EventFilters clubs={clubs} />)

    expect(
      screen.getByLabelText('events.filters.searchPlaceholder')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('events.filters.selectClub')
    ).toBeInTheDocument()
  })
})
