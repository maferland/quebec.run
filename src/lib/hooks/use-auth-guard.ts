import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Redirects authenticated users away from guest-only pages
 * Uses router.replace to prevent back navigation
 */
export function useAuthGuard(redirectTo: string = '/') {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace(redirectTo)
    }
  }, [status, session, router, redirectTo])

  return { isRedirecting: status === 'authenticated' && !!session }
}
