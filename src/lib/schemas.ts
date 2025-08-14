import { z } from 'zod'

// Base schemas
export const PaginationQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
})

// Club schemas
export const ClubSchema = z.object({
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

export const ClubCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  website: z.string().url('Must be a valid URL').optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
})

export const ClubUpdateSchema = ClubCreateSchema.partial()

// Run schemas
export const RunSchema = z.object({
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

export const RunCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date'),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format'),
  address: z.string().min(1, 'Address is required'),
  distance: z.string().optional(),
  pace: z.string().optional(),
  clubId: z.string().min(1, 'Club ID is required'),
})

export const RunUpdateSchema = RunCreateSchema.partial()

// API response schemas
export const ClubWithRunsSchema = ClubSchema.extend({
  upcomingRuns: z.array(RunSchema).optional(),
})

export const RunWithClubSchema = RunSchema.extend({
  club: ClubSchema,
})

// Query parameter schemas - extending base pagination
export const ClubsQuerySchema = PaginationQuerySchema

export const RunsQuerySchema = PaginationQuerySchema.extend({
  clubId: z.string().optional(),
})

// Type exports
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export type Club = z.infer<typeof ClubSchema>
export type ClubCreate = z.infer<typeof ClubCreateSchema>
export type ClubUpdate = z.infer<typeof ClubUpdateSchema>
export type ClubWithRuns = z.infer<typeof ClubWithRunsSchema>

export type Run = z.infer<typeof RunSchema>
export type RunCreate = z.infer<typeof RunCreateSchema>
export type RunUpdate = z.infer<typeof RunUpdateSchema>
export type RunWithClub = z.infer<typeof RunWithClubSchema>

export type ClubsQuery = z.infer<typeof ClubsQuerySchema>
export type RunsQuery = z.infer<typeof RunsQuerySchema>