import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Redirects authenticated users away from guest-only pages
 * Uses router.replace to prevent back navigation
 */
export function useAuthGuard(
  redirectTo: string = '/',
  options?: { skip?: boolean }
) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (options?.skip || hasRedirected.current) return

    if (status === 'authenticated' && session) {
      hasRedirected.current = true
      router.replace(redirectTo)
    }
  }, [status, session, router, redirectTo, options?.skip])

  return { isRedirecting: status === 'authenticated' && !!session }
}
