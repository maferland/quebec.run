import { z } from 'zod'

// Type for validation translation function
type ValidationTranslate = (key: string, params?: Record<string, string | number>) => string

// Setup Zod error map with localized messages
export function setupZodLocalization(t: ValidationTranslate) {
  const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.expected === 'string') {
          return { message: t('required') }
        }
        return { message: t('invalid_type') }

      case z.ZodIssueCode.too_small:
        if (issue.type === 'string') {
          return { message: t('min_length', { min: issue.minimum }) }
        }
        return { message: t('min_length', { min: issue.minimum }) }

      case z.ZodIssueCode.too_big:
        if (issue.type === 'string') {
          return { message: t('max_length', { max: issue.maximum }) }
        }
        return { message: t('max_length', { max: issue.maximum }) }

      case z.ZodIssueCode.invalid_string:
        switch (issue.validation) {
          case 'email':
            return { message: t('invalid_email') }
          case 'url':
            return { message: t('invalid_url') }
          default:
            return { message: t('invalid_format') }
        }

      case z.ZodIssueCode.custom:
        return { message: issue.message ?? t('invalid_format') }

      default:
        return { message: ctx.defaultError }
    }
  }

  z.setErrorMap(customErrorMap)
}