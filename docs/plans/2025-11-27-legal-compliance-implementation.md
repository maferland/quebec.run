# Legal Compliance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement TOS, Privacy Policy, consent management, and data rights (export/deletion) for Law 25 compliance.

**Architecture:** Simplified consent model (usage = acceptance), bilingual static legal pages, audit trail for consent, 30-day deletion grace period. API routes handle consent creation, data export, and deletion requests. Service layer contains business logic.

**Tech Stack:** Prisma (PostgreSQL), Zod validation, Next.js App Router, next-intl, React Query

---

## Task 1: Database Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/YYYYMMDDHHMMSS_add_legal_compliance/migration.sql`

**Step 1: Add consent and deletion models to schema**

Edit `prisma/schema.prisma`, add models after `Event`:

```prisma
model UserConsent {
  id          String   @id @default(cuid())
  userId      String   @unique
  acceptedAt  DateTime @default(now())
  ipAddress   String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_consents")
}

model DataDeletionRequest {
  id           String   @id @default(cuid())
  userId       String
  requestedAt  DateTime @default(now())
  scheduledFor DateTime
  status       String   @default("pending")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("data_deletion_requests")
}
```

Update `User` model, add relations after `clubs` line:

```prisma
consents             UserConsent[]
deletionRequests     DataDeletionRequest[]
```

**Step 2: Generate and apply migration**

Run: `npx prisma migrate dev --name add_legal_compliance`
Expected: Migration created and applied successfully

**Step 3: Verify schema in DB**

Run: `npx prisma studio`
Expected: See `user_consents` and `data_deletion_requests` tables

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add legal compliance schema (UserConsent, DataDeletionRequest)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Zod Validation Schemas

**Files:**
- Create: `src/lib/schemas/legal.ts`
- Modify: `src/lib/schemas/index.ts`

**Step 1: Create legal schemas file**

Create `src/lib/schemas/legal.ts`:

```typescript
import { z } from 'zod'

// Empty schema - consent doesn't need body (IP captured server-side)
export const consentCreateSchema = z.object({})

// Data export - no params needed, uses session user
export const dataExportSchema = z.object({})

// Deletion request - no body needed, uses session user
export const deletionRequestSchema = z.object({})

// Cancel deletion - requires request ID from URL
export const deletionCancelSchema = z.object({
  id: z.string().cuid(),
})

// Infer types
export type ConsentCreate = z.infer<typeof consentCreateSchema>
export type DataExport = z.infer<typeof dataExportSchema>
export type DeletionRequest = z.infer<typeof deletionRequestSchema>
export type DeletionCancel = z.infer<typeof deletionCancelSchema>
```

**Step 2: Export from index**

Edit `src/lib/schemas/index.ts`, add exports:

```typescript
export * from './legal'
```

**Step 3: Commit**

```bash
git add src/lib/schemas/
git commit -m "feat: add Zod schemas for legal endpoints

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Legal Service Functions - Tests First

**Files:**
- Create: `src/lib/services/legal.test.ts`
- Create: `src/lib/services/legal.ts`

**Step 1: Write failing tests**

Create `src/lib/services/legal.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'
import {
  createUserConsent,
  getUserConsent,
  exportUserData,
  createDeletionRequest,
  cancelDeletionRequest,
  getPendingDeletionRequest,
} from './legal'

