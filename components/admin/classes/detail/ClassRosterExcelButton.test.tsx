/**
 * La liste de classe en Excel depuis la fiche de la classe.
 *
 * Le bouton charge TOUS les élèves de CETTE classe (le chargement paginé est
 * testé dans `students-export.test.ts`) et produit un fichier titré à son nom.
 * On observe ce qui est passé au chargement et au générateur de classeur.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const charger = vi.hoisted(() => vi.fn(async () => ({
  class_name: "6e B", academic_year_name: "2026-2027", total: 45,
  students: Array.from({ length: 45 }, (_, i) => ({
    enrollment_number: `MAT-${i + 1}`, last_name: `Élève ${i + 1}`, first_name: "A",
  })),
})))
const exporter = vi.hoisted(() => vi.fn(async () => {}))

vi.mock("@/lib/api/class-roster", () => ({ fetchClassRosterData: charger }))
vi.mock("@/lib/export/excel", () => ({ exportToExcel: exporter }))
vi.mock("@/lib/hooks/useSettings", () => ({ useSettings: () => ({ data: undefined }) }))

import { ClassRosterExcelButton } from "./ClassRosterExcelButton"

describe("la liste de classe en Excel", () => {
  it("charge les élèves de cette classe et titre le fichier à son nom", async () => {
    render(<ClassRosterExcelButton classId={12} className="6e B" />)
    fireEvent.click(screen.getByRole("button", { name: /en Excel/ }))

    await waitFor(() => expect(exporter).toHaveBeenCalledOnce())
    expect(charger).toHaveBeenCalledWith(12)
    const [payload, fichier] = exporter.mock.calls[0] as unknown as [
      { meta: { title: string }; rows: unknown[] },
      string,
    ]
    expect(payload.meta.title).toBe("Liste de classe · 6e B")
    expect(payload.rows).toHaveLength(45)
    expect(fichier).toBe("liste-classe-6e-b")
  })
})
