import { UseFormRegister, FieldValues, Path } from 'react-hook-form'
import { FormControl } from './form-control'
import { useFormField } from '@/lib/form/use-form-field'
import { cn } from '@/lib/utils'

type TFunction = (key: string) => string

interface FormSelectProps<T extends FieldValues = FieldValues> extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  register: UseFormRegister<T>
  name: Path<T>
  t: TFunction
  required?: boolean
  options: { value: string; label: string }[]
}

export function FormSelect<T extends FieldValues = FieldValues>({
  register,
  name,
  t,
  required,
  options,
  className,
  ...props
}: FormSelectProps<T>) {
  const { error, label, hasError, 'aria-invalid': ariaInvalid } = useFormField({ name, t })
  
  return (
    <FormControl
      name={name}
      error={error}
      label={label}
      required={required}
    >
      <select
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
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormControl>
  )
}