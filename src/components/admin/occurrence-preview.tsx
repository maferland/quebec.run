'use client'

import { RRule } from 'rrule'
import { format } from 'date-fns'

interface OccurrencePreviewProps {
  pattern: string
  count?: number
}

export function OccurrencePreview({
  pattern,
  count = 5,
}: OccurrencePreviewProps) {
  let dates: Date[] = []
  let error: string | null = null

  try {
    const rule = RRule.fromString(pattern)
    const now = new Date()
    const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    dates = rule.between(now, oneYear, true).slice(0, count)
  } catch {
    error = 'Invalid recurrence pattern'
  }

  if (error) {
    return (
      <div className="text-sm text-red-600" role="alert">
        {error}
      </div>
    )
  }

  if (dates.length === 0) {
    return (
      <div className="text-sm text-text-secondary">No upcoming occurrences</div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Next occurrences:</h4>
      <ol className="space-y-1">
        {dates.map((date, i) => (
          <li key={i} className="text-sm text-text-secondary">
            {format(date, 'EEE, MMM d, yyyy')} at {format(date, 'h:mm a')}
          </li>
        ))}
      </ol>
    </div>
  )
}
