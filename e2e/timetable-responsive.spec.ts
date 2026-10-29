import { expect, test } from "@playwright/test"
import { TEST_USERS, loginAs } from "./helpers/auth"

test.describe("Emploi du temps — affichage multi-écrans", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password)
  })

  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`garde l'accès aux commandes sans débordement à ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 820 })
      await page.goto("/admin/timetable")
      await expect(page.getByRole("heading", { name: "Emploi du temps" })).toBeVisible()
      await expect(page.getByRole("combobox", { name: "Sélectionner une classe" })).toBeVisible()
      const widths = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }))
      expect(widths.content).toBeLessThanOrEqual(widths.viewport + 2)
    })
  }
})
