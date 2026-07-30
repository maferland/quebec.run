# quebec.run

Where to run in Quebec City this week, on one map.

The site answers a single question: it's Tuesday, where can I show up and run
with people? The home page is a map of the city showing the runs happening on
the day you picked. Tap a pin or a card and the run opens over the map — club,
meeting point, distance, pace, whether beginners are welcome. Everything exists
in French and English, French first, because that's the language most of these
clubs run in.

Clubs are either maintained by hand or imported from their Strava club. Weekly
runs are stored as a recurring pattern and materialized into dated events by a
cron job, so a club sets its Tuesday 18:15 once instead of posting it 52 times.

- [Stack](#stack)
- [Running it locally](#running-it-locally)
- [Scripts](#scripts)
- [Database](#database)
- [Email in development](#email-in-development)
- [Worktrees](#worktrees)
- [Deployment](#deployment)
- [Docs](#docs)

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL with Prisma 7
- next-intl for `fr`/`en` routing (`fr` is the default, the prefix is always
  present)
- NextAuth 4, passwordless email sign-in
- Leaflet + react-leaflet on Carto basemap tiles
- React Query for the explore data, Zod for env and form validation, date-fns
  for dates
- Resend in production, Mailhog in development
- Vitest, Playwright, Storybook

The map lives in `src/app/[locale]/(explore)`. Everything else (admin, auth,
legal, settings) lives in `(site)`. Business logic sits in `src/lib/services`
and route handlers stay thin.

## Running it locally

You need [Bun](https://bun.sh/), PostgreSQL, and Docker (for Mailhog).

```bash
git clone git@github.com:maferland/quebec.run.git
cd quebec.run
bun install          # postinstall runs prisma generate
cp .env.example .env
```

`src/lib/env.ts` validates the environment with Zod and refuses to boot on
anything missing. What it wants:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`, at least 32 characters
- `EMAIL_FROM`, plus `RESEND_API_KEY` when `USE_RESEND=true`, or
  `EMAIL_SERVER_HOST` and `EMAIL_SERVER_PORT` when it's false
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN`, required
  even locally. Mock values are fine if you aren't touching the Strava sync

Then migrate, seed, and start:

```bash
bun prisma migrate dev
bun run db:seed
bun run dev
```

`bun run dev` brings up docker-compose, waits for Mailhog to answer on
`MAILHOG_WEB_PORT` (8026 in `.env.example`), and runs `next dev --turbopack` on
`PORT` (3000 by default). If Docker isn't running it falls back to a local
`mailhog` binary, and if that's missing it warns and keeps the dev server up.

## Scripts

```bash
bun run dev                # docker-compose + Mailhog + next dev --turbopack
bun run build              # next build
bun run start              # production server
bun run lint               # eslint
bun run typecheck          # tsc --noEmit
bun run test               # vitest, all suites
bun run test:unit          # vitest without the service/DB tests
bun run test:integration   # only the service tests (needs TEST_DATABASE_URL)
bun run test:coverage      # vitest with the coverage ratchet
bun run test:e2e           # playwright (also :headed and :ui)
bun run storybook          # storybook on STORYBOOK_PORT (6006 by default)
bun run geocode            # geocode addresses that have no coordinates
```

`vitest.config.ts` holds a coverage ratchet. Raise it when you add tests, never
lower it.

## Database

```bash
bun prisma migrate dev --name what_changed   # create and apply a migration
bun run db:reset                             # reset and reseed (dev only)
bun prisma generate                          # regenerate the client
bun prisma studio                            # browse the data
```

Use `migrate dev`, not `db push`. The schema is `prisma/schema.prisma`: users
and organizations own clubs, clubs own recurring events, and recurring events
generate the dated `Event` rows the map reads.

## Email in development

Sign-in is a magic link, so you need somewhere to catch mail. With
`USE_RESEND=false`, Mailhog does it: SMTP on `MAILHOG_SMTP_PORT` and a web inbox
on `MAILHOG_WEB_PORT` (`1026` and `8026` in `.env.example`).

In production, set `USE_RESEND=true` and add a `RESEND_API_KEY` from
[Resend](https://resend.com/).

## Worktrees

`bun run worktree <name>` creates a worktree under `.worktrees/`, branches
`maferland/<name>`, gives it its own database, assigns non-conflicting ports,
and runs migrations. `bun run remove-worktree <name>` tears all of that down.
[PORTS.md](PORTS.md) covers the port environment variables.

## Deployment

Vercel, from `main`. `vercel.json` registers the weekly cron that materializes
recurring events (Sundays, 02:00 UTC). Production needs the same environment
variables as local plus a real `NEXTAUTH_URL` and `RESEND_API_KEY`; migrations
run with `prisma migrate deploy`.

## Docs

Working notes live in `docs/`, with the current domain model plan under
`docs/plans/`. A few older documents still sit at the root
([REFRAME.md](REFRAME.md), [QUEBEC_RUN_ROADMAP.md](QUEBEC_RUN_ROADMAP.md),
[RENOVATE.md](RENOVATE.md)) and overlap each other. The roadmap marks itself
superseded. Treat `docs/plans/` as the current word.

[MIT](LICENSE).
