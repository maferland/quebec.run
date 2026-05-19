# Project Guidelines

## Quality Gates (Run Before Commit)

1. `npm run lint`
2. `bun tsc --noEmit`
3. `npm run test -- --coverage` (≥95%)
4. `npx prettier --write .`

**Apply to:** components, schemas (Prisma/Zod/API), services, routes, hooks/utils, bug fixes, features
**Lightweight lane:** docs/config/copy → lint + tsc + prettier only

## Visual Review (Before PR is Ready)

Any PR that touches UI must include a pinpoint pass before it's ready for review. Use the `pinpoint:using-pinpoint` skill — that owns the up-to-date flow. Mention findings in the PR description; out-of-scope ones land as a follow-up plan doc.

**Skip pinpoint** for pure data/schema/refactor PRs with no pixel impact. Note the skip in the PR description.

## Testing Strategy

**Coverage:** Maintain ≥95% threshold; focus on meaningful paths

- **Unit (components, functions):** Test via roles/labels/names (not CSS selectors), use `@testing-library/user-event`
- **Integration (services + DB):** Use real test DB with `TEST_DATABASE_URL`, clean/seed per test, let Prisma generate IDs
- **API (route handlers):** Validate auth + boundaries (input validation, error shapes)
- **E2E (Playwright):** Cover critical journeys (desktop + mobile)
- **Visual (Storybook):** Create stories for all components, review Chromatic diffs like code

## Code Style

- **TypeScript:** Use `.ts` for all scripts (not `.js`)
- **Components:** Provide opinionated defaults, use consistent props (`variant`, `as`, `className`)
- **Parameters:** Use object params for 3+ args; hooks take single `opts` object
- **Queries:** Use `select` for minimal fields, `include` only for required relations (not `include: true`)
- **Accessibility:** Meet WCAG AA minimum, verify all interactive states (hover/focus/active/disabled)

## Worktree Workflow

**Creating:** Use `npm run worktree <branch-name>` (not `git worktree add` directly)

Auto-generates:

- Worktree at `.worktrees/<branch-name>`
- Branch `maferland/<branch-name>`
- Isolated DB `quebec.run_<branch-name>`
- Ports: `60XX` (dev), `61XX` (Storybook), `62XX` (Mailhog)
- Copies `.env` and runs migrations

**Removing:** Use `npm run remove-worktree <branch-name>` (drops DB, deletes branch)

## Critical Rules

- Run all quality gates before commit (never use `--no-verify`)
- Use `prisma migrate dev` (not `db push`)
- Prefix branches with `maferland/`
- Fetch relations in one query with `include`/`select` (not N+1 loops)
- Ship only what's needed now (YAGNI)
- Batch commands and file ops (respect usage limits)
- Keep handlers thin, put logic in services
- Validate at boundaries with Zod

## Bun Commands

- Scripts: `bun run scripts/*.ts` (TypeScript)
- Seed: `bun run prisma/seed.ts`
- Dev: `bun run scripts/dev.ts`
- Geocode: `bun run scripts/geocode-addresses.ts`
- Pre-commit: `npx lint-staged` (auto via Husky)

## Tech Stack

Next.js 15 (App Router) • Prisma + PostgreSQL • Vitest + Playwright • Storybook + Chromatic • NextAuth • Zod • Tailwind • React Query
