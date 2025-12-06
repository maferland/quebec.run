# Dev-Only Auto-Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dev-only bypass to skip email verification during local testing.

**Architecture:** Add NextAuth CredentialsProvider that only works in development (NODE_ENV !== 'production'), allowing instant login as any seeded user. Add UI dropdown on signin page (dev only) to select from seeded accounts.

**Tech Stack:** NextAuth CredentialsProvider, environment checks, React conditional rendering

---

## Task 1: Add Credentials Provider (Dev Only)

**Files:**

- Modify: `src/lib/auth.ts:70`

**Step 1: Add CredentialsProvider import**

Modify `src/lib/auth.ts`:

```typescript
import CredentialsProvider from 'next-auth/providers/credentials'
```

**Step 2: Add dev-only credentials provider**

Modify `src/lib/auth.ts` providers array:

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    createEmailProvider(),
    // Dev-only: bypass email verification
    ...(env.NODE_ENV !== 'production'
      ? [
          CredentialsProvider({
            id: 'dev-bypass',
            name: 'Dev Bypass',
            credentials: {
              email: { label: 'Email', type: 'text' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null

              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
                select: { id: true, email: true, name: true, isStaff: true },
              })

              if (!user) return null

              return {
                id: user.id,
                email: user.email,
                name: user.name,
              }
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/signin',
  },
  callbacks: {
    session: async ({ session, user, token }) => {
      if (session?.user) {
        // For credentials provider, user ID comes from token
        const userId = user?.id || token?.sub
        if (!userId) return session

        session.user.id = userId
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { isStaff: true },
        })
        session.user.isStaff = dbUser?.isStaff ?? false
      }
      return session
    },
  },
}
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add dev-only credentials provider for auto-login"
```

---

## Task 2: Add Dev Login UI

**Files:**

- Modify: `src/app/[locale]/auth/signin/page.tsx`

**Step 1: Read current signin page**

Check the current structure of signin page to understand where to add dev UI.

**Step 2: Add dev-only quick login section**

Modify `src/app/[locale]/auth/signin/page.tsx`:

```typescript
import { env } from '@/lib/env'

// ... existing code ...

// Add after regular email form:
{env.NODE_ENV !== 'production' && (
  <div className="mt-8 p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50">
    <h3 className="text-sm font-semibold text-yellow-800 mb-2">
      🚧 DEV ONLY - Quick Login
    </h3>
    <form method="post" action="/api/auth/callback/credentials">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <select
        name="email"
        className="w-full p-2 border rounded mb-2 text-sm"
        defaultValue=""
      >
        <option value="" disabled>
          Select test account...
        </option>
        <option value="maferland@quebec.run">
          Marc-Antoine Ferland (Staff)
        </option>
        <option value="owner1@example.com">
          Alice Tremblay (Club Owner)
        </option>
        <option value="owner2@example.com">
          Bob Gagnon (Club Owner)
        </option>
      </select>
      <button
        type="submit"
        className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 text-sm font-medium"
      >
        Sign in instantly (no email)
      </button>
    </form>
    <p className="text-xs text-yellow-700 mt-2">
      This bypass only works in development mode
    </p>
  </div>
)}
```

**Step 3: Get CSRF token in page component**

Ensure the page has access to CSRF token:

```typescript
import { getCsrfToken } from 'next-auth/react'

export default async function SignInPage() {
  const csrfToken = await getCsrfToken()

  // ... rest of component
}
```

**Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Test in browser**

1. Navigate to http://localhost:3001/en/auth/signin
2. Verify yellow "DEV ONLY" box appears
3. Verify dropdown has 3 accounts
4. Select an account and click "Sign in instantly"
5. Verify you're signed in without email verification

**Step 6: Commit**

```bash
git add src/app/[locale]/auth/signin/page.tsx
git commit -m "feat: add dev-only quick login UI on signin page"
```

---

## Task 3: Add ENV Check to Env Schema

**Files:**

- Modify: `src/lib/env.ts`

**Step 1: Verify NODE_ENV is typed**

Check `src/lib/env.ts` to ensure NODE_ENV is properly typed in the schema.

If not present, add:

```typescript
NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit if changes made**

```bash
git add src/lib/env.ts
git commit -m "feat: add NODE_ENV to env schema"
```

---

## Task 4: Update Signin Page Tests

**Files:**

- Modify: `src/app/[locale]/auth/signin/page.test.tsx`

**Step 1: Add test for dev UI visibility**

Add test to verify dev UI only shows in development:

```typescript
import { env } from '@/lib/env'

describe('SignInPage', () => {
  // ... existing tests ...

  it('shows dev quick login in development', () => {
    // Mock env
    vi.spyOn(env, 'NODE_ENV', 'get').mockReturnValue('development')

    render(<SignInPage csrfToken="test-token" />)

    expect(screen.getByText(/DEV ONLY/i)).toBeInTheDocument()
    expect(screen.getByText(/Quick Login/i)).toBeInTheDocument()
  })

  it('hides dev quick login in production', () => {
    // Mock env
    vi.spyOn(env, 'NODE_ENV', 'get').mockReturnValue('production')

    render(<SignInPage csrfToken="test-token" />)

    expect(screen.queryByText(/DEV ONLY/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Quick Login/i)).not.toBeInTheDocument()
  })
})
```