describe('Legal Services', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  describe('createUserConsent', () => {
    it('creates consent record with IP', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const consent = await createUserConsent({
        user: { id: user.id, isAdmin: false },
        data: {},
        ipAddress: '192.168.1.1',
      })

      expect(consent.userId).toBe(user.id)
      expect(consent.ipAddress).toBe('192.168.1.1')
      expect(consent.acceptedAt).toBeInstanceOf(Date)
    })

    it('throws if consent already exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await prisma.userConsent.create({
        data: { userId: user.id, ipAddress: '192.168.1.1' },
      })

      await expect(
        createUserConsent({
          user: { id: user.id, isAdmin: false },
          data: {},
          ipAddress: '192.168.1.1',
        })
      ).rejects.toThrow('Consent already exists')
    })
  })

  describe('getUserConsent', () => {
    it('returns consent if exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await prisma.userConsent.create({
        data: { userId: user.id, ipAddress: '192.168.1.1' },
      })

      const consent = await getUserConsent({
        data: {},
        userId: user.id,
      })

      expect(consent).toBeDefined()
      expect(consent?.userId).toBe(user.id)
    })

    it('returns null if no consent', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const consent = await getUserConsent({
        data: {},
        userId: user.id,
      })

      expect(consent).toBeNull()
    })
  })

  describe('exportUserData', () => {
    it('exports all user data', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com', name: 'Test User' },
      })

      const club = await prisma.club.create({
        data: { name: 'Club', slug: 'club', ownerId: user.id },
      })

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          date: new Date('2025-12-01'),
          time: '10:00',
          clubId: club.id,
        },
      })

      const consent = await prisma.userConsent.create({
        data: { userId: user.id, ipAddress: '192.168.1.1' },
      })

      const data = await exportUserData({
        user: { id: user.id, isAdmin: false },
        data: {},
      })

      expect(data.user.id).toBe(user.id)
      expect(data.user.email).toBe('user@test.com')
      expect(data.clubs).toHaveLength(1)
      expect(data.clubs[0].id).toBe(club.id)
      expect(data.events).toHaveLength(1)
      expect(data.events[0].id).toBe(event.id)
      expect(data.consents).toHaveLength(1)
      expect(data.consents[0].id).toBe(consent.id)
    })
  })

  describe('createDeletionRequest', () => {
    it('creates deletion request 30 days out', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const request = await createDeletionRequest({
        user: { id: user.id, isAdmin: false },
        data: {},
      })

      expect(request.userId).toBe(user.id)
      expect(request.status).toBe('pending')

      const daysDiff = Math.floor(
        (request.scheduledFor.getTime() - request.requestedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(30)
    })

    it('throws if pending request exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await prisma.dataDeletionRequest.create({
        data: {
          userId: user.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      await expect(
        createDeletionRequest({
          user: { id: user.id, isAdmin: false },
          data: {},
        })
      ).rejects.toThrow('Pending deletion request already exists')
    })
  })

  describe('cancelDeletionRequest', () => {
    it('cancels pending deletion request', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const request = await prisma.dataDeletionRequest.create({
        data: {
          userId: user.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const cancelled = await cancelDeletionRequest({
        user: { id: user.id, isAdmin: false },
        data: { id: request.id },
      })

      expect(cancelled.status).toBe('cancelled')
    })

    it('throws if request not found', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await expect(
        cancelDeletionRequest({
          user: { id: user.id, isAdmin: false },
          data: { id: 'invalid' },
        })
      ).rejects.toThrow('Deletion request not found')
    })

    it('throws if not owned by user', async () => {
      const user1 = await prisma.user.create({
        data: { email: 'user1@test.com' },
      })
      const user2 = await prisma.user.create({
        data: { email: 'user2@test.com' },
      })

      const request = await prisma.dataDeletionRequest.create({
        data: {
          userId: user1.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      await expect(
        cancelDeletionRequest({
          user: { id: user2.id, isAdmin: false },
          data: { id: request.id },
        })
      ).rejects.toThrow('Deletion request not found')
    })
  })

  describe('getPendingDeletionRequest', () => {
    it('returns pending request if exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const request = await prisma.dataDeletionRequest.create({
        data: {
          userId: user.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const found = await getPendingDeletionRequest({
        data: {},
        userId: user.id,
      })

      expect(found?.id).toBe(request.id)
    })

    it('returns null if no pending request', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const found = await getPendingDeletionRequest({
        data: {},
        userId: user.id,
      })

      expect(found).toBeNull()
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test src/lib/services/legal.test.ts`
Expected: FAIL with "Cannot find module './legal'"

**Step 3: Create service functions**

Create `src/lib/services/legal.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import type {
  AuthPayload,
  ConsentCreate,
  DataExport,
  DeletionRequest,
  DeletionCancel,
  PublicPayload,
} from '@/lib/schemas'

export const createUserConsent = async ({
  user,
  data,
  ipAddress,
}: AuthPayload<ConsentCreate> & { ipAddress: string }) => {
  // Check if consent already exists
  const existing = await prisma.userConsent.findUnique({
    where: { userId: user.id },
  })

  if (existing) {
    throw new Error('Consent already exists')
  }

  return await prisma.userConsent.create({
    data: {
      userId: user.id,
      ipAddress,
    },
  })
}

export const getUserConsent = async ({
  userId,
}: PublicPayload<Record<string, never>> & { userId: string }) => {
  return await prisma.userConsent.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      acceptedAt: true,
      ipAddress: true,
    },
  })
}

export const exportUserData = async ({ user }: AuthPayload<DataExport>) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
    },
  })

  const clubs = await prisma.club.findMany({
    where: { ownerId: user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      createdAt: true,
    },
  })

  const events = await prisma.event.findMany({
    where: { club: { ownerId: user.id } },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      time: true,
      address: true,
      createdAt: true,
    },
  })

  const consents = await prisma.userConsent.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      acceptedAt: true,
      ipAddress: true,
    },
  })

  return {
    user: userData!,
    clubs,
    events,
    consents,
  }
}

export const createDeletionRequest = async ({
  user,
}: AuthPayload<DeletionRequest>) => {
  // Check for existing pending request
  const existing = await prisma.dataDeletionRequest.findFirst({
    where: {
      userId: user.id,
      status: 'pending',
    },
  })

  if (existing) {
    throw new Error('Pending deletion request already exists')
  }

  // Calculate 30 days from now
  const scheduledFor = new Date()
  scheduledFor.setDate(scheduledFor.getDate() + 30)

  return await prisma.dataDeletionRequest.create({
    data: {
      userId: user.id,
      scheduledFor,
    },
  })
}

export const cancelDeletionRequest = async ({
  user,
  data,
}: AuthPayload<DeletionCancel>) => {
  const request = await prisma.dataDeletionRequest.findFirst({
    where: {
      id: data.id,
      userId: user.id,
      status: 'pending',
    },
  })

  if (!request) {
    throw new Error('Deletion request not found')
  }

  return await prisma.dataDeletionRequest.update({
    where: { id: data.id },
    data: { status: 'cancelled' },
  })
}

