import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globalSetup: [path.resolve(__dirname, './test-global-setup.ts')],
      setupFiles: [path.resolve(__dirname, './test-setup.ts')],
      globals: true,
      // Run database tests sequentially to prevent deadlocks
      fileParallelism: false,
      exclude: ['node_modules', 'e2e/**', '**/*.spec.ts', '.worktrees/**'],
      env,
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'test-setup.ts',
          '**/*.test.{ts,tsx}',
          '**/*.stories.{ts,tsx}',
          '**/*.e2e.{ts,tsx}',
          'src/lib/storybook-utils.tsx',
          'src/lib/auth.ts',
          // Sentry bootstrap: no logic to test, runs before the app starts.
          'src/instrumentation.ts',
          'src/instrumentation-client.ts',
          'src/lib/test-utils.tsx',
          'src/lib/test-i18n.ts',
          'src/lib/test-e2e-helpers.ts',
          'scripts/**',
          '.storybook/**',
          'prisma/**',
          '.next/',
          '.worktrees/',
          'coverage/',
          '**/*.config.{js,ts,mjs}',
          // Exclude only API route files - these are integration tested
          'src/app/api/**/route.ts',
        ],
        // Flat keys: a nested `global` object is silently ignored by Vitest 3.
        thresholds: {
          statements: 58,
          lines: 58,
          branches: 80,
          functions: 73,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@client': path.resolve(__dirname, './prisma/generated/client/client'),
      },
    },
  }
})
