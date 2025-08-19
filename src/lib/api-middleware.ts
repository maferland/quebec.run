import { authOptions } from '@/lib/auth'
import type { ServiceUser } from '@/lib/schemas'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

// Internal error handler - DO NOT USE outside this file, use withPublic or withAuth instead
function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)

      if (
        error instanceof Error &&
        error.message === 'Authentication required'
      ) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      return Response.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      )
    }
  }
}

const methodsWithBody = ['POST', 'PUT', 'PATCH']

// Extract all parameters and parse with schema
async function getParams<T extends z.ZodType>(
  request: Request,
  context: { params?: Record<string, string> } | undefined,
  schema: T
): Promise<z.infer<T>> {
  const url = new URL(request.url)

  // Extract query parameters
  const queryParams: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value
  })

  // Extract URL parameters from context (Next.js provides this)
  const urlParams = context?.params || {}

  const body = methodsWithBody.includes(request.method)
    ? await request.json()
    : {}

  const params = { ...urlParams, ...queryParams }

  return schema.parse({ ...params, ...body })
}

// Simplified public routes handler
export function withPublic<T extends z.ZodType>(schema: T) {
  return (fn: (data: z.infer<T>) => Response | Promise<Response>) => {
    return withErrorHandler(async (request: Request, context?: { params?: Record<string, string> }): Promise<Response> => {
      const data = await getParams(request, context, schema)
      return await fn(data)
    })
  }
}

// Simplified auth routes handler
export function withAuth<T extends z.ZodType>(schema: T) {
  return (fn: (args: { user: ServiceUser; data: z.infer<T> }) => Response | Promise<Response>) => {
    return withErrorHandler(async (request: Request, context?: { params?: Record<string, string> }): Promise<Response> => {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
      }

      const user: ServiceUser = {
        id: session.user.id,
        isAdmin: session.user.isAdmin || false,
      }

      const data = await getParams(request, context, schema)
      return await fn({ user, data })
    })
  }
}

