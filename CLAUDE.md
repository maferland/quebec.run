<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [CLAUDE.md — Concise Development Guidelines](#claudemd--concise-development-guidelines)
  - [1) Principles](#1-principles)
  - [2) Tech Stack Rules](#2-tech-stack-rules)
  - [3) Testing Strategy](#3-testing-strategy)
  - [4) Workflow & Quality Gates](#4-workflow--quality-gates)
  - [5) Code Style & Patterns](#5-code-style--patterns)
  - [6) Boy Scout Rule](#6-boy-scout-rule)
  - [Appendix: Quick “Always/Never” Cheatsheet](#appendix-quick-alwaysnever-cheatsheet)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# CLAUDE.md — Concise Development Guidelines

We build fast, safe, and user-centered software. This page distills the non-negotiables.

## 1) Principles

**Efficiency (batch work):** Plan first, then batch tool calls and file ops to respect usage limits. Prefer one comprehensive command over many small ones.

**Quality gates are sacred:** We never bypass pre-commit/CI gates. If a gate fails, we fix the root cause.

**YAGNI:** Ship what’s needed now. Avoid speculative props, hooks, and abstractions. Design with awareness of likely near-term changes (schemas, APIs) without over-engineering.

**UI/UX & Accessibility:** WCAG AA minimum (AAA when practical). Use semantic HTML, clear hierarchy, responsive layouts, and keyboard-first interactions. Keep contrast strong in all interactive states.

**Performance & Security:** Optimize assets and queries; handle secrets safely; validate inputs at boundaries.

## 2) Tech Stack Rules

**Next.js App Router (13+):**

- Use `app/` file-based routing. Prefer Server Components; add `'use client'` only when necessary.
- Use the Metadata API for SEO; use `loading.tsx`, `error.tsx`, `not-found.tsx` for states.
- Implement APIs with route handlers in `app/api/` and keep them thin (delegate to services).

**REST + React Query:**

- Keep route handlers minimal; call pure service functions (no business logic in handlers).
- Use Zod at the edge (request/response) for type-safe APIs.

**Prisma + PostgreSQL:**

- Use `prisma migrate dev` (never `db push`); CUIDs for IDs; enforce FKs/constraints.
- **Avoid N+1:** fetch relations in one query via `include` or precomputed queries; never loop and query.
- **Least data:** prefer `select` with only required fields; avoid `include: true` unless justified.
- Write small, reviewed migrations; seeds are deterministic (factories).

**Zod Validation:**

- Keep schemas near usage or in dedicated modules; infer TS types from Zod. Validate inputs, forms, APIs, and env vars.

**NextAuth:**

- Use Prisma adapter; type sessions via module augmentation; protect APIs with `withAuth`.

**TypeScript:**

- `"strict": true`. Prefer `type` over `interface` for simple shapes, `export type` for type-only exports. Avoid `any`; use `unknown` or specific types. Use `as const` for literals.

**Tailwind:**

- Mobile-first. Use `cn` for conditional classes. Keep class order semantic (layout → style → behavior).

## 3) Testing Strategy

Cover the right layer(s); don’t duplicate assertions across layers.

**Unit (components, pure functions):**

- Test behavior like a user (roles, labels, names). Prefer `@testing-library/user-event`. Avoid CSS selectors/test IDs unless no a11y handle exists.

**Integration (services + DB):**

- Use a real test DB with explicit `TEST_DATABASE_URL`. Clean/seed per test. Let Prisma generate IDs.

**API (route handlers):**

- Exercise HTTP boundaries: validation, auth, error shapes.

**E2E (Playwright):**

- Validate critical journeys (desktop + mobile). Headless in CI; headed only for debugging.

**Visual docs/regression (Storybook + Chromatic):**

- Every component has stories for key states; review diffs like code.

**Coverage:** 95% threshold; focus on meaningful paths. Keep tests fast and deterministic.

## 4) Workflow & Quality Gates

**Before we mark a task done:**

1. `npm run lint`
2. `tsc --noEmit`
3. `npm run test -- --coverage` (≥95%)
4. `npx prettier --write .`

**Where gates apply:** new/changed components, schemas (Prisma/Zod/API), services, routes, hooks/utils, multi-file refactors, bug fixes, and features.

**Lightweight lane (non-functional):** docs/comments/config/copy/visual-only tweaks → lint + tsc + prettier are enough.

**Renaming/refactors:** search & replace thoroughly (code, tests, stories, docs); update filenames; verify imports.

**File organization:** colocate tests/stories with code; prefer named exports; default only when framework requires.

## 5) Code Style & Patterns

- **Components:** opinionated defaults; design for the 80%; consistent props (`variant`, `as`, `className`).
- **Parameters:** prefer object params for extensibility (esp. 3+ args); for hooks, use a single `opts` object.
- **Queries:** review every Prisma call for N+1 and over-fetching.
- **Accessibility:** never trade readability/contrast for aesthetics; verify hover/focus/active/disabled states.

## 6) Boy Scout Rule

Always leave the code better: small opportunistic fixes, note debt, and track improvements in **`RENOVATE.md`**.

---

## Appendix: Quick “Always/Never” Cheatsheet

**Always**

- Batch commands and file ops.
- Validate at boundaries with Zod.
- Keep handlers thin; put logic in services.
- Use `select` for minimal fields; `include` only for required relations.
- Run lint → typecheck → tests (≥95%) → prettier before merging.
- Write a story for each component; review Chromatic diffs.

**Never**

- Bypass gates (`--no-verify`) or commit on red CI.
- Use `prisma db push` in this repo.
- Introduce N+1 loops or `include: true` by default.
- Over-engineer future-maybe features (violating YAGNI).
- Rely on CSS selectors/test IDs where an accessible handle exists.
- Test presence or absence of classNames
- Manually set Prisma IDs in tests.
