import { getAllClubs } from '@/lib/services/clubs'
import { ClubCard } from '@/components/clubs/club-card'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Users } from 'lucide-react'

export default async function ClubsPage() {
  const clubs = await getAllClubs({ data: {} })

  return (
    <PageContainer>
      <PageTitle>Running Clubs</PageTitle>

      {clubs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No running clubs found"
          description="Be the first to create a running club in Quebec City"
        />
      ) : (
        <ContentGrid>
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </ContentGrid>
      )}
    </PageContainer>
  )
}
