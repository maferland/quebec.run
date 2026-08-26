'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ErrorState, RetryIcon } from '@/components/error/error-state'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error.500')

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <ErrorState
      variant="wall"
      title={t('title')}
      lede={t('body')}
      meta={t('meta')}
      actions={
        <>
          <button
            type="button"
            onClick={reset}
            className="qr-error-btn is-primary"
          >
            <RetryIcon />
            {t('primary')}
          </button>
          <Link href="/" className="qr-error-btn is-ghost">
            {t('second')}
          </Link>
        </>
      }
    />
  )
}
