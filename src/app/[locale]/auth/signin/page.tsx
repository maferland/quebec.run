'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormControl } from '@/components/ui/form-control'
import { PageContainer } from '@/components/ui/page-container'
import { env } from '@/lib/env'
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
  const [devEmail, setDevEmail] = useState('')
  const [devLoading, setDevLoading] = useState(false)

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
      } else {
        setError(result?.error || t('invalidEmail'))
      }
    } catch (error) {
      console.error('Sign-in error:', error)
      setError(t('invalidEmail'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!devEmail) return

    setDevLoading(true)
    try {
      await signIn('dev-bypass', {
        email: devEmail,
        callbackUrl,
        redirect: true,
      })
    } catch (error) {
      console.error('Dev login error:', error)
      setDevLoading(false)
    }
  }

  if (emailSent) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full p-8 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
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
          </Card>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full p-8">
          <div className="mb-8">
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
          </form>

          {env.NODE_ENV !== 'production' && (
            <div className="mt-8 p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                🚧 DEV ONLY - Quick Login
              </h3>
              <form onSubmit={handleDevLogin} className="space-y-2">
                <select
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="w-full p-2 border rounded mb-2 text-sm"
                  disabled={devLoading}
                >
                  <option value="">Select test account...</option>
                  <option value="maferland@quebec.run">
                    Marc-Antoine Ferland (Staff)
                  </option>
                  <option value="alice.tremblay@quebec.run">
                    Alice Tremblay (Club Owner)
                  </option>
                  <option value="bob.gagnon@quebec.run">
                    Bob Gagnon (Club Owner)
                  </option>
                </select>
                <button
                  type="submit"
                  disabled={!devEmail || devLoading}
                  className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {devLoading
                    ? 'Signing in...'
                    : 'Sign in instantly (no email)'}
                </button>
              </form>
              <p className="text-xs text-yellow-700 mt-2">
                This bypass only works in development mode
              </p>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
