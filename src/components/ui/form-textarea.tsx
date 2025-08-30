import { UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { FormControl } from './form-control'
import { useFormField } from '@/lib/form/use-form-field'
import { cn } from '@/lib/utils'

type TFunction = (key: string) => string

interface FormTextareaProps<T extends FieldValues = FieldValues> extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  register: UseFormRegister<T>
  name: Path<T>
  t: TFunction
  required?: boolean
}

export function FormTextarea<T extends FieldValues = FieldValues>({
  register,
  name,
  t,
  required,
  className,
  ...props
}: FormTextareaProps<T>) {
  const { error, label, hasError, 'aria-invalid': ariaInvalid } = useFormField({ name, t })
  
  return (
    <FormControl
      name={name}
      error={error}
      label={label}
      required={required}
    >
      <textarea
        id={name}
        {...register(name)}
        className={cn(
          'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent transition-colors resize-vertical',
          hasError
            ? 'border-red-500 bg-red-50'
            : 'border-border bg-surface hover:border-border-secondary',
          className
        )}
        aria-invalid={ariaInvalid}
        {...props}
      />
    </FormControl>
  )
}