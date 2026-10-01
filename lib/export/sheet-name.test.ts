/**
 * Excel refuse certains noms de feuille, et ExcelJS jette alors une erreur :
 * une classe « T/A 1 » rendait son export impossible. Ces tests construisent
 * le vrai classeur et lisent le nom de feuille qu'il porte.
 */
import { describe, expect, it } from "vitest"
import { buildInformationSheetPayload } from "@/components/admin/classes/information-sheet/information-sheet-export"
import { buildWorkbook } from "./excel"
import { worksheetName } from "./sheet-name"

describe("le nom de la feuille Excel", () => {
  it("exporte la fiche d'une classe « T/A 1 » sous une feuille à son nom, nettoyé", async () => {
    const payload = buildInformationSheetPayload(
      { id: 9, name: "T/A 1", level_name: "Terminale", rows: [] },
      "2026-2027",
      undefined,
    )
    const wb = await buildWorkbook(payload)
    expect(wb.worksheets.map((ws) => ws.name)).toEqual(["T A 1"])
  })

  it("nettoie aussi le titre d'un export ordinaire", async () => {
    const wb = await buildWorkbook({
      branding: { schoolName: "Rostan", primaryColor: "#0F3F8C", accentColor: "#F58220" },
      meta: { title: "Liste de classe · 1ère [C]: sciences/maths et physique" },
      columns: [{ key: "nom", header: "Nom" }],
      rows: [{ nom: "Koné" }],
    })
    const name = wb.worksheets[0].name
    expect(name).not.toMatch(/[\\/?*[\]:]/)
    expect(name.length).toBeLessThanOrEqual(31)
  })

  it("remplace la barre oblique inverse, qu'Excel refuse aussi", () => {
    expect(worksheetName("6e\\1")).toBe("6e 1")
  })

  it("retire une apostrophe laissée en fin de nom par la coupe ou le suffixe", () => {
    const thirty = "A".repeat(30)
    expect(worksheetName(`${thirty}'B`)).toBe(thirty)
    const used = new Set<string>()
    const base = `${"B".repeat(26)}'xyzw`
    expect(worksheetName(base, used)).toBe(base)
    const second = worksheetName(base, used)
    expect(second).toBe(`${"B".repeat(26)} (2)`)
    expect(second).not.toMatch(/'\s*\(/)
    expect(worksheetName("'6ème 1'")).toBe("6ème 1")
  })
})
