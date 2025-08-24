import { getAllClubs } from '@/lib/services/clubs'
import { ClubCard } from '@/components/clubs/club-card'

export default async function ClubsPage() {
  const clubs = await getAllClubs({ data: {} })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Running Clubs</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>
    </div>
  )
}
