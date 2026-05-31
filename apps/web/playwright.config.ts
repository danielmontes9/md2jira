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
 *
 * Visual regression tests live in e2e/visual.test.ts and are excluded from
 * the default chromium/firefox/webkit projects. Run them with a dedicated project:
 *
 *   Generate baselines (once, on Linux to match CI fonts):
 *     pnpm --filter web test:e2e:update-snapshots
 *
 *   Run comparisons:
 *     pnpm --filter web test:e2e:visual
 *
 *   Commit the generated PNGs from apps/web/e2e/__snapshots__/ to enable CI.
 */
export default defineConfig({
  testDir: './e2e',
  snapshotDir: './e2e/__snapshots__',
  // Store snapshots as <snapshotDir>/<arg>.png (e.g. __snapshots__/default-state.png).
  // Omitting {platform} and {projectName} ensures Linux-generated baselines match
  // in CI regardless of the runner's reported platform string.
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      // Allow ≤10% per-pixel difference and ≤100 differing pixels to absorb
      // minor cross-platform font rendering / anti-aliasing variation.
      threshold: 0.1,
      maxDiffPixels: 100,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/visual.test.ts'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/visual.test.ts'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/visual.test.ts'],
    },
    {
      // Dedicated project for visual regression — Chromium only for stable,
      // deterministic snapshots. Does NOT run as part of the default `test:e2e`
      // command; use `test:e2e:visual` / `test:e2e:update-snapshots` instead.
      //
      // Font rendering flags reduce cross-platform pixel-level variance:
      //   --font-render-hinting=none   disables OS-level hinting for uniform glyph shapes
      //   --disable-font-subpixel-positioning  makes text placement integer-aligned
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--font-render-hinting=none', '--disable-font-subpixel-positioning'],
        },
      },
      testMatch: ['**/visual.test.ts'],
      retries: 0,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
