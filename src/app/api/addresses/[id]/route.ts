import { withAuth } from '@/lib/api-middleware'
import {
  addressDeleteSchema,
  addressUpdateSchema,
  deleteAddress,
  updateAddress,
} from '@/lib/services/addresses'

export const PUT = withAuth(addressUpdateSchema)(async ({ user, data }) => {
  const address = await updateAddress({ user, data })
  return Response.json(address)
})

export const DELETE = withAuth(addressDeleteSchema)(async ({ user, data }) => {
  await deleteAddress({ user, data })
  return new Response(null, { status: 204 })
})
