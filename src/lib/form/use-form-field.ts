import { useFormContext, FieldValues, Path } from 'react-hook-form'
import { getError } from './get-error'

type TFunction = (key: string) => string

interface UseFormFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>
  t: TFunction
}

export function useFormField<T extends FieldValues = FieldValues>({
  name,
  t,
}: UseFormFieldProps<T>) {
  const {
    formState: { errors },
  } = useFormContext<T>()
  const error = getError(errors, name)
  const hasError = !!error

  return {
    error,
    hasError,
    label: t(name),
    'aria-invalid': hasError,
  }
}
