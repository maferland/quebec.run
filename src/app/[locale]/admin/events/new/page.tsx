import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { EventForm } from '@/components/admin/event-form'
import { redirect } from 'next/navigation'

async function getClubsForSelect() {
  return await prisma.club.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

export default async function NewEventPage() {
  const t = await getTranslations('admin.events')
  const clubs = await getClubsForSelect()

  if (clubs.length === 0) {
    redirect('/admin/clubs/new')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          {t('addNew')}
        </h1>
        <p className="text-text-secondary mt-2">Create a new running event</p>
      </div>

      <EventForm mode="create" clubs={clubs} />
    </div>
  )
}
