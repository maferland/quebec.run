import { WEEKDAYS_MON_FIRST, type Weekday } from './weekday'

const SLUG_TO_WEEKDAY: Record<string, Weekday> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
}

export const WEEKDAY_SLUGS = new Set(Object.keys(SLUG_TO_WEEKDAY))

export function isWeekdaySlug(slug: string): boolean {
  return WEEKDAY_SLUGS.has(slug)
}

/** Mon-first position of a weekday slug, or null when the slug names something else. */
export function weekdaySlugOrder(slug: string): number | null {
  const day = SLUG_TO_WEEKDAY[slug]
  return day === undefined ? null : WEEKDAYS_MON_FIRST.indexOf(day)
}
