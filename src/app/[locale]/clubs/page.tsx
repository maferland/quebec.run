import { getTranslations } from 'next-intl/server'
import { getAllClubs } from '@/lib/services/clubs'
import { ClubCard } from '@/components/clubs/club-card'
import { LoadMoreList } from '@/components/ui/load-more-list'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClubsPage() {
  const t = await getTranslations('clubs')
  const clubs = await getAllClubs({ data: {} })

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      {clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        <LoadMoreList
          initial={8}
          step={5}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </LoadMoreList>
      )}
    </PageContainer>
  )
}
