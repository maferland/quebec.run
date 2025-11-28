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
})
