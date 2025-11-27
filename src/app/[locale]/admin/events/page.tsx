import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Edit, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { DeleteEventButton } from '@/components/admin/delete-event-button'

async function getAllEventsForAdmin() {
  return await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      time: true,
      address: true,
      club: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { date: 'desc' },
  })
}

export default async function AdminEventsPage() {
  const t = await getTranslations('admin.events')
  const events = await getAllEventsForAdmin()

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary mt-2">
            Manage all running events on the platform
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('addNew')}
          </Button>
        </Link>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary mb-4">No events found</p>
          <Link href="/admin/events/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Event
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
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-surface-variant">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-sm text-text-secondary truncate max-w-xs">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">
                        {event.club.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {event.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary truncate max-w-xs">
                        {event.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </Link>
                        <DeleteEventButton eventId={event.id} />
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
