# Visual Hierarchy Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish text-first action patterns, clickable title affordances, and proper delete confirmations across the app.

**Architecture:** Update Button component's destructive variant to solid red, add text labels to all delete buttons, create reusable ConfirmDeleteDialog for high-impact deletions, add hover underline to clickable card titles.

**Tech Stack:** React, Tailwind, Radix Dialog, next-intl, Vitest, Testing Library

---

## Task 1: Update Button destructive variant to solid red

**Files:**

- Modify: `src/components/ui/button.tsx:36-37`
- Test: `src/components/ui/button.test.tsx`

**Step 1: Write the failing test**

```tsx
// Add to button.test.tsx
it('applies solid red background for destructive variant', () => {
  render(<Button variant="destructive">Delete</Button>)

  const button = screen.getByRole('button', { name: 'Delete' })
  expect(button).toHaveClass('bg-red-600')
  expect(button).toHaveClass('text-white')
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/components/ui/button.test.tsx -t "solid red"`
Expected: FAIL - button has outline style, not solid red

**Step 3: Update destructive variant**

In `button.tsx`, change line 36-37 from:

```tsx
destructive:
  'border border-red-200 bg-surface text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500',
```

To:

```tsx
destructive:
  'bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-red-500',
```

**Step 4: Run test to verify it passes**

Run: `bun run test src/components/ui/button.test.tsx -t "solid red"`
Expected: PASS

**Step 5: Run full button test suite**

Run: `bun run test src/components/ui/button.test.tsx`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/button.test.tsx
git commit -m "feat(button): update destructive variant to solid red"
```

---

## Task 2: Add text label to DeleteEventButton

**Files:**

- Modify: `src/components/admin/delete-event-button.tsx:30-39`
- Test: `src/components/admin/delete-event-button.test.tsx`
- Modify: `messages/en.json` (add delete label)
- Modify: `messages/fr.json` (add delete label)

**Step 1: Write the failing test**

```tsx
// Update test in delete-event-button.test.tsx line 40-46
it('renders delete button with text and icon', () => {
  render(<DeleteEventButton eventId="event-123" />)

  const button = screen.getByRole('button', { name: /delete/i })
  expect(button).toBeInTheDocument()
  expect(button).toHaveAttribute('type', 'button')
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/components/admin/delete-event-button.test.tsx -t "text and icon"`
Expected: FAIL - button has no accessible name "delete"

**Step 3: Add translation key**

In `messages/en.json`, add under `forms.actions` (line ~180):

```json
"deleteEvent": "Delete"
```

In `messages/fr.json`, add under `forms.actions`:

```json
"deleteEvent": "Supprimer"
```

**Step 4: Update DeleteEventButton**

In `delete-event-button.tsx`, change lines 30-39 from:

```tsx
return (
  <Button
    type="button"
    variant="destructive"
    size="sm"
    onClick={handleDelete}
    disabled={deleteMutation.isPending}
  >
    <Trash2 className="w-4 h-4" />
  </Button>
)
```

To:

```tsx
const tActions = useTranslations('forms.actions')

return (
  <Button
    type="button"
    variant="destructive"
    size="sm"
    onClick={handleDelete}
    disabled={deleteMutation.isPending}
  >
    {tActions('deleteEvent')}
    <Trash2 className="w-4 h-4 ml-1" />
  </Button>
)
```

Also add the new hook at line 14:

```tsx
const tActions = useTranslations('forms.actions')
```

**Step 5: Run test to verify it passes**

Run: `bun run test src/components/admin/delete-event-button.test.tsx -t "text and icon"`
Expected: PASS

**Step 6: Run full test suite**

Run: `bun run test src/components/admin/delete-event-button.test.tsx`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/components/admin/delete-event-button.tsx src/components/admin/delete-event-button.test.tsx messages/en.json messages/fr.json
git commit -m "feat(delete-event): add text label with icon"
```

---

## Task 3: Refactor DeleteClubButton to use Button component with text

**Files:**

- Modify: `src/components/admin/delete-club-button.tsx`
- Test: `src/components/admin/delete-club-button.test.tsx`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Write the failing test**

```tsx
// Update test in delete-club-button.test.tsx line 25-29
it('renders delete button with text and icon', () => {
  render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

  const button = screen.getByRole('button', { name: /delete/i })
  expect(button).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/components/admin/delete-club-button.test.tsx -t "text and icon"`
Expected: FAIL - button has name "Delete Test Club" via aria-label, not button text

**Step 3: Add translation key**

In `messages/en.json`, add under `forms.actions`:

```json
"deleteClub": "Delete"
```

In `messages/fr.json`, add under `forms.actions`:

```json
"deleteClub": "Supprimer"
```

**Step 4: Rewrite DeleteClubButton**

Replace entire `delete-club-button.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useDeleteClub } from '@/lib/hooks/use-clubs'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export type DeleteClubButtonProps = {
  clubId: string
  clubName: string
}

export const DeleteClubButton = ({
  clubId,
  clubName,
}: DeleteClubButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteClub = useDeleteClub()
  const router = useRouter()
  const t = useTranslations('forms.actions')

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${clubName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteClub.mutateAsync(clubId)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete club:', error)
      alert('Failed to delete club. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Delete ${clubName}`}
    >
      {t('deleteClub')}
      <Trash2 className="w-4 h-4 ml-1" />
    </Button>
  )
}
```

**Step 5: Update tests for new behavior**

Update `delete-club-button.test.tsx` - the accessible label test (line 150-155) should now find button by text:

```tsx
it('has accessible label with club name', () => {
  render(<DeleteClubButton clubId="club-1" clubName="My Running Club" />)

  const button = screen.getByRole('button', { name: /delete/i })
  expect(button).toHaveAttribute('aria-label', 'Delete My Running Club')
})
```

Also update line 173-180 to remove className assertions (we don't test classNames per CLAUDE.md):

```tsx
it('is disabled when in deleting state', async () => {
  const user = userEvent.setup()
  global.confirm = vi.fn(() => true)

  // ... rest of test stays same, just remove the className assertion
})
```

**Step 6: Run test to verify it passes**

Run: `bun run test src/components/admin/delete-club-button.test.tsx`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/components/admin/delete-club-button.tsx src/components/admin/delete-club-button.test.tsx messages/en.json messages/fr.json
git commit -m "refactor(delete-club): use Button component with text label"
```

