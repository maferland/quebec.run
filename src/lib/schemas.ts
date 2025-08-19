import { z } from 'zod'

// Base schemas
export const paginationQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
})

// Club schemas
export const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  website: z.string().nullable(),
  instagram: z.string().nullable(),
  facebook: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
})

export const clubCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  website: z.string().url('Must be a valid URL').optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
})

export const clubUpdateSchema = clubCreateSchema.partial().extend({
  id: z.string().min(1, 'ID is required'),
})

// Run schemas
export const runSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  date: z.date(),
  time: z.string(),
  address: z.string(),
  distance: z.string().nullable(),
  pace: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  clubId: z.string(),
})

export const runCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date'),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format'),
  address: z.string().min(1, 'Address is required'),
  distance: z.string().optional(),
  pace: z.string().optional(),
  clubId: z.string().min(1, 'Club ID is required'),
})

export const runsQuerySchema = paginationQuerySchema.extend({
  clubId: z.string().optional(),
})

export const runUpdateSchema = runCreateSchema.partial()

// Additional schemas needed by services
export const clubIdSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

export const clubDeleteSchema = clubIdSchema

// API response schemas
export const clubWithRunsSchema = clubSchema.extend({
  upcomingRuns: z.array(runSchema).optional(),
})

export const runWithClubSchema = runSchema.extend({
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
export type ClubWithRuns = z.infer<typeof clubWithRunsSchema>

export type Run = z.infer<typeof runSchema>
export type RunCreate = z.infer<typeof runCreateSchema>
export type RunUpdate = z.infer<typeof runUpdateSchema>
export type RunWithClub = z.infer<typeof runWithClubSchema>

export type ClubsQuery = z.infer<typeof clubsQuerySchema>
export type RunsQuery = z.infer<typeof runsQuerySchema>