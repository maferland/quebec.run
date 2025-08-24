<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents** _generated with [DocToc](https://github.com/thlorenz/doctoc)_

- [Claude Development Guidelines](#claude-development-guidelines)
  - [General Principles](#general-principles)
    - [Code Changes Must Be Tested](#code-changes-must-be-tested)
    - [Renaming and Refactoring](#renaming-and-refactoring)
    - [File Organization](#file-organization)
  - [Tech Stack Guidelines](#tech-stack-guidelines)
    - [Next.js 13+ App Router](#nextjs-13-app-router)
    - [REST API + React Query](#rest-api--react-query)
    - [Prisma + PostgreSQL](#prisma--postgresql)
      - [⚠️ CRITICAL: Prevent N+1 Query Problems](#-critical-prevent-n1-query-problems)
    - [Zod Validation](#zod-validation)
    - [NextAuth.js](#nextauthjs)
    - [TypeScript Best Practices](#typescript-best-practices)
    - [Tailwind CSS](#tailwind-css)
  - [Code Style & Formatting](#code-style--formatting)
    - [Component Patterns](#component-patterns)
    - [Component Design Principles](#component-design-principles)
    - [Hook Patterns](#hook-patterns)
    - [Prettier Configuration](#prettier-configuration)
  - [Testing Guidelines](#testing-guidelines)
    - [Testing Best Practices](#testing-best-practices)
    - [E2E Testing with Playwright](#e2e-testing-with-playwright)
      - [Semantic Queries (Playwright + RTL Style)](#semantic-queries-playwright--rtl-style)
      - [Content Validation](#content-validation)
      - [Sequential Flow Testing](#sequential-flow-testing)
      - [Test Configuration](#test-configuration)
      - [Scripts Available](#scripts-available)
    - [Test Requirements](#test-requirements)
    - [Test Types](#test-types)
    - [Critical Testing Layers](#critical-testing-layers)
    - [Database Testing](#database-testing)
    - [Storybook](#storybook)
  - [Development Workflow](#development-workflow)
    - [Before Completing Tasks](#before-completing-tasks)
    - [Component Development Checklist](#component-development-checklist)
    - [File Naming Conventions](#file-naming-conventions)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Claude Development Guidelines

## General Principles

### Code Changes Must Be Tested

- **All code changes require tests** - components, functions, tRPC procedures, etc.
- **Tests must be green before completing any task**
- Run `npm run test -- --coverage` to verify coverage meets 95% threshold
- Current coverage: **37.83%** - needs significant improvement

### Renaming and Refactoring

- **Be thorough when renaming** - update all references across the entire codebase
- **Search and replace systematically** - files, imports, variable names, types, schemas, tests, documentation
- **Update related file names** - services, hooks, API routes, test files
- **Check for broken imports** after renaming files

### File Organization

- **Colocate tests with code**: `button.test.tsx` next to `button.tsx`
- **Colocate stories with components**: `button.stories.tsx` next to `button.tsx`
- **No default exports** - use named exports: `export { Button }`
- **Use `export type`** for TypeScript types: `export type ButtonProps = {...}`

## Tech Stack Guidelines

### Next.js 13+ App Router

- **Use file-based routing** in `app/` directory
- **Prefer server components** when possible, use `'use client'` only when needed
- **Use proper metadata API** for SEO: `export const metadata = {...}`
- **Leverage route handlers** in `app/api/` for API endpoints
- **Use `loading.tsx`, `error.tsx`, `not-found.tsx`** for special files

### REST API + React Query

- **Use App Router route handlers** - leverage Next.js 15+ patterns in `app/api/`
- **Clean route handlers** - import service functions, use `withErrorHandler`, keep routes simple
- **Separate service layer** - all business logic in `src/lib/services/`, routes only handle HTTP
- **Service layer pattern** EXAMPLE: `import { getAllClubs } from '@/lib/services/clubs'`
- **Services are pure business logic** - no middleware, consistent payload signatures
- **Use payload utility types** for consistent function signatures:

  ```ts
  // Public services (no auth required)
  export const getAllClubs = async ({ data }: PublicPayload<ClubsQuery>) => {
    // business logic here
  }

  // Authenticated services
  export const createClub = async ({ user, data }: AuthPayload<ClubCreate>) => {
    return await prisma.club.create({
      data: {
        ...data,
        createdBy: user.id,
      },
    })
  }
  ```

- **Use combined route handlers** - clean middleware composition in API routes:

  ```ts
  // app/api/clubs/route.ts
  export const GET = withPublic(clubsQuerySchema)(async (data) => {
    const clubs = await getAllClubs({ data })
    return Response.json(clubs)
  })

  export const POST = withAuth(clubCreateSchema)(async ({ user, data }) => {
    const club = await createClub({ user, data })
    return Response.json(club, { status: 201 })
  })
  ```

- **NEVER use withErrorHandler directly** - it's internal to the combined handlers
- **Only use withPublic and withAuth** - they include error handling automatically
- **Type-safe API calls** - use Zod schemas with proper TypeScript inference
- **Use proper error handling** with `withErrorHandler` wrapper for consistent responses
- **Let types flow** - avoid explicit return types, let TypeScript infer from implementation

### Prisma + PostgreSQL

- **Use descriptive model names** and follow naming conventions
- **Leverage Prisma relations** properly with `include` and `select`
- **Use database constraints** and proper foreign keys
- **Write migrations carefully** - test locally before deploying
- **Seed data should be reproducible** and use proper factories
- **Use CUID for all IDs** - `@default(cuid())` generates collision-resistant, sortable IDs
- **Never manually set IDs in tests** - let Prisma generate CUIDs to avoid conflicts
- **NEVER use `prisma db push`** - always create proper migrations with `prisma migrate dev` for schema changes
- **Ask user to run migrations** - if migration commands fail in non-interactive mode, ask user to run them manually
- **Use minimal field selection** - Always use `select` with only required fields instead of `include` to minimize data transfer and improve performance

#### ⚠️ CRITICAL: Prevent N+1 Query Problems

**ALWAYS use `include` or `select` to fetch related data in single queries. NEVER loop over results to make additional queries.**

```typescript
// ❌ NEVER DO THIS - N+1 Query Problem
const clubs = await prisma.club.findMany()
const clubsWithEvents = await Promise.all(
  clubs.map(async (club) => {
    const events = await prisma.event.findMany({ where: { clubId: club.id } })
    return { ...club, events }
  })
)

// ✅ ALWAYS DO THIS - Single Query with Include
const clubsWithEvents = await prisma.club.findMany({
  include: {
    events: {
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    },
  },
})
```

**Review every Prisma query for N+1 patterns before merging.**

### Zod Validation

- **Define schemas close to usage** or in dedicated schema files
- **Use Zod inference** for TypeScript types: `type User = z.infer<typeof userSchema>`
- **Colocate schemas and types** - Export both together to avoid duplication
- **Validate at API boundaries** - API route inputs, form data, environment variables
- **Create reusable schemas** for common patterns

```typescript
// ✅ Good - colocated schema and type
export const eventIdSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
})
export type EventId = z.infer<typeof eventIdSchema>

// ❌ Avoid - separated schema and type definitions
// In one file: export const eventIdSchema = z.object({...})
// In another file: type EventId = z.infer<typeof eventIdSchema>
```

### NextAuth.js

- **Use proper session typing** with module augmentation
- **Implement proper callback handling** for custom logic
- **Use database adapter** for production (Prisma adapter configured)
- **Handle authentication errors gracefully** in UI
- **Protect API routes** with authentication middleware (`withAuth`)

### TypeScript Best Practices

- **Use strict mode** - `"strict": true` in tsconfig
- **Prefer type over interface** for simple object types
- **Use `export type`** for type-only exports
- **NEVER use `any`** - use `unknown`, proper typing, or specific types
- **Use `as const` for literal types** - creates readonly literal types instead of widened types

### Tailwind CSS

- **Use semantic class groupings** and organize by layout → styling → behavior
- **Use `clsx` or `cn` utility** for conditional classes
- **Create component variants** with class-variance-authority
- **Use responsive design** with mobile-first approach

## Code Style & Formatting

### Component Patterns

```typescript
// ✅ Good
export const Button = ({ variant = 'primary', children, ...props }: ButtonProps) => {
  return <button className={cn(baseStyles, variants[variant])} {...props}>
    {children}
  </button>
}

export type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>
```

### Component Design Principles

- **UI components should be opinionated** - Provide sensible defaults that work well in most cases
- **Avoid requiring constant overrides** - If users always override defaults, change the defaults
- **Design for the 80% use case** - Make common patterns easy, complex patterns possible
- **Consistent API design** - Use similar prop patterns across components (e.g., `variant`, `as`, `className`)

### Hook Patterns

```typescript
// ✅ Good - use 'opts' for hook parameters
export const useCounter = (opts: CounterOpts = {}) => {
  const { initialValue = 0 } = opts
  return { count, increment: () => setCount((c) => c + 1) }
}

export type CounterOpts = {
  initialValue?: number
}
```

### Prettier Configuration

- **Automatically format code** with `npx prettier --write .`
- Configuration in `.prettierrc`

## Testing Guidelines

### Testing Best Practices

- **Avoid using `.getByTestId()`** - Use semantic queries instead: `getByRole()`, `getByText()`, `getByLabelText()`
- **Use `findBy` queries for async content** - Instead of `waitFor(() => getBy...)`, use `findBy` which includes built-in waiting
- **Prefer semantic queries** - These queries reflect how users interact with the UI
- **TestIds should only be used as a last resort** when no semantic query works

```typescript
// ❌ Avoid - using waitFor with getBy
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
})

// ✅ Good - using findBy for async content
expect(await screen.findByText('Loading complete')).toBeInTheDocument()
```

### E2E Testing with Playwright

E2E tests validate complete user workflows using real browsers. Follow these guidelines for maintainable, reliable tests:

#### Semantic Queries (Playwright + RTL Style)

- **Use semantic queries like RTL** - `page.getByRole()`, `page.getByText()`, `page.getByLabel()`
- **Avoid CSS selectors** - No `page.locator('.class')` or `page.locator('[data-testid]')`
- **Use locator chaining for context** - `page.getByRole('article').first().getByRole('heading')`
- **Validate actual content** - Check text content, not just element existence

```typescript
// ❌ Avoid - CSS selectors and testids
await page.locator('[data-testid="club-card"]').click()
await page.locator('.button').click()
await expect(page.locator('h3')).toBeVisible()

// ✅ Good - semantic queries
const clubCard = page.getByRole('article').first()
await expect(clubCard.getByRole('heading')).toContainText(/Quebec Running Club/)
await clubCard.getByRole('button', { name: 'View Details' }).click()
```

#### Content Validation

- **Check actual text content** - Don't just verify elements exist
- **Use regex for flexible matching** - Handle dynamic content gracefully
- **Validate user-facing content** - Test what users actually see

```typescript
// ❌ Avoid - only checking existence
await expect(page.getByRole('heading')).toBeVisible()

// ✅ Good - validating actual content
await expect(page.getByRole('heading')).toContainText(/Featured Run Clubs/i)
await expect(clubCard.getByText(/Quebec|Running|Club/)).toBeVisible()
```

#### Sequential Flow Testing

- **Test realistic user workflows** - Not just isolated interactions
- **Wait for content to load** - Let async operations complete
- **Handle loading states gracefully** - Test both loading and loaded states

```typescript
// ✅ Good - realistic user flow
test('user can browse and view club details', async ({ page }) => {
  await page.goto('/')

  // Wait for clubs to load
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({
    timeout: 10000,
  })

  // Click on first club
  const firstClub = page.getByRole('article').first()
  await expect(firstClub.getByRole('heading')).toContainText(/\w+/)
  await firstClub.getByRole('link', { name: /view|details/i }).click()

  // Verify navigation to club details
  await expect(page).toHaveURL(/\/clubs\//)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
```

#### Test Configuration

- **Always run headless by default** - Use `npm run test:e2e:headed` only for debugging
- **Use Chrome desktop + mobile** - Test responsive design
- **Sequential execution in CI** - Prevent flaky parallel test issues
- **Proper timeouts** - Allow for real network delays

#### Scripts Available

- `npm run test:e2e` - Headless tests (default)
- `npm run test:e2e:headed` - Visual debugging mode
- `npm run test:e2e:ui` - Playwright UI for test development

### Test Requirements

- **95% code coverage threshold** enforced
- **All components must have both tests AND Storybook stories**
- **Exception**: Ask before skipping tests/stories for simple wrapper components

### Test Types

- **Component tests**: Unit tests for React components using RTL + Vitest
- **Service integration tests**: Business logic functions with test database
- **API route tests**: Test actual HTTP endpoints to catch route handler bugs
- **E2E tests**: Happy path user flows with Playwright using semantic queries

### Critical Testing Layers

**IMPORTANT**: Test all layers to prevent runtime errors:

1. **Service layer**: Test business logic functions directly
2. **API route layer**: Test actual HTTP endpoints (GET /api/clubs, POST /api/runs, etc.)
3. **Frontend integration**: Test React Query hooks with MSW
4. **E2E**: Test complete user flows

Missing API route tests caused our recent runtime error - service layer worked but route handlers had bugs.

### Database Testing

- **Use separate test database**: `courses_test`
- **Never fall back to main database** - require explicit `TEST_DATABASE_URL`
- **Clean and seed data** before each test
- **Clean up after each test** - use `afterEach` to prevent data leaks between tests
- **Let Prisma generate IDs** - never manually set IDs in test data to avoid conflicts
- **Avoid parallel test execution issues** - use unique data for each test

### Storybook

- **Every component needs a story** unless explicitly discussed
- **Stories should be colocated** with components
- **Create one story per variant** - each component variant/state gets its own individual story
- **Create separate stories for each component state/variant** for better testing and documentation
- **Use descriptive story names** like `Primary`, `Secondary`, `Disabled`, etc.
- **Include interactive controls** with argTypes for props exploration
- **Use correct Storybook imports** - Always import from framework package, never renderer package:

```typescript
// ✅ Good - use framework package
import type { Meta, StoryObj } from '@storybook/nextjs'

// ❌ Bad - never use renderer package directly
import type { Meta, StoryObj } from '@storybook/react'
```

## Development Workflow

### Before Completing Tasks

**MANDATORY: After completing ANY of the following, ALWAYS run this checklist:**

1. **Run linter**: `npm run lint` - Fix all ESLint errors before proceeding
2. **Run TypeScript check**: `npx tsc --noEmit` - Ensure no TypeScript errors
3. **Run tests**: `npm run test -- --coverage` - Verify all tests pass
4. **Verify 95% coverage threshold** - Ensure coverage meets requirements
5. **Format code**: `npx prettier --write .` - Apply consistent formatting

**Quality gates are required for:**

- **ANY component creation** - new .tsx files with tests and stories
- **ANY schema changes** - Prisma models, Zod schemas, API types
- **ANY service layer changes** - business logic, API routes, database queries
- **ANY hook or utility creation** - reusable logic with tests
- **Refactoring existing code** - changes to multiple existing files
- **Bug fixes** - ensure fix works and doesn't break other functionality
- **Feature completion** - when user says "moving on" or task is done

**NEVER skip quality gates for "small" changes. Component creation, new utilities, and schema changes always require full validation.**

### Component Development Checklist

- [ ] Component implemented with proper TypeScript types
- [ ] Unit tests written and passing
- [ ] Storybook story created
- [ ] Code formatted with Prettier
- [ ] Coverage threshold maintained

### File Naming Conventions

- Components: `button.tsx`, `header.tsx`
- Tests: `button.test.tsx`, `header.test.tsx`
- Stories: `button.stories.tsx`, `header.stories.tsx`
- E2E tests: `home.e2e.ts`, `calendar.e2e.ts`

Remember: Quality over speed. Comprehensive tests and documentation make the codebase maintainable and reliable.
