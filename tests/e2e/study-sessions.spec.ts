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

  test('shows the recorded session in the list immediately, with no manual reload', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', {
      data: { name: 'Live Refresh Subject' }
    })
    expect(subjectResponse.ok()).toBeTruthy()

    await gotoForm(page, '/study-sessions')
    await expect(page.getByText('No recorded sessions yet.')).toBeVisible()

    await page.getByLabel('Subject').selectOption({ label: 'Live Refresh Subject' })
    await page.getByLabel('Duration (minutes)').fill('20')
    await page.getByRole('button', { name: 'Record study session' }).click()

    // Scoped to the sessions list, not the page as a whole: the form's own
    // success banner ("Study session recorded: 20 minutes.") also contains
    // "20 minutes" and "Recorded", which made these locators ambiguous.
    const sessionList = page.getByRole('list')
    await expect(sessionList.getByText('20 minutes')).toBeVisible()
    await expect(page.getByText('1 total')).toBeVisible()
    await expect(sessionList.getByText(/Recorded/)).toBeVisible()
  })

  test('shows the real error message next to a session when delete fails', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', {
      data: { name: 'Delete Error Subject' }
    })
    expect(subjectResponse.ok()).toBeTruthy()

    await gotoForm(page, '/study-sessions')
    await page.getByLabel('Subject').selectOption({ label: 'Delete Error Subject' })
    await page.getByLabel('Duration (minutes)').fill('15')
    await page.getByRole('button', { name: 'Record study session' }).click()

    const sessionList = page.getByRole('list')
    await expect(sessionList.getByText('15 minutes')).toBeVisible()

    await page.route('**/api/study-sessions/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Could not delete right now.' } })
        })
      } else {
        await route.continue()
      }
    })

    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Confirm delete' }).click()

    await expect(page.getByText('Could not delete right now.')).toBeVisible()
    await expect(sessionList.getByText('15 minutes')).toBeVisible()
  })

  test('deletes a session via the inline confirm pattern, with no native browser dialog', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', {
      data: { name: 'Inline Confirm Subject' }
    })
    expect(subjectResponse.ok()).toBeTruthy()

    let nativeDialogAppeared = false
    page.on('dialog', (dialog) => {
      nativeDialogAppeared = true
      void dialog.dismiss()
    })

    await gotoForm(page, '/study-sessions')
    await page.getByLabel('Subject').selectOption({ label: 'Inline Confirm Subject' })
    await page.getByLabel('Duration (minutes)').fill('30')
    await page.getByRole('button', { name: 'Record study session' }).click()

    const sessionList = page.getByRole('list')
    await expect(sessionList.getByText('30 minutes')).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Delete this study session? This action cannot be undone.')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(sessionList.getByText('30 minutes')).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Confirm delete' }).click()
    await expect(page.getByText('No recorded sessions yet.')).toBeVisible()

    expect(nativeDialogAppeared).toBe(false)
  })
})
