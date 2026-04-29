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

  test('create modal exposes the required student fields', async ({ page }) => {
    // Field-contract assertion : if labels drift (rename, removed),
    // submit-time tests downstream would break with cryptic timeouts.
    // We assert label TEXT (not getByLabel) because the FormLabel→Input
    // for-id association is brittle in prod build (cf helpers/auth.ts).
    await page.goto('/admin/enrollments')
    await page.getByRole('button', { name: /Nouvelle inscription/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await expect(dialog.getByText(/Pr[eé]nom \*/).first()).toBeVisible()
    await expect(dialog.getByText(/^Nom \*$/).first()).toBeVisible()
    await expect(dialog.getByText(/Matricule \*/).first()).toBeVisible()
  })

  test('submitting empty enrollment form keeps the dialog open', async ({ page }) => {
    // Zod + RHF should block submit on missing required fields. We don't
    // assert a specific error copy (it depends on the resolver) — only
    // that the dialog stays open instead of closing on a no-op submit.
    await page.goto('/admin/enrollments')
    await page.getByRole('button', { name: /Nouvelle inscription/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const submit = dialog.getByRole('button', { name: /Enregistrer|Cr[eé]er/i }).first()
    if (await submit.isVisible()) {
      await submit.click()
      // After a failed validation, the dialog must still be visible.
      await expect(dialog).toBeVisible()
    }
  })

  test('cancelling the create dialog returns to the list', async ({ page }) => {
    await page.goto('/admin/enrollments')
    await page.getByRole('button', { name: /Nouvelle inscription/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Most modals expose either a Cancel button or the X close button.
    // Pressing Escape is the universally supported fallback.
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 5_000 })

    // Page heading still visible — we didn't navigate away.
    await expect(
      page.getByRole('heading', { name: /Inscriptions/i }).first(),
    ).toBeVisible()
  })
})
