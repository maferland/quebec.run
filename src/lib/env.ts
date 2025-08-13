import { z } from 'zod'

const envSchema = z
  .object({
    // Database
    DATABASE_URL: z.string().url('Invalid database URL'),
    TEST_DATABASE_URL: z.string().url('Invalid test database URL').optional(),

    // NextAuth
    NEXTAUTH_SECRET: z
      .string()
      .min(32, 'NextAuth secret must be at least 32 characters'),
    NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),

    // Email configuration
    EMAIL_FROM: z.string().email('Invalid email address'),
    USE_RESEND: z
      .string()
      .transform((val) => val === 'true')
      .default('true'),

    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    // Resend (required if USE_RESEND is true)
    RESEND_API_KEY: z.string().optional(),

    // Mailhog (required if USE_RESEND is false)
    EMAIL_SERVER_HOST: z.string().optional(),
    EMAIL_SERVER_PORT: z.coerce.number().optional(),
    EMAIL_SERVER_USER: z.string().optional(),
    EMAIL_SERVER_PASSWORD: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.USE_RESEND) {
        return data.RESEND_API_KEY && data.RESEND_API_KEY.startsWith('re_')
      } else {
        return data.EMAIL_SERVER_HOST && data.EMAIL_SERVER_PORT
      }
    },
    {
      message:
        'If USE_RESEND=true, RESEND_API_KEY is required. If USE_RESEND=false, EMAIL_SERVER_HOST and EMAIL_SERVER_PORT are required.',
      path: ['email_config'],
    }
  )

export type Env = z.infer<typeof envSchema>

// Validate and export environment variables
export const env = envSchema.parse(process.env)
