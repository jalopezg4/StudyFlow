import { expect, test } from '@playwright/test'

const PASSWORD = 'TestPass123'

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

test.describe('Study task due date rules', () => {
  test('rejects a past due date when creating a task, but allows one when editing an existing task', async ({ page }) => {
    const email = uniqueEmail()
    await page.goto('/register')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    await page.request.post('/api/subjects', { data: { name: 'Math' } })
    await page.goto('/tasks')

    // Create with a past date: rejected client-side, nothing created.
    await page.locator('#task-subject').selectOption({ label: 'Math' })
    await page.getByLabel('Title').fill('Backdated task')
    await page.getByLabel('Due date').fill('2020-01-15')
    await page.getByRole('button', { name: 'Create task' }).click()
    await expect(page.getByText('Due date cannot be in the past.')).toBeVisible()
    await expect(page.getByText('Backdated task')).not.toBeVisible()

    // Create with a future date instead: accepted.
    await page.getByLabel('Due date').fill('2099-01-01')
    await page.getByRole('button', { name: 'Create task' }).click()
    await expect(page.getByText('Task created successfully.')).toBeVisible()
    await expect(page.locator('li').filter({ hasText: 'Backdated task' })).toBeVisible()

    // Editing that same task to a past due date is allowed (correcting an
    // already-created task should never be blocked by this rule).
    await page.locator('li').filter({ hasText: 'Backdated task' }).getByRole('button', { name: 'Edit' }).click()
    const editDueDateInput = page.locator('input[id^="task-edit-due-date-"]')
    await editDueDateInput.fill('2020-01-15')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('li').filter({ hasText: 'Backdated task' })).toContainText('Due 2020-01-15')
  })
})
