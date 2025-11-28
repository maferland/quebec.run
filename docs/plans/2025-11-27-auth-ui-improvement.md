# Auth UI Improvement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace NextAuth default UI with custom branded sign-in page for better UX and branding consistency

**Architecture:** Create custom Next.js page at `/[locale]/auth/signin` that intercepts NextAuth's default UI. Use existing UI components (Button, Card, FormControl) with i18n support. Keep auth flow unchanged (NextAuth + email provider).

**Tech Stack:** Next.js 15 App Router, NextAuth.js, next-intl, Tailwind CSS, React Hook Form, Zod

---

## Task 1: Add Auth Translations

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Add English translations**

Add auth section to `messages/en.json` after navigation section:

```json
"auth": {
  "signIn": "Sign In",
  "signInTitle": "Welcome to Quebec Run",
  "signInSubtitle": "Enter your email to receive a magic link",
  "emailLabel": "Email address",
  "emailPlaceholder": "you@example.com",
  "sendMagicLink": "Send Magic Link",
  "checkYourEmail": "Check your email",
  "magicLinkSent": "We sent a magic link to",
  "checkSpam": "Check your spam folder if you don't see it",
  "invalidEmail": "Please enter a valid email address",
  "sendingLink": "Sending link...",
  "backToHome": "Back to home"
}
```

**Step 2: Add French translations**

Add auth section to `messages/fr.json`:

```json
"auth": {
  "signIn": "Se connecter",
  "signInTitle": "Bienvenue à Quebec Run",
  "signInSubtitle": "Entrez votre courriel pour recevoir un lien magique",
  "emailLabel": "Adresse courriel",
  "emailPlaceholder": "vous@exemple.com",
  "sendMagicLink": "Envoyer le lien magique",
  "checkYourEmail": "Vérifiez votre courriel",
  "magicLinkSent": "Nous avons envoyé un lien magique à",
  "checkSpam": "Vérifiez vos courriels indésirables si vous ne le voyez pas",
  "invalidEmail": "Veuillez entrer une adresse courriel valide",
  "sendingLink": "Envoi du lien...",
  "backToHome": "Retour à l'accueil"
}
```

**Step 3: Commit translations**

```bash
git add messages/en.json messages/fr.json
git commit -m "feat(i18n): add auth page translations for EN and FR"
```

---

## Task 2: Create Sign-In Page Component

**Files:**

- Create: `src/app/[locale]/auth/signin/page.tsx`
- Test: `src/app/[locale]/auth/signin/page.test.tsx`

**Step 1: Write failing test**

Create `src/app/[locale]/auth/signin/page.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SignInPage from './page'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'callbackUrl' ? '/admin' : null),
  }),
}))

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in form with email input', () => {
    render(<SignInPage />)

    expect(screen.getByRole('heading', { name: 'signInTitle' })).toBeInTheDocument()
    expect(screen.getByLabelText('emailLabel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'sendMagicLink' })).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    const submitButton = screen.getByRole('button', { name: 'sendMagicLink' })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(screen.getByText('invalidEmail')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('submits valid email and shows success state', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockResolvedValue({ ok: true } as any)

    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    const submitButton = screen.getByRole('button', { name: 'sendMagicLink' }))

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        callbackUrl: '/admin',
        redirect: false,
      })
    })

    expect(screen.getByText('checkYourEmail')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockImplementation(() => new Promise(() => {}))

    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    const submitButton = screen.getByRole('button', { name: 'sendMagicLink' }))

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    expect(screen.getByText('sendingLink')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('includes callbackUrl from query params', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockResolvedValue({ ok: true } as any)

    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'sendMagicLink' })))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        callbackUrl: '/admin',
        redirect: false,
      })
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/[locale]/auth/signin/page.test.tsx`
Expected: FAIL with "Cannot find module './page'"

**Step 3: Write minimal implementation**

