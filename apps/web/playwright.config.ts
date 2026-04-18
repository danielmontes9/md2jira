import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright end-to-end test configuration.
 *
 * Install once: pnpm --filter web exec playwright install chromium
 * Run:          pnpm --filter web exec playwright test
 *
 * E2E tests are separate from the Vitest unit test suite and are NOT run
 * as part of `pnpm test`. They require a running dev server (started automatically
 * via `webServer` below) and the Playwright browsers to be installed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
