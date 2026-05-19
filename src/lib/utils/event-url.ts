type EventForUrl = {
  id: string
  club?: { slug: string } | null
}

const VIRTUAL_ID = /^(.+)--(\d{4}-\d{2}-\d{2})$/

/**
 * Build the canonical URL for an event card / map popup link.
 *
 * Virtual occurrences carry their parent recurring slug + date in `id`
 * (shape: `<slug>--<YYYY-MM-DD>`); those become nested URLs scoped to
 * the club. Concrete one-off events keep the legacy `/events/<id>` URL,
 * which the legacy route redirects.
 */
export function eventUrl(event: EventForUrl): string {
  const match = event.id.match(VIRTUAL_ID)
  if (match && event.club) {
    const [, slug, date] = match
    return `/clubs/${event.club.slug}/events/${slug}/${date}`
  }
  return `/events/${event.id}`
}
