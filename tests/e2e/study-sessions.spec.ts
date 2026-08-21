import { expect, test } from '@playwright/test'

const PASSWORD = 'TestPass123'

function uniqueEmail(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

test.describe('Study session recording', () => {
  test('blocks unauthenticated access to the session form', async ({ page }) => {
    await page.goto('/study-sessions')

    await expect(page).toHaveURL(/\/login$/)
  })

  test('records a subject-only study session from the authenticated UI', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Email').fill(uniqueEmail())
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    const subjectResponse = await page.request.post('/api/subjects', {
      data: { name: 'Study Sessions Subject' }
    })
    expect(subjectResponse.ok()).toBeTruthy()

    await page.goto('/study-sessions')
    await page.getByLabel('Subject').selectOption({ label: 'Study Sessions Subject' })
    await page.getByLabel('Duration (minutes)').fill('45')
    await page.getByRole('button', { name: 'Record study session' }).click()

    await expect(page.getByRole('status')).toContainText('45 minutes')
  })
})
