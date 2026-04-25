import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      // CLI tests spawn a child process via execFile, so v8 coverage cannot
      // instrument subprocess execution. Thresholds are not enforced here.
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
  },
})
