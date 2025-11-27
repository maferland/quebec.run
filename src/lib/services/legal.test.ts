import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'
import {
  createUserConsent,
  getUserConsent,
  exportUserData,
  createDeletionRequest,
  cancelDeletionRequest,
  getPendingDeletionRequest,
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
        user: { id: user.id, isAdmin: false },
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
          user: { id: user.id, isAdmin: false },
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
        user: { id: user.id, isAdmin: false },
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

  describe('createDeletionRequest', () => {
    it('creates deletion request 30 days out', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const request = await createDeletionRequest({
        user: { id: user.id, isAdmin: false },
        data: {},
      })

      expect(request.userId).toBe(user.id)
      expect(request.status).toBe('pending')

      const daysDiff = Math.floor(
        (request.scheduledFor.getTime() - request.requestedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBeGreaterThanOrEqual(29)
      expect(daysDiff).toBeLessThanOrEqual(30)
    })

    it('throws if pending request exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await prisma.dataDeletionRequest.create({
        data: {
          userId: user.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      await expect(
        createDeletionRequest({
          user: { id: user.id, isAdmin: false },
          data: {},
        })
      ).rejects.toThrow('Pending deletion request already exists')
    })
  })

  describe('cancelDeletionRequest', () => {
    it('cancels pending deletion request', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const request = await prisma.dataDeletionRequest.create({
        data: {
          userId: user.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const cancelled = await cancelDeletionRequest({
        user: { id: user.id, isAdmin: false },
        data: { id: request.id },
      })

      expect(cancelled.status).toBe('cancelled')
    })

    it('throws if request not found', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      await expect(
        cancelDeletionRequest({
          user: { id: user.id, isAdmin: false },
          data: { id: 'invalid' },
        })
      ).rejects.toThrow('Deletion request not found')
    })

    it('throws if not owned by user', async () => {
      const user1 = await prisma.user.create({
        data: { email: 'user1@test.com' },
      })
      const user2 = await prisma.user.create({
        data: { email: 'user2@test.com' },
      })

      const request = await prisma.dataDeletionRequest.create({
        data: {
          userId: user1.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      await expect(
        cancelDeletionRequest({
          user: { id: user2.id, isAdmin: false },
          data: { id: request.id },
        })
      ).rejects.toThrow('Deletion request not found')
    })
  })

  describe('getPendingDeletionRequest', () => {
    it('returns pending request if exists', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const request = await prisma.dataDeletionRequest.create({
        data: {
          userId: user.id,
          scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const found = await getPendingDeletionRequest({
        userId: user.id,
      })

      expect(found?.id).toBe(request.id)
    })

    it('returns null if no pending request', async () => {
      const user = await prisma.user.create({
        data: { email: 'user@test.com' },
      })

      const found = await getPendingDeletionRequest({
        userId: user.id,
      })

      expect(found).toBeNull()
    })
  })
})
