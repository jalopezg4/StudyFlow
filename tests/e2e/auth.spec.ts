import { expect, test } from '@playwright/test'

const PASSWORD = 'TestPass123'

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

/** Registers a brand-new account. A fresh email always gets a session, so this lands on /dashboard. */
async function registerAndLandOnDashboard(page: import('@playwright/test').Page, email: string): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function logout(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

test.describe('Authentication', () => {
  test('registering a new account logs the student in immediately (CA01)', async ({ page }) => {
    const email = uniqueEmail()

    await registerAndLandOnDashboard(page, email)

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('an existing account can still log in explicitly (CA02)', async ({ page }) => {
    const email = uniqueEmail()

    await registerAndLandOnDashboard(page, email)
    await logout(page)

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('does not create a duplicate account on repeat registration (FR-004)', async ({ page }) => {
    const email = uniqueEmail()

    await registerAndLandOnDashboard(page, email)
    await logout(page)

    await page.goto('/register')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Register' }).click()

    // Supabase creates no session for a duplicate email (anti-enumeration behavior), so
    // the page must not redirect to /dashboard, and must not reveal the account exists.
    await expect(page).toHaveURL(/\/register$/)
    const feedback = page.locator('p.text-red-600, p.text-green-600')
    await expect(feedback).toBeVisible()
    await expect(feedback).not.toContainText(/already|exists/i)
  })

  test('rejects login with an incorrect password using a generic message (CA03)', async ({ page }) => {
    const email = uniqueEmail()

    await registerAndLandOnDashboard(page, email)
    await logout(page)

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword999')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByText('Incorrect email or password.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('blocks direct access to a private page without a session (US4 CA01)', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/login$/)
  })

  test('grants access to a private page with a valid session (US4 CA02)', async ({ page }) => {
    const email = uniqueEmail()

    await registerAndLandOnDashboard(page, email)

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('logging out ends the session and blocks the private page afterward (US3 CA01/CA02)', async ({
    page
  }) => {
    const email = uniqueEmail()

    await registerAndLandOnDashboard(page, email)

    await logout(page)

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })
})
