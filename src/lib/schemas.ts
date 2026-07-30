import { z } from 'zod'

// Explore API schemas
export const exploreDaySchema = z.object({
  day: z.coerce.number().int().min(0).max(6).default(0),
})

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
  stravaClubId: z.string().nullable().optional(),
  stravaSlug: z.string().nullable().optional(),
  isManual: z.boolean().optional(),
  lastSynced: z
    .union([z.string(), z.date(), z.null(), z.undefined()])
    .transform((val) => {
      if (!val || val === null || val === undefined) return null
      if (val instanceof Date) return val
      return new Date(val)
    })
    .nullable()
    .optional(),
})

export const clubUpdateSchema = clubCreateSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
})

// Strava schemas
export const stravaClubIdSchema = z.object({
  clubId: z.string().min(1, 'Club ID is required'),
})

export const stravaSyncResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  memberCount: z.number(),
  location: z.string(),
})

// Event schemas
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  date: z.date(),
  time: z.string(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
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
  address: z.string().optional(),
  distance: z.string().optional(),
  pace: z.string().optional(),
  clubId: z.string().min(1, 'Club ID is required'),
  savedAddress: z.string().optional(),
})

export const eventsQuerySchema = paginationQuerySchema.extend({
  clubId: z.string().optional(),
  clubSlug: z.string().optional(),
  search: z.string().optional(),
  pacePolicy: z.enum(['OPEN_PACE', 'SHARED']).optional(),
  timeOfDay: z.enum(['morning', 'evening']).optional(),
  weekend: z.enum(['1']).optional(),
  clubVibe: z.enum(['SOCIAL', 'TRAINING']).optional(),
  beginner: z.enum(['1']).optional(),
  showPast: z.enum(['1']).optional(),
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

export const eventByClubAndSlugSchema = z.object({
  clubSlug: z.string().min(1, 'Club slug is required'),
  eventSlug: z.string().min(1, 'Event slug is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})
export type EventByClubAndSlug = z.infer<typeof eventByClubAndSlugSchema>

export const eventByClubAndSlugBareSchema = z.object({
  clubSlug: z.string().min(1, 'Club slug is required'),
  eventSlug: z.string().min(1, 'Event slug is required'),
})
export type EventByClubAndSlugBare = z.infer<
  typeof eventByClubAndSlugBareSchema
>

// Explore run detail response — /api/explore/runs/[id] answers with either an
// occurrence synthesized from a recurring pattern or a stored one-off event.
// Only the synthesized one carries `recurringSlug`, and it can never be
// cancelled: cancelling an occurrence materializes a stored event instead.
export const runDetailClubSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(['ROAD', 'TRAIL']).nullable(),
  vibe: z.enum(['SOCIAL', 'TRAINING']).nullable(),
  beginnerFriendly: z.boolean(),
  paceMin: z.string().nullable(),
  paceMax: z.string().nullable(),
})
export type RunDetailClub = z.infer<typeof runDetailClubSchema>

const runDetailSharedShape = {
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  date: z.iso.datetime(),
  time: z.string(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  distance: z.string().nullable(),
  pace: z.string().nullable(),
  pacePolicy: z.enum(['OPEN_PACE', 'SHARED']).nullable(),
  club: runDetailClubSchema,
}

export const runDetailResponseSchema = z.discriminatedUnion('kind', [
  z.object({
    ...runDetailSharedShape,
    kind: z.literal('recurring'),
    status: z.literal('SCHEDULED'),
    recurringSlug: z.string(),
  }),
  z.object({
    ...runDetailSharedShape,
    kind: z.literal('one-off'),
    status: z.enum(['SCHEDULED', 'CANCELLED']),
  }),
])
export type RunDetailResponse = z.infer<typeof runDetailResponseSchema>

// User schemas
export const userIdSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
})

export const toggleUserStaffSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  isStaff: z.boolean(),
})

export const usersQuerySchema = paginationQuerySchema.extend({
  isStaff: z.enum(['true', 'false']).optional(),
})

// API response schemas
export const clubWithEventsSchema = clubSchema.extend({
  events: z.array(eventSchema).default([]),
})

export const eventWithClubSchema = eventSchema.extend({
  club: clubSchema,
})

// Query parameter schemas - extending base pagination
export const clubsQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  type: z.enum(['ROAD', 'TRAIL']).optional(),
  vibe: z.enum(['SOCIAL', 'TRAINING']).optional(),
  beginner: z.enum(['1']).optional(),
})

// Service function utility types
export type ServiceUser = {
  id: string
  isStaff: boolean
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
export type ToggleUserStaff = z.infer<typeof toggleUserStaffSchema>
export type UsersQuery = z.infer<typeof usersQuerySchema>

// Strava types
export type StravaClubId = z.infer<typeof stravaClubIdSchema>
export type StravaSyncResponse = z.infer<typeof stravaSyncResponseSchema>

// Recurring event schemas
export const recurringEventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  address: z.string().optional(),
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

export const recurringEventQuerySchema = z.object({
  clubId: z.string().min(1, 'Club ID is required'),
})

export const recurringEventDeleteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

export type RecurringEventCreateInput = z.infer<
  typeof recurringEventCreateSchema
>
export type RecurringEventUpdateInput = z.infer<
  typeof recurringEventUpdateSchema
>
export type RecurringEventIdInput = z.infer<typeof recurringEventIdSchema>
export type RecurringEventQuery = z.infer<typeof recurringEventQuerySchema>
export type RecurringEventDelete = z.infer<typeof recurringEventDeleteSchema>

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