Create `src/app/[locale]/auth/signin/page.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormControl } from '@/components/ui/form-control'
import { Link } from '@/components/ui/link'
import { PageContainer } from '@/components/ui/page-container'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError(t('invalidEmail'))
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('email', {
        email,
        callbackUrl,
        redirect: false,
      })

      if (result?.ok) {
        setEmailSent(true)
      }
    } catch (err) {
      setError(t('invalidEmail'))
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('checkYourEmail')}
            </h1>
            <p className="text-text-secondary">
              {t('magicLinkSent')} <strong className="text-text-primary">{email}</strong>
            </p>
            <p className="text-sm text-text-secondary">{t('checkSpam')}</p>
            <Link href="/" className="inline-block mt-4">
              {t('backToHome')}
            </Link>
          </Card>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('signInTitle')}
            </h1>
            <p className="text-text-secondary">{t('signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormControl
              label={t('emailLabel')}
              error={error}
              htmlFor="email"
            >
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="email"
                autoFocus
              />
            </FormControl>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('sendingLink') : t('sendMagicLink')}
            </Button>

            <div className="text-center">
              <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">
                {t('backToHome')}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/[locale]/auth/signin/page.test.tsx`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/app/[locale]/auth/signin/
git commit -m "feat(auth): add custom sign-in page with email validation"
```

---

## Task 3: Configure NextAuth Custom Pages

**Files:**

- Modify: `src/lib/auth.ts:68-84`

**Step 1: Write failing E2E test**

Create `e2e/auth-signin.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Auth Sign In', () => {
  test('custom sign-in page renders', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await expect(
      page.getByRole('heading', { name: /welcome to quebec run/i })
    ).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /send magic link/i })
    ).toBeVisible()
  })

  test('clicking sign in button redirects to custom page', async ({ page }) => {
    await page.goto('/en')

    await page
      .getByRole('button', { name: /sign in/i })
      .first()
      .click()

    await expect(page).toHaveURL(/\/en\/auth\/signin/)
  })

  test('validates email format', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await page.getByLabel(/email address/i).fill('invalid-email')
    await page.getByRole('button', { name: /send magic link/i }).click()

    await expect(
      page.getByText(/please enter a valid email address/i)
    ).toBeVisible()
  })

  test('shows success message after valid submission', async ({ page }) => {
    await page.goto('/en/auth/signin')

    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByRole('button', { name: /send magic link/i }).click()

    await expect(page.getByText(/check your email/i)).toBeVisible()
    await expect(page.getByText(/test@example.com/)).toBeVisible()
  })
})
```

**Step 2: Run E2E test to verify it fails**

Run: `npm run test:e2e -- e2e/auth-signin.spec.ts`
Expected: FAIL (NextAuth shows default UI, not custom page)

**Step 3: Configure custom pages in NextAuth**

Modify `src/lib/auth.ts`, add pages configuration to authOptions:

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [createEmailProvider()],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/signin',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
        // Check if user is admin
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true },
        })
        session.user.isAdmin = dbUser?.isAdmin ?? false
      }
      return session
    },
  },
}
```

**Step 4: Run E2E test to verify it passes**

Run: `npm run test:e2e -- e2e/auth-signin.spec.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/lib/auth.ts e2e/auth-signin.spec.ts
git commit -m "feat(auth): configure NextAuth to use custom sign-in page"
```

---

## Task 4: Update Auth Buttons to Use Custom Page

**Files:**

- Modify: `src/components/layout/auth-buttons.tsx:92-95`

**Step 1: Modify signIn call to use custom page**

Replace the signIn() call with router navigation:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

type AuthButtonsProps = {
  variant: 'desktop' | 'mobile'
  onAction?: () => void
}

