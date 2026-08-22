import { expect, test } from '@playwright/test'
import { gotoForm, registerAndLandOnDashboard } from './helpers'

test.describe('UI state & feedback consistency', () => {
  test('clears a stale "created successfully" message on the task form once editing resumes (AC05, tasks)', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', { data: { name: 'Stale Banner Subject' } })
    expect(subjectResponse.ok()).toBeTruthy()

    await gotoForm(page, '/tasks')
    await page.locator('#task-subject').selectOption({ label: 'Stale Banner Subject' })
    await page.getByLabel('Title').fill('First task')
    await page.getByRole('button', { name: 'Create task' }).click()

    await expect(page.getByText('Task created successfully.')).toBeVisible()

    await page.getByLabel('Title').fill('Second task')

    await expect(page.getByText('Task created successfully.')).not.toBeVisible()
  })

  test('shows character counters on the task edit form (AC06, tasks)', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const subjectResponse = await page.request.post('/api/subjects', { data: { name: 'Counter Subject' } })
    const { subject } = await subjectResponse.json()
    const taskResponse = await page.request.post('/api/tasks', {
      data: { subjectId: subject.id, title: 'Task' }
    })
    expect(taskResponse.ok()).toBeTruthy()
    const { task } = await taskResponse.json()

    await gotoForm(page, '/tasks')
    await page.getByRole('button', { name: 'Edit' }).click()

    // Scoped to the edit row itself: the page's create form for a new task
    // also shows its own "0/500" description counter, so an unscoped
    // getByText('0/500') would match both.
    const editRow = page.locator('li', { has: page.locator(`#task-edit-title-${task.id}`) })
    await expect(editRow.getByText('4/100')).toBeVisible()
    await expect(editRow.getByText('0/500')).toBeVisible()
  })
})
