import { prisma } from '@/lib/prisma'

export async function getUpcomingRuns() {
  return await prisma.run.findMany({
    where: {
      date: {
        gte: new Date()
      }
    },
    include: {
      club: true
    },
    orderBy: { date: 'asc' }
  })
}