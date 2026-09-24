/**
 * L'export porte l'identité de l'établissement, comme ses documents PDF.
 *
 * Réclamation de l'école Rostan : la liste de classe en Excel ne portait que
 * le nom de l'école. Ces tests construisent le vrai classeur et lisent ce qu'il
 * contient : le logo, l'en-tête officiel, et une table de données toujours
 * exploitable (filtres, tri) juste en dessous.
 */
import { describe, expect, it } from "vitest"
import type ExcelJS from "exceljs"
import { buildWorkbook } from "./excel"
import { withLogo } from "./logo"
import type { ExportPayload } from "./types"

// PNG 1×1 transparent : une vraie image, la plus petite possible.
const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

function payload(avecLogo: boolean): ExportPayload {
  return {
    branding: {
      schoolName: "Collège d'excellence Rostan",
      primaryColor: "#0F3F8C",
      accentColor: "#F58220",
      logoDataUrl: avecLogo ? PNG_1PX : undefined,
      ministryCode: "045123",
      address: "Bouaké, quartier Air France",
      phone: "+225 07 00 00 00 00",
      motto: "Travail, Rigueur, Excellence",
    },
    meta: { title: "Liste des élèves", subtitle: "45 élèves", filters: "Classe 6e B" },
    columns: [
      { key: "matricule", header: "Matricule" },
      { key: "nom", header: "Nom et prénoms" },
    ],
    rows: [
      { matricule: "R-001", nom: "Traoré Aminata" },
      { matricule: "R-002", nom: "Koné Moussa" },
    ],
  }
}

function textes(ws: ExcelJS.Worksheet): string[] {
  const vus: string[] = []
  ws.eachRow((row) => row.eachCell((cell) => vus.push(String(cell.value ?? ""))))
  return vus
}

describe("l'en-tête officiel du classeur", () => {
  it("porte le logo de l'établissement quand les paramètres en ont un", async () => {
    const wb = await buildWorkbook(payload(true))
    expect(wb.worksheets[0].getImages()).toHaveLength(1)
  })

  it("dit le ministère, la République, l'école, son code, ses contacts et sa devise", async () => {
    const ws = (await buildWorkbook(payload(true))).worksheets[0]
    const vus = textes(ws)
    expect(vus).toContain("RÉPUBLIQUE DE CÔTE D'IVOIRE")
    expect(vus).toContain("MINISTÈRE DE L'ÉDUCATION NATIONALE ET DE L'ALPHABÉTISATION")
    expect(vus).toContain("COLLÈGE D'EXCELLENCE ROSTAN")
    expect(vus).toContain("Code établissement : 045123")
    expect(vus.some((t) => t.includes("Bouaké") && t.includes("+225"))).toBe(true)
    expect(vus).toContain("Travail, Rigueur, Excellence")
  })

  it("laisse la table de données exploitable : entête, puis toutes les lignes, filtre posé", async () => {
    const ws = (await buildWorkbook(payload(true))).worksheets[0]
    let entete = 0
    ws.eachRow((row, numero) => {
      if (row.getCell(1).value === "Matricule") entete = numero
    })
    expect(entete).toBeGreaterThan(0)
    expect(ws.getRow(entete + 1).getCell(2).value).toBe("Traoré Aminata")
    expect(ws.getRow(entete + 2).getCell(2).value).toBe("Koné Moussa")
    expect(ws.autoFilter).toMatchObject({ from: { row: entete, column: 1 } })
  })

  it("se passe de logo sans rien perdre du reste", async () => {
    const ws = (await buildWorkbook(payload(false))).worksheets[0]
    expect(ws.getImages()).toHaveLength(0)
    expect(textes(ws)).toContain("COLLÈGE D'EXCELLENCE ROSTAN")
  })
})

describe("le chargement du logo", () => {
  const marque = payload(false).branding

  it("ne charge rien quand les paramètres n'ont pas de logo", async () => {
    let appels = 0
    const resultat = await withLogo(marque, async () => {
      appels += 1
      return PNG_1PX
    })
    expect(appels).toBe(0)
    expect(resultat.logoDataUrl).toBeUndefined()
  })

  it("embarque le logo déclaré dans les paramètres", async () => {
    const resultat = await withLogo({ ...marque, logoUrl: "/uploads/logo.webp" }, async () => PNG_1PX)
    expect(resultat.logoDataUrl).toBe(PNG_1PX)
  })

  it("n'empêche jamais l'export quand le logo est illisible", async () => {
    const resultat = await withLogo({ ...marque, logoUrl: "/uploads/absent.png" }, async () => {
      throw new Error("404")
    })
    expect(resultat.logoDataUrl).toBeUndefined()
    expect(resultat.schoolName).toBe(marque.schoolName)
  })
})