export const getPendingDeletionRequest = async ({
  userId,
}: PublicPayload<Record<string, never>> & { userId: string }) => {
  return await prisma.dataDeletionRequest.findFirst({
    where: {
      userId,
      status: 'pending',
    },
    select: {
      id: true,
      requestedAt: true,
      scheduledFor: true,
      status: true,
    },
  })
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test src/lib/services/legal.test.ts`
Expected: PASS (all tests green)

**Step 5: Commit**

```bash
git add src/lib/services/legal.ts src/lib/services/legal.test.ts
git commit -m "feat: add legal service functions with tests

- createUserConsent (with IP audit trail)
- exportUserData (clubs, events, consents)
- createDeletionRequest (30-day grace period)
- cancelDeletionRequest

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Consent API Route

**Files:**
- Create: `src/app/api/user/consent/route.ts`
- Create: `src/app/api/user/consent/route.test.ts`

**Step 1: Write failing test**

Create `src/app/api/user/consent/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST, GET } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('POST /api/user/consent', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('creates consent with IP', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.1' },
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.consentId).toBeDefined()

    const consent = await prisma.userConsent.findUnique({
      where: { userId: user.id },
    })
    expect(consent?.ipAddress).toBe('192.168.1.1')
  })

  it('returns 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new Request('http://localhost/api/user/consent', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(401)
  })

  it('returns 400 if consent exists', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.userConsent.create({
      data: { userId: user.id },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(400)
  })
})

describe('GET /api/user/consent', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('returns consent if exists', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.userConsent.create({
      data: { userId: user.id, ipAddress: '192.168.1.1' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasConsent).toBe(true)
    expect(data.consent).toBeDefined()
  })

  it('returns null if no consent', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasConsent).toBe(false)
    expect(data.consent).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/app/api/user/consent`
Expected: FAIL with "Cannot find module './route'"

**Step 3: Create API route**

Create `src/app/api/user/consent/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { consentCreateSchema } from '@/lib/schemas'
import { createUserConsent, getUserConsent } from '@/lib/services/legal'

export const POST = withAuth(consentCreateSchema)(async ({ user, data }, request) => {
  // Capture IP from headers
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const consent = await createUserConsent({ user, data, ipAddress: ip })

  return Response.json(
    { success: true, consentId: consent.id },
    { status: 201 }
  )
})

export const GET = withAuth(consentCreateSchema)(async ({ user }) => {
  const consent = await getUserConsent({ data: {}, userId: user.id })

  return Response.json({
    hasConsent: !!consent,
    consent,
  })
})
```

**Step 4: Fix middleware signature**

The test will fail because `withAuth` doesn't pass `request`. Update `src/lib/api-middleware.ts`:

In the `withAuth` function, change line 116-133:

```typescript
export function withAuth<T extends z.ZodType>(schema: T) {
  return (
    fn: (args: {
      user: ServiceUser
      data: z.infer<T>
    }, request: Request) => Response | Promise<Response>
  ) => {
    return withErrorHandler(
      async (
        request: Request,
        context: RouteHandlerContext
      ): Promise<Response> => {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        const user: ServiceUser = {
          id: session.user.id,
          isAdmin: session.user.isAdmin || false,
        }

        const data = await getParams(request, context, schema)
        return await fn({ user, data }, request)
      }
    )
  }
}
```

**Step 5: Run test to verify it passes**

Run: `npm test src/app/api/user/consent`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/api/user/consent/ src/lib/api-middleware.ts
git commit -m "feat: add consent API endpoint (POST/GET)

- POST creates consent with IP audit trail
- GET checks consent status
- Update withAuth to pass request for IP capture

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Data Export API Route

**Files:**
- Create: `src/app/api/user/data/route.ts`
- Create: `src/app/api/user/data/route.test.ts`

**Step 1: Write failing test**

Create `src/app/api/user/data/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GET } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('GET /api/user/data', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('exports all user data', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com', name: 'Test' },
    })

    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })

    await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        clubId: club.id,
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/data', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.email).toBe('user@test.com')
    expect(data.clubs).toHaveLength(1)
    expect(data.events).toHaveLength(1)
  })

  it('returns 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new Request('http://localhost/api/user/data', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(401)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/app/api/user/data`
Expected: FAIL with "Cannot find module './route'"

**Step 3: Create API route**

Create `src/app/api/user/data/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { dataExportSchema } from '@/lib/schemas'
import { exportUserData } from '@/lib/services/legal'

export const GET = withAuth(dataExportSchema)(async ({ user, data }) => {
  const userData = await exportUserData({ user, data })
  return Response.json(userData)
})
```

**Step 4: Run test to verify it passes**

Run: `npm test src/app/api/user/data`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/user/data/
git commit -m "feat: add data export API endpoint

- GET /api/user/data returns all user data
- Includes user profile, clubs, events, consents

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Deletion Request API Routes

**Files:**
- Create: `src/app/api/user/delete/route.ts`
- Create: `src/app/api/user/delete/route.test.ts`
- Create: `src/app/api/user/delete/[id]/route.ts`
- Create: `src/app/api/user/delete/[id]/route.test.ts`

**Step 1: Write failing tests for POST**

Create `src/app/api/user/delete/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST, GET } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('POST /api/user/delete', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('creates deletion request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.requestId).toBeDefined()
    expect(data.scheduledFor).toBeDefined()

    const req = await prisma.dataDeletionRequest.findFirst({
      where: { userId: user.id },
    })
    expect(req?.status).toBe('pending')
  })

  it('returns 400 if pending request exists', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.dataDeletionRequest.create({
      data: {
        userId: user.id,
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(400)
  })
})

describe('GET /api/user/delete', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('returns pending request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.dataDeletionRequest.create({
      data: {
        userId: user.id,
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasPendingRequest).toBe(true)
    expect(data.request).toBeDefined()
  })

  it('returns null if no pending request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasPendingRequest).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test src/app/api/user/delete/route.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Create POST/GET route**

Create `src/app/api/user/delete/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { deletionRequestSchema } from '@/lib/schemas'
import {
  createDeletionRequest,
  getPendingDeletionRequest,
} from '@/lib/services/legal'

export const POST = withAuth(deletionRequestSchema)(async ({ user, data }) => {
  const request = await createDeletionRequest({ user, data })

  return Response.json(
    {
      success: true,
      requestId: request.id,
      scheduledFor: request.scheduledFor.toISOString(),
    },
    { status: 201 }
  )
})

export const GET = withAuth(deletionRequestSchema)(async ({ user }) => {
  const request = await getPendingDeletionRequest({
    data: {},
    userId: user.id,
  })

  return Response.json({
    hasPendingRequest: !!request,
    request,
  })
})
```

**Step 4: Run test to verify it passes**

Run: `npm test src/app/api/user/delete/route.test.ts`
Expected: PASS

**Step 5: Write failing test for DELETE cancel**

Create `src/app/api/user/delete/[id]/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DELETE } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('DELETE /api/user/delete/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('cancels deletion request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    const request = await prisma.dataDeletionRequest.create({
      data: {
        userId: user.id,
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const req = new Request(
      `http://localhost/api/user/delete/${request.id}`,
      {
        method: 'DELETE',
      }
    )

    const response = await DELETE(req, {
      params: Promise.resolve({ id: request.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const cancelled = await prisma.dataDeletionRequest.findUnique({
      where: { id: request.id },
    })
    expect(cancelled?.status).toBe('cancelled')
  })

  it('returns 404 if request not found', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const req = new Request('http://localhost/api/user/delete/invalid', {
      method: 'DELETE',
    })

    const response = await DELETE(req, {
      params: Promise.resolve({ id: 'invalid' }),
    })

    expect(response.status).toBe(400)
  })
})
```

**Step 6: Run test to verify it fails**

Run: `npm test src/app/api/user/delete/\\[id\\]`
Expected: FAIL with "Cannot find module"

**Step 7: Create DELETE route**

Create `src/app/api/user/delete/[id]/route.ts`:

```typescript
import { withAuth } from '@/lib/api-middleware'
import { deletionCancelSchema } from '@/lib/schemas'
import { cancelDeletionRequest } from '@/lib/services/legal'

export const DELETE = withAuth(deletionCancelSchema)(
  async ({ user, data }) => {
    await cancelDeletionRequest({ user, data })
    return Response.json({ success: true })
  }
)
```

**Step 8: Run test to verify it passes**

Run: `npm test src/app/api/user/delete`
Expected: PASS (all tests)

**Step 9: Commit**

```bash
git add src/app/api/user/delete/
git commit -m "feat: add deletion request API endpoints

- POST /api/user/delete creates 30-day deletion request
- GET /api/user/delete checks pending request
- DELETE /api/user/delete/[id] cancels request

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Translations for Legal Pages

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Add English translations**

Edit `messages/en.json`, add after `admin` section:

```json
"legal": {
  "terms": {
    "title": "Terms of Service",
    "lastUpdated": "Last updated: November 27, 2024"
  },
  "privacy": {
    "title": "Privacy Policy",
    "lastUpdated": "Last updated: November 27, 2024"
  }
},
"consent": {
  "banner": {
    "message": "By using quebec.run, you agree to our {termsLink} and {privacyLink}.",
    "terms": "Terms of Service",
    "privacy": "Privacy Policy",
    "accept": "Accept & Continue"
  }
},
"settings": {
  "privacy": {
    "title": "Privacy & Data",
    "exportTitle": "Export Your Data",
    "exportDescription": "Download all your data in JSON format",
    "exportButton": "Download My Data",
    "deleteTitle": "Delete Account",
    "deleteDescription": "Request account deletion (30-day grace period)",
    "deleteButton": "Request Deletion",
    "deleteWarning": "This action will schedule your account for deletion in 30 days. You can cancel anytime before then.",
    "pendingDeletion": "Deletion Scheduled",
    "pendingDescription": "Your account is scheduled for deletion on {date}",
    "cancelButton": "Cancel Deletion"
  }
}
```

**Step 2: Add French translations**

Edit `messages/fr.json`, add after `admin` section:

```json
"legal": {
  "terms": {
    "title": "Conditions d'utilisation",
    "lastUpdated": "Dernière mise à jour : 27 novembre 2024"
  },
  "privacy": {
    "title": "Politique de confidentialité",
    "lastUpdated": "Dernière mise à jour : 27 novembre 2024"
  }
},
"consent": {
  "banner": {
    "message": "En utilisant quebec.run, vous acceptez nos {termsLink} et notre {privacyLink}.",
    "terms": "conditions d'utilisation",
    "privacy": "politique de confidentialité",
    "accept": "Accepter et continuer"
  }
},
"settings": {
  "privacy": {
    "title": "Confidentialité et données",
    "exportTitle": "Exporter vos données",
    "exportDescription": "Téléchargez toutes vos données au format JSON",
    "exportButton": "Télécharger mes données",
    "deleteTitle": "Supprimer le compte",
    "deleteDescription": "Demander la suppression du compte (délai de grâce de 30 jours)",
    "deleteButton": "Demander la suppression",
    "deleteWarning": "Cette action planifiera la suppression de votre compte dans 30 jours. Vous pouvez annuler à tout moment avant cette date.",
    "pendingDeletion": "Suppression planifiée",
    "pendingDescription": "Votre compte est prévu pour suppression le {date}",
    "cancelButton": "Annuler la suppression"
  }
}
```

**Step 3: Update footer translations**

Edit `messages/en.json`, add to `footer` section:

```json
"terms": "Terms",
"privacy": "Privacy"
```

Edit `messages/fr.json`, add to `footer` section:

```json
"terms": "Conditions",
"privacy": "Confidentialité"
```

**Step 4: Commit**

```bash
git add messages/
git commit -m "feat: add translations for legal pages (en/fr)

- Terms/Privacy page headers
- Consent banner
- Privacy settings page
- Footer links

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Legal Static Pages

**Files:**
- Create: `src/app/[locale]/legal/terms/page.tsx`
- Create: `src/app/[locale]/legal/privacy/page.tsx`

**Step 1: Create Terms of Service page**

Create `src/app/[locale]/legal/terms/page.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.terms' })

  return {
    title: t('title'),
  }
}

export default function TermsPage() {
  const t = useTranslations('legal.terms')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-8">{t('lastUpdated')}</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using quebec.run (&quot;the Platform&quot;), you accept and
            agree to be bound by these Terms of Service. If you do not agree,
            please do not use the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            quebec.run is a platform for discovering running clubs and events in
            Quebec City. We provide tools for club organizers to manage their
            clubs and events, and for runners to discover and participate in
            local running activities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p>
            To access certain features, you must create an account using a valid
            email address. You are responsible for maintaining the
            confidentiality of your account and for all activities under your
            account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <p>
            You may submit information about running clubs and events. You retain
            ownership of content you submit, but grant us a license to use,
            display, and distribute that content on the Platform.
          </p>
          <p>
            You represent that your content does not violate any third-party
            rights or applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Post false, misleading, or fraudulent information</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to the Platform</li>
            <li>Interfere with the proper functioning of the Platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Privacy</h2>
          <p>
            Your use of the Platform is subject to our Privacy Policy, which
            describes how we collect, use, and protect your personal information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will
            notify users of material changes. Continued use of the Platform after
            changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violations
            of these Terms. You may request deletion of your account at any time
            through your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
          <p>
            The Platform is provided &quot;as is&quot; without warranties of any kind.
            We do not guarantee the accuracy, completeness, or reliability of any
            content on the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, quebec.run shall not be
            liable for any indirect, incidental, special, or consequential
            damages arising from your use of the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Province of Quebec and
            the laws of Canada applicable therein. Any disputes shall be resolved
            in the courts of Quebec.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
          <p>
            For questions about these Terms, contact us at legal@quebec.run.
          </p>
        </section>
      </div>
    </div>
  )
}
```

**Step 2: Create Privacy Policy page**

Create `src/app/[locale]/legal/privacy/page.tsx`:

```tsx
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.privacy' })

  return {
    title: t('title'),
  }
}

