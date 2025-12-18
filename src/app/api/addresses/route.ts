import { withAuth } from '@/lib/api-middleware'
import {
  addressCreateSchema,
  addressesQuerySchema,
  createAddress,
  getAddresses,
} from '@/lib/services/addresses'

export const GET = withAuth(addressesQuerySchema)(async ({ user, data }) => {
  const addresses = await getAddresses({ user, data })
  return Response.json(addresses)
})

export const POST = withAuth(addressCreateSchema)(async ({ user, data }) => {
  const address = await createAddress({ user, data })
  return Response.json(address, { status: 201 })
})
