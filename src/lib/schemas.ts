import { z } from 'zod'

// Base schemas
export const paginationQuerySchema = z.object({
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
})

// Club schemas
export const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  website: z.string().nullable(),
  instagram: z.string().nullable(),
  facebook: z.string().nullable(),
  language: z.string().nullable(),
  stravaClubId: z.string().nullable(),
  stravaSlug: z.string().nullable(),
  isManual: z.boolean(),
  lastSynced: z.date().nullable(),
  lastSyncStatus: z.string().nullable(),
  lastSyncError: z.string().nullable(),
  lastSyncAttempt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string(),
})

export const clubCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  website: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.string().url('Must be a valid URL').optional()),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  language: z.string().optional(),
})

export const clubUpdateSchema = clubCreateSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
})

// Event schemas
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  date: z.date(),
  time: z.string(),
  address: z.string().nullable(),
  distance: z.string().nullable(),
  pace: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  clubId: z.string(),
})

export const eventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date'),
  time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format'),
  address: z.string().min(1, 'Address is required'),
  distance: z.string().optional(),
  pace: z.string().optional(),
  clubId: z.string().min(1, 'Club ID is required'),
})

export const eventsQuerySchema = paginationQuerySchema.extend({
  clubId: z.string().optional(),
})

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string().min(1, 'Event ID is required'),
})

// Additional schemas needed by services
export const clubIdSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

export const clubSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
})

export const clubDeleteSchema = clubIdSchema

export const eventIdSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
})
export type EventId = z.infer<typeof eventIdSchema>

// User schemas
export const userIdSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
})

export const toggleUserAdminSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  isAdmin: z.boolean(),
})

export const usersQuerySchema = paginationQuerySchema.extend({
  isAdmin: z.enum(['true', 'false']).optional(),
})

// API response schemas
export const clubWithEventsSchema = clubSchema.extend({
  events: z.array(eventSchema).default([]),
})

export const eventWithClubSchema = eventSchema.extend({
  club: clubSchema,
})

// Query parameter schemas - extending base pagination
export const clubsQuerySchema = paginationQuerySchema

// Service function utility types
export type ServiceUser = {
  id: string
  isAdmin: boolean
}

export type PublicPayload<TData> = { data: TData }
export type AuthPayload<TData> = { user: ServiceUser; data: TData }

// Type exports
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export type Club = z.infer<typeof clubSchema>
export type ClubCreate = z.infer<typeof clubCreateSchema>
export type ClubUpdate = z.infer<typeof clubUpdateSchema>
export type ClubDelete = z.infer<typeof clubDeleteSchema>
export type ClubWithEvents = z.infer<typeof clubWithEventsSchema>

export type Event = z.infer<typeof eventSchema>
export type EventCreate = z.infer<typeof eventCreateSchema>
export type EventUpdate = z.infer<typeof eventUpdateSchema>
export type EventWithClub = z.infer<typeof eventWithClubSchema>

export type ClubsQuery = z.infer<typeof clubsQuerySchema>
export type EventsQuery = z.infer<typeof eventsQuerySchema>

export type UserId = z.infer<typeof userIdSchema>
export type ToggleUserAdmin = z.infer<typeof toggleUserAdminSchema>
export type UsersQuery = z.infer<typeof usersQuerySchema>

// Legal schemas
export const consentCreateSchema = z.object({})
export const dataExportSchema = z.object({})
export const deletionRequestSchema = z.object({})
export const deletionCancelSchema = z.object({
  id: z.string().cuid(),
})

export type ConsentCreate = z.infer<typeof consentCreateSchema>
export type DataExport = z.infer<typeof dataExportSchema>
export type DeletionRequest = z.infer<typeof deletionRequestSchema>
export type DeletionCancel = z.infer<typeof deletionCancelSchema>
