import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { RecurringEventForm } from './recurring-event-form'

const mockMutateAsync = vi.fn()

vi.mock('@/lib/hooks/use-recurring-events', () => ({
  useCreateRecurringEvent: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useUpdateRecurringEvent: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

describe('RecurringEventForm', () => {
  it('renders form fields', () => {
    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club"
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/place name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
  })

  it('shows recurrence builder', () => {
    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club"
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
  })

  it('shows occurrence preview', () => {
    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club"
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByText(/next occurrences/i)).toBeInTheDocument()
  })

  it('validates empty recurrence days', async () => {
    const user = userEvent.setup()
    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club"
        onSuccess={vi.fn()}
      />
    )

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Event')
    await user.type(screen.getByLabelText(/address/i), '123 Main St')

    // Try to submit without selecting days (weekly frequency by default)
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(
        screen.getByText(/please select at least one day of the week/i)
      ).toBeInTheDocument()
    })

    // Should not call mutation
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    mockMutateAsync.mockResolvedValueOnce({})

    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club-id"
        onSuccess={onSuccess}
      />
    )

    // Fill required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Event')
    await user.type(screen.getByLabelText(/place name/i), 'Café Central')
    await user.type(screen.getByLabelText(/address/i), '123 Main St')

    // Select a day (Monday)
    const mondayCheckbox = screen.getByLabelText(/mon/i)
    await user.click(mondayCheckbox)

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    // Should call mutation with correct data
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Event',
          placeName: 'Café Central',
          address: '123 Main St',
          clubId: 'test-club-id',
          schedulePattern: expect.stringContaining('FREQ=WEEKLY'),
        })
      )
    })

    // Should call onSuccess
    expect(onSuccess).toHaveBeenCalled()
  })
})
