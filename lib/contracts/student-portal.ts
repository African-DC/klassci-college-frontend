import { z } from "zod"

// Contrats pour le portail élève — endpoints /student/*

// Dashboard élève
export const StudentNextCourseSchema = z.object({
  subject_name: z.string(),
  teacher_name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  room: z.string().nullish(),
})

export const StudentDashboardSchema = z.object({
  student_name: z.string(),
  class_name: z.string(),
  next_course: StudentNextCourseSchema.nullable(),
  general_average: z.number().nullable(),
  fees_remaining: z.number(),
  total_absences: z.number(),
})

// Notes par matière
export const StudentGradeEntrySchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(["devoir", "interro", "examen", "composition"]),
  date: z.string(),
  coefficient: z.number(),
  value: z.number().nullable(),
  out_of: z.number(),
})

export const StudentSubjectGradesSchema = z.object({
  subject_id: z.number(),
  subject_name: z.string(),
  coefficient: z.number(),
  average: z.number().nullable(),
  grades: z.array(StudentGradeEntrySchema),
})

export const StudentGradesResponseSchema = z.object({
  trimester: z.string(),
  general_average: z.number().nullable(),
  rank: z.number().nullable(),
  total_students: z.number(),
  subjects: z.array(StudentSubjectGradesSchema),
})

// Frais élève
export const StudentFeeItemSchema = z.object({
  id: z.number(),
  category_name: z.string(),
  total_amount: z.number(),
  paid_amount: z.number(),
  remaining: z.number(),
  status: z.enum(["paye", "partiel", "impaye"]),
  last_payment_date: z.string().nullish(),
})

export const StudentFeesResponseSchema = z.object({
  academic_year: z.string(),
  total_expected: z.number(),
  total_paid: z.number(),
  total_remaining: z.number(),
  fees: z.array(StudentFeeItemSchema),
})

// Bulletins publiés
export const StudentBulletinSchema = z.object({
  id: z.number(),
  trimester: z.string(),
  academic_year: z.string(),
  general_average: z.number().nullable(),
  rank: z.number().nullable(),
  total_students: z.number(),
  status: z.enum(["brouillon", "publie"]),
  published_at: z.string().nullish(),
})

export type StudentNextCourse = z.infer<typeof StudentNextCourseSchema>
export type StudentDashboard = z.infer<typeof StudentDashboardSchema>
export type StudentGradeEntry = z.infer<typeof StudentGradeEntrySchema>
export type StudentSubjectGrades = z.infer<typeof StudentSubjectGradesSchema>
export type StudentGradesResponse = z.infer<typeof StudentGradesResponseSchema>
export type StudentFeeItem = z.infer<typeof StudentFeeItemSchema>
export type StudentFeesResponse = z.infer<typeof StudentFeesResponseSchema>
export type StudentBulletin = z.infer<typeof StudentBulletinSchema>

// Historique de présence
export const StudentAttendanceRecordSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  status: z.string(),
  time_in: z.string().nullable(),
  time_out: z.string().nullable(),
  source: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const StudentAttendanceResponseSchema = z.object({
  items: z.array(StudentAttendanceRecordSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
})

export type StudentAttendanceRecord = z.infer<typeof StudentAttendanceRecordSchema>
export type StudentAttendanceResponse = z.infer<typeof StudentAttendanceResponseSchema>
