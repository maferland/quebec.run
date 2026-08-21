import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

// Catches throws inside server components and route handlers, which is the
// class of failure that took the explore API down unnoticed for a week.
export const onRequestError = Sentry.captureRequestError
