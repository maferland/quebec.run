# Staff Role Separation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate platform staff (global admin) from club owners (relational ownership) with intentional promotion UI requiring typed confirmation.

**Architecture:** Rename `User.isAdmin` → `User.isStaff` boolean for platform access. Club ownership stays FK-based. Staff promotion requires dropdown menu + modal with typed email confirmation to prevent accidental privilege escalation.

**Tech Stack:** Prisma migrations, NextAuth session callbacks, React Query mutations, shadcn/ui components (Dialog, DropdownMenu)

---

## Task 1: Database Migration

**Files:**

- Create: `prisma/migrations/YYYYMMDDHHMMSS_rename_isadmin_to_isstaff/migration.sql` (auto-generated)
- Modify: `prisma/schema.prisma:22`
- Modify: `prisma/seed.ts:48,69`

**Step 1: Update Prisma schema**

Modify `prisma/schema.prisma`:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  isStaff       Boolean   @default(false)  // renamed from isAdmin
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  clubs    Club[]
  consents UserConsent[]

  @@map("users")
}
```

**Step 2: Generate migration**

Run: `npx prisma migrate dev --name rename_isadmin_to_isstaff`
Expected: Migration file created in `prisma/migrations/`

**Step 3: Update seed file**

Modify `prisma/seed.ts`:

```typescript
// Around line 48 and 69 - update both admin user references
const admin = await prisma.user.upsert({
  where: { email: 'admin@example.com' },
  update: { isStaff: true }, // renamed
  create: {
    email: 'admin@example.com',
    name: 'Admin User',
    isStaff: true, // renamed
  },
})
```

**Step 4: Run seed**

Run: `npx prisma db seed`
Expected: Seed completes without errors

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ prisma/seed.ts
git commit -m "feat: rename isAdmin to isStaff in schema and seed"
```

---

## Task 2: Type Definitions

**Files:**

- Modify: `src/types/next-auth.d.ts:10,19`

**Step 1: Update NextAuth types**

Modify `src/types/next-auth.d.ts`:

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      isStaff: boolean // renamed from isAdmin
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    isStaff: boolean // renamed from isAdmin
  }
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Multiple type errors (will fix in next tasks)

**Step 3: Commit**

```bash
git add src/types/next-auth.d.ts
git commit -m "feat: update NextAuth types to use isStaff"
```

---

## Task 3: Auth Configuration

**Files:**

- Modify: `src/lib/auth.ts:84,86`

**Step 1: Update session callback**

Modify `src/lib/auth.ts` session callback:

```typescript
callbacks: {
  session: async ({ session, user }) => {
    if (session?.user) {
      session.user.id = user.id
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isStaff: true },  // renamed from isAdmin
      })
      session.user.isStaff = dbUser?.isStaff ?? false  // renamed from isAdmin
    }
    return session
  },
},
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Fewer type errors

**Step 3: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: update auth session callback to use isStaff"
```

---

## Task 4: Rename Middleware File

**Files:**

- Rename: `src/lib/admin-middleware.ts` → `src/lib/staff-middleware.ts`
- Modify: `src/lib/staff-middleware.ts:9,11,23,24,40,48,52`

**Step 1: Rename file**

Run: `git mv src/lib/admin-middleware.ts src/lib/staff-middleware.ts`

**Step 2: Update function names and checks**

Modify `src/lib/staff-middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

/**
 * Staff middleware to protect staff routes
 * Returns the staff user if authenticated and authorized, or throws if not
 */
export async function requireStaff() {
  // renamed from requireAdmin
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, isStaff: true }, // renamed
  })

  if (!user || !user.isStaff) {
    // renamed
    throw new Error('Staff access required') // updated message
  }

  return user
}

/**
 * API middleware for staff routes
 * Returns user or creates error response
 */
export async function withStaffAuth<T>( // renamed from withAdminAuth
  handler: (user: {
    id: string
    email: string
    name: string | null
    isStaff: boolean // renamed
  }) => Promise<T>
) {
  try {
    const user = await requireStaff() // renamed
    return await handler(user)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Staff access required') {
        // updated message
        return NextResponse.json(
          { error: 'Staff access required' }, // updated message
          { status: 403 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Check if current user is staff (for client-side usage)
 */
export async function isCurrentUserStaff(): Promise<boolean> {
  // renamed
  try {
    await requireStaff() // renamed
    return true
  } catch {
    return false
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/staff-middleware.ts
git commit -m "feat: rename admin-middleware to staff-middleware"
```

