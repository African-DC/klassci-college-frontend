import { describe, expect, it } from "vitest"
import { rosterFilterQuery } from "@/lib/api/class-roster"
import { buildClassRosterExcel } from "./class-roster-excel"

describe("sélection des listes de classe", () => {
  it("préserve les URL existantes en l'absence de filtres", () => expect(rosterFilterQuery()).toBe(""))
  it("sérialise plusieurs nationalités et statuts sans perdre les autres critères", () => {
    const p = new URLSearchParams(rosterFilterQuery({
      genre: "F", age_min: 12, age_max: 15,
      nationalities: ["Malienne", "Ivoirienne"], assignment_statuses: ["affecte", "reaffecte"],
      is_repeater: false,
    }).slice(1))
    expect(p.getAll("nationalities")).toEqual(["Ivoirienne", "Malienne"])
    expect(p.getAll("assignment_statuses")).toEqual(["affecte", "reaffecte"])
    expect(p.get("genre")).toBe("F")
    expect(p.get("age_max")).toBe("15")
    expect(p.get("is_repeater")).toBe("false")
  })
  it("exporte exactement les lignes fournies, sans fabriquer les champs inconnus", () => {
    const result = buildClassRosterExcel({
      class_name: "6e B", academic_year_name: "2026-2027", total: 1,
      students: [{ enrollment_number: "A01", first_name: "Awa", last_name: "KONE",
        genre: "F", birth_date: null, birth_place: null, nationality: null,
        photo_url: null, parent_phone: null, assignment_status: null,
        is_repeater: null, is_new_student: null }],
    }, undefined)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({ affectation: "", qualite: "", nationalite: "", profil: "" })
  })
})