export function AuthButtons({ variant, onAction }: AuthButtonsProps) {
  const { data: session, status } = useSession()
  const t = useTranslations('navigation')
  const router = useRouter()

  // ... existing session and loading states ...

  return (
    <div
      className={
        variant === 'desktop' ? 'flex items-center space-x-2' : 'space-y-3'
      }
    >
      <Button
        size="sm"
        onClick={() => {
          router.push('/auth/signin')
          onAction?.()
        }}
        variant="outline-primary"
        className={variant === 'mobile' ? 'w-full justify-center' : ''}
      >
        {t('signIn')}
      </Button>
      {/* ... rest of buttons ... */}
    </div>
  )
}
```

**Step 2: Run tests**

Run: `npm test -- src/components/layout/auth-buttons.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/layout/auth-buttons.tsx
git commit -m "feat(auth): update auth buttons to navigate to custom sign-in"
```

---

## Task 5: Add Storybook Story for Sign-In Page

**Files:**

- Create: `src/app/[locale]/auth/signin/page.stories.tsx`

**Step 1: Create story file**

Create `src/app/[locale]/auth/signin/page.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import SignInPage from './page'

const meta: Meta<typeof SignInPage> = {
  title: 'Pages/Auth/SignIn',
  component: SignInPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof SignInPage>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('heading', { name: /welcome/i })
    ).toBeInTheDocument()
    await expect(canvas.getByLabelText(/email/i)).toBeInTheDocument()
  },
}

export const WithValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    const emailInput = canvas.getByLabelText(/email/i)
    const submitButton = canvas.getByRole('button', {
      name: /send magic link/i,
    })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await expect(canvas.getByText(/please enter a valid/i)).toBeInTheDocument()
  },
}

export const LoadingState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    const emailInput = canvas.getByLabelText(/email/i)
    const submitButton = canvas.getByRole('button', {
      name: /send magic link/i,
    })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
  },
}
```

**Step 2: Build Storybook to verify**

Run: `npm run build-storybook`
Expected: SUCCESS (no errors)

**Step 3: Commit**

```bash
git add src/app/[locale]/auth/signin/page.stories.tsx
git commit -m "docs(storybook): add sign-in page stories"
```

---

## Task 6: Run Quality Gates

**Files:**

- All modified files

**Step 1: Run linter**

Run: `npm run lint`
Expected: PASS (no errors)

**Step 2: Run type check**

Run: `npm run typecheck`
Expected: PASS (no errors)

**Step 3: Run full test suite with coverage**

Run: `npm test -- --coverage`
Expected: PASS (≥95% coverage)

**Step 4: Run E2E tests**

Run: `npm run test:e2e`
Expected: PASS (all tests)

**Step 5: Run Prettier**

Run: `npx prettier --write .`
Expected: SUCCESS

**Step 6: Final commit if prettier made changes**

```bash
git add -A
git commit -m "style: format code with prettier"
```

---

## Testing Checklist

- [ ] Unit tests pass for SignInPage component
- [ ] E2E tests pass for auth flow
- [ ] Email validation works (invalid format shows error)
- [ ] Success state shows after valid submission
- [ ] Loading state displays during submission
- [ ] Custom page renders instead of NextAuth default
- [ ] Sign-in button navigates to custom page
- [ ] Callback URL preserved in sign-in flow
- [ ] French translations work correctly
- [ ] Storybook stories render without errors
- [ ] All quality gates pass (lint, typecheck, coverage ≥95%)

---

## Manual Testing Steps

1. Start dev server: `npm run dev`
2. Visit http://localhost:3000/en
3. Click "Sign In" button
4. Verify redirect to `/en/auth/signin`
5. Enter invalid email, verify error message
6. Enter valid email, verify success state
7. Check Mailhog (http://localhost:8025) for magic link email
8. Click magic link, verify successful authentication
9. Switch to French (`/fr/auth/signin`), verify translations
10. Test with callback URL: `/en/auth/signin?callbackUrl=/admin`

---

## Rollback Plan

If issues arise:

```bash
git revert HEAD~6..HEAD
npm install
npm test
```

Or reset to before feature branch:

```bash
git reset --hard origin/main
```
