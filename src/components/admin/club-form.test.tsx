import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { ClubForm } from './club-form'
import { setupMSW } from '@/lib/test-msw-setup'
import type { ClubWithEvents } from '@/lib/schemas'

// Setup MSW
setupMSW()

// Mock next-intl - must be at module level before imports
vi.mock('next-intl', () => {
  const createMockTranslations = () => {
    const allTranslations: Record<string, string> = {
      create: 'Create',
      creating: 'Creating...',
      save: 'Save',
      updating: 'Updating...',
      delete: 'Delete',
      deleting: 'Deleting...',
      cancel: 'Cancel',
      name: 'Name',
      description: 'Description',
      language: 'Language',
      website: 'Website',
      instagram: 'Instagram',
      facebook: 'Facebook',
      'admin.clubs.confirmDelete': 'Are you sure you want to delete this club?',
    }

    return (key: string) => allTranslations[key] || key
  }

  return {
    useTranslations: createMockTranslations,
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  }
})

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockClub: ClubWithEvents = {
  id: 'club-1',
  name: 'Test Club',
  slug: 'test-club',
  description: 'Test Description',
  language: 'fr',
  website: 'https://test.com',
  instagram: '@testclub',
  facebook: 'testclub',
  stravaClubId: null,
  stravaSlug: null,
  isManual: true,
  lastSynced: null,
  lastSyncStatus: null,
  lastSyncError: null,
  lastSyncAttempt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: 'user-1',
  events: [],
}

