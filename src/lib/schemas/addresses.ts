import { z } from 'zod'

export const addressCreateSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  address: z.string().min(1, 'Address is required'),
  clubId: z.string().optional(),
  organizationId: z.string().optional(),
})

export const addressUpdateSchema = addressCreateSchema.partial().extend({
  id: z.string().min(1, 'Address ID is required'),
})

export const addressDeleteSchema = z.object({
  id: z.string().min(1, 'Address ID is required'),
})

export const addressesQuerySchema = z.object({
  clubId: z.string().optional(),
  organizationId: z.string().optional(),
})

export type AddressCreate = z.infer<typeof addressCreateSchema>
export type AddressUpdate = z.infer<typeof addressUpdateSchema>
export type AddressDelete = z.infer<typeof addressDeleteSchema>
export type AddressesQuery = z.infer<typeof addressesQuerySchema>
