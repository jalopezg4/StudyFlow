import { expect, test } from '@playwright/test'

const PASSWORD = 'TestPass123'

function uniqueEmail(): string {
  return `dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function register(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Email').fill(uniqueEmail())
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function seedProgress(page: import('@playwright/test').Page): Promise<void> {
  const subjectResponse = await page.request.post('/api/subjects', {
    data: { name: 'Dashboard Subject' }
  })
  expect(subjectResponse.ok()).toBeTruthy()
  const subjectId = (await subjectResponse.json()).subject.id as string

  const taskIds: string[] = []
  for (const title of ['Completed task one', 'Completed task two', 'Pending task']) {
    const taskResponse = await page.request.post('/api/tasks', {
      data: { subjectId, title }
    })
    expect(taskResponse.ok()).toBeTruthy()
    taskIds.push((await taskResponse.json()).task.id as string)
  }

  for (const taskId of taskIds.slice(0, 2)) {
    const updateResponse = await page.request.patch(`/api/tasks/${taskId}`, {
      data: { status: 'completed' }
    })
    expect(updateResponse.ok()).toBeTruthy()
  }

  for (const durationMinutes of [45, 90]) {
    const sessionResponse = await page.request.post('/api/study-sessions', {
      data: { subjectId, durationMinutes }
    })
    expect(sessionResponse.ok()).toBeTruthy()
  }
}

test.describe('Study progress dashboard', () => {
  test('shows task and study-time metrics for the authenticated student', async ({ page }) => {
    await register(page)
    await seedProgress(page)
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Study progress' })).toBeVisible()
    await expect(page.getByText('3', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('67% complete')).toBeVisible()
    await expect(page.getByText('135 minutes', { exact: false })).toBeVisible()
  })

  test('shows a valid empty state for a student without activity', async ({ page }) => {
    await register(page)
    await page.goto('/dashboard')

    await expect(page.getByText('No study activity yet.')).toBeVisible()
    await expect(page.getByText('0% complete')).toBeVisible()
    await expect(page.getByText('0 minutes across 0 sessions')).toBeVisible()
  })

  test('blocks direct progress access without authentication', async ({ page }) => {
    const response = await page.request.get('/api/dashboard/progress')

    expect(response.status()).toBe(401)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })
})
