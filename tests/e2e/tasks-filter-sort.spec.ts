import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { registerAndLandOnDashboard } from './helpers'

async function titlesInOrder(page: Page, expectedCount: number): Promise<string[]> {
  await expect(page.locator('li strong')).toHaveCount(expectedCount)
  return page.locator('li strong').allInnerTexts()
}

interface Fixture {
  subjectAId: string
  subjectBId: string
}

/** Registers a fresh student and seeds two subjects with three tasks across them, via the API (faster than driving each form). */
async function seedTasks(page: Page): Promise<Fixture> {
  await registerAndLandOnDashboard(page)

  const subjectA = await page.request.post('/api/subjects', { data: { name: 'Math' } })
  const subjectAId = (await subjectA.json()).subject.id as string

  const subjectB = await page.request.post('/api/subjects', { data: { name: 'History' } })
  const subjectBId = (await subjectB.json()).subject.id as string

  await page.request.post('/api/tasks', {
    data: { subjectId: subjectAId, title: 'Zeta task', dueDate: '2026-09-10' }
  })
  await page.request.post('/api/tasks', {
    data: { subjectId: subjectAId, title: 'Alpha task', dueDate: '2026-09-01' }
  })
  await page.request.post('/api/tasks', {
    data: { subjectId: subjectBId, title: 'Beta task', dueDate: '2026-09-05' }
  })

  await page.goto('/tasks')
  await expect(page.locator('li strong')).toHaveCount(3)

  return { subjectAId, subjectBId }
}

test.describe('Filter and Sort Study Tasks', () => {
  test('filtering by subject shows only that subject\'s tasks (US1)', async ({ page }) => {
    const { subjectBId } = await seedTasks(page)

    // #filter-subject, not getByLabel('Subject') - that label also matches
    // TaskForm's own subject picker elsewhere on this page.
    await page.locator('#filter-subject').selectOption(subjectBId)
    const filtered = await titlesInOrder(page, 1)
    expect(filtered).toEqual(['Beta task'])

    await page.locator('#filter-subject').selectOption('')
    await expect(page.locator('li strong')).toHaveCount(3)
  })

  test('sorting by title and by due date reorders the list, ascending and descending (US2)', async ({ page }) => {
    await seedTasks(page)

    await page.getByLabel('Sort by').selectOption('title')
    expect(await titlesInOrder(page, 3)).toEqual(['Alpha task', 'Beta task', 'Zeta task'])

    await page.getByLabel('Sort by').selectOption('dueDate')
    expect(await titlesInOrder(page, 3)).toEqual(['Alpha task', 'Beta task', 'Zeta task'])

    await page.getByLabel('Direction').selectOption('desc')
    expect(await titlesInOrder(page, 3)).toEqual(['Zeta task', 'Beta task', 'Alpha task'])
  })

  test('a filter and a sort criterion combine to satisfy both at once (US4)', async ({ page }) => {
    const { subjectAId } = await seedTasks(page)

    await page.locator('#filter-subject').selectOption(subjectAId)
    await page.getByLabel('Sort by').selectOption('title')
    await page.getByLabel('Direction').selectOption('asc')

    expect(await titlesInOrder(page, 2)).toEqual(['Alpha task', 'Zeta task'])
  })

  test('"Clear filters" is always visible, resets everything in one click, no-ops with nothing active, and still settles on the unfiltered view when clicked mid-request', async ({ page }) => {
    const { subjectAId } = await seedTasks(page)

    const clearButton = page.getByRole('button', { name: 'Clear filters' })

    // Always visible, even before any filter has been touched.
    await expect(clearButton).toBeVisible()

    // Harmless no-op with no filters active.
    await clearButton.click()
    await expect(page.locator('li strong')).toHaveCount(3)

    // Applying all three filters, then clearing them all in one click.
    await page.locator('#filter-subject').selectOption(subjectAId)
    await page.getByLabel('Sort by').selectOption('title')
    await page.getByLabel('Direction').selectOption('desc')
    await expect(page.locator('li strong')).toHaveCount(2)

    await expect(clearButton).toBeVisible()
    await clearButton.click()
    await expect(page.locator('li strong')).toHaveCount(3)
    await expect(page.locator('#filter-subject')).toHaveValue('')
    await expect(page.getByLabel('Sort by')).toHaveValue('')

    // Clicking Clear filters while a previous filter change is still loading
    // still lands on the default, unfiltered view once everything settles.
    await page.route('**/api/tasks*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      await route.continue()
    })
    await page.locator('#filter-subject').selectOption(subjectAId)
    await clearButton.click()

    await expect(page.locator('li strong')).toHaveCount(3)
    await expect(page.locator('#filter-subject')).toHaveValue('')
  })
})
