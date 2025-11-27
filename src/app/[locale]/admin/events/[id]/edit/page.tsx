import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { EventForm } from '@/components/admin/event-form'
import { notFound } from 'next/navigation'

async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  return event
}

async function getClubsForSelect() {
  return await prisma.club.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('admin.events')
  const { id } = await params
  const event = await getEventById(id)
  const clubs = await getClubsForSelect()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          {t('editEvent')}
        </h1>
        <p className="text-text-secondary mt-2">Update event details</p>
      </div>

      <EventForm mode="edit" initialData={event} clubs={clubs} />
    </div>
  )
}
