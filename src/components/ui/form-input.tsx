import { UseFormRegister, FieldValues, Path, FieldError } from 'react-hook-form'
import { FormControl } from './form-control'
import { cn } from '@/lib/utils'

export interface FormInputProps<T extends FieldValues = FieldValues>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  register: UseFormRegister<T>
  name: Path<T>
  label: string
  error?: FieldError
  required?: boolean
}

export function FormInput<T extends FieldValues = FieldValues>({
  register,
  name,
  label,
  error,
  required,
  className,
  ...props
}: FormInputProps<T>) {
  const hasError = !!error
  const ariaInvalid = hasError ? 'true' : 'false'

  return (
    <FormControl
      name={name}
      error={error?.message}
      label={label}
      required={required}
    >
      <input
        id={name}
        {...register(name)}
        className={cn(
          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent transition-colors',
          hasError
            ? 'border-red-500 bg-red-50'
            : 'border-border bg-surface hover:border-border-secondary',
          className
        )}
        aria-invalid={ariaInvalid}
        required={required}
        {...props}
      />
    </FormControl>
  )
}
