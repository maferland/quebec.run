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
  // Create platform staff (you)
  const staffUser = await prisma.user.upsert({
    where: { email: 'maferland@quebec.run' },
    update: {
      isStaff: true,
    },
    create: {
      email: 'maferland@quebec.run',
      name: 'Marc-Antoine Ferland',
      isStaff: true,
    },
  })

  // Create test club owners (regular users, not staff)
  const clubOwner1 = await prisma.user.upsert({
    where: { email: 'alice.tremblay@quebec.run' },
    update: {},
    create: {
      email: 'alice.tremblay@quebec.run',
      name: 'Alice Tremblay',
      isStaff: false,
    },
  })

  const clubOwner2 = await prisma.user.upsert({
    where: { email: 'bob.gagnon@quebec.run' },
    update: {},
    create: {
      email: 'bob.gagnon@quebec.run',
      name: 'Bob Gagnon',
      isStaff: false,
    },
  })

  // Create the 6AM Club with its Organization
  const clubSlug = createSlug('6AM Club')
  const clubDescription =
    'Club de course matinal présent dans plusieurs quartiers de Québec. Rendez-vous à 6h pile!'

  // Check if club exists
  let sixAmClub = await prisma.club.findUnique({
    where: { slug: clubSlug },
  })

  if (sixAmClub) {
    // Update existing club
    sixAmClub = await prisma.club.update({
      where: { slug: clubSlug },
      data: {
        description: clubDescription,
        language: 'fr',
        ownerId: staffUser.id,
      },
    })
  } else {
    // Create org and club together
    const org = await prisma.organization.create({
      data: {
        name: '6AM Club',
        slug: `${clubSlug}-org`,
        description: clubDescription,
        isVisible: true, // 6AM Club is a franchise with multiple locations
        ownerId: staffUser.id,
      },
    })

    sixAmClub = await prisma.club.create({
      data: {
        name: '6AM Club',
        slug: clubSlug,
        description: clubDescription,
        language: 'fr',
        ownerId: staffUser.id,
        organizationId: org.id,
      },
    })
  }

  // Create clubs for test owners
  await prisma.club.upsert({
    where: { slug: createSlug('Club Courir Limoilou') },
    update: {
      description: 'Club de course dans Limoilou',
      language: 'fr',
      ownerId: clubOwner1.id,
    },
    create: {
      name: 'Club Courir Limoilou',
      slug: createSlug('Club Courir Limoilou'),
      description: 'Club de course dans Limoilou',
      language: 'fr',
      ownerId: clubOwner1.id,
    },
  })

  await prisma.club.upsert({
    where: { slug: createSlug('Vélo-Course Sainte-Foy') },
    update: {
      description: 'Club mixte vélo et course à Sainte-Foy',
      language: 'fr',
      ownerId: clubOwner2.id,
    },
    create: {
      name: 'Vélo-Course Sainte-Foy',
      slug: createSlug('Vélo-Course Sainte-Foy'),
      description: 'Club mixte vélo et course à Sainte-Foy',
      language: 'fr',
      ownerId: clubOwner2.id,
    },
  })

  // Create recurring events for each neighborhood with correct schedule
  const recurringEvents = [
    {
      title: '6AM Club Saint-Sauveur',
      description: 'Course matinale dans le quartier Saint-Sauveur',
      address: '504 Rue Saint-Vallier O, Québec, QC G1N 0C2',
      latitude: 46.8111749,
      longitude: -71.2414915,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Sillery',
      description: 'Course matinale dans le quartier Sillery',
      address: '2012 Chem. Saint-Louis, Québec, QC G1T 1P1',
      latitude: 46.7705783,
      longitude: -71.2599946,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Maizerets',
      description: 'Course matinale au parc Maizerets',
      address: '2539f Bd Sainte-Anne, Québec, QC G1J 1Y4',
      latitude: 46.8445096,
      longitude: -71.2156864,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Montcalm',
      description: 'Course matinale dans le quartier Montcalm',
      address: '1015 Av. Belvédère, Québec, QC G1S 1S7',
      latitude: 46.7968136,
      longitude: -71.2388083,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Saint-Jean-Baptiste',
      description: 'Course matinale dans le quartier Saint-Jean-Baptiste',
      address: "200 Rue D'Aiguillon, Québec, QC G1R 2Y6",
      latitude: 46.8084437,
      longitude: -71.2252003,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Charlesbourg',
      description: 'Course matinale à Charlesbourg',
      address: '7685 1re Av., Québec, QC G1H 2Y1',
      latitude: 46.8588977,
      longitude: -71.2686599,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Limoilou',
      description: 'Course matinale dans le quartier Limoilou',
      address: '201 Av. 3e, Québec, QC G1L 2T2',
      latitude: 46.821222,
      longitude: -71.2251616,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Neufchâtel',
      description: 'Course matinale à Neufchâtel',
      address: "4141 Bd de l'Auvergne, Québec, QC G2C 2B6",
      latitude: 46.8292239,
      longitude: -71.3477112,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Lac-Beauport',
      description: 'Course matinale à Lac-Beauport',
      address: '1020 Bd du Lac, Lac-Beauport, QC G3B 0W8',
      latitude: 46.936372,
      longitude: -71.308562,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Beauport',
      description: 'Course matinale à Beauport',
      address: '2530 Boul. Louis-XIV, Québec, QC G1C 1B5',
      latitude: 46.8572877,
      longitude: -71.1876652,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
  ]

  // Upsert recurring events (update existing or create new)
  for (const event of recurringEvents) {
    const existing = await prisma.recurringEvent.findFirst({
      where: {
        title: event.title,
        clubId: event.clubId,
      },
    })

    if (existing) {
      await prisma.recurringEvent.update({
        where: { id: existing.id },
        data: event,
      })
    } else {
      await prisma.recurringEvent.create({
        data: event,
      })
    }
  }

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

    // Create next upcoming event
    const baseDate = new Date()
    const daysUntilTarget = (dayCode - baseDate.getDay() + 7) % 7
    const eventDate = new Date(
      baseDate.getTime() + daysUntilTarget * 24 * 60 * 60 * 1000
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
      distance: '5-8 km',
      pace: 'Rythme modéré',
      clubId: sixAmClub.id,
      recurringEventId: recurringEvent.id,
    })
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
