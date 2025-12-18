import { prisma } from '@/lib/prisma'
import type { AuthPayload } from '@/lib/schemas'
import { geocodeAddress } from './geocoding'

// Zod schemas for address operations
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

/**
 * Get all addresses for a club or organization
 */
export const getAddresses = async ({
  user,
  data,
}: AuthPayload<AddressesQuery>) => {
  const { clubId, organizationId } = data

  // Must specify either clubId or organizationId
  if (!clubId && !organizationId) {
    throw new Error('Must specify clubId or organizationId')
  }

  // Verify ownership
  if (clubId) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { ownerId: true },
    })

    if (!club) {
      throw new Error('Club not found')
    }

    if (club.ownerId !== user.id && !user.isStaff) {
      throw new Error('Unauthorized to view these addresses')
    }

    return await prisma.address.findMany({
      where: { clubId },
      orderBy: { createdAt: 'asc' },
    })
  }

  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    if (org.ownerId !== user.id && !user.isStaff) {
      throw new Error('Unauthorized to view these addresses')
    }

    return await prisma.address.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    })
  }

  return []
}

/**
 * Create a new saved address (with auto-geocoding)
 */
export const createAddress = async ({
  user,
  data,
}: AuthPayload<AddressCreate>) => {
  const { clubId, organizationId, label, address } = data

  // Must specify either clubId or organizationId (not both)
  if (!clubId && !organizationId) {
    throw new Error('Must specify clubId or organizationId')
  }
  if (clubId && organizationId) {
    throw new Error('Cannot specify both clubId and organizationId')
  }

  // Verify ownership
  if (clubId) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { ownerId: true },
    })

    if (!club) {
      throw new Error('Club not found')
    }

    if (club.ownerId !== user.id && !user.isStaff) {
      throw new Error('Unauthorized to create address for this club')
    }
  }

  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    })

    if (!org) {
      throw new Error('Organization not found')
    }

    if (org.ownerId !== user.id && !user.isStaff) {
      throw new Error('Unauthorized to create address for this organization')
    }
  }

  // Geocode the address
  const coords = await geocodeAddress(address)

  return await prisma.address.create({
    data: {
      label,
      address,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      clubId: clubId ?? null,
      organizationId: organizationId ?? null,
    },
  })
}

/**
 * Update an existing address (re-geocodes if address changed)
 */
export const updateAddress = async ({
  user,
  data,
}: AuthPayload<AddressUpdate>) => {
  const { id, ...updateData } = data

  // Verify ownership via club or org
  const existingAddress = await prisma.address.findUnique({
    where: { id },
    select: {
      clubId: true,
      organizationId: true,
      address: true,
      club: { select: { ownerId: true } },
      organization: { select: { ownerId: true } },
    },
  })

  if (!existingAddress) {
    throw new Error('Address not found')
  }

  const ownerId =
    existingAddress.club?.ownerId ?? existingAddress.organization?.ownerId

  if (ownerId !== user.id && !user.isStaff) {
    throw new Error('Unauthorized to update this address')
  }

  // Re-geocode if address changed
  let coords: { lat: number; lng: number } | null = null
  if (updateData.address && updateData.address !== existingAddress.address) {
    coords = await geocodeAddress(updateData.address)
  }

  return await prisma.address.update({
    where: { id },
    data: {
      ...updateData,
      ...(coords && { latitude: coords.lat, longitude: coords.lng }),
    },
  })
}

/**
 * Delete an address
 */
export const deleteAddress = async ({
  user,
  data,
}: AuthPayload<AddressDelete>) => {
  const { id } = data

  // Verify ownership via club or org
  const address = await prisma.address.findUnique({
    where: { id },
    select: {
      club: { select: { ownerId: true } },
      organization: { select: { ownerId: true } },
    },
  })

  if (!address) {
    throw new Error('Address not found')
  }

  const ownerId = address.club?.ownerId ?? address.organization?.ownerId

  if (ownerId !== user.id && !user.isStaff) {
    throw new Error('Unauthorized to delete this address')
  }

  return await prisma.address.delete({
    where: { id },
  })
}
