import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@courses.local' },
    update: {},
    create: {
      email: 'admin@courses.local',
      name: 'Admin User',
      isAdmin: true,
    },
  })

  // Create some run clubs in Quebec City
  const clubs = [
    {
      name: 'Club de Course Vieux-Québec',
      description:
        'Découvrez les rues historiques de Québec en courant avec nous chaque semaine.',
      address: '1 Place des Canotiers, Québec, QC G1K 4E4',
      website: 'https://example.com/vieux-quebec',
      createdBy: adminUser.id,
    },
    {
      name: "Runners des Plaines d'Abraham",
      description:
        "Entraînements sur les magnifiques plaines d'Abraham, adaptés à tous les niveaux.",
      address: '835 Av. Wilfrid-Laurier, Québec, QC G1R 2L3',
      website: 'https://example.com/plaines',
      createdBy: adminUser.id,
    },
    {
      name: 'Course Limoilou',
      description:
        'Club communautaire du quartier Limoilou, ambiance décontractée et parcours variés.',
      address: '250 3e Rue, Québec, QC G1L 2B3',
      createdBy: adminUser.id,
    },
    {
      name: 'Trail Runners Capitale-Nationale',
      description:
        'Pour les amateurs de course en sentier dans la région de Québec et ses environs.',
      address: '2300 Rue Sicotte, Québec, QC G1P 2K5',
      instagram: '@trailrunners_qc',
      createdBy: adminUser.id,
    },
  ]

  const createdClubs = await prisma.club.createMany({
    data: clubs,
    skipDuplicates: true,
  })

  // Get the created clubs to create runs
  const clubRecords = await prisma.club.findMany({
    where: { name: { in: clubs.map((c) => c.name) } },
  })

  // Create runs for each club
  const allRuns = []
  for (const club of clubRecords) {
    const runs = [
      {
        title: 'Course du mercredi soir',
        description: 'Notre entraînement hebdomadaire régulier',
        date: new Date('2025-01-15T18:30:00'),
        time: '18:30',
        address: club.address,
        distance: '5-8 km',
        pace: 'Rythme modéré',
        clubId: club.id,
      },
      {
        title: 'Long run du samedi',
        description: "Course longue pour améliorer l'endurance",
        date: new Date('2025-01-18T09:00:00'),
        time: '09:00',
        address: club.address,
        distance: '12-15 km',
        pace: 'Rythme facile',
        clubId: club.id,
      },
    ]
    allRuns.push(...runs)
  }

  await prisma.run.createMany({
    data: allRuns,
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
