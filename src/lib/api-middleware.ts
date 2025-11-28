import { authOptions } from '@/lib/auth'
import type { ServiceUser } from '@/lib/schemas'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { NotFoundError, UnauthorizedError } from '@/lib/errors'

// Shared type for Next.js route handler context
export type RouteHandlerContext = {
  params: Promise<Record<string, string>>
}

// Internal error handler - DO NOT USE outside this file, use withPublic or withAuth instead
function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)

      // Handle not found errors
      if (error instanceof NotFoundError) {
        return Response.json({ error: error.message }, { status: 404 })
      }

      // Handle unauthorized errors
      if (error instanceof UnauthorizedError) {
        return Response.json({ error: error.message }, { status: 403 })
      }

      // Handle authentication errors
      if (
        error instanceof Error &&
        (error.message === 'Authentication required' ||
          error.message.includes('headers` was called outside a request scope'))
      ) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return Response.json(
          { error: 'Validation failed: ' + error.message },
          { status: 400 }
        )
      }

      // Handle business logic errors (already exists, pending request, etc.)
      if (error instanceof Error) {
        if (
          error.message.includes('already exists') ||
          error.message.includes('Pending deletion request')
        ) {
          return Response.json({ error: error.message }, { status: 400 })
        }
      }

      // Handle other errors
      return Response.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
}

const methodsWithBody = ['POST', 'PUT', 'PATCH']

// Extract all parameters and parse with schema
async function getParams<T extends z.ZodType>(
  request: Request,
  context: RouteHandlerContext,
  schema: T
): Promise<z.infer<T>> {
  const url = new URL(request.url)

  // Extract query parameters
  const queryParams: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value
  })

  // Extract URL parameters from context
  const urlParams = await context.params

  // Parse body only if it exists
  let body = {}
  if (methodsWithBody.includes(request.method)) {
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      body = {}
    }
  }

  const params = { ...urlParams, ...queryParams }

  return schema.parse({ ...params, ...body })
}

// Simplified public routes handler
export function withPublic<T extends z.ZodType>(schema: T) {
  return (fn: (data: z.infer<T>) => Response | Promise<Response>) => {
    return withErrorHandler(
      async (
        request: Request,
        context: RouteHandlerContext
      ): Promise<Response> => {
        const data = await getParams(request, context, schema)
        return await fn(data)
      }
    )
  }
}

// Simplified auth routes handler
export function withAuth<T extends z.ZodType>(schema: T) {
  return (
    fn: (
      args: {
        user: ServiceUser
        data: z.infer<T>
      },
      request: Request
    ) => Response | Promise<Response>
  ) => {
    return withErrorHandler(
      async (
        request: Request,
        context: RouteHandlerContext
      ): Promise<Response> => {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        const user: ServiceUser = {
          id: session.user.id,
          isAdmin: session.user.isAdmin || false,
        }

        const data = await getParams(request, context, schema)
        return await fn({ user, data }, request)
      }
    )
  }
}
