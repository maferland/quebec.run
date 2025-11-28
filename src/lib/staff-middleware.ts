import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

/**
 * Staff middleware to protect staff routes
 * Returns the staff user if authenticated and authorized, or throws if not
 */
export async function requireStaff() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, isStaff: true },
  })

  if (!user || !user.isStaff) {
    throw new Error('Staff access required')
  }

  return user
}

/**
 * API middleware for staff routes
 * Returns user or creates error response
 */
export async function withStaffAuth<T>(
  handler: (user: {
    id: string
    email: string
    name: string | null
    isStaff: boolean
  }) => Promise<T>
) {
  try {
    const user = await requireStaff()
    return await handler(user)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Staff access required') {
        return NextResponse.json(
          { error: 'Staff access required' },
          { status: 403 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Check if current user is staff (for client-side usage)
 */
export async function isCurrentUserStaff(): Promise<boolean> {
  try {
    await requireStaff()
    return true
  } catch {
    return false
  }
}
