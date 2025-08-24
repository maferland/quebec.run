import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/services/events'
import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import type { PageProps } from '@/lib/types/next'
import { Calendar, MapPin, Clock, Users, ArrowLeft } from 'lucide-react'

export type EventPageProps = PageProps<{ id: string }>

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
  const event = await getEventById({ data: { id } })

  if (!event) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/events"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Events
          </Link>
        </div>

        {/* Event Header */}
        <Card className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {event.title}
              </h1>
              {event.club && (
                <Link
                  href={`/clubs/${event.club.slug}`}
                  className="text-lg text-blue-600 hover:text-blue-800 font-medium"
                >
                  {event.club.name}
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <Tag variant="date">
                {new Date(event.date).toLocaleDateString('fr-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Tag>
              <Tag variant="time">{event.time}</Tag>
            </div>
          </div>

          {event.description && (
            <div className="mb-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Event Details */}
          <div className="flex items-center gap-4 flex-wrap mb-6">
            {event.distance && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Tag variant="distance">{event.distance}</Tag>
              </div>
            )}
            {event.pace && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <Tag variant="pace">{event.pace}</Tag>
              </div>
            )}
          </div>

          {/* Location */}
          {event.address && (
            <Card variant="accent" className="bg-blue-50">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Meeting Location
                  </h3>
                  <p className="text-gray-700">{event.address}</p>
                  {/* TODO: Add map integration here */}
                </div>
              </div>
            </Card>
          )}
        </Card>

        {/* Additional Information */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event Information
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">When</h3>
              <p className="text-gray-700">
                {new Date(event.date).toLocaleDateString('fr-CA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                at {event.time}
              </p>
            </div>

            {event.distance && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Distance</h3>
                <p className="text-gray-700">{event.distance}</p>
              </div>
            )}

            {event.pace && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Pace</h3>
                <p className="text-gray-700">{event.pace}</p>
              </div>
            )}

            {event.club && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Organized by
                </h3>
                <Link
                  href={`/clubs/${event.club.slug}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {event.club.name} →
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
