import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { LocationInline } from '@/components/ui/location'
import { Tag } from '@/components/ui/tag'
import { describePattern, parseRRuleToForm } from '@/lib/utils/rrule-builder'
import { formatHumanFriendlyDate } from '@/lib/utils/date-formatting'
import { useLocale, useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { UserCheck } from 'lucide-react'

export type RecurringPatternCardProps = {
  pattern: {
    slug: string
    title: string
    address: string | null
    schedulePattern: string
    nextOccurrence: Date | null
    pace?: string | null
    pacePolicy?: 'SHARED' | 'INCLUSIVE' | null
  }
  clubSlug: string
  clubName: string
}

const WEEKDAYS = new Set([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
])

const titleCase = (value: string) =>
  value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export function RecurringPatternCard({
  pattern,
  clubSlug,
  clubName,
}: RecurringPatternCardProps) {
  const locale = useLocale() as 'en' | 'fr'
  const t = useTranslations('events')

  // Pattern label shouldn't repeat the club name. When the recurring event
  // title equals the club's (Faux Mouvement × 3), derive from the slug.
  const label =
    pattern.title === clubName ? titleCase(pattern.slug) : pattern.title

  // If the label is just a weekday word (Mardi, Tuesday, etc.) it duplicates
  // the date below — skip it.
  const showLabel = !WEEKDAYS.has(label.toLowerCase())

  const schedule =
    describePattern(pattern.schedulePattern, locale) ?? pattern.schedulePattern
  const time = parseRRuleToForm(pattern.schedulePattern).time

  const href = pattern.nextOccurrence
    ? `/clubs/${clubSlug}/events/${pattern.slug}/${format(pattern.nextOccurrence, 'yyyy-MM-dd')}`
    : `/clubs/${clubSlug}/events/${pattern.slug}`

  return (
    <Link href={href} className="block h-full no-underline hover:no-underline">
      <Card
        as="article"
        variant="interactive"
        className="h-full flex flex-col border-l-4 border-primary p-2 md:p-4 hover:shadow-lg transition-all duration-200"
      >
        <div className="mb-2">
          <p className="text-lg font-heading font-semibold text-primary leading-tight">
            {pattern.nextOccurrence ? (
              <>
                {formatHumanFriendlyDate(pattern.nextOccurrence, {
                  locale: locale === 'fr' ? 'fr-CA' : 'en-US',
                })}
                <span className="text-text-secondary"> · </span>
                {time}
              </>
            ) : (
              schedule
            )}
          </p>
          <p className="text-sm text-text-secondary mt-0.5">
            {showLabel ? label : schedule}
          </p>
        </div>

        {showLabel && (
          <p className="hidden md:block text-sm text-text-secondary font-body mb-3">
            {schedule}
          </p>
        )}

        {pattern.address && (
          <div className="mt-auto">
            <LocationInline address={pattern.address} className="text-sm" />
          </div>
        )}

        {pattern.pacePolicy === 'INCLUSIVE' && (
          <div className="mt-2">
            <Tag colorScheme="success" icon={UserCheck} size="xs">
              {t('pacePolicy.inclusive')}
            </Tag>
          </div>
        )}
      </Card>
    </Link>
  )
}