describe('ClubForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.confirm = vi.fn(() => true)
  })

  describe('Create Mode', () => {
    it('renders all form fields in create mode', () => {
      render(<ClubForm mode="create" />)

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/instagram/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/facebook/i)).toBeInTheDocument()
    })

    it('shows create button in create mode', () => {
      render(<ClubForm mode="create" />)

      expect(
        screen.getByRole('button', { name: /create/i })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /delete/i })
      ).not.toBeInTheDocument()
    })

    it('submits form data when creating a club', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()

      render(<ClubForm mode="create" onSuccess={onSuccess} />)

      await user.type(screen.getByLabelText(/name/i), 'New Club')
      await user.type(
        screen.getByLabelText(/description/i),
        'A new club description'
      )
      await user.type(screen.getByLabelText(/website/i), 'https://newclub.com')
      await user.type(screen.getByLabelText(/instagram/i), '@newclub')
      await user.type(screen.getByLabelText(/facebook/i), 'newclub')

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows validation errors for required fields', async () => {
      const user = userEvent.setup()

      render(<ClubForm mode="create" />)

      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /create/i }))

      // Wait for validation error to appear
      await waitFor(() => {
        expect(screen.getByText(/name/i)).toBeInTheDocument()
      })
    })

    it('disables submit button while creating', async () => {
      const user = userEvent.setup()

      // Add delay to MSW handler to capture loading state
      const { http, HttpResponse, delay } = await import('msw')
      const { server } = await import('@/lib/test-msw')
      server.use(
        http.post('/api/clubs', async () => {
          await delay(100)
          return HttpResponse.json({ id: 'new-club' }, { status: 201 })
        })
      )

      render(<ClubForm mode="create" />)

      await user.type(screen.getByLabelText(/name/i), 'Test Club')

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Check that button shows loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
      })
    })

    it('shows cancel button that navigates back', async () => {
      const user = userEvent.setup()

      render(<ClubForm mode="create" />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)

      expect(mockPush).toHaveBeenCalledWith('/admin/clubs')
    })
  })

  describe('Edit Mode', () => {
    it('populates form with initial data in edit mode', () => {
      render(<ClubForm mode="edit" initialData={mockClub} />)

      expect(screen.getByLabelText(/name/i)).toHaveValue('Test Club')
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Test Description'
      )
      expect(screen.getByLabelText(/website/i)).toHaveValue('https://test.com')
      expect(screen.getByLabelText(/instagram/i)).toHaveValue('@testclub')
      expect(screen.getByLabelText(/facebook/i)).toHaveValue('testclub')
    })

    it('shows save and delete buttons in edit mode', () => {
      render(<ClubForm mode="edit" initialData={mockClub} />)

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument()
    })

    it('submits updated data when editing a club', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()

      render(
        <ClubForm mode="edit" initialData={mockClub} onSuccess={onSuccess} />
      )

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Club Name')

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('shows confirmation dialog before deleting', async () => {
      const user = userEvent.setup()
      const mockConfirm = vi.fn(() => false)
      global.confirm = mockConfirm

      render(<ClubForm mode="edit" initialData={mockClub} />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this club?'
      )
    })

    it('deletes club when confirmed', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => true)

      render(<ClubForm mode="edit" initialData={mockClub} />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/clubs')
      })
    })

    it('does not delete club when cancelled', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => false)

      render(<ClubForm mode="edit" initialData={mockClub} />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('disables buttons while updating', async () => {
      const user = userEvent.setup()

      // Add delay to MSW handler to capture loading state
      const { http, HttpResponse, delay } = await import('msw')
      const { server } = await import('@/lib/test-msw')
      server.use(
        http.put('/api/clubs/:id', async () => {
          await delay(100)
          return HttpResponse.json(mockClub)
        })
      )

      render(<ClubForm mode="edit" initialData={mockClub} />)

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled()
      })
    })

    it('disables buttons while deleting', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => true)

      // Add delay to MSW handler to capture loading state
      const { http, HttpResponse, delay } = await import('msw')
      const { server } = await import('@/lib/test-msw')
      server.use(
        http.delete('/api/clubs/:id', async () => {
          await delay(100)
          return HttpResponse.json({ success: true })
        })
      )

      render(<ClubForm mode="edit" initialData={mockClub} />)

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('associates labels with form inputs', () => {
      render(<ClubForm mode="create" />)

      const nameInput = screen.getByLabelText(/name/i)
      expect(nameInput).toHaveAttribute('id')

      const descriptionInput = screen.getByLabelText(/description/i)
      expect(descriptionInput).toHaveAttribute('id')
    })

    it('marks required fields', () => {
      render(<ClubForm mode="create" />)

      const nameInput = screen.getByLabelText(/name/i)
      expect(nameInput).toBeRequired()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(<ClubForm mode="create" />)

      const nameInput = screen.getByLabelText(/name/i)
      nameInput.focus()
      expect(nameInput).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/description/i)).toHaveFocus()
    })
  })

  describe('Strava Integration', () => {
    it('shows Strava section in edit mode with linked club', () => {
      const linkedClub: ClubWithEvents = {
        ...mockClub,
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        lastSyncStatus: 'success',
        lastSynced: new Date('2025-11-28T10:00:00Z'),
      }

      render(<ClubForm mode="edit" initialData={linkedClub} />)

      expect(screen.getByText(/strava integration/i)).toBeInTheDocument()
      expect(screen.getByText(/test-club-123/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /sync now/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/last synced/i)).toBeInTheDocument()
    })

    it('shows unlinked state when no Strava slug in edit mode', () => {
      render(<ClubForm mode="edit" initialData={mockClub} />)

      expect(screen.getByText(/strava integration/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/strava club slug/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /preview club data/i })
      ).toBeInTheDocument()
    })

    it('does not show Strava section in create mode', () => {
      render(<ClubForm mode="create" />)

      expect(screen.queryByText(/strava integration/i)).not.toBeInTheDocument()
    })

    it('shows sync error when last sync failed', () => {
      const failedClub: ClubWithEvents = {
        ...mockClub,
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        lastSyncStatus: 'failed',
        lastSyncError: 'Network error',
      }

      render(<ClubForm mode="edit" initialData={failedClub} />)

      expect(screen.getByText(/last sync failed/i)).toBeInTheDocument()
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })

    it('handles preview button click', async () => {
      const user = userEvent.setup()
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ name: 'Test Club' }),
        } as Response)
      )

      render(<ClubForm mode="edit" initialData={mockClub} />)

      const slugInput = screen.getByLabelText(/strava club slug/i)
      await user.type(slugInput, 'test-club-123')

      const previewButton = screen.getByRole('button', {
        name: /preview club data/i,
      })
      await user.click(previewButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/strava/preview?slug=test-club-123'
        )
      })
    })

    it('handles sync button click', async () => {
      const user = userEvent.setup()
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              summary: { eventsAdded: 5, eventsUpdated: 2 },
            }),
        } as Response)
      )
      global.alert = vi.fn()
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      })

      const linkedClub: ClubWithEvents = {
        ...mockClub,
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
      }

      render(<ClubForm mode="edit" initialData={linkedClub} />)

      const syncButton = screen.getByRole('button', { name: /sync now/i })
      await user.click(syncButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/clubs/club-1/sync-strava',
          { method: 'POST' }
        )
      })
    })

    it('handles unlink button click with confirmation', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => true)
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      )
      global.alert = vi.fn()
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      })

      const linkedClub: ClubWithEvents = {
        ...mockClub,
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
      }

      render(<ClubForm mode="edit" initialData={linkedClub} />)

      const unlinkButton = screen.getByRole('button', { name: /unlink/i })
      await user.click(unlinkButton)

      expect(global.confirm).toHaveBeenCalled()
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/clubs/club-1/unlink-strava',
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    it('does not unlink when user cancels confirmation', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => false)
      global.fetch = vi.fn()

      const linkedClub: ClubWithEvents = {
        ...mockClub,
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
      }

      render(<ClubForm mode="edit" initialData={linkedClub} />)

      const unlinkButton = screen.getByRole('button', { name: /unlink/i })
      await user.click(unlinkButton)

      expect(global.confirm).toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
