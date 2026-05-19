import type { GetAllClubsReturn } from '@/lib/services/clubs'
import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { Calendar, Users } from 'lucide-react'

export type ClubCardProps = {
  club: GetAllClubsReturn
}

export function ClubCard({ club }: ClubCardProps) {
  const t = useTranslations('clubs.card')
  const activeRecurringCount = club._count.recurringEvents

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="block h-full no-underline hover:no-underline"
    >
      <Card
        variant="interactive"
        data-testid="club-card"
        className="h-full flex flex-col border-l-4 border-primary hover:shadow-lg transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold text-primary hover:underline transition-colors">
              {club.name}
            </h2>
          </div>

          {/* Active recurring events badge */}
          {activeRecurringCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
              <Calendar className="h-3 w-3" />
              {activeRecurringCount}
            </div>
          )}
        </div>

        {/* Description - truncated */}
        {club.description && (
          <p className="text-text-secondary font-body text-sm mb-4 line-clamp-3 leading-relaxed">
            {club.description}
          </p>
        )}

        {/* Footer with action button */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
          {activeRecurringCount > 0 ? (
            <div className="flex items-center gap-1 text-xs text-text-secondary font-body">
              <Calendar className="h-3 w-3" />
              <span>
                {t('recurringEvents', { count: activeRecurringCount })}
              </span>
            </div>
          ) : (
            <div className="text-xs text-text-secondary font-body" />
          )}
          <div className="text-sm text-primary group-hover:text-primary/80 font-medium font-body">
            {t('viewClub')}
          </div>
        </div>
      </Card>
    </Link>
  )
}
