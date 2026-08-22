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

  test('shows a newly recorded session in the list immediately, with no reload (AC01)', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', { data: { name: 'Refresh Subject' } })
    expect(subjectResponse.ok()).toBeTruthy()

    await gotoForm(page, '/study-sessions')
    await page.getByLabel('Subject').selectOption({ label: 'Refresh Subject' })
    await page.getByLabel('Duration (minutes)').fill('20')
    await page.getByRole('button', { name: 'Record study session' }).click()

    await expect(page.getByText('Study session recorded: 20 minutes.')).toBeVisible()
    await expect(page.getByText('1 total')).toBeVisible()
    await expect(page.getByText('20 minutes', { exact: true })).toBeVisible()
  })

  test('shows the real error and re-enables Save after a failing edit (AC02)', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', { data: { name: 'Edit Fail Subject' } })
    const { subject } = await subjectResponse.json()
    const sessionResponse = await page.request.post('/api/study-sessions', {
      data: { subjectId: subject.id, durationMinutes: 30 }
    })
    const { studySession } = await sessionResponse.json()

    await gotoForm(page, '/study-sessions')
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator(`#edit-session-${studySession.id}`).fill('9999')

    const saveButton = page.getByRole('button', { name: /^(Save|Saving…)$/ })
    await saveButton.click()

    await expect(page.getByText('Invalid request input')).toBeVisible()
    await expect(saveButton).toBeEnabled()
  })

  test('shows the real error after a failing delete (AC02)', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', { data: { name: 'Delete Fail Subject' } })
    const { subject } = await subjectResponse.json()
    const sessionResponse = await page.request.post('/api/study-sessions', {
      data: { subjectId: subject.id, durationMinutes: 15 }
    })
    const { studySession } = await sessionResponse.json()

    await gotoForm(page, '/study-sessions')
    await page.getByRole('button', { name: 'Delete' }).click()

    // Race: remove the session server-side before confirming in the UI, so
    // the confirm click hits a row that no longer exists.
    const deleteResponse = await page.request.delete(`/api/study-sessions/${studySession.id}`)
    expect(deleteResponse.ok()).toBeTruthy()

    await page.getByRole('button', { name: /^(Confirm delete|Deleting…)$/ }).click()

    await expect(page.getByText('Study session not found')).toBeVisible()
  })

  test('uses the inline confirm pattern, not a native dialog, when deleting a session (AC03)', async ({ page }) => {
    let dialogAppeared = false
    page.on('dialog', () => { dialogAppeared = true })

    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', { data: { name: 'Confirm Pattern Subject' } })
    const { subject } = await subjectResponse.json()
    await page.request.post('/api/study-sessions', { data: { subjectId: subject.id, durationMinutes: 10 } })

    await gotoForm(page, '/study-sessions')
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(page.getByText('Delete this study session? This action cannot be undone.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm delete' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()

    await page.getByRole('button', { name: 'Confirm delete' }).click()
    await expect(page.getByText('No recorded sessions yet.')).toBeVisible()

    expect(dialogAppeared).toBe(false)
  })

  test('shows the date and time a session was recorded (AC04)', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', { data: { name: 'Timestamp Subject' } })
    expect(subjectResponse.ok()).toBeTruthy()

    await gotoForm(page, '/study-sessions')
    await page.getByLabel('Subject').selectOption({ label: 'Timestamp Subject' })
    await page.getByLabel('Duration (minutes)').fill('5')
    await page.getByRole('button', { name: 'Record study session' }).click()

    await expect(page.getByText('Study session recorded: 5 minutes.')).toBeVisible()
    await expect(page.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/)).toBeVisible()
  })
})
