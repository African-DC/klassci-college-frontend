import { z } from "zod"
import { EvaluationTypeSchema } from "./grade"

// Contrats pour le portail enseignant — endpoints /teacher/*

// Prochain cours de l'enseignant
export const TeacherNextCourseSchema = z.object({
  subject_name: z.string(),
  class_name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  room: z.string().nullish(),
})

// Classe assignée à l'enseignant
export const TeacherClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  level: z.string(),
  student_count: z.number(),
  subject_name: z.string(),
  general_average: z.number().nullable(),
  total_evaluations: z.number(),
})

// Évaluation à venir
export const TeacherUpcomingEvalSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: EvaluationTypeSchema,
  date: z.string(),
  class_name: z.string(),
  subject_name: z.string(),
  graded_students: z.number(),
  total_students: z.number(),
})

// Dashboard enseignant
export const TeacherDashboardSchema = z.object({
  teacher_name: z.string(),
  total_students: z.number(),
  total_classes: z.number(),
  next_course: TeacherNextCourseSchema.nullable(),
  upcoming_evaluations: z.array(TeacherUpcomingEvalSchema),
})

export type TeacherNextCourse = z.infer<typeof TeacherNextCourseSchema>
export type TeacherClass = z.infer<typeof TeacherClassSchema>
export type TeacherUpcomingEval = z.infer<typeof TeacherUpcomingEvalSchema>
export type TeacherDashboard = z.infer<typeof TeacherDashboardSchema>
