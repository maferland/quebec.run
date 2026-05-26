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
  const fauxMouvement = await prisma.club.upsert({
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
      website: 'fauxmouvement.cc',
      instagram: 'faux.mouvement',
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
      website: 'fauxmouvement.cc',
      instagram: 'faux.mouvement',
      ownerId: staffUser.id,
    },
  })

  // Les Citrons Pressés
  const citronsPresses = await prisma.club.upsert({
    where: { slug: createSlug('Les Citrons Pressés') },
    update: {
      description:
        'Club de course social — 5km ou 10km (~6:00/km). Lundi et mercredi aux 2 semaines.',
      language: 'fr',
      instagram: 'citronspressesrunclub',
      vibe: 'SOCIAL',
      type: 'ROAD',
      beginnerFriendly: true,
      ownerId: staffUser.id,
    },
    create: {
      name: 'Les Citrons Pressés',
      slug: createSlug('Les Citrons Pressés'),
      description:
        'Club de course social — 5km ou 10km (~6:00/km). Lundi et mercredi aux 2 semaines.',
      language: 'fr',
      instagram: 'citronspressesrunclub',
      vibe: 'SOCIAL',
      type: 'ROAD',
      beginnerFriendly: true,
      ownerId: staffUser.id,
    },
  })

  // La Panthère
  const laPanthere = await prisma.club.upsert({
    where: { slug: createSlug('La Panthère') },
    update: {
      description:
        'Club de course — 5km ou 10km. Mercredi 17h30 et samedi 9h30.',
      language: 'fr',
      instagram: 'clublapanthere',
      vibe: 'SOCIAL',
      type: 'MIXED',
      beginnerFriendly: true,
      ownerId: staffUser.id,
    },
    create: {
      name: 'La Panthère',
      slug: createSlug('La Panthère'),
      description:
        'Club de course — 5km ou 10km. Mercredi 17h30 et samedi 9h30.',
      language: 'fr',
      instagram: 'clublapanthere',
      vibe: 'SOCIAL',
      type: 'MIXED',
      beginnerFriendly: true,
      ownerId: staffUser.id,
    },
  })

  // Volt
  const volt = await prisma.club.upsert({
    where: { slug: createSlug('Volt') },
    update: {
      description:
        'Club de course structuré — entraînements lundi et mercredi 19h. 260$/an ou 90$/trimestre.',
      language: 'fr',
      instagram: 'voltarunclub',
      website: 'clubdecoursevolt.com',
      vibe: 'TRAINING',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
    create: {
      name: 'Volt',
      slug: createSlug('Volt'),
      description:
        'Club de course structuré — entraînements lundi et mercredi 19h. 260$/an ou 90$/trimestre.',
      language: 'fr',
      instagram: 'voltarunclub',
      website: 'clubdecoursevolt.com',
      vibe: 'TRAINING',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
  })

  // Le Crew Run Club
  await prisma.club.upsert({
    where: { slug: createSlug('Le Crew Run Club') },
    update: {
      description:
        'Club de course avec coaching, tapis roulant et musculation. Membership payant.',
      language: 'fr',
      instagram: 'lecrew_runclub',
      website: 'lecrewrunclub.ca',
      vibe: 'TRAINING',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
    create: {
      name: 'Le Crew Run Club',
      slug: createSlug('Le Crew Run Club'),
      description:
        'Club de course avec coaching, tapis roulant et musculation. Membership payant.',
      language: 'fr',
      instagram: 'lecrew_runclub',
      website: 'lecrewrunclub.ca',
      vibe: 'TRAINING',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
  })

  // Club La Foulée
  const laFoulee = await prisma.club.upsert({
    where: { slug: createSlug('Club La Foulée') },
    update: {
      description:
        'Fondé en 1977, 200+ membres. Intervalles le mardi, longues sorties le dimanche (15-25km). 90$/an.',
      language: 'fr',
      website: 'lafoulee.com',
      vibe: 'TRAINING',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
    create: {
      name: 'Club La Foulée',
      slug: createSlug('Club La Foulée'),
      description:
        'Fondé en 1977, 200+ membres. Intervalles le mardi, longues sorties le dimanche (15-25km). 90$/an.',
      language: 'fr',
      website: 'lafoulee.com',
      vibe: 'TRAINING',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
  })

  // Le Coureur Nordique
  const coureurNordique = await prisma.club.upsert({
    where: { slug: createSlug('Le Coureur Nordique') },
    update: {
      description:
        "Course gratuite le mardi à 18h15, toute l'année (pause en décembre). Sans inscription.",
      language: 'fr',
      instagram: 'lecoureurnordique',
      website: 'lecoureurnordique.ca',
      vibe: 'SOCIAL',
      type: 'ROAD',
      beginnerFriendly: true,
      ownerId: staffUser.id,
    },
    create: {
      name: 'Le Coureur Nordique',
      slug: createSlug('Le Coureur Nordique'),
      description:
        "Course gratuite le mardi à 18h15, toute l'année (pause en décembre). Sans inscription.",
      language: 'fr',
      instagram: 'lecoureurnordique',
      website: 'lecoureurnordique.ca',
      vibe: 'SOCIAL',
      type: 'ROAD',
      beginnerFriendly: true,
      ownerId: staffUser.id,
    },
  })

  // Milaprès1000 — Café Mila, Limoilou
  const milapres = await prisma.club.upsert({
    where: { slug: createSlug('Milaprès1000') },
    update: {
      description:
        'Club de course matinal au Café Mila, Limoilou. Rendez-vous tous les mardis à 6h30.',
      language: 'fr',
      website: 'lecafemila.com',
      stravaClubId: '1539164',
      vibe: 'SOCIAL',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
    create: {
      name: 'Milaprès1000',
      slug: createSlug('Milaprès1000'),
      description:
        'Club de course matinal au Café Mila, Limoilou. Rendez-vous tous les mardis à 6h30.',
      language: 'fr',
      website: 'lecafemila.com',
      stravaClubId: '1539164',
      vibe: 'SOCIAL',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
  })

  // Kogi
  const kogi = await prisma.club.upsert({
    where: { slug: createSlug('Kogi') },
    update: {
      description: 'Club de course au Kogi Café, Limoilou.',
      language: 'fr',
      instagram: 'lekogicafe',
      isActive: true,
      vibe: 'SOCIAL',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
    create: {
      name: 'Kogi',
      slug: createSlug('Kogi'),
      description: 'Club de course au Kogi Café, Limoilou.',
      language: 'fr',
      instagram: 'lekogicafe',
      isActive: true,
      vibe: 'SOCIAL',
      type: 'ROAD',
      ownerId: staffUser.id,
    },
  })

  // Club de course On court Parlabas — Lac-Beauport
  const onCourtParlabas = await prisma.club.upsert({
    where: { slug: createSlug('On court Parlabas') },
    update: {
      description:
        'Club de course gratuit. Lundis 18h au Parc du Brûlé, Lac-Beauport (1h, D+), mardis 6h15 au Parlabas café-boutique, Québec (45 min sur route).',
      language: 'fr',
      facebook: 'profile.php?id=61558673138284',
      vibe: 'SOCIAL',
      type: 'MIXED',
      beginnerFriendly: true,
      ownerId: staffUser.id,
    },
    create: {
      name: 'On court Parlabas',
      slug: createSlug('On court Parlabas'),
      description:
        'Club de course gratuit. Lundis 18h au Parc du Brûlé, Lac-Beauport (1h, D+), mardis 6h15 au Parlabas café-boutique, Québec (45 min sur route).',
      language: 'fr',
      facebook: 'profile.php?id=61558673138284',
      vibe: 'SOCIAL',
      type: 'MIXED',
      beginnerFriendly: true,
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
      address: '2539 Boulevard Sainte-Anne, Québec, QC',
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
      address: '504 Rue Saint-Vallier Ouest, Québec, QC',
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
      address: '7520 Boulevard Guillaume-Couture, Lévis, QC',
      latitude: 46.8148,
      longitude: -71.1573,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
    {
      title: '6AM Club Sillery',
      description: 'Café Smith Sillery — 2012 Ch. Saint-Louis, Québec',
      address: '2012 Chemin Saint-Louis, Québec, QC',
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
      address: "3695 Rue de l'Hêtrière, Saint-Augustin-de-Desmaures, QC",
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
      address: '10 Rue de la Fabrique, Pont-Rouge, QC',
      latitude: 46.7558,
      longitude: -71.6942,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=6;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: sixAmClub.id,
    },
  ]

  for (const event of recurringEvents) {
    const slug = createSlug(event.title.replace(/^6AM Club /, ''))
    await prisma.recurringEvent.upsert({
      where: { clubId_slug: { clubId: event.clubId, slug } },
      update: { ...event, slug },
      create: { ...event, slug },
    })
  }

  // Recurring events for other clubs
  // Source: run-clubs-quebec.md (March 2026)
  const otherRecurringEvents = [
    // Faux Mouvement — Tue 6PM, Thu 6PM, Sun 9AM
    {
      title: 'Faux Mouvement',
      slug: 'mardi',
      description: '70 Bd Champlain, Petit-Champlain, Québec (Café de Course)',
      address: '70 Bd Champlain, Québec, QC',
      latitude: 46.8073,
      longitude: -71.2044,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: fauxMouvement.id,
    },
    {
      title: 'Faux Mouvement',
      slug: 'jeudi',
      description: '70 Bd Champlain, Petit-Champlain, Québec (Café de Course)',
      address: '70 Bd Champlain, Québec, QC',
      latitude: 46.8073,
      longitude: -71.2044,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TH;BYHOUR=18;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: fauxMouvement.id,
    },
    {
      title: 'Faux Mouvement',
      slug: 'dimanche',
      description: '70 Bd Champlain, Petit-Champlain, Québec (Café de Course)',
      address: '70 Bd Champlain, Québec, QC',
      latitude: 46.8073,
      longitude: -71.2044,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=SU;BYHOUR=9;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: fauxMouvement.id,
    },
    // Les Citrons Pressés — Mon & Wed 6:30PM
    {
      title: 'Les Citrons Pressés',
      slug: 'lundi',
      description: 'Base des Bambies (près du Centre Vidéotron)',
      address: '250 Boulevard Wilfrid-Hamel, Québec, QC',
      latitude: 46.8297,
      longitude: -71.2484,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=18;BYMINUTE=30',
      timezone: 'America/Toronto',
      clubId: citronsPresses.id,
    },
    {
      title: 'Les Citrons Pressés',
      slug: 'mercredi',
      description: 'Base des Bambies (près du Centre Vidéotron)',
      address: '250 Boulevard Wilfrid-Hamel, Québec, QC',
      latitude: 46.8297,
      longitude: -71.2484,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=18;BYMINUTE=30',
      timezone: 'America/Toronto',
      clubId: citronsPresses.id,
    },
    // La Panthère — Wed 5:30PM, Sat 9:30AM
    {
      title: 'La Panthère',
      slug: 'mercredi',
      description: 'Parking de la Base de plein air de Sainte-Foy',
      address: 'Base de plein air de Sainte-Foy, Québec, QC',
      latitude: 46.7711,
      longitude: -71.2875,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=17;BYMINUTE=30',
      timezone: 'America/Toronto',
      clubId: laPanthere.id,
    },
    {
      title: 'La Panthère',
      slug: 'samedi',
      description: 'Parking de la Base de plein air de Sainte-Foy',
      address: 'Base de plein air de Sainte-Foy, Québec, QC',
      latitude: 46.7711,
      longitude: -71.2875,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=SA;BYHOUR=9;BYMINUTE=30',
      timezone: 'America/Toronto',
      clubId: laPanthere.id,
    },
    // Volt — Mon 7PM, Wed 7PM
    {
      title: 'Volt',
      slug: 'lundi',
      description:
        'Nov–Mar: Centre de glaces Intact Assurance / Avr–Oct: Stade TELUS, Université Laval',
      address: '2300 Rue de la Terrasse, Québec, QC',
      latitude: 46.7808,
      longitude: -71.2747,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=19;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: volt.id,
    },
    {
      title: 'Volt',
      slug: 'mercredi',
      description: 'Intersection Grande-Allée & Bougainville',
      address: '750 Grande Allée Ouest, Québec, QC',
      latitude: 46.7997,
      longitude: -71.2318,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=19;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: volt.id,
    },
    // Le Coureur Nordique — Tue 6:15PM
    {
      title: 'Le Coureur Nordique',
      slug: 'mardi',
      description: '141 Ch. Sainte-Foy, Québec',
      address: '141 Ch. Sainte-Foy, Québec, QC G1R 1T1',
      latitude: 46.8023,
      longitude: -71.2243,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=15',
      timezone: 'America/Toronto',
      clubId: coureurNordique.id,
    },
    // Club La Foulée — Tue intervals, Sun long runs
    {
      title: 'Intervalles',
      slug: 'intervalles-mardi',
      description:
        'Mai–Oct: Polyvalente les Compagnons-de-Cartier, Ste-Foy / Nov–Avr: PEPS',
      address: '2300 Rue de la Terrasse, Québec, QC',
      latitude: 46.7731,
      longitude: -71.2889,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=30',
      timezone: 'America/Toronto',
      clubId: laFoulee.id,
    },
    {
      title: 'Sortie longue',
      slug: 'longue-sortie-dimanche',
      description: '15-25km, lieux variés',
      schedulePattern: 'FREQ=WEEKLY;BYDAY=SU;BYHOUR=8;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: laFoulee.id,
    },
    // Kogi — Tue 18:15 at Kogi Café, Limoilou
    {
      title: 'Kogi',
      slug: 'mardi',
      description: 'Kogi Café — 1104 18e Rue, Limoilou',
      address: '1104 18e Rue, Québec, QC G1J 1Z1',
      latitude: 46.836,
      longitude: -71.22,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=15',
      timezone: 'America/Toronto',
      clubId: kogi.id,
    },
    // Milaprès1000 — Tue 6:30AM at Café Mila, Limoilou
    {
      title: 'Milaprès1000',
      slug: 'mardi',
      description: 'Café Mila — 986 3e Av., Limoilou',
      address: '986 3e Avenue, Québec, QC G1L 2X1',
      latitude: 46.840183,
      longitude: -71.22515,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=30',
      timezone: 'America/Toronto',
      clubId: milapres.id,
    },
    // On court Parlabas — Mon 18:00 at Parc du Brûlé, Tue 6:15 at Parlabas café-boutique
    {
      title: 'On court Parlabas',
      slug: 'lundi',
      description:
        'Parc du Brûlé — 79 Chemin du Brûlé, Lac-Beauport — 1h, party D+',
      address: '79 Chemin du Brûlé, Lac-Beauport, QC',
      latitude: 46.942,
      longitude: -71.3102,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=18;BYMINUTE=0',
      timezone: 'America/Toronto',
      clubId: onCourtParlabas.id,
    },
    {
      title: 'On court Parlabas',
      slug: 'mardi',
      description: 'Parlabas café-boutique — 8 rue George-Muir, Québec',
      address: '8 rue George-Muir, Québec, QC',
      latitude: 46.8996541,
      longitude: -71.3051365,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=6;BYMINUTE=15',
      timezone: 'America/Toronto',
      clubId: onCourtParlabas.id,
    },
  ]

  for (const event of otherRecurringEvents) {
    await prisma.recurringEvent.upsert({
      where: { clubId_slug: { clubId: event.clubId, slug: event.slug } },
      update: event,
      create: event,
    })
  }

  // Seed pace policy.
  // SHARED = single group pace (default for social + training runs alike).
  // INCLUSIVE = pace flexibility built into the run — split groups or
  //   interval-style sessions where runners run at their own effort. Most
  //   "social" clubs still have a pre-set conversational pace, so they're
  //   SHARED, not INCLUSIVE.
  await prisma.recurringEvent.updateMany({
    where: {
      clubId: {
        in: [
          sixAmClub.id,
          fauxMouvement.id,
          kogi.id,
          milapres.id,
          volt.id,
          onCourtParlabas.id,
        ],
      },
    },
    data: { pacePolicy: 'SHARED' },
  })
  await prisma.recurringEvent.updateMany({
    where: {
      OR: [
        { clubId: laFoulee.id, slug: 'intervalles-mardi' },
        { clubId: coureurNordique.id, slug: 'mardi' },
      ],
    },
    data: { pacePolicy: 'OPEN_PACE' },
  })

  // Seed a single concrete override so the "Notable runs" surface has
  // a real example to render against the Kogi recurring pattern.
  const kogiPattern = await prisma.recurringEvent.findFirst({
    where: { clubId: kogi.id, slug: 'mardi' },
  })
  if (kogiPattern) {
    const beerNight = new Date()
    beerNight.setHours(0, 0, 0, 0)
    const offset = (2 - beerNight.getDay() + 14) % 7 || 7
    beerNight.setDate(beerNight.getDate() + offset + 7)
    const existing = await prisma.event.findFirst({
      where: {
        recurringEventId: kogiPattern.id,
        date: {
          gte: beerNight,
          lt: new Date(beerNight.getTime() + 86400000),
        },
      },
      select: { id: true },
    })
    if (!existing) {
      await prisma.event.create({
        data: {
          title: 'Bière au Kogi avec La Souche',
          description:
            'Sortie hebdomadaire suivie d’une bière offerte par La Souche.',
          date: beerNight,
          time: '18:15',
          address: kogiPattern.address,
          latitude: kogiPattern.latitude,
          longitude: kogiPattern.longitude,
          clubId: kogi.id,
          recurringEventId: kogiPattern.id,
          pacePolicy: 'SHARED',
        },
      })
    }
  }

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
