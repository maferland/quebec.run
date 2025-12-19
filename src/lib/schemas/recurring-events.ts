import { z } from 'zod'

export const recurringEventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  distance: z.string().optional(),
  pace: z.string().optional(),
  clubId: z.string().min(1, 'Club is required'),

  // Recurrence fields
  schedulePattern: z.string().min(1, 'Schedule pattern is required'),
  timezone: z.string().default('America/Toronto'),
  generateUntil: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const recurringEventUpdateSchema = recurringEventCreateSchema
  .partial()
  .extend({
    id: z.string().min(1, 'ID is required'),
  })

export const recurringEventIdSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

export type RecurringEventCreateInput = z.infer<
  typeof recurringEventCreateSchema
>
export type RecurringEventUpdateInput = z.infer<
  typeof recurringEventUpdateSchema
>
export type RecurringEventIdInput = z.infer<typeof recurringEventIdSchema>
