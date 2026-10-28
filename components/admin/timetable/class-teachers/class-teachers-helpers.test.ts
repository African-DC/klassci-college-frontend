import { describe, expect, it } from "vitest"
import type { ClassSubjectTeacherItem } from "@/lib/contracts/class-subject-teachers"
import {
  buildDraft,
  changedAssignments,
  countMissing,
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
  it("reprend l'enseignant que le serveur retient pour chaque matière", () => {
    const items = [
      item({ subject_id: 1, resolved_teacher_id: 7, source: "single" }),
      item({ subject_id: 2, resolved_teacher_id: null, source: "none" }),
    ]
    expect(buildDraft(items)).toEqual({ 1: 7, 2: null })
  })

  it("n'envoie rien tant que le brouillon suit le serveur", () => {
    const items = [
      item({ subject_id: 1, resolved_teacher_id: 7, source: "single" }),
      item({ subject_id: 2, assigned_teacher_id: 9, resolved_teacher_id: 9, source: "explicit" }),
    ]
    expect(changedAssignments(items, buildDraft(items))).toEqual([])
  })

  it("n'envoie que les lignes qui s'écartent de ce que le serveur retient", () => {
    const items = [
      item({ subject_id: 1, resolved_teacher_id: 7, source: "single" }),
      item({ subject_id: 2, assigned_teacher_id: 9, resolved_teacher_id: 9, source: "explicit" }),
    ]
    expect(changedAssignments(items, { 1: 7, 2: 8 })).toEqual([{ subject_id: 2, teacher_id: 8 }])
  })

  it("envoie null pour retirer un enseignant retenu", () => {
    const items = [item({ subject_id: 3, assigned_teacher_id: 8, resolved_teacher_id: 8, source: "explicit" })]
    expect(changedAssignments(items, { 3: null })).toEqual([{ subject_id: 3, teacher_id: null }])
  })

  it("compte les matières sans enseignant dans le brouillon, pas dans le serveur", () => {
    const items = [
      item({ subject_id: 1, resolved_teacher_id: 7, source: "single" }),
      item({ subject_id: 2, resolved_teacher_id: null, source: "none" }),
    ]
    expect(countMissing(items, buildDraft(items))).toBe(1)
    expect(countMissing(items, { 1: null, 2: null })).toBe(2)
  })
})
