import { expect, test } from '@playwright/test'
import { registerAndLandOnDashboard } from './helpers'

// UTC, to match the server's clock and the DatePicker's own UTC-based "today".
function toDateStr(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

test.describe('Study task due date rules', () => {
  test('the create-task calendar disables past days; the edit-task calendar does not', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    await page.request.post('/api/subjects', { data: { name: 'Math' } })
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    const todayStr = toDateStr(new Date())

    // Open the create-task date picker and go back a month, so every visible day is in the past.
    await page.locator('#task-due-date').click()
    await page.getByRole('button', { name: 'Previous month' }).click()
    const pastDayInCreate = page.locator('[data-date]').first()
    await expect(pastDayInCreate).toBeDisabled()
    // Back to the current month and pick today, which must be enabled (min date = today).
    await page.getByRole('button', { name: 'Next month' }).click()
    const todayCellInCreate = page.locator(`[data-date="${todayStr}"]`)
    await expect(todayCellInCreate).toBeEnabled()
    await todayCellInCreate.click()

    await page.locator('#task-subject').selectOption({ label: 'Math' })
    await page.getByLabel('Title').fill('Backdated task')
    await page.getByRole('button', { name: 'Create task' }).click()
    await expect(page.getByText('Task created successfully.')).toBeVisible()
    await expect(page.locator('li').filter({ hasText: 'Backdated task' })).toContainText(`Due ${todayStr}`)

    // Editing that same task: the calendar allows going back and picking a past day.
    await page.locator('li').filter({ hasText: 'Backdated task' }).getByRole('button', { name: 'Edit' }).click()
    const editDueDateButton = page.locator('button[id^="task-edit-due-date-"]')
    await editDueDateButton.click()
    await page.getByRole('button', { name: 'Previous month' }).click()
    const pastDayInEdit = page.locator('[data-date]').first()
    const pastDateStr = await pastDayInEdit.getAttribute('data-date')
    await expect(pastDayInEdit).toBeEnabled()
    await pastDayInEdit.click()
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.locator('li').filter({ hasText: 'Backdated task' })).toContainText(`Due ${pastDateStr}`)
  })
})
