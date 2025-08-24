import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render as originalRender,
  renderHook as originalRenderHook,
  RenderOptions,
  RenderHookOptions,
} from '@testing-library/react'
import type { ReactElement } from 'react'

// Create a test query client with sensible defaults
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
TestWrapper.displayName = 'TestWrapper'

// Custom renderHook with providers
export function renderHook<Result, Props>(
  render: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props>
) {
  return originalRenderHook(render, {
    wrapper: TestWrapper,
    ...options,
  })
}

// Custom render with providers
export function render(ui: ReactElement, options?: RenderOptions) {
  return originalRender(ui, {
    wrapper: TestWrapper,
    ...options,
  })
}

// Re-export everything else from testing-library
export * from '@testing-library/react'
