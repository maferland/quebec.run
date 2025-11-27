# Admin Events & User Management Design

**Date:** 2025-11-25
**Status:** Approved
**Implementation:** Sequential (Events → Users)

## Overview

Complete the admin dashboard by implementing Events management (full CRUD) and User management (list + admin toggle). Remove Settings page from navigation.

## Scope

### Phase 1: Events Management (Priority)

- Complete CRUD for events across all clubs
- Mirror club management patterns
- Full test coverage

### Phase 2: User Management

- List all users with admin toggle capability
- Admin-only permissions
- Replace Settings nav item

## Architecture

### Authorization Model

**Admins** (isAdmin=true):

- Manage all clubs
- Manage all events across all clubs
- Toggle user admin status
- Full platform control

**Club Owners** (owns Club):

- Manage their own clubs
- Create/edit/delete events for their clubs only
- No user management access

**Regular Users**:

- View public content only
- No admin access

### Database Schema

No changes required - single owner model maintained:

```prisma
model Club {
  ownerId String
  owner   User   @relation(fields: [ownerId], references: [id])
}

model User {
  isAdmin Boolean @default(false)
  clubs   Club[]
}
```

## Events Management

### Service Layer Extensions

**File:** `src/lib/services/events.ts`

Add missing operations:

```typescript
export const updateEvent = async ({ user, data }: AuthPayload<EventUpdate>) => {
  // Validate: admin OR owns the event's club
  const event = await prisma.event.findUnique({
    where: { id: data.id },
    include: { club: true },
  })
  if (!user.isAdmin && event.club.ownerId !== user.id) {
    throw new Error('Unauthorized')
  }
  return await prisma.event.update({ where: { id: data.id }, data })
}

export const deleteEvent = async ({ user, data }: AuthPayload<EventId>) => {
  // Same permission check as update
  return await prisma.event.delete({ where: { id: data.id } })
}

export const getAllEventsForAdmin = async ({
  data,
}: PublicPayload<EventsQuery>) => {
  // No date filtering - show all events including past
  // Include club details and counts
  return await prisma.event.findMany({
    include: { club: { select: { name: true, slug: true } } },
    orderBy: { date: 'desc' },
  })
}
```

### API Routes

**File:** `src/app/api/events/[id]/route.ts`

Complete CRUD:

```typescript
export const PUT = withAuth(eventUpdateSchema)(async ({ user, data }) => {
  const event = await updateEvent({ user, data })
  return Response.json(event)
})

export const DELETE = withAuth(eventIdSchema)(async ({ user, data }) => {
  await deleteEvent({ user, data })
  return Response.json({ success: true })
})
```

### Mutation Hooks

**File:** `src/lib/hooks/use-events.ts`

Add mutations matching club pattern:

```typescript
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })
}

export function useUpdateEvent() {
  /* similar pattern */
}
export function useDeleteEvent() {
  /* similar pattern */
}
```

### Admin Pages Structure

```
src/app/[locale]/admin/events/
├── page.tsx              # List all events
├── new/
│   └── page.tsx         # Create form
└── [id]/
    └── edit/
        └── page.tsx     # Edit form
```

### EventForm Component

**File:** `src/components/admin/event-form.tsx`

Reusable form with create/edit modes:

- **Fields:** title (required), description (textarea), date (date picker), time (HH:MM), clubId (select dropdown), address (required), distance, pace
- **Validation:** `useFormWithSchema` + `eventCreateSchema`
- **Actions:** Cancel (navigate back), Create/Save (submit), Delete (edit mode only)
- **Loading states:** Disable all buttons during mutations
- **Error handling:** Display validation errors inline

### Events List Page

**File:** `src/app/[locale]/admin/events/page.tsx`

Server component with comprehensive table:

- **Columns:** Event (title + description), Club (linked name), Date & Time, Location (address), Actions
- **Actions:** View (external link icon → public page), Edit (edit icon → edit page), Delete (trash icon → DeleteEventButton)
- **Features:** Filter by club dropdown, search by title/location, sort by date
- **Empty state:** "No events found" with "Create First Event" CTA

### Testing Coverage

- EventForm component tests: 40+ tests (create mode, edit mode, validation, delete, accessibility)
- Service layer tests: Permission checks, CRUD operations, error cases
- API route tests: All HTTP methods, auth validation, response formats
- Hook tests: Mutations, cache invalidation, error handling

## User Management

### Schemas

**File:** `src/lib/schemas.ts`

New schemas:

```typescript
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
```

### Service Layer

**File:** `src/lib/services/users.ts` (new)

Admin-only operations:

