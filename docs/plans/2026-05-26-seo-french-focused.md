# SEO plan — quebec.run (fr-primary, en secondary)

## Goal

Make quebec.run rank for the French queries Quebec City runners actually type. Today the site has only generic title/description on the root layout — no structured data, no sitemap, no hreflang, no robots.

Primary target queries (fr):

- _"club de course québec"_, _"club de course québec ville"_
- _"course matinale québec"_, _"6am club québec"_
- _"où courir à québec"_, _"running québec"_
- _"course à pied québec"_, _"clubs running québec"_
- Long-tail: _"club de course faux mouvement"_, _"course mardi soir québec"_, etc.

Secondary (en, for visitors): _"running clubs quebec city"_, _"morning runs quebec city"_.

## Out of scope for this plan

- Paid SEM, backlink work, Google Business Profile.
- Content marketing (blog posts).
- Image alt-text audit — separate a11y/SEO sweep.

## Stack constraints

- Next.js 15 App Router. Use the built-in `Metadata` + `sitemap.ts` + `robots.ts` APIs — no `next-seo`, no `next-sitemap`.
- next-intl with `[locale]` route. Locale-aware metadata via `getTranslations({locale, namespace: 'metadata'})` (already in place on root layout).
- Pages already `force-dynamic` where they need live DB data — that's fine for sitemap if we generate it at runtime.

## Work breakdown — order matters

The list below is the order I'd ship. Each item is its own PR unless flagged.

### 1. Page-level metadata + Open Graph (PR-1)

**What:** Every public route exports `generateMetadata` returning a `Metadata` object with `title`, `description`, `openGraph`, `twitter`, `alternates.canonical`, `alternates.languages` (hreflang). Use locale-aware strings from `messages/{fr,en}.json`.

**Pages to cover:**

- `/[locale]` (home) — already has title/description; add OG image, canonical, hreflang.
- `/[locale]/clubs`
- `/[locale]/clubs/[slug]`
- `/[locale]/events`
- `/[locale]/events/[eventSlug]` and the nested `/clubs/[slug]/events/[eventSlug]/[date]` detail page
- `/[locale]/calendar`
- `/[locale]/legal/privacy` + `/[locale]/legal/terms` (already have generateMetadata — verify OG)

**OG images:** Single static brand OG at `/public/og-default.jpg` (1200×630). Per-club + per-event dynamic OGs later (`opengraph-image.tsx` with `ImageResponse`) — not in this PR. Note that on club + event pages.

**Canonical URLs:** Always `https://quebec.run/<locale>/<path>` with `<locale>` matching the page. Per-event pages need their slug-based URL.

**Hreflang:** Each page sets `alternates.languages = { 'fr-CA': fr URL, 'en-CA': en URL, 'x-default': fr URL }`. fr is the default since the audience is Quebec.

**i18n message keys to add:**

```
metadata.home.{title,description}     // exists
metadata.clubs.{title,description}
metadata.clubs.club.{title,description}    // ICU vars: {clubName}
metadata.events.{title,description}
metadata.events.event.{title,description}  // ICU vars: {eventTitle, clubName, date}
metadata.calendar.{title,description}
metadata.og.image                          // path to default OG image
```

**Acceptance:**

- `curl https://quebec.run/fr/clubs | grep -E '<title|og:|canonical|hreflang' ` shows all four families populated.
- Lighthouse SEO ≥ 90 on `/fr/clubs` and `/fr`.
- Google Rich Results test passes (no errors) on those URLs once deployed.

### 2. Structured data — JSON-LD (PR-2)

**What:** Inject `<script type="application/ld+json">` blocks scoped per page type.

| Page type        | Schema.org type                                  | Notes                                                                                                                                       |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Home             | `Organization` + `WebSite` + `BreadcrumbList`    | `WebSite` exposes the in-site SearchAction (Google sitelinks search box)                                                                    |
| Club detail      | `SportsOrganization` (subtype of `Organization`) | name, description, url, sameAs (instagram/strava/facebook), areaServed                                                                      |
| Event detail     | `Event` (or `BroadcastEvent` if recurring)       | name, location ({addressLocality, postalCode, streetAddress}), start/end, organizer (club), isAccessibleForFree:true, eventStatus           |
| Recurring events | repeated `Event` per next occurrence             | For now emit only the next concrete occurrence per pattern. Recurrence as a separate JSON-LD `EventSeries` later (not standardized enough). |
| All pages        | `BreadcrumbList`                                 | Reuse the breadcrumb already on event detail; emit JSON-LD alongside the visual breadcrumb.                                                 |

