type EventForUrl = {
  id: string
  slug?: string | null
  recurringSlug?: string | null
  club?: { slug: string } | null
}

const TRAILING_DATE = /--(\d{4}-\d{2}-\d{2})$/

/**
 * Build the canonical URL for an event card / map popup link.
 *
 * Virtual occurrences carry `recurringSlug` and a date suffix in `id`;
 * those become nested URLs scoped to the club. One-off events go to their
 * slug, falling back to the legacy `/events/<id>` URL the legacy route
 * redirects when they predate slugs.
 */
export function eventUrl(event: EventForUrl): string {
  const dateMatch = event.id.match(TRAILING_DATE)
  if (dateMatch && event.recurringSlug && event.club) {
    return `/clubs/${event.club.slug}/events/${event.recurringSlug}/${dateMatch[1]}`
  }
  if (event.slug) return `/run/${event.slug}`
  return `/events/${event.id}`
}