---

## Task 4: Create ConfirmDeleteDialog component

**Files:**

- Create: `src/components/admin/confirm-delete-dialog.tsx`
- Create: `src/components/admin/confirm-delete-dialog.test.tsx`
- Create: `src/components/admin/confirm-delete-dialog.stories.tsx`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Add translation keys**

In `messages/en.json`, add under `admin`:

```json
"confirmDeleteDialog": {
  "title": "Delete {entityType}",
  "description": "This will permanently delete {entityName}. This action cannot be undone.",
  "cancel": "Cancel",
  "delete": "Delete"
}
```

In `messages/fr.json`, add under `admin`:

```json
"confirmDeleteDialog": {
  "title": "Supprimer {entityType}",
  "description": "Ceci supprimera définitivement {entityName}. Cette action est irréversible.",
  "cancel": "Annuler",
  "delete": "Supprimer"
}
```

**Step 2: Write the failing test**

Create `confirm-delete-dialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

describe('ConfirmDeleteDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    entityType: 'Club',
    entityName: 'Test Club',
    onConfirm: vi.fn(),
    loading: false,
  }

  it('renders dialog with entity name', () => {
    render(<ConfirmDeleteDialog {...defaultProps} />)

    expect(screen.getByText(/delete club/i)).toBeInTheDocument()
    expect(screen.getByText(/test club/i)).toBeInTheDocument()
  })

  it('calls onConfirm when delete clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(<ConfirmDeleteDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onOpenChange when cancel clicked', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmDeleteDialog {...defaultProps} onOpenChange={onOpenChange} />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables buttons when loading', () => {
    render(<ConfirmDeleteDialog {...defaultProps} loading={true} />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
  })

  it('shows delete button with trash icon', () => {
    render(<ConfirmDeleteDialog {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    expect(deleteButton).toBeInTheDocument()
  })
})
```