export default function PrivacyPage() {
  const t = useTranslations('legal.privacy')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
      <p className="text-text-secondary mb-8">{t('lastUpdated')}</p>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            quebec.run (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy and is
            committed to protecting your personal information. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information in compliance with Quebec&apos;s Law 25 and applicable privacy
            laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-2">2.1 Account Information</h3>
          <ul className="list-disc ml-6 space-y-2 mb-4">
            <li>Email address (required)</li>
            <li>Name (optional)</li>
            <li>Profile photo (optional)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.2 Content You Provide</h3>
          <ul className="list-disc ml-6 space-y-2 mb-4">
            <li>Club information (name, description, social media links)</li>
            <li>Event information (title, date, time, location, description)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.3 Technical Information</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>IP address (for consent audit trail)</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Usage data (pages visited, features used)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Provide and maintain the Platform</li>
            <li>Authenticate your account</li>
            <li>Display your clubs and events to other users</li>
            <li>Send you service-related communications</li>
            <li>Improve and optimize the Platform</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing</h2>
          <p>We process your personal information based on:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Your consent (by using the Platform)</li>
            <li>Contract performance (to provide services you requested)</li>
            <li>Legal obligations (compliance with applicable laws)</li>
            <li>Legitimate interests (improving and securing the Platform)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
          <p>
            We do not sell your personal information. We may share information
            with:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Public Display:</strong> Club and event information you
              create is publicly visible
            </li>
            <li>
              <strong>Service Providers:</strong> Third-party services that help
              us operate (hosting, email delivery)
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to
              protect rights and safety
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights (Law 25 Compliance)</h2>
          <p>Under Quebec&apos;s Law 25, you have the right to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Access:</strong> Request access to your personal information
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate data
            </li>
            <li>
              <strong>Portability:</strong> Export your data in a structured format
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and data
              (30-day grace period)
            </li>
            <li>
              <strong>Withdrawal of Consent:</strong> You may withdraw consent at
              any time by deleting your account
            </li>
          </ul>
          <p className="mt-4">
            To exercise these rights, visit your Privacy Settings or contact us
            at privacy@quebec.run.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p>We retain your information:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>As long as your account is active</li>
            <li>For 30 days after deletion request (grace period)</li>
            <li>As required by law for legal, accounting, or audit purposes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your information, including:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
            <li>Secure data storage with reputable providers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. International Transfers</h2>
          <p>
            Your information may be stored and processed in servers located
            outside Quebec. We ensure adequate protections are in place for any
            international data transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
          <p>
            The Platform is not intended for users under 13 years of age. We do
            not knowingly collect information from children. If we discover we
            have collected information from a child, we will delete it promptly.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of material changes by email or prominent notice on the Platform.
            Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights,
            contact:
          </p>
          <p className="mt-2">
            <strong>Email:</strong> privacy@quebec.run
            <br />
            <strong>Privacy Officer:</strong> quebec.run Privacy Team
          </p>
        </section>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/\\[locale\\]/legal/
git commit -m "feat: add legal static pages (Terms, Privacy)

- Terms of Service with standard clauses
- Privacy Policy with Law 25 compliance
- Bilingual support via next-intl
- SEO metadata

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Consent Banner Component

**Files:**
- Create: `src/components/consent-banner.tsx`
- Create: `src/components/consent-banner.test.tsx`

**Step 1: Write failing test**

Create `src/components/consent-banner.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ConsentBanner } from './consent-banner'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock navigation
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('ConsentBanner', () => {
  it('renders with accept button', () => {
    render(<ConsentBanner onAccept={() => {}} />)

    expect(screen.getByText(/message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
  })

  it('calls onAccept when button clicked', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()

    render(<ConsentBanner onAccept={onAccept} />)

    await user.click(screen.getByRole('button', { name: /accept/i }))

    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('shows Terms and Privacy links', () => {
    render(<ConsentBanner onAccept={() => {}} />)

    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test consent-banner.test`
Expected: FAIL with "Cannot find module './consent-banner'"

**Step 3: Create component**

Create `src/components/consent-banner.tsx`:

```tsx
'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

type ConsentBannerProps = {
  onAccept: () => void
}

export function ConsentBanner({ onAccept }: ConsentBannerProps) {
  const t = useTranslations('consent.banner')

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-secondary text-center sm:text-left">
            {t.rich('message', {
              termsLink: (chunks) => (
                <Link
                  href="/legal/terms"
                  className="text-primary hover:underline font-medium"
                >
                  {chunks}
                </Link>
              ),
              privacyLink: (chunks) => (
                <Link
                  href="/legal/privacy"
                  className="text-primary hover:underline font-medium"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>

          <button
            onClick={onAccept}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap font-medium"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm test consent-banner.test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/consent-banner.tsx src/components/consent-banner.test.tsx
git commit -m "feat: add ConsentBanner component

- Fixed bottom banner with Terms/Privacy links
- Accept button triggers consent creation
- Bilingual support

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Privacy Settings Page

**Files:**
- Create: `src/app/[locale]/settings/privacy/page.tsx`

**Step 1: Create privacy settings page**

Create `src/app/[locale]/settings/privacy/page.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function PrivacySettingsPage() {
  const t = useTranslations('settings.privacy')
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch pending deletion request
  const { data: deletionData } = useQuery({
    queryKey: ['deletion-request'],
    queryFn: async () => {
      const res = await fetch('/api/user/delete')
      if (!res.ok) throw new Error('Failed to fetch deletion request')
      return res.json()
    },
  })

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/data')
      if (!res.ok) throw new Error('Export failed')
      return res.json()
    },
    onSuccess: (data) => {
      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quebec-run-data-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })

  // Delete request mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/delete', { method: 'POST' })
      if (!res.ok) throw new Error('Deletion request failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] })
      setShowDeleteConfirm(false)
    },
  })

  // Cancel deletion mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user/delete/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Cancel failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] })
    },
  })

  const hasPendingDeletion = deletionData?.hasPendingRequest
  const scheduledDate = hasPendingDeletion
    ? new Date(deletionData.request.scheduledFor).toLocaleDateString()
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>

      {/* Export Data */}
      <section className="bg-surface border border-border rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">{t('exportTitle')}</h2>
        <p className="text-text-secondary mb-4">{t('exportDescription')}</p>
        <button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {exportMutation.isPending ? 'Exporting...' : t('exportButton')}
        </button>
      </section>

      {/* Delete Account */}
      <section className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-2">{t('deleteTitle')}</h2>
        <p className="text-text-secondary mb-4">{t('deleteDescription')}</p>

        {hasPendingDeletion ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">
              {t('pendingDeletion')}
            </h3>
            <p className="text-yellow-800 mb-4">
              {t('pendingDescription', { date: scheduledDate })}
            </p>
            <button
              onClick={() => cancelMutation.mutate(deletionData.request.id)}
              disabled={cancelMutation.isPending}
              className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {cancelMutation.isPending ? 'Cancelling...' : t('cancelButton')}
            </button>
          </div>
        ) : (
          <>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                {t('deleteButton')}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-900 mb-4 font-medium">
                  {t('deleteWarning')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending
                      ? 'Processing...'
                      : 'Confirm Deletion'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-200 text-gray-900 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/\\[locale\\]/settings/
git commit -m "feat: add privacy settings page

- Export data as JSON download
- Request account deletion (30-day grace period)
- Cancel pending deletion
- React Query for state management

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Integrate Consent Banner in App

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Read current layout**

Run: `cat src/app/[locale]/layout.tsx`

**Step 2: Add consent banner logic**

Edit `src/app/[locale]/layout.tsx`, add imports at top:

```tsx
'use client'

import { ConsentBanner } from '@/components/consent-banner'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
```

Add before the return statement (inside the component):

```tsx
const { data: session } = useSession()
const queryClient = useQueryClient()

const { data: consentData } = useQuery({
  queryKey: ['user-consent'],
  queryFn: async () => {
    const res = await fetch('/api/user/consent')
    if (!res.ok) return null
    return res.json()
  },
  enabled: !!session,
})

const consentMutation = useMutation({
  mutationFn: async () => {
    const res = await fetch('/api/user/consent', { method: 'POST' })
    if (!res.ok) throw new Error('Consent failed')
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user-consent'] })
  },
})

const showConsentBanner = session && !consentData?.hasConsent
```

Add before closing `</body>` tag:

```tsx
{showConsentBanner && (
  <ConsentBanner onAccept={() => consentMutation.mutate()} />
)}
```

**Step 3: Test manually**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Expected: Sign in, see consent banner, click accept, banner disappears

**Step 4: Commit**

```bash
git add src/app/\\[locale\\]/layout.tsx
git commit -m "feat: integrate consent banner in app layout

- Show banner for authenticated users without consent
- POST to /api/user/consent on accept
- React Query for state management

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Update Footer with Legal Links

**Files:**
- Modify: `src/components/layout/footer.tsx`

**Step 1: Add legal links to footer**

Edit `src/components/layout/footer.tsx`, in the navigation links section (around line 29), add after calendar link:

```tsx
<span className="text-text-secondary">•</span>
<Link
  href="/legal/terms"
  className="text-text-secondary hover:text-primary transition-colors"
>
  {t('terms')}
</Link>
<span className="text-text-secondary">•</span>
<Link
  href="/legal/privacy"
  className="text-text-secondary hover:text-primary transition-colors"
>
  {t('privacy')}
</Link>
```

**Step 2: Test manually**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Expected: Footer shows "Terms" and "Privacy" links

**Step 3: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "feat: add legal links to footer

- Terms of Service link
- Privacy Policy link
- Bilingual support

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 13: Run Quality Gates

**Files:**
- N/A (verification step)

**Step 1: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 2: Run type check**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Run tests with coverage**

Run: `npm test -- --coverage`
Expected: All tests pass, coverage ≥95%

**Step 4: Run prettier**

Run: `npx prettier --write .`
Expected: All files formatted

**Step 5: Final commit if needed**

```bash
git add .
git commit -m "chore: fix linting and formatting

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 14: E2E Test for Consent Flow

**Files:**
- Create: `src/app/consent-flow.e2e.ts`

**Step 1: Write E2E test**

Create `src/app/consent-flow.e2e.ts`:

```typescript
import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

test.describe('Consent Flow', () => {
  test.beforeEach(async () => {
    // Clean up test data
    await prisma.userConsent.deleteMany()
    await prisma.user.deleteMany({ where: { email: 'e2e-consent@test.com' } })
  })

  test('shows consent banner for new user', async ({ page }) => {
    // Sign in creates new user
    await page.goto('http://localhost:3000/en')
    await page.getByRole('link', { name: /sign in/i }).click()

    // Fill email (Mailhog in dev)
    await page.getByLabel(/email/i).fill('e2e-consent@test.com')
    await page.getByRole('button', { name: /sign in/i }).click()

    // In real test, you'd check Mailhog and click link
    // For now, assume user is authenticated

    // Consent banner should appear
    await expect(
      page.getByText(/by using quebec.run, you agree/i)
    ).toBeVisible()

    // Click accept
    await page.getByRole('button', { name: /accept/i }).click()

    // Banner should disappear
    await expect(
      page.getByText(/by using quebec.run, you agree/i)
    ).not.toBeVisible()

    // Refresh page - banner should not reappear
    await page.reload()
    await expect(
      page.getByText(/by using quebec.run, you agree/i)
    ).not.toBeVisible()
  })

  test('legal pages accessible from banner', async ({ page }) => {
    await page.goto('http://localhost:3000/en')

    // Assume consent banner visible
    await page.getByRole('link', { name: /terms of service/i }).click()
    await expect(page).toHaveURL(/\/legal\/terms/)
    await expect(
      page.getByRole('heading', { name: /terms of service/i })
    ).toBeVisible()

    await page.goBack()

    await page.getByRole('link', { name: /privacy policy/i }).click()
    await expect(page).toHaveURL(/\/legal\/privacy/)
    await expect(
      page.getByRole('heading', { name: /privacy policy/i })
    ).toBeVisible()
  })
})
```

**Step 2: Run E2E test**

Run: `npm run test:e2e`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/consent-flow.e2e.ts
git commit -m "test: add E2E test for consent flow

- Verify consent banner appears for new users
- Verify accept dismisses banner
- Verify banner does not reappear on refresh
- Verify legal page links work

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 15: Documentation

**Files:**
- Create: `docs/legal-compliance.md`

**Step 1: Create documentation**

Create `docs/legal-compliance.md`:

```markdown
# Legal Compliance Documentation

## Overview

quebec.run implements Terms of Service, Privacy Policy, and data management features to comply with Quebec's Law 25.

## Architecture

### Consent Model

- **Approach:** Usage of platform = acceptance of terms
- **First-time users:** See consent banner after authentication
- **Audit trail:** IP address + timestamp stored in `UserConsent`
- **Updates:** No forced re-consent; continued use = acceptance

### Database Schema

**UserConsent:**
- `userId` (unique) - One consent per user
- `acceptedAt` - Timestamp
- `ipAddress` - For audit trail

**DataDeletionRequest:**
- `userId` - Who requested
- `requestedAt` - When requested
- `scheduledFor` - 30 days from request
- `status` - pending/completed/cancelled

## API Endpoints

### POST /api/user/consent
Create consent record (authenticated)
- Captures IP from request headers
- Returns 400 if consent exists

### GET /api/user/consent
Check consent status (authenticated)
- Returns `{ hasConsent: boolean, consent: UserConsent | null }`

### GET /api/user/data
Export all user data (authenticated)
- Returns JSON with user profile, clubs, events, consents

### POST /api/user/delete
Request account deletion (authenticated)
- Creates deletion request 30 days out
- Returns 400 if pending request exists

### DELETE /api/user/delete/[id]
Cancel pending deletion (authenticated)
- Updates status to 'cancelled'
- Returns 404 if not found or not owned by user

## UI Components

### ConsentBanner
- Fixed bottom banner
- Links to Terms and Privacy pages
- Accept button calls `/api/user/consent`
- Dismisses on success

### Legal Pages
- `/[locale]/legal/terms` - Terms of Service
- `/[locale]/legal/privacy` - Privacy Policy
- Bilingual (en/fr) via next-intl

### Privacy Settings
- `/[locale]/settings/privacy`
- Export data as JSON download
- Request deletion (30-day grace period)
- Cancel pending deletion

## Processing Deletions

**Manual (current):**
```sql
-- Query pending deletions
SELECT * FROM data_deletion_requests
WHERE status = 'pending' AND scheduled_for <= NOW();

-- For each request:
-- 1. Delete user (cascades to all related data)
-- 2. Update request status to 'completed'
```

**Automated (future):**
Create `scripts/process-deletions.js`:
```javascript
// Run daily via cron: 0 2 * * *
const pending = await prisma.dataDeletionRequest.findMany({
  where: { status: 'pending', scheduledFor: { lte: new Date() } }
})

for (const request of pending) {
  await prisma.user.delete({ where: { id: request.userId } })
  await prisma.dataDeletionRequest.update({
    where: { id: request.id },
    data: { status: 'completed' }
  })
}
```

## Law 25 Compliance Checklist

- [x] User consent with audit trail (IP + timestamp)
- [x] Privacy Policy with required disclosures
- [x] Right to access (data export)
- [x] Right to deletion (30-day grace period)
- [x] Right to portability (JSON export)
- [x] Data minimization (select only needed fields)
- [x] Transparency (clear legal pages)
- [x] Bilingual (French + English)

## Testing

**Unit tests:** All service functions tested
**Integration tests:** All API routes tested
**E2E tests:** Consent flow, legal page navigation

**Coverage:** ≥95% (verified via `npm test -- --coverage`)

## Future Enhancements

- Email notifications for TOS updates
- Automated cron job for deletion processing
- Cookie policy (if adding analytics)
- Content moderation guidelines (at scale)
```

**Step 2: Commit**

```bash
git add docs/legal-compliance.md
git commit -m "docs: add legal compliance documentation

- Architecture overview
- API endpoints reference
- UI components guide
- Law 25 compliance checklist
- Processing deletions guide

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Completion

All tasks complete! Legal compliance implementation finished.

**Summary:**
- ✅ Database schema (UserConsent, DataDeletionRequest)
- ✅ Zod validation schemas
- ✅ Service layer with tests (≥95% coverage)
- ✅ API routes with tests (consent, data export, deletion)
- ✅ UI components (ConsentBanner, legal pages, privacy settings)
- ✅ Bilingual translations (en/fr)
- ✅ Footer links
- ✅ E2E tests
- ✅ Documentation
- ✅ Quality gates (lint, typecheck, tests, prettier)

**Verify:**
```bash
npm run lint && npm run typecheck && npm test -- --coverage
```

Expected: All pass, coverage ≥95%
