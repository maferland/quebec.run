import {
  useForm,
  UseFormProps,
  UseFormReturn,
  FieldValues,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { setupZodLocalization } from './zod-localization'

type UseFormWithSchemaProps<TFieldValues extends FieldValues> = {
  schema: z.ZodTypeAny
} & Omit<UseFormProps<TFieldValues>, 'resolver'>

export function useFormWithSchema<
  TFieldValues extends FieldValues = FieldValues,
>({
  schema,
  ...options
}: UseFormWithSchemaProps<TFieldValues>): UseFormReturn<TFieldValues> {
  const t = useTranslations('validation')

  // Setup Zod localization on mount
  useEffect(() => {
    setupZodLocalization(t)
  }, [t])

  return useForm<TFieldValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    ...options,
  })
}
