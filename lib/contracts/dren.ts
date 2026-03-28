import { z } from "zod"

// Miroir de app/schemas/dren.py (backend)
// Statistiques agrégées pour la Direction Régionale de l'Éducation Nationale

export const LevelStatsSchema = z.object({
  level: z.string(),
  total_students: z.number(),
  male_count: z.number(),
  female_count: z.number(),
  success_count: z.number(),
  fail_count: z.number(),
  success_rate: z.number(),
  average: z.number().nullable(),
})

export const GenderDistributionSchema = z.object({
  level: z.string(),
  male: z.number(),
  female: z.number(),
})

export const SuccessRateByLevelSchema = z.object({
  level: z.string(),
  rate: z.number(),
})

export const DrenStatsSchema = z.object({
  academic_year_id: z.number(),
  academic_year_label: z.string(),
  total_students: z.number(),
  total_male: z.number(),
  total_female: z.number(),
  overall_success_rate: z.number(),
  overall_average: z.number().nullable(),
  levels: z.array(LevelStatsSchema),
  gender_distribution: z.array(GenderDistributionSchema),
  success_rates: z.array(SuccessRateByLevelSchema),
})

export type LevelStats = z.infer<typeof LevelStatsSchema>
export type GenderDistribution = z.infer<typeof GenderDistributionSchema>
export type SuccessRateByLevel = z.infer<typeof SuccessRateByLevelSchema>
export type DrenStats = z.infer<typeof DrenStatsSchema>
