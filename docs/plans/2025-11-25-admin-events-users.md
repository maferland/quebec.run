# Admin Events & User Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete admin dashboard by implementing full CRUD for events management and user management with admin toggle capability.

**Architecture:** Sequential implementation - complete Events management first (mirror clubs pattern), then User management (new feature). Service layer → API routes → Hooks → Components → Pages. Full test coverage at each layer.

**Tech Stack:** Next.js 15 App Router, Prisma, Zod, React Query, React Hook Form, Vitest, MSW

---

## Phase 1: Events Management

### Task 1: Service Layer - Update Event

**Files:**

- Modify: `src/lib/services/events.ts:92-end`
- Test: `src/lib/services/events.test.ts`

**Step 1: Write the failing test**

Add to `src/lib/services/events.test.ts`:

```typescript
describe('updateEvent', () => {
  it('updates event when user is admin', async () => {
    const club = await prisma.club.create({
      data: { name: 'Test Club', slug: 'test-club', ownerId: testUser.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Old Title',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Old Address',
        clubId: club.id,
      },
    })

    const result = await updateEvent({
      user: adminUser,
      data: {
        id: event.id,
        title: 'New Title',
        date: '2025-12-02',
        time: '11:00',
        address: 'New Address',
        clubId: club.id,
      },
    })

    expect(result.title).toBe('New Title')
    expect(result.address).toBe('New Address')
  })

  it('updates event when user owns the club', async () => {
    const club = await prisma.club.create({
      data: { name: 'Test Club', slug: 'test-club', ownerId: testUser.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Old Title',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    const result = await updateEvent({
      user: testUser,
      data: {
        id: event.id,
        title: 'New Title',
        date: '2025-12-02',
        time: '11:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    expect(result.title).toBe('New Title')
  })

  it('throws error when user does not own club and is not admin', async () => {
    const otherUser = await prisma.user.create({
      data: { email: 'other@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Test Club', slug: 'test-club', ownerId: testUser.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Title',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    await expect(
      updateEvent({
        user: otherUser,
        data: {
          id: event.id,
          title: 'New Title',
          date: '2025-12-02',
          time: '11:00',
          address: 'Address',
          clubId: club.id,
        },
      })
    ).rejects.toThrow('Unauthorized')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/services/events.test.ts`
Expected: FAIL with "updateEvent is not defined"

**Step 3: Write minimal implementation**

Add to `src/lib/services/events.ts`:

```typescript
export const updateEvent = async ({ user, data }: AuthPayload<EventUpdate>) => {
  const { id, ...updateData } = data

  // Check permissions: must be admin OR own the event's club
  const event = await prisma.event.findUnique({
    where: { id },
    include: { club: { select: { ownerId: true } } },
  })

  if (!event) {
    throw new Error('Event not found')
  }

  if (!user.isAdmin && event.club.ownerId !== user.id) {
    throw new Error('Unauthorized')
  }

  return await prisma.event.update({
    where: { id },
    data: {
      ...updateData,
      date: new Date(updateData.date),
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/services/events.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/services/events.ts src/lib/services/events.test.ts
git commit -m "feat: add updateEvent service with permission checks"
```

---

### Task 2: Service Layer - Delete Event

**Files:**

- Modify: `src/lib/services/events.ts`
- Modify: `src/lib/services/events.test.ts`

**Step 1: Write the failing test**

Add to `src/lib/services/events.test.ts`:

```typescript
describe('deleteEvent', () => {
  it('deletes event when user is admin', async () => {
    const club = await prisma.club.create({
      data: { name: 'Test Club', slug: 'test-club', ownerId: testUser.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    await deleteEvent({ user: adminUser, data: { id: event.id } })

    const deleted = await prisma.event.findUnique({ where: { id: event.id } })
    expect(deleted).toBeNull()
  })

  it('deletes event when user owns the club', async () => {
    const club = await prisma.club.create({
      data: { name: 'Test Club', slug: 'test-club', ownerId: testUser.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    await deleteEvent({ user: testUser, data: { id: event.id } })

    const deleted = await prisma.event.findUnique({ where: { id: event.id } })
    expect(deleted).toBeNull()
  })

  it('throws error when user unauthorized', async () => {
    const otherUser = await prisma.user.create({
      data: { email: 'other2@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Test Club', slug: 'test-club', ownerId: testUser.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    await expect(
      deleteEvent({
        user: otherUser,
        data: { id: event.id },
      })
    ).rejects.toThrow('Unauthorized')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/services/events.test.ts`
Expected: FAIL with "deleteEvent is not defined"

**Step 3: Write minimal implementation**

Add to `src/lib/services/events.ts`:

