/**
 * Les minutes, précisément.
 *
 * Le cas qui a motivé ce module : un cours finit à 9 h 30. Il doit interdire
 * de poser à 9 h, et laisser poser à 9 h 30. La grille raisonnait en heures
 * pleines et refusait les deux.
 */

import { describe, expect, it } from "vitest"
import type { TeacherWeek } from "@/lib/contracts/timetable"
import { JOURNEE, complement, creneauLibreAutour, fusionner, occupationsDuJour } from "./occupation"

const h = (heures: number, minutes = 0) => heures * 60 + minutes

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

const COURS_MATIN = {
  day: "monday" as const,
  start_time: "09:00",
  end_time: "09:30",
  kind: "course" as const,
  label: "Maths",
  class_name: "6ème A",
}

describe("un cours qui finit à la demie", () => {
  const occ = () => occupationsDuJour(semaine({ busy: [COURS_MATIN] }), "monday")

  it("interdit de commencer pendant", () => {
    expect(creneauLibreAutour(occ(), h(9))).toBeNull()
    expect(creneauLibreAutour(occ(), h(9, 15))).toBeNull()
  })

  it("laisse commencer dès la fin du cours", () => {
    const libre = creneauLibreAutour(occ(), h(9, 30))
    expect(libre).not.toBeNull()
    expect(libre!.debut).toBe(h(9, 30))
    expect(libre!.fin).toBe(JOURNEE.fin)
  })

  it("borne le trait venu d'avant au début du cours", () => {
    const libre = creneauLibreAutour(occ(), h(8))
    expect(libre).toEqual({ debut: JOURNEE.debut, fin: h(9) })
  })

  it("ne borne rien un autre jour", () => {
    const autre = occupationsDuJour(semaine({ busy: [COURS_MATIN] }), "tuesday")
    expect(creneauLibreAutour(autre, h(9))).toEqual(JOURNEE)
  })
})

describe("occupationsDuJour", () => {
  it("compte les cours et les fermetures ensemble", () => {
    const s = semaine({
      busy: [
        COURS_MATIN,
        { day: "monday", start_time: "14:00", end_time: "16:00", kind: "unavailable", label: "Indisponible", class_name: null },
      ],
    })
    expect(occupationsDuJour(s, "monday")).toEqual([
      { debut: h(9), fin: h(9, 30) },
      { debut: h(14), fin: h(16) },
    ])
  })

  it("ferme tout ce qui tombe hors des ouvertures déclarées", () => {
    const s = semaine({
      has_declarations: true,
      open: [{ day: "monday", start_time: "08:00", end_time: "12:00", preferred: false }],
    })
    expect(occupationsDuJour(s, "monday")).toEqual([
      { debut: JOURNEE.debut, fin: h(8) },
      { debut: h(12), fin: JOURNEE.fin },
    ])
    expect(creneauLibreAutour(occupationsDuJour(s, "monday"), h(9))).toEqual({
      debut: h(8),
      fin: h(12),
    })
  })

  it("ne ferme rien quand aucune ouverture n'est déclarée", () => {
    expect(occupationsDuJour(semaine(), "monday")).toEqual([])
  })
})

describe("fusionner", () => {
  it("réunit deux plages qui se touchent", () => {
    expect(fusionner([{ debut: 60, fin: 120 }, { debut: 120, fin: 180 }])).toEqual([
      { debut: 60, fin: 180 },
    ])
  })

  it("réunit deux plages qui se chevauchent, quel que soit l'ordre", () => {
    expect(fusionner([{ debut: 120, fin: 200 }, { debut: 60, fin: 150 }])).toEqual([
      { debut: 60, fin: 200 },
    ])
  })

  it("laisse séparé ce qui ne se touche pas", () => {
    expect(fusionner([{ debut: 60, fin: 120 }, { debut: 180, fin: 240 }])).toHaveLength(2)
  })
})

describe("complement", () => {
  it("rend la journée entière quand rien n'occupe", () => {
    expect(complement([], JOURNEE)).toEqual([JOURNEE])
  })

  it("ne rend rien quand tout est occupé", () => {
    expect(complement([JOURNEE], JOURNEE)).toEqual([])
  })

  it("rend les trous, bornés à la journée", () => {
    expect(complement([{ debut: h(6), fin: h(9) }, { debut: h(12), fin: h(20) }], JOURNEE)).toEqual([
      { debut: h(9), fin: h(12) },
    ])
  })
})
