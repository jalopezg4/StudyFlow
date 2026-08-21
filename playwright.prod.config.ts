import { defineConfig, devices } from '@playwright/test'

/**
 * Separate config for the production smoke test (AC02/AC03 of issue #35).
 * Deliberately NOT picked up by the default `npm run test:e2e` / ci.yml E2E
 * job - this creates real accounts and real data in the live production
 * Supabase project, so it must only ever run when explicitly invoked
 * (`npm run smoke:prod`), never automatically on every PR/push.
 */
export default defineConfig({
  testDir: 'tests/e2e-prod',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  workers: 1,
  use: {
    baseURL: 'https://studyflow-pi-liard.vercel.app'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
