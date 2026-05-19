// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import type { Linter } from 'eslint'

// Dynamic imports for CommonJS modules
const storybook = await import('eslint-plugin-storybook')
const { FlatCompat } = await import('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig: Linter.Config[] = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...storybook.default.configs['flat/recommended'],
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
      '.worktrees/**',
      'prisma/generated/**',
      'storybook-static/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
]

export default eslintConfig
