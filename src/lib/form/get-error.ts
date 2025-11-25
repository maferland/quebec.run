import { FieldValues, Path, FieldErrors } from 'react-hook-form'

export function getError<T extends FieldValues>(
  errors: FieldErrors<T>,
  name: Path<T>
): string | undefined {
  const error = errors[name]
  return error?.message as string | undefined
}
