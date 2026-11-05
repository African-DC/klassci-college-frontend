import { z } from "zod"

// Miroir de app/schemas/dren.py (backend)
// Statistiques agregees pour la Direction Regionale de l'Education Nationale

export const ClassStatsSchema = z.object({
  class_id: z.number(),
  class_name: z.string(),
  total_students: z.number(),
  male_count: z.number(),
  female_count: z.number(),
  unspecified_count: z.number().default(0),
  average: z.coerce.number().nullable().optional(),
})

export const LevelStatsSchema = z.object({
  level_id: z.number(),
  level_name: z.string(),
  total_students: z.number(),
  male_count: z.number(),
  female_count: z.number(),
  unspecified_count: z.number().default(0),
  // Taux du niveau, sur le même trimestre que celui de l'établissement.
  // Absent quand le niveau n'a encore aucun bulletin : ce n'est pas 0 %.
  success_rate: z.number().nullable().optional(),
  classes: z.array(ClassStatsSchema),
})

export const SubjectStatsSchema = z.object({
  subject_id: z.number(),
  subject_name: z.string(),
  overall_average: z.coerce.number().nullable().optional(),
  teacher_count: z.number(),
})

export const DrenStatsSchema = z.object({
  academic_year_id: z.number(),
  academic_year_name: z.string(),
  total_students: z.number(),
  male_count: z.number(),
  female_count: z.number(),
  unspecified_count: z.number().default(0),
  success_rate: z.number().nullable().optional(),
  failure_rate: z.number().nullable().optional(),
  redoublement_rate: z.number().nullable().optional(),
  exclusion_rate: z.number().nullable().optional(),
  levels: z.array(LevelStatsSchema),
  subjects: z.array(SubjectStatsSchema),
})

export type ClassStats = z.infer<typeof ClassStatsSchema>
export type LevelStats = z.infer<typeof LevelStatsSchema>
export type SubjectStats = z.infer<typeof SubjectStatsSchema>
export type DrenStats = z.infer<typeof DrenStatsSchema>
