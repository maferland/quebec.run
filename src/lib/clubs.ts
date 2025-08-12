import { prisma } from '@/lib/prisma'

export async function getClubs() {
  return await prisma.club.findMany({
    include: {
      runs: {
        where: {
          date: {
            gte: new Date()
          }
        },
        orderBy: { date: 'asc' },
        take: 2
      }
    }
  })
}

export async function getClubById(id: string) {
  return await prisma.club.findUnique({
    where: { id },
    include: {
      runs: {
        where: {
          date: {
            gte: new Date()
          }
        },
        orderBy: { date: 'asc' }
      }
    }
  })
}