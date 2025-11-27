import { z } from 'zod'

// Empty schema - consent doesn't need body (IP captured server-side)
export const consentCreateSchema = z.object({})

// Data export - no params needed, uses session user
export const dataExportSchema = z.object({})

// Deletion request - no body needed, uses session user
export const deletionRequestSchema = z.object({})

// Cancel deletion - requires request ID from URL
export const deletionCancelSchema = z.object({
  id: z.string().cuid(),
})

// Infer types
export type ConsentCreate = z.infer<typeof consentCreateSchema>
export type DataExport = z.infer<typeof dataExportSchema>
export type DeletionRequest = z.infer<typeof deletionRequestSchema>
export type DeletionCancel = z.infer<typeof deletionCancelSchema>
