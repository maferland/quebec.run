import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
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
  providers: [createEmailProvider()],
  pages: {
    // Use locale-independent path - NextAuth doesn't support dynamic locales
    // Auth pages moved outside [locale] directory to avoid hardcoding language
    signIn: '/auth/signin',
    verifyRequest: '/auth/signin',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id
        // Check if user is admin
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true },
        })
        session.user.isAdmin = dbUser?.isAdmin ?? false
      }
      return session
    },
  },
}
