import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/vite-env.d.ts'],
    },
  },
  resolve: {
    alias: {
      'md2jira-core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
    },
  },
})
