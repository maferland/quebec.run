import { NextResponse } from 'next/server'
import { generateAllRecurringEvents } from '@/lib/services/recurring-events'

/**
 * Cron endpoint to materialize recurring events
 * Triggered by Vercel Cron (weekly, Sunday 2am UTC)
 */
export async function POST() {
  try {
    const result = await generateAllRecurringEvents(7) // 7 days ahead
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Event materialization failed:', error)

    return NextResponse.json(
      {
        error: 'Materialization failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
