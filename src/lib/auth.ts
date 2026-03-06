import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { Resend } from 'resend'

// Create email provider based on environment configuration
const createEmailProvider = () => {
  if (env.USE_RESEND) {
    const resend = new Resend(env.RESEND_API_KEY)

    return EmailProvider({
      from: env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          await resend.emails.send({
            from: env.EMAIL_FROM,
            to: email,
            subject: 'Sign in to Courses',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Sign in to Courses</h1>
                <p>Click the link below to sign in to your account:</p>
                <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                  Sign In
                </a>
                <p style="color: #666; font-size: 14px;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </div>
            `,
          })
        } catch (error) {
          console.error('Failed to send email with Resend:', error)
          throw error
        }
      },
    })
  } else {
    // Use Mailhog for development ONLY
    // Note: Don't throw at build time - Next.js evaluates this during static analysis
    // The error will surface at runtime if someone tries to sign in without Resend configured
    if (env.NODE_ENV === 'production') {
      // Return a provider that will fail at runtime
      return EmailProvider({
        from: env.EMAIL_FROM,
        sendVerificationRequest: async () => {
          throw new Error(
            'Mailhog cannot be used in production. Set USE_RESEND=true or provide RESEND_API_KEY.'
          )
        },
      })
    }

    console.log('📧 Using Mailhog (development only):', {
      host: env.EMAIL_SERVER_HOST,
      port: env.EMAIL_SERVER_PORT,
    })

    return EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        secure: false,
        auth: undefined,
        tls: {
          rejectUnauthorized: false,
        },
      },
      from: env.EMAIL_FROM,
    })
  }
}

// Dev-only: credentials provider to bypass email verification
const createDevBypassProvider = () => {
  if (env.NODE_ENV === 'production') return null

  return CredentialsProvider({
    id: 'dev-bypass',
    name: 'Dev Bypass',
    credentials: {
      email: { label: 'Email', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        select: { id: true, email: true, name: true, isStaff: true },
      })

      if (!user) return null

      return {
        id: user.id,
        email: user.email!,
        name: user.name,
        isStaff: user.isStaff,
      }
    },
  })
}

const devProvider = createDevBypassProvider()

export const authOptions: NextAuthOptions = {
  // Prisma v5 removed $use method, but adapter expects it in type definition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  session: {
    strategy: 'jwt', // Required for CredentialsProvider
  },
  providers: [createEmailProvider(), ...(devProvider ? [devProvider] : [])],
  pages: {
    // Use path without locale prefix - middleware will add locale automatically
    // Signin page is in [locale]/auth/signin and inherits i18n context from [locale]/layout.tsx
    signIn: '/auth/signin',
    verifyRequest: '/auth/signin',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // On sign-in, store user data in token
      if (user) {
        token.isStaff = user.isStaff
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        session.user.isStaff = token.isStaff as boolean
      }
      return session
    },
  },
}
