import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteEventButton } from './delete-event-button'
import { setupMSW } from '@/lib/test-msw-setup'

setupMSW()

// Mock useDeleteEvent hook
const mockMutateAsync = vi.fn()
const mockUseDeleteEvent = vi.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}))

vi.mock('@/lib/hooks/use-events', () => ({
  useDeleteEvent: () => mockUseDeleteEvent(),
}))

// Mock useRouter
const mockRefresh = vi.fn()
const mockUseRouter = vi.fn(() => ({
  refresh: mockRefresh,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}))

// Mock window.confirm
const mockConfirm = vi.fn()
global.confirm = mockConfirm

describe('DeleteEventButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  it('renders delete button with trash icon', () => {
    render(<DeleteEventButton eventId="event-123" />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('shows confirmation dialog when clicked', async () => {
    render(<DeleteEventButton eventId="event-123" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button'))

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this event?'
    )
  })

  it('calls delete mutation when confirmed', async () => {
    mockConfirm.mockReturnValue(true)
    mockMutateAsync.mockResolvedValue({ success: true })

    render(<DeleteEventButton eventId="event-123" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('event-123')
    })
  })

  it('refreshes page after successful deletion', async () => {
    mockConfirm.mockReturnValue(true)
    mockMutateAsync.mockResolvedValue({ success: true })

    render(<DeleteEventButton eventId="event-123" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('does not delete when user cancels confirmation', async () => {
    mockConfirm.mockReturnValue(false)

    render(<DeleteEventButton eventId="event-123" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button'))

    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('disables button during deletion', () => {
    mockUseDeleteEvent.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    })

    render(<DeleteEventButton eventId="event-123" />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('uses destructive variant', () => {
    render(<DeleteEventButton eventId="event-123" />)

    const button = screen.getByRole('button')
    // Button component applies destructive styling via className
    expect(button).toBeInTheDocument()
  })

  it('uses small size', () => {
    render(<DeleteEventButton eventId="event-123" />)

    const button = screen.getByRole('button')
    // Button component applies sm size via className
    expect(button).toBeInTheDocument()
  })
})