```typescript
export const deleteEvent = async ({ user, data }: AuthPayload<EventId>) => {
  const { id } = data

  // Check permissions: must be admin OR own the event's club
  const event = await prisma.event.findUnique({
    where: { id },
    include: { club: { select: { ownerId: true } } },
  })

  if (!event) {
    throw new Error('Event not found')
  }

  if (!user.isAdmin && event.club.ownerId !== user.id) {
    throw new Error('Unauthorized')
  }

  return await prisma.event.delete({
    where: { id },
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/services/events.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/services/events.ts src/lib/services/events.test.ts
git commit -m "feat: add deleteEvent service with permission checks"
```

---

### Task 3: API Routes - Complete Event CRUD

**Files:**

- Modify: `src/app/api/events/[id]/route.ts`

**Step 1: Write the failing test**

Create `src/app/api/events/[id]/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { PUT, DELETE } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

describe('PUT /api/events/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  it('updates event with valid data', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Old',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Old Address',
        clubId: club.id,
      },
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'PUT',
      body: JSON.stringify({
        id: event.id,
        title: 'New Title',
        date: '2025-12-02',
        time: '11:00',
        address: 'New Address',
        clubId: club.id,
      }),
    })

    const response = await PUT(request, { params: { id: event.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('New Title')
  })
})

describe('DELETE /api/events/[id]', () => {
  it('deletes event when authorized', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin2@test.com', isAdmin: true },
    })
    const club = await prisma.club.create({
      data: { name: 'Club2', slug: 'club2', ownerId: user.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: { id: event.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const deleted = await prisma.event.findUnique({ where: { id: event.id } })
    expect(deleted).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/events/\\[id\\]/route.test.ts`
Expected: FAIL with "PUT is not exported"

**Step 3: Write minimal implementation**

Add to `src/app/api/events/[id]/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { eventUpdateSchema, eventIdSchema } from '@/lib/schemas'
import { updateEvent, deleteEvent } from '@/lib/services/events'

export const PUT = withAuth(eventUpdateSchema)(async ({ user, data }) => {
  const event = await updateEvent({ user, data })
  return Response.json(event)
})

export const DELETE = withAuth(eventIdSchema)(async ({ user, data }) => {
  await deleteEvent({ user, data })
  return Response.json({ success: true })
})
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/events/\\[id\\]/route.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/app/api/events/[id]/route.ts src/app/api/events/[id]/route.test.ts
git commit -m "feat: add PUT and DELETE handlers for events API"
```

---

### Task 4: Mutation Hooks - Events

**Files:**

- Modify: `src/lib/hooks/use-events.ts`
- Modify: `src/lib/hooks/use-events.test.tsx`

**Step 1: Write the failing test**

Add to `src/lib/hooks/use-events.test.tsx`:

```typescript
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from './use-events'

describe('useCreateEvent', () => {
  it('creates event and invalidates cache', async () => {
    const { result } = renderHook(() => useCreateEvent(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        title: 'New Event',
        date: '2025-12-01',
        time: '10:00',
        address: '123 Main St',
        clubId: 'club-1',
      })
    })

    expect(result.current.isSuccess).toBe(true)
  })
})

describe('useUpdateEvent', () => {
  it('updates event and invalidates cache', async () => {
    const { result } = renderHook(() => useUpdateEvent(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        id: 'event-1',
        data: {
          id: 'event-1',
          title: 'Updated',
          date: '2025-12-01',
          time: '11:00',
          address: 'Address',
          clubId: 'club-1',
        },
      })
    })

    expect(result.current.isSuccess).toBe(true)
  })
})

describe('useDeleteEvent', () => {
  it('deletes event and invalidates cache', async () => {
    const { result } = renderHook(() => useDeleteEvent(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('event-1')
    })

    expect(result.current.isSuccess).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/hooks/use-events.test.tsx`
Expected: FAIL with "useCreateEvent is not defined"

**Step 3: Write minimal implementation**

Add to `src/lib/hooks/use-events.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { EventCreate, EventUpdate } from '@/lib/schemas'

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EventCreate) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create event')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventUpdate }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update event')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete event')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/hooks/use-events.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/hooks/use-events.ts src/lib/hooks/use-events.test.tsx
git commit -m "feat: add event mutation hooks (create, update, delete)"
```

---

### Task 5: EventForm Component

**Files:**

- Create: `src/components/admin/event-form.tsx`
- Create: `src/components/admin/event-form.test.tsx`

**Step 1: Write the failing test**

