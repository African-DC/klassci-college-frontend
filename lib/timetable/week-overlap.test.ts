/**
 * L'avertissement affiché pendant la saisie doit dire la même chose que le
 * refus du backend — sinon la personne corrige le mauvais champ.
 */

import { describe, expect, it } from "vitest"
import type { TeacherWeek } from "@/lib/contracts/timetable"
import { seChevauchent, trouverEmpechement } from "./week-overlap"

function semaine(partiel: Partial<TeacherWeek> = {}): TeacherWeek {
  return {
    teacher_id: 1,
    teacher_name: "Jean-Baptiste Kouassi",
    has_declarations: false,
    busy: [],
    open: [],
    ...partiel,
  }
}

describe("seChevauchent", () => {
  it("voit un chevauchement partiel", () => {
    expect(seChevauchent("09:00", "11:00", "10:00", "12:00")).toBe(true)
  })

  it("laisse passer deux cours bout à bout", () => {
    expect(seChevauchent("08:00", "10:00", "10:00", "11:00")).toBe(false)
  })

  it("ne se prononce pas sur une heure mal formée", () => {
    expect(seChevauchent("8h", "10:00", "09:00", "11:00")).toBe(false)
  })
})

describe("trouverEmpechement", () => {
  it("ne bloque rien tant que la saisie est incomplète", () => {
    expect(trouverEmpechement(semaine(), "lundi", "", "")).toBeNull()
    expect(trouverEmpechement(undefined, "lundi", "08:00", "09:00")).toBeNull()
  })

  it("nomme le cours, la classe et l'heure qui bloquent", () => {
    const s = semaine({
      busy: [
        {
          day: "monday",
          start_time: "08:00",
          end_time: "10:00",
          kind: "course",
          label: "Mathématiques",
          class_name: "6e B",
        },
      ],
    })

    const e = trouverEmpechement(s, "lundi", "09:00", "11:00")

    expect(e?.kind).toBe("course")
    expect(e?.message).toContain("Jean-Baptiste Kouassi")
    expect(e?.message).toContain("Mathématiques")
    expect(e?.message).toContain("6e B")
    expect(e?.message).toContain("08:00 à 10:00")
  })

  it("distingue une plage fermée d'un cours", () => {
    const s = semaine({
      busy: [
        {
          day: "monday",
          start_time: "15:00",
          end_time: "16:00",
          kind: "unavailable",
          label: "Indisponible",
          class_name: null,
        },
      ],
    })

    const e = trouverEmpechement(s, "lundi", "15:30", "17:00")

    expect(e?.kind).toBe("closed")
    expect(e?.message).toContain("indisponible")
    expect(e?.message).not.toContain("6e")
  })

  it("ferme le reste de la semaine dès qu'une plage est déclarée", () => {
    const s = semaine({
      has_declarations: true,
      open: [{ day: "monday", start_time: "08:00", end_time: "12:00", preferred: false }],
    })

    expect(trouverEmpechement(s, "lundi", "09:00", "10:00")).toBeNull()

    const e = trouverEmpechement(s, "mardi", "09:00", "10:00")
    expect(e?.kind).toBe("not_open")
    expect(e?.message).toContain("disponibilités")
  })

  it("refuse un créneau qui déborde de la plage ouverte", () => {
    const s = semaine({
      has_declarations: true,
      open: [{ day: "monday", start_time: "08:00", end_time: "10:00", preferred: false }],
    })

    expect(trouverEmpechement(s, "lundi", "09:00", "11:00")?.kind).toBe("not_open")
  })

  it("ne contraint rien quand l'enseignant n'a rien déclaré", () => {
    expect(trouverEmpechement(semaine(), "samedi", "17:00", "18:00")).toBeNull()
  })

  it("accepte le jour déjà en anglais", () => {
    const s = semaine({
      busy: [
        {
          day: "monday",
          start_time: "08:00",
          end_time: "10:00",
          kind: "course",
          label: "Français",
          class_name: "5e A",
        },
      ],
    })

    expect(trouverEmpechement(s, "monday", "09:00", "10:00")?.kind).toBe("course")
  })
})
