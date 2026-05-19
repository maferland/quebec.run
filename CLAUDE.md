# Project Guidelines

## Quality Gates (Run Before Commit)

1. `npm run lint`
2. `bun tsc --noEmit`
3. `npm run test -- --coverage` (≥95%)
4. `npx prettier --write .`

**Apply to:** components, schemas (Prisma/Zod/API), services, routes, hooks/utils, bug fixes, features
**Lightweight lane:** docs/config/copy → lint + tsc + prettier only

## Visual Review (Before PR is Ready)

Any PR that touches UI — pages, components, layout, copy, styling — must include a pinpoint pass before requesting review.

**Flow:**

1. Start dev (or use a Vercel preview URL) and pick 3–6 touched surfaces.
2. Capture each at mobile width (390×844) full-page. Save under `shots/<branch>/NN-name.png`.
3. Run `pinpoint review <files...> --context "<PR# + branch + viewport + what to look for>"`.
4. Act on the returned annotations — fix in the same PR, or open a follow-up plan doc if the fix is out of scope. Either way, mention pinpoint findings in the PR description.
5. Re-pinpoint after non-trivial fixes.

**Surfaces worth capturing by default:** home, the page that was directly changed, an event/club detail if data shape changed, the mobile menu open if nav was touched.

**Skip pinpoint** for: pure data-layer changes (schema, service, seed) with no UI impact, doc-only changes, internal refactors that don't shift any pixel.

`shots/` is gitignored — keep screenshots local; mention findings in the PR.

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
