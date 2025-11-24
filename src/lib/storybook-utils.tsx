import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'
import enMessages from '../../messages/en.json'
import frMessages from '../../messages/fr.json'

// Mock session data
export const mockSessions = {
  user: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    isAdmin: false,
  } as Session['user'],

  admin: {
    id: 'admin-123',
    name: 'Admin User',
    email: 'admin@example.com',
    isAdmin: true,
  } as Session['user'],

  userWithoutName: {
    id: 'user-456',
    email: 'jane@example.com',
    isAdmin: false,
  } as Session['user'],
}

// Reusable session decorators
export const withSession = (session: Session | null | undefined) => {
  const SessionDecorator = (Story: React.ComponentType) => (
    <SessionProvider session={session}>
      <Story />
    </SessionProvider>
  )
  SessionDecorator.displayName = 'SessionDecorator'
  return SessionDecorator
}

export const withLoggedOutSession = withSession(null)
export const withLoadingSession = withSession(undefined)

export const withUserSession = withSession({
  user: mockSessions.user,
  expires: '2025-12-31',
})

export const withAdminSession = withSession({
  user: mockSessions.admin,
  expires: '2025-12-31',
})

export const withUserSessionNoName = withSession({
  user: mockSessions.userWithoutName,
  expires: '2025-12-31',
})

const messages = { en: enMessages, fr: frMessages }

const IntlDecorator = ({
  locale = 'fr',
  ...props
}: {
  children: ReactNode
  locale: 'en' | 'fr'
}) => (
  <NextIntlClientProvider
    messages={messages[locale]}
    locale={locale}
    {...props}
  />
)

export { IntlDecorator }
