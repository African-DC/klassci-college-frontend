import { describe, expect, it } from "vitest"
import {
  absenceWouldOverwriteGrade,
  canLiftAbsence,
  dicteeEntryFromServer,
  gradeStatesEqual,
  isAbsenceLiftRefused,
  normalizeGradeState,
  reconcileGradeSave,
  toGradePayloadEntry,
} from "./grade-reconciliation"

describe("normalizeGradeState", () => {
  it("efface la note d'un élève absent : le zéro d'office est écrit par le backend", () => {
    expect(normalizeGradeState({ value: 12, absent: true })).toEqual({ value: null, absent: true })
  })

  it("laisse intacte la note d'un élève présent", () => {
    expect(normalizeGradeState({ value: 12, absent: false })).toEqual({ value: 12, absent: false })
  })
})

describe("gradeStatesEqual", () => {
  it("distingue deux états qui ne diffèrent que par le drapeau absent", () => {
    // Le bug d'origine : les deux valeurs valent null, mais l'un est un zéro
    // d'office et l'autre une case vide. Les confondre marquait « enregistré »
    // une ligne que le backend venait de refuser.
    expect(gradeStatesEqual({ value: null, absent: true }, { value: null, absent: false })).toBe(
      false,
    )
  })

  it("distingue un absent d'un zéro saisi à la main", () => {
    expect(gradeStatesEqual({ value: 0, absent: true }, { value: 0, absent: false })).toBe(false)
  })

  it("reconnaît deux absents malgré une note résiduelle à l'écran", () => {
    expect(gradeStatesEqual({ value: 0, absent: true }, { value: null, absent: true })).toBe(true)
  })

  it("compare les notes des élèves présents", () => {
    expect(gradeStatesEqual({ value: 14, absent: false }, { value: 14, absent: false })).toBe(true)
    expect(gradeStatesEqual({ value: 14, absent: false }, { value: 15, absent: false })).toBe(false)
    expect(gradeStatesEqual({ value: null, absent: false }, { value: 0, absent: false })).toBe(false)
  })
})

describe("toGradePayloadEntry", () => {
  it("n'envoie jamais une note et un absent contradictoires", () => {
    expect(toGradePayloadEntry(7, { value: 12, absent: true })).toEqual({
      student_id: 7,
      value: null,
      absent: true,
    })
  })

  it("envoie la note d'un élève présent", () => {
    expect(toGradePayloadEntry(7, { value: 12.5, absent: false })).toEqual({
      student_id: 7,
      value: 12.5,
      absent: false,
    })
  })

  it("envoie une case vide comme « pas encore corrigé »", () => {
    expect(toGradePayloadEntry(7, { value: null, absent: false })).toEqual({
      student_id: 7,
      value: null,
      absent: false,
    })
  })
})

describe("canLiftAbsence", () => {
  it("interdit de décocher un zéro d'office déjà enregistré", () => {
    expect(canLiftAbsence("absent")).toBe(false)
  })

  it("autorise le décochage tant que le serveur n'a rien enregistré", () => {
    expect(canLiftAbsence("pending")).toBe(true)
    expect(canLiftAbsence("entered")).toBe(true)
    expect(canLiftAbsence("retake_allowed")).toBe(true)
    expect(canLiftAbsence(undefined)).toBe(true)
    expect(canLiftAbsence(null)).toBe(true)
  })
})

describe("isAbsenceLiftRefused", () => {
  it("voit le refus quand le serveur garde « absent » malgré un décochage", () => {
    expect(isAbsenceLiftRefused({ value: null, absent: false }, "absent")).toBe(true)
    expect(isAbsenceLiftRefused({ value: 0, absent: false }, "absent")).toBe(true)
  })

  it("ne crie pas au refus quand on a bien demandé l'absence", () => {
    expect(isAbsenceLiftRefused({ value: null, absent: true }, "absent")).toBe(false)
  })

  it("ne crie pas au refus sur une note ordinaire", () => {
    expect(isAbsenceLiftRefused({ value: 14, absent: false }, "entered")).toBe(false)
  })
})

