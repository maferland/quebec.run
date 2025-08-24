import { render, screen, waitFor } from '@/lib/test-utils'
import { describe, expect, it, beforeEach } from 'vitest'
import { http } from 'msw'
import { server } from '@/lib/test-msw'
import { setupMSW } from '@/lib/test-msw-setup'
import { mockClubsData, mockEmptyClubsData } from '@/lib/test-fixtures'
import { createMockHandler } from '@/lib/test-mock-handler'
import HomePage from './page'

describe('HomePage', () => {
  setupMSW()

  beforeEach(() => {
    server.resetHandlers()
  })

  it('fetches and renders clubs data from API', async () => {
    const { mock, handler } = createMockHandler({
      type: 'static',
      response: mockClubsData,
    })

    server.use(http.get('*/api/clubs', handler))

    render(<HomePage />)

    // Should show loading initially
    expect(screen.getByText('Loading clubs...')).toBeInTheDocument()

    // Wait for API call to complete and data to render
    await waitFor(() => {
      expect(screen.queryByText('Loading clubs...')).not.toBeInTheDocument()
    })

    // Verify the API was called with correct parameters
    expect(mock).toHaveBeenCalledWith({
      method: 'GET',
      url: expect.stringContaining('/api/clubs'),
      pathname: '/api/clubs',
      searchParams: {},
      body: undefined,
    })

    // Should render exactly 2 club cards
    const clubCards = screen.getAllByTestId('club-card')
    expect(clubCards).toHaveLength(2)

    // Verify that our mock data is actually rendered using specific headings
    expect(
      screen.getByRole('heading', { name: '6AM Club Test' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Quebec Runners Test' })
    ).toBeInTheDocument()

    // Verify descriptions
    expect(
      screen.getByText('Early morning running club for testing')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Running club for all levels - test version')
    ).toBeInTheDocument()

    // Verify events from mock data are rendered
    expect(screen.getByText('6AM Club Limoilou Test Run')).toBeInTheDocument()
    expect(screen.getByText('6AM Club Saint-Jean Test Run')).toBeInTheDocument()
    expect(screen.getByText('Evening Run Test')).toBeInTheDocument()

    // Verify times and distances from mock
    expect(screen.getAllByText('06:00')).toHaveLength(2)
    expect(screen.getByText('18:00')).toBeInTheDocument()
    expect(screen.getByText('5-8 km')).toBeInTheDocument()
    expect(screen.getByText('10 km')).toBeInTheDocument()

    // Verify club links use correct slugs from mock data
    const clubLinks = screen.getAllByRole('link')
    expect(clubLinks).toHaveLength(2)
    expect(clubLinks[0]).toHaveAttribute('href', '/clubs/6am-club-test')
    expect(clubLinks[1]).toHaveAttribute('href', '/clubs/quebec-runners-test')
  })

  it('handles empty clubs response correctly', async () => {
    const { mock, handler } = createMockHandler({
      type: 'static',
      response: mockEmptyClubsData,
    })

    server.use(http.get('*/api/clubs', handler))

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading clubs...')).not.toBeInTheDocument()
    })

    // Verify API was called
    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        pathname: '/api/clubs',
      })
    )

    // Should not render any club cards
    expect(screen.queryAllByTestId('club-card')).toHaveLength(0)
    expect(
      screen.queryByRole('heading', { name: /Test/ })
    ).not.toBeInTheDocument()

    // Static content should still be there
    expect(
      screen.getByRole('heading', { name: 'Featured Run Clubs' })
    ).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    const { mock, handler } = createMockHandler({
      type: 'static',
      response: null,
      code: 500,
    })

    server.use(http.get('*/api/clubs', handler))

    render(<HomePage />)

    expect(screen.getByText('Loading clubs...')).toBeInTheDocument()

    await waitFor(
      () => {
        expect(screen.queryByText('Loading clubs...')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Verify API was called even though it failed
    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        pathname: '/api/clubs',
      })
    )

    // Should not render any club cards
    expect(screen.queryAllByTestId('club-card')).toHaveLength(0)
    expect(
      screen.queryByRole('heading', { name: /Test/ })
    ).not.toBeInTheDocument()
  })

  it('supports dynamic response based on query parameters', async () => {
    const { mock, handler } = createMockHandler({
      type: 'dynamic',
      cb: (details) => {
        // Return different data based on limit parameter
        const limit = parseInt(details.searchParams.limit || '50')
        const data = limit === 10 ? [mockClubsData[0]] : mockClubsData
        return { response: data }
      },
    })

    server.use(http.get('*/api/clubs', handler))

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading clubs...')).not.toBeInTheDocument()
    })

    // Verify the callback was called with no search params (default behavior)
    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchParams: {},
      })
    )

    // Should render both clubs since limit=50
    expect(screen.getAllByTestId('club-card')).toHaveLength(2)
  })

  it('renders static content correctly', () => {
    render(<HomePage />)

    expect(
      screen.getByRole('heading', { name: 'Discover Run Clubs in Quebec City' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Featured Run Clubs' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Map View' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Calendar View' })
    ).toBeInTheDocument()

    expect(
      screen.getByText(/Find your running community and join exciting runs/)
    ).toBeInTheDocument()

    expect(screen.getByText('Map coming soon')).toBeInTheDocument()
    expect(screen.getByText('Calendar coming soon')).toBeInTheDocument()
  })
})
