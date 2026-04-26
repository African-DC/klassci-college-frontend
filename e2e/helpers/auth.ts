import { expect, type Page } from '@playwright/test'

const ROLE_PATTERN = /\/(admin|teacher|student|parent)\/dashboard/

/**
 * Login via the credentials form.
 * Asserts redirection to the role's dashboard before returning.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Adresse email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: /Se connecter/i }).click()
  await expect(page).toHaveURL(ROLE_PATTERN, { timeout: 15_000 })
}

export const TEST_USERS = {
  admin: { email: 'admin@klassci.com', password: 'Admin@2026' },
  teacher: { email: 'prof@klassci.com', password: 'Admin@2026' },
  student: { email: 'eleve@klassci.com', password: 'Admin@2026' },
} as const