**Step 2: Run tests**

Run: `npm test src/app/[locale]/auth/signin/page.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/app/[locale]/auth/signin/page.test.tsx
git commit -m "test: add tests for dev quick login UI"
```

---

## Task 5: Add Auth Config Tests

**Files:**

- Create: `src/lib/auth.test.ts`

**Step 1: Create test file**

Create `src/lib/auth.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { authOptions } from './auth'
import { env } from './env'

describe('authOptions', () => {
  it('includes credentials provider in development', () => {
    vi.spyOn(env, 'NODE_ENV', 'get').mockReturnValue('development')

    const providers = authOptions.providers
    const hasCredentials = providers.some((p: any) => p.id === 'dev-bypass')

    expect(hasCredentials).toBe(true)
  })

  it('excludes credentials provider in production', () => {
    vi.spyOn(env, 'NODE_ENV', 'get').mockReturnValue('production')

    const providers = authOptions.providers
    const hasCredentials = providers.some((p: any) => p.id === 'dev-bypass')

    expect(hasCredentials).toBe(false)
  })
})
```

**Step 2: Run test**

Run: `npm test src/lib/auth.test.ts`
Expected: 2 tests pass

**Step 3: Commit**

```bash
git add src/lib/auth.test.ts
git commit -m "test: add tests for dev-only credentials provider"
```

---

## Task 6: Update Documentation

**Files:**

- Create: `docs/development/quick-login.md`

**Step 1: Create documentation**

Create `docs/development/quick-login.md`:

```markdown
# Dev Quick Login

## Overview

In development mode, a quick login bypass is available on the signin page to skip email verification.

## Usage

1. Navigate to `/auth/signin`
2. Look for the yellow "DEV ONLY - Quick Login" box
3. Select a test account from the dropdown:
   - **Marc-Antoine Ferland** (maferland@quebec.run) - Platform Staff
   - **Alice Tremblay** (owner1@example.com) - Club Owner
   - **Bob Gagnon** (owner2@example.com) - Club Owner
4. Click "Sign in instantly"
5. You're signed in without email verification

## Security

This feature is **completely disabled in production** via environment checks:

- Only works when `NODE_ENV !== 'production'`
- Uses NextAuth CredentialsProvider with explicit dev-only guards
- UI only renders in development
- Provider not added to auth config in production

## Testing Different Users

Use quick login to test:

- Staff permissions (Marc-Antoine)
- Club owner permissions (Alice, Bob)
- Staff promotion UI (promote Alice or Bob to staff)

## Technical Details

**Implementation:**

- `src/lib/auth.ts` - CredentialsProvider with env check
- `src/app/[locale]/auth/signin/page.tsx` - Dev-only UI
- Provider looks up user by email, returns session

**Tests:**

- `src/lib/auth.test.ts` - Provider inclusion tests
- `src/app/[locale]/auth/signin/page.test.tsx` - UI visibility tests
```

**Step 2: Commit**

```bash
git add docs/development/quick-login.md
git commit -m "docs: add quick login documentation"
```

---

## Task 7: Quality Gates

**Files:**

- None (verification only)

**Step 1: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 4: Run prettier**

Run: `npx prettier --write .`
Expected: Files formatted

**Step 5: Commit formatting if needed**

```bash
git add -A
git commit -m "style: format code with prettier"
```

---

## Task 8: Manual Testing

**Files:**

- None (manual verification)

**Step 1: Test dev quick login**

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3001/en/auth/signin
3. Verify yellow "DEV ONLY" box is visible
4. Select "Marc-Antoine Ferland (Staff)" from dropdown
5. Click "Sign in instantly"
6. Verify you're signed in and redirected
7. Navigate to `/en/admin/users`
8. Verify you see the users list (staff access confirmed)

**Step 2: Test as club owner**

1. Sign out
2. Navigate to signin page
3. Select "Alice Tremblay (Club Owner)"
4. Sign in
5. Verify you're signed in as Alice
6. Try to access `/en/admin/users`
7. Verify you're redirected (no staff access)

**Step 3: Test production check**

1. Set `NODE_ENV=production` in `.env`
2. Restart dev server
3. Navigate to signin page
4. Verify NO yellow dev box appears
5. Verify you can only sign in with email
6. Restore `NODE_ENV=development`

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete dev-only auto-login feature"
```

---

## Success Criteria

- ✅ CredentialsProvider only added in development
- ✅ Dev UI only renders when `NODE_ENV !== 'production'`
- ✅ Can sign in as any seeded user instantly
- ✅ No email verification required in dev
- ✅ Feature completely disabled in production
- ✅ Tests verify environment-based behavior
- ✅ All quality gates pass
- ✅ Documentation complete

## Security Notes

**Production Safety:**

- Triple environment checks (auth config, UI render, tests)
- NextAuth CredentialsProvider only registered in dev array
- UI conditional on `env.NODE_ENV !== 'production'`
- No way to enable this in production without code changes

**Why This Is Safe:**

- Only affects local development
- Vercel/production uses `NODE_ENV=production` by default
- Even if someone tried to enable it, Prisma adapter would conflict
- Clear visual warning (yellow box) indicates dev-only feature
