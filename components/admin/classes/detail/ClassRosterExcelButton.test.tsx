/**
 * La liste de classe en Excel depuis la fiche de la classe.
 *
 * Le bouton charge TOUS les élèves de CETTE classe (le chargement paginé est
 * testé dans `students-export.test.ts`) et produit un fichier titré à son nom.
 * On observe ce qui est passé au chargement et au générateur de classeur.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const charger = vi.hoisted(() =>
  vi.fn(async () => ({
    branding: { schoolName: "Rostan", primaryColor: "#0F3F8C", accentColor: "#F58220" },
    meta: { title: "Liste des élèves" },
    columns: [{ key: "nom", header: "Nom" }],
    rows: Array.from({ length: 45 }, (_, i) => ({ nom: `Élève ${i + 1}` })),
  })),
)
const exporter = vi.hoisted(() => vi.fn(async () => {}))

vi.mock("@/components/admin/students/students-export", () => ({
  loadStudentsExportPayload: charger,
}))
vi.mock("@/lib/export/excel", () => ({ exportToExcel: exporter }))
vi.mock("@/lib/hooks/useSettings", () => ({ useSettings: () => ({ data: undefined }) }))

import { ClassRosterExcelButton } from "./ClassRosterExcelButton"

describe("la liste de classe en Excel", () => {
  it("charge les élèves de cette classe et titre le fichier à son nom", async () => {
    render(<ClassRosterExcelButton classId={12} className="6e B" />)
    fireEvent.click(screen.getByRole("button", { name: /en Excel/ }))

    await waitFor(() => expect(exporter).toHaveBeenCalledOnce())
    expect(charger).toHaveBeenCalledWith(
      expect.objectContaining({ params: { class_id: 12 }, filters: "Classe 6e B" }),
    )
    const [payload, fichier] = exporter.mock.calls[0] as unknown as [
      { meta: { title: string }; rows: unknown[] },
      string,
    ]
    expect(payload.meta.title).toBe("Liste de classe · 6e B")
    expect(payload.rows).toHaveLength(45)
    expect(fichier).toBe("liste-classe-6e-b")
  })
})
