'use client'

import { ConsentBanner } from '@/components/consent-banner'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function ConsentBannerWrapper() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: consentData } = useQuery({
    queryKey: ['user-consent'],
    queryFn: async () => {
      const res = await fetch('/api/user/consent')
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!session,
  })

  const consentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/consent', { method: 'POST' })
      if (!res.ok) throw new Error('Consent failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consent'] })
    },
  })

  const showConsentBanner = session && !consentData?.hasConsent

  if (!showConsentBanner) return null

  return <ConsentBanner onAccept={() => consentMutation.mutate()} />
}