```typescript
export const getAllUsersForAdmin = async ({
  data,
}: PublicPayload<UsersQuery>) => {
  return await prisma.user.findMany({
    include: {
      _count: { select: { clubs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export const getUserByIdForAdmin = async ({ data }: PublicPayload<UserId>) => {
  return await prisma.user.findUnique({
    where: { id: data.id },
    include: { clubs: true },
  })
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

### API Routes

**Files:** `src/app/api/admin/users/route.ts` + `src/app/api/admin/users/[id]/route.ts`

Admin-only endpoints:

```typescript
// route.ts
export const GET = withAuth(usersQuerySchema)(async ({ user, data }) => {
  if (!user.isAdmin)
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  const users = await getAllUsersForAdmin({ data })
  return Response.json(users)
})

// [id]/route.ts
export const PATCH = withAuth(toggleUserAdminSchema)(async ({ user, data }) => {
  if (!user.isAdmin)
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  const updatedUser = await toggleUserAdmin({ user, data })
  return Response.json(updatedUser)
})
```

### Admin Page

**File:** `src/app/[locale]/admin/users/page.tsx`

Server component with user table:

- **Columns:** User (avatar + name + email), Clubs Owned (count badge), Admin Status (badge), Joined Date, Actions
- **Actions:** Toggle Admin (ToggleAdminButton component)
- **Features:** Filter (All / Admins Only / Non-Admins), search by name/email, sort by joined date
- **Empty state:** "No users found" (no create button - users created via auth)

### ToggleAdminButton Component

**File:** `src/components/admin/toggle-admin-button.tsx`

Client component for admin toggle:

- **Icon:** Shield with color based on status (blue=admin, gray=non-admin)
- **Confirmation:** "Grant admin access to [name]?" / "Revoke admin access from [name]?"
- **Disabled states:** Current logged-in user, during mutation
- **Mutation:** `useToggleUserAdmin` hook with cache invalidation

### Navigation Update

**File:** `src/components/admin/sidebar.tsx`

Replace Settings with Users:

```typescript
const navigation = [
  { name: 'dashboard', href: '/admin', icon: BarChart3 },
  { name: 'clubs', href: '/admin/clubs', icon: Users },
  { name: 'events', href: '/admin/events', icon: Calendar },
  { name: 'users', href: '/admin/users', icon: UserCheck }, // Changed
]
```

### Testing Coverage

- ToggleAdminButton component tests: 25+ tests (toggle action, confirmation, disabled states, permissions)
- Service layer tests: Permission checks, self-demotion prevention, CRUD operations
- API route tests: Admin-only access, response formats, error cases
- Hook tests: Mutations, cache invalidation

## Translations

### Required Additions

**Files:** `messages/en.json` + `messages/fr.json`

```json
{
  "admin": {
    "navigation": {
      "users": "Users"
    },
    "events": {
      "title": "Manage Events",
      "addNew": "Add New Event",
      "editEvent": "Edit Event",
      "confirmDelete": "Are you sure you want to delete this event?"
    },
    "users": {
      "title": "Manage Users",
      "toggleAdmin": "Toggle Admin Status",
      "confirmGrant": "Grant admin access to {name}?",
      "confirmRevoke": "Revoke admin access from {name}?",
      "cannotToggleSelf": "Cannot change your own admin status"
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

## Quality Gates

Before marking each phase complete:

1. Run linter: `npm run lint`
2. Run TypeScript check: `npx tsc --noEmit`
3. Run tests: `npm run test -- --coverage`
4. Verify 95% coverage threshold
5. Format code: `npx prettier --write .`

## Implementation Order

### Phase 1: Events Management

1. Service layer extensions (update, delete, getAllForAdmin)
2. API route completion (PUT, DELETE on [id])
3. Mutation hooks (create, update, delete)
4. EventForm component with tests
5. Admin pages (list, new, edit)
6. Translations
7. Quality gates

### Phase 2: User Management

1. Schemas (users query, toggle admin)
2. Service layer (new file)
3. API routes (new directory)
4. ToggleAdminButton component with tests
5. Users list page
6. Navigation update (remove Settings, add Users)
7. Translations
8. Quality gates

## Success Criteria

**Events Management:**

- ✅ All events visible to admins
- ✅ Full CRUD operations working
- ✅ Permission checks enforced
- ✅ 40+ tests passing with 95%+ coverage
- ✅ No TypeScript/ESLint errors

**User Management:**

- ✅ All users visible to admins
- ✅ Admin toggle working with confirmations
- ✅ Self-demotion prevented
- ✅ 25+ tests passing with 95%+ coverage
- ✅ Settings removed from navigation
