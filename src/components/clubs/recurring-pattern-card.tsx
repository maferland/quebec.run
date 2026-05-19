import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { LocationCard } from '@/components/ui/location'
import { describePattern } from '@/lib/utils/rrule-builder'
import { formatHumanFriendlyDate } from '@/lib/utils/date-formatting'
import { useLocale, useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

export type RecurringPatternCardProps = {
  pattern: {
    slug: string
    title: string
    address: string | null
    schedulePattern: string
    nextOccurrence: Date | null
  }
  clubSlug: string
  clubName: string
}

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
  const t = useTranslations('clubs.pattern')

  // Pattern title shouldn't repeat the club name. When the underlying
  // recurring event title equals the club's name (e.g. Faux Mouvement's three
  // weekly slots all share the title "Faux Mouvement"), derive the card label
  // from the slug instead.
  const cardTitle =
    pattern.title === clubName ? titleCase(pattern.slug) : pattern.title

  const schedule =
    describePattern(pattern.schedulePattern, locale) ?? pattern.schedulePattern

  const href = pattern.nextOccurrence
    ? `/clubs/${clubSlug}/events/${pattern.slug}/${format(pattern.nextOccurrence, 'yyyy-MM-dd')}`
    : `/clubs/${clubSlug}/events/${pattern.slug}`

  return (
    <Link href={href} className="block h-full no-underline hover:no-underline">
      <Card
        as="article"
        variant="interactive"
        className="h-full flex flex-col border-l-4 border-primary hover:shadow-lg transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-heading font-bold text-primary hover:underline transition-colors leading-tight">
            {cardTitle}
          </h3>
          {pattern.nextOccurrence && (
            <Tag variant="datetime" icon={Calendar} size="xs">
              {t('next')} {formatHumanFriendlyDate(pattern.nextOccurrence)}
            </Tag>
          )}
        </div>

        <p className="text-sm text-text-secondary font-body mb-4">{schedule}</p>

        {pattern.address && (
          <div className="mt-auto">
            <LocationCard address={pattern.address} />
          </div>
        )}
      </Card>
    </Link>
  )
}
