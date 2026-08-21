import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  // Full tracing to start; dial back if the free-tier quota gets tight.
  tracesSampleRate: 1,
  // This site has accounts and a privacy policy; never ship user data to Sentry.
  sendDefaultPii: false,
})
