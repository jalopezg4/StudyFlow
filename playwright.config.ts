import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5000 },
  // Every spec registers a real account against a shared Supabase project
  // with a free-tier signup rate limit. Running workers in parallel creates
  // enough concurrent signups to trip that limit and produce flaky,
  // non-deterministic failures unrelated to the app - confirmed by the same
  // suite passing 13/13 sequentially right after a parallel run failed 5/13.
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
  ]
})
