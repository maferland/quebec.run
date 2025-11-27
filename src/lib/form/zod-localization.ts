import { z } from 'zod'

// Type for validation translation function
type ValidationTranslate = (
  key: string,
  params?: Record<string, string | number>
) => string

// Setup Zod error map with localized messages
export function setupZodLocalization(t: ValidationTranslate) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customErrorMap = (issue: any, ctx: any) => {
    switch (issue.code) {
      case 'invalid_type':
        if (issue.expected === 'string') {
          return { message: t('required') }
        }
        return { message: t('invalid_type') }

      case 'too_small':
        if (issue.type === 'string') {
          return { message: t('min_length', { min: issue.minimum }) }
        }
        return { message: t('min_length', { min: issue.minimum }) }

      case 'too_big':
        if (issue.type === 'string') {
          return { message: t('max_length', { max: issue.maximum }) }
        }
        return { message: t('max_length', { max: issue.maximum }) }

      case 'custom':
        return { message: issue.message ?? t('invalid_format') }

      default:
        return { message: ctx.defaultError }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  z.setErrorMap(customErrorMap as any)
}
