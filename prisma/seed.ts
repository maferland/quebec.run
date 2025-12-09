import { config } from 'dotenv'
import { PrismaClient } from './generated/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createSlug } from '../src/lib/utils/slug'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'maferland@quebec.run' },
    update: {
      isAdmin: true,
    },
    create: {
      email: 'maferland@quebec.run',
      name: 'Marc-André Ferland',
      isAdmin: true,
    },
  })

  // Create the 6AM Club
  const sixAmClub = await prisma.club.create({
    data: {
      name: '6AM Club',
      slug: createSlug('6AM Club'),
      description:
        'Club de course matinal présent dans plusieurs quartiers de Québec. Rendez-vous à 6h pile!',
      language: 'fr',
      ownerId: adminUser.id,
    },
  })

  // Create recurring events for each neighborhood with correct schedule
  const recurringEvents = [
    {
      title: '6AM Club Saint-Sauveur',
      description: 'Course matinale dans le quartier Saint-Sauveur',
      address: '980 Rue Saint-Vallier O, Québec, QC G1N 1R7',
      latitude: 46.8175,
      longitude: -71.2398,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Sillery',
      description: 'Course matinale dans le quartier Sillery',
      address: '1200 Av. du Bois-de-Coulonge, Québec, QC G1S 2L2',
      latitude: 46.7856,
      longitude: -71.2562,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Maizerets',
      description: 'Course matinale au parc Maizerets',
      address: '2000 Bd de Montmorency, Québec, QC G1J 5E7',
      latitude: 46.8536,
      longitude: -71.1971,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Montcalm',
      description: 'Course matinale dans le quartier Montcalm',
      address: '835 Av. Wilfrid-Laurier, Québec, QC G1R 2L3',
      latitude: 46.8019,
      longitude: -71.2278,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Saint-Jean-Baptiste',
      description: 'Course matinale dans le quartier Saint-Jean-Baptiste',
      address: '560 Rue Saint-Jean, Québec, QC G1R 1P8',
      latitude: 46.8106,
      longitude: -71.2267,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Charlesbourg',
      description: 'Course matinale à Charlesbourg',
      address: '4500 1re Avenue, Québec, QC G1H 2S6',
      latitude: 46.8628,
      longitude: -71.2718,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Limoilou',
      description: 'Course matinale dans le quartier Limoilou',
      address: '250 3e Rue, Québec, QC G1L 2B3',
      latitude: 46.8254,
      longitude: -71.2187,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
  ]

  await prisma.recurringEvent.createMany({
    data: recurringEvents,
    skipDuplicates: true,
  })

  // Create instantiated events from recurring events for the next few weeks
  const recurringEventRecords = await prisma.recurringEvent.findMany({
    where: { clubId: sixAmClub.id },
  })

  const instantiatedEvents = []
  for (const recurringEvent of recurringEventRecords) {
    // Parse BYDAY from schedule pattern (e.g., "FREQ=WEEKLY;BYDAY=MO")
    const dayMap = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 } as const
    const byDayMatch = recurringEvent.schedulePattern.match(/BYDAY=([A-Z]{2})/)

    if (!byDayMatch) {
      throw new Error(
        `Invalid schedule pattern: ${recurringEvent.schedulePattern}`
      )
    }

    const dayCode = dayMap[byDayMatch[1] as keyof typeof dayMap]

    // Create events for next 3 weeks
    for (let week = 0; week < 3; week++) {
      const baseDate = new Date()
      const daysUntilTarget = (dayCode - baseDate.getDay() + 7) % 7
      const eventDate = new Date(
        baseDate.getTime() + (daysUntilTarget + week * 7) * 24 * 60 * 60 * 1000
      )
      eventDate.setHours(6, 0, 0, 0)

      instantiatedEvents.push({
        title: recurringEvent.title,
        description: recurringEvent.description,
        date: eventDate,
        time: '06:00',
        address: recurringEvent.address,
        latitude: recurringEvent.latitude,
        longitude: recurringEvent.longitude,
        geocodedAt:
          recurringEvent.latitude && recurringEvent.longitude
            ? new Date('2025-11-28')
            : null,
        distance: '5-8 km',
        pace: 'Rythme modéré',
        clubId: sixAmClub.id,
        recurringEventId: recurringEvent.id,
      })
    }
  }

  await prisma.event.createMany({
    data: instantiatedEvents,
    skipDuplicates: true,
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
