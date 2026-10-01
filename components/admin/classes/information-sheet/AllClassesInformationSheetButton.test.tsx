/**
 * Une année sans inscription n'est pas une panne : le bouton le dit sans
 * rouge, et ne tente pas de produire un classeur vide.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const toasts = vi.hoisted(() => ({ loading: vi.fn(() => "t"), info: vi.fn(), error: vi.fn(), success: vi.fn() }))
const exporter = vi.hoisted(() => vi.fn())

vi.mock("sonner", () => ({ toast: toasts }))
vi.mock("@/lib/export/excel-sheets", () => ({ exportSheetsToExcel: exporter }))
vi.mock("@/lib/hooks/useSettings", () => ({ useSettings: () => ({ data: undefined }) }))
vi.mock("@/lib/hooks/usePermissions", () => ({ usePermissions: () => ({ has: () => true }) }))
vi.mock("@/lib/api/information-sheet", () => ({
  informationSheetApi: {
    forYear: async () => ({ academic_year: { id: 1, name: "2026-2027" }, classes: [] }),
  },
}))

import { AllClassesInformationSheetButton } from "./AllClassesInformationSheetButton"

describe("les fiches de toutes les classes", () => {
  it("informe, sans erreur, quand l'année n'a aucune classe inscrite", async () => {
    render(<AllClassesInformationSheetButton className="h-9" />)
    const button = screen.getByRole("button", { name: /Fiches de renseignements/ })
    // Cible tactile : h-11 sur téléphone, même quand le hero impose h-9.
    expect(button.className).toContain("h-11")
    expect(button.className).toContain("sm:h-9")

    fireEvent.click(button)
    await waitFor(() => expect(toasts.info).toHaveBeenCalledOnce())
    expect(toasts.error).not.toHaveBeenCalled()
    expect(exporter).not.toHaveBeenCalled()
  })
})
