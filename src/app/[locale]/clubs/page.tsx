import { getTranslations } from 'next-intl/server'
import { getClubListing } from '@/lib/services/clubs'
import { ClubCard } from '@/components/clubs/club-card'
import { ClubFilters } from '@/components/clubs/club-filters'
import { LoadMoreList } from '@/components/ui/load-more-list'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'
import { clubsQuerySchema } from '@/lib/schemas'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const t = await getTranslations('clubs')
  const params = await searchParams
  const parsed = clubsQuerySchema.safeParse({
    search: firstString(params.search),
    type: firstString(params.type),
    vibe: firstString(params.vibe),
    beginner: firstString(params.beginner),
  })
  const query = parsed.success ? parsed.data : {}

  const { clubs, facetCounts } = await getClubListing({ data: query })

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      <ClubFilters facetCounts={facetCounts} />

      {clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        <LoadMoreList
          initial={10}
          step={6}
          columns={{ base: 1, md: 2, lg: 3 }}
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
