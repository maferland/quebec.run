import { cn } from '@/lib/utils'

interface FormControlProps {
  name: string
  error?: string
  label?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormControl({
  name,
  error,
  label,
  required,
  children,
  className,
}: FormControlProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <span className="text-red-500">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}
