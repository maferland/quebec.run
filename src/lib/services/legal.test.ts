import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'
import {
  createUserConsent,
  getUserConsent,
  exportUserData,
  deleteUserAccount,
} from './legal'

describe('Legal Services', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  describe('createUserConsent', () => {
    it('creates consent record with IP', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const consent = await createUserConsent({
        user: { id: user.id, isStaff: false },
        ipAddress: '192.168.1.1',
      })

      expect(consent.userId).toBe(user.id)
      expect(consent.ipAddress).toBe('192.168.1.1')
      expect(consent.acceptedAt).toBeInstanceOf(Date)
    })

    it('throws if consent already exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await prisma.userConsent.create({
        data: { userId: user.id, ipAddress: '192.168.1.1' },
      })

      await expect(
        createUserConsent({
          user: { id: user.id, isStaff: false },
          ipAddress: '192.168.1.1',
        })
      ).rejects.toThrow('Consent already exists')
    })
  })

  describe('getUserConsent', () => {
    it('returns consent if exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await prisma.userConsent.create({
        data: { userId: user.id, ipAddress: '192.168.1.1' },
      })

      const consent = await getUserConsent({
        userId: user.id,
      })

      expect(consent).toBeDefined()
      expect(consent?.userId).toBe(user.id)
    })

    it('returns null if no consent', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const consent = await getUserConsent({
        userId: user.id,
      })

      expect(consent).toBeNull()
    })
  })

  describe('exportUserData', () => {
    it('exports all user data', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com', name: 'Test User' },
      })

      const club = await prisma.club.create({
        data: { name: 'Club', slug: 'club', ownerId: user.id },
      })

      const event = await prisma.event.create({
        data: {
          title: 'Event',
          date: new Date('2025-12-01'),
          time: '10:00',
          clubId: club.id,
        },
      })

      const consent = await prisma.userConsent.create({
        data: { userId: user.id, ipAddress: '192.168.1.1' },
      })

      const data = await exportUserData({
        user: { id: user.id, isStaff: false },
        data: {},
      })

      expect(data.user.id).toBe(user.id)
      expect(data.user.email).toBe('user@test.com')
      expect(data.clubs).toHaveLength(1)
      expect(data.clubs[0].id).toBe(club.id)
      expect(data.events).toHaveLength(1)
      expect(data.events[0].id).toBe(event.id)
      expect(data.consents).toHaveLength(1)
      expect(data.consents[0].id).toBe(consent.id)
    })
  })

  describe('deleteUserAccount', () => {
    it('deletes user and all related data', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const club = await prisma.club.create({
        data: { name: 'Club', slug: 'club', ownerId: user.id },
      })

      await prisma.userConsent.create({
        data: { userId: user.id, ipAddress: '192.168.1.1' },
      })

      const result = await deleteUserAccount({
        user: { id: user.id, isStaff: false },
        data: {},
      })

      expect(result.success).toBe(true)

      // Verify user deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })
      expect(deletedUser).toBeNull()

      // Verify cascaded deletions
      const deletedClub = await prisma.club.findUnique({
        where: { id: club.id },
      })
      expect(deletedClub).toBeNull()

      const deletedConsent = await prisma.userConsent.findUnique({
        where: { userId: user.id },
      })
      expect(deletedConsent).toBeNull()
    })
  })
})
