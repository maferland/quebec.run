'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function PrivacySettingsPage() {
  const t = useTranslations('settings.privacy')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    }
  }, [status, router])

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/data')
      if (!res.ok) throw new Error('Export failed')
      return res.json()
    },
    onSuccess: (data) => {
      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quebec-run-data-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/delete', { method: 'POST' })
      if (!res.ok) throw new Error('Deletion failed')
      return res.json()
    },
    onSuccess: () => {
      // Sign out and redirect
      signOut({ callbackUrl: '/' })
    },
  })

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-12 w-64 bg-surface-secondary rounded-md animate-pulse mb-8" />
        <div className="bg-surface border border-border rounded-lg p-6 mb-6">
          <div className="h-8 w-48 bg-surface-secondary rounded-md animate-pulse mb-4" />
          <div className="h-20 bg-surface-secondary rounded-md animate-pulse" />
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (status !== 'authenticated' || !session) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>

      {/* Export Data */}
      <section className="bg-surface border border-border rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">{t('exportTitle')}</h2>
        <p className="text-text-secondary mb-4">{t('exportDescription')}</p>
        <button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {exportMutation.isPending ? 'Exporting...' : t('exportButton')}
        </button>
      </section>

      {/* Delete Account */}
      <section className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-2">{t('deleteTitle')}</h2>
        <p className="text-text-secondary mb-4">{t('deleteDescription')}</p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            {t('deleteButton')}
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-900 mb-4 font-medium">
              {t('deleteWarning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Deletion'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-200 text-gray-900 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
