type EventForUrl = {
  id: string
  recurringSlug?: string | null
  club?: { slug: string } | null
}

const TRAILING_DATE = /--(\d{4}-\d{2}-\d{2})$/

/**
 * Build the canonical URL for an event card / map popup link.
 *
 * Virtual occurrences carry `recurringSlug` and a date suffix in `id`;
 * those become nested URLs scoped to the club. Concrete one-off events
 * keep the legacy `/events/<id>` URL, which the legacy route redirects.
 */
export function eventUrl(event: EventForUrl): string {
  const dateMatch = event.id.match(TRAILING_DATE)
  if (dateMatch && event.recurringSlug && event.club) {
    return `/clubs/${event.club.slug}/events/${event.recurringSlug}/${dateMatch[1]}`
  }
  return `/events/${event.id}`
}
