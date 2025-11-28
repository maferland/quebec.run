import { describe, expect, it } from 'vitest'
import {
  clubCreateSchema,
  clubUpdateSchema,
  clubsQuerySchema,
  clubIdSchema,
  clubSlugSchema,
  eventIdSchema,
  eventCreateSchema,
  eventUpdateSchema,
  eventsQuerySchema,
  userIdSchema,
  toggleUserAdminSchema,
  usersQuerySchema,
} from './schemas'

describe('schemas', () => {
  describe('clubCreateSchema', () => {
    it('validates valid club creation data', () => {
      const validData = {
        name: 'Test Running Club',
        description: 'A great running club',
        website: 'https://test.com',
        instagram: '@testclub',
        facebook: 'testclub',
      }

      expect(() => clubCreateSchema.parse(validData)).not.toThrow()
      const parsed = clubCreateSchema.parse(validData)
      expect(parsed).toEqual(validData)
    })

    it('requires name field', () => {
      const invalidData = {
        description: 'Missing name',
      }

      expect(() => clubCreateSchema.parse(invalidData)).toThrow()
    })

    it('validates URL format for website', () => {
      const invalidData = {
        name: 'Test Club',
        website: 'not-a-url',
      }

      expect(() => clubCreateSchema.parse(invalidData)).toThrow()
    })

    it('accepts optional fields as undefined', () => {
      const minimalData = {
        name: 'Test Club',
      }

      expect(() => clubCreateSchema.parse(minimalData)).not.toThrow()
    })
  })

  describe('clubUpdateSchema', () => {
    it('validates club update with id', () => {
      const validData = {
        id: 'club123',
        name: 'Updated Club Name',
      }

      expect(() => clubUpdateSchema.parse(validData)).not.toThrow()
    })

    it('requires id field', () => {
      const invalidData = {
        name: 'Updated Name',
      }

      expect(() => clubUpdateSchema.parse(invalidData)).toThrow()
    })
  })

  describe('clubsQuerySchema', () => {
    it('validates query parameters with no defaults', () => {
      const result = clubsQuerySchema.parse({})

      expect(result.limit).toBeUndefined()
      expect(result.offset).toBeUndefined()
    })

    it('validates custom limit and offset', () => {
      const queryData = {
        limit: '10',
        offset: '20',
      }

      const result = clubsQuerySchema.parse(queryData)
      expect(result.limit).toBe(10)
      expect(result.offset).toBe(20)
    })

    it('coerces string numbers to numbers', () => {
      const queryData = {
        limit: '15',
        offset: '5',
      }

      const result = clubsQuerySchema.parse(queryData)
      expect(result.limit).toBe(15)
      expect(result.offset).toBe(5)
    })

    it('enforces maximum limit', () => {
      const queryData = {
        limit: 200, // Over max of 100
      }

      expect(() => clubsQuerySchema.parse(queryData)).toThrow()
    })
  })

  describe('clubIdSchema', () => {
    it('validates valid CUID', () => {
      const validId = 'cuid123456'

      expect(() => clubIdSchema.parse({ id: validId })).not.toThrow()
    })

    it('rejects empty id', () => {
      expect(() => clubIdSchema.parse({ id: '' })).toThrow()
    })
  })

  describe('clubSlugSchema', () => {
    it('validates valid slug', () => {
      const validSlug = 'test-club-slug'

      expect(() => clubSlugSchema.parse({ slug: validSlug })).not.toThrow()
    })

    it('rejects empty slug', () => {
      expect(() => clubSlugSchema.parse({ slug: '' })).toThrow()
    })
  })

  describe('eventIdSchema', () => {
    it('validates valid event ID', () => {
      const validId = 'event123456'

      expect(() => eventIdSchema.parse({ id: validId })).not.toThrow()
    })

    it('rejects empty id', () => {
      expect(() => eventIdSchema.parse({ id: '' })).toThrow()
    })
  })

  describe('eventCreateSchema', () => {
    it('validates valid event creation data', () => {
      const validData = {
        title: 'Morning Run',
        description: 'A great morning run',
        date: '2025-01-20',
        time: '07:00',
        distance: '5km',
        pace: '5:00/km',
        address: '123 Main St',
        clubId: 'club123',
      }

      expect(() => eventCreateSchema.parse(validData)).not.toThrow()
    })

    it('requires title field', () => {
      const invalidData = {
        date: new Date(),
        clubId: 'club123',
      }

      expect(() => eventCreateSchema.parse(invalidData)).toThrow()
    })

    it('requires date field', () => {
      const invalidData = {
        title: 'Test Event',
        clubId: 'club123',
      }

      expect(() => eventCreateSchema.parse(invalidData)).toThrow()
    })
  })

  describe('eventUpdateSchema', () => {
    it('validates event update with id', () => {
      const validData = {
        id: 'event123',
        title: 'Updated Event',
      }

      expect(() => eventUpdateSchema.parse(validData)).not.toThrow()
    })

    it('requires id field', () => {
      const invalidData = {
        title: 'Updated Event',
      }

      expect(() => eventUpdateSchema.parse(invalidData)).toThrow()
    })
  })

  describe('eventsQuerySchema', () => {
    it('validates search param', () => {
      const result = eventsQuerySchema.parse({ search: 'montreal' })
      expect(result.search).toBe('montreal')
    })

    it('validates clubId param', () => {
      const result = eventsQuerySchema.parse({ clubId: 'clxyz12345678' })
      expect(result.clubId).toBe('clxyz12345678')
    })

    it('validates dateFrom and dateTo', () => {
      const result = eventsQuerySchema.parse({
        dateFrom: '2025-12-01T00:00:00Z',
        dateTo: '2025-12-31T00:00:00Z',
      })
      expect(result.dateFrom).toBe('2025-12-01T00:00:00Z')
      expect(result.dateTo).toBe('2025-12-31T00:00:00Z')
    })

    it('uses default values for sortBy and sortOrder', () => {
      const result = eventsQuerySchema.parse({})
      expect(result.sortBy).toBe('date')
      expect(result.sortOrder).toBe('asc')
    })

    it('accepts optional params', () => {
      const result = eventsQuerySchema.parse({})
      expect(result.search).toBeUndefined()
      expect(result.clubId).toBeUndefined()
    })

    it('coerces limit and offset to numbers', () => {
      const result = eventsQuerySchema.parse({ limit: '10', offset: '5' })
      expect(result.limit).toBe(10)
      expect(result.offset).toBe(5)
    })
  })

  describe('User schemas', () => {
    it('validates userIdSchema', () => {
      const valid = userIdSchema.parse({ id: 'user-123' })
      expect(valid.id).toBe('user-123')

      expect(() => userIdSchema.parse({ id: '' })).toThrow()
      expect(() => userIdSchema.parse({})).toThrow()
    })

    it('validates toggleUserAdminSchema', () => {
      const valid = toggleUserAdminSchema.parse({
        id: 'user-123',
        isAdmin: true,
      })
      expect(valid.isAdmin).toBe(true)

      expect(() => toggleUserAdminSchema.parse({ id: 'user-123' })).toThrow()
    })

    it('validates usersQuerySchema', () => {
      const valid = usersQuerySchema.parse({ limit: '10', isAdmin: 'true' })
      expect(valid.limit).toBe(10)
      expect(valid.isAdmin).toBe('true')
    })
  })
})
