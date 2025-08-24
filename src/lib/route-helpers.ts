import { NextRequest } from 'next/server'

export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}