**Step 3: Run test to verify it fails**

Run: `bun run test src/components/admin/confirm-delete-dialog.test.tsx`
Expected: FAIL - module not found

**Step 4: Create ConfirmDeleteDialog component**

Create `confirm-delete-dialog.tsx`:

```tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type ConfirmDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityName: string
  onConfirm: () => void
  loading: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  entityType,
  entityName,
  onConfirm,
  loading,
}: ConfirmDeleteDialogProps) {
  const t = useTranslations('admin.confirmDeleteDialog')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title', { entityType })}</DialogTitle>
          <DialogDescription>
            {t('description', { entityName })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {t('delete')}
            <Trash2 className="w-4 h-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 5: Run test to verify it passes**

Run: `bun run test src/components/admin/confirm-delete-dialog.test.tsx`
Expected: All tests pass

**Step 6: Create Storybook stories**

Create `confirm-delete-dialog.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

const meta: Meta<typeof ConfirmDeleteDialog> = {
  title: 'Admin/ConfirmDeleteDialog',
  component: ConfirmDeleteDialog,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof ConfirmDeleteDialog>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    entityType: 'Club',
    entityName: 'Quebec City Runners',
    onConfirm: () => {},
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}

export const Event: Story = {
  args: {
    ...Default.args,
    entityType: 'Event',
    entityName: 'Morning Run - Dec 20',
  },
}
```

**Step 7: Commit**

```bash
git add src/components/admin/confirm-delete-dialog.tsx src/components/admin/confirm-delete-dialog.test.tsx src/components/admin/confirm-delete-dialog.stories.tsx messages/en.json messages/fr.json
git commit -m "feat(confirm-delete-dialog): create reusable delete confirmation modal"
```

---

## Task 5: Update DeleteClubButton to use ConfirmDeleteDialog

**Files:**

- Modify: `src/components/admin/delete-club-button.tsx`
- Modify: `src/components/admin/delete-club-button.test.tsx`

**Step 1: Write the failing test**

Update `delete-club-button.test.tsx`:

```tsx
it('shows confirmation dialog when clicked', async () => {
  const user = userEvent.setup()

  render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

  await user.click(screen.getByRole('button', { name: /delete/i }))

  // Should show dialog instead of browser confirm
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText(/test club/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/components/admin/delete-club-button.test.tsx -t "confirmation dialog"`
Expected: FAIL - no dialog found, browser confirm used instead

**Step 3: Update DeleteClubButton to use dialog**

Replace `delete-club-button.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useDeleteClub } from '@/lib/hooks/use-clubs'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

export type DeleteClubButtonProps = {
  clubId: string
  clubName: string
}

export const DeleteClubButton = ({
  clubId,
  clubName,
}: DeleteClubButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteClub = useDeleteClub()
  const router = useRouter()
  const t = useTranslations('forms.actions')
  const tAdmin = useTranslations('admin.clubs')

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteClub.mutateAsync(clubId)
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete club:', error)
      alert('Failed to delete club. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setDialogOpen(true)}
        aria-label={`Delete ${clubName}`}
      >
        {t('deleteClub')}
        <Trash2 className="w-4 h-4 ml-1" />
      </Button>

      <ConfirmDeleteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType={tAdmin('title').replace('Manage ', '')}
        entityName={clubName}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  )
}
```

**Step 4: Update tests**

Update `delete-club-button.test.tsx` to test dialog behavior instead of browser confirm:

```tsx
// Remove global.confirm mocking where not needed
// Update tests to interact with dialog

it('shows confirmation dialog when clicked', async () => {
  const user = userEvent.setup()

  render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

  await user.click(screen.getByRole('button', { name: /delete/i }))

  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('does not delete when user cancels dialog', async () => {
  const user = userEvent.setup()

  render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

  await user.click(screen.getByRole('button', { name: /delete/i }))
  await user.click(screen.getByRole('button', { name: /cancel/i }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(mockRefresh).not.toHaveBeenCalled()
})

it('deletes club when confirmed in dialog', async () => {
  const user = userEvent.setup()

  render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

  await user.click(screen.getByRole('button', { name: /delete/i }))

  // Find delete button inside dialog
  const dialogDeleteButton = screen.getAllByRole('button', {
    name: /delete/i,
  })[1]
  await user.click(dialogDeleteButton)

  await waitFor(() => {
    expect(mockRefresh).toHaveBeenCalled()
  })
})
```

**Step 5: Run tests**

Run: `bun run test src/components/admin/delete-club-button.test.tsx`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/admin/delete-club-button.tsx src/components/admin/delete-club-button.test.tsx
git commit -m "feat(delete-club): use confirmation dialog instead of browser confirm"
```

---

## Task 6: Add hover underline to ClubCard title

**Files:**

- Modify: `src/components/clubs/club-card.tsx:43`
- Test: `src/components/clubs/club-card.test.tsx`

**Step 1: Write the failing test**

Add to `club-card.test.tsx`:

```tsx
it('renders title with hover underline affordance', () => {
  render(<ClubCard club={mockClub} />)

  const title = screen.getByRole('heading', { name: mockClub.name })
  expect(title).toHaveClass('hover:underline')
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/components/clubs/club-card.test.tsx -t "hover underline"`
Expected: FAIL - title doesn't have hover:underline class

**Step 3: Update ClubCard title**

In `club-card.tsx` line 43, change from:

```tsx
<h2 className="text-xl font-heading font-bold text-primary group-hover:text-primary/80 transition-colors">
```

To:

```tsx
<h2 className="text-xl font-heading font-bold text-primary hover:underline transition-colors">
```

**Step 4: Run test to verify it passes**

Run: `bun run test src/components/clubs/club-card.test.tsx -t "hover underline"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/clubs/club-card.tsx src/components/clubs/club-card.test.tsx
git commit -m "feat(club-card): add hover underline to title"
```

---

## Task 7: Add hover underline to EventCard title

**Files:**

- Modify: `src/components/events/event-card.tsx:22`
- Test: `src/components/events/event-card.test.tsx`

**Step 1: Write the failing test**

Add to `event-card.test.tsx`:

```tsx
it('renders title with hover underline affordance', () => {
  render(<EventCard event={mockEvent} />)

  const title = screen.getByRole('heading', { name: mockEvent.title })
  expect(title).toHaveClass('hover:underline')
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/components/events/event-card.test.tsx -t "hover underline"`
Expected: FAIL - title doesn't have hover:underline class

**Step 3: Update EventCard title**

In `event-card.tsx` line 22, change from:

```tsx
<h3 className="text-lg font-heading font-bold text-primary mb-2 line-clamp-2 leading-tight">
```

To:

```tsx
<h3 className="text-lg font-heading font-bold text-primary hover:underline mb-2 line-clamp-2 leading-tight">
```

**Step 4: Run test to verify it passes**

Run: `bun run test src/components/events/event-card.test.tsx -t "hover underline"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/events/event-card.tsx src/components/events/event-card.test.tsx
git commit -m "feat(event-card): add hover underline to title"
```

---

## Task 8: Final verification

**Step 1: Run full test suite**

Run: `bun run test --coverage`
Expected: All tests pass, coverage ≥95%

**Step 2: Run lint and typecheck**

Run: `bun run lint && tsc --noEmit`
Expected: No errors

**Step 3: Run Storybook and verify visual changes**

Run: `bun run storybook`
Check:

- Button destructive variant is solid red
- DeleteEventButton shows "Delete" text with icon
- DeleteClubButton shows "Delete" text with icon
- ConfirmDeleteDialog stories render correctly

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for visual hierarchy"
```
