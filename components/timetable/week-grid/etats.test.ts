/**
 * L'état d'une case, et l'étiquette d'un cours.
 *
 * Deux fonctions pures qui portent la lecture de toute la grille : leur ordre
 * de priorité décide de ce que l'écran montre, et l'arrondi à l'heure décide
 * de ce qu'il cache. Un créneau de 8 h à 8 h 30 doit se voir.
 */

import { describe, expect, it } from "vitest"
import type { TeacherWeek } from "@/lib/contracts/timetable"
import { debuteIci, estBloquant, etatDe } from "./etats"

function semaine(partiel: Partial<TeacherWeek> = {}): TeacherWeek {
  return {
    teacher_id: 1,
    teacher_name: "Jean Kouassi",
    has_declarations: false,
    busy: [],
    open: [],
    ...partiel,
  }
}

describe("etatDe", () => {
  it("dit libre quand rien n'est déclaré ni posé", () => {
    expect(etatDe(semaine(), "monday", 9)).toBe("libre")
  })

  it("voit un cours qui ne remplit pas l'heure entière", () => {
    const s = semaine({
      busy: [
        { day: "monday", start_time: "08:00", end_time: "08:30", kind: "course", label: "Maths", class_name: "6ème A" },
      ],
    })
    expect(etatDe(s, "monday", 8)).toBe("cours")
    expect(etatDe(s, "monday", 9)).toBe("libre")
  })

  it("fait primer le cours sur l'indisponibilité déclarée", () => {
    const s = semaine({
      has_declarations: true,
      busy: [
        { day: "monday", start_time: "08:00", end_time: "10:00", kind: "course", label: "Maths", class_name: "6ème A" },
        { day: "monday", start_time: "08:00", end_time: "10:00", kind: "unavailable", label: "Indisponible", class_name: null },
      ],
    })
    expect(etatDe(s, "monday", 8)).toBe("cours")
  })

  it("ferme le reste de la semaine dès qu'une ouverture est déclarée", () => {
    const s = semaine({
      has_declarations: true,
      open: [{ day: "monday", start_time: "08:00", end_time: "12:00", preferred: false }],
    })
    expect(etatDe(s, "monday", 9)).toBe("ouvert")
    expect(etatDe(s, "monday", 14)).toBe("hors")
    expect(etatDe(s, "friday", 9)).toBe("hors")
  })

  it("ne ferme rien tant qu'aucune ouverture n'est déclarée", () => {
    const s = semaine({
      busy: [
        { day: "tuesday", start_time: "08:00", end_time: "12:00", kind: "unavailable", label: "Indisponible", class_name: null },
      ],
    })
    expect(etatDe(s, "tuesday", 9)).toBe("ferme")
    expect(etatDe(s, "monday", 9)).toBe("libre")
  })
})

describe("estBloquant", () => {
  it("laisse poser sur le libre et sur le déclaré disponible", () => {
    expect(estBloquant("libre")).toBe(false)
    expect(estBloquant("ouvert")).toBe(false)
  })

  it("interdit le cours, la fermeture et le hors-plage", () => {
    expect(estBloquant("cours")).toBe(true)
    expect(estBloquant("ferme")).toBe(true)
    expect(estBloquant("hors")).toBe(true)
  })
})

describe("debuteIci", () => {
  it("n'étiquette qu'une fois un cours de deux heures", () => {
    expect(debuteIci("08:00", 8)).toBe(true)
    expect(debuteIci("08:00", 9)).toBe(false)
  })

  it("étiquette un cours qui commence en cours d'heure", () => {
    expect(debuteIci("08:30", 8)).toBe(true)
  })

  it("ne se prononce pas sur une heure mal formée", () => {
    expect(debuteIci("8h", 8)).toBe(false)
  })
})
