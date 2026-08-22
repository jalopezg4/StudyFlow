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

    // AC01: the recorded sessions list below refreshes on its own, without a
    // page reload, right after the form's `created` event fires.
    const recordedItem = page.getByText('45 minutes').first()
    await expect(recordedItem).toBeVisible()
  })

  test('shows the real error when editing a session fails, and the app confirm pattern when deleting it', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', {
      data: { name: 'Feedback Loop Subject' }
    })
    expect(subjectResponse.ok()).toBeTruthy()

    await gotoForm(page, '/study-sessions')
    await page.getByLabel('Subject').selectOption({ label: 'Feedback Loop Subject' })
    await page.getByLabel('Duration (minutes)').fill('30')
    await page.getByRole('button', { name: 'Record study session' }).click()
    await expect(page.getByText('Study session recorded: 30 minutes.')).toBeVisible()

    const sessionItem = page.getByText('30 minutes').first().locator('xpath=ancestor::li')

    // AC04: the recorded session shows when it was recorded.
    await expect(sessionItem.getByText(/Recorded/)).toBeVisible()

    // AC02: a real server-rejected edit (duration over the 1,440 minute cap)
    // must surface its actual error message, not silently do nothing.
    await sessionItem.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Duration (minutes)').last().fill('5000')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Duration cannot exceed 1,440 minutes')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()

    // AC03: deleting uses the app's own inline confirm control, not a native
    // window.confirm dialog. If a native dialog fired, it would block this
    // click and the test would time out waiting for the inline controls.
    await sessionItem.getByRole('button', { name: 'Delete' }).click()
    await expect(sessionItem.getByText('Delete this study session? This action cannot be undone.')).toBeVisible()
    await sessionItem.getByRole('button', { name: 'Cancel' }).click()
    await expect(sessionItem.getByRole('button', { name: 'Delete' })).toBeVisible()

    await sessionItem.getByRole('button', { name: 'Delete' }).click()
    await sessionItem.getByRole('button', { name: 'Confirm delete' }).click()
    await expect(page.getByText('30 minutes')).toHaveCount(0)
  })
})
