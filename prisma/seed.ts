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

  // Faux Mouvement - synced from Strava
  await prisma.club.upsert({
    where: { slug: 'fauxmouvement' },
    update: {
      name: 'Faux Mouvement',
      description:
        "Café de Course\nPoint de départ ou d'arrivée, lieu de rencontre, on y trouve d'autres membres de la tribu de celles et ceux qui défie l'apesanteur avec style, peu importe leur niveau athlétique. Nos collections de vêtements exclusives sont choisies avec soin, afin que les membres de notre communauté, soucieux de signifier leur appartenance, puissent se reconnaître dans la rue comme en forêt. Toutes et tous ne partagent pas le même temps au kilomètre, mais leur passion pour la course, qu'ils expriment à travers nous, les unit malgré leurs écarts.",
      stravaClubId: '951639',
      stravaSlug: 'fauxmouvement',
      isManual: false,
      lastSynced: new Date(),
      language: 'fr',
      ownerId: staffUser.id,
    },
    create: {
      name: 'Faux Mouvement',
      slug: 'fauxmouvement',
      description:
        "Café de Course\nPoint de départ ou d'arrivée, lieu de rencontre, on y trouve d'autres membres de la tribu de celles et ceux qui défie l'apesanteur avec style, peu importe leur niveau athlétique. Nos collections de vêtements exclusives sont choisies avec soin, afin que les membres de notre communauté, soucieux de signifier leur appartenance, puissent se reconnaître dans la rue comme en forêt. Toutes et tous ne partagent pas le même temps au kilomètre, mais leur passion pour la course, qu'ils expriment à travers nous, les unit malgré leurs écarts.",
      stravaClubId: '951639',
      stravaSlug: 'fauxmouvement',
      isManual: false,
      lastSynced: new Date(),
      language: 'fr',
      ownerId: staffUser.id,
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
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Sillery',
      description: 'Course matinale dans le quartier Sillery',
      address: '2012 Chem. Saint-Louis, Québec, QC G1T 1P1',
      latitude: 46.7705783,
      longitude: -71.2599946,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Maizerets',
      description: 'Course matinale au parc Maizerets',
      address: '2539f Bd Sainte-Anne, Québec, QC G1J 1Y4',
      latitude: 46.8445096,
      longitude: -71.2156864,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Montcalm',
      description: 'Course matinale dans le quartier Montcalm',
      address: '1015 Av. Belvédère, Québec, QC G1S 1S7',
      latitude: 46.7968136,
      longitude: -71.2388083,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Saint-Jean-Baptiste',
      description: 'Course matinale dans le quartier Saint-Jean-Baptiste',
      address: "200 Rue D'Aiguillon, Québec, QC G1R 2Y6",
      latitude: 46.8084437,
      longitude: -71.2252003,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Charlesbourg',
      description: 'Course matinale à Charlesbourg',
      address: '7685 1re Av., Québec, QC G1H 2Y1',
      latitude: 46.8588977,
      longitude: -71.2686599,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Limoilou',
      description: 'Course matinale dans le quartier Limoilou',
      address: '201 Av. 3e, Québec, QC G1L 2T2',
      latitude: 46.821222,
      longitude: -71.2251616,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Neufchâtel',
      description: 'Course matinale à Neufchâtel',
      address: "4141 Bd de l'Auvergne, Québec, QC G2C 2B6",
      latitude: 46.8292239,
      longitude: -71.3477112,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Lac-Beauport',
      description: 'Course matinale à Lac-Beauport',
      address: '1020 Bd du Lac, Lac-Beauport, QC G3B 0W8',
      latitude: 46.936372,
      longitude: -71.308562,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Beauport',
      description: 'Course matinale à Beauport',
      address: '2530 Boul. Louis-XIV, Québec, QC G1C 1B5',
      latitude: 46.8572877,
      longitude: -71.1876652,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=0',
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

  // No concrete events pre-created — the hybrid system generates
  // virtual events on-the-fly from recurring patterns

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
