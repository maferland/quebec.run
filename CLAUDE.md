# Claude Development Guidelines

## General Principles

### Code Changes Must Be Tested

- **All code changes require tests** - components, functions, tRPC procedures, etc.
- **Tests must be green before completing any task**
- Run `npm run test -- --coverage` to verify coverage meets 95% threshold
- Current coverage: **37.83%** - needs significant improvement

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

### tRPC + React Query

- **Type-safe API calls** - leverage full TypeScript inference
- **Use proper error handling** with TRPCError and custom error codes
- **Implement proper input validation** with Zod schemas
- **Separate client/server** code: `trpc/client.ts` and `trpc/server.ts`
- **Test both unit and integration** for tRPC procedures

### Prisma + PostgreSQL

- **Use descriptive model names** and follow naming conventions
- **Leverage Prisma relations** properly with `include` and `select`
- **Use database constraints** and proper foreign keys
- **Write migrations carefully** - test locally before deploying
- **Seed data should be reproducible** and use proper factories

### Zod Validation

- **Define schemas close to usage** or in dedicated schema files
- **Use Zod inference** for TypeScript types: `type User = z.infer<typeof userSchema>`
- **Validate at API boundaries** - tRPC inputs, form data, environment variables
- **Create reusable schemas** for common patterns

### NextAuth.js

- **Use proper session typing** with module augmentation
- **Implement proper callback handling** for custom logic
- **Use database adapter** for production (Prisma adapter configured)
- **Handle authentication errors gracefully** in UI
- **Protect tRPC procedures** with proper middleware

### TypeScript Best Practices

- **Use strict mode** - `"strict": true` in tsconfig
- **Prefer type over interface** for simple object types
- **Use `export type`** for type-only exports
- **Avoid `any`** - use `unknown` or proper typing

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

### Test Requirements

- **95% code coverage threshold** enforced
- **All components must have both tests AND Storybook stories**
- **Exception**: Ask before skipping tests/stories for simple wrapper components

### Test Types

- **Component tests**: Unit tests for React components using RTL + Vitest
- **Integration tests**: tRPC procedures with test database
- **E2E tests**: Happy path user flows with Playwright

### Database Testing

- **Use separate test database**: `courses_test`
- **Never fall back to main database** - require explicit `TEST_DATABASE_URL`
- **Clean and seed data** before each test

### Storybook

- **Every component needs a story** unless explicitly discussed
- **Stories should be colocated** with components
- **Create separate stories for each component state/variant** for better testing and documentation
- **Use descriptive story names** like `Primary`, `Secondary`, `Disabled`, etc.
- **Include interactive controls** with argTypes for props exploration

## Development Workflow

### Before Completing Tasks

1. **Run tests**: `npm run test -- --coverage`
2. **Verify 95% coverage threshold**
3. **Run linting**: `npm run lint`
4. **Format code**: `npx prettier --write .`

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
