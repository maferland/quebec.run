import { FormProvider, UseFormReturn, FieldValues } from 'react-hook-form'

interface FormProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>
  onSubmit: (data: T) => void | Promise<void>
  children: React.ReactNode
}

export function Form<T extends FieldValues = FieldValues>({
  form,
  onSubmit,
  children,
}: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {children}
      </form>
    </FormProvider>
  )
}
