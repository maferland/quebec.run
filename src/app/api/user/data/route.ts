import { withAuth } from '@/lib/api-middleware'
import { dataExportSchema } from '@/lib/schemas'
import { exportUserData } from '@/lib/services/legal'

export const GET = withAuth(dataExportSchema)(async ({ user, data }) => {
  const userData = await exportUserData({ user, data })
  return Response.json(userData)
})
