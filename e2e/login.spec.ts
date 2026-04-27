import { expect, test } from '@playwright/test'
import { TEST_USERS, loginAs } from './helpers/auth'

test.describe('Login flow', () => {
  test('admin login redirects to /admin/dashboard', async ({ page }) => {
    await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password)
    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })

  test('invalid credentials show inline error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('nom@etablissement.cd').fill('nope@klassci.com')
    await page.getByPlaceholder('Entrez votre mot de passe').fill('wrongpass123')
    await page.getByRole('button', { name: /Se connecter/i }).click()
    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('login form requires email and password', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /Se connecter/i }).click()
    // HTML5 validation prevents submit; URL must remain /login
    await expect(page).toHaveURL(/\/login/)
  })
})
