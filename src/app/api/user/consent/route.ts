import { withAuth } from '@/lib/api-middleware'
import { consentCreateSchema } from '@/lib/schemas'
import { createUserConsent, getUserConsent } from '@/lib/services/legal'

export const POST = withAuth(consentCreateSchema)(async ({ user, data }, request) => {
  // Capture IP from headers
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const consent = await createUserConsent({ user, data, ipAddress: ip })

  return Response.json(
    { success: true, consentId: consent.id },
    { status: 201 }
  )
})

export const GET = withAuth(consentCreateSchema)(async ({ user }) => {
  const consent = await getUserConsent({ data: {}, userId: user.id })

  return Response.json({
    hasConsent: !!consent,
    consent,
  })
})
