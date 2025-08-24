import { HttpResponse } from 'msw'
import { vi } from 'vitest'

type RequestDetails = {
  method: string
  url: string
  pathname: string
  searchParams: Record<string, string>
  body?: unknown
}

type StaticHandlerOptions<T> = {
  type: 'static'
  code?: number
  response: T
}

type DynamicHandlerOptions<T> = {
  type: 'dynamic'
  cb: (details: RequestDetails) => { response: T; code?: number }
}

type HandlerOptions<T> = StaticHandlerOptions<T> | DynamicHandlerOptions<T>

export function createMockHandler<T>(options: HandlerOptions<T>) {
  // Create the mock function that will be called inside the handler
  const mock = vi.fn()

  // Create the handler that calls the mock
  const handler = async ({ request }: { request: Request }) => {
    const url = new URL(request.url)

    const details: RequestDetails = {
      method: request.method,
      url: request.url,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      body: ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? await request.json().catch(() => null)
        : undefined,
    }

    // Always call the mock to track the request
    mock(details)

    // Use discriminated union to determine response
    const { code = 200, response } =
      options.type === 'static'
        ? { response: options.response, code: options.code }
        : options.cb(details)

    return new HttpResponse(JSON.stringify(response), {
      status: code,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return { mock, handler }
}
