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
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'Mailhog cannot be used in production. Set USE_RESEND=true or provide RESEND_API_KEY.'
      )
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    createEmailProvider(),
    // Dev-only: bypass email verification
    ...(env.NODE_ENV !== 'production'
      ? [
          CredentialsProvider({
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
                email: user.email,
                name: user.name,
                isStaff: user.isStaff,
              }
            },
          }),
        ]
      : []),
  ],
  pages: {
    // Use path without locale prefix - middleware will add locale automatically
    // Signin page is in [locale]/auth/signin and inherits i18n context from [locale]/layout.tsx
    signIn: '/auth/signin',
    verifyRequest: '/auth/signin',
  },
  callbacks: {
    session: async ({ session, user, token }) => {
      if (session?.user) {
        // For credentials provider, user ID comes from token
        const userId = user?.id || token?.sub
        if (!userId) return session

        session.user.id = userId
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { isStaff: true },
        })
        session.user.isStaff = dbUser?.isStaff ?? false
      }
      return session
    },
  },
}
