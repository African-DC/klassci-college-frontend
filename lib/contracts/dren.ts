import { z } from "zod"

// Miroir de app/schemas/dren.py (backend)
// Statistiques agregees pour la Direction Regionale de l'Education Nationale

export const ClassStatsSchema = z.object({
  class_id: z.number(),
  class_name: z.string(),
  total_students: z.number(),
  male_count: z.number(),
  female_count: z.number(),
})

export const LevelStatsSchema = z.object({
  level_id: z.number(),
  level_name: z.string(),
  total_students: z.number(),
  male_count: z.number(),
  female_count: z.number(),
  classes: z.array(ClassStatsSchema),
})

export const SubjectStatsSchema = z.object({
  subject_id: z.number(),
  subject_name: z.string(),
  overall_average: z.coerce.number(),
  teacher_count: z.number(),
})

export const DrenStatsSchema = z.object({
  academic_year_id: z.number(),
  academic_year_name: z.string(),
  total_students: z.number(),
  male_count: z.number(),
  female_count: z.number(),
  success_rate: z.number(),
  failure_rate: z.number(),
  redoublement_rate: z.number(),
  exclusion_rate: z.number(),
  levels: z.array(LevelStatsSchema),
  subjects: z.array(SubjectStatsSchema),
})

export type ClassStats = z.infer<typeof ClassStatsSchema>
export type LevelStats = z.infer<typeof LevelStatsSchema>
export type SubjectStats = z.infer<typeof SubjectStatsSchema>
export type DrenStats = z.infer<typeof DrenStatsSchema>
