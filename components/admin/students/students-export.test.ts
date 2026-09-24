/**
 * L'export Excel d'une liste de classe.
 *
 * Signalé par une responsable d'établissement : « quand j'envoie sur Excel,
 * le nombre d'élèves n'est pas exact ». L'export reprenait les lignes déjà
 * chargées à l'écran, soit les 20 premières d'une classe qui en compte 45.
 */

import { describe, expect, it, vi } from "vitest"
import type { PaginatedResponse } from "@/lib/contracts"
import type { Student } from "@/lib/contracts/student"
import { buildStudentsExportPayload, loadStudentsExportPayload } from "./students-export"

function eleve(id: number): Student {
  return {
    id,
    first_name: `Prénom${id}`,
    last_name: `NOM${String(id).padStart(3, "0")}`,
    enrollment_number: `MAT-${id}`,
    genre: id % 2 === 0 ? "F" : "M",
    birth_date: "2012-03-14",
    birth_place: "Bouaké",
    current_enrollment: { id: 1000 + id, class_name: "6ème A", status: "valide" },
  } as unknown as Student
}

/**
 * Une API qui se comporte comme la vraie : 20 lignes par défaut, 100 au
 * plus, une liste vide au-delà du plafond.
 */
function fausseApi(effectif: number) {
  const tous = Array.from({ length: effectif }, (_, i) => eleve(i + 1))
  return vi.fn(async (params: Record<string, unknown>): Promise<PaginatedResponse<Student>> => {
    const page = Number(params.page ?? 1)
    const size = Number(params.size ?? 20)
    if (size > 100) return { items: [], total: 0, page, size, total_pages: 0 }
    const items = tous.slice((page - 1) * size, page * size)
    return { items, total: effectif, page, size, total_pages: Math.ceil(effectif / size) }
  })
}

describe("l'export Excel d'une classe", () => {
  it("contient tous les élèves de la classe, pas seulement la première page", async () => {
    const list = fausseApi(45)

    const payload = await loadStudentsExportPayload({
      params: { class_id: 7 },
      settings: undefined,
      filters: "Classe 6ème A",
      list,
    })

    expect(payload.rows).toHaveLength(45)
    expect(payload.meta.subtitle).toBe("45 élèves")
    // Le filtre de classe est bien transmis à chaque page demandée.
    for (const [params] of list.mock.calls) expect(params.class_id).toBe(7)
  })

  it("dépasse le plafond de 100 lignes par page de l'API", async () => {
    const payload = await loadStudentsExportPayload({
      params: {},
      settings: undefined,
      list: fausseApi(230),
    })

    expect(payload.rows).toHaveLength(230)
    expect(new Set(payload.rows.map((r) => r.matricule)).size).toBe(230)
  })

  it("écrit le statut comme à l'écran, pas le code de la base", async () => {
    const payload = await loadStudentsExportPayload({
      params: {},
      settings: undefined,
      list: fausseApi(1),
    })

    expect(payload.rows[0].statut).toBe("Inscrit")
  })
})

describe("nom et prénoms", () => {
  it("sont dans deux colonnes distinctes", () => {
    const payload = buildStudentsExportPayload({
      students: [{ ...eleve(1), last_name: "Traoré", first_name: "Aminata Awa" }],
      settings: undefined,
    })
    expect(payload.columns.map((c) => c.header)).toEqual(
      expect.arrayContaining(["Nom", "Prénoms"]),
    )
    expect(payload.rows[0]).toMatchObject({ nom: "Traoré", prenoms: "Aminata Awa" })
  })
})
