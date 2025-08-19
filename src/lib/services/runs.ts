import { prisma } from '@/lib/prisma'
import type { RunsQuery, RunCreate, PublicPayload, AuthPayload } from '@/lib/schemas'

// Pure business logic functions - let TypeScript infer return types

export const getAllRuns = async ({ data }: PublicPayload<RunsQuery>) => {
  const { limit = 50, offset = 0, clubId } = data
  
  const where = clubId ? { clubId } : {}

  const runs = await prisma.run.findMany({
    where,
    orderBy: { date: 'asc' },
    take: limit,
    skip: offset,
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return runs
}

export const createRun = async ({ data }: AuthPayload<RunCreate>) => {
  const run = await prisma.run.create({
    data: {
      ...data,
      date: new Date(data.date),
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return run
}