import { z } from "zod"

export const EligibleTeacherSchema = z.object({
  id: z.number(),
  full_name: z.string(),
})

export const ClassSubjectTeacherItemSchema = z.object({
  subject_id: z.number(),
  subject_name: z.string(),
  hours_per_week: z.number(),
  series_name: z.string().nullable(),
  eligible_teachers: z.array(EligibleTeacherSchema),
  assigned_teacher_id: z.number().nullable(),
  resolved_teacher_id: z.number().nullable(),
  source: z.enum(["explicit", "single", "none"]),
})

export const ClassSubjectTeachersSchema = z.object({
  class_id: z.number(),
  class_name: z.string(),
  items: z.array(ClassSubjectTeacherItemSchema),
  missing_count: z.number(),
})

export const ClassSubjectTeacherAssignmentSchema = z.object({
  subject_id: z.number(),
  teacher_id: z.number().nullable(),
})

export const ClassSubjectTeachersSaveSchema = z.object({
  assignments: z.array(ClassSubjectTeacherAssignmentSchema).max(60),
})

export type EligibleTeacher = z.infer<typeof EligibleTeacherSchema>
export type ClassSubjectTeacherItem = z.infer<typeof ClassSubjectTeacherItemSchema>
export type ClassSubjectTeachers = z.infer<typeof ClassSubjectTeachersSchema>
export type ClassSubjectTeacherAssignment = z.infer<typeof ClassSubjectTeacherAssignmentSchema>
export type ClassSubjectTeachersSave = z.infer<typeof ClassSubjectTeachersSaveSchema>
