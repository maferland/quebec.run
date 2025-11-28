import { z } from 'zod'

// Empty schema - consent doesn't need body (IP captured server-side)
export const consentCreateSchema = z.object({})

// Data export - no params needed, uses session user
export const dataExportSchema = z.object({})

// Deletion request - no body needed, uses session user
export const deletionRequestSchema = z.object({})

// Infer types
export type ConsentCreate = z.infer<typeof consentCreateSchema>
export type DataExport = z.infer<typeof dataExportSchema>
export type DeletionRequest = z.infer<typeof deletionRequestSchema>
