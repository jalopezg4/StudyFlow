import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Production smoke test (issue #35 AC02) - runs against the real deployed
 * app and the real production Supabase project, not local dev or the
 * dedicated E2E test project. Creates one real, clearly-labeled account.
 * Invoke explicitly with `npm run smoke:prod` - never wired into CI, since
 * this deliberately writes to production data.
 */

function uniqueEmail(): string {
  return `studyflow-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function gotoForm(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('full flow works end to end against the deployed production app', async ({ page }) => {
  const email = uniqueEmail()

  // 1. Register -> immediate session -> dashboard.
  await gotoForm(page, '/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill('SmokeTest123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // 2. Create a subject.
  await gotoForm(page, '/subjects')
  await page.getByLabel('Name').fill('Production Smoke Subject')
  await page.getByRole('button', { name: 'Create subject' }).click()
  await expect(page.getByText('Subject created successfully.')).toBeVisible()
  await expect(page.getByText('Production Smoke Subject')).toBeVisible()

  // 3. Create a task under that subject, with a future due date via the calendar.
  await gotoForm(page, '/tasks')
  await page.locator('#task-subject').selectOption({ label: 'Production Smoke Subject' })
  await page.getByLabel('Title').fill('Production smoke task')
  await page.locator('#task-due-date').click()
  await page.getByRole('button', { name: 'Next month' }).click()
  await page.locator('[data-date]').first().click()
  await page.getByRole('button', { name: 'Create task' }).click()
  await expect(page.getByText('Task created successfully.')).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'Production smoke task' })).toBeVisible()

  // 4. List + filter (US07): filtering by Pending still shows the task.
  await page.getByLabel('Status').selectOption('pending')
  await expect(page.locator('li').filter({ hasText: 'Production smoke task' })).toBeVisible()
  await page.getByLabel('Status').selectOption('')

  // 5. Sort (US07): sorting by title doesn't error and still shows the task.
  await page.getByLabel('Sort by').selectOption('title')
  await expect(page.locator('li').filter({ hasText: 'Production smoke task' })).toBeVisible()

  // 6. Recommendation (US08): the pending task is recommended.
  await expect(page.getByText('Study this next')).toBeVisible()
  await expect(page.locator('.mb-6').getByText('Production smoke task')).toBeVisible()

  // 7. Edit the task.
  const taskRow = page.locator('li').filter({ hasText: 'Production smoke task' })
  await taskRow.getByRole('button', { name: 'Edit' }).click()
  const editTitleInput = page.locator('input[id^="task-edit-title-"]')
  await editTitleInput.fill('Production smoke task (edited)')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('li').filter({ hasText: 'Production smoke task (edited)' })).toBeVisible()

  // 8. Mark it complete - the recommendation should now show the empty state.
  const editedTaskRow = page.locator('li').filter({ hasText: 'Production smoke task (edited)' })
  await editedTaskRow.getByRole('button', { name: 'Mark complete' }).click()
  await expect(editedTaskRow).toContainText('Completed')
  await expect(page.getByText('Nothing to recommend right now')).toBeVisible()

  // 9. Delete it.
  await editedTaskRow.getByRole('button', { name: 'Delete' }).click()
  await editedTaskRow.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(page.locator('li').filter({ hasText: 'Production smoke task (edited)' })).toHaveCount(0)

  // 10. Reload and confirm persistence: no tasks, but the subject remains.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('You don\'t have any tasks yet.')).toBeVisible()
})