---

## Task 5: Update Admin Layout

**Files:**

- Modify: `src/app/[locale]/admin/layout.tsx:1,11`

**Step 1: Update import and usage**

Modify `src/app/[locale]/admin/layout.tsx`:

```typescript
import { requireStaff } from '@/lib/staff-middleware'  // updated import
import { AdminSidebar } from '@/components/admin/sidebar'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireStaff()  // renamed from requireAdmin
  } catch {
    redirect('/api/auth/signin')
  }

  return (
    <div className="flex h-screen bg-surface-variant">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Fewer type errors

**Step 3: Commit**

```bash
git add src/app/[locale]/admin/layout.tsx
git commit -m "feat: update admin layout to use requireStaff"
```

---

## Task 6: Update Schemas

**Files:**

- Modify: `src/lib/schemas.ts` (find toggleUserAdminSchema, around line 80)

**Step 1: Rename schema**

Modify `src/lib/schemas.ts`:

```typescript
// Find and rename toggleUserAdminSchema → toggleUserStaffSchema
export const toggleUserStaffSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  isStaff: z.boolean(), // renamed from isAdmin
})

export type ToggleUserStaff = z.infer<typeof toggleUserStaffSchema>
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Type errors in services/API routes using old schema name

**Step 3: Commit**

```bash
git add src/lib/schemas.ts
git commit -m "feat: rename toggleUserAdmin schema to toggleUserStaff"
```

---

## Task 7: Update Users Service

**Files:**

- Modify: `src/lib/services/users.ts:7,44,46,50,55,58`

**Step 1: Update all isAdmin → isStaff references**

Modify `src/lib/services/users.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import type {
  AuthPayload,
  PublicPayload,
  ToggleUserStaff, // renamed from ToggleUserAdmin
  UserId,
  UsersQuery,
} from '@/lib/schemas'
import { UnauthorizedError } from '@/lib/errors'

export const getAllUsersForAdmin = async ({
  data,
}: PublicPayload<UsersQuery>) => {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isStaff: true, // renamed from isAdmin
      createdAt: true,
      _count: { select: { clubs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export const getUserByIdForAdmin = async ({ data }: PublicPayload<UserId>) => {
  return await prisma.user.findUnique({
    where: { id: data.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isStaff: true, // renamed from isAdmin
      createdAt: true,
      clubs: { select: { id: true, name: true, slug: true } },
    },
  })
}

export const toggleUserStaff = async ({
  // renamed from toggleUserAdmin
  user,
  data,
}: AuthPayload<ToggleUserStaff>) => {
  // renamed type
  if (!user.isStaff) {
    // renamed from isAdmin
    throw new UnauthorizedError()
  }

  // Prevent self-demotion
  if (user.id === data.id && data.isStaff === false) {
    // renamed from isAdmin
    throw new Error('Cannot remove your own staff access') // updated message
  }

  return await prisma.user.update({
    where: { id: data.id },
    data: { isStaff: data.isStaff }, // renamed from isAdmin
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isStaff: true, // renamed from isAdmin
      createdAt: true,
    },
  })
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Fewer type errors

**Step 3: Commit**

```bash
git add src/lib/services/users.ts
git commit -m "feat: update users service to use isStaff"
```

---

## Task 8: Update Users Service Tests

**Files:**

- Modify: `src/lib/services/users.test.ts` (all isAdmin references)

**Step 1: Update test file**

Modify `src/lib/services/users.test.ts` - replace all `isAdmin` with `isStaff`:

Search and replace:

- `isAdmin: true` → `isStaff: true`
- `isAdmin: false` → `isStaff: false`
- `toggleUserAdmin` → `toggleUserStaff`
- `'admin access'` → `'staff access'` (in error messages)

**Step 2: Run tests**

Run: `npm test src/lib/services/users.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/services/users.test.ts
git commit -m "test: update users service tests to use isStaff"
```

---

## Task 9: Update Events Service

**Files:**

- Modify: `src/lib/services/events.ts` (all isAdmin references)

**Step 1: Update permission checks**

Modify `src/lib/services/events.ts` - replace all `user.isAdmin` with `user.isStaff`:

Search and replace throughout file:

- `!user.isAdmin` → `!user.isStaff`
- Every conditional checking admin access

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Fewer type errors

**Step 3: Commit**

```bash
git add src/lib/services/events.ts
git commit -m "feat: update events service to use isStaff"
```

---

## Task 10: Update Events Service Tests

**Files:**

- Modify: `src/lib/services/events.test.ts`

**Step 1: Update test file**

Modify `src/lib/services/events.test.ts` - replace all `isAdmin` with `isStaff`:

Search and replace:

- `isAdmin: true` → `isStaff: true`
- `isAdmin: false` → `isStaff: false`

**Step 2: Run tests**

Run: `npm test src/lib/services/events.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/services/events.test.ts
git commit -m "test: update events service tests to use isStaff"
```

---

## Task 11: Update Clubs Service

**Files:**

- Modify: `src/lib/services/clubs.ts`

**Step 1: Update permission checks**

Modify `src/lib/services/clubs.ts` - replace all `user.isAdmin` with `user.isStaff`

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Fewer type errors

**Step 3: Commit**

```bash
git add src/lib/services/clubs.ts
git commit -m "feat: update clubs service to use isStaff"
```

---

## Task 12: Update Clubs Service Tests

**Files:**

- Modify: `src/lib/services/clubs.test.ts`

**Step 1: Update test file**

Modify `src/lib/services/clubs.test.ts` - replace all `isAdmin` with `isStaff`

**Step 2: Run tests**

Run: `npm test src/lib/services/clubs.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/services/clubs.test.ts
git commit -m "test: update clubs service tests to use isStaff"
```

---

## Task 13: Update API Routes - Users

**Files:**

- Modify: `src/app/api/admin/users/route.ts`
- Modify: `src/app/api/admin/users/[id]/route.ts`

**Step 1: Update users route.ts**

Modify `src/app/api/admin/users/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { usersQuerySchema } from '@/lib/schemas'
import { getAllUsersForAdmin } from '@/lib/services/users'

