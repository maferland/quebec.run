import { loadEnv } from 'vite'

// globalSetup runs outside Vite's dev server, so .env isn't loaded into process.env yet.
export default async function globalSetup() {
  const env = loadEnv('test', process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    process.env[key] ??= value
  }

  const { setupTestDatabase } = await import('./src/lib/test-seed')
  await setupTestDatabase()
}
