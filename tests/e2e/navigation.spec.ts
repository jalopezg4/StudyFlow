import { expect, test } from '@playwright/test'
import { gotoForm, registerAndLandOnDashboard } from './helpers'

test.describe('Navigation', () => {
  test('shows the persistent nav with all links on dashboard, subjects, and tasks', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    for (const path of ['/dashboard', '/subjects', '/tasks']) {
      await gotoForm(page, path)
      const nav = page.locator('nav')
      await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'My Subjects' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'My Tasks' })).toBeVisible()
      await expect(nav.getByRole('link', { name: 'Study Sessions' })).toBeVisible()
      await expect(nav.getByRole('button', { name: /Log out/ })).toBeVisible()
    }
  })

  test('reaches My Subjects, My Tasks, and Study Sessions from anywhere without entering a creation flow first', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    await page.locator('nav').getByRole('link', { name: 'My Subjects' }).click()
    await expect(page).toHaveURL(/\/subjects$/)

    await page.locator('nav').getByRole('link', { name: 'My Tasks' }).click()
    await expect(page).toHaveURL(/\/tasks$/)

    await page.locator('nav').getByRole('link', { name: 'Study Sessions' }).click()
    await expect(page).toHaveURL(/\/study-sessions$/)

    await page.locator('nav').getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('visually marks the active section on each page', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    const activeClass = 'bg-indigo-600'

    await gotoForm(page, '/dashboard')
    await expect(page.locator('nav').getByRole('link', { name: 'Dashboard' })).toHaveClass(new RegExp(activeClass))
    await expect(page.locator('nav').getByRole('link', { name: 'My Subjects' })).not.toHaveClass(new RegExp(activeClass))

    await gotoForm(page, '/subjects')
    await expect(page.locator('nav').getByRole('link', { name: 'My Subjects' })).toHaveClass(new RegExp(activeClass))
    await expect(page.locator('nav').getByRole('link', { name: 'Dashboard' })).not.toHaveClass(new RegExp(activeClass))

    await gotoForm(page, '/tasks')
    await expect(page.locator('nav').getByRole('link', { name: 'My Tasks' })).toHaveClass(new RegExp(activeClass))
    await expect(page.locator('nav').getByRole('link', { name: 'Dashboard' })).not.toHaveClass(new RegExp(activeClass))

    await gotoForm(page, '/study-sessions')
    await expect(page.locator('nav').getByRole('link', { name: 'Study Sessions' })).toHaveClass(new RegExp(activeClass))
    await expect(page.locator('nav').getByRole('link', { name: 'Dashboard' })).not.toHaveClass(new RegExp(activeClass))
  })

  test('dashboard quick-links read as management views and still lead to the right destinations', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    // Scoped to the quick-links card, not the persistent nav, since both now
    // share the same link names ("My Subjects" etc.) after this change.
    const quickLinks = page.locator('.mt-6.flex.flex-wrap.gap-3')
    await expect(quickLinks.getByRole('link', { name: 'My Subjects', exact: true })).toBeVisible()
    await expect(quickLinks.getByRole('link', { name: 'My Tasks', exact: true })).toBeVisible()
    await expect(quickLinks.getByRole('link', { name: 'Study Sessions', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create subject' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Create task' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Record study session' })).toHaveCount(0)

    await quickLinks.getByRole('link', { name: 'My Tasks', exact: true }).click()
    await expect(page).toHaveURL(/\/tasks$/)

    await gotoForm(page, '/dashboard')
    await quickLinks.getByRole('link', { name: 'Study Sessions', exact: true }).click()
    await expect(page).toHaveURL(/\/study-sessions$/)

    await gotoForm(page, '/dashboard')
    await quickLinks.getByRole('link', { name: 'My Subjects', exact: true }).click()
    await expect(page).toHaveURL(/\/subjects$/)
  })

  test('logs out from a non-dashboard page', async ({ page }) => {
    await registerAndLandOnDashboard(page)
    await gotoForm(page, '/subjects')

    await page.locator('nav').getByRole('button', { name: /Log out/ }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