export const GET = withAuth(usersQuerySchema)(async ({ user, data }) => {
  if (!user.isStaff) {
    // renamed from isAdmin
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = await getAllUsersForAdmin({ data })
  return Response.json(users)
})
```

**Step 2: Update users [id]/route.ts**

Modify `src/app/api/admin/users/[id]/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { toggleUserStaffSchema } from '@/lib/schemas' // renamed
import { toggleUserStaff } from '@/lib/services/users' // renamed

export const PATCH = withAuth(toggleUserStaffSchema)(async ({ user, data }) => {
  // renamed schema
  if (!user.isStaff) {
    // renamed from isAdmin
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const updatedUser = await toggleUserStaff({ user, data }) // renamed
  return Response.json(updatedUser)
})
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No type errors in these files

**Step 4: Commit**

```bash
git add src/app/api/admin/users/
git commit -m "feat: update users API routes to use isStaff"
```

---

## Task 14: Update API Tests - Users

**Files:**

- Modify: `src/app/api/admin/users/route.test.ts`

**Step 1: Update test file**

Modify `src/app/api/admin/users/route.test.ts` - replace all `isAdmin` with `isStaff`

**Step 2: Run tests**

Run: `npm test src/app/api/admin/users/route.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/app/api/admin/users/route.test.ts
git commit -m "test: update users API tests to use isStaff"
```

---

## Task 15: Update API Tests - Events

**Files:**

- Modify: `src/app/api/events/[id]/route.test.ts`

**Step 1: Update test file**

Modify `src/app/api/events/[id]/route.test.ts` - replace all `isAdmin` with `isStaff`

**Step 2: Run tests**

Run: `npm test src/app/api/events/[id]/route.test.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/app/api/events/[id]/route.test.ts
git commit -m "test: update events API tests to use isStaff"
```

---

## Task 16: Update Remaining Test Files

**Files:**

- Modify: `src/lib/test-seed.ts`
- Modify: `src/lib/test-msw.ts`
- Modify: `src/lib/storybook-utils.tsx`

**Step 1: Search and replace in test utilities**

Run global search/replace in these files:

- `isAdmin` → `isStaff`

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/test-seed.ts src/lib/test-msw.ts src/lib/storybook-utils.tsx
git commit -m "test: update test utilities to use isStaff"
```

---

## Task 17: Update Component Tests

**Files:**

- Modify: `src/components/admin/toggle-admin-button.test.tsx`
- Modify: `src/components/layout/header.test.tsx`
- Modify: `src/components/ui/mobile-menu.test.tsx`
- Modify: `src/app/[locale]/settings/privacy/page.test.tsx`
- Modify: `src/lib/hooks/use-users.test.tsx`

**Step 1: Search and replace in component tests**

Run global search/replace in these files:

- `isAdmin` → `isStaff`
- `toggleUserAdmin` → `toggleUserStaff`

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/ src/app/ src/lib/hooks/
git commit -m "test: update component tests to use isStaff"
```

---

## Task 18: Update Hooks

**Files:**

- Modify: `src/lib/hooks/use-users.ts`

**Step 1: Rename hook function**

Modify `src/lib/hooks/use-users.ts`:

```typescript
export function useToggleUserStaff() {
  // renamed from useToggleUserAdmin
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isStaff }: { id: string; isStaff: boolean }) => {
      // renamed from isAdmin
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isStaff }), // renamed from isAdmin
      })
      if (!res.ok) throw new Error('Failed to update user')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Type errors in components using old hook name

**Step 3: Commit**

```bash
git add src/lib/hooks/use-users.ts
git commit -m "feat: rename useToggleUserAdmin to useToggleUserStaff"
```

---

## Task 19: Update Remaining Components

**Files:**

- Modify: `src/components/admin/toggle-admin-button.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/ui/mobile-menu.tsx`
- Modify: `src/components/consent-banner-wrapper.tsx`
- Modify: `src/components/layout/auth-buttons.tsx`

**Step 1: Search and replace in components**

Run global search/replace:

- `session?.user?.isAdmin` → `session?.user?.isStaff`
- `user.isAdmin` → `user.isStaff`

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/
git commit -m "feat: update components to use isStaff"
```

---

## Task 20: Create StaffActionsMenu Component (Test)

**Files:**

- Create: `src/components/admin/staff-actions-menu.test.tsx`

**Step 1: Write failing test**

Create `src/components/admin/staff-actions-menu.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { StaffActionsMenu } from './staff-actions-menu'
import { describe, it, expect, vi } from 'vitest'

describe('StaffActionsMenu', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    isStaff: false,
  }

  it('renders menu trigger button', () => {
    render(
      <StaffActionsMenu
        user={mockUser}
        currentUserId="current-user"
        onToggleStaff={vi.fn()}
      />
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows "Make Staff" option for non-staff user', async () => {
    const user = userEvent.setup()
    render(
      <StaffActionsMenu
        user={mockUser}
        currentUserId="current-user"
        onToggleStaff={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Make Staff')).toBeInTheDocument()
  })

  it('shows "Remove Staff" option for staff user', async () => {
    const user = userEvent.setup()
    const staffUser = { ...mockUser, isStaff: true }

    render(
      <StaffActionsMenu
        user={staffUser}
        currentUserId="current-user"
        onToggleStaff={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Remove Staff')).toBeInTheDocument()
  })

  it('disables "Remove Staff" for current user', async () => {
    const user = userEvent.setup()
    const staffUser = { ...mockUser, isStaff: true }

    render(
      <StaffActionsMenu
        user={staffUser}
        currentUserId={mockUser.id}
        onToggleStaff={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))
    const removeButton = screen.getByText('Remove Staff')
    expect(removeButton).toHaveAttribute('data-disabled', 'true')
  })

  it('calls onToggleStaff with correct params when making staff', async () => {
    const user = userEvent.setup()
    const onToggleStaff = vi.fn()

    render(
      <StaffActionsMenu
        user={mockUser}
        currentUserId="current-user"
        onToggleStaff={onToggleStaff}
      />
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Make Staff'))

    expect(onToggleStaff).toHaveBeenCalledWith(mockUser.id, true)
  })

  it('calls onToggleStaff with correct params when removing staff', async () => {
    const user = userEvent.setup()
    const onToggleStaff = vi.fn()
    const staffUser = { ...mockUser, isStaff: true }

    render(
      <StaffActionsMenu
        user={staffUser}
        currentUserId="current-user"
        onToggleStaff={onToggleStaff}
      />
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Remove Staff'))

    expect(onToggleStaff).toHaveBeenCalledWith(mockUser.id, false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/components/admin/staff-actions-menu.test.tsx`
Expected: FAIL - "StaffActionsMenu is not defined"

**Step 3: Commit**

```bash
git add src/components/admin/staff-actions-menu.test.tsx
git commit -m "test: add failing tests for StaffActionsMenu"
```

---

## Task 21: Create StaffActionsMenu Component (Implementation)

**Files:**

- Create: `src/components/admin/staff-actions-menu.tsx`

**Step 1: Implement component**

Create `src/components/admin/staff-actions-menu.tsx`:

```typescript
'use client'

import { MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type StaffActionsMenuProps = {
  user: {
    id: string
    name: string | null
    email: string
    isStaff: boolean
  }
  currentUserId: string
  onToggleStaff: (userId: string, makeStaff: boolean) => void
}

export function StaffActionsMenu({
  user,
  currentUserId,
  onToggleStaff,
}: StaffActionsMenuProps) {
  const isCurrentUser = user.id === currentUserId

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Staff actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.isStaff ? (
          <DropdownMenuItem
            disabled={isCurrentUser}
            className="text-error"
            onClick={() => onToggleStaff(user.id, false)}
          >
            Remove Staff
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onToggleStaff(user.id, true)}>
            Make Staff
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Step 2: Run tests**

Run: `npm test src/components/admin/staff-actions-menu.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/admin/staff-actions-menu.tsx
git commit -m "feat: implement StaffActionsMenu component"
```

---

## Task 22: Create ConfirmStaffDialog Component (Test)

**Files:**

- Create: `src/components/admin/confirm-staff-dialog.test.tsx`

**Step 1: Write failing test**

Create `src/components/admin/confirm-staff-dialog.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ConfirmStaffDialog } from './confirm-staff-dialog'
import { describe, it, expect, vi } from 'vitest'

describe('ConfirmStaffDialog', () => {
  const mockUser = {
    email: 'test@example.com',
    name: 'Test User',
  }

  it('renders dialog when open', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows promotion title for promote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(screen.getByText(/Make Test User platform staff/i)).toBeInTheDocument()
  })

  it('shows demotion title for demote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="demote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(screen.getByText(/Remove Test User from staff/i)).toBeInTheDocument()
  })

  it('shows staff privileges for promote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(screen.getByText(/Staff members can:/i)).toBeInTheDocument()
    expect(screen.getByText(/Manage all clubs and events/i)).toBeInTheDocument()
  })

  it('requires typing email to enable confirm button', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    const confirmButton = screen.getByRole('button', { name: /Make Staff/i })
    expect(confirmButton).toBeDisabled()

    const input = screen.getByPlaceholderText(mockUser.email)
    await user.type(input, mockUser.email)

    expect(confirmButton).toBeEnabled()
  })

  it('calls onConfirm when confirm button clicked with valid input', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={onConfirm}
        loading={false}
      />
    )

    const input = screen.getByPlaceholderText(mockUser.email)
    await user.type(input, mockUser.email)

    const confirmButton = screen.getByRole('button', { name: /Make Staff/i })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalled()
  })

  it('disables inputs during loading', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={true}
      />
    )

    const input = screen.getByPlaceholderText(mockUser.email)
    expect(input).toBeDisabled()

    const confirmButton = screen.getByRole('button', { name: /Processing/i })
    expect(confirmButton).toBeDisabled()
  })

  it('shows destructive styling for demote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="demote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    const confirmButton = screen.getByRole('button', { name: /Remove Staff/i })
    expect(confirmButton).toHaveClass('destructive')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/components/admin/confirm-staff-dialog.test.tsx`
Expected: FAIL - "ConfirmStaffDialog is not defined"

**Step 3: Commit**

```bash
git add src/components/admin/confirm-staff-dialog.test.tsx
git commit -m "test: add failing tests for ConfirmStaffDialog"
```

---

## Task 23: Create ConfirmStaffDialog Component (Implementation)

**Files:**

- Create: `src/components/admin/confirm-staff-dialog.tsx`

**Step 1: Implement component**

Create `src/components/admin/confirm-staff-dialog.tsx`:

```typescript
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ConfirmStaffDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { email: string; name: string | null }
  action: 'promote' | 'demote'
  onConfirm: () => void
  loading: boolean
}

