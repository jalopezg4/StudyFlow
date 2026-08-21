import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Production RLS/ownership isolation check (issue #35 AC03) - two real
 * accounts against the real deployed app and production Supabase project.
 * Invoke explicitly with `npm run smoke:prod` - never wired into CI.
 */

function uniqueEmail(label: string): string {
  return `studyflow-smoke-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function gotoForm(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('two real accounts never see each other\'s data, at the UI and the API level', async ({ browser }) => {
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const pageA = await contextA.newPage()
  const pageB = await contextB.newPage()

  try {
    // Register both students.
    await gotoForm(pageA, '/register')
    await pageA.getByLabel('Email').fill(uniqueEmail('a'))
    await pageA.getByLabel('Password', { exact: true }).fill('SmokeTest123')
    await pageA.getByRole('button', { name: 'Register' }).click()
    await expect(pageA).toHaveURL(/\/dashboard$/)

    await gotoForm(pageB, '/register')
    await pageB.getByLabel('Email').fill(uniqueEmail('b'))
    await pageB.getByLabel('Password', { exact: true }).fill('SmokeTest123')
    await pageB.getByRole('button', { name: 'Register' }).click()
    await expect(pageB).toHaveURL(/\/dashboard$/)

    // Each creates their own subject + task via the API (faster, and gives us the ids directly).
    const subjectA = await pageA.request.post('/api/subjects', { data: { name: 'Isolation Subject A' } })
    const subjectAId = (await subjectA.json()).subject.id as string
    const taskA = await pageA.request.post('/api/tasks', {
      data: { subjectId: subjectAId, title: 'Isolation Task A' }
    })
    const taskAId = (await taskA.json()).task.id as string

    const subjectB = await pageB.request.post('/api/subjects', { data: { name: 'Isolation Subject B' } })
    const subjectBId = (await subjectB.json()).subject.id as string
    const taskB = await pageB.request.post('/api/tasks', {
      data: { subjectId: subjectBId, title: 'Isolation Task B' }
    })
    const taskBId = (await taskB.json()).task.id as string

    // UI-level: each student's task list shows only their own task. Scoped to
    // the <li> list items specifically - "Isolation Task A" can otherwise also
    // match the "Study this next" recommendation widget's own copy of the title.
    await gotoForm(pageA, '/tasks')
    await expect(pageA.locator('li').filter({ hasText: 'Isolation Task A' })).toBeVisible()
    await expect(pageA.locator('li').filter({ hasText: 'Isolation Task B' })).toHaveCount(0)

    await gotoForm(pageB, '/tasks')
    await expect(pageB.locator('li').filter({ hasText: 'Isolation Task B' })).toBeVisible()
    await expect(pageB.locator('li').filter({ hasText: 'Isolation Task A' })).toHaveCount(0)

    // API-level: A can never read B's task or subject directly by id, and vice versa -
    // denied identically to a nonexistent id (no existence-revealing difference).
    const aReadingB = await pageA.request.get(`/api/tasks/${taskBId}`)
    expect(aReadingB.status()).toBe(404)

    const bReadingA = await pageB.request.get(`/api/tasks/${taskAId}`)
    expect(bReadingA.status()).toBe(404)

    // A cannot create a task under B's subject - denied identically to a
    // nonexistent subject id (404, not a 422 that would reveal it exists).
    const aCreatingUnderB = await pageA.request.post('/api/tasks', {
      data: { subjectId: subjectBId, title: 'Should be rejected' }
    })
    expect(aCreatingUnderB.status()).toBe(404)

    // A cannot delete B's task.
    const aDeletingB = await pageA.request.delete(`/api/tasks/${taskBId}`)
    expect(aDeletingB.status()).toBe(404)
    const bTaskStillThere = await pageB.request.get(`/api/tasks/${taskBId}`)
    expect(bTaskStillThere.status()).toBe(200)
  } finally {
    await contextA.close()
    await contextB.close()
  }
})
