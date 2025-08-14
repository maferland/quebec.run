import { NextRequest } from 'next/server'

export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof Error && error.message === 'Authentication required') {
        return Response.json({ error: 'Authentication required' }, { status: 401 })
      }
      
      return Response.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      )
    }
  }
}