export function ConfirmStaffDialog({
  open,
  onOpenChange,
  user,
  action,
  onConfirm,
  loading,
}: ConfirmStaffDialogProps) {
  const [typed, setTyped] = useState('')
  const confirmPhrase = user.email
  const isValid = typed === confirmPhrase

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'promote' ? 'Make' : 'Remove'} {user.name || user.email}{' '}
            {action === 'promote' ? 'platform staff' : 'from staff'}?
          </DialogTitle>
          <DialogDescription>
            {action === 'promote' ? (
              <>
                <p className="mb-2">Staff members can:</p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  <li>Manage all clubs and events</li>
                  <li>View and modify all user accounts</li>
                  <li>Grant or revoke staff access</li>
                </ul>
              </>
            ) : (
              <p className="mb-4 text-error">
                This user will lose all platform administrative privileges.
              </p>
            )}
            <p className="font-medium mb-2">
              Type &quot;{confirmPhrase}&quot; to confirm:
            </p>
          </DialogDescription>
        </DialogHeader>

        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmPhrase}
          autoComplete="off"
          disabled={loading}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={action === 'demote' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={!isValid || loading}
            className={action === 'demote' ? 'destructive' : ''}
          >
            {loading
              ? 'Processing...'
              : action === 'promote'
                ? 'Make Staff'
                : 'Remove Staff'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Run tests**

Run: `npm test src/components/admin/confirm-staff-dialog.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/admin/confirm-staff-dialog.tsx
git commit -m "feat: implement ConfirmStaffDialog component"
```

---

## Task 24: Update Users Page (Remove Old Component)

**Files:**

- Modify: `src/app/[locale]/admin/users/page.tsx`

**Step 1: Remove ToggleAdminButton import and usage**

Modify `src/app/[locale]/admin/users/page.tsx`:

Remove:

```typescript
import { ToggleAdminButton } from '@/components/admin/toggle-admin-button'
```

Replace `<ToggleAdminButton ... />` usage with placeholder:

```typescript
{
  /* TODO: Add StaffActionsMenu */
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/[locale]/admin/users/page.tsx
git commit -m "refactor: remove ToggleAdminButton from users page"
```

---

## Task 25: Update Users Page (Add New Components)

**Files:**

- Modify: `src/app/[locale]/admin/users/page.tsx`

**Step 1: Convert to client component and add state**

Modify `src/app/[locale]/admin/users/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { StaffActionsMenu } from '@/components/admin/staff-actions-menu'
import { ConfirmStaffDialog } from '@/components/admin/confirm-staff-dialog'
import { useToggleUserStaff } from '@/lib/hooks/use-users'

// ... existing imports and types

export default function UsersPage() {
  const { data: session } = useSession()
  const [dialogState, setDialogState] = useState<{
    open: boolean
    user: User | null
    action: 'promote' | 'demote'
  }>({
    open: false,
    user: null,
    action: 'promote',
  })

  const toggleStaff = useToggleUserStaff()

  const handleToggleClick = (user: User, makeStaff: boolean) => {
    setDialogState({
      open: true,
      user,
      action: makeStaff ? 'promote' : 'demote',
    })
  }

  const handleConfirm = () => {
    if (!dialogState.user) return

    toggleStaff.mutate(
      {
        id: dialogState.user.id,
        isStaff: dialogState.action === 'promote',
      },
      {
        onSuccess: () => {
          setDialogState({ open: false, user: null, action: 'promote' })
        },
      }
    )
  }

  // ... existing page rendering

  // In the table Actions column:
  return (
    <>
      {/* ... existing table structure ... */}
      <StaffActionsMenu
        user={user}
        currentUserId={session?.user?.id ?? ''}
        onToggleStaff={handleToggleClick}
      />

      {dialogState.user && (
        <ConfirmStaffDialog
          open={dialogState.open}
          onOpenChange={(open) =>
            !open && setDialogState({ open: false, user: null, action: 'promote' })
          }
          user={dialogState.user}
          action={dialogState.action}
          onConfirm={handleConfirm}
          loading={toggleStaff.isPending}
        />
      )}
    </>
  )
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/[locale]/admin/users/page.tsx
git commit -m "feat: integrate StaffActionsMenu and ConfirmStaffDialog in users page"
```

---

## Task 26: Delete Old ToggleAdminButton Component

**Files:**

- Delete: `src/components/admin/toggle-admin-button.tsx`
- Delete: `src/components/admin/toggle-admin-button.test.tsx`

**Step 1: Remove files**

Run:

```bash
git rm src/components/admin/toggle-admin-button.tsx
git rm src/components/admin/toggle-admin-button.test.tsx
```

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git commit -m "refactor: remove old ToggleAdminButton component"
```

---

## Task 27: Add Translations (English)

**Files:**

- Modify: `messages/en.json`

**Step 1: Add staff-related translations**

Modify `messages/en.json`:

```json
{
  "admin": {
    "navigation": {
      "users": "Users"
    },
    "users": {
      "makeStaff": "Make Staff",
      "removeStaff": "Remove Staff",
      "confirmMakeStaff": "Make {name} platform staff?",
      "confirmRemoveStaff": "Remove {name} from staff?",
      "staffPrivileges": "Staff members can:",
      "privilegeManageClubs": "Manage all clubs and events",
      "privilegeManageUsers": "View and modify all user accounts",
      "privilegeGrantStaff": "Grant or revoke staff access",
      "removalWarning": "This user will lose all platform administrative privileges.",
      "typeToConfirm": "Type \"{phrase}\" to confirm:",
      "cannotRemoveSelf": "Cannot remove your own staff access"
    }
  }
}
```

**Step 2: Commit**

```bash
git add messages/en.json
git commit -m "i18n: add English translations for staff role"
```

---

## Task 28: Add Translations (French)

**Files:**

- Modify: `messages/fr.json`

**Step 1: Add French translations**

Modify `messages/fr.json`:

```json
{
  "admin": {
    "navigation": {
      "users": "Utilisateurs"
    },
    "users": {
      "makeStaff": "Rendre Staff",
      "removeStaff": "Retirer Staff",
      "confirmMakeStaff": "Rendre {name} staff de la plateforme?",
      "confirmRemoveStaff": "Retirer {name} du staff?",
      "staffPrivileges": "Les membres du staff peuvent:",
      "privilegeManageClubs": "Gérer tous les clubs et événements",
      "privilegeManageUsers": "Voir et modifier tous les comptes utilisateurs",
      "privilegeGrantStaff": "Accorder ou révoquer l'accès staff",
      "removalWarning": "Cet utilisateur perdra tous les privilèges administratifs de la plateforme.",
      "typeToConfirm": "Tapez \"{phrase}\" pour confirmer:",
      "cannotRemoveSelf": "Impossible de retirer votre propre accès staff"
    }
  }
}
```

**Step 2: Commit**

```bash
git add messages/fr.json
git commit -m "i18n: add French translations for staff role"
```

---

## Task 29: Run Quality Gates

**Files:**

- None (verification only)

**Step 1: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run all tests with coverage**

Run: `npm test -- --coverage`
Expected: All tests pass, coverage ≥95%

**Step 4: Run formatter**

Run: `npx prettier --write .`
Expected: Files formatted

**Step 5: Commit formatting changes if any**

```bash
git add -A
git commit -m "style: format code with prettier"
```

---

## Task 30: Final Verification

**Files:**

- None (manual verification)

**Step 1: Verify migration applied**

Run: `npx prisma migrate status`
Expected: "Database schema is up to date!"

**Step 2: Verify all isAdmin references replaced**

Run: `grep -r "isAdmin" src/ --exclude-dir=node_modules`
Expected: No results (or only in comments/strings)

**Step 3: Final test run**

Run: `npm test`
Expected: All 598+ tests pass

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete staff role separation implementation"
```

---

## Success Criteria

- ✅ Schema migration applied (`User.isStaff`)
- ✅ All type definitions updated
- ✅ All services use `isStaff` permission checks
- ✅ All API routes updated
- ✅ StaffActionsMenu component with dropdown
- ✅ ConfirmStaffDialog with typed confirmation
- ✅ Users page integrated with new components
- ✅ All translations added (EN + FR)
- ✅ All tests passing (598+)
- ✅ 95%+ test coverage maintained
- ✅ No TypeScript/lint errors
- ✅ Code formatted with Prettier
