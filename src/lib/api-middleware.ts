import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Public routes (no auth required)

// Function overload: withPublic without schema
export function withPublic(): <R>(fn: () => R | Promise<R>) => () => Promise<R>
// Function overload: withPublic with schema  
export function withPublic<T extends z.ZodType>(schema: T): <R>(fn: (data: z.infer<T>) => R | Promise<R>) => (input: unknown) => Promise<R>
export function withPublic<T extends z.ZodType>(schema?: T) {
  if (schema) {
    return <R>(fn: (data: z.infer<T>) => R | Promise<R>) => {
      return async (input: unknown): Promise<R> => {
        const validatedData = schema.parse(input)
        return await fn(validatedData)
      }
    }
  } else {
    return <R>(fn: () => R | Promise<R>) => {
      return async (): Promise<R> => {
        return await fn()
      }
    }
  }
}

// Function overload: withAuth without schema
export function withAuth(): <R>(fn: (user: { id: string; isAdmin: boolean }) => R | Promise<R>) => () => Promise<R>
// Function overload: withAuth with schema
export function withAuth<T extends z.ZodType>(schema: T): <R>(fn: (args: { user: { id: string; isAdmin: boolean }; data: z.infer<T> }) => R | Promise<R>) => (input: unknown) => Promise<R>
export function withAuth<T extends z.ZodType>(schema?: T) {
  if (schema) {
    return <R>(fn: (args: { user: { id: string; isAdmin: boolean }; data: z.infer<T> }) => R | Promise<R>) => {
      return async (input: unknown): Promise<R> => {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
          throw new Error('Authentication required')
        }

        const user = {
          id: session.user.id,
          isAdmin: session.user.isAdmin || false,
        }

        const validatedData = schema.parse(input)
        return await fn({ user, data: validatedData })
      }
    }
  } else {
    return <R>(fn: (user: { id: string; isAdmin: boolean }) => R | Promise<R>) => {
      return async (): Promise<R> => {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
          throw new Error('Authentication required')
        }

        const user = {
          id: session.user.id,
          isAdmin: session.user.isAdmin || false,
        }

        return await fn(user)
      }
    }
  }
}