import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      environment: 'happy-dom',
      setupFiles: ['./test-setup.ts'],
      globals: true,
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
          'src/lib/trpc/client.ts',
          'prisma/**',
          '.next/',
          'coverage/',
          '**/*.config.{js,ts,mjs}',
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
      },
    },
  }
})
