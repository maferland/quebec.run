import { cn } from '@/lib/utils'

export type TagVariant =
  | 'date'
  | 'distance'
  | 'pace'
  | 'time'
  | 'training'
  | 'social'

export type TagProps = {
  children: React.ReactNode
  variant: TagVariant
  className?: string
}

const tagVariants: Record<TagVariant, string> = {
  date: 'bg-gray-200 text-gray-700',
  distance: 'bg-green-100 text-green-700',
  pace: 'bg-yellow-100 text-yellow-700',
  time: 'text-white bg-blue-600',
  training: 'bg-purple-100 text-purple-700',
  social: 'bg-pink-100 text-pink-700',
}

export function Tag({ children, variant, className }: TagProps) {
  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-md',
        tagVariants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
