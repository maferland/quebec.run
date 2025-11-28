import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteClubButton } from './delete-club-button'
import { setupMSW } from '@/lib/test-msw-setup'

// Setup MSW
setupMSW()

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

describe('DeleteClubButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.confirm = vi.fn(() => true)
    global.alert = vi.fn()
  })

  it('renders delete button with icon', () => {
    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    const button = screen.getByRole('button', { name: 'Delete Test Club' })
    expect(button).toBeInTheDocument()
  })

  it('shows confirmation dialog when clicked', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => true)
    global.confirm = mockConfirm

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button'))

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Test Club"? This action cannot be undone.'
    )
  })

  it('does not delete when user cancels confirmation', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => false)

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button'))

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('deletes club and refreshes when confirmed', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('disables button while deleting', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)

    // Mock a slow API call
    const { server } = await import('@/lib/test-msw')
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.delete('/api/clubs/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ success: true })
      })
    )

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    const button = screen.getByRole('button')
    await user.click(button)

    // Button should be disabled immediately after click
    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it('shows alert on delete error', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)
    const mockAlert = vi.fn()
    global.alert = mockAlert

    // Mock API error
    const { server } = await import('@/lib/test-msw')
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.delete('/api/clubs/:id', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      })
    )

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Failed to delete club. Please try again.'
      )
    })
  })

  it('re-enables button after error', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)
    global.alert = vi.fn()

    // Mock API error
    const { server } = await import('@/lib/test-msw')
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.delete('/api/clubs/:id', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      })
    )

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    const button = screen.getByRole('button')
    await user.click(button)

    // Wait for error handling to complete
    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has accessible label with club name', () => {
      render(<DeleteClubButton clubId="club-1" clubName="My Running Club" />)

      expect(
        screen.getByLabelText('Delete My Running Club')
      ).toBeInTheDocument()
    })

    it('supports keyboard interaction', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => true)

      render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')

      expect(global.confirm).toHaveBeenCalled()
    })

    it('shows disabled state visually', () => {
      render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      )
    })
  })
})
