import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getAllClubsForAdmin() {
  return await prisma.club.findMany({
    include: {
      owner: {
        select: { name: true, email: true }
      },
      _count: {
        select: { events: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function AdminClubsPage() {
  const t = await getTranslations('admin.clubs')
  const clubs = await getAllClubsForAdmin()

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary mt-2">
            Manage all running clubs on the platform
          </p>
        </div>
        <Link href="/admin/clubs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('addNew')}
          </Button>
        </Link>
      </div>

      {/* Clubs Table */}
      {clubs.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary mb-4">No clubs found</p>
          <Link href="/admin/clubs/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Club
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-variant border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Events
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clubs.map((club) => (
                  <tr key={club.id} className="hover:bg-surface-variant">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {club.name}
                        </div>
                        <div className="text-sm text-text-secondary truncate max-w-xs">
                          {club.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">
                        {club.owner.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {club.owner.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {club._count.events} events
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary capitalize">
                        {club.language || 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/clubs/${club.slug}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Link href={`/admin/clubs/${club.slug}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </Link>
                        <button className="inline-flex items-center justify-center px-2 py-1 border border-border rounded-md text-xs font-medium text-red-600 bg-surface hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}