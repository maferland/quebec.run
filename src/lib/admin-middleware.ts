import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

/**
 * Admin middleware to protect admin routes
 * Returns the admin user if authenticated and authorized, or throws if not
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/api/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, isAdmin: true }
  })

  if (!user || !user.isAdmin) {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * API middleware for admin routes
 * Returns user or creates error response
 */
export async function withAdminAuth<T>(
  handler: (user: { id: string; email: string; name: string | null; isAdmin: boolean }) => Promise<T>
) {
  try {
    const user = await requireAdmin()
    return await handler(user)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Check if current user is admin (for client-side usage)
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    await requireAdmin()
    return true
  } catch {
    return false
  }
}