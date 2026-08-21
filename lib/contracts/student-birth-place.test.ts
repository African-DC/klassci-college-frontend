import { describe, expect, it } from "vitest"
import {
  StudentCreateSchema,
  StudentFullSchema,
  StudentSchema,
  StudentUpdateSchema,
} from "./student"

/**
 * Le lieu de naissance doit traverser le contrat sans se perdre.
 *
 * Sur les pièces officielles ivoiriennes un élève est identifié par
 * « né(e) le ... à ... ». Un champ saisi côté formulaire mais absent du
 * schéma de lecture ressort silencieusement vide sur la fiche détail : c'est
 * exactement ce qui s'était produit ici, la ligne « Lieu de naissance »
 * existait à l'écran et n'était jamais alimentée.
 */

const baseStudent = {
  id: 1,
  first_name: "Aya",
  last_name: "Koffi",
  birth_date: "2010-05-15",
  birth_place: "Bouaké",
  genre: "F" as const,
  enrollment_number: "2024-001",
  user_id: null,
}

describe("lieu de naissance dans le contrat élève", () => {
  it("se lit sur la fiche élève", () => {
    const parsed = StudentSchema.parse(baseStudent)

    expect(parsed.birth_place).toBe("Bouaké")
  })

  it("reste facultatif : les anciens dossiers ne le portent pas", () => {
    const { birth_place: _omitted, ...withoutPlace } = baseStudent
    const parsed = StudentSchema.parse(withoutPlace)

    expect(parsed.birth_place).toBeUndefined()
  })

  it("accepte null, ce que renvoie le backend pour un élève sans lieu saisi", () => {
    const parsed = StudentSchema.parse({ ...baseStudent, birth_place: null })

    expect(parsed.birth_place).toBeNull()
  })

  it("part bien dans la création d'un élève", () => {
    const parsed = StudentCreateSchema.parse({
      first_name: "Aya",
      last_name: "Koffi",
      email: "aya@example.ci",
      password: "Passw0rd!",
      birth_date: "2010-05-15",
      birth_place: "Man",
    })

    expect(parsed.birth_place).toBe("Man")
  })

  it("part bien dans la modification d'un élève", () => {
    const parsed = StudentUpdateSchema.parse({ birth_place: "Korhogo" })

    expect(parsed.birth_place).toBe("Korhogo")
  })

  it("se lit sur la vue détaillée qui alimente l'onglet Profil", () => {
    const parsed = StudentFullSchema.parse({
      ...baseStudent,
      attendance_total: 0,
      attendance_present: 0,
      attendance_absent: 0,
      attendance_late: 0,
      attendance_rate: 0,
      trimester_grades: [],
      trimester_absences: [],
    })

    expect(parsed.birth_place).toBe("Bouaké")
  })
})