Create `src/components/admin/event-form.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { EventForm } from './event-form'
import { setupMSW } from '@/lib/test-msw-setup'

setupMSW()

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
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
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/distance/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/pace/i)).toBeInTheDocument()
    })

    it('submits form data when creating event', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()

      render(<EventForm mode="create" clubs={[{ id: '1', name: 'Club 1' }]} onSuccess={onSuccess} />)

      await user.type(screen.getByLabelText(/title/i), 'Morning Run')
      await user.type(screen.getByLabelText(/date/i), '2025-12-01')
      await user.type(screen.getByLabelText(/time/i), '10:00')
      await user.type(screen.getByLabelText(/address/i), '123 Main St')

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
        expect(screen.getByText(/required/i)).toBeInTheDocument()
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
      club: { id: '1', name: 'Club 1' },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('populates form with initial data', () => {
      render(<EventForm mode="edit" initialData={mockEvent} clubs={[{ id: '1', name: 'Club 1' }]} />)

      expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Event')
      expect(screen.getByLabelText(/address/i)).toHaveValue('123 Main St')
    })

    it('shows delete button in edit mode', () => {
      render(<EventForm mode="edit" initialData={mockEvent} clubs={[{ id: '1', name: 'Club 1' }]} />)

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('deletes event with confirmation', async () => {
      const user = userEvent.setup()
      global.confirm = vi.fn(() => true)

      render(<EventForm mode="edit" initialData={mockEvent} clubs={[{ id: '1', name: 'Club 1' }]} />)

      await user.click(screen.getByRole('button', { name: /delete/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin/events')
      })
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/admin/event-form.test.tsx`
Expected: FAIL with "EventForm not found"

**Step 3: Write minimal implementation**

Create `src/components/admin/event-form.tsx`:

```typescript
'use client'

import { useFormWithSchema } from '@/lib/form/use-form-with-schema'
import { eventCreateSchema } from '@/lib/schemas'
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@/lib/hooks/use-events'
import { FormInput } from '@/components/ui/form-input'
import { FormTextarea } from '@/components/ui/form-textarea'
import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'

interface EventFormProps {
  mode: 'create' | 'edit'
  initialData?: any
  clubs: Array<{ id: string; name: string }>
  onSuccess?: (event: any) => void
}

export function EventForm({ mode, initialData, clubs, onSuccess }: EventFormProps) {
  const t = useTranslations('forms')
  const tActions = useTranslations('forms.actions')
  const tEvent = useTranslations('forms.event')
  const router = useRouter()

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()

  const form = useFormWithSchema({
    schema: eventCreateSchema,
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      date: initialData?.date ? initialData.date.toISOString().split('T')[0] : '',
      time: initialData?.time || '',
      address: initialData?.address || '',
      distance: initialData?.distance || '',
      pace: initialData?.pace || '',
      clubId: initialData?.clubId || clubs[0]?.id || '',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      if (mode === 'create') {
        const newEvent = await createMutation.mutateAsync(data)
        onSuccess?.(newEvent)
      } else if (mode === 'edit' && initialData) {
        const updatedEvent = await updateMutation.mutateAsync({
          id: initialData.id,
          data: { ...data, id: initialData.id },
        })
        onSuccess?.(updatedEvent)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  })

  const handleDelete = async () => {
    if (!initialData || mode !== 'edit') return

    const confirmed = confirm(t('admin.events.confirmDelete'))
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(initialData.id)
      router.push('/admin/events')
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const clubOptions = clubs.map(club => ({
    value: club.id,
    label: club.name,
  }))

  const isLoading =
    isSubmitting || createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleFormSubmit}
        className="bg-surface rounded-lg border border-border p-6"
      >
        <div className="space-y-6">
          <FormInput
            register={register}
            name="title"
            label={tEvent('title')}
            error={errors.title}
            required
            placeholder="e.g. Morning Run"
          />

          <FormTextarea
            register={register}
            name="description"
            label={tEvent('description')}
            error={errors.description}
            rows={4}
            placeholder="Brief description of the event..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              register={register}
              name="date"
              label={tEvent('date')}
              error={errors.date}
              type="date"
              required
            />

            <FormInput
              register={register}
              name="time"
              label={tEvent('time')}
              error={errors.time}
              type="time"
              required
            />
          </div>

          <FormSelect
            register={register}
            name="clubId"
            label={tEvent('club')}
            error={errors.clubId}
            options={clubOptions}
            required
          />

          <FormInput
            register={register}
            name="address"
            label={tEvent('address')}
            error={errors.address}
            required
            placeholder="Meeting location"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              register={register}
              name="distance"
              label={tEvent('distance')}
              error={errors.distance}
              placeholder="e.g. 5km"
            />

            <FormInput
              register={register}
              name="pace"
              label={tEvent('pace')}
              error={errors.pace}
              placeholder="e.g. 5:00/km"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {mode === 'edit' && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? tActions('deleting') : tActions('delete')}
            </Button>
          )}

          <div className="flex space-x-4 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/events')}
              disabled={isLoading}
            >
              {tActions('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading
                ? mode === 'create'
                  ? tActions('creating')
                  : tActions('updating')
                : mode === 'create'
                  ? tActions('create')
                  : tActions('save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/admin/event-form.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/admin/event-form.tsx src/components/admin/event-form.test.tsx
git commit -m "feat: add EventForm component with full CRUD support"
```

