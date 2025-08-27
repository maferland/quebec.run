<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Claude Development Guidelines](#claude-development-guidelines)
  - [General Principles](#general-principles)
    - [UI/UX Quality Standards](#uiux-quality-standards)
    - [Code Changes Must Be Tested](#code-changes-must-be-tested)
    - [YAGNI: Don’t Build for Unused Use Cases](#yagni-dont-build-for-unused-use-cases)
    - [Renaming and Refactoring](#renaming-and-refactoring)
    - [File Organization](#file-organization)
  - [Tech Stack Guidelines](#tech-stack-guidelines)
    - [Next.js 13+ App Router](#nextjs-13-app-router)
    - [REST API + React Query](#rest-api--react-query)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Claude Development Guidelines

## General Principles

### ⚡ Efficiency and Tool Usage Optimization

**CRITICAL: Maximize daily allowance usage through batching and efficiency.**

- **ALWAYS batch tool calls when possible** — Use single messages with multiple tool invocations instead of sequential single calls
- **Batch file operations** — `rm file1.txt file2.txt file3.txt` instead of three separate `rm` calls
- **Batch read operations** — Read multiple files in one message when analyzing related code
- **Combine related operations** — `npm run lint && npx tsc --noEmit && npm test` instead of three separate bash calls
- **Use efficient search patterns** — One comprehensive search instead of multiple narrow searches
- **Plan before executing** — Think through all operations needed and batch them strategically
- **Prioritize high-impact actions** — Focus on operations that accomplish multiple goals simultaneously

**Examples of good batching:**

```bash
# ✅ Good - Multiple operations in one call
npm run lint && npx tsc --noEmit && npm run test -- --coverage

# ✅ Good - Batch file operations
rm -f src/app/home.e2e.ts src/app/events.e2e.ts src/app/navigation.e2e.ts

# ✅ Good - Combined search and action
find ./src -name "*.e2e.ts" -delete && ls ./src/app/*.e2e.ts
```

**Avoid inefficient patterns:**

```bash
# ❌ Inefficient - Sequential single operations
npm run lint
npx tsc --noEmit
npm run test

# ❌ Inefficient - Individual file operations
rm src/app/home.e2e.ts
rm src/app/events.e2e.ts
rm src/app/navigation.e2e.ts
```

This optimization is **essential** for productive development sessions and respecting usage limits.

### UI/UX Quality Standards

**Minimum WCAG AA compliance; aim for AAA where practical.**

- **Visual Design**: Professional, polished, and cohesive branding throughout
- **User Experience**: Intuitive navigation, clear information hierarchy, and responsive design
- **Accessibility**: Semantic HTML, proper contrast ratios, and full keyboard navigation
- **Performance**: Fast loading times, optimized images, and smooth animations
- **Code Quality**: Clean, maintainable, well-tested code with consistent patterns

**Button and Interactive Element Guidelines:**

- **Never sacrifice usability for aesthetics** — interactive elements must be clearly visible across all states
- **Maintain consistent hover/focus states** — visible feedback without reducing contrast
- **Ensure proper contrast ratios** — AA minimum (AAA when feasible)
- **Test all interactive states** — default, hover, focus, active, disabled

### Code Changes Must Be Tested

- **All code changes require tests** — components, functions, APIs, etc.
- **Tests must be green before completing any task**
- Run `npm run test -- --coverage` to verify coverage meets **95% threshold**

### Security Gates Must Never Be Bypassed

- **NEVER use `--no-verify` or similar flags** to skip pre-commit hooks, linting, or quality checks
- **All quality gates must pass** — ESLint, TypeScript, tests, formatting, security checks
- **Fix issues at the source** — resolve linting errors, type errors, and test failures properly
- **Quality gates exist for security and code quality** — bypassing them introduces technical debt and potential vulnerabilities

### YAGNI: Don’t Build for Unused Use Cases

- **Avoid being too eager.** Don’t implement features, props, hooks, or abstractions that have no current use case.
- **Focus on what is needed now.** Code should solve today’s problems and be exercised by the product immediately.
- **Be thoughtful about tomorrow.** When writing code, stay aware of future directions — especially changes that would be expensive to retrofit (e.g., database schema, API design, or core component patterns).
- **Balance pragmatism with foresight.** Prefer minimal solutions that can evolve naturally rather than speculative architectures.

### Renaming and Refactoring

- **Be thorough when renaming** — update all references across the entire codebase
- **Search and replace systematically** — files, imports, variable names, types, schemas, tests, documentation
- **Update related file names** — services, hooks, API routes, test files
- **Check for broken imports** after renaming files

### File Organization

- **Colocate tests with code**: `button.test.tsx` next to `button.tsx`
- **Colocate stories with components**: `button.stories.tsx` next to `button.tsx`
- **Prefer named exports**: `export { Button }`
- **Use `export type`** for TypeScript types: `export type ButtonProps = {...}`
- **Exceptions for default exports** where the framework **requires** them (e.g., Next.js page files, Storybook story default export)

## Tech Stack Guidelines

### Next.js 13+ App Router

- **Use file-based routing** in `app/` directory
- **Prefer server components**; add `'use client'` only when needed
- **Use metadata API** for SEO: `export const metadata = {...}`
- **Leverage route handlers** in `app/api/` for API endpoints
- **Use `loading.tsx`, `error.tsx`, `not-found.tsx`** for special states

### REST API + React Query

- **Use App Router route handlers** — `app/api/` patterns
- **Clean route handlers** — import service functions, use `withPublic/withAuth`, keep routes thin
- **Separate service layer** — business logic in `src/lib/services/`
- **Service layer pattern** example: `import { getAllClubs } from '@/lib/services/clubs'`
- **Services are pure business logic** — consistent payload signatures

```ts
// Public services (no auth)
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

````

**Combined route handlers:**

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

- **Never use `withErrorHandler` directly** — it’s wrapped by `withPublic/withAuth`
- **Type-safe API calls** — Zod schemas + TS inference
- **Let types flow** — avoid redundant explicit return types

### Prisma + PostgreSQL

- **Descriptive model names**; follow naming conventions
- **Leverage relations** with `include`/`select`
- **Use DB constraints** and proper FKs
- **Write migrations carefully** — test locally before deploying
- **Seed data** should be reproducible and use factories
- **Use CUID for all IDs** — `@default(cuid())`
- **Never manually set IDs in tests** — let Prisma generate CUIDs
- **Never use `prisma db push`** — use `prisma migrate dev`
- **ALWAYS use minimal field selection** — Always use `select` with only required fields instead of `include` to minimize data transfer, improve performance, and **prevent information leakage**. Never select all fields with `include: true` unless absolutely necessary for the specific use case

#### ⚠️ CRITICAL: Prevent N+1 Query Problems

**ALWAYS use `include` or `select` to fetch related data in single queries. NEVER loop over results to make additional queries.**

```ts
// ❌ NEVER - N+1
const clubs = await prisma.club.findMany()
const clubsWithEvents = await Promise.all(
  clubs.map(async (club) => {
    const events = await prisma.event.findMany({ where: { clubId: club.id } })
    return { ...club, events }
  })
)

// ✅ DO - Single query with include
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
- **Use Zod inference** for TS types: `type User = z.infer<typeof userSchema>`
- **Colocate schemas and types** — export both
- **Validate at boundaries** — API inputs, forms, env vars
- **Create reusable schemas** for common patterns

```ts
// ✅ Colocated schema + type
export const eventIdSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
})
export type EventId = z.infer<typeof eventIdSchema>
```

### NextAuth.js

- **Proper session typing** with module augmentation
- **Callbacks** for custom logic
- **Prisma adapter** in production
- **Graceful UI errors**
- **Protect APIs** with `withAuth`

### TypeScript Best Practices

- `"strict": true` in `tsconfig`
- Prefer `type` over `interface` for simple objects
- Use `export type` for type-only exports
- **Avoid `any`** — use `unknown` or specific types
- Use `as const` for literal types

### Tailwind CSS

- **Semantic class groupings**; order by layout → styling → behavior
- Use `clsx`/`cn` for conditional classes
- Component variants with `class-variance-authority`
- **Mobile-first** responsive design

## Code Style & Formatting

### Component Patterns

```tsx
// ✅ Good
export const Button = ({
  variant = 'primary',
  children,
  ...props
}: ButtonProps) => {
  return (
    <button className={cn(baseStyles, variants[variant])} {...props}>
      {children}
    </button>
  )
}

export type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>
```

### Component Design Principles

- **Opinionated components** — sensible defaults
- **Avoid constant overrides** — change defaults if they’re always overridden
- **Design for the 80%** — common easy, complex possible
- **Consistent APIs** — shared prop patterns: `variant`, `as`, `className`

### Function Parameter Patterns

**Prefer object parameters over arrays for better extensibility and readability.**

```ts
// ✅ Good - Object parameters allow easy extension
export const expectLocalizedText = ({
  page,
  translationKey,
  locale = 'fr'
}: {
  page: Page
  translationKey: string
  locale?: Locale
}): Promise<void> => {
  // implementation
}

// ❌ Avoid - Array parameters harder to extend and read
export const expectLocalizedText = (
  page: Page,
  translationKey: string,
  locale: Locale = 'fr'
): Promise<void> => {
  // implementation
}
```

**Benefits of object parameters:**
- **Extensible**: New parameters can be added without breaking existing calls
- **Self-documenting**: Parameter names are explicit at call site
- **Optional parameters**: Easy to handle with destructuring defaults
- **Order-independent**: Parameters can be passed in any order

**Use object parameters for:**
- Functions with 3+ parameters
- Functions likely to grow new parameters
- Test utilities and helper functions
- API functions and service calls

### Hook Patterns

```ts
// ✅ Use 'opts' for hook parameters
export const useCounter = (opts: CounterOpts = {}) => {
  const { initialValue = 0 } = opts
  // ...
  return {
    /* count, increment */
  }
}

export type CounterOpts = {
  initialValue?: number
}
```

### Prettier Configuration

- **Format automatically**: `npx prettier --write .`
- Configuration in `.prettierrc`

## Testing Guidelines

We follow a comprehensive 4-layer testing strategy to ensure quality, maintainability, and user-centric validation.

### Unit Testing (React Components)

> Purpose: keep tests fast, meaningful, and user-centric. We test behavior, not implementation.

#### Core Principles

- **Test like a user.** Query by role/name/label text; avoid implementation details and CSS selectors.
- **Prefer public APIs.** Interact via the DOM and events, not component internals or hooks.
- **Small & focused.** One behavior per test; clear Arrange–Act–Assert structure.
- **Deterministic & fast.** No network, no timers leaking, no flakiness.
- **Within TS boundaries.** No `null as any` just to force invalid inputs.
- **Behavior over attributes.** Don’t assert `tabIndex`/`aria-hidden`—assert focusability, labels, and outcomes instead.
- **Component scope.** Test the component’s responsibility, not unrelated containers.

#### What to Test

- User-visible states (loading, success, empty, error)
- Interactions and side effects (clicks, typing, keyboard navigation)
- Accessibility contracts (roles, names, labels, focus)
- Branching logic important to users (feature flags, permissions)

#### What Not to Test

- Library internals (React, RTK, React Query, etc.)
- Styling/layout pixel-perfection (covered by visual regression)
- Private functions if covered via component behavior
- CSS classes (avoid `toHaveClass('bg-red-500')`)

#### Queries (use this order)

1. `getByRole` (with `name`)
2. `getByLabelText` / `getByPlaceholderText`
3. `getByText` (sparingly)
4. `getByTestId` **only** when no a11y handle exists

Use `findBy*` for async; `queryBy*` to assert absence.

#### Events

- Use `@testing-library/user-event` (not `fireEvent`) for realistic typing, tabbing, clicks.

#### Async

- Prefer `findBy*` for elements that appear later.
- Use `await waitFor(...)` for side-effect assertions.
- Avoid arbitrary sleeps; wait on conditions.

```ts
// ❌ Avoid - using waitFor with getBy
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
})

// ✅ Use findBy for async content
expect(await screen.findByText('Loading complete')).toBeInTheDocument()
```

#### Mocking & Data

- Mock network with **MSW** at the boundary.
- Keep fixtures small and realistic; prefer factories.
- Stub Date/Timers with Vitest fake timers when time matters.

#### Matchers

- Use **`@testing-library/jest-dom`**: `toBeInTheDocument`, `toBeDisabled`, `toHaveTextContent`, `toHaveAccessibleName`, etc.

#### Example

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  it('submits credentials and shows greeting', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/welcome, marc/i)).toBeVisible()
  })

  it('supports keyboard navigation', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    const emailInput = screen.getByLabelText(/email/i)
    emailInput.focus()
    expect(emailInput).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText(/password/i)).toHaveFocus()
  })
})
```

#### Coverage & Requirements

- **95% code coverage threshold** enforced with `npm run test -- --coverage`
- Keep tests parallelizable and hermetic; no shared mutable state.
- Aim for **meaningful coverage** (critical paths). Coverage % is a guide, not a goal.

### Integration Testing (Services & Database)

Integration tests validate business logic functions and database interactions using a real test database.

#### Database Testing

- **Use separate test database** (e.g., `courses_test`)
- **Require explicit `TEST_DATABASE_URL`**; never fall back to main DB
- **Clean and seed** before each test
- **Clean up after** each test (`afterEach`)
- **Let Prisma generate IDs** (no manual ID setting)
- **Avoid parallel collisions** — unique data per test

#### Parallelization with Vitest

- Vitest runs tests in **parallel** by default, which can conflict with a shared test DB.
- For DB-related suites, run sequentially:

  ```bash
  vitest run --runInBand
  ```

- Or provision **per-suite databases** (dynamic schema names) / **test containers** for true parallel runs.

#### Service Layer Testing

- Test business logic functions directly
- Use realistic data (factories/fixtures)
- Test error conditions (validation, constraints)
- Mock external APIs (MSW for HTTP, mock third-party SDKs)

#### API Route Testing

- Test actual HTTP endpoints (e.g., GET `/api/clubs`, POST `/api/runs`)
- Use supertest-style requests to route handlers
- Test auth/permissions
- Test error responses (400/401/404/500) and error shapes

### End-to-End Testing (Playwright)

Validate complete user workflows using real browsers. Focus on happy paths and critical journeys.

#### Semantic Queries (Playwright + RTL Style)

- Use semantic queries: `page.getByRole()`, `page.getByText()`, `page.getByLabel()`
- Avoid CSS selectors / test IDs when possible
- Use locator chaining for context
- Validate **content**, not just existence

#### Test Configuration

- Headless by default; use headed/UI modes only for debugging
- Test desktop + mobile viewports
- Sequential in CI for stability; tune timeouts realistically

#### Scripts Available

- `npm run test:e2e` — headless
- `npm run test:e2e:headed` — visual debugging
- `npm run test:e2e:ui` — Playwright UI

### UI Documentation & Visual Regression (Storybook)

Storybook provides visual docs and visual regression via **Chromatic** in CI.

#### Story Requirements

- Every component needs a story (unless explicitly exempted)
- Stories colocated with components
- Separate stories per variant/state
- Descriptive names: `Primary`, `Secondary`, `Disabled`, `Loading`
- Controls via `argTypes` for props exploration

#### Visual Testing

- **Chromatic** runs visual regression on PRs; treat diffs as code reviews
- Document component states visually (loading/error/empty)
- Test responsive behavior with Storybook viewports
- Validate accessibility with Storybook a11y addon

#### Import Guidelines

```ts
// ✅ Use framework package
import type { Meta, StoryObj } from '@storybook/nextjs'

// ❌ Don’t import the generic React renderer directly in this project
// import type { Meta, StoryObj } from '@storybook/react'
```

### Critical Testing Layers

**IMPORTANT**: Cover the appropriate layer(s) to prevent runtime errors:

1. **Unit** — component behavior and user interactions
2. **Integration** — service/business logic with DB
3. **API** — HTTP endpoints and handler behavior
4. **E2E** — full user workflows and happy paths

Missing the right layer can cause production bugs (e.g., API route not covered while service tests pass).

#### Testing Scope Responsibility

Avoid duplicating the same assertions at multiple layers:

| Layer           | Responsibility                                                   | Example                                                        |
| --------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| **Unit**        | Component logic and UI states; service functions in isolation    | Button disables on invalid form; `sum()` returns correct value |
| **Integration** | Interaction between service + database; multiple modules working | `createClub` service saves to DB with relations                |
| **API**         | Request/response formatting, auth, validation, error handling    | POST `/api/clubs` returns 401 if unauthenticated               |
| **E2E**         | Full user flows, critical happy paths                            | User signs in → creates a club → sees it listed                |

## Development Workflow

### Before Completing Tasks

**MANDATORY checklist for code-impacting changes:**

1. **Run linter**: `npm run lint`
2. **Run TypeScript check**: `npx tsc --noEmit`
3. **Run tests**: `npm run test -- --coverage`
4. **Verify 95% coverage threshold**
5. **Format code**: `npx prettier --write .`

**Quality gates are required for:**

- Component creation (.tsx) — with tests and stories
- Schema changes — Prisma models, Zod schemas, API types
- Service layer changes — business logic, API routes, DB queries
- Hook/utility creation — with tests
- Refactors across multiple files
- Bug fixes — ensure fix + no regressions
- Feature completion — when moving on / done

**NEVER skip quality gates** for component creation, new utilities, or schema changes.

#### Lightweight Lane (Non-Functional Changes)

For changes that **do not affect runtime behavior** (docs, comments, config, text copy, styling-only refactors), a reduced workflow is acceptable:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npx prettier --write .`

Full test suite + coverage gates are **not required** for these cases.

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

**Remember:** Quality over speed. Comprehensive tests and documentation make the codebase maintainable and reliable.

## Boy Scout Rule

**"Always leave the code better than you found it."**

- **Track improvements**: Document code areas that need improvement in `RENOVATE.md`
- **Opportunistic refactoring**: Fix small issues when working nearby
- **Note technical debt**: Record areas for future improvement during development
- **Incremental progress**: Small, consistent improvements over time
- **Quality mindset**: Every interaction with code is an opportunity to improve it

The `RENOVATE.md` file serves as our running list of code improvements, refactoring opportunities, and technical debt that we can address incrementally.
````
