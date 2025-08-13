import { initTRPC, TRPCError } from '@trpc/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Create context
export async function createTRPCContext() {
  const session = await getServerSession(authOptions)

  return {
    prisma,
    session,
  }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

// Initialize tRPC
const t = initTRPC.context<Context>().create()

// Base router and procedure helpers
export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

// Clubs router
const clubsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.club.findMany({
      include: {
        runs: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
          take: 2,
        },
      },
    })
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await ctx.prisma.club.findUnique({
      where: { id: input },
      include: {
        runs: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    })
  }),
})

// Runs router
const runsRouter = router({
  getUpcoming: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.run.findMany({
      where: {
        date: {
          gte: new Date(),
        },
      },
      include: {
        club: true,
      },
      orderBy: { date: 'asc' },
    })
  }),
})

// Main app router
export const appRouter = router({
  clubs: clubsRouter,
  runs: runsRouter,
})

export type AppRouter = typeof appRouter