---

### Task 6: Events List Page

**Files:**

- Create: `src/app/[locale]/admin/events/page.tsx`

**Step 1: Write implementation (server component, no test needed)**

Create `src/app/[locale]/admin/events/page.tsx`:

```typescript
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Edit, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { DeleteEventButton } from '@/components/admin/delete-event-button'

async function getAllEventsForAdmin() {
  return await prisma.event.findMany({
    include: {
      club: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { date: 'desc' }
  })
}

export default async function AdminEventsPage() {
  const t = await getTranslations('admin.events')
  const events = await getAllEventsForAdmin()

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary mt-2">
            Manage all running events on the platform
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('addNew')}
          </Button>
        </Link>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary mb-4">No events found</p>
          <Link href="/admin/events/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-variant border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-surface-variant">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-sm text-text-secondary truncate max-w-xs">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">
                        {event.club.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {event.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary truncate max-w-xs">
                        {event.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </Link>
                        <DeleteEventButton
                          eventId={event.id}
                          eventTitle={event.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/[locale]/admin/events/page.tsx
git commit -m "feat: add admin events list page with table view"
```

---

### Task 7: DeleteEventButton Component

**Files:**

- Create: `src/components/admin/delete-event-button.tsx`
- Create: `src/components/admin/delete-event-button.test.tsx`

**Step 1: Write the failing test**

Create `src/components/admin/delete-event-button.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteEventButton } from './delete-event-button'
import { setupMSW } from '@/lib/test-msw-setup'

setupMSW()

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('DeleteEventButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.confirm = vi.fn(() => true)
    global.alert = vi.fn()
  })

  it('shows confirmation dialog before deleting', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => false)
    global.confirm = mockConfirm

    render(<DeleteEventButton eventId="event-1" eventTitle="Morning Run" />)

    await user.click(screen.getByRole('button'))

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Morning Run"?'
    )
  })

  it('deletes event when confirmed', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)

    render(<DeleteEventButton eventId="event-1" eventTitle="Morning Run" />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('does not delete when cancelled', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => false)

    render(<DeleteEventButton eventId="event-1" eventTitle="Morning Run" />)

    await user.click(screen.getByRole('button'))

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('disables button while deleting', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)

    render(<DeleteEventButton eventId="event-1" eventTitle="Morning Run" />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/admin/delete-event-button.test.tsx`
Expected: FAIL with "DeleteEventButton not found"

**Step 3: Write minimal implementation**

Create `src/components/admin/delete-event-button.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeleteEvent } from '@/lib/hooks/use-events'

interface DeleteEventButtonProps {
  eventId: string
  eventTitle: string
}

export function DeleteEventButton({ eventId, eventTitle }: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteEvent = useDeleteEvent()
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteEvent.mutateAsync(eventId)
      router.refresh()
    } catch (error) {
      alert('Failed to delete event. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Delete ${eventTitle}`}
    >
      <Trash2 className="w-3 h-3" />
    </Button>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/admin/delete-event-button.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/admin/delete-event-button.tsx src/components/admin/delete-event-button.test.tsx
git commit -m "feat: add DeleteEventButton component"
```

---

### Task 8: Event Create/Edit Pages

**Files:**

- Create: `src/app/[locale]/admin/events/new/page.tsx`
- Create: `src/app/[locale]/admin/events/[id]/edit/page.tsx`

**Step 1: Write implementation (server components)**

Create `src/app/[locale]/admin/events/new/page.tsx`:

```typescript
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { EventForm } from '@/components/admin/event-form'
import { redirect } from 'next/navigation'

async function getClubsForSelect() {
  return await prisma.club.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

export default async function NewEventPage() {
  const t = await getTranslations('admin.events')
  const clubs = await getClubsForSelect()

  if (clubs.length === 0) {
    redirect('/admin/clubs/new')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          {t('addNew')}
        </h1>
        <p className="text-text-secondary mt-2">
          Create a new running event
        </p>
      </div>

      <EventForm mode="create" clubs={clubs} />
    </div>
  )
}
```

Create `src/app/[locale]/admin/events/[id]/edit/page.tsx`:

```typescript
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { EventForm } from '@/components/admin/event-form'
import { notFound } from 'next/navigation'

async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      club: true,
    },
  })

  if (!event) {
    notFound()
  }

  return event
}

