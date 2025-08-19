import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './test-msw'

// Reusable MSW setup for tests
export function setupMSW() {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}