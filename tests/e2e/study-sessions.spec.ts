import { expect, test } from '@playwright/test'
import { gotoForm, registerAndLandOnDashboard } from './helpers'

test.describe('Study session recording', () => {
  test('blocks unauthenticated access to the session form', async ({ page }) => {
    await page.goto('/study-sessions')

    await expect(page).toHaveURL(/\/login$/)
  })

  test('records a subject-only study session from the authenticated UI', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', {
      data: { name: 'Study Sessions Subject' }
    })
    expect(subjectResponse.ok()).toBeTruthy()

    await gotoForm(page, '/study-sessions')
    await page.getByLabel('Subject').selectOption({ label: 'Study Sessions Subject' })
    await page.getByLabel('Duration (minutes)').fill('45')
    await page.getByRole('button', { name: 'Record study session' }).click()

    // Scoped by text, not role=status: Nuxt's own <NuxtRouteAnnouncer /> also
    // renders role="status", which getByRole('status') matched instead of this
    // form's own success message.
    await expect(page.getByText('Study session recorded: 45 minutes.')).toBeVisible()
  })
})