**Implementation:** Small `<JsonLd>` server component at `src/components/seo/json-ld.tsx` that serializes + `dangerouslySetInnerHTML`s the script tag. Each page composes its own object.

**Acceptance:**

- Rich Results test green for `/fr/clubs/fauxmouvement`.
- Rich Results test green for `/fr/clubs/fauxmouvement/events/jeudi/2026-05-21`.
- No warnings about missing required fields.

### 3. Sitemap + robots (PR-3)

**What:** `src/app/sitemap.ts` (App Router convention) emits a dynamic XML sitemap from the DB. `src/app/robots.ts` emits a `robots.txt` allowing crawling + pointing at the sitemap.

**Sitemap entries:**

- `/fr/`, `/en/` — `priority 1.0`, `changeFrequency 'daily'`
- `/fr/clubs`, `/en/clubs` — `priority 0.9`, `changeFrequency 'daily'`
- `/fr/events`, `/en/events`, `/fr/calendar`, `/en/calendar` — `priority 0.8`
- One entry per club: `/fr/clubs/<slug>`, `/en/clubs/<slug>` — `priority 0.7`, `lastModified = club.updatedAt`
- Skip individual recurring-event URLs for now — they're virtual and there are hundreds. Reconsider once we have stable concrete-event canonicals.
- Each URL emits `alternates.languages` so Google sees the fr/en pair as canonical for that locale.

**robots.txt:**

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://quebec.run/sitemap.xml
```

**Acceptance:**

- `curl https://quebec.run/sitemap.xml` returns valid XML with ≥ 1 entry per active club.
- `curl https://quebec.run/robots.txt` returns the above.
- Submit sitemap to Google Search Console after first prod deploy.

### 4. Hreflang + canonical sanity sweep (PR-4 — small)

**What:** Audit existing pages for stale canonicals, double-locale paths, redirect chains. The shared metadata helper from PR-1 should already enforce this — this PR is the verification pass.

**Acceptance:**

- `npx playwright test e2e/seo-headers.spec.ts` runs a smoke check on each top-level page: canonical present + matches URL, hreflang has both languages + x-default, title + description non-empty.

## Implementation order suggestion

PR-1 → PR-2 → PR-3 → PR-4. PR-3 (sitemap) depends on canonical URLs being stable, which PR-1 settles. PR-2 (JSON-LD) is independent and could move ahead of PR-3 if PR-1 ships first.

Optional: roll PR-1 + PR-4 together since they touch the same code.

## Verification path post-deploy

1. Submit sitemap to Google Search Console.
2. Use the URL Inspection tool on `/fr/clubs`, `/fr/clubs/fauxmouvement`, `/fr/clubs/fauxmouvement/events/jeudi/2026-05-21` — confirm Google can crawl + sees structured data.
3. Wait 2-3 weeks, check the Search Console "Coverage" + "Enhancements > Events" reports.
4. Track ranking for the 3-5 primary fr queries weekly for the first month.

## Things we're explicitly deferring

- Dynamic OG images per club + event (will add when we have real photos)
- French event-specific schema markup (`EventSeries` doesn't have wide search support yet)
- Local business markup (`SportsActivityLocation`) — clubs aren't physical businesses we own; using `SportsOrganization` instead
- Inline FAQ schema — wait until there's actual FAQ content
- AMP — irrelevant in 2026

## Open questions

- Pull Quebec-area `addressRegion` from each club via geocoding result we already cache? Currently we have lat/lng + raw address strings. Schema.org wants structured `PostalAddress`. Worth a parsing pass during PR-2.
- Should the canonical for `/en/clubs/fauxmouvement` point to itself or to `/fr/clubs/fauxmouvement`? Going with self-canonical + hreflang per Google best practice.
