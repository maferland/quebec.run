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
      setupFiles: [path.resolve(__dirname, './test-setup.ts')],
      globals: true,
      // Run database tests sequentially to prevent deadlocks
      fileParallelism: false,
      exclude: ['node_modules', 'e2e/**', '**/*.spec.ts'],
      env,
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'test-setup.ts',
          '**/*.test.{ts,tsx}',
          '**/*.stories.{ts,tsx}',
          '**/*.e2e.{ts,tsx}',
          '**/*.d.ts',
          '.storybook/**',
          'src/lib/storybook-utils.tsx',
          'src/lib/auth.ts',
          'src/lib/test-*.{ts,tsx}',
          'src/lib/strava.ts',
          'src/lib/prisma.ts',
          'src/lib/session-middleware.ts',
          'src/lib/schemas/**',
          'src/middleware.ts',
          'src/i18n/**',
          'src/types/**',
          'scripts/**',
          'prisma/**',
          '.next/',
          'coverage/',
          '**/*.config.{js,ts,mjs}',
          // Page/layout files are E2E tested, not unit tested
          'src/app/**/page.tsx',
          'src/app/**/layout.tsx',
          'src/app/api/**/route.ts',
        ],
        thresholds: {
          global: {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95,
          },
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
