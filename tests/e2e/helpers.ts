import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

const PASSWORD = 'TestPass123'

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

/**
 * Navigates to a form page and waits for it to actually be interactive before
 * returning. Clicking before Vue's @submit.prevent handler attaches falls
 * through to a native HTML form submission, which reloads the page back to a
 * blank form instead of running the app's own submit logic at all - this was
 * previously misdiagnosed as a Chromium-only auth bug. `networkidle` is a real
 * readiness condition here (not a fixed sleep): these are plain server-rendered
 * forms with no polling/websocket traffic, so "no network activity" reliably
 * means the client bundle has finished loading and Vue has hydrated.
 */
export async function gotoForm(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

/** Registers a brand-new account (or a given email) and waits for the resulting session to land on /dashboard. */
export async function registerAndLandOnDashboard(page: Page, email: string = uniqueEmail()): Promise<string> {
  await gotoForm(page, '/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  return email
}
