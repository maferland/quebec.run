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

  // Create test club owner (regular user, not staff)
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

  // Create recurring events for each 6AM Club location
  // Source: https://6amclub.run (scraped March 2026)
  const recurringEvents = [
    {
      title: '6AM Club Limoilou',
      description: 'Café Smith Limoilou — 201 Av. 3e, Québec',
      address: '201 Av. 3e, Québec, QC G1L 2T2',
      latitude: 46.821222,
      longitude: -71.2251616,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Maizerets',
      description: 'Café Paleta — 2539F Boul. Sainte-Anne, Québec',
      address: '2539F Boul. Sainte-Anne, Québec, QC G1J 1Y4',
      latitude: 46.8445096,
      longitude: -71.2156864,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Saint-Jean-Baptiste',
      description: "Léonord café — 200 Rue d'Aiguillon, Québec",
      address: "200 Rue d'Aiguillon, Québec, QC G1R 2Y6",
      latitude: 46.8084437,
      longitude: -71.2252003,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Saint-Sauveur',
      description: 'Le Philtre Café — 504 Rue Saint-Vallier O, Québec',
      address: '504 Rue Saint-Vallier O, Québec, QC G1N 0C2',
      latitude: 46.8111749,
      longitude: -71.2414915,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Montcalm',
      description: 'Café Smith Montcalm — 1015 Av. Belvédère, Québec',
      address: '1015 Av. Belvédère, Québec, QC G1S 1S7',
      latitude: 46.7968136,
      longitude: -71.2388083,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Charlesbourg',
      description: 'Café La Maison Smith — 7685 1re Av., Québec',
      address: '7685 1re Av., Québec, QC G1H 2Y1',
      latitude: 46.8588977,
      longitude: -71.2686599,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Lévis (Lauzon)',
      description: 'ES Café — 7520 Bd Guillaume-Couture #120, Lévis',
      address: '7520 Bd Guillaume-Couture #120, Lévis, QC G6V 6S5',
      latitude: 46.8148,
      longitude: -71.1573,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Sillery',
      description: 'Café Smith Sillery — 2012 Ch. Saint-Louis, Québec',
      address: '2012 Ch. Saint-Louis, Québec, QC G1T 1P1',
      latitude: 46.7705783,
      longitude: -71.2599946,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Beauport',
      description: 'Tatum Café et Brûlerie — 2530 Bd Louis-XIV, Québec',
      address: '2530 Bd Louis-XIV, Québec, QC G1C 1B5',
      latitude: 46.8572877,
      longitude: -71.1876652,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Lévis (St-Romuald)',
      description: "O'Ravito — 2560 Ch. du Fleuve, St-Romuald",
      address: '2560 Ch. du Fleuve, St-Romuald, QC G6W 1X4',
      latitude: 46.7525,
      longitude: -71.2467,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Neufchâtel',
      description: "Café Paillard — 4141 Bd de l'Auvergne, Québec",
      address: "4141 Bd de l'Auvergne, Québec, QC G2C 2B6",
      latitude: 46.8292239,
      longitude: -71.3477112,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Lac-Beauport',
      description: 'Boutique du Lac — 1020 Bd du Lac, Lac-Beauport',
      address: '1020 Bd du Lac, Lac-Beauport, QC G3B 0W8',
      latitude: 46.936372,
      longitude: -71.308562,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Lévis (St-Nicolas)',
      description: 'Café ES — 1365 Route des Rivières, Lévis',
      address: '1365 Route des Rivières, Lévis, QC G7A 2V6',
      latitude: 46.7148,
      longitude: -71.3583,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Saint-Augustin',
      description:
        "Café les Toques Gourmandes — 3695 Rue de l'Hêtrière #260, Saint-Augustin",
      address:
        "3695 Rue de l'Hêtrière #260, Saint-Augustin-de-Desmaures, QC G3A 2Z5",
      latitude: 46.7397,
      longitude: -71.3717,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Shannon',
      description: 'Chez Denise — 439 Bd Jacques-Cartier, Shannon',
      address: '439 Bd Jacques-Cartier, Shannon, QC G0A 1R2',
      latitude: 46.8833,
      longitude: -71.5167,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Pont-Rouge',
      description:
        'Bougeotte et Placotine — 10 Rue de la Fabrique #101, Pont-Rouge',
      address: '10 Rue de la Fabrique #101, Pont-Rouge, QC G3H 1A1',
      latitude: 46.7558,
      longitude: -71.6942,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
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
