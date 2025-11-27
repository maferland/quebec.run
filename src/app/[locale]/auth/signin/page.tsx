'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormControl } from '@/components/ui/form-control'
import { Link } from '@/components/ui/link'
import { PageContainer } from '@/components/ui/page-container'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const t = useTranslations('auth')
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(email)) {
      setError(t('invalidEmail'))
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('email', {
        email,
        callbackUrl,
        redirect: false,
      })

      if (result?.ok) {
        setEmailSent(true)
      }
    } catch {
      setError(t('invalidEmail'))
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('checkYourEmail')}
            </h1>
            <p className="text-text-secondary">
              {t('magicLinkSent')}{' '}
              <strong className="text-text-primary">{email}</strong>
            </p>
            <p className="text-sm text-text-secondary">{t('checkSpam')}</p>
            <Link href="/" className="inline-block mt-4">
              {t('backToHome')}
            </Link>
          </Card>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('signInTitle')}
            </h1>
            <p className="text-text-secondary">{t('signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <FormControl label={t('emailLabel')} error={error} name="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                autoComplete="email"
                autoFocus
              />
            </FormControl>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('sendingLink') : t('sendMagicLink')}
            </Button>

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {t('backToHome')}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  )
}
