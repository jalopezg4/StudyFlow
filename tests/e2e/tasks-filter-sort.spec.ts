import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const PASSWORD = 'TestPass123'

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

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
  const email = uniqueEmail()

  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)

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
})
