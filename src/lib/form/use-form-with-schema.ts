import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { setupZodLocalization } from './zod-localization'

type UseFormWithSchemaProps<T extends z.ZodSchema> = {
  schema: T
} & Omit<UseFormProps<z.infer<T>>, 'resolver'>

export function useFormWithSchema<T extends z.ZodSchema>({
  schema,
  ...options
}: UseFormWithSchemaProps<T>): UseFormReturn<z.infer<T>> {
  const t = useTranslations('validation')

  // Setup Zod localization on mount
  useEffect(() => {
    setupZodLocalization(t)
  }, [t])

  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...options,
  })
}