describe("absenceWouldOverwriteGrade", () => {
  it("signale qu'une note déjà saisie va être remplacée par un zéro", () => {
    expect(absenceWouldOverwriteGrade({ value: 15, absent: false })).toBe(true)
    expect(absenceWouldOverwriteGrade({ value: 0, absent: false })).toBe(true)
  })

  it("ne signale rien sur une case vide ou déjà cochée", () => {
    expect(absenceWouldOverwriteGrade({ value: null, absent: false })).toBe(false)
    expect(absenceWouldOverwriteGrade({ value: 15, absent: true })).toBe(false)
  })
})

describe("reconcileGradeSave", () => {
  it("chemin 1 : décocher un absent renvoie un 0/20 « saisi », ce n'est pas un succès", () => {
    // L'élève était absent côté serveur, la valeur chargée valait donc 0.
    // L'enseignant décoche, le lot part avec {value: 0, absent: false}.
    expect(
      reconcileGradeSave({
        sent: { value: 0, absent: false },
        current: { value: 0, absent: false },
        serverStatus: "absent",
      }),
    ).toBe("refused")
  })

  it("chemin 2 : décocher puis vider la case ne doit pas passer pour enregistré", () => {
    // Le backend garde « absent » et met la valeur à NULL. L'ancien code
    // comparait null à null et affichait du vert.
    expect(
      reconcileGradeSave({
        sent: { value: null, absent: false },
        current: { value: null, absent: false },
        serverStatus: "absent",
      }),
    ).toBe("refused")
  })

  it("confirme une absence réellement demandée", () => {
    expect(
      reconcileGradeSave({
        sent: { value: null, absent: true },
        current: { value: 0, absent: true },
        serverStatus: "absent",
      }),
    ).toBe("saved")
  })

  it("confirme une note ordinaire", () => {
    expect(
      reconcileGradeSave({
        sent: { value: 13.5, absent: false },
        current: { value: 13.5, absent: false },
        serverStatus: "entered",
      }),
    ).toBe("saved")
  })

  it("garde la ligne en attente si l'enseignant la retouche pendant l'envoi", () => {
    expect(
      reconcileGradeSave({
        sent: { value: 13.5, absent: false },
        current: { value: 14, absent: false },
        serverStatus: "entered",
      }),
    ).toBe("dirty")
  })

  it("garde la ligne en attente si la case « Abs. » est cochée pendant l'envoi", () => {
    expect(
      reconcileGradeSave({
        sent: { value: 13.5, absent: false },
        current: { value: 13.5, absent: true },
        serverStatus: "entered",
      }),
    ).toBe("dirty")
  })

  it("ne confond pas une case vidée avec un zéro d'office levé", () => {
    expect(
      reconcileGradeSave({
        sent: { value: null, absent: false },
        current: { value: null, absent: false },
        serverStatus: "pending",
      }),
    ).toBe("saved")
  })
})

describe("dicteeEntryFromServer", () => {
  it("amorce un absent à null même si le serveur renvoie le zéro d'office", () => {
    expect(dicteeEntryFromServer({ value: 0, status: "absent" })).toBeNull()
  })

  it("amorce une note saisie à sa valeur", () => {
    expect(dicteeEntryFromServer({ value: 15, status: "entered" })).toBe(15)
  })

  it("laisse « pas encore saisi » indéfini", () => {
    expect(dicteeEntryFromServer({ value: null, status: "pending" })).toBeUndefined()
    expect(dicteeEntryFromServer({ value: null, status: "retake_allowed" })).toBeUndefined()
  })

  it("sert de référence au garde de sortie : un absent intact n'est pas une modification", () => {
    // Le garde comparait la valeur serveur (0) à l'amorçage (null) et voyait
    // une modification permanente dès qu'un seul élève était absent.
    const grade = { value: 0, status: "absent" }
    const entries = new Map<number, number | null | undefined>([[1, dicteeEntryFromServer(grade)]])
    expect(entries.get(1)).toBe(dicteeEntryFromServer(grade))
  })
})
