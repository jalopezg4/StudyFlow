import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { registerAndLandOnDashboard } from './helpers'

async function registerAndGoToTasks(page: Page): Promise<void> {
  await registerAndLandOnDashboard(page)
  await page.goto('/tasks')
}

test.describe('Study Task Recommendation', () => {
  test('shows the empty state when the student has no eligible tasks', async ({ page }) => {
    await registerAndGoToTasks(page)

    await expect(page.getByText('Study this next')).toBeVisible()
    await expect(page.getByText('Nothing to recommend right now')).toBeVisible()
  })

  test('recommends the task with the soonest due date, and updates after a change', async ({ page }) => {
    await registerAndGoToTasks(page)

    const subject = await page.request.post('/api/subjects', { data: { name: 'Math' } })
    const subjectId = (await subject.json()).subject.id as string

    await page.request.post('/api/tasks', {
      data: { subjectId, title: 'Later task', dueDate: '2026-09-10' }
    })
    const soonerTask = await page.request.post('/api/tasks', {
      data: { subjectId, title: 'Sooner task', dueDate: '2026-09-01' }
    })
    const soonerTaskId = (await soonerTask.json()).task.id as string

    await page.goto('/tasks')
    await expect(page.getByText('Study this next')).toBeVisible()
    await expect(page.locator('.mb-6').getByText('Sooner task')).toBeVisible()

    // Mark the recommended task completed via the list; the widget should refresh
    // and recommend the next-best eligible task instead.
    await page.locator(`li:has-text("Sooner task")`).getByRole('button', { name: 'Mark complete' }).click()
    await expect(page.locator('.mb-6').getByText('Later task')).toBeVisible()

    await page.request.delete(`/api/tasks/${soonerTaskId}`)
  })
})
