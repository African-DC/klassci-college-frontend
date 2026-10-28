import { describe, expect, it } from "vitest"
import type { ClassSubjectTeacherItem } from "@/lib/contracts/class-subject-teachers"
import {
  buildDraft,
  changedAssignments,
  messageFromError,
} from "./class-teachers-helpers"

function item(over: Partial<ClassSubjectTeacherItem>): ClassSubjectTeacherItem {
  return {
    subject_id: 1,
    subject_name: "Mathématiques",
    hours_per_week: 4,
    series_name: null,
    eligible_teachers: [],
    assigned_teacher_id: null,
    resolved_teacher_id: null,
    source: "none",
    ...over,
  }
}

describe("brouillon des enseignants par matière", () => {
  it("pré-sélectionne l'unique enseignant possible quand rien n'est retenu", () => {
    const items = [
      item({ subject_id: 1, eligible_teachers: [{ id: 7, full_name: "Aïssatou Diallo" }] }),
      item({ subject_id: 2, eligible_teachers: [] }),
    ]
    expect(buildDraft(items)).toEqual({ 1: 7, 2: null })
  })

  it("n'envoie que les lignes qui changent par rapport au serveur", () => {
    const items = [
      item({
        subject_id: 1,
        eligible_teachers: [{ id: 7, full_name: "Aïssatou Diallo" }],
        assigned_teacher_id: null,
      }),
      item({
        subject_id: 2,
        eligible_teachers: [
          { id: 8, full_name: "Koffi Traoré" },
          { id: 9, full_name: "Awa Kouamé" },
        ],
        assigned_teacher_id: 9,
      }),
    ]
    const draft = { 1: 7, 2: 9 }
    expect(changedAssignments(items, draft)).toEqual([{ subject_id: 1, teacher_id: 7 }])
  })

  it("envoie null pour retirer un enseignant retenu", () => {
    const items = [item({ subject_id: 3, assigned_teacher_id: 8 })]
    expect(changedAssignments(items, { 3: null })).toEqual([{ subject_id: 3, teacher_id: null }])
  })
})

describe("messageFromError", () => {
  it("reprend le détail français renvoyé par le backend", () => {
    const err = Object.assign(new Error("HTTP 422"), { detail: "Matière sans enseignant retenu" })
    expect(messageFromError(err)).toBe("Matière sans enseignant retenu")
  })

  it("retombe sur le message de l'erreur quand il n'y a pas de détail", () => {
    expect(messageFromError(new Error("Réseau indisponible"))).toBe("Réseau indisponible")
    expect(messageFromError("bizarre")).toBe("Erreur inconnue")
  })
})
