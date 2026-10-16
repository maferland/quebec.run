import type { ErrorEvent as SentryErrorEvent, EventHint } from '@sentry/nextjs'

// A failed <link>/<script>/<img> load hands onerror a DOM Event, not an Error,
// which Sentry files as a titleless issue with no stacktrace (JAVASCRIPT-NEXTJS-3).
export const dropDomEventNoise = (
  event: SentryErrorEvent,
  hint: EventHint
): SentryErrorEvent | null =>
  hint.originalException instanceof Event ? null : event
