import { expect, test } from '@playwright/test'
import { TEST_USERS, loginAs } from './helpers/auth'

test.describe('Enrollment list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password)
  })

  test('admin can navigate to enrollments and see the table', async ({ page }) => {
    await page.goto('/admin/enrollments')
    await expect(page).toHaveURL(/\/admin\/enrollments/)

    // Page heading or tab title
    const heading = page.getByRole('heading', { name: /Inscriptions/i }).first()
    await expect(heading).toBeVisible({ timeout: 10_000 })

    // CTA "Nouvelle inscription" should be present
    await expect(
      page.getByRole('button', { name: /Nouvelle inscription|Ajouter/i }).first(),
    ).toBeVisible()
  })

  test('opening the create modal renders the enrollment form', async ({ page }) => {
    await page.goto('/admin/enrollments')
    await page.getByRole('button', { name: /Nouvelle inscription/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await expect(dialog.getByRole('heading', { name: /Inscription|Nouvelle/i }).first())
      .toBeVisible()
  })
})
