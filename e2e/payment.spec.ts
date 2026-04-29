import { expect, test } from '@playwright/test'
import { TEST_USERS, loginAs } from './helpers/auth'

test.describe('Payments list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password)
  })

  test('admin can navigate to payments and see the table', async ({ page }) => {
    await page.goto('/admin/payments')
    await expect(page).toHaveURL(/\/admin\/payments/)

    const heading = page.getByRole('heading', { name: /Paiements/i }).first()
    await expect(heading).toBeVisible({ timeout: 10_000 })

    // Either CTA or empty-state — both confirm the page rendered
    const cta = page.getByRole('button', { name: /Enregistrer|Nouveau paiement/i }).first()
    await expect(cta).toBeVisible({ timeout: 10_000 })
  })

  test('opening the payment modal renders the dialog title', async ({ page }) => {
    await page.goto('/admin/payments')
    await page.getByRole('button', { name: /Enregistrer|Nouveau paiement/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await expect(dialog.getByRole('heading', { name: /Nouveau paiement/i }).first())
      .toBeVisible()
  })

  test('escape closes the payment dialog without leaving the list', async ({ page }) => {
    // Validates Dialog primitive behaviour : Escape closes, page state intact.
    // Form field contracts require seeded fee variants (S2 work).
    await page.goto('/admin/payments')
    await page.getByRole('button', { name: /Enregistrer|Nouveau paiement/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 5_000 })

    await expect(page.getByRole('heading', { name: /Paiements/i }).first()).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/payments/)
  })
})
