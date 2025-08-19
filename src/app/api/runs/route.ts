import { withAuth, withPublic } from '@/lib/api-middleware'
import { runCreateSchema, runsQuerySchema } from '@/lib/schemas'
import { createRun, getAllRuns } from '@/lib/services/runs'

export const GET = withPublic(runsQuerySchema)(async (data) => {
  const runs = await getAllRuns({ data })
  return Response.json(runs)
})

export const POST = withAuth(runCreateSchema)(async ({ user, data }) => {
  const run = await createRun({ user, data })
  return Response.json(run, { status: 201 })
})
