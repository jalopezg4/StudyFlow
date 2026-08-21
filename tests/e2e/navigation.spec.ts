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
      await expect(nav.getByRole('button', { name: /Log out/ })).toBeVisible()
    }
  })

  test('reaches My Subjects and My Tasks from anywhere without entering a creation flow first', async ({ page }) => {
    await registerAndLandOnDashboard(page)

    await page.locator('nav').getByRole('link', { name: 'My Subjects' }).click()
    await expect(page).toHaveURL(/\/subjects$/)

    await page.locator('nav').getByRole('link', { name: 'My Tasks' }).click()
    await expect(page).toHaveURL(/\/tasks$/)

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
  })

  test('logs out from a non-dashboard page', async ({ page }) => {
    await registerAndLandOnDashboard(page)
    await gotoForm(page, '/subjects')

    await page.locator('nav').getByRole('button', { name: /Log out/ }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
