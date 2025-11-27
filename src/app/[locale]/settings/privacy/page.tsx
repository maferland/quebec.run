'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function PrivacySettingsPage() {
  const t = useTranslations('settings.privacy')
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch pending deletion request
  const { data: deletionData } = useQuery({
    queryKey: ['deletion-request'],
    queryFn: async () => {
      const res = await fetch('/api/user/delete')
      if (!res.ok) throw new Error('Failed to fetch deletion request')
      return res.json()
    },
  })

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

  // Delete request mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/delete', { method: 'POST' })
      if (!res.ok) throw new Error('Deletion request failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] })
      setShowDeleteConfirm(false)
    },
  })

  // Cancel deletion mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user/delete/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Cancel failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-request'] })
    },
  })

  const hasPendingDeletion = deletionData?.hasPendingRequest
  const scheduledDate = hasPendingDeletion
    ? new Date(deletionData.request.scheduledFor).toLocaleDateString()
    : null

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

        {hasPendingDeletion ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">
              {t('pendingDeletion')}
            </h3>
            <p className="text-yellow-800 mb-4">
              {t('pendingDescription', { date: scheduledDate })}
            </p>
            <button
              onClick={() => cancelMutation.mutate(deletionData.request.id)}
              disabled={cancelMutation.isPending}
              className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {cancelMutation.isPending ? 'Cancelling...' : t('cancelButton')}
            </button>
          </div>
        ) : (
          <>
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
                    {deleteMutation.isPending
                      ? 'Processing...'
                      : 'Confirm Deletion'}
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
          </>
        )}
      </section>
    </div>
  )
}