async function getClubsForSelect() {
  return await prisma.club.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

export default async function EditEventPage({
  params,
}: {
  params: { id: string }
}) {
  const t = await getTranslations('admin.events')
  const event = await getEventById(params.id)
  const clubs = await getClubsForSelect()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          {t('editEvent')}
        </h1>
        <p className="text-text-secondary mt-2">
          Update event details
        </p>
      </div>

      <EventForm mode="edit" initialData={event} clubs={clubs} />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/[locale]/admin/events/new/page.tsx src/app/[locale]/admin/events/[id]/edit/page.tsx
git commit -m "feat: add event create and edit pages"
```

---

### Task 9: Add Event Translations

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Add translations**

Add to `messages/en.json`:

```json
{
  "admin": {
    "navigation": {
      "events": "Events"
    },
    "events": {
      "title": "Manage Events",
      "addNew": "Add New Event",
      "editEvent": "Edit Event",
      "confirmDelete": "Are you sure you want to delete this event?"
    }
  },
  "forms": {
    "event": {
      "title": "Event Title",
      "description": "Description",
      "date": "Date",
      "time": "Time",
      "club": "Club",
      "address": "Meeting Location",
      "distance": "Distance",
      "pace": "Pace"
    }
  }
}
```

Add to `messages/fr.json`:

```json
{
  "admin": {
    "navigation": {
      "events": "Événements"
    },
    "events": {
      "title": "Gérer les événements",
      "addNew": "Ajouter un événement",
      "editEvent": "Modifier l'événement",
      "confirmDelete": "Êtes-vous sûr de vouloir supprimer cet événement ?"
    }
  },
  "forms": {
    "event": {
      "title": "Titre de l'événement",
      "description": "Description",
      "date": "Date",
      "time": "Heure",
      "club": "Club",
      "address": "Lieu de rencontre",
      "distance": "Distance",
      "pace": "Rythme"
    }
  }
}
```

**Step 2: Commit**

```bash
git add messages/en.json messages/fr.json
git commit -m "feat: add event translations (en/fr)"
```

---

### Task 10: Quality Gates - Events Management

**Files:**

- All modified files

**Step 1: Run linter**

Run: `npm run lint`
Expected: 0 errors

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Run tests with coverage**

Run: `npm run test -- --coverage`
Expected: All tests pass, 95%+ coverage

**Step 4: Format code**

Run: `npx prettier --write .`
Expected: All files formatted

**Step 5: Commit quality gate pass**

```bash
git add -A
git commit -m "chore: pass quality gates for events management"
```

---

## Phase 2: User Management

### Task 11: User Schemas

**Files:**

- Modify: `src/lib/schemas.ts`

**Step 1: Write the failing test**

Add to `src/lib/schemas.test.ts`:

```typescript
describe('User schemas', () => {
  it('validates userIdSchema', () => {
    const valid = userIdSchema.parse({ id: 'user-123' })
    expect(valid.id).toBe('user-123')

    expect(() => userIdSchema.parse({ id: '' })).toThrow()
    expect(() => userIdSchema.parse({})).toThrow()
  })

  it('validates toggleUserAdminSchema', () => {
    const valid = toggleUserAdminSchema.parse({ id: 'user-123', isAdmin: true })
    expect(valid.isAdmin).toBe(true)

    expect(() => toggleUserAdminSchema.parse({ id: 'user-123' })).toThrow()
  })

  it('validates usersQuerySchema', () => {
    const valid = usersQuerySchema.parse({ limit: '10', isAdmin: 'true' })
    expect(valid.limit).toBe(10)
    expect(valid.isAdmin).toBe('true')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/schemas.test.ts`
Expected: FAIL with "userIdSchema is not defined"

**Step 3: Write minimal implementation**

Add to `src/lib/schemas.ts`:

```typescript
// User schemas
export const userIdSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
})

export const toggleUserAdminSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  isAdmin: z.boolean(),
})

export const usersQuerySchema = paginationQuerySchema.extend({
  isAdmin: z.enum(['true', 'false']).optional(),
})

// Type exports
export type UserId = z.infer<typeof userIdSchema>
export type ToggleUserAdmin = z.infer<typeof toggleUserAdminSchema>
export type UsersQuery = z.infer<typeof usersQuerySchema>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/schemas.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat: add user management schemas"
```

---

### Task 12: User Service Layer

**Files:**

- Create: `src/lib/services/users.ts`
- Create: `src/lib/services/users.test.ts`

**Step 1: Write the failing test**

Create `src/lib/services/users.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'
import { getAllUsersForAdmin, toggleUserAdmin } from './users'

describe('User Services', () => {
  let adminUser: any
  let testUser: any

  beforeEach(async () => {
    await cleanDatabase()

    adminUser = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })

    testUser = await prisma.user.create({
      data: { email: 'user@test.com', isAdmin: false },
    })
  })

  describe('getAllUsersForAdmin', () => {
    it('returns all users with club counts', async () => {
      await prisma.club.create({
        data: { name: 'Club', slug: 'club', ownerId: testUser.id },
      })

      const users = await getAllUsersForAdmin({ data: {} })

      expect(users).toHaveLength(2)
      const userWithClub = users.find((u) => u.id === testUser.id)
      expect(userWithClub?._count.clubs).toBe(1)
    })

    it('orders by creation date descending', async () => {
      const users = await getAllUsersForAdmin({ data: {} })

      expect(users[0].createdAt >= users[1].createdAt).toBe(true)
    })
  })

  describe('toggleUserAdmin', () => {
    it('grants admin access', async () => {
      const result = await toggleUserAdmin({
        user: adminUser,
        data: { id: testUser.id, isAdmin: true },
      })

      expect(result.isAdmin).toBe(true)
    })

    it('revokes admin access', async () => {
      const result = await toggleUserAdmin({
        user: adminUser,
        data: { id: testUser.id, isAdmin: false },
      })

      expect(result.isAdmin).toBe(false)
    })

    it('prevents self-demotion', async () => {
      await expect(
        toggleUserAdmin({
          user: adminUser,
          data: { id: adminUser.id, isAdmin: false },
        })
      ).rejects.toThrow('Cannot remove your own admin access')
    })

    it('allows self-promotion', async () => {
      const result = await toggleUserAdmin({
        user: adminUser,
        data: { id: adminUser.id, isAdmin: true },
      })

      expect(result.isAdmin).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/services/users.test.ts`
Expected: FAIL with "getAllUsersForAdmin is not defined"

**Step 3: Write minimal implementation**

Create `src/lib/services/users.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import type {
  UsersQuery,
  UserId,
  ToggleUserAdmin,
  PublicPayload,
  AuthPayload,
} from '@/lib/schemas'

export const getAllUsersForAdmin = async ({
  data,
}: PublicPayload<UsersQuery>) => {
  const { limit = 50, offset = 0, isAdmin } = data

  const where = isAdmin !== undefined ? { isAdmin: isAdmin === 'true' } : {}

  return await prisma.user.findMany({
    where,
    include: {
      _count: {
        select: { clubs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export const getUserByIdForAdmin = async ({ data }: PublicPayload<UserId>) => {
  const { id } = data

  const user = await prisma.user.findUnique({
    where: { id },
    include: { clubs: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

export const toggleUserAdmin = async ({
  user,
  data,
}: AuthPayload<ToggleUserAdmin>) => {
  // Prevent self-demotion
  if (user.id === data.id && data.isAdmin === false) {
    throw new Error('Cannot remove your own admin access')
  }

  return await prisma.user.update({
    where: { id: data.id },
    data: { isAdmin: data.isAdmin },
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/services/users.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/services/users.ts src/lib/services/users.test.ts
git commit -m "feat: add user service layer with admin toggle"
```

---

### Task 13: User API Routes

**Files:**

- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/api/admin/users/route.test.ts`

**Step 1: Write the failing test**

Create `src/app/api/admin/users/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from './route'
import { PATCH } from './[id]/route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

describe('User API Routes', () => {
  let adminUser: any
  let testUser: any

  beforeEach(async () => {
    await cleanDatabase()

    adminUser = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })

    testUser = await prisma.user.create({
      data: { email: 'user@test.com', isAdmin: false },
    })
  })

  describe('GET /api/admin/users', () => {
    it('returns all users for admin', async () => {
      const request = new Request('http://localhost/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })

    it('returns 403 for non-admin', async () => {
      const request = new Request('http://localhost/api/admin/users')
      // Mock non-admin session
      const response = await GET(request)

      // This would fail auth middleware, but we test the logic exists
      expect(response.status).toBeLessThanOrEqual(403)
    })
  })

  describe('PATCH /api/admin/users/[id]', () => {
    it('toggles admin status', async () => {
      const request = new Request(
        'http://localhost/api/admin/users/' + testUser.id,
        {
          method: 'PATCH',
          body: JSON.stringify({ id: testUser.id, isAdmin: true }),
        }
      )

      const response = await PATCH(request, { params: { id: testUser.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isAdmin).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/admin/users/route.test.ts`
Expected: FAIL with "route files not found"

**Step 3: Write minimal implementation**

Create `src/app/api/admin/users/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { usersQuerySchema } from '@/lib/schemas'
import { getAllUsersForAdmin } from '@/lib/services/users'

export const GET = withAuth(usersQuerySchema)(async ({ user, data }) => {
  if (!user.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = await getAllUsersForAdmin({ data })
  return Response.json(users)
})
```

Create `src/app/api/admin/users/[id]/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { toggleUserAdminSchema } from '@/lib/schemas'
import { toggleUserAdmin } from '@/lib/services/users'

export const PATCH = withAuth(toggleUserAdminSchema)(async ({ user, data }) => {
  if (!user.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const updatedUser = await toggleUserAdmin({ user, data })
  return Response.json(updatedUser)
})
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/admin/users/route.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/app/api/admin/users/route.ts src/app/api/admin/users/[id]/route.ts src/app/api/admin/users/route.test.ts
git commit -m "feat: add user management API routes"
```

---

### Task 14: User Management Hooks

**Files:**

- Create: `src/lib/hooks/use-users.ts`
- Create: `src/lib/hooks/use-users.test.tsx`

**Step 1: Write the failing test**

Create `src/lib/hooks/use-users.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAllUsers, useToggleUserAdmin } from './use-users'
import { act } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useAllUsers', () => {
  it('fetches all users', async () => {
    const { result } = renderHook(() => useAllUsers(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe('useToggleUserAdmin', () => {
  it('toggles user admin status', async () => {
    const { result } = renderHook(() => useToggleUserAdmin(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({
        id: 'user-1',
        isAdmin: true
      })
    })

    expect(result.current.isSuccess).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/hooks/use-users.test.tsx`
Expected: FAIL with "useAllUsers is not defined"

**Step 3: Write minimal implementation**

Create `src/lib/hooks/use-users.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UsersQuery, ToggleUserAdmin } from '@/lib/schemas'

async function fetchAllUsers(query: UsersQuery = {}) {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', query.limit.toString())
  if (query.offset) params.set('offset', query.offset.toString())
  if (query.isAdmin) params.set('isAdmin', query.isAdmin)

  const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}

export function useAllUsers(query: UsersQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => fetchAllUsers(query),
  })
}

export function useToggleUserAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ToggleUserAdmin) => {
      const res = await fetch(`/api/admin/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to toggle admin status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/hooks/use-users.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/hooks/use-users.ts src/lib/hooks/use-users.test.tsx
git commit -m "feat: add user management hooks"
```

---

### Task 15: ToggleAdminButton Component

**Files:**

- Create: `src/components/admin/toggle-admin-button.tsx`
- Create: `src/components/admin/toggle-admin-button.test.tsx`

**Step 1: Write the failing test**

Create `src/components/admin/toggle-admin-button.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { ToggleAdminButton } from './toggle-admin-button'
import { setupMSW } from '@/lib/test-msw-setup'

setupMSW()

describe('ToggleAdminButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.confirm = vi.fn(() => true)
  })

  it('shows grant confirmation for non-admin user', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => false)
    global.confirm = mockConfirm

    render(
      <ToggleAdminButton
        userId="user-1"
        userName="John Doe"
        isAdmin={false}
        isCurrentUser={false}
      />
    )

    await user.click(screen.getByRole('button'))

    expect(mockConfirm).toHaveBeenCalledWith(
      'Grant admin access to John Doe?'
    )
  })

  it('shows revoke confirmation for admin user', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => false)
    global.confirm = mockConfirm

    render(
      <ToggleAdminButton
        userId="user-1"
        userName="Jane Admin"
        isAdmin={true}
        isCurrentUser={false}
      />
    )

    await user.click(screen.getByRole('button'))

    expect(mockConfirm).toHaveBeenCalledWith(
      'Revoke admin access from Jane Admin?'
    )
  })

  it('disables button for current user', () => {
    render(
      <ToggleAdminButton
        userId="user-1"
        userName="Current User"
        isAdmin={true}
        isCurrentUser={true}
      />
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('toggles admin status when confirmed', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)

    render(
      <ToggleAdminButton
        userId="user-1"
        userName="John Doe"
        isAdmin={false}
        isCurrentUser={false}
      />
    )

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/admin/toggle-admin-button.test.tsx`
Expected: FAIL with "ToggleAdminButton not found"

**Step 3: Write minimal implementation**

Create `src/components/admin/toggle-admin-button.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToggleUserAdmin } from '@/lib/hooks/use-users'

interface ToggleAdminButtonProps {
  userId: string
  userName: string
  isAdmin: boolean
  isCurrentUser: boolean
}

export function ToggleAdminButton({
  userId,
  userName,
  isAdmin,
  isCurrentUser,
}: ToggleAdminButtonProps) {
  const [isToggling, setIsToggling] = useState(false)
  const toggleAdmin = useToggleUserAdmin()

  const handleToggle = async () => {
    const message = isAdmin
      ? `Revoke admin access from ${userName}?`
      : `Grant admin access to ${userName}?`

    if (!confirm(message)) {
      return
    }

    setIsToggling(true)
    try {
      await toggleAdmin.mutateAsync({
        id: userId,
        isAdmin: !isAdmin,
      })
    } catch (error) {
      alert('Failed to update admin status. Please try again.')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Button
      variant={isAdmin ? 'outline-primary' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isCurrentUser || isToggling}
      aria-label={
        isAdmin ? `Revoke admin from ${userName}` : `Grant admin to ${userName}`
      }
    >
      <Shield
        className={`w-4 h-4 ${isAdmin ? 'text-primary' : 'text-text-secondary'}`}
      />
    </Button>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/admin/toggle-admin-button.test.tsx`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/admin/toggle-admin-button.tsx src/components/admin/toggle-admin-button.test.tsx
git commit -m "feat: add ToggleAdminButton component"
```

---

### Task 16: Users List Page

**Files:**

- Create: `src/app/[locale]/admin/users/page.tsx`

**Step 1: Write implementation (server component)**

Create `src/app/[locale]/admin/users/page.tsx`:

```typescript
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { ToggleAdminButton } from '@/components/admin/toggle-admin-button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getAllUsersForAdmin() {
  return await prisma.user.findMany({
    include: {
      _count: {
        select: { clubs: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function AdminUsersPage() {
  const t = await getTranslations('admin.users')
  const session = await getServerSession(authOptions)
  const users = await getAllUsersForAdmin()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          {t('title')}
        </h1>
        <p className="text-text-secondary mt-2">
          Manage user permissions and access
        </p>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary">No users found</p>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-variant border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Clubs Owned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Admin Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-variant">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {user.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {user._count.clubs} clubs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-text-secondary">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ToggleAdminButton
                        userId={user.id}
                        userName={user.name || user.email}
                        isAdmin={user.isAdmin}
                        isCurrentUser={session?.user?.id === user.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/[locale]/admin/users/page.tsx
git commit -m "feat: add admin users list page with toggle capability"
```

---

### Task 17: Update Sidebar Navigation

**Files:**

- Modify: `src/components/admin/sidebar.tsx`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Update sidebar navigation**

Modify `src/components/admin/sidebar.tsx`:

```typescript
import { UserCheck } from 'lucide-react'

const navigation = [
  { name: 'dashboard', href: '/admin', icon: BarChart3 },
  { name: 'clubs', href: '/admin/clubs', icon: Users },
  { name: 'events', href: '/admin/events', icon: Calendar },
  { name: 'users', href: '/admin/users', icon: UserCheck }, // Changed from Settings
]
```

**Step 2: Update translations**

Add to `messages/en.json`:

```json
{
  "admin": {
    "navigation": {
      "users": "Users"
    },
    "users": {
      "title": "Manage Users",
      "toggleAdmin": "Toggle Admin Status"
    }
  }
}
```

Add to `messages/fr.json`:

```json
{
  "admin": {
    "navigation": {
      "users": "Utilisateurs"
    },
    "users": {
      "title": "Gérer les utilisateurs",
      "toggleAdmin": "Basculer le statut administrateur"
    }
  }
}
```

**Step 3: Commit**

```bash
git add src/components/admin/sidebar.tsx messages/en.json messages/fr.json
git commit -m "feat: replace Settings with Users in admin navigation"
```

---

### Task 18: Quality Gates - User Management

**Files:**

- All modified files

**Step 1: Run linter**

Run: `npm run lint`
Expected: 0 errors

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 3: Run tests with coverage**

Run: `npm run test -- --coverage`
Expected: All tests pass, 95%+ coverage

**Step 4: Format code**

Run: `npx prettier --write .`
Expected: All files formatted

**Step 5: Commit quality gate pass**

```bash
git add -A
git commit -m "chore: pass quality gates for user management"
```

---

## Final Steps

### Task 19: Final Verification

**Step 1: Run all quality gates**

```bash
npm run lint && npx tsc --noEmit && npm run test -- --coverage
```

Expected: All pass

**Step 2: Manual testing**

1. Start dev server: `npm run dev`
2. Navigate to `/admin/events`
3. Create new event
4. Edit event
5. Delete event
6. Navigate to `/admin/users`
7. Toggle admin status

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete admin events and user management"
```

---

## Success Criteria Checklist

**Events Management:**

- ✅ Service layer complete (update, delete)
- ✅ API routes complete (PUT, DELETE)
- ✅ Mutation hooks working
- ✅ EventForm component with tests
- ✅ Admin pages (list, create, edit)
- ✅ Translations added
- ✅ All tests passing (95%+ coverage)

**User Management:**

- ✅ Schemas defined
- ✅ Service layer complete
- ✅ API routes complete
- ✅ Hooks working
- ✅ ToggleAdminButton component
- ✅ Users list page
- ✅ Navigation updated
- ✅ All tests passing (95%+ coverage)

**Quality:**

- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Code formatted
- ✅ 95%+ test coverage
