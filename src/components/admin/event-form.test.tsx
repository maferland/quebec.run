import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { EventForm } from './event-form'
import { setupMSW } from '@/lib/test-msw-setup'

setupMSW()

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('EventForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('renders all form fields', () => {
      render(<EventForm mode="create" clubs={[{ id: '1', name: 'Club 1' }]} />)

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/club/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/meeting location/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/distance/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/pace/i)).toBeInTheDocument()
    })

    it('submits form data when creating event', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()

      render(
        <EventForm
          mode="create"
          clubs={[{ id: '1', name: 'Club 1' }]}
          onSuccess={onSuccess}
        />
      )

      await user.type(screen.getByLabelText(/title/i), 'Morning Run')
      await user.type(screen.getByLabelText(/date/i), '2025-12-01')
      await user.type(screen.getByLabelText(/time/i), '10:00')
      await user.type(screen.getByLabelText(/meeting location/i), '123 Main St')

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows validation errors for required fields', async () => {
      const user = userEvent.setup()

      render(<EventForm mode="create" clubs={[{ id: '1', name: 'Club 1' }]} />)

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Edit Mode', () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Existing Event',
      description: 'Description',
      date: new Date('2025-12-01'),
      time: '10:00',
      address: '123 Main St',
      distance: '5km',
      pace: '5:00/km',
      clubId: '1',
      club: {
        id: '1',
        name: 'Club 1',
        slug: 'club-1',
        description: null,
        website: null,
        instagram: null,
        facebook: null,
        language: null,
        stravaClubId: null,
        stravaSlug: null,
        isManual: true,
        lastSynced: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: 'owner-1',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('populates form with initial data', () => {
      render(
        <EventForm
          mode="edit"
          initialData={mockEvent}
          clubs={[{ id: '1', name: 'Club 1' }]}
        />
      )

      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Event')
      expect(screen.getByLabelText(/meeting location/i)).toHaveValue(
        '123 Main St'
      )
    })

    it('shows delete button in edit mode', () => {
      render(
        <EventForm
          mode="edit"
          initialData={mockEvent}
          clubs={[{ id: '1', name: 'Club 1' }]}
        />
      )

      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument()
    })

    it('deletes event with confirmation', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => true)

      render(
        <EventForm
          mode="edit"
          initialData={mockEvent}
          clubs={[{ id: '1', name: 'Club 1' }]}
        />
      )

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/events')
      })
    })
  })
})